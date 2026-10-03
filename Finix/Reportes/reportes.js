// ============================================
// CONFIGURACIÓN SUPABASE
// ============================================
const SUPABASE_URL = 'https://dfhmekwkhsxvjuojuruv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TxNdB8vq6tv0c12IWJ8GwQ_zCoUN4v8';

let supabaseClient = null;
if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ Supabase inicializado en reportes.js');
} else {
  console.warn('⚠️ Supabase NO detectado en reportes.html');
}

// ============================================
// CONFIGURACIÓN
// ============================================
let mesSeleccionado = "todos";

const MESES_NOMBRES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                       "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// ============================================
// LEER MOVIMIENTOS (Supabase + fallback localStorage)
// ============================================
async function leerMovimientos() {
  const local = (() => {
    try { return JSON.parse(localStorage.getItem("finix_movimientos") || "[]"); }
    catch (e) { return []; }
  })();

  if (!supabaseClient) {
    console.warn('⚠️ Supabase no disponible, usando localStorage');
    return local;
  }

  try {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      console.warn('⚠️ No hay usuario logueado, usando localStorage');
      return local;
    }

    const { data, error } = await supabaseClient
      .from("movimientos")
      .select("*")
      .order("fecha", { ascending: false });

    if (error) {
      console.error('❌ Error leyendo movimientos:', error.message);
      return local;
    }

    const movs = (data || []).map(m => ({
      id: m.id,
      nombre: m.nombre,
      precio: Number(m.precio) || 0,
      tipo: m.tipo,
      icono: m.icono || "💸",
      fecha: m.fecha
    }));

    console.log('✅ Reportes: movimientos cargados desde Supabase:', movs.length);
    return movs;
  } catch (e) {
    console.warn("⚠️ Error leyendo movimientos:", e);
    return local;
  }
}

// ============================================
// UTILIDADES
// ============================================
function formatoCOP(valor) {
  const num = Math.round(Number(valor) || 0);
  return "$" + num.toLocaleString("es-CO");
}

function obtenerClaveMes(fechaISO) {
  if (!fechaISO) return null;
  const fecha = new Date(fechaISO);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

function formatearMesClave(clave) {
  const [anio, mes] = clave.split("-");
  return `${MESES_NOMBRES[parseInt(mes) - 1]} ${anio}`;
}

function filtrarPorMes(movs) {
  if (mesSeleccionado === "todos") return movs;
  return movs.filter(m => obtenerClaveMes(m.fecha) === mesSeleccionado);
}

function obtenerMesesConDatos(movs) {
  const meses = new Set();
  movs.forEach(m => {
    const clave = obtenerClaveMes(m.fecha);
    if (clave) meses.add(clave);
  });
  return [...meses].sort().reverse();
}

// ============================================
// RENDERIZAR DROPDOWN DE MESES
// ============================================
async function renderizarDropdownMeses() {
  const dropdown = document.getElementById("mesesDropdown");
  if (!dropdown) return;

  const movs = await leerMovimientos();
  const meses = obtenerMesesConDatos(movs);

  dropdown.innerHTML = "";

  const btnTodos = document.createElement("button");
  btnTodos.className = "mes-opcion" + (mesSeleccionado === "todos" ? " seleccionado" : "");
  btnTodos.textContent = "Todos los meses";
  btnTodos.addEventListener("click", (e) => {
    e.stopPropagation();
    seleccionarMes("todos");
  });
  dropdown.appendChild(btnTodos);

  meses.forEach(clave => {
    const btn = document.createElement("button");
    btn.className = "mes-opcion" + (mesSeleccionado === clave ? " seleccionado" : "");
    btn.textContent = formatearMesClave(clave);
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      seleccionarMes(clave);
    });
    dropdown.appendChild(btn);
  });
}

async function seleccionarMes(clave) {
  mesSeleccionado = clave;

  const elFecha = document.getElementById("fechaActual");
  if (elFecha) {
    elFecha.textContent = clave === "todos" ? "Todos" : formatearMesClave(clave);
  }

  const dropdown = document.getElementById("mesesDropdown");
  const contenedor = document.getElementById("btnFecha");
  if (dropdown) dropdown.classList.remove("activo");
  if (contenedor) contenedor.classList.remove("abierto");

  await renderizarReportes();
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
// RESUMEN SUPERIOR
// ============================================
function renderizarResumen(movs) {
  const ingresos = movs
    .filter(m => m.tipo === "ingreso")
    .reduce((s, m) => s + (Number(m.precio) || 0), 0);

  const gastos = movs
    .filter(m => m.tipo === "gasto")
    .reduce((s, m) => s + (Number(m.precio) || 0), 0);

  const balance = ingresos - gastos;

  const elIng = document.getElementById("totalIngresos");
  const elGas = document.getElementById("totalGastos");
  const elBal = document.getElementById("totalBalance");

  if (elIng) elIng.textContent = formatoCOP(ingresos);
  if (elGas) elGas.textContent = formatoCOP(gastos);
  if (elBal) elBal.textContent = formatoCOP(balance);
}

// ============================================
// GRÁFICA DE BARRAS (últimos 6 meses)
// ============================================
function renderizarGrafica(movs) {
  const contenedor = document.getElementById("graficaBarras");
  if (!contenedor) return;

  const hoy = new Date();
  const meses = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const clave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    meses.push({
      clave,
      label: MESES_NOMBRES[d.getMonth()],
      ingresos: 0,
      gastos: 0
    });
  }

  movs.forEach(m => {
    const clave = obtenerClaveMes(m.fecha);
    const mes = meses.find(x => x.clave === clave);
    if (!mes) return;

    const precio = Number(m.precio) || 0;
    if (m.tipo === "ingreso") mes.ingresos += precio;
    else mes.gastos += precio;
  });

  const maxValor = Math.max(
    ...meses.map(m => Math.max(m.ingresos, m.gastos)),
    1
  );

  contenedor.innerHTML = "";

  meses.forEach(mes => {
    const grupo = document.createElement("div");
    grupo.className = "barra-grupo";

    const par = document.createElement("div");
    par.className = "barra-par";

    const alturaIng = (mes.ingresos / maxValor) * 100;
    const alturaGas = (mes.gastos / maxValor) * 100;

    const barraIng = document.createElement("div");
    barraIng.className = "barra barra-ingreso";
    barraIng.style.height = alturaIng + "%";

    const barraGas = document.createElement("div");
    barraGas.className = "barra barra-gasto";
    barraGas.style.height = alturaGas + "%";

    par.appendChild(barraIng);
    par.appendChild(barraGas);

    const label = document.createElement("div");
    label.className = "barra-label";
    label.textContent = mes.label;

    grupo.appendChild(par);
    grupo.appendChild(label);

    contenedor.appendChild(grupo);
  });
}

// ============================================
// CATEGORÍAS MÁS FRECUENTES
// ============================================
function renderizarCategorias(movs) {
  const contenedor = document.getElementById("categoriasLista");
  if (!contenedor) return;

  const gastos = movs.filter(m => m.tipo === "gasto");

  const categorias = {};
  gastos.forEach(m => {
    const key = (m.nombre || "Sin categoría").trim();
    if (!categorias[key]) {
      categorias[key] = { nombre: key, monto: 0, icono: m.icono || "💸" };
    }
    categorias[key].monto += Number(m.precio) || 0;
  });

  const lista = Object.values(categorias)
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 5);

  if (lista.length === 0) {
    contenedor.innerHTML = `<p style="font-size:11px;color:#8A9A9A;text-align:center;padding:10px;">Sin gastos registrados</p>`;
    return;
  }

  const maxMonto = Math.max(...lista.map(c => c.monto), 1);

  contenedor.innerHTML = "";

  lista.forEach(cat => {
    const pct = (cat.monto / maxMonto) * 100;

    const item = document.createElement("div");
    item.className = "categoria-item";
    item.innerHTML = `
      <div class="categoria-header">
        <div class="categoria-nombre">
          <div class="categoria-icono">${cat.icono}</div>
          <span>${cat.nombre}</span>
        </div>
        <div class="categoria-monto">${formatoCOP(cat.monto)}</div>
      </div>
      <div class="categoria-barra">
        <div class="categoria-progreso" style="width:${pct}%"></div>
      </div>
    `;
    contenedor.appendChild(item);
  });
}

// ============================================
// DONA DE GASTOS POR CATEGORÍA
// ============================================
function renderizarDona(movs) {
  const progreso = document.getElementById("donaProgreso");
  const textoPct = document.getElementById("donaPorcentaje");
  const leyenda = document.getElementById("donaLeyenda");
  if (!progreso || !textoPct || !leyenda) return;

  const gastos = movs.filter(m => m.tipo === "gasto");
  const totalGastos = gastos.reduce((s, m) => s + (Number(m.precio) || 0), 0);

  if (totalGastos === 0) {
    progreso.style.strokeDashoffset = 238.76;
    textoPct.textContent = "0%";
    leyenda.innerHTML = `<p style="font-size:10px;color:#8A9A9A;">Sin gastos</p>`;
    return;
  }

  const categorias = {};
  gastos.forEach(m => {
    const key = (m.nombre || "Otros").trim();
    if (!categorias[key]) {
      categorias[key] = { nombre: key, monto: 0, icono: m.icono || "💸" };
    }
    categorias[key].monto += Number(m.precio) || 0;
  });

  const ordenadas = Object.values(categorias).sort((a, b) => b.monto - a.monto);

  const top3 = ordenadas.slice(0, 3);
  const otrosMonto = ordenadas.slice(3).reduce((s, c) => s + c.monto, 0);
  if (otrosMonto > 0) top3.push({ nombre: "Otros", monto: otrosMonto, icono: "📦" });

  const colores = ["#398869", "#D08B3B", "#025FD8", "#B33A3A"];

  const circunferencia = 238.76;
  const pct = Math.round((top3[0].monto / totalGastos) * 100);

  progreso.style.strokeDashoffset = circunferencia - (circunferencia * pct / 100);
  progreso.style.stroke = colores[0];
  textoPct.textContent = pct + "%";

  leyenda.innerHTML = "";
  top3.forEach((cat, i) => {
    const pctCat = Math.round((cat.monto / totalGastos) * 100);
    const div = document.createElement("div");
    div.className = "dona-leyenda-item";
    div.innerHTML = `
      <span class="dona-leyenda-color" style="background-color:${colores[i]};"></span>
      <span>${cat.nombre} · ${pctCat}%</span>
    `;
    leyenda.appendChild(div);
  });
}

// ============================================
// RENDERIZAR TODO
// ============================================
async function renderizarReportes() {
  const movs = await leerMovimientos();

  const vacio = document.getElementById("reportesVacio");

  if (movs.length === 0) {
    if (vacio) vacio.classList.add("activo");
    return;
  }

  if (vacio) vacio.classList.remove("activo");

  const filtrados = filtrarPorMes(movs);

  renderizarResumen(filtrados);
  renderizarGrafica(movs);
  renderizarCategorias(filtrados);
  renderizarDona(filtrados);
}

// ============================================
// SWITCH DE TEMA
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
      document.body.classList.add("dark-mode");
      if (thumbIcono) thumbIcono.src = "../iconos/luna.png";
    } else {
      document.body.classList.remove("dark-mode");
      if (thumbIcono) thumbIcono.src = "../iconos/sol.png";
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

    const leftActual = parseInt(thumb.style.left) || MIN_LEFT;
    const centro = (MIN_LEFT + MAX_LEFT) / 2;
    const debeIrOscuro = leftActual > centro;

    thumb.style.left = (debeIrOscuro ? MAX_LEFT : MIN_LEFT) + "px";

    setTimeout(() => cambiarTema(debeIrOscuro), 180);
    arrastrando = false;
  }
}

// ============================================
// MARCAR NAV ACTIVA
// ============================================
function marcarActivo() {
  const paginaActual = window.location.pathname.split("/").pop() || "reportes.html";
  const enlaces = document.querySelectorAll(".bottom-nav a");
  enlaces.forEach((enlace) => {
    const dataPage = enlace.getAttribute("data-page");
    if (dataPage === paginaActual) enlace.classList.add("active");
    else enlace.classList.remove("active");
  });
}

// ============================================
// INICIALIZAR TODO
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  const temaGuardado = localStorage.getItem("finix_tema");
  if (temaGuardado === "oscuro") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }

  inicializarSwitchTema();
  inicializarSelectorMes();
  marcarActivo();
  await renderizarDropdownMeses();
  await renderizarReportes();
});

// ============================================
// ACTUALIZAR AL VOLVER A LA PESTAÑA
// ============================================
window.addEventListener("focus", async () => {
  await renderizarDropdownMeses();
  await renderizarReportes();
});