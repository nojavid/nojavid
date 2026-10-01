/* =========================================================
   Login - Ajuste responsive + Navegación + Video + Advertencia
   Validación inteligente con resaltado de campos
   + SCROLL AUTOMÁTICO AL TOP cuando aparece el aviso
   ========================================================= */

(function () {
  "use strict";

  // ---------- Elementos pantalla 1 ----------
  const ondasTop    = document.getElementById("ondasTop");
  const logo        = document.getElementById("logo");
  const titulo      = document.getElementById("titulo");
  const subtitulo   = document.getElementById("subtitulo");
  const linea       = document.getElementById("linea");
  const descripcion = document.getElementById("descripcion");
  const ondasBottom = document.getElementById("ondasBottom");

  // ---------- Pantallas ----------
  const screen      = document.getElementById("screen");
  const loginScreen = document.getElementById("loginScreen");
  const btnBack     = document.getElementById("btnBack");
  const loginForm   = document.getElementById("loginForm");

  // ---------- Nuevos elementos ----------
  const brandVideo  = document.getElementById("brandVideo");
  const checkBox    = document.getElementById("checkBox");
  const rememberChk = document.getElementById("remember");

  // ---------- Advertencia ----------
  const warningOverlay = document.getElementById("warningOverlay");
  const warningText    = document.getElementById("warningText");

  // ---------- Inputs ----------
  const emailInput = document.getElementById("email");
  const passInput  = document.getElementById("password");

  // ---------- Medidas base ----------
  const BASE_W = 393;
  const BASE_H = 852;

  // ============================================================
  // 1. AJUSTE RESPONSIVE (pantalla 1)
  // ============================================================
  function ajustarLayout() {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const sx = (v) => (v / BASE_W) * screenW;
    const sy = (v) => (v / BASE_H) * screenH;
    const sFont = Math.min(screenW / BASE_W, screenH / BASE_H);

    ondasTop.style.left   = sx(0)   + "px";
    ondasTop.style.top    = sy(0)   + "px";
    ondasTop.style.width  = sx(352) + "px";
    ondasTop.style.height = sy(226) + "px";

    logo.style.left   = sx(147) + "px";
    logo.style.top    = sy(268) + "px";
    logo.style.width  = sx(100) + "px";
    logo.style.height = sx(100) + "px";

    titulo.style.left     = sx(66) + "px";
    titulo.style.top      = sy(379) + "px";
    titulo.style.width    = sx(261) + "px";
    titulo.style.fontSize = (40 * sFont) + "px";

    subtitulo.style.left     = sx(120) + "px";
    subtitulo.style.top      = sy(426) + "px";
    subtitulo.style.width    = sx(154) + "px";
    subtitulo.style.fontSize = (16 * sFont) + "px";

    linea.style.left  = sx(170) + "px";
    linea.style.top   = sy(468) + "px";
    linea.style.width = sx(54)  + "px";

    descripcion.style.left     = sx(89) + "px";
    descripcion.style.top      = sy(510) + "px";
    descripcion.style.width    = sx(220) + "px";
    descripcion.style.fontSize = (16 * sFont) + "px";

    ondasBottom.style.left   = sx(41) + "px";
    ondasBottom.style.top    = sy(627) + "px";
    ondasBottom.style.width  = sx(352) + "px";
    ondasBottom.style.height = sy(226) + "px";
  }

  // ============================================================
  // 2. NAVEGACIÓN ENTRE PANTALLAS
  // ============================================================
  let navegando = false;
  let videoTimers = [];

  function limpiarTimersVideo() {
    videoTimers.forEach((id) => clearTimeout(id));
    videoTimers = [];
  }

  function irAlLogin() {
    if (navegando) return;
    navegando = true;

    screen.classList.add("fade-out");

    setTimeout(() => {
      loginScreen.classList.add("active");

      // Sincronización del video
      setTimeout(() => {
        if (brandVideo) {
          brandVideo.classList.add("play-in");
          brandVideo.play().catch(() => {});

          const t1 = setTimeout(() => {
            brandVideo.classList.add("greet");
          }, 5000);

          const t2 = setTimeout(() => {
            brandVideo.classList.remove("greet");
            brandVideo.classList.add("rest");
          }, 6200);

          videoTimers.push(t1, t2);
        }

        if (emailInput) emailInput.focus();
        navegando = false;
      }, 500);
    }, 250);
  }

  function volverAlInicio() {
    if (navegando) return;
    navegando = true;

    loginScreen.classList.remove("active");

    // Resetear scroll del login al inicio para la próxima vez
    loginScreen.scrollTop = 0;

    if (brandVideo) {
      limpiarTimersVideo();
      brandVideo.pause();
      brandVideo.currentTime = 0;
      brandVideo.classList.remove("play-in", "greet", "rest");
    }

    setTimeout(() => {
      screen.classList.remove("fade-out");
      screen.style.opacity = "1";
      screen.style.transform = "scale(1)";
      screen.style.pointerEvents = "auto";
      ajustarLayout();

      setTimeout(() => {
        navegando = false;
      }, 300);
    }, 250);
  }

  // ============================================================
  // 3. DETECTAR CLIC Y SWIPE EN LA BIENVENIDA
  // ============================================================
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;

  screen.addEventListener("click", (e) => {
    if (e.target.closest(".hint")) return;
    irAlLogin();
  });

  screen.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  screen.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    if (distancia > 40 && dt < 600) irAlLogin();
  }, { passive: true });

  let mouseStartX = 0, mouseStartY = 0;
  screen.addEventListener("mousedown", (e) => {
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
  });
  screen.addEventListener("mouseup", (e) => {
    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;
    if (Math.sqrt(dx * dx + dy * dy) > 40) irAlLogin();
  });

  // ============================================================
  // 4. BOTÓN ATRÁS
  // ============================================================
  btnBack.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    volverAlInicio();
  });

  // ============================================================
  // 5. CHECK "RECORDAR CUENTA"
  // ============================================================
  rememberChk.addEventListener("change", () => {
    checkBox.classList.toggle("checked", rememberChk.checked);
  });

  // ============================================================
  // 5.5. MOSTRAR ADVERTENCIA (toast animado)
  //      + resaltar campo + SCROLL AUTOMÁTICO AL TOP
  // ============================================================
  function mostrarAdvertencia(mensaje, campo) {
    warningText.textContent = mensaje;
    warningOverlay.classList.add("show");

    // Quitar resaltados previos
    document.querySelectorAll(".field.error").forEach((f) => {
      f.classList.remove("error");
    });

    // Resaltar el campo que dio error (si se especifica)
    if (campo) {
      const input = document.getElementById(campo);
      if (input) {
        const field = input.closest(".field");
        // Forzar reflow para reiniciar la animación de shake
        void field.offsetWidth;
        field.classList.add("error");
      }
    }

    // ===== SCROLL AUTOMÁTICO AL TOP DEL LOGIN =====
    // Subimos el scroll del login-screen hasta arriba del todo
    // para que el aviso (fixed) se vea en un contexto limpio.
    requestAnimationFrame(() => {
      loginScreen.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  // Cerrar la advertencia al hacer clic fuera de la caja
  warningOverlay.addEventListener("click", (e) => {
    if (e.target === warningOverlay) {
      warningOverlay.classList.remove("show");
    }
  });

  // Quitar el resaltado cuando el usuario empiece a escribir
  emailInput.addEventListener("input", () => {
    emailInput.closest(".field").classList.remove("error");
  });
  passInput.addEventListener("input", () => {
    passInput.closest(".field").classList.remove("error");
  });

  // ============================================================
  // 6. FORMULARIO → VALIDACIÓN INTELIGENTE + REDIRIGE A finix.html
  // ============================================================
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email    = emailInput.value.trim();
    const password = passInput.value.trim();

    const emailVacio    = email === "";
    const passwordVacio = password === "";

    // ---------- Caso 1: ambos vacíos ----------
    if (emailVacio && passwordVacio) {
      mostrarAdvertencia("Por favor completa todos los campos", null);
      return;
    }

    // ---------- Caso 2: solo correo vacío ----------
    if (emailVacio && !passwordVacio) {
      mostrarAdvertencia("El campo de correo electrónico está vacío", "email");
      return;
    }

    // ---------- Caso 3: solo contraseña vacía ----------
    if (!emailVacio && passwordVacio) {
      mostrarAdvertencia("El campo de contraseña está vacío", "password");
      return;
    }

    // ---------- Caso 4: correo con formato inválido ----------
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      mostrarAdvertencia("Por favor ingresa un correo válido", "email");
      return;
    }

    // ---------- Caso 5: contraseña muy corta ----------
    if (password.length < 6) {
      mostrarAdvertencia("La contraseña debe tener al menos 6 caracteres", "password");
      return;
    }

    // ---------- Todo correcto: guardar y redirigir ----------
    try {
      localStorage.setItem("finix_user", JSON.stringify({
        email: email,
        remember: rememberChk.checked,
        loginAt: new Date().toISOString()
      }));
    } catch (err) {
      console.warn("No se pudo guardar la sesión:", err);
    }

    loginScreen.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    loginScreen.style.opacity = "0";
    loginScreen.style.transform = "translateX(-30px)";

    setTimeout(() => {
      window.location.href = "finix.html";
    }, 400);
  });

  // ============================================================
  // 7. EVENTOS DE RESIZE
  // ============================================================
  window.addEventListener("load", ajustarLayout);
  window.addEventListener("resize", ajustarLayout);
  window.addEventListener("orientationchange", () => {
    setTimeout(ajustarLayout, 200);
  });

  // ============================================================
  // 8. EVITAR ZOOM CON DOBLE TAP
  // ============================================================
  let lastTouch = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouch <= 300) e.preventDefault();
    lastTouch = now;
  }, { passive: false });

})();