// ============================================
// SINCRONIZACIÓN DE TEMA Y RENDERIZADO
// ============================================
(function() {
  const temaGuardado = localStorage.getItem("finix_tema");
  const esTemaOscuro = temaGuardado === "oscuro";

  if (esTemaOscuro) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }

  let registrosCache = [];
  let registroEditando = null;

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

  document.addEventListener("DOMContentLoaded", async () => {
    // Ajustar enlaces del bottom-nav según tema
    const enlaces = document.querySelectorAll(".bottom-nav a");
    enlaces.forEach((enlace) => {
      const dataPage = enlace.getAttribute("data-page");
      if (dataPage === "billetera.html" || dataPage === "Black.html") {
        const archivoDestino = esTemaOscuro ? "Black.html" : "billetera.html";
        enlace.setAttribute("href", archivoDestino);
        enlace.setAttribute("data-page", archivoDestino);
      }
    });

    // Botón regresar dinámico
    const btnRegresar = document.getElementById("btnRegresar");
    if (btnRegresar) {
      btnRegresar.setAttribute("href", esTemaOscuro ? "Black.html" : "billetera.html");
    }

    // Cargar desde Supabase
    registrosCache = await dbObtenerRegistros();
    renderizarSeccionesEditar(registrosCache);

    // Inicializar vista de edición
    inicializarVistaEdicion();
  });

  // ============================================
  // RENDERIZAR SECCIONES EN EDITAR
  // ============================================
  function renderizarSeccionesEditar(registros) {
    registrosCache = registros;
    const contenedor = document.getElementById("contenedorSecciones");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    // ---- Sección DEUDAS ----
    const deudas = registros.filter(r => r.seccion === "deudas");
    contenedor.appendChild(
      crearSeccionEditable("deudas", "Deudas", "En lo que debes y en que va cada una", deudas)
    );

    // ---- Sección METAS ----
    const metas = registros.filter(r => r.seccion === "ahorro");
    contenedor.appendChild(
      crearSeccionEditable("metas", "Metas de Ahorro", "Tus planes a futuro", metas)
    );

    // ---- Secciones PERSONALIZADAS ----
    const personalizadas = {};
    registros.filter(r => r.seccion === "nueva").forEach(r => {
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

    Object.keys(personalizadas).forEach(nombre => {
      const data = personalizadas[nombre];
      contenedor.appendChild(
        crearSeccionPersonalizada(nombre, data.color, data.icono, data.items)
      );
    });

    // Asignar listeners de click a cada item
    contenedor.querySelectorAll(".item-editable").forEach(el => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        const registro = registrosCache.find(r => String(r.id) === String(id));
        if (registro) abrirVistaEdicion(registro);
      });
    });
  }

  // ============================================
  // CREAR SECCIÓN EDITABLE (DEUDAS / METAS)
  // ============================================
  function crearSeccionEditable(tipo, titulo, descripcion, items) {
    const seccion = document.createElement("div");
    seccion.className = "seccion-editable " + tipo;

    const icono = tipo === "deudas" ? "tarjeta.png" : "Meta.png";
    const colorRelleno = tipo === "deudas" ? "#D80202" : "#025FD8";
    const colorCirculo = tipo === "deudas" ? "#FFA1A1" : "#88BBF5";

    let itemsHTML = "";

    if (items.length === 0) {
      itemsHTML = `<div class="lista-vacia">Sin registros por ahora</div>`;
    } else {
      items.forEach(item => {
        const porcentaje = calcularPorcentaje(item);
        itemsHTML += `
          <div class="item-editable" data-id="${item.id}">
            <div class="item-header">
              <div class="item-circulo" style="background-color:${colorCirculo};">
                <img src="../iconos/${icono}" alt="" class="item-icono">
              </div>
              <h4 class="item-nombre">${item.nombre}</h4>
            </div>
            <p class="item-fecha">Vence ${formatearFecha(item.fecha)} · ${formatearMonto(item.monto)}</p>
            <div class="item-progreso-container">
              <div class="item-progreso-barra">
                <div class="item-progreso-relleno" style="width:${porcentaje}%; background-color:${colorRelleno};"></div>
              </div>
              <span class="item-progreso-texto">${porcentaje}%</span>
            </div>
          </div>
        `;
      });
    }

    seccion.innerHTML = `
      <div class="seccion-header-editable">
        <div class="seccion-circulo" style="background-color:${colorCirculo};">
          <img src="../iconos/${icono}" alt="" class="seccion-icono">
        </div>
        <h2 class="seccion-titulo">${titulo}</h2>
      </div>
      <p class="seccion-descripcion">${descripcion}</p>
      <div class="lista-items">${itemsHTML}</div>
    `;

    return seccion;
  }

  // ============================================
  // CREAR SECCIÓN PERSONALIZADA (con ícono SVG)
  // ============================================
  function crearSeccionPersonalizada(nombre, color, icono, items) {
    const seccion = document.createElement("div");
    seccion.className = "seccion-editable personalizada";
    seccion.style.backgroundColor = hexToRgba(color, 0.1);
    seccion.style.border = `1px solid ${color}`;

    const svgIcono = obtenerIconoSVG(icono);
    const svgItem = svgIcono.replace('class="personalizada-icono-svg"', 'class="personalizada-item-icono-svg"');

    let itemsHTML = "";

    if (items.length === 0) {
      itemsHTML = `<div class="lista-vacia">Sin registros por ahora</div>`;
    } else {
      items.forEach(item => {
        const porcentaje = calcularPorcentaje(item);
        itemsHTML += `
          <div class="item-editable" data-id="${item.id}">
            <div class="item-header">
              <div class="item-circulo" style="background-color:${color}; color:#FFFFFF;">
                ${svgItem}
              </div>
              <h4 class="item-nombre">${item.nombre}</h4>
            </div>
            <p class="item-fecha">Vence ${formatearFecha(item.fecha)} · ${formatearMonto(item.monto)}</p>
            <div class="item-progreso-container">
              <div class="item-progreso-barra">
                <div class="item-progreso-relleno" style="width:${porcentaje}%; background-color:${color};"></div>
              </div>
              <span class="item-progreso-texto">${porcentaje}%</span>
            </div>
          </div>
        `;
      });
    }

    seccion.innerHTML = `
      <div class="seccion-header-editable">
        <div class="seccion-circulo" style="background-color:${color}; color:#FFFFFF;">
          ${svgIcono}
        </div>
        <h2 class="seccion-titulo">${nombre}</h2>
      </div>
      <p class="seccion-descripcion">Sección personalizada</p>
      <div class="lista-items">${itemsHTML}</div>
    `;

    return seccion;
  }

  // ============================================
  // VISTA DE EDICIÓN INDIVIDUAL
  // ============================================
  function inicializarVistaEdicion() {
    // --- Botón regresar ---
    const btnReg = document.getElementById("btnRegresarEdicion");
    if (btnReg) btnReg.addEventListener("click", cerrarVistaEdicion);

    // --- Modal confirmación eliminar ---
    const btnEliminar = document.getElementById("btnEliminar");
    const modalConfirmOverlay = document.getElementById("modalConfirmOverlay");
    const btnConfirmCancelar = document.getElementById("btnConfirmCancelar");
    const btnConfirmEliminar = document.getElementById("btnConfirmEliminar");

    function abrirModalConfirm() {
      if (!modalConfirmOverlay) return;
      modalConfirmOverlay.classList.add("activo");
      document.body.style.overflow = "hidden";
    }

    function cerrarModalConfirm() {
      if (!modalConfirmOverlay) return;
      modalConfirmOverlay.classList.remove("activo");
      document.body.style.overflow = "";
    }

    if (btnEliminar) {
      btnEliminar.addEventListener("click", () => {
        if (!registroEditando) return;
        abrirModalConfirm();
      });
    }

    if (btnConfirmCancelar) {
      btnConfirmCancelar.addEventListener("click", cerrarModalConfirm);
    }

    if (modalConfirmOverlay) {
      modalConfirmOverlay.addEventListener("click", (e) => {
        if (e.target === modalConfirmOverlay) cerrarModalConfirm();
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalConfirmOverlay && modalConfirmOverlay.classList.contains("activo")) {
        cerrarModalConfirm();
      }
    });

    if (btnConfirmEliminar) {
      btnConfirmEliminar.addEventListener("click", async () => {
        if (!registroEditando) return;

        btnConfirmEliminar.disabled = true;
        btnConfirmEliminar.textContent = "Eliminando...";

        const ok = await dbEliminarRegistro(registroEditando.id);

        btnConfirmEliminar.disabled = false;
        btnConfirmEliminar.textContent = "Eliminar";

        if (!ok) {
          alert("No se pudo eliminar. Intenta de nuevo.");
          return;
        }

        cerrarModalConfirm();

        const registros = await dbObtenerRegistros();
        renderizarSeccionesEditar(registros);
        cerrarVistaEdicion();
      });
    }

    // --- Submit del formulario (guardar cambios) ---
    const form = document.getElementById("formEdicion");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!registroEditando) return;

        const tipoRec = document.querySelector('input[name="editRecordatorio"]:checked')?.value || "diario";
        const selectDia = document.getElementById("editDiaRecordatorio");

        const datosActualizados = {
          nombre: document.getElementById("editNombre").value.trim(),
          monto: leerMontoInput("editMonto"),
          fecha: document.getElementById("editFecha").value,
          recordatorio: tipoRec,
          diaRecordatorio: selectDia ? selectDia.value : null,
        };

        const btn = document.getElementById("btnGuardarCambios");
        if (btn) { btn.disabled = true; btn.textContent = "Guardando..."; }

        const ok = await dbActualizarRegistro(registroEditando.id, datosActualizados);

        if (btn) { btn.disabled = false; btn.textContent = "Guardar cambios"; }

        if (!ok) {
          alert("No se pudo guardar. Intenta de nuevo.");
          return;
        }

        const registros = await dbObtenerRegistros();
        renderizarSeccionesEditar(registros);
        cerrarVistaEdicion();
      });
    }
  }

  function abrirVistaEdicion(registro) {
    registroEditando = registro;

    const headerPrincipal = document.getElementById("headerPrincipal");
    const vistaLista = document.getElementById("contenedorSecciones");
    const vistaEdicion = document.getElementById("vistaEdicion");
    const bottomNav = document.getElementById("bottomNav");

    if (headerPrincipal) headerPrincipal.hidden = true;
    if (vistaLista) vistaLista.hidden = true;
    if (vistaEdicion) vistaEdicion.hidden = false;
    if (bottomNav) bottomNav.hidden = true;

    document.body.classList.add("modo-edicion");

    const card = document.getElementById("cardContexto");
    const circulo = document.getElementById("cardContextoCirculo");
    const icono = document.getElementById("cardContextoIcono");
    const titulo = document.getElementById("cardContextoTitulo");
    const nombre = document.getElementById("cardContextoNombre");

    let colorBase, colorCirculo, iconoSrc, tituloSeccion, usarSVG = false, svgContenido = "";

    if (registro.seccion === "deudas") {
      colorBase = "#FFEFEF";
      colorCirculo = "#FFA1A1";
      iconoSrc = "../iconos/tarjeta.png";
      tituloSeccion = "Deudas";
    } else if (registro.seccion === "ahorro") {
      colorBase = "#EEF5FF";
      colorCirculo = "#88BBF5";
      iconoSrc = "../iconos/Meta.png";
      tituloSeccion = "Metas de Ahorro";
    } else {
      const color = registro.colorSeccion || "#398869";
      colorBase = hexToRgba(color, 0.1);
      colorCirculo = color;
      tituloSeccion = registro.nombreSeccion || "Sección";
      usarSVG = true;
      svgContenido = obtenerIconoSVG(registro.iconoSeccion || "chart-bar");
    }

    if (card) {
      card.style.backgroundColor = colorBase;
      card.style.border = `1px solid ${colorCirculo}`;
      // Color neón dinámico para los textos del card en modo oscuro
      card.style.setProperty("--color-neon", colorCirculo);
    }
    if (circulo) {
      circulo.style.backgroundColor = colorCirculo;
      circulo.style.color = "#FFFFFF";
    }

    // Reemplazar el ícono del card por SVG o img según el tipo de sección
    if (usarSVG) {
      if (circulo) circulo.innerHTML = svgContenido;
    } else {
      if (icono) {
        if (!circulo.contains(icono)) {
          circulo.innerHTML = `<img src="" alt="" class="card-contexto-icono" id="cardContextoIcono">`;
        }
        const imgEl = document.getElementById("cardContextoIcono");
        if (imgEl) imgEl.src = iconoSrc;
      }
    }

    if (titulo) titulo.textContent = tituloSeccion;
    if (nombre) nombre.textContent = registro.nombre || "";

    // ---- Rellenar formulario ----
    document.getElementById("editNombre").value = registro.nombre || "";
    document.getElementById("editMonto").value = formatearMontoInput(registro.monto);
    document.getElementById("editFecha").value = registro.fecha || "";

    const valorRec = registro.recordatorio || "diario";
    const radio = document.querySelector(`input[name="editRecordatorio"][value="${valorRec}"]`);
    if (radio) radio.checked = true;
    actualizarDiasRecordatorioEdicion(valorRec, registro.diaRecordatorio);

    document.querySelectorAll('input[name="editRecordatorio"]').forEach(r => {
      r.onchange = () => actualizarDiasRecordatorioEdicion(r.value, null);
    });

    const inpMonto = document.getElementById("editMonto");
    if (inpMonto) {
      inpMonto.oninput = (e) => {
        let v = e.target.value.replace(/\D/g, "").slice(0, 15);
        e.target.value = v === "" ? "" : Number(v).toLocaleString("es-CO");
      };
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cerrarVistaEdicion() {
    const headerPrincipal = document.getElementById("headerPrincipal");
    const vistaLista = document.getElementById("contenedorSecciones");
    const vistaEdicion = document.getElementById("vistaEdicion");
    const bottomNav = document.getElementById("bottomNav");

    if (vistaEdicion) vistaEdicion.hidden = true;
    if (headerPrincipal) headerPrincipal.hidden = false;
    if (vistaLista) vistaLista.hidden = false;
    if (bottomNav) bottomNav.hidden = false;

    document.body.classList.remove("modo-edicion");
    registroEditando = null;
  }

  function formatearMontoInput(valor) {
    const n = Number(valor) || 0;
    return n === 0 ? "" : n.toLocaleString("es-CO");
  }

  function leerMontoInput(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    return Number(el.value.replace(/\D/g, "")) || 0;
  }

  function actualizarDiasRecordatorioEdicion(tipo, valorPreseleccionado) {
    const select = document.getElementById("editDiaRecordatorio");
    const grupo = document.getElementById("grupoEditDiaRecordatorio");
    if (!select) return;
    select.innerHTML = "";

    if (tipo === "diario") {
      const opt = document.createElement("option");
      opt.value = "todos";
      opt.textContent = "Todos los días";
      select.appendChild(opt);
      if (grupo) grupo.style.display = "none";
    } else if (tipo === "semanal") {
      if (grupo) grupo.style.display = "flex";
      ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].forEach((d, i) => {
        const opt = document.createElement("option");
        opt.value = i + 1;
        opt.textContent = d;
        select.appendChild(opt);
      });
    } else {
      if (grupo) grupo.style.display = "flex";
      for (let i = 1; i <= 31; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = "Día " + i;
        select.appendChild(opt);
      }
    }

    if (valorPreseleccionado) select.value = valorPreseleccionado;
  }

  // ============================================
  // UTILIDADES
  // ============================================
  function calcularPorcentaje(registro) {
    if (registro.montoTotal && registro.montoPagado) {
      return Math.min(100, Math.round((registro.montoPagado / registro.montoTotal) * 100));
    }
    return 0;
  }

  const MESES_NOMBRES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                         "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  function formatearFecha(fechaISO) {
    if (!fechaISO) return "Sin fecha";
    const fecha = new Date(fechaISO + "T00:00:00");
    return `${fecha.getDate()} ${MESES_NOMBRES[fecha.getMonth()]}`;
  }

  function formatearMonto(valor) {
    const numero = Number(valor) || 0;
    return "$" + numero.toLocaleString("es-CO");
  }

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
})();