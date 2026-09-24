// ============================================
// FECHA ACTUAL EN FORMATO: Mes de Año
// ============================================
function actualizarFecha() {
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                 "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const hoy = new Date();
  const mes = meses[hoy.getMonth()];
  const anio = hoy.getFullYear();
  document.getElementById("fechaActual").textContent = `${mes} de ${anio}`;
}

// ============================================
// NOMBRE DEL USUARIO
// ============================================
function cargarNombre() {
  const nombre = localStorage.getItem("nombreUsuario") || "Name";
  document.getElementById("nombreUsuario").textContent = nombre;
}

// ============================================
// MARCAR ÍCONO ACTIVO EN LA BARRA INFERIOR
// ============================================
function marcarActivo() {
  const paginaActual = window.location.pathname.split("/").pop() || "billetera.html";
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
// SISTEMA DE REGISTROS (localStorage)
// ============================================
const STORAGE_KEY = "finix_registros";

function obtenerRegistros() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function guardarRegistros(registros) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(registros));
}

// ============================================
// FORMATEAR MONTO
// ============================================
function formatearMonto(valor) {
  const numero = Number(valor) || 0;
  return "$" + numero.toLocaleString("es-CO");
}

// ============================================
// CALCULAR PORCENTAJE (para barra de progreso)
// ============================================
function calcularPorcentaje(registro) {
  if (registro.montoTotal && registro.montoPagado) {
    return Math.min(100, Math.round((registro.montoPagado / registro.montoTotal) * 100));
  }
  return 0;
}

// ============================================
// FORMATEAR FECHA (dd Mmm)
// ============================================
function formatearFecha(fechaISO) {
  if (!fechaISO) return "Sin fecha";
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                 "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const fecha = new Date(fechaISO + "T00:00:00");
  const dia = fecha.getDate();
  const mes = meses[fecha.getMonth()];
  return `${dia} ${mes}`;
}

// ============================================
// RENDERIZAR LISTA DE DEUDAS
// ============================================
function renderizarDeudas() {
  const lista = document.getElementById("deudasLista");
  if (!lista) return;

  const registros = obtenerRegistros().filter(r => r.seccion === "deudas");
  lista.innerHTML = "";

  if (registros.length === 0) {
    lista.innerHTML = `
      <div class="deuda-item-vacio" style="text-align:center; padding:12px; font-size:10px; color:#69747A;">
        No hay deudas registradas
      </div>
    `;
    return;
  }

  registros.forEach((registro) => {
    const porcentaje = calcularPorcentaje(registro);
    const item = document.createElement("div");
    item.className = "deuda-item";
    item.innerHTML = `
      <div class="deuda-item-header">
        <div class="deuda-item-circulo">
          <img src="../iconos/tarjeta.png" alt="tarjeta" class="deuda-item-icono">
        </div>
        <h4 class="deuda-item-nombre">${registro.nombre}</h4>
      </div>
      <p class="deuda-item-fecha">Vence ${formatearFecha(registro.fecha)}</p>
      <div class="deuda-progreso-container">
        <div class="deuda-progreso-barra">
          <div class="deuda-progreso-relleno" style="width: ${porcentaje}%;"></div>
        </div>
        <span class="deuda-progreso-texto">${porcentaje}%</span>
      </div>
    `;
    lista.appendChild(item);
  });
}

// ============================================
// RENDERIZAR LISTA DE METAS
// ============================================
function renderizarMetas() {
  const lista = document.getElementById("metasLista");
  if (!lista) return;

  const registros = obtenerRegistros().filter(r => r.seccion === "ahorro");
  lista.innerHTML = "";

  if (registros.length === 0) {
    lista.innerHTML = `
      <div class="meta-item-vacio" style="text-align:center; padding:12px; font-size:10px; color:#69747A;">
        No hay metas registradas
      </div>
    `;
    return;
  }

  registros.forEach((registro) => {
    const porcentaje = calcularPorcentaje(registro);
    const item = document.createElement("div");
    item.className = "meta-item";
    item.innerHTML = `
      <div class="meta-item-header">
        <div class="meta-item-circulo">
          <img src="../iconos/Meta.png" alt="meta" class="meta-item-icono">
        </div>
        <h4 class="meta-item-nombre">${registro.nombre}</h4>
      </div>
      <p class="meta-item-fecha">Vence ${formatearFecha(registro.fecha)}</p>
      <div class="meta-progreso-container">
        <div class="meta-progreso-barra">
          <div class="meta-progreso-relleno" style="width: ${porcentaje}%;"></div>
        </div>
        <span class="meta-progreso-texto">${porcentaje}%</span>
      </div>
    `;
    lista.appendChild(item);
  });
}

// ============================================
// RENDERIZAR SECCIONES PERSONALIZADAS
// ============================================
function renderizarSeccionesPersonalizadas() {
  const registros = obtenerRegistros();
  const seccionesCustom = [...new Set(
    registros
      .filter(r => r.seccion === "nueva")
      .map(r => r.nombreSeccion)
  )];
  console.log("Secciones personalizadas:", seccionesCustom);
}

// ============================================
// ACTUALIZAR TOTALES (Balance, Ahorro, Deudas)
// ============================================
function actualizarTotales() {
  const registros = obtenerRegistros();

  const totalDeudas = registros
    .filter(r => r.seccion === "deudas")
    .reduce((sum, r) => sum + (Number(r.monto) || 0), 0);

  const totalAhorro = registros
    .filter(r => r.seccion === "ahorro")
    .reduce((sum, r) => sum + (Number(r.monto) || 0), 0);

  const balanceTotal = totalAhorro - totalDeudas;

  const elBalance = document.getElementById("balanceTotal");
  if (elBalance) elBalance.textContent = formatearMonto(balanceTotal);

  const elAhorro = document.getElementById("totalAhorro");
  if (elAhorro) elAhorro.textContent = formatearMonto(totalAhorro);

  const elDeudas = document.getElementById("totalDeudas");
  if (elDeudas) elDeudas.textContent = formatearMonto(totalDeudas);

  const boxDeudas = document.getElementById("totalDeudasBox");
  if (boxDeudas) boxDeudas.textContent = "Total: " + formatearMonto(totalDeudas);

  const boxMetas = document.getElementById("totalMetasBox");
  if (boxMetas) boxMetas.textContent = "Total: " + formatearMonto(totalAhorro);
}

// ============================================
// MODAL NUEVO REGISTRO
// ============================================
function inicializarModal() {
  const btnAgregar = document.getElementById("btnAgregar");
  const modalOverlay = document.getElementById("modalOverlay");
  const btnCerrarModal = document.getElementById("btnCerrarModal");
  const btnCancelar = document.getElementById("btnCancelar");
  const formRegistro = document.getElementById("formRegistro");
  const selectSeccion = document.getElementById("selectSeccion");
  const camposNuevaSeccion = document.getElementById("camposNuevaSeccion");
  const inputNombreSeccion = document.getElementById("inputNombreSeccion");
  const inputColorSeccion = document.getElementById("inputColorSeccion");
  const colorTexto = document.getElementById("colorTexto");
  const selectDiaRecordatorio = document.getElementById("selectDiaRecordatorio");
  const grupoDiaRecordatorio = document.getElementById("grupoDiaRecordatorio");
  const radiosRecordatorio = document.querySelectorAll('input[name="recordatorio"]');

  if (!btnAgregar || !modalOverlay) return;

  // ---- Abrir modal ----
  btnAgregar.addEventListener("click", () => {
    modalOverlay.classList.add("activo");
    document.body.style.overflow = "hidden";
    const hoy = new Date().toISOString().split("T")[0];
    const inputFecha = document.getElementById("inputFecha");
    if (inputFecha) inputFecha.value = hoy;
  });

  // ---- Cerrar modal (con animación hacia abajo) ----
  function cerrarModal() {
    modalOverlay.classList.add("cerrando");
    document.body.style.overflow = "";

    setTimeout(() => {
      modalOverlay.classList.remove("activo");
      modalOverlay.classList.remove("cerrando");
      formRegistro.reset();
      camposNuevaSeccion.classList.remove("activo");
      if (colorTexto) colorTexto.textContent = "#398869";
      actualizarDiasRecordatorio("diario");
      const inputFecha = document.getElementById("inputFecha");
      if (inputFecha) inputFecha.value = new Date().toISOString().split("T")[0];
    }, 400);
  }

  if (btnCerrarModal) btnCerrarModal.addEventListener("click", cerrarModal);
  if (btnCancelar) btnCancelar.addEventListener("click", cerrarModal);

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) cerrarModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("activo")) {
      cerrarModal();
    }
  });

  // ---- Mostrar / ocultar campos de nueva sección ----
  if (selectSeccion) {
    selectSeccion.addEventListener("change", () => {
      if (selectSeccion.value === "nueva") {
        camposNuevaSeccion.classList.add("activo");
        inputNombreSeccion.required = true;
      } else {
        camposNuevaSeccion.classList.remove("activo");
        inputNombreSeccion.required = false;
        inputNombreSeccion.value = "";
      }
    });
  }

  // ---- Actualizar texto del color ----
  if (inputColorSeccion) {
    inputColorSeccion.addEventListener("input", () => {
      if (colorTexto) colorTexto.textContent = inputColorSeccion.value.toUpperCase();
    });
  }

  // ---- Días del recordatorio según tipo ----
  function actualizarDiasRecordatorio(tipo) {
    if (!selectDiaRecordatorio) return;
    selectDiaRecordatorio.innerHTML = "";

    if (tipo === "diario") {
      const opt = document.createElement("option");
      opt.value = "todos";
      opt.textContent = "Todos los días";
      selectDiaRecordatorio.appendChild(opt);
      if (grupoDiaRecordatorio) grupoDiaRecordatorio.style.display = "none";
    } else if (tipo === "semanal") {
      if (grupoDiaRecordatorio) grupoDiaRecordatorio.style.display = "flex";
      const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
      dias.forEach((dia, i) => {
        const opt = document.createElement("option");
        opt.value = i + 1;
        opt.textContent = dia;
        selectDiaRecordatorio.appendChild(opt);
      });
    } else if (tipo === "mensual") {
      if (grupoDiaRecordatorio) grupoDiaRecordatorio.style.display = "flex";
      for (let i = 1; i <= 31; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Día " + i;
        selectDiaRecordatorio.appendChild(opt);
      }
    }
  }

  actualizarDiasRecordatorio("diario");

  radiosRecordatorio.forEach((radio) => {
    radio.addEventListener("change", () => {
      actualizarDiasRecordatorio(radio.value);
    });
  });

  // ---- Enviar formulario ----
  if (formRegistro) {
    formRegistro.addEventListener("submit", (e) => {
      e.preventDefault();

      const seccionSeleccionada = selectSeccion.value;
      const tipoRecordatorio = document.querySelector('input[name="recordatorio"]:checked').value;

      const nuevoRegistro = {
        id: Date.now(),
        seccion: seccionSeleccionada,
        nombreSeccion: seccionSeleccionada === "nueva" ? inputNombreSeccion.value : null,
        colorSeccion: seccionSeleccionada === "nueva" ? inputColorSeccion.value : null,
        nombre: document.getElementById("inputNombre").value,
        monto: Number(document.getElementById("inputMonto").value) || 0,
        fecha: document.getElementById("inputFecha").value,
        recordatorio: tipoRecordatorio,
        diaRecordatorio: selectDiaRecordatorio ? selectDiaRecordatorio.value : null,
        fechaCreacion: new Date().toISOString()
      };

      const registros = obtenerRegistros();
      registros.push(nuevoRegistro);
      guardarRegistros(registros);

      renderizarDeudas();
      renderizarMetas();
      renderizarSeccionesPersonalizadas();
      actualizarTotales();

      console.log("Nuevo registro guardado:", nuevoRegistro);

      cerrarModal();
    });
  }
}

// ============================================
// INICIALIZAR TODO
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  actualizarFecha();
  cargarNombre();
  marcarActivo();

  renderizarDeudas();
  renderizarMetas();
  renderizarSeccionesPersonalizadas();
  actualizarTotales();

  inicializarModal();
});