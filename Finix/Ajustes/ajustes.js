// ============================================
// ajustes.js — Perfil + QR Bre-B (payload) + Generar QR de pago
// ============================================

// ============================================
// CARGAR PERFIL Y PAYLOAD QR BRE-B
// ============================================
async function cargarPerfil() {
  // Pintar lo que haya en localStorage primero (rápido)
  const nombreLocal = localStorage.getItem("nombreUsuario") || "Name";
  const emailLocal  = localStorage.getItem("emailUsuario")  || "usuario@finix.com";
  pintarPerfil(nombreLocal, emailLocal);

  // Traer perfil desde Supabase
  const perfil = await dbObtenerPerfil();

  const nombre = perfil?.full_name || nombreLocal;
  const email  = perfil?.email     || emailLocal;
  pintarPerfil(nombre, email);

  // Payload QR Bre-B guardado (en columna llave_bre_b)
  const payload = perfil?.llave_bre_b;
  pintarPayload(payload);
}

function pintarPerfil(nombre, email) {
  const elNombre  = document.getElementById("perfilNombre");
  const elEmail   = document.getElementById("perfilEmail");
  const elInicial = document.getElementById("perfilInicial");

  if (elNombre)  elNombre.textContent  = nombre;
  if (elEmail)   elEmail.textContent   = email;
  if (elInicial) elInicial.textContent = (nombre || "N").charAt(0).toUpperCase();
}

function pintarPayload(payload) {
  const input  = document.getElementById("inputLlaveBreB");
  const estado = document.getElementById("brebEstado");
  if (!input) return;

  if (payload) {
    input.value = payload;
    input.placeholder = "";
    if (estado) {
      estado.textContent = "✓ QR Bre-B configurado en tu cuenta";
      estado.className = "breb-estado exito";
      estado.style.color = "#185540";
    }
  } else {
    input.value = "";
    input.placeholder = "No tienes QR Bre-B configurado";
    if (estado) {
      estado.textContent = "Pega el contenido de tu QR y pulsa Guardar QR";
      estado.className = "breb-estado error";
      estado.style.color = "#D80202";
    }
  }
}

// ============================================
// GUARDAR PAYLOAD QR BRE-B
// ============================================
async function guardarQRBreB() {
  const input  = document.getElementById("inputLlaveBreB");
  const estado = document.getElementById("brebEstado");
  const raw    = (input?.value || "").trim();

  if (!raw) {
    estado.textContent = "❌ Pega primero el contenido del QR.";
    estado.style.color = "#D80202";
    return;
  }

  if (typeof validarPayloadEMVCo !== "function") {
    estado.textContent = "❌ Error interno: falta breb-qr.js";
    estado.style.color = "#D80202";
    return;
  }

  // Limpiar solo espacios/saltos/tabs (no tocar letras ni puntos)
  const limpio = raw.replace(/\s+/g, "");

  const validacion = validarPayloadEMVCo(limpio);
  if (!validacion.valido) {
    estado.textContent = "❌ " + validacion.error;
    estado.style.color = "#D80202";
    return;
  }

  const ok = await dbGuardarPayloadBreB(validacion.payload);
  if (ok) {
    input.value = validacion.payload;
    estado.textContent = "✅ QR guardado correctamente.";
    estado.style.color = "#185540";
  } else {
    estado.textContent = "❌ No se pudo guardar. Intenta de nuevo.";
    estado.style.color = "#D80202";
  }
}

function limpiarQRBreB() {
  const input  = document.getElementById("inputLlaveBreB");
  const estado = document.getElementById("brebEstado");
  if (input)  input.value = "";
  if (estado) {
    estado.textContent = "";
    estado.style.color = "";
  }
}

// ============================================
// MARCAR NAVEGACIÓN ACTIVA
// ============================================
function marcarActivo() {
  const paginaActual = window.location.pathname.split("/").pop() || "ajustes.html";
  const enlaces = document.querySelectorAll(".bottom-nav a");

  enlaces.forEach((enlace) => {
    const dataPage = enlace.getAttribute("data-page");
    if (dataPage === paginaActual) {
      enlace.classList.add("active");
    } else {
      enlace.classList.remove("active");
    }
  });
}

// ============================================
// UTILIDADES
// ============================================
function formatearMonto(valor) {
  const numero = Number(valor) || 0;
  return "$" + numero.toLocaleString("es-CO");
}

// ============================================
// FORMATEO DE MONTO EN VIVO (modal QR)
// ============================================
function inicializarFormateoMontoModal() {
  const input = document.getElementById("inputMontoAbono");
  if (!input) return;

  input.addEventListener("input", () => {
    let v = input.value.replace(/\D/g, "");
    if (v.length > 15) v = v.slice(0, 15);
    input.value = v ? Number(v).toLocaleString("es-CO") : "";
  });
}

function leerMontoModal() {
  const input = document.getElementById("inputMontoAbono");
  if (!input) return 0;
  const limpio = input.value.replace(/\D/g, "");
  return Number(limpio) || 0;
}

// ============================================
// MODAL QR
// ============================================
function abrirModalQR() {
  const modal = document.getElementById("modalAbono");
  if (!modal) return;

  const inputMonto = document.getElementById("inputMontoAbono");
  if (inputMonto) inputMonto.value = "";

  const contQR = document.getElementById("qrCanvas");
  if (contQR) contQR.innerHTML = "";

  const qrContainer = document.getElementById("qrContainer");
  if (qrContainer) qrContainer.style.display = "none";

  modal.classList.add("activo");
  document.body.style.overflow = "hidden";
}

function cerrarModalQR() {
  const modal = document.getElementById("modalAbono");
  if (modal) modal.classList.remove("activo");
  document.body.style.overflow = "";
}

// ============================================
// GENERAR QR DE PAGO
// ============================================
async function generarQRModal() {
  const monto = leerMontoModal();

  if (monto <= 0) {
    alert("Ingresa un monto válido");
    return;
  }

  const perfil = await dbObtenerPerfil();
  const payloadBase = perfil?.llave_bre_b;

  if (!payloadBase) {
    alert("No tienes un QR Bre-B configurado. Pégalo arriba y pulsa Guardar QR.");
    return;
  }

  const validacion = validarPayloadEMVCo(payloadBase);
  if (!validacion.valido) {
    alert("Tu QR Bre-B guardado es inválido: " + validacion.error);
    return;
  }

  let payload;
  try {
    payload = generarPayloadBreB(validacion.payload, monto);
  } catch (err) {
    console.error("Error generando payload Bre-B:", err);
    alert("No se pudo generar el QR: " + err.message);
    return;
  }

  const contenedorQR = document.getElementById("qrCanvas");
  contenedorQR.innerHTML = "";

  const TAMANO_QR = 465;

  new QRCode(contenedorQR, {
    text: payload,
    width: TAMANO_QR,
    height: TAMANO_QR,
    colorDark: "#000000",
    colorLight: "#FFFFFF",
    correctLevel: QRCode.CorrectLevel.M
  });

  const canvasGenerado = contenedorQR.querySelector("canvas");
  if (canvasGenerado) {
    canvasGenerado.style.width = "100%";
    canvasGenerado.style.height = "auto";
    canvasGenerado.style.maxWidth = TAMANO_QR + "px";
    canvasGenerado.style.imageRendering = "pixelated";
    canvasGenerado.style.display = "block";
    canvasGenerado.style.margin = "0 auto";
    canvasGenerado.style.background = "#FFFFFF";
    canvasGenerado.style.padding = "16px";
    canvasGenerado.style.boxSizing = "content-box";
    canvasGenerado.style.borderRadius = "12px";
  }

  const imgGenerada = contenedorQR.querySelector("img");
  if (imgGenerada) {
    imgGenerada.style.width = "100%";
    imgGenerada.style.height = "auto";
    imgGenerada.style.maxWidth = TAMANO_QR + "px";
    imgGenerada.style.imageRendering = "pixelated";
    imgGenerada.style.display = "block";
    imgGenerada.style.margin = "0 auto";
    imgGenerada.style.background = "#FFFFFF";
    imgGenerada.style.padding = "16px";
    imgGenerada.style.boxSizing = "content-box";
    imgGenerada.style.borderRadius = "12px";
  }

  document.getElementById("qrContainer").style.display = "block";

  try {
    await dbCrearAbono({
      registro_id: null,
      monto,
      llave_bre_b: payloadBase,
      payload_qr: payload,
    });
  } catch (e) {
    console.warn("No se pudo guardar el abono:", e);
  }
}

function inicializarModalQR() {
  const modal = document.getElementById("modalAbono");
  if (!modal) return;

  const btnCerrar   = document.getElementById("btnCerrarAbono");
  const btnCancelar = document.getElementById("btnCancelarAbono");
  const btnGenerar  = document.getElementById("btnGenerarQRModal");

  if (btnCerrar)   btnCerrar.onclick   = cerrarModalQR;
  if (btnCancelar) btnCancelar.onclick = cerrarModalQR;
  if (btnGenerar)  btnGenerar.onclick  = generarQRModal;

  modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrarModalQR();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("activo")) {
      cerrarModalQR();
    }
  });
}

// ============================================
// INICIALIZAR TODO
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  // Tema
  const temaGuardado = localStorage.getItem("finix_tema");
  if (temaGuardado === "oscuro") {
    document.body.classList.add("dark-mode");
  }

  // UI primero
  marcarActivo();
  inicializarFormateoMontoModal();
  inicializarModalQR();

  // Botones QR Bre-B
  const btnGuardarQR = document.getElementById("btnGuardarQR");
  if (btnGuardarQR) btnGuardarQR.addEventListener("click", guardarQRBreB);

  const btnLimpiarQR = document.getElementById("btnLimpiarQR");
  if (btnLimpiarQR) btnLimpiarQR.addEventListener("click", limpiarQRBreB);

  // Botón abrir modal QR de pago
  const btnGenerarQR = document.getElementById("btnGenerarQR");
  if (btnGenerarQR) btnGenerarQR.addEventListener("click", abrirModalQR);

  // Perfil + payload QR Bre-B
  await cargarPerfil();
});