// ============================================
// SELECTOR DE MESES
// ============================================
let mesSeleccionado = "todos";

const MESES_NOMBRES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                       "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// ============================================
// CACHÉ DE REGISTROS (desde Supabase)
// ============================================
let cacheRegistros = [];

// ============================================
// ÍCONOS SVG DE CADA SECCIÓN PERSONALIZADA
// ============================================
const ICONOS_SVG = {
  "chart-bar": `
    <svg class="personalizada-icono-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 13a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/>
      <path d="M9 5a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v14a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/>
      <path d="M15 9a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v10a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z"/>
      <path d="M4 20h14"/>
    </svg>
  `,
  "credit-card": `
    <svg class="personalizada-icono-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 5m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z"/>
      <path d="M3 10l18 0"/>
      <path d="M7 15l.01 0"/>
      <path d="M11 15l2 0"/>
    </svg>
  `,
  "coin-bitcoin": `
    <svg class="personalizada-icono-svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 3.34a10 10 0 1 1 -15 8.66l.005 -.324a10 10 0 0 1 14.995 -8.336zm-4 2.66a1 1 0 0 0 -1 1h-1a1 1 0 0 0 -2 0a1 1 0 1 0 0 2v6a1 1 0 0 0 0 2c0 1.333 2 1.333 2 0h1a1 1 0 0 0 2 0v-.15c1.167 -.394 2 -1.527 2 -2.85l-.005 -.175a3.063 3.063 0 0 0 -.734 -1.827c.46 -.532 .739 -1.233 .739 -1.998c0 -1.323 -.833 -2.456 -2 -2.85v-.15a1 1 0 0 0 -1 -1zm.09 7c.492 0 .91 .437 .91 1s-.418 1 -.91 1h-2.09v-2h2.09zm0 -4c.492 0 .91 .437 .91 1c0 .522 -.36 .937 -.806 .993l-.104 .007h-2.09v-2h2.09z"/>
    </svg>
  `,
  "home": `
    <svg class="personalizada-icono-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12l-2 0l9 -9l9 9l-2 0"/>
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7"/>
      <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6"/>
    </svg>
  `,
  "slack": `
    <svg class="personalizada-icono-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 12v-6a2 2 0 0 1 4 0v6m0 -2a2 2 0 1 1 2 2h-6"/>
      <path d="M12 12h6a2 2 0 0 1 0 4h-6m2 0a2 2 0 1 1 -2 2v-6"/>
      <path d="M12 12v6a2 2 0 0 1 -4 0v-6m0 2a2 2 0 1 1 -2 -2h6"/>
      <path d="M12 12h-6a2 2 0 0 1 0 -4h6m-2 0a2 2 0 1 1 2 -2v6"/>
    </svg>
  `
};

function obtenerIconoSVG(nombre) {
  return ICONOS_SVG[nombre] || ICONOS_SVG["chart-bar"];
}

// ============================================
// NOMBRE DEL USUARIO
// ============================================
async function cargarNombre() {
  const el = document.getElementById("nombreUsuario");
  if (!el) return;

  const perfil = await dbObtenerPerfil();
  const nombre = perfil?.full_name
              || localStorage.getItem("nombreUsuario")
              || "Name";
  el.textContent = nombre;
}

// ============================================
// MARCAR ÍCONO ACTIVO
// ============================================
function marcarActivo() {
  const paginaActual = window.location.pathname.split("/").pop() || "Black.html";
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
  const meses = new Set();
  cacheRegistros.forEach(r => {
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

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ============================================
// FORMATEO DE MONTO EN VIVO
// ============================================
function inicializarFormateoMonto() {
  const inputMonto = document.getElementById("inputMonto");
  if (!inputMonto) return;

  inputMonto.addEventListener("input", (e) => {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 15) valor = valor.slice(0, 15);

    if (valor === "") {
      e.target.value = "";
    } else {
      e.target.value = Number(valor).toLocaleString("es-CO");
    }
  });
}

function leerMontoLimpio() {
  const inputMonto = document.getElementById("inputMonto");
  if (!inputMonto) return 0;
  const limpio = inputMonto.value.replace(/\D/g, "");
  return Number(limpio) || 0;
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
  btnTodos.addEventListener("click", (e) => { e.stopPropagation(); seleccionarMes("todos"); });
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
    btn.addEventListener("click", (e) => { e.stopPropagation(); seleccionarMes(clave); });
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
  renderizarSeccionesPersonalizadas();
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
// REFRESCAR REGISTROS
// ============================================
async function refrescarRegistros() {
  cacheRegistros = await dbObtenerRegistros();

  renderizarDeudas();
  renderizarMetas();
  renderizarSeccionesPersonalizadas();
  actualizarTotales();
  renderizarDropdownMeses();
}

// ============================================
// RENDERIZAR DEUDAS
// ============================================
function renderizarDeudas() {
  const lista = document.getElementById("deudasLista");
  if (!lista) return;

  const registros = filtrarRegistrosPorMes(
    cacheRegistros.filter(r => r.seccion === "deudas")
  );
  lista.innerHTML = "";

  if (registros.length === 0) {
    lista.innerHTML = `<div class="deuda-item-vacio" style="text-align:center; padding:12px; font-size:10px; color:#69747A;">No hay deudas registradas</div>`;
    return;
  }

  registros.forEach((registro) => {
    const porcentaje = calcularPorcentaje(registro);
    const item = document.createElement("div");
    item.className = "deuda-item";
    item.dataset.registroId = registro.id;
    item.innerHTML = `
      <div class="deuda-item-header">
        <div class="deuda-item-circulo">
          <img src="../iconos/tarjeta.png" alt="tarjeta" class="deuda-item-icono">
        </div>
        <h4 class="deuda-item-nombre">${registro.nombre}</h4>
      </div>
      <p class="deuda-item-fecha">Vence ${formatearFecha(registro.fecha)} · ${formatearMonto(registro.monto)}</p>
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
    cacheRegistros.filter(r => r.seccion === "ahorro")
  );
  lista.innerHTML = "";

  if (registros.length === 0) {
    lista.innerHTML = `<div class="meta-item-vacio" style="text-align:center; padding:12px; font-size:10px; color:#69747A;">No hay metas registradas</div>`;
    return;
  }

  registros.forEach((registro) => {
    const porcentaje = calcularPorcentaje(registro);
    const item = document.createElement("div");
    item.className = "meta-item";
    item.dataset.registroId = registro.id;
    item.innerHTML = `
      <div class="meta-item-header">
        <div class="meta-item-circulo">
          <img src="../iconos/Meta.png" alt="meta" class="meta-item-icono">
        </div>
        <h4 class="meta-item-nombre">${registro.nombre}</h4>
      </div>
      <p class="meta-item-fecha">Vence ${formatearFecha(registro.fecha)} · ${formatearMonto(registro.monto)}</p>
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
  const contenedor = document.getElementById("seccionesPersonalizadas");
  if (!contenedor) return;

  contenedor.innerHTML = "";

  const personalizadas = {};
  cacheRegistros
    .filter(r => r.seccion === "nueva")
    .forEach(r => {
      const key = r.nombreSeccion || "Sin nombre";
      if (!personalizadas[key]) {
        personalizadas[key] = {
          color: r.colorSeccion || "#398869",
          icono: r.iconoSeccion || "chart-bar",
          items: []
        };
      }
      personalizadas[key].items.push(r);
    });

  if (Object.keys(personalizadas).length === 0) return;

  Object.keys(personalizadas).forEach(nombre => {
    const data = personalizadas[nombre];
    const itemsFiltrados = filtrarRegistrosPorMes(data.items);
    const svgIcono = obtenerIconoSVG(data.icono);

    const seccion = document.createElement("section");
    seccion.className = "seccion personalizada";
    seccion.style.backgroundColor = hexToRgba(data.color, 0.1);
    seccion.style.border = `1px solid ${data.color}`;

    let itemsHTML = "";
    if (itemsFiltrados.length === 0) {
      itemsHTML = `<div style="text-align:center; padding:12px; font-size:10px; color:#69747A;">No hay registros en este mes</div>`;
    } else {
      itemsFiltrados.forEach(item => {
        const porcentaje = calcularPorcentaje(item);
        const svgItem = svgIcono.replace('class="personalizada-icono-svg"', 'class="personalizada-item-icono-svg"');
        itemsHTML += `
          <div class="personalizada-item" data-registro-id="${item.id}">
            <div class="personalizada-item-header">
              <div class="personalizada-item-circulo" style="background-color:${data.color}; color:#FFFFFF;">
                ${svgItem}
              </div>
              <h4 class="personalizada-item-nombre">${item.nombre}</h4>
            </div>
            <p class="personalizada-item-fecha">Vence ${formatearFecha(item.fecha)} · ${formatearMonto(item.monto)}</p>
            <div class="personalizada-progreso-container">
              <div class="personalizada-progreso-barra">
                <div class="personalizada-progreso-relleno" style="width:${porcentaje}%; background-color:${data.color};"></div>
              </div>
              <span class="personalizada-progreso-texto">${porcentaje}%</span>
            </div>
          </div>
        `;
      });
    }

    seccion.innerHTML = `
      <div class="personalizada-header">
        <div class="personalizada-circulo" style="background-color:${data.color}; color:#FFFFFF;">
          ${svgIcono}
        </div>
        <h2 class="personalizada-titulo">${nombre}</h2>
      </div>
      <p class="personalizada-descripcion">Sección personalizada</p>
      <div class="personalizada-lista">${itemsHTML}</div>
    `;

    contenedor.appendChild(seccion);
  });
}

// ============================================
// RELLENAR SELECT DE SECCIONES
// ============================================
function rellenarSelectSecciones() {
  const selectSeccion = document.getElementById("selectSeccion");
  if (!selectSeccion) return;

  const valorActual = selectSeccion.value;
  selectSeccion.innerHTML = "";

  const optDefault = document.createElement("option");
  optDefault.value = "";
  optDefault.disabled = true;
  optDefault.selected = true;
  optDefault.textContent = "Selecciona una sección";
  selectSeccion.appendChild(optDefault);

  const optDeudas = document.createElement("option");
  optDeudas.value = "deudas";
  optDeudas.textContent = "Deudas";
  selectSeccion.appendChild(optDeudas);

  const optAhorro = document.createElement("option");
  optAhorro.value = "ahorro";
  optAhorro.textContent = "Ahorro";
  selectSeccion.appendChild(optAhorro);

  const nombresCustom = [...new Set(
    cacheRegistros
      .filter(r => r.seccion === "nueva")
      .map(r => r.nombreSeccion)
      .filter(Boolean)
  )];

  nombresCustom.forEach(nombre => {
    const opt = document.createElement("option");
    opt.value = `custom:${nombre}`;
    opt.textContent = nombre;
    selectSeccion.appendChild(opt);
  });

  const optNueva = document.createElement("option");
  optNueva.value = "nueva";
  optNueva.textContent = "+ Agregar nueva sección";
  selectSeccion.appendChild(optNueva);

  if (valorActual && [...selectSeccion.options].some(o => o.value === valorActual)) {
    selectSeccion.value = valorActual;
  }
}

// ============================================
// ACTUALIZAR TOTALES
// ============================================
function actualizarTotales() {
  const registros = filtrarRegistrosPorMes(cacheRegistros);

  const totalDeudas = registros
    .filter(r => r.seccion === "deudas")
    .reduce((sum, r) => sum + (Number(r.monto) || 0), 0);

  const totalAhorro = registros
    .filter(r => r.seccion === "ahorro")
    .reduce((sum, r) => sum + (Number(r.monto) || 0), 0);

  const totalAbonado = 0;
  const balanceAhorro = totalAbonado;

  let porcentaje = 0;
  if (totalAhorro > 0) {
    porcentaje = Math.min(100, Math.round((totalAbonado / totalAhorro) * 100));
  }

  const elBalance = document.getElementById("balanceTotal");
  if (elBalance) elBalance.textContent = formatearMonto(balanceAhorro);

  const elAhorro = document.getElementById("totalAhorro");
  if (elAhorro) elAhorro.textContent = formatearMonto(totalAhorro);

  const elDeudas = document.getElementById("totalDeudas");
  if (elDeudas) elDeudas.textContent = formatearMonto(totalDeudas);

  const elBarra = document.getElementById("balanceProgresoRelleno");
  if (elBarra) elBarra.style.width = porcentaje + "%";

  const elTexto = document.getElementById("balanceProgresoTexto");
  if (elTexto) elTexto.textContent = porcentaje + "%";

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
  const inputIconoSeccion = document.getElementById("inputIconoSeccion");
  const iconoSelector = document.getElementById("iconoSelector");
  const selectDiaRecordatorio = document.getElementById("selectDiaRecordatorio");
  const grupoDiaRecordatorio = document.getElementById("grupoDiaRecordatorio");
  const radiosRecordatorio = document.querySelectorAll('input[name="recordatorio"]');

  if (!btnAgregar || !modalOverlay) return;

  if (iconoSelector) {
    iconoSelector.querySelectorAll(".icono-opcion").forEach(btn => {
      btn.addEventListener("click", () => {
        iconoSelector.querySelectorAll(".icono-opcion").forEach(b => b.classList.remove("activo"));
        btn.classList.add("activo");
        if (inputIconoSeccion) inputIconoSeccion.value = btn.getAttribute("data-icono");
      });
    });
  }

  btnAgregar.addEventListener("click", () => {
    modalOverlay.classList.add("activo");
    document.body.style.overflow = "hidden";
    const hoy = new Date().toISOString().split("T")[0];
    const inputFecha = document.getElementById("inputFecha");
    if (inputFecha) inputFecha.value = hoy;

    rellenarSelectSecciones();
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

      if (iconoSelector) {
        iconoSelector.querySelectorAll(".icono-opcion").forEach(b => {
          if (b.getAttribute("data-icono") === "chart-bar") b.classList.add("activo");
          else b.classList.remove("activo");
        });
      }
      if (inputIconoSeccion) inputIconoSeccion.value = "chart-bar";

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
    formRegistro.addEventListener("submit", async (e) => {
      e.preventDefault();

      const seccionSeleccionada = selectSeccion.value;
      const tipoRecordatorio = document.querySelector('input[name="recordatorio"]:checked').value;

      let seccionFinal = seccionSeleccionada;
      let nombreSeccionFinal = null;
      let colorSeccionFinal = null;
      let iconoSeccionFinal = null;

      if (seccionSeleccionada === "nueva") {
        seccionFinal = "nueva";
        nombreSeccionFinal = inputNombreSeccion.value;
        colorSeccionFinal = inputColorSeccion.value;
        iconoSeccionFinal = inputIconoSeccion ? inputIconoSeccion.value : "chart-bar";

      } else if (seccionSeleccionada.startsWith("custom:")) {
        const nombreExistente = seccionSeleccionada.replace("custom:", "");
        seccionFinal = "nueva";
        nombreSeccionFinal = nombreExistente;

        const ejemplo = cacheRegistros.find(
          r => r.seccion === "nueva" && r.nombreSeccion === nombreExistente
        );
        colorSeccionFinal = ejemplo?.colorSeccion || "#398869";
        iconoSeccionFinal = ejemplo?.iconoSeccion || "chart-bar";
      }

      const nuevoRegistro = {
        seccion:         seccionFinal,
        nombreSeccion:   nombreSeccionFinal,
        colorSeccion:    colorSeccionFinal,
        iconoSeccion:    iconoSeccionFinal,
        nombre:          document.getElementById("inputNombre").value,
        monto:           leerMontoLimpio(),
        fecha:           document.getElementById("inputFecha").value,
        recordatorio:    tipoRecordatorio,
        diaRecordatorio: selectDiaRecordatorio ? selectDiaRecordatorio.value : null,
      };

      const guardado = await dbCrearRegistro(nuevoRegistro);

      if (!guardado) {
        alert("No se pudo guardar el registro. Intenta de nuevo.");
        return;
      }

      await refrescarRegistros();
      cerrarModal();
    });
  }
}

// ============================================
// SWITCH DE TEMA CON DRAG (modo oscuro por defecto)
// ============================================
function inicializarSwitchTema() {
  const track = document.getElementById("switchTrack");
  const thumb = document.getElementById("switchThumb");
  const thumbIcono = document.getElementById("thumbIcono");

  if (!track || !thumb) return;

  const MIN_LEFT = 2;
  const MAX_LEFT = 32;

  function aplicarEstadoInicial() {
    document.body.classList.add("dark-mode");
    if (thumbIcono) thumbIcono.src = "../iconos/luna.png";
    thumb.style.transition = "none";
    thumb.style.left = MAX_LEFT + "px";
    void thumb.offsetWidth;
    thumb.style.transition = "";
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
    thumbStartLeft = parseInt(thumb.style.left) || MAX_LEFT;
    track.classList.add("dragging");

    document.addEventListener("mousemove", moverDrag);
    document.addEventListener("touchmove", moverDrag, { passive: false });
    document.addEventListener("mouseup", terminarDrag);
    document.addEventListener("touchend", terminarDrag);
  }

  function moverDrag(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const delta = clientX - startX;
    if (Math.abs(delta) > movimientoMinimo) arrastrando = true;
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

    const leftActual = parseInt(thumb.style.left) || MAX_LEFT;
    const centro = (MIN_LEFT + MAX_LEFT) / 2;
    const debeIrOscuro = leftActual > centro;

    thumb.style.left = (debeIrOscuro ? MAX_LEFT : MIN_LEFT) + "px";

    setTimeout(() => { cambiarTema(debeIrOscuro); }, 180);
    arrastrando = false;
  }
}

// ============================================
// SISTEMA DE ABONOS CON QR BRE-B
// ============================================
let registroAbonando = null;

function inicializarLongPress() {
  let timer = null;

  const iniciar = (e) => {
    const item = e.target.closest(".deuda-item, .meta-item, .personalizada-item");
    if (!item) return;

    timer = setTimeout(() => {
      mostrarBotonAbonar(item);
      if (navigator.vibrate) navigator.vibrate(30);
    }, 600);
  };

  const cancelar = () => {
    if (timer) { clearTimeout(timer); timer = null; }
  };

  document.body.addEventListener("touchstart", iniciar, { passive: true });
  document.body.addEventListener("mousedown", iniciar);
  document.body.addEventListener("touchend", cancelar);
  document.body.addEventListener("mouseup", cancelar);
  document.body.addEventListener("touchmove", cancelar);
  document.body.addEventListener("mouseleave", cancelar);
  document.body.addEventListener("scroll", cancelar, true);
}

function mostrarBotonAbonar(item) {
  document.querySelectorAll(".btn-abonar-item").forEach(b => b.remove());
  item.classList.add("item-desenfocado");

  const btn = document.createElement("button");
  btn.className = "btn-abonar-item";
  btn.type = "button";
  btn.innerHTML = "💸 Abonar";

  const limpiar = () => {
    btn.remove();
    item.classList.remove("item-desenfocado");
    document.removeEventListener("click", fueraClic, true);
  };

  const fueraClic = (ev) => {
    if (!item.contains(ev.target)) limpiar();
  };

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    abrirModalAbono(item);
    limpiar();
  });

  item.style.position = "relative";
  item.appendChild(btn);
  setTimeout(() => document.addEventListener("click", fueraClic, true), 50);
}

function abrirModalAbono(item) {
  const nombre =
    item.querySelector("h4")?.textContent ||
    item.querySelector(".personalizada-item-nombre")?.textContent ||
    "Sin nombre";

  const registroId = item.dataset.registroId || null;
  registroAbonando = { nombre, elemento: item, registroId };

  const modal = document.getElementById("modalAbono");
  if (!modal) return;

  document.getElementById("abonoNombreSeccion").textContent = nombre;
  document.getElementById("inputMontoAbono").value = "";

  const contQR = document.getElementById("qrCanvas");
  if (contQR) contQR.innerHTML = "";

  document.getElementById("qrContainer").style.display = "none";

  modal.classList.add("activo");
  document.body.style.overflow = "hidden";
}

function cerrarModalAbono() {
  const modal = document.getElementById("modalAbono");
  if (modal) modal.classList.remove("activo");
  document.body.style.overflow = "";
  registroAbonando = null;
}

async function generarQRAbono() {
  const input = document.getElementById("inputMontoAbono");
  const monto = Number((input.value || "").replace(/\D/g, "")) || 0;

  if (monto <= 0) {
    alert("Ingresa un monto válido");
    return;
  }

  const perfil = await dbObtenerPerfil();
  const llave = perfil?.llave_bre_b;

  if (!llave) {
    alert("No tienes una llave Bre-B configurada. Ve a Configuración y agrégala.");
    return;
  }

  const payload = generarPayloadBreB(llave, monto);

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

  await dbCrearAbono({
    registro_id: registroAbonando?.registroId
      ? Number(registroAbonando.registroId)
      : null,
    monto,
    llave_bre_b: llave,
    payload_qr: payload,
  });
}

function inicializarModalAbono() {
  const modal = document.getElementById("modalAbono");
  if (!modal) return;

  const input = document.getElementById("inputMontoAbono");
  input.addEventListener("input", () => {
    let v = input.value.replace(/\D/g, "");
    input.value = v ? Number(v).toLocaleString("es-CO") : "";
  });

  document.getElementById("btnCerrarAbono").onclick   = cerrarModalAbono;
  document.getElementById("btnCancelarAbono").onclick = cerrarModalAbono;
  document.getElementById("btnGenerarQR").onclick     = generarQRAbono;

  modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrarModalAbono();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("activo")) {
      cerrarModalAbono();
    }
  });
}

// ============================================
// INICIALIZAR TODO
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
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

  await cargarNombre();
  marcarActivo();
  await refrescarRegistros();

  inicializarModal();
  inicializarSwitchTema();
  inicializarSelectorMes();
  inicializarFormateoMonto();

  inicializarLongPress();
  inicializarModalAbono();
});