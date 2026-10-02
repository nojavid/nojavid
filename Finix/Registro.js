/* =========================================================
   Registro - Validación en vivo + Animación de iconos
   + Transición suave hacia Login.html
   ========================================================= */
(function () {
  "use strict";

  const registerScreen = document.getElementById("registerScreen");
  const form           = document.getElementById("registerForm");

  // Inputs
  const fullname  = document.getElementById("fullname");
  const email     = document.getElementById("email");
  const password  = document.getElementById("password");
  const password2 = document.getElementById("password2");

  // Fields (contenedores)
  const fieldFullname  = document.getElementById("fieldFullname");
  const fieldEmail     = document.getElementById("fieldEmail");
  const fieldPassword  = document.getElementById("fieldPassword");
  const fieldPassword2 = document.getElementById("fieldPassword2");

  // ============================================================
  // Animación de entrada
  // ============================================================
  window.addEventListener("load", () => {
    requestAnimationFrame(() => registerScreen.classList.add("active"));
    fullname.focus();
  });

  // ============================================================
  // Helpers de validación
  // ============================================================
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function marcar(campo, valido) {
    campo.classList.toggle("valid", valido);
    campo.classList.remove("error");
  }

  // ============================================================
  // Validación en vivo
  // ============================================================

  // --- Nombre completo ---
  fullname.addEventListener("focus", () => fieldFullname.classList.add("focused"));
  fullname.addEventListener("blur",  () => {
    fieldFullname.classList.remove("focused");
    if (fullname.value.trim().length >= 3) {
      marcar(fieldFullname, true);
    } else if (fullname.value.trim() === "") {
      marcar(fieldFullname, false);
    } else {
      fieldFullname.classList.add("error");
      setTimeout(() => fieldFullname.classList.remove("error"), 500);
    }
  });
  fullname.addEventListener("input", () => {
    if (fullname.value.trim().length >= 3) marcar(fieldFullname, true);
    else marcar(fieldFullname, false);
  });

  // --- Correo ---
  email.addEventListener("focus", () => fieldEmail.classList.add("focused"));
  email.addEventListener("blur",  () => {
    fieldEmail.classList.remove("focused");
    if (emailRegex.test(email.value.trim())) {
      marcar(fieldEmail, true);
    } else if (email.value.trim() === "") {
      marcar(fieldEmail, false);
    } else {
      fieldEmail.classList.add("error");
      setTimeout(() => fieldEmail.classList.remove("error"), 500);
    }
  });
  email.addEventListener("input", () => {
    if (emailRegex.test(email.value.trim())) marcar(fieldEmail, true);
    else marcar(fieldEmail, false);
  });

  // --- Contraseña ---
  password.addEventListener("focus", () => fieldPassword.classList.add("focused"));
  password.addEventListener("blur",  () => {
    fieldPassword.classList.remove("focused");
    if (password.value.length >= 6) marcar(fieldPassword, true);
    else if (password.value.length === 0) marcar(fieldPassword, false);
    else {
      fieldPassword.classList.add("error");
      setTimeout(() => fieldPassword.classList.remove("error"), 500);
    }
    // Reevaluar la confirmación
    validarCoincidencia();
  });
  password.addEventListener("input", () => {
    if (password.value.length >= 6) marcar(fieldPassword, true);
    else marcar(fieldPassword, false);
    validarCoincidencia();
  });

  // --- Repetir contraseña ---
  password2.addEventListener("focus", () => fieldPassword2.classList.add("focused"));
  password2.addEventListener("blur",  () => {
    fieldPassword2.classList.remove("focused");
    validarCoincidencia(true);
  });
  password2.addEventListener("input", () => validarCoincidencia());

  function validarCoincidencia(mostrarError) {
    const coincide = password.value.length > 0 &&
                     password.value === password2.value;
    if (coincide) {
      marcar(fieldPassword2, true);
    } else {
      marcar(fieldPassword2, false);
      if (mostrarError && password2.value !== "") {
        fieldPassword2.classList.add("error");
        setTimeout(() => fieldPassword2.classList.remove("error"), 500);
      }
    }
  }

  // ============================================================
  // Toggle mostrar / ocultar contraseña (estilo itshover)
  // ============================================================
  document.querySelectorAll(".reg-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;

      const esPassword = target.type === "password";
      target.type = esPassword ? "text" : "password";

      // Cambia la clase que controla la animación
      btn.classList.toggle("is-visible", esPassword);

      // Accesibilidad
      btn.setAttribute(
        "aria-label",
        esPassword ? "Ocultar contraseña" : "Mostrar contraseña"
      );
    });
  });

  // ============================================================
  // Submit
  // ============================================================
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre   = fullname.value.trim();
    const correo   = email.value.trim();
    const pass     = password.value;
    const pass2    = password2.value;

    const errores = [];

    if (nombre.length < 3) {
      fieldFullname.classList.add("error");
      errores.push("nombre");
    } else marcar(fieldFullname, true);

    if (!emailRegex.test(correo)) {
      fieldEmail.classList.add("error");
      errores.push("email");
    } else marcar(fieldEmail, true);

    if (pass.length < 6) {
      fieldPassword.classList.add("error");
      errores.push("password");
    } else marcar(fieldPassword, true);

    if (pass !== pass2 || pass2 === "") {
      fieldPassword2.classList.add("error");
      errores.push("password2");
    } else marcar(fieldPassword2, true);

    if (errores.length > 0) {
      // Sacudir los que tengan error
      setTimeout(() => {
        errores.forEach((id) => {
          const map = {
            nombre:    fieldFullname,
            email:     fieldEmail,
            password:  fieldPassword,
            password2: fieldPassword2
          };
          map[id].classList.remove("error");
        });
      }, 600);
      return;
    }

    // Guardar datos
    try {
      localStorage.setItem("finix_new_user", JSON.stringify({
        nombre,
        email: correo,
        createdAt: new Date().toISOString()
      }));
    } catch (err) { /* ignore */ }

    // Animación de salida y redirección a login
    registerScreen.style.transition = "opacity 0.4s ease, transform 0.4s ease";
    registerScreen.style.opacity = "0";
    registerScreen.style.transform = "translateX(40px)";

    setTimeout(() => {
      window.location.href = "Login.html";
    }, 420);
  });

  // ============================================================
  // Botón "Iniciar Sección" -> transición suave a Login
  // ============================================================
  const btnGoLogin = document.getElementById("btnGoLogin");
  if (btnGoLogin) {
    btnGoLogin.addEventListener("click", (e) => {
      e.preventDefault();
      registerScreen.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      registerScreen.style.opacity = "0";
      registerScreen.style.transform = "translateX(-40px)";
      setTimeout(() => {
        window.location.href = "Login.html";
      }, 400);
    });
  }

  // ============================================================
  // Evitar zoom con doble tap
  // ============================================================
  let lastTouch = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouch <= 300) e.preventDefault();
    lastTouch = now;
  }, { passive: false });

})();