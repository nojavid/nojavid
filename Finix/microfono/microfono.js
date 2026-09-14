/* =========================================================
   microfono.js
   Grabación de voz + visualizador de ondas reactivo al audio
   ========================================================= */
(function () {
  'use strict';

  /* ---------------- Referencias DOM ---------------- */
  const btnSalir         = document.getElementById('btnSalir');
  const btnMicrofono     = document.getElementById('btnMicrofono');
  const textoPrincipal   = document.getElementById('textoPrincipal');
  const analizando       = document.getElementById('analizando');
  const audioReproductor = document.getElementById('audioReproductor');

  /* ---------------- Configuración ---------------- */
  const NUM_BARRAS      = 44;    // nº de ondas alrededor del micrófono
  const CLAVE_PERMISO   = 'finix_mic_permitido';
  const DURACION_MINIMA = 400;   // ms mínimos para considerar válida la grabación
  const PAGINA_SALIDA   = 'finix.html';

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

  /* =========================================================
     1) PERMISOS DEL MICRÓFONO
     ========================================================= */

  // Consulta el estado del permiso sin abrir ningún diálogo
  async function estadoPermiso() {
    if (!navigator.permissions || !navigator.permissions.query) return 'desconocido';
    try {
      const p = await navigator.permissions.query({ name: 'microphone' });
      return p.state; // 'granted' | 'denied' | 'prompt'
    } catch (e) {
      // Safari / Firefox antiguos no soportan name:'microphone'
      return 'desconocido';
    }
  }

  // Obtiene el stream. Si el permiso ya fue concedido, NO vuelve a preguntar.
  async function obtenerStream() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const err = new Error('no-soportado');
      err.codigo = 'no-soportado';
      throw err;
    }

    const estado = await estadoPermiso();
    if (estado === 'denied') {
      const err = new Error('bloqueado');
      err.codigo = 'bloqueado';
      throw err;
    }

    // Si el navegador ya tiene 'granted', esta llamada NO muestra diálogo.
    return navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    });
  }

  // Escucha cambios de permiso (por si el usuario lo cambia en ajustes)
  (async function vigilarPermiso() {
    if (!navigator.permissions || !navigator.permissions.query) return;
    try {
      const p = await navigator.permissions.query({ name: 'microphone' });
      p.onchange = () => {
        if (p.state === 'granted') {
          try { localStorage.setItem(CLAVE_PERMISO, '1'); } catch (e) {}
        }
      };
    } catch (e) { /* ignorar */ }
  })();

  /* =========================================================
     2) VISUALIZADOR DE ONDAS (se inyecta dentro del círculo)
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

  // Recalcula tamaño/radio si gira el móvil o cambia el viewport
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
     3) BUCLE DE ANÁLISIS DE AUDIO -> ONDAS
     ========================================================= */

  function bucleAnalisis() {
    if (!analyser || !grabando) return;

    analyser.getByteFrequencyData(dataFrecuencia);

    const total  = dataFrecuencia.length;
    const usados = Math.floor(total * 0.35);          // zona de voz
    const mitad  = Math.floor(barras.length / 2);
    const paso   = Math.max(1, Math.floor(usados / mitad));

    for (let i = 0; i < barras.length; i++) {
      // Espejamos para que las ondas sean simétricas
      const espejo = i < mitad ? i : (barras.length - 1 - i);
      const desde  = espejo * paso;

      let max = 0;
      for (let j = 0; j < paso; j++) {
        const v = dataFrecuencia[desde + j] || 0;
        if (v > max) max = v;
      }

      // Suavizado para que no "tiemble"
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
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg'
    ];
    if (!window.MediaRecorder) return '';
    for (let i = 0; i < opciones.length; i++) {
      if (MediaRecorder.isTypeSupported(opciones[i])) return opciones[i];
    }
    return '';
  }

  async function iniciarGrabacion() {
    if (grabando || procesando) return;

    /* --- Pedir / reutilizar permiso --- */
    try {
      stream = await obtenerStream();
    } catch (err) {
      mostrarError(err);
      return;
    }

    // Permiso concedido -> lo recordamos
    try { localStorage.setItem(CLAVE_PERMISO, '1'); } catch (e) {}

    /* --- Contexto de audio + analizador --- */
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') await audioContext.resume();

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.75;
      dataFrecuencia = new Uint8Array(analyser.frequencyBinCount);

      sourceNode = audioContext.createMediaStreamSource(stream);
      sourceNode.connect(analyser);
      // OJO: no conectamos a destination para evitar realimentación
    } catch (e) {
      console.warn('No se pudo crear el analizador de audio:', e);
    }

    /* --- MediaRecorder --- */
    if (!window.MediaRecorder) {
      textoPrincipal.textContent = 'Tu navegador no soporta la grabación de audio.';
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
    mediaRecorder.start(100); // trozos cada 100 ms

    /* --- UI --- */
    grabando = true;
    inicioGrabacion = Date.now();
    btnMicrofono.classList.add('grabando');
    textoPrincipal.textContent = 'Te escucho...';
    analizando.classList.add('oculto');

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
      mediaRecorder.stop();   // dispara onstop -> alDetenerGrabacion
    } else {
      liberarMicrofono();
    }
  }

  async function alDetenerGrabacion() {
    const tipo = (mediaRecorder && mediaRecorder.mimeType) || tipoMime || 'audio/webm';
    const duracion = Date.now() - inicioGrabacion;

    liberarMicrofono();

    if (trozos.length === 0 || duracion < DURACION_MINIMA) {
      textoPrincipal.classList.remove('oculto');
      textoPrincipal.textContent = 'No se escuchó nada. Intenta de nuevo.';
      return;
    }

    const blob = new Blob(trozos, { type: tipo });
    trozos = [];

    /* --- Mostrar "Analizando..." --- */
    textoPrincipal.classList.add('oculto');
    analizando.classList.remove('oculto');
    procesando = true;

    try {
      const resultado = await procesarAudio(blob);
      analizando.classList.add('oculto');
      textoPrincipal.classList.remove('oculto');

      const url = URL.createObjectURL(blob);
      audioReproductor.src = url;

      if (resultado && resultado.texto) {
        textoPrincipal.textContent = resultado.texto;
      } else {
        textoPrincipal.textContent = 'Audio grabado correctamente.';
      }
    } catch (e) {
      console.error(e);
      analizando.classList.add('oculto');
      textoPrincipal.classList.remove('oculto');
      textoPrincipal.textContent = 'Hubo un problema al procesar el audio.';
    } finally {
      procesando = false;
    }
  }

  /* =========================================================
     5) PUNTO DE INTEGRACIÓN CON TU BACKEND
     ⬇️⬇️⬇️  AQUÍ CONECTAS TU API DE TRANSCRIPCIÓN  ⬇️⬇️⬇️
     ========================================================= */
  async function procesarAudio(blob) {
    /*
    // Ejemplo real:
    const fd = new FormData();
    fd.append('audio', blob, 'grabacion.webm');

    const resp = await fetch('https://tu-servidor.com/transcribir', {
      method: 'POST',
      body: fd
    });
    const data = await resp.json();
    return { texto: data.texto };
    */

    // Comportamiento de demo (borra esto cuando conectes tu API)
    return new Promise(function (resolve) {
      setTimeout(function () {
        resolve({ texto: null, blob: blob });
      }, 1200);
    });
  }

  /* =========================================================
     6) LIBERAR RECURSOS
     ========================================================= */
  function liberarMicrofono() {
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
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
     7) MENSAJES DE ERROR
     ========================================================= */
  function mostrarError(err) {
    let msg = 'No se pudo acceder al micrófono.';

    if (err) {
      if (err.codigo === 'bloqueado') {
        msg = 'El micrófono está bloqueado. Actívalo en los ajustes del sitio en tu navegador.';
      } else if (err.codigo === 'no-soportado') {
        msg = 'Tu navegador no permite grabar audio.';
      } else if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
        msg = 'Permiso de micrófono denegado. Actívalo en los ajustes del navegador.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'No se encontró ningún micrófono en este dispositivo.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        msg = 'El micrófono está siendo usado por otra aplicación.';
      } else if (err.name === 'OverconstrainedError') {
        msg = 'Tu micrófono no cumple los requisitos de audio.';
      }
    }

    textoPrincipal.classList.remove('oculto');
    analizando.classList.add('oculto');
    textoPrincipal.textContent = msg;
    btnMicrofono.classList.remove('grabando');
    grabando = false;
  }

  /* =========================================================
     8) EVENTOS
     ========================================================= */

  // Click en el micrófono -> iniciar / detener
  btnMicrofono.addEventListener('click', function () {
    if (procesando) return;
    if (grabando) detenerGrabacion();
    else iniciarGrabacion();
  });

  // Botón X -> volver a finix.html
  btnSalir.addEventListener('click', function () {
    // Limpieza inmediata antes de navegar
    grabando = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try { mediaRecorder.onstop = null; mediaRecorder.stop(); } catch (e) {}
    }
    liberarMicrofono();
    window.location.href = PAGINA_SALIDA;
  });

  // Si la página pierde el foco (llamada entrante, cambio de app, etc.) detenemos
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && grabando) detenerGrabacion();
  });

  /* =========================================================
     9) INICIALIZACIÓN
     ========================================================= */
  function init() {
    crearVisualizador();
    resetearBarras();

    // Mensaje inicial si es la primera vez que se usa
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