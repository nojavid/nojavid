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
// NOMBRE DEL USUARIO (desde profiles)
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
// REFRESCAR REGISTROS DESDE SUPABASE
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
          items: []
        };
      }
      personalizadas[key].items.push(r);
    });

  if (Object.keys(personalizadas).length === 0) return;

  Object.keys(personalizadas).forEach(nombre => {
    const data = personalizadas[nombre];
    const itemsFiltrados = filtrarRegistrosPorMes(data.items);

    const seccion = document.createElement("section");
    seccion.className = "seccion personalizada";
    seccion.style.backgroundColor = hexToRgba(data.color, 0.1);
    seccion.style.border = `1px solid ${data.color}`;

    let itemsHTML = "";
    if (itemsFiltrados.length === 0) {
      itemsHTML = `
        <div style="text-align:center; padding:12px; font-size:10px; color:#69747A;">
          No hay registros en este mes
        </div>
      `;
    } else {
      itemsFiltrados.forEach(item => {
        const porcentaje = calcularPorcentaje(item);
        itemsHTML += `
          <div class="personalizada-item">
            <div class="personalizada-item-header">
              <div class="personalizada-item-circulo" style="background-color:${data.color};">
                <img src="../iconos/Meta.png" alt="" class="personalizada-item-icono">
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
        <div class="personalizada-circulo" style="background-color:${data.color};">
          <img src="../iconos/Meta.png" alt="" class="personalizada-icono">
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
// RELLENAR SELECT DE SECCIONES EN EL MODAL
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

      if (seccionSeleccionada === "nueva") {
        seccionFinal = "nueva";
        nombreSeccionFinal = inputNombreSeccion.value;
        colorSeccionFinal = inputColorSeccion.value;

      } else if (seccionSeleccionada.startsWith("custom:")) {
        const nombreExistente = seccionSeleccionada.replace("custom:", "");
        seccionFinal = "nueva";
        nombreSeccionFinal = nombreExistente;

        const ejemplo = cacheRegistros.find(
          r => r.seccion === "nueva" && r.nombreSeccion === nombreExistente
        );
        colorSeccionFinal = ejemplo?.colorSeccion || "#398869";
      }

      const nuevoRegistro = {
        seccion:         seccionFinal,
        nombreSeccion:   nombreSeccionFinal,
        colorSeccion:    colorSeccionFinal,
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

    const leftActual = parseInt(thumb.style.left) || MAX_LEFT;
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
});