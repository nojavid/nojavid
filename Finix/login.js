/* =========================================================
   Login - Ajuste responsive + Navegación
   ========================================================= */

(function () {
  "use strict";

  // ---------- Elementos pantalla 1 (bienvenida) ----------
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

  // ---------- Medidas base del diseño original ----------
  const BASE_W = 393;
  const BASE_H = 852;

  // ============================================================
  // 1. AJUSTE RESPONSIVE
  // ============================================================
  function ajustarLayout() {
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    const sx = (v) => (v / BASE_W) * screenW;
    const sy = (v) => (v / BASE_H) * screenH;
    const sFont = Math.min(screenW / BASE_W, screenH / BASE_H);

    // ---- 1. Ondas superiores ----
    ondasTop.style.left   = sx(0)   + "px";
    ondasTop.style.top    = sy(0)   + "px";
    ondasTop.style.width  = sx(352) + "px";
    ondasTop.style.height = sy(226) + "px";

    // ---- 2. Logo central ----
    logo.style.left   = sx(147) + "px";
    logo.style.top    = sy(268) + "px";
    logo.style.width  = sx(100) + "px";
    logo.style.height = sx(100) + "px";

    // ---- 3. Título ----
    titulo.style.left     = sx(66) + "px";
    titulo.style.top      = sy(379) + "px";
    titulo.style.width    = sx(261) + "px";
    titulo.style.fontSize = (40 * sFont) + "px";

    // ---- 4. Subtítulo ----
    subtitulo.style.left     = sx(120) + "px";
    subtitulo.style.top      = sy(426) + "px";
    subtitulo.style.width    = sx(154) + "px";
    subtitulo.style.fontSize = (16 * sFont) + "px";

    // ---- 5. Línea ----
    linea.style.left  = sx(170) + "px";
    linea.style.top   = sy(468) + "px";
    linea.style.width = sx(54)  + "px";

    // ---- 6. Descripción ----
    descripcion.style.left     = sx(89) + "px";
    descripcion.style.top      = sy(510) + "px";
    descripcion.style.width    = sx(220) + "px";
    descripcion.style.fontSize = (16 * sFont) + "px";

    // ---- 7. Ondas inferiores ----
    ondasBottom.style.left   = sx(41) + "px";
    ondasBottom.style.top    = sy(627) + "px";
    ondasBottom.style.width  = sx(352) + "px";
    ondasBottom.style.height = sy(226) + "px";
  }

  // ============================================================
  // 2. NAVEGACIÓN ENTRE PANTALLAS
  // ============================================================
  let navegando = false;

  /**
   * Ir de la bienvenida → login
   */
  function irAlLogin() {
    if (navegando) return;
    navegando = true;

    // Fade-out de la bienvenida
    screen.classList.add("fade-out");

    // Fade-in del login después de un pequeño delay
    setTimeout(() => {
      loginScreen.classList.add("active");

      // Enfocar el primer input después de la transición
      setTimeout(() => {
        const emailInput = document.getElementById("email");
        if (emailInput) emailInput.focus();
        navegando = false;
      }, 500);
    }, 250);
  }

  /**
   * Volver del login → bienvenida
   */
  function volverAlInicio() {
    if (navegando) return;
    navegando = true;

    // 1. Ocultamos el login
    loginScreen.classList.remove("active");

    // 2. Restauramos la bienvenida
    setTimeout(() => {
      screen.classList.remove("fade-out");
      screen.style.opacity = "1";
      screen.style.transform = "scale(1)";
      screen.style.pointerEvents = "auto";

      // 3. Reajustamos el layout
      ajustarLayout();

      // 4. Liberamos el flag
      setTimeout(() => {
        navegando = false;
      }, 300);
    }, 250);
  }

  // ============================================================
  // 3. DETECTAR CLIC Y SWIPE EN LA BIENVENIDA
  // ============================================================
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  // ---- CLIC / TAP ----
  screen.addEventListener("click", (e) => {
    if (e.target.closest(".hint")) return;
    irAlLogin();
  });

  // ---- TOUCH START ----
  screen.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  // ---- TOUCH END (swipe) ----
  screen.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const dt = Date.now() - touchStartTime;
    const distancia = Math.sqrt(dx * dx + dy * dy);

    if (distancia > 40 && dt < 600) {
      irAlLogin();
    }
  }, { passive: true });

  // ---- MOUSE (desktop) ----
  let mouseStartX = 0;
  let mouseStartY = 0;
  screen.addEventListener("mousedown", (e) => {
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
  });
  screen.addEventListener("mouseup", (e) => {
    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;
    const distancia = Math.sqrt(dx * dx + dy * dy);
    if (distancia > 40) {
      irAlLogin();
    }
  });

  // ============================================================
  // 4. BOTÓN ATRÁS
  // ============================================================
  btnBack.addEventListener("click", (e) => {
    e.stopPropagation();
    e.preventDefault();
    volverAlInicio();
  });

  btnBack.addEventListener("touchend", (e) => {
    e.stopPropagation();
    e.preventDefault();
    volverAlInicio();
  }, { passive: false });

  // ============================================================
  // 5. FORMULARIO DE LOGIN → REDIRIGE A finix.html
  // ============================================================
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // Validación: campos vacíos
    if (!email || !password) {
      alert("Por favor completa todos los campos");
      return;
    }

    // Validación: formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Por favor ingresa un correo válido");
      return;
    }

    // Validación: longitud de contraseña
    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    // Guardar sesión (opcional)
    try {
      localStorage.setItem("finix_user", JSON.stringify({
        email: email,
        loginAt: new Date().toISOString()
      }));
    } catch (err) {
      console.warn("No se pudo guardar la sesión:", err);
    }

    // Animación de salida
    loginScreen.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    loginScreen.style.opacity = "0";
    loginScreen.style.transform = "translateX(-30px)";

    // Redirigir a finix.html después de la animación
    setTimeout(() => {
      window.location.href = "finix.html";
    }, 400);
  });

  // ============================================================
  // 6. EVENTOS DE RESIZE
  // ============================================================
  window.addEventListener("load", ajustarLayout);
  window.addEventListener("resize", ajustarLayout);
  window.addEventListener("orientationchange", () => {
    setTimeout(ajustarLayout, 200);
  });

  // ============================================================
  // 7. EVITAR ZOOM CON DOBLE TAP
  // ============================================================
  let lastTouch = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouch <= 300) e.preventDefault();
    lastTouch = now;
  }, { passive: false });

})();