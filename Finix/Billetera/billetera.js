// ============================================
// SELECTOR DE MESES
// ============================================
let mesSeleccionado = "todos";

const MESES_NOMBRES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                       "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// ============================================
// NOMBRE DEL USUARIO
// ============================================
function cargarNombre() {
  const nombre = localStorage.getItem("nombreUsuario") || "Name";
  const el = document.getElementById("nombreUsuario");
  if (el) el.textContent = nombre;
}

// ============================================
// MARCAR ÍCONO ACTIVO
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
// SISTEMA DE REGISTROS
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

function formatearMonto(valor) {
  const numero = Number(valor) || 0;
  return "$" + numero.toLocaleString("es-CO");
}

function calcularPorcentaje(registro) {
  if (registro.montoTotal && registro.montoPagado) {
    return Math.min(100, Math.round((registro.montoPagado / registro.montoTotal) * 100));
  }
  return 0;
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return "Sin fecha";
  const fecha = new Date(fechaISO + "T00:00:00");
  const dia = fecha.getDate();
  const mes = MESES_NOMBRES[fecha.getMonth()];
  return `${dia} ${mes}`;
}

function filtrarRegistrosPorMes(registros) {
  if (mesSeleccionado === "todos") return registros;

  return registros.filter(r => {
    if (!r.fecha) return false;
    const fecha = new Date(r.fecha + "T00:00:00");
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    return clave === mesSeleccionado;
  });
}

function obtenerMesesConDatos() {
  const registros = obtenerRegistros();
  const meses = new Set();

  registros.forEach(r => {
    if (r.fecha) {
      const fecha = new Date(r.fecha + "T00:00:00");
      const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
      meses.add(clave);
    }
  });

  return [...meses].sort().reverse();
}

function formatearMesClave(clave) {
  const [anio, mes] = clave.split("-");
  return `${MESES_NOMBRES[parseInt(mes) - 1]} ${anio}`;
}

// ============================================
// DROPDOWN DE MESES
// ============================================
function renderizarDropdownMeses() {
  const dropdown = document.getElementById("mesesDropdown");
  if (!dropdown) return;

  dropdown.innerHTML = "";

  const btnTodos = document.createElement("button");
  btnTodos.className = "mes-opcion" + (mesSeleccionado === "todos" ? " seleccionado" : "");
  btnTodos.textContent = "Todos los meses";
  btnTodos.dataset.mes = "todos";
  btnTodos.addEventListener("click", (e) => {
    e.stopPropagation();
    seleccionarMes("todos");
  });
  dropdown.appendChild(btnTodos);

  const meses = obtenerMesesConDatos();

  if (meses.length === 0) {
    const vacio = document.createElement("div");
    vacio.className = "mes-opcion vacio";
    vacio.textContent = "Sin registros";
    dropdown.appendChild(vacio);
    return;
  }

  meses.forEach(clave => {
    const btn = document.createElement("button");
    btn.className = "mes-opcion" + (mesSeleccionado === clave ? " seleccionado" : "");
    btn.textContent = formatearMesClave(clave);
    btn.dataset.mes = clave;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      seleccionarMes(clave);
    });
    dropdown.appendChild(btn);
  });
}

function seleccionarMes(clave) {
  mesSeleccionado = clave;

  const elFecha = document.getElementById("fechaActual");
  if (elFecha) {
    elFecha.textContent = clave === "todos" ? "Todos" : formatearMesClave(clave);
  }

  const dropdown = document.getElementById("mesesDropdown");
  const contenedor = document.getElementById("btnFecha");
  if (dropdown) dropdown.classList.remove("activo");
  if (contenedor) contenedor.classList.remove("abierto");

  renderizarDeudas();
  renderizarMetas();
  actualizarTotales();
}

function inicializarSelectorMes() {
  const btnFecha = document.getElementById("btnFecha");
  const dropdown = document.getElementById("mesesDropdown");

  if (!btnFecha || !dropdown) return;

  renderizarDropdownMeses();

  btnFecha.addEventListener("click", (e) => {
    e.stopPropagation();
    const abierto = dropdown.classList.contains("activo");
    if (abierto) {
      dropdown.classList.remove("activo");
      btnFecha.classList.remove("abierto");
    } else {
      renderizarDropdownMeses();
      dropdown.classList.add("activo");
      btnFecha.classList.add("abierto");
    }
  });

  document.addEventListener("click", (e) => {
    if (!btnFecha.contains(e.target)) {
      dropdown.classList.remove("activo");
      btnFecha.classList.remove("abierto");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      dropdown.classList.remove("activo");
      btnFecha.classList.remove("abierto");
    }
  });
}

// ============================================
// RENDERIZAR DEUDAS
// ============================================
function renderizarDeudas() {
  const lista = document.getElementById("deudasLista");
  if (!lista) return;

  const registros = filtrarRegistrosPorMes(
    obtenerRegistros().filter(r => r.seccion === "deudas")
  );
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
// RENDERIZAR METAS
// ============================================
function renderizarMetas() {
  const lista = document.getElementById("metasLista");
  if (!lista) return;

  const registros = filtrarRegistrosPorMes(
    obtenerRegistros().filter(r => r.seccion === "ahorro")
  );
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
// SECCIONES PERSONALIZADAS
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
// ACTUALIZAR TOTALES
// ============================================
function actualizarTotales() {
  const registros = filtrarRegistrosPorMes(obtenerRegistros());

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

  btnAgregar.addEventListener("click", () => {
    modalOverlay.classList.add("activo");
    document.body.style.overflow = "hidden";
    const hoy = new Date().toISOString().split("T")[0];
    const inputFecha = document.getElementById("inputFecha");
    if (inputFecha) inputFecha.value = hoy;
  });

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

  if (inputColorSeccion) {
    inputColorSeccion.addEventListener("input", () => {
      if (colorTexto) colorTexto.textContent = inputColorSeccion.value.toUpperCase();
    });
  }

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
      renderizarDropdownMeses();

      console.log("Nuevo registro guardado:", nuevoRegistro);

      cerrarModal();
    });
  }
}

// ============================================
// SWITCH DE TEMA CON DRAG
// ============================================
function inicializarSwitchTema() {
  const track = document.getElementById("switchTrack");
  const thumb = document.getElementById("switchThumb");
  const thumbIcono = document.getElementById("thumbIcono");

  if (!track || !thumb) return;

  const esModoOscuro = document.body.classList.contains("dark-mode");

  const MIN_LEFT = 2;
  const MAX_LEFT = 32;

  function aplicarEstadoInicial() {
    if (esModoOscuro) {
      document.body.classList.add("dark-mode");
      if (thumbIcono) thumbIcono.src = "../iconos/luna.png";
      thumb.style.transition = "none";
      thumb.style.left = MAX_LEFT + "px";
      void thumb.offsetWidth;
      thumb.style.transition = "";
    } else {
      document.body.classList.remove("dark-mode");
      if (thumbIcono) thumbIcono.src = "../iconos/sol.png";
      thumb.style.transition = "none";
      thumb.style.left = MIN_LEFT + "px";
      void thumb.offsetWidth;
      thumb.style.transition = "";
    }
  }

  aplicarEstadoInicial();

  let arrastrando = false;
  let startX = 0;
  let thumbStartLeft = 0;
  const movimientoMinimo = 5;

  function cambiarTema(nuevoModoOscuro) {
    const temaActualOscuro = document.body.classList.contains("dark-mode");
    if (nuevoModoOscuro === temaActualOscuro) return;

    localStorage.setItem("finix_tema", nuevoModoOscuro ? "oscuro" : "claro");

    if (nuevoModoOscuro) {
      window.location.href = "Black.html";
    } else {
      window.location.href = "billetera.html";
    }
  }

  track.addEventListener("click", () => {
    if (arrastrando) return;
    const estaOscuro = document.body.classList.contains("dark-mode");
    cambiarTema(!estaOscuro);
  });

  thumb.addEventListener("mousedown", iniciarDrag);
  thumb.addEventListener("touchstart", iniciarDrag, { passive: true });

  function iniciarDrag(e) {
    arrastrando = false;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    startX = clientX;
    thumbStartLeft = parseInt(thumb.style.left) || MIN_LEFT;
    track.classList.add("dragging");

    document.addEventListener("mousemove", moverDrag);
    document.addEventListener("touchmove", moverDrag, { passive: false });
    document.addEventListener("mouseup", terminarDrag);
    document.addEventListener("touchend", terminarDrag);
  }

  function moverDrag(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const delta = clientX - startX;

    if (Math.abs(delta) > movimientoMinimo) {
      arrastrando = true;
    }

    if (!arrastrando) return;

    let nuevoLeft = thumbStartLeft + delta;
    nuevoLeft = Math.max(MIN_LEFT, Math.min(MAX_LEFT, nuevoLeft));
    thumb.style.left = nuevoLeft + "px";
  }

  function terminarDrag() {
    document.removeEventListener("mousemove", moverDrag);
    document.removeEventListener("touchmove", moverDrag);
    document.removeEventListener("mouseup", terminarDrag);
    document.removeEventListener("touchend", terminarDrag);
    track.classList.remove("dragging");

    if (!arrastrando) return;

    const leftActual = parseInt(thumb.style.left) || MIN_LEFT;
    const centro = (MIN_LEFT + MAX_LEFT) / 2;
    const debeIrOscuro = leftActual > centro;

    thumb.style.left = (debeIrOscuro ? MAX_LEFT : MIN_LEFT) + "px";

    setTimeout(() => {
      cambiarTema(debeIrOscuro);
    }, 180);

    arrastrando = false;
  }
}

// ============================================
// INICIALIZAR TODO
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  // ---- Redirección automática según tema guardado ----
  const temaGuardado = localStorage.getItem("finix_tema");
  const esBlack = window.location.pathname.includes("Black");

  if (temaGuardado === "oscuro" && !esBlack) {
    window.location.replace("Black.html");
    return;
  }
  if (temaGuardado === "claro" && esBlack) {
    window.location.replace("billetera.html");
    return;
  }

  cargarNombre();
  marcarActivo();

  renderizarDeudas();
  renderizarMetas();
  renderizarSeccionesPersonalizadas();
  actualizarTotales();

  inicializarModal();
  inicializarSwitchTema();
  inicializarSelectorMes();
});