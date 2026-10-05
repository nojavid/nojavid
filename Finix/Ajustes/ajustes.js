// ============================================
// CARGAR PERFIL Y LLAVE BRE-B (igual que billetera.js)
// ============================================
async function cargarPerfil() {
  // Pintar lo que haya en localStorage primero (rápido)
  const nombreLocal = localStorage.getItem("nombreUsuario") || "Name";
  const emailLocal  = localStorage.getItem("emailUsuario")  || "usuario@finix.com";
  pintarPerfil(nombreLocal, emailLocal);

  // Traer perfil desde Supabase (igual que billetera.js)
  const perfil = await dbObtenerPerfil();

  const nombre = perfil?.full_name || nombreLocal;
  const email  = perfil?.email     || emailLocal;
  pintarPerfil(nombre, email);

  // LLAVE BRE-B — exactamente como en billetera.js
  const llave = perfil?.llave_bre_b;
  pintarLlave(llave);
}

function pintarPerfil(nombre, email) {
  const elNombre  = document.getElementById("perfilNombre");
  const elEmail   = document.getElementById("perfilEmail");
  const elInicial = document.getElementById("perfilInicial");

  if (elNombre)  elNombre.textContent  = nombre;
  if (elEmail)   elEmail.textContent   = email;
  if (elInicial) elInicial.textContent = nombre.charAt(0).toUpperCase();
}

function pintarLlave(llave) {
  const input  = document.getElementById("inputLlaveBreB");
  const estado = document.getElementById("brebEstado");
  if (!input) return;

  if (llave) {
    input.value = llave;
    input.placeholder = "";
    if (estado) {
      estado.textContent = "✓ Llave configurada en tu cuenta";
      estado.className = "breb-estado exito";
    }
  } else {
    input.value = "";
    input.placeholder = "No tienes llave configurada";
    if (estado) {
      estado.textContent = "Ve a Configuración para agregar tu llave Bre-B";
      estado.className = "breb-estado error";
    }
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
// COPIAR LLAVE BRE-B
// ============================================
async function copiarLlaveBreB() {
  const input = document.getElementById("inputLlaveBreB");
  const llave = input?.value?.trim();

  if (!llave) {
    alert("No hay llave para copiar");
    return;
  }

  try {
    await navigator.clipboard.writeText(llave);
    const estado = document.getElementById("brebEstado");
    if (estado) {
      estado.textContent = "📋 Llave copiada al portapapeles";
      estado.className = "breb-estado exito";
      setTimeout(() => {
        estado.textContent = "✓ Llave configurada en tu cuenta";
      }, 2000);
    }
  } catch (error) {
    input.select();
    document.execCommand("copy");
  }
}

// ============================================
// MODAL QR — IGUAL QUE billetera.js
// ============================================
function abrirModalQR() {
  const modal = document.getElementById("modalAbono");
  if (!modal) return;

  // Limpiar monto y QR previo (igual que abrirModalAbono en billetera.js)
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
// GENERAR QR — EXACTAMENTE COMO generarQRAbono() DE billetera.js
// ============================================
async function generarQRModal() {
  const monto = leerMontoModal();

  if (monto <= 0) {
    alert("Ingresa un monto válido");
    return;
  }

  // IGUAL QUE EN billetera.js: leer la llave desde Supabase
  const perfil = await dbObtenerPerfil();
  const llave = perfil?.llave_bre_b;

  if (!llave) {
    alert("No tienes una llave Bre-B configurada. Ve a Configuración y agrégala.");
    return;
  }

  const payload = generarPayloadBreB(llave, monto);

  // qrcodejs inyecta su propio <canvas> dentro del contenedor
  const contenedorQR = document.getElementById("qrCanvas");
  contenedorQR.innerHTML = "";

  new QRCode(contenedorQR, {
    text: payload,
    width: 240,
    height: 240,
    colorDark: "#000000",
    colorLight: "#FFFFFF",
    correctLevel: QRCode.CorrectLevel.M
  });

  document.getElementById("qrContainer").style.display = "block";

  // Guardar abono en Supabase (igual que billetera.js)
  await dbCrearAbono({
    registro_id: null,
    monto,
    llave_bre_b: llave,
    payload_qr: payload,
  });
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

  // Botones
  const btnCopiarLlave = document.getElementById("btnCopiarLlave");
  if (btnCopiarLlave) btnCopiarLlave.addEventListener("click", copiarLlaveBreB);

  const btnGenerarQR = document.getElementById("btnGenerarQR");
  if (btnGenerarQR) btnGenerarQR.addEventListener("click", abrirModalQR);

  // Perfil + llave (igual que billetera.js)
  await cargarPerfil();
});