// ============================================
// SINCRONIZACIÓN DE TEMA Y RENDERIZADO
// ============================================
(function() {
  const temaGuardado = localStorage.getItem("finix_tema");
  const esTemaOscuro = temaGuardado === "oscuro";

  // Aplicar modo oscuro si corresponde
  if (esTemaOscuro) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }

  document.addEventListener("DOMContentLoaded", () => {
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

    // Renderizar secciones
    renderizarSeccionesEditar();
  });

  // ============================================
  // RENDERIZAR SECCIONES EN EDITAR
  // ============================================
  function renderizarSeccionesEditar() {
    const contenedor = document.getElementById("contenedorSecciones");
    if (!contenedor) return;

    const registros = obtenerRegistros();
    contenedor.innerHTML = "";

    // ---- Sección DEUDAS (siempre visible) ----
    const deudas = registros.filter(r => r.seccion === "deudas");
    contenedor.appendChild(
      crearSeccionEditable(
        "deudas",
        "Deudas",
        "En lo que debes y en que va cada una",
        deudas
      )
    );

    // ---- Sección METAS (siempre visible) ----
    const metas = registros.filter(r => r.seccion === "ahorro");
    contenedor.appendChild(
      crearSeccionEditable(
        "metas",
        "Metas de Ahorro",
        "Tus planes a futuro",
        metas
      )
    );

    // ---- Secciones PERSONALIZADAS ----
    const personalizadas = {};
    registros.filter(r => r.seccion === "nueva").forEach(r => {
      const key = r.nombreSeccion || "Sin nombre";
      if (!personalizadas[key]) {
        personalizadas[key] = {
          color: r.colorSeccion || "#398869",
          items: []
        };
      }
      personalizadas[key].items.push(r);
    });

    Object.keys(personalizadas).forEach(nombre => {
      const data = personalizadas[nombre];
      contenedor.appendChild(
        crearSeccionPersonalizada(nombre, data.color, data.items)
      );
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
          <div class="item-editable">
            <div class="item-header">
              <div class="item-circulo" style="background-color:${colorCirculo};">
                <img src="../iconos/${icono}" alt="" class="item-icono">
              </div>
              <h4 class="item-nombre">${item.nombre}</h4>
            </div>
            <p class="item-fecha">Vence ${formatearFecha(item.fecha)}</p>
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
  // CREAR SECCIÓN PERSONALIZADA
  // ============================================
  function crearSeccionPersonalizada(nombre, color, items) {
    const seccion = document.createElement("div");
    seccion.className = "seccion-editable personalizada";
    seccion.style.backgroundColor = hexToRgba(color, 0.1);
    seccion.style.border = `1px solid ${color}`;

    let itemsHTML = "";

    if (items.length === 0) {
      itemsHTML = `<div class="lista-vacia">Sin registros por ahora</div>`;
    } else {
      items.forEach(item => {
        const porcentaje = calcularPorcentaje(item);
        itemsHTML += `
          <div class="item-editable">
            <div class="item-header">
              <div class="item-circulo" style="background-color:${color};">
                <img src="../iconos/Meta.png" alt="" class="item-icono">
              </div>
              <h4 class="item-nombre">${item.nombre}</h4>
            </div>
            <p class="item-fecha">Vence ${formatearFecha(item.fecha)}</p>
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
        <div class="seccion-circulo" style="background-color:${color};">
          <img src="../iconos/Meta.png" alt="" class="seccion-icono">
        </div>
        <h2 class="seccion-titulo">${nombre}</h2>
      </div>
      <p class="seccion-descripcion">Sección personalizada</p>
      <div class="lista-items">${itemsHTML}</div>
    `;

    return seccion;
  }

  // ============================================
  // UTILIDADES
  // ============================================
  function obtenerRegistros() {
    try {
      return JSON.parse(localStorage.getItem("finix_registros")) || [];
    } catch (e) {
      return [];
    }
  }

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

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
})();