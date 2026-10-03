// ============================================
// CLIENTE DE SUPABASE - FINIX
// ============================================

const SUPABASE_URL      = "https://dfhmekwkhsxvjuojuruv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_TxNdB8vq6tv0c12IWJ8GwQ_zCoUN4v8"; // 👈 PEGA AQUÍ TU CLAVE COMPLETA

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
    nombre:          r.nombre,
    monto:           Number(r.monto) || 0,
    montoTotal:      r.monto_total  ? Number(r.monto_total)  : null,
    montoPagado:     r.monto_pagado ? Number(r.monto_pagado) : null,
    fecha:           r.fecha,
    recordatorio:    r.recordatorio,
    diaRecordatorio: r.dia_recordatorio,
  };
}

// ============================================
// CRUD
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

  const { data, error } = await supabaseClient
    .from("registros")
    .insert({
      user_id:          user.id,
      seccion:          registro.seccion,
      nombre_seccion:   registro.nombreSeccion,
      color_seccion:    registro.colorSeccion,
      nombre:           registro.nombre,
      monto:            registro.monto,
      monto_total:      registro.montoTotal  || null,
      monto_pagado:     registro.montoPagado || null,
      fecha:            registro.fecha,
      recordatorio:     registro.recordatorio,
      dia_recordatorio: registro.diaRecordatorio,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creando registro:", error);
    return null;
  }
  return mapRegistro(data);
}

async function dbActualizarRegistro(id, cambios) {
  const { data, error } = await supabaseClient
    .from("registros")
    .update(cambios)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error actualizando registro:", error);
    return null;
  }
  return mapRegistro(data);
}

async function dbEliminarRegistro(id) {
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