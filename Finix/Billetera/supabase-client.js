// ============================================
// CLIENTE DE SUPABASE - FINIX
// ============================================

const SUPABASE_URL      = "https://dfhmekwkhsxvjuojuruv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_TxNdB8vq6tv0c12IWJ8GwQ_zCoUN4v8";

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// USUARIO ACTUAL
// ============================================
async function obtenerUsuarioActual() {
  const { data: { user }, error } = await supabaseClient.auth.getUser();
  if (error || !user) {
    console.warn("No hay sesión activa");
    return null;
  }
  return user;
}

// ============================================
// CONVERSIÓN snake_case → camelCase
// ============================================
function mapRegistro(r) {
  return {
    id:              r.id,
    seccion:         r.seccion,
    nombreSeccion:   r.nombre_seccion,
    colorSeccion:    r.color_seccion,
    iconoSeccion:    r.icono_seccion,
    nombre:          r.nombre,
    monto:           Number(r.monto) || 0,
    // 👇 AQUÍ ESTABA EL BUG — estas dos líneas faltaban
    montoTotal:      r.monto_total  != null ? Number(r.monto_total)  : null,
    montoPagado:     r.monto_pagado != null ? Number(r.monto_pagado) : 0,
    // 👆 AQUÍ ESTABA EL BUG
    fecha:           r.fecha,
    recordatorio:    r.recordatorio,
    diaRecordatorio: r.dia_recordatorio,
  };
}

// ============================================
// CONVERSIÓN camelCase → snake_case
// ============================================
function mapRegistroToDB(registro) {
  const payload = {};

  if (registro.seccion         !== undefined) payload.seccion          = registro.seccion;
  if (registro.nombreSeccion   !== undefined) payload.nombre_seccion   = registro.nombreSeccion;
  if (registro.colorSeccion    !== undefined) payload.color_seccion    = registro.colorSeccion;
  if (registro.iconoSeccion    !== undefined) payload.icono_seccion    = registro.iconoSeccion;
  if (registro.nombre          !== undefined) payload.nombre           = registro.nombre;
  if (registro.monto           !== undefined) payload.monto            = registro.monto;
  if (registro.montoTotal      !== undefined) payload.monto_total      = registro.montoTotal  != null ? registro.montoTotal  : null;
  if (registro.montoPagado     !== undefined) payload.monto_pagado     = registro.montoPagado != null ? registro.montoPagado : 0;
  if (registro.fecha           !== undefined) payload.fecha            = registro.fecha;
  if (registro.recordatorio    !== undefined) payload.recordatorio     = registro.recordatorio;
  if (registro.diaRecordatorio !== undefined) payload.dia_recordatorio = registro.diaRecordatorio;

  return payload;
}

// ============================================
// CRUD — REGISTROS
// ============================================
async function dbObtenerRegistros() {
  const user = await obtenerUsuarioActual();
  if (!user) return [];

  const { data, error } = await supabaseClient
    .from("registros")
    .select("*")
    .eq("user_id", user.id)
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("Error obteniendo registros:", error);
    return [];
  }
  return (data || []).map(mapRegistro);
}

async function dbCrearRegistro(registro) {
  const user = await obtenerUsuarioActual();
  if (!user) {
    alert("Debes iniciar sesión para guardar registros.");
    return null;
  }

  const payload = mapRegistroToDB(registro);
  payload.user_id = user.id;

  const { data, error } = await supabaseClient
    .from("registros")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Error creando registro:", error);
    return null;
  }
  return mapRegistro(data);
}

// ============================================
// ACTUALIZAR REGISTRO CON DETECCIÓN DE RLS
// ============================================
async function dbActualizarRegistro(id, cambios) {
  if (!id) {
    console.error("dbActualizarRegistro: falta el id");
    return null;
  }

  const esCamelCase =
    "diaRecordatorio" in cambios ||
    "montoTotal"      in cambios ||
    "montoPagado"     in cambios ||
    "nombreSeccion"   in cambios ||
    "colorSeccion"    in cambios ||
    "iconoSeccion"    in cambios;

  const payload = esCamelCase ? mapRegistroToDB(cambios) : cambios;

  console.log("🟠 dbActualizarRegistro → id:", id, "payload:", payload);

  const { data, error } = await supabaseClient
    .from("registros")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("❌ Error actualizando registro:", error);
    alert("Error al guardar: " + error.message);
    return null;
  }

  // 🔍 DETECCIÓN DE FALLO SILENCIOSO POR RLS
  let algunCampoNoActualizado = false;
  const camposFallidos = [];

  for (const key of Object.keys(payload)) {
    const valorEnviado  = payload[key];
    const valorRecibido = data[key];

    const enviadoNum  = valorEnviado === null ? null : Number(valorEnviado);
    const recibidoNum = valorRecibido === null ? null : Number(valorRecibido);

    const sonIguales = (valorEnviado === valorRecibido) ||
                       (enviadoNum !== null && recibidoNum !== null && enviadoNum === recibidoNum);

    if (!sonIguales) {
      algunCampoNoActualizado = true;
      camposFallidos.push({
        campo: key,
        enviado: valorEnviado,
        recibido: valorRecibido,
      });
    }
  }

  if (algunCampoNoActualizado) {
    console.error("🚨 RLS bloqueó el UPDATE silenciosamente.");
    console.error("Campos que NO se actualizaron:", camposFallidos);
    alert(
      "No se pudo guardar el cambio.\n\n" +
      "Causa probable: falta la política RLS de UPDATE en Supabase."
    );
    return null;
  }

  console.log("🟠 dbActualizarRegistro → data:", data);
  return mapRegistro(data);
}

async function dbEliminarRegistro(id) {
  if (!id) {
    console.error("dbEliminarRegistro: falta el id");
    return false;
  }

  const { error } = await supabaseClient
    .from("registros")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error eliminando registro:", error);
    return false;
  }
  return true;
}

// ============================================
// PERFIL DEL USUARIO
// ============================================
async function dbObtenerPerfil() {
  const user = await obtenerUsuarioActual();
  if (!user) return null;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error obteniendo perfil:", error);
    return null;
  }
  return data;
}

// ============================================
// GUARDAR PAYLOAD QR BRE-B EN EL PERFIL
// ============================================
async function dbGuardarPayloadBreB(payload) {
  const user = await obtenerUsuarioActual();
  if (!user) return false;

  const { error } = await supabaseClient
    .from("profiles")
    .update({ llave_bre_b: payload })
    .eq("id", user.id);

  if (error) {
    console.error("Error guardando payload Bre-B:", error);
    return false;
  }
  return true;
}

// Alias para compatibilidad con código anterior
const dbGuardarLlaveBreB = dbGuardarPayloadBreB;

// ============================================
// ABONOS
// ============================================
async function dbCrearAbono(abono) {
  const user = await obtenerUsuarioActual();
  if (!user) return null;

  const { data, error } = await supabaseClient
    .from("abonos")
    .insert({
      user_id: user.id,
      registro_id: abono.registro_id || null,
      monto: abono.monto,
      llave_bre_b: abono.llave_bre_b || null,
      payload_qr: abono.payload_qr || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creando abono:", error);
    return null;
  }
  return data;
}

async function dbObtenerAbonos() {
  const user = await obtenerUsuarioActual();
  if (!user) return [];

  const { data, error } = await supabaseClient
    .from("abonos")
    .select("*")
    .eq("user_id", user.id)
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("Error obteniendo abonos:", error);
    return [];
  }
  return data || [];
}

async function dbObtenerAbonosPorRegistro(registroId) {
  if (!registroId) return [];

  const user = await obtenerUsuarioActual();
  if (!user) return [];

  const { data, error } = await supabaseClient
    .from("abonos")
    .select("*")
    .eq("user_id", user.id)
    .eq("registro_id", registroId)
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("Error obteniendo abonos del registro:", error);
    return [];
  }
  return data || [];
}

async function dbTotalAbonadoPorRegistro(registroId) {
  const abonos = await dbObtenerAbonosPorRegistro(registroId);
  return abonos.reduce((sum, a) => sum + (Number(a.monto) || 0), 0);
}

// ============================================
// OBTENER TODOS LOS ABONOS DEL USUARIO (NUEVO)
// ============================================
// Esta función trae TODOS los abonos del usuario de una sola vez,
// para que billetera.js los sume y actualice las barras de progreso
// de TODAS las secciones (deudas, ahorro, personalizadas).
async function dbObtenerTodosLosAbonos() {
  const user = await obtenerUsuarioActual();
  if (!user) return [];

  const { data, error } = await supabaseClient
    .from("abonos")
    .select("registro_id, monto")
    .eq("user_id", user.id);

  if (error) {
    console.error("Error obteniendo todos los abonos:", error);
    return [];
  }
  return data || [];
}