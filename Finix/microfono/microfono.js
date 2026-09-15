/* =========================================================
   microfono.js — Grabación + IA (proxy seguro Cloudflare)
   + tarjetas editables + "Agregar más" + "Guardar datos"
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- ENDPOINT del Worker ----------------
     ⚠️ URL corregida: finix-AI-proxy (no finix-IA-proxy) */
  const IA_ENDPOINT = 'https://finix-ai-proxy.nojavid-finix.workers.dev';

  /* ---------------- DOM ---------------- */
  const btnSalir         = document.getElementById('btnSalir');
  const btnMicrofono     = document.getElementById('btnMicrofono');
  const textoPrincipal   = document.getElementById('textoPrincipal');
  const analizando       = document.getElementById('analizando');
  const audioReproductor = document.getElementById('audioReproductor');
  const listaGastos      = document.getElementById('listaGastos');
  const acciones         = document.getElementById('acciones');
  const btnAgregarMas    = document.getElementById('btnAgregarMas');
  const btnGuardar       = document.getElementById('btnGuardar');
  const modalEdicion     = document.getElementById('modalEdicion');
  const editIcono        = document.getElementById('editIcono');
  const editNombre       = document.getElementById('editNombre');
  const editValor        = document.getElementById('editValor');
  const modalCancelar    = document.getElementById('modalCancelar');
  const modalGuardar     = document.getElementById('modalGuardar');

  /* ---------------- Config ---------------- */
  const NUM_BARRAS      = 44;
  const CLAVE_PERMISO   = 'finix_mic_permitido';
  const DURACION_MINIMA = 400;
  const PAGINA_SALIDA   = 'finix.html';
  const CLAVE_STORAGE   = 'finix_gastos_pendientes';

  /* ---------------- Estado ---------------- */
  let stream          = null;
  let audioContext    = null;
  let analyser        = null;
  let sourceNode      = null;
  let mediaRecorder   = null;
  let trozos          = [];
  let grabando        = false;
  let procesando      = false;
  let rafId           = null;
  let dataFrecuencia  = null;
  let barras          = [];
  let visualizador    = null;
  let inicioGrabacion = 0;
  let tipoMime        = '';
  let gastos          = [];      // [{id, tipo, icono, nombre, valor}]
  let gastoEditando   = null;    // id del gasto en edición

  /* =========================================================
     UTILIDADES
     ========================================================= */
  function uid() {
    return 'g_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }
  function formatearCOP(valor) {
    return '$' + (Number(valor) || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 });
  }
  function escaparHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function mostrarMensaje(msg) {
    analizando.classList.add('oculto');
    listaGastos.classList.add('oculto');
    acciones.classList.add('oculto');
    textoPrincipal.classList.remove('oculto');
    textoPrincipal.textContent = msg;
  }

  /* =========================================================
     1) PERMISOS
     ========================================================= */
  async function estadoPermiso() {
    if (!navigator.permissions || !navigator.permissions.query) return 'desconocido';
    try {
      const p = await navigator.permissions.query({ name: 'microphone' });
      return p.state;
    } catch (e) { return 'desconocido'; }
  }
  async function obtenerStream() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = new Error('no-soportado'); err.codigo = 'no-soportado'; throw err;
    }
    const estado = await estadoPermiso();
    if (estado === 'denied') {
      const err = new Error('bloqueado'); err.codigo = 'bloqueado'; throw err;
    }
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false
    });
  }
  (async function vigilarPermiso() {
    if (!navigator.permissions || !navigator.permissions.query) return;
    try {
      const p = await navigator.permissions.query({ name: 'microphone' });
      p.onchange = () => {
        if (p.state === 'granted') { try { localStorage.setItem(CLAVE_PERMISO, '1'); } catch (e) {} }
      };
    } catch (e) {}
  })();

  /* =========================================================
     2) VISUALIZADOR DE ONDAS
     ========================================================= */
  function crearVisualizador() {
    if (visualizador) return;
    visualizador = document.createElement('div');
    visualizador.className = 'visualizador';

    const alto  = Math.round(Math.min(42, Math.max(24, window.innerWidth * 0.075)));
    const radio = (btnMicrofono.offsetWidth || 84) / 2 + 6;

    const frag = document.createDocumentFragment();
    barras = [];

    for (let i = 0; i < NUM_BARRAS; i++) {
      const angulo = (360 / NUM_BARRAS) * i;
      const barra  = document.createElement('span');
      barra.className = 'onda-barra';
      barra.style.height    = alto + 'px';
      barra.style.marginTop = (-alto) + 'px';
      barra._angulo = angulo;
      barra._radio  = radio;
      barra._base   = 'rotate(' + angulo + 'deg) translateY(-' + radio + 'px)';
      barra._nivel  = 0;
      barra.style.transform = barra._base + ' scaleY(0.05)';
      barra.style.opacity   = '0';
      barras.push(barra);
      frag.appendChild(barra);
    }
    visualizador.appendChild(frag);
    btnMicrofono.appendChild(visualizador);
  }
  function resetearBarras() {
    for (let i = 0; i < barras.length; i++) {
      barras[i]._nivel = 0;
      barras[i].style.transform = barras[i]._base + ' scaleY(0.05)';
      barras[i].style.opacity = '0';
    }
  }
  function recalcularVisualizador() {
    if (!visualizador) return;
    const alto  = Math.round(Math.min(42, Math.max(24, window.innerWidth * 0.075)));
    const radio = (btnMicrofono.offsetWidth || 84) / 2 + 6;
    for (let i = 0; i < barras.length; i++) {
      const b = barras[i];
      b.style.height    = alto + 'px';
      b.style.marginTop = (-alto) + 'px';
      b._radio = radio;
      b._base  = 'rotate(' + b._angulo + 'deg) translateY(-' + radio + 'px)';
    }
  }
  window.addEventListener('resize', recalcularVisualizador);
  window.addEventListener('orientationchange', () => setTimeout(recalcularVisualizador, 250));

  /* =========================================================
     3) BUCLE DE ANÁLISIS
     ========================================================= */
  function bucleAnalisis() {
    if (!analyser || !grabando) return;
    analyser.getByteFrequencyData(dataFrecuencia);

    const total  = dataFrecuencia.length;
    const usados = Math.floor(total * 0.35);
    const mitad  = Math.floor(barras.length / 2);
    const paso   = Math.max(1, Math.floor(usados / mitad));

    for (let i = 0; i < barras.length; i++) {
      const espejo = i < mitad ? i : (barras.length - 1 - i);
      const desde  = espejo * paso;
      let max = 0;
      for (let j = 0; j < paso; j++) {
        const v = dataFrecuencia[desde + j] || 0;
        if (v > max) max = v;
      }
      const objetivo = Math.min(1, max / 190);
      const nivel    = barras[i]._nivel * 0.55 + objetivo * 0.45;
      barras[i]._nivel = nivel;
      const escala   = 0.05 + nivel * 1.15;
      const opacidad = Math.min(1, nivel * 2.2);
      barras[i].style.transform = barras[i]._base + ' scaleY(' + escala.toFixed(3) + ')';
      barras[i].style.opacity   = opacidad.toFixed(2);
    }
    rafId = requestAnimationFrame(bucleAnalisis);
  }

  /* =========================================================
     4) GRABACIÓN
     ========================================================= */
  function elegirMimeType() {
    const opciones = [
      'audio/webm;codecs=opus', 'audio/webm',
      'audio/ogg;codecs=opus', 'audio/mp4', 'audio/mpeg'
    ];
    if (!window.MediaRecorder) return '';
    for (let i = 0; i < opciones.length; i++) {
      if (MediaRecorder.isTypeSupported(opciones[i])) return opciones[i];
    }
    return '';
  }

  async function iniciarGrabacion() {
    if (grabando || procesando) return;

    textoPrincipal.classList.remove('oculto');
    listaGastos.classList.add('oculto');
    acciones.classList.add('oculto');
    analizando.classList.add('oculto');

    try {
      stream = await obtenerStream();
    } catch (err) { mostrarError(err); return; }

    try { localStorage.setItem(CLAVE_PERMISO, '1'); } catch (e) {}

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') await audioContext.resume();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      dataFrecuencia = new Uint8Array(analyser.frequencyBinCount);
      sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNode.connect(analyser);
    } catch (e) { console.warn('Analizador no disponible:', e); }

    if (!window.MediaRecorder) {
      mostrarMensaje('Tu navegador no soporta la grabación de audio.');
      liberarMicrofono();
      return;
    }

    trozos = [];
    tipoMime = elegirMimeType();
    try {
      mediaRecorder = tipoMime
        ? new MediaRecorder(stream, { mimeType: tipoMime })
        : new MediaRecorder(stream);
    } catch (e) {
      mediaRecorder = new MediaRecorder(stream);
      tipoMime = mediaRecorder.mimeType || '';
    }

    mediaRecorder.ondataavailable = function (e) {
      if (e.data && e.data.size > 0) trozos.push(e.data);
    };
    mediaRecorder.onstop = alDetenerGrabacion;
    mediaRecorder.start(100);

    grabando = true;
    inicioGrabacion = Date.now();
    btnMicrofono.classList.add('grabando');
    textoPrincipal.textContent = 'Te escucho...';

    crearVisualizador();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(bucleAnalisis);
  }

  function detenerGrabacion() {
    if (!grabando) return;
    grabando = false;
    btnMicrofono.classList.remove('grabando');
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    resetearBarras();
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    } else {
      liberarMicrofono();
    }
  }

  async function alDetenerGrabacion() {
    const tipo = (mediaRecorder && mediaRecorder.mimeType) || tipoMime || 'audio/webm';
    const duracion = Date.now() - inicioGrabacion;
    liberarMicrofono();

    if (trozos.length === 0 || duracion < DURACION_MINIMA) {
      mostrarMensaje('No se escuchó nada. Intenta de nuevo.');
      return;
    }

    const blob = new Blob(trozos, { type: tipo });
    trozos = [];

    // Mostrar animación IA
    textoPrincipal.classList.add('oculto');
    listaGastos.classList.add('oculto');
    acciones.classList.add('oculto');
    analizando.classList.remove('oculto');
    procesando = true;

    try {
      const resultado = await procesarAudio(blob);
      analizando.classList.add('oculto');

      if (!resultado || !Array.isArray(resultado.gastos) || resultado.gastos.length === 0) {
        mostrarMensaje(
          'No pude identificar ningún gasto. Intenta algo como: ' +
          '"comida 50 mil y transporte 20 mil".'
        );
        return;
      }

      // Añadir gastos nuevos a la lista existente
      resultado.gastos.forEach(g => {
        gastos.push({
          id: uid(),
          tipo: g.tipo || 'gasto',
          icono: g.icono || '💸',
          nombre: g.nombre,
          valor: Number(g.valor) || 0,
        });
      });

      renderizarGastos();
      textoPrincipal.classList.add('oculto');
      listaGastos.classList.remove('oculto');
      acciones.classList.remove('oculto');

    } catch (err) {
      console.error(err);
      analizando.classList.add('oculto');
      mostrarMensaje(err && err.mensajeUsuario
        ? err.mensajeUsuario
        : 'Hubo un problema al procesar el audio. Intenta de nuevo.');
    } finally {
      procesando = false;
    }
  }

  /* =========================================================
     5) LLAMADA AL WORKER
     ========================================================= */
  async function procesarAudio(blob) {
    const fd = new FormData();
    fd.append('audio', blob, 'grabacion.webm');

    let resp;
    try {
      resp = await fetch(IA_ENDPOINT, { method: 'POST', body: fd });
    } catch (netErr) {
      const e = new Error('network');
      e.mensajeUsuario = 'No pude conectar con el servidor. Revisa tu conexión.';
      throw e;
    }

    if (!resp.ok) {
      let detalle = '';
      try { detalle = (await resp.json()).error || ''; } catch (e) {}
      const err = new Error('server');
      err.mensajeUsuario = detalle || 'El servidor devolvió un error. Intenta más tarde.';
      throw err;
    }

    let data;
    try { data = await resp.json(); }
    catch (e) {
      const err = new Error('bad-json');
      err.mensajeUsuario = 'La IA devolvió un formato incorrecto.';
      throw err;
    }

    if (!data || !Array.isArray(data.gastos)) {
      const err = new Error('bad-shape');
      err.mensajeUsuario = 'La IA no devolvió datos válidos.';
      throw err;
    }

    return data;
  }

  /* =========================================================
     6) RENDERIZADO DE TARJETAS
     ========================================================= */
  function renderizarGastos() {
    listaGastos.innerHTML = '';
    gastos.forEach(g => {
      const card = document.createElement('div');
      card.className = 'tarjeta-gasto';
      card.dataset.id = g.id;
      card.innerHTML =
        '<span class="tg-icono">' + escaparHTML(g.icono) + '</span>' +
        '<div class="tg-info">' +
          '<span class="tg-nombre">' + escaparHTML(g.nombre) + '</span>' +
          '<span class="tg-valor">' + formatearCOP(g.valor) + '</span>' +
        '</div>' +
        '<span class="tg-editar">✎</span>';
      card.addEventListener('click', () => abrirModalEdicion(g.id));
      listaGastos.appendChild(card);
    });
  }

  /* =========================================================
     7) MODAL DE EDICIÓN
     ========================================================= */
  function abrirModalEdicion(id) {
    const g = gastos.find(x => x.id === id);
    if (!g) return;
    gastoEditando = id;
    editIcono.value = g.icono;
    editNombre.value = g.nombre;
    editValor.value = g.valor;
    modalEdicion.classList.remove('oculto');
    setTimeout(() => editNombre.focus(), 50);
  }
  function cerrarModalEdicion() {
    gastoEditando = null;
    modalEdicion.classList.add('oculto');
  }
  function guardarEdicion() {
    if (!gastoEditando) return;
    const g = gastos.find(x => x.id === gastoEditando);
    if (!g) { cerrarModalEdicion(); return; }

    const nombre = editNombre.value.trim();
    const valor  = Math.round(Number(editValor.value) || 0);
    const icono  = (editIcono.value || '💸').trim().slice(0, 4);

    if (!nombre) { alert('El nombre no puede estar vacío.'); return; }
    if (valor <= 0) { alert('El valor debe ser mayor a 0.'); return; }

    g.nombre = nombre;
    g.valor = valor;
    g.icono = icono;

    renderizarGastos();
    cerrarModalEdicion();
  }

  /* =========================================================
     8) BOTONES PRINCIPALES
     ========================================================= */
  function agregarMas() {
    listaGastos.classList.add('oculto');
    acciones.classList.add('oculto');
    textoPrincipal.classList.remove('oculto');
    textoPrincipal.textContent = 'Toca el micrófono para seguir agregando gastos.';
  }

  function guardarDatos() {
    if (gastos.length === 0) {
      alert('No hay gastos para guardar.');
      return;
    }
    try {
      localStorage.setItem(CLAVE_STORAGE, JSON.stringify(gastos));
    } catch (e) {}
    console.log('Gastos guardados:', gastos);
    alert('✅ ' + gastos.length + ' movimiento(s) guardado(s) correctamente.');
    // Aquí luego puedes redirigir a finix.html:
    // window.location.href = PAGINA_SALIDA;
  }

  /* =========================================================
     9) LIBERAR RECURSOS
     ========================================================= */
  function liberarMicrofono() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    if (sourceNode) { try { sourceNode.disconnect(); } catch (e) {} sourceNode = null; }
    if (audioContext && audioContext.state !== 'closed') {
      try { audioContext.close(); } catch (e) {}
    }
    audioContext = null;
    analyser = null;
    dataFrecuencia = null;
    mediaRecorder = null;
  }

  /* =========================================================
     10) MENSAJES DE ERROR
     ========================================================= */
  function mostrarError(err) {
    let msg = 'No se pudo acceder al micrófono.';
    if (err) {
      if (err.codigo === 'bloqueado') {
        msg = 'El micrófono está bloqueado. Actívalo en los ajustes del sitio.';
      } else if (err.codigo === 'no-soportado') {
        msg = 'Tu navegador no permite grabar audio.';
      } else if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
        msg = 'Permiso de micrófono denegado. Actívalo en los ajustes del navegador.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No se encontró ningún micrófono en este dispositivo.';
      } else if (err.name === 'NotReadableError') {
        msg = 'El micrófono está siendo usado por otra aplicación.';
      }
    }
    mostrarMensaje(msg);
    btnMicrofono.classList.remove('grabando');
    grabando = false;
  }

  /* =========================================================
     11) EVENTOS
     ========================================================= */
  btnMicrofono.addEventListener('click', function () {
    if (procesando) return;
    if (grabando) detenerGrabacion();
    else iniciarGrabacion();
  });

  btnSalir.addEventListener('click', function () {
    grabando = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try { mediaRecorder.onstop = null; mediaRecorder.stop(); } catch (e) {}
    }
    liberarMicrofono();
    window.location.href = PAGINA_SALIDA;
  });

  btnAgregarMas.addEventListener('click', agregarMas);
  btnGuardar.addEventListener('click', guardarDatos);
  modalCancelar.addEventListener('click', cerrarModalEdicion);
  modalGuardar.addEventListener('click', guardarEdicion);
  modalEdicion.addEventListener('click', function (e) {
    if (e.target === modalEdicion) cerrarModalEdicion();
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && grabando) detenerGrabacion();
  });

  /* =========================================================
     12) INIT
     ========================================================= */
  function init() {
    crearVisualizador();
    resetearBarras();
    (async function () {
      const estado = await estadoPermiso();
      if (estado === 'prompt') {
        textoPrincipal.textContent =
          'Toca el micrófono y acepta el permiso para empezar a grabar.';
      }
    })();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();