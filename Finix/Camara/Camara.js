document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");
  const btnCaptura = document.getElementById("btnCaptura");
  const mensajePermiso = document.getElementById("mensajePermiso");
  const canvas = document.getElementById("canvas");

  const seccionCamara = document.getElementById("seccionCamara");
  const seccionPreview = document.getElementById("seccionPreview");
  const imagenCapturada = document.getElementById("imagenCapturada");
  const acciones = document.getElementById("acciones");
  const btnVolver = document.getElementById("btnVolver");
  const btnEnviar = document.getElementById("btnEnviar");
  const btnCerrar = document.getElementById("btnCerrar");

  let streamActivo = null;
  let camaraLista = false;
  let fotoActual = null;

  // ===== 1. Pedir permiso y activar cámara =====
  async function iniciarCamara() {
    try {
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      console.log("🎥 Solicitando cámara...");
      streamActivo = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("✅ Stream obtenido");

      video.srcObject = streamActivo;

      video.onloadedmetadata = () => {
        console.log("📐 Metadata cargada:", video.videoWidth, "x", video.videoHeight);
        camaraLista = true;
      };

      await video.play();
      console.log("▶️ Video reproduciéndose");

      if (mensajePermiso) mensajePermiso.classList.add("oculto");

    } catch (error) {
      console.error("❌ Error al acceder a la cámara:", error);

      let texto = "No se pudo acceder a la cámara.";
      if (error.name === "NotAllowedError") {
        texto = "Permiso denegado. Habilita la cámara en los ajustes.";
      } else if (error.name === "NotFoundError") {
        texto = "No se encontró ninguna cámara.";
      } else if (error.name === "NotReadableError") {
        texto = "La cámara está siendo usada por otra app.";
      }

      if (mensajePermiso) mensajePermiso.innerHTML = `<p>${texto}</p>`;
    }
  }

  // ===== 2. Detener la cámara =====
  function detenerCamara() {
    if (streamActivo) {
      streamActivo.getTracks().forEach(t => t.stop());
      streamActivo = null;
      camaraLista = false;
      console.log("🛑 Cámara detenida");
    }
  }

  // ===== 3. Tomar la foto =====
  function tomarFoto(evento) {
    if (evento) {
      evento.preventDefault();
      evento.stopPropagation();
    }

    console.log("📸 Click en botón detectado");

    if (!streamActivo || !camaraLista || video.videoWidth === 0) {
      console.warn("⚠️ La cámara no está lista");
      return;
    }

    const ancho = video.videoWidth;
    const alto = video.videoHeight;

    canvas.width = ancho;
    canvas.height = alto;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, ancho, alto);

    fotoActual = canvas.toDataURL("image/jpeg", 0.9);
    console.log("✅ Foto capturada");

    // Detener la cámara para liberar recursos
    detenerCamara();

    // Mostrar vista previa
    imagenCapturada.src = fotoActual;
    seccionCamara.classList.add("oculta");
    seccionPreview.classList.add("visible");
    acciones.classList.add("visible");
    btnCaptura.classList.add("oculto");

    // Evento para otros scripts
    document.dispatchEvent(new CustomEvent("fotoCapturada", {
      detail: { imagen: fotoActual }
    }));
  }

  // ===== 4. Volver a tomar =====
  async function volverATomar() {
    console.log("🔄 Volviendo a tomar");

    fotoActual = null;
    imagenCapturada.src = "";

    // Ocultar preview y acciones, mostrar cámara
    seccionPreview.classList.remove("visible");
    acciones.classList.remove("visible");
    btnCaptura.classList.remove("oculto");
    seccionCamara.classList.remove("oculta");

    // Reiniciar cámara
    await iniciarCamara();
  }

  // ===== 5. Enviar foto =====
  function enviarFoto() {
    if (!fotoActual) {
      console.warn("⚠️ No hay foto para enviar");
      return;
    }

    console.log("📤 Enviando foto...");

    // Evento para que lo escuches desde otro script y hagas el envío real
    document.dispatchEvent(new CustomEvent("enviarFoto", {
      detail: { imagen: fotoActual }
    }));

    // 👉 Aquí podés hacer el fetch al backend:
    /*
    fetch("https://tu-backend.com/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imagen: fotoActual })
    })
    .then(res => res.json())
    .then(data => console.log("✅ Enviado:", data))
    .catch(err => console.error("❌ Error:", err));
    */
  }

  // ===== 6. Botón X: volver a finix.html =====
  function cerrarYRegresar() {
    console.log("↩️ Regresando a finix.html");

    // Detener la cámara antes de salir
    detenerCamara();

    // Redirigir a la página principal
    window.location.href = "../finix.html";
  }

  // ===== 7. Eventos =====
  btnCaptura.addEventListener("click", tomarFoto);
  btnVolver.addEventListener("click", volverATomar);
  btnEnviar.addEventListener("click", enviarFoto);
  btnCerrar.addEventListener("click", cerrarYRegresar);

  // Pausar cámara si la app pasa a segundo plano
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && streamActivo) {
      detenerCamara();
    } else if (!document.hidden && !streamActivo && !fotoActual) {
      iniciarCamara();
    }
  });

  // Iniciar
  iniciarCamara();
});