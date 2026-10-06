// ============================================
// ajustes.js — Perfil + QR Bre-B (payload) + Plataformas
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
// IR A PLATAFORMAS
// ============================================
function irAPlataformas() {
  window.location.href = "../Plataformas/Plataforma.html";
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

  // Botones QR Bre-B
  const btnGuardarQR = document.getElementById("btnGuardarQR");
  if (btnGuardarQR) btnGuardarQR.addEventListener("click", guardarQRBreB);

  const btnLimpiarQR = document.getElementById("btnLimpiarQR");
  if (btnLimpiarQR) btnLimpiarQR.addEventListener("click", limpiarQRBreB);

  // Botón Plataformas
  const btnPlataformas = document.getElementById("btnPlataformas");
  if (btnPlataformas) btnPlataformas.addEventListener("click", irAPlataformas);

  // Perfil + payload QR Bre-B
  await cargarPerfil();
});