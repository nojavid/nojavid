// ============================================
// ajustes.js — Perfil + QR Bre-B + Plataformas + Cerrar Sesión (modal)
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
// MODAL CERRAR SESIÓN
// ============================================
function mostrarModalCerrar() {
  const modal = document.getElementById("modalCerrarSesion");
  if (!modal) return;
  modal.classList.add("activo");
  document.body.style.overflow = "hidden";
}

function ocultarModalCerrar() {
  const modal = document.getElementById("modalCerrarSesion");
  if (!modal) return;
  modal.classList.remove("activo");
  document.body.style.overflow = "";
}

async function ejecutarCerrarSesion() {
  // 1. Cerrar sesión en Supabase (si está disponible)
  try {
    if (typeof supabaseClient !== "undefined" && supabaseClient) {
      await supabaseClient.auth.signOut();
      console.log("✅ Sesión cerrada en Supabase");
    }
  } catch (e) {
    console.warn("⚠️ Error cerrando sesión en Supabase:", e);
  }

  // 2. Limpiar TODO el localStorage relacionado con la sesión
  try {
    localStorage.removeItem("finix_user");
    localStorage.removeItem("nombreUsuario");
    localStorage.removeItem("emailUsuario");
    localStorage.removeItem("finix_usuario");
  } catch (e) {
    console.warn("⚠️ Error limpiando localStorage:", e);
  }

  // 3. Redirigir al login (está en la raíz, un nivel arriba de Ajustes)
  window.location.href = "../Login.html";
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

  // ----- Modal Cerrar Sesión -----
  const btnCerrarSesion     = document.getElementById("btnCerrarSesion");
  const modalCerrar         = document.getElementById("modalCerrarSesion");
  const btnCancelarCerrar   = document.getElementById("btnCancelarCerrar");
  const btnConfirmarCerrar  = document.getElementById("btnConfirmarCerrar");

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", mostrarModalCerrar);
  }

  if (btnCancelarCerrar) {
    btnCancelarCerrar.addEventListener("click", ocultarModalCerrar);
  }

  if (btnConfirmarCerrar) {
    btnConfirmarCerrar.addEventListener("click", async () => {
      await ejecutarCerrarSesion();
    });
  }

  // Cerrar el modal al hacer clic fuera de la tarjeta
  if (modalCerrar) {
    modalCerrar.addEventListener("click", (e) => {
      if (e.target === modalCerrar) ocultarModalCerrar();
    });
  }

  // Cerrar el modal con la tecla Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalCerrar?.classList.contains("activo")) {
      ocultarModalCerrar();
    }
  });

  // Perfil + payload QR Bre-B
  await cargarPerfil();
});