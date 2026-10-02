/* =========================================================
   Registro - Validación en vivo + Supabase (Email + Google)
   ========================================================= */
(function () {
  "use strict";

  const SUPABASE_URL = 'https://dfhmekwkhsxvjuojuruv.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_TxNdB8vq6tv0c12IWJ8GwQ_zCoUN4v8';

  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const registerScreen = document.getElementById("registerScreen");
  const form           = document.getElementById("registerForm");

  const fullname  = document.getElementById("fullname");
  const email     = document.getElementById("email");
  const password  = document.getElementById("password");
  const password2 = document.getElementById("password2");

  const fieldFullname  = document.getElementById("fieldFullname");
  const fieldEmail     = document.getElementById("fieldEmail");
  const fieldPassword  = document.getElementById("fieldPassword");
  const fieldPassword2 = document.getElementById("fieldPassword2");

  window.addEventListener("load", () => {
    requestAnimationFrame(() => registerScreen.classList.add("active"));
    fullname.focus();
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function marcar(campo, valido) {
    campo.classList.toggle("valid", valido);
    campo.classList.remove("error");
  }

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

  password.addEventListener("focus", () => fieldPassword.classList.add("focused"));
  password.addEventListener("blur",  () => {
    fieldPassword.classList.remove("focused");
    if (password.value.length >= 6) marcar(fieldPassword, true);
    else if (password.value.length === 0) marcar(fieldPassword, false);
    else {
      fieldPassword.classList.add("error");
      setTimeout(() => fieldPassword.classList.remove("error"), 500);
    }
    validarCoincidencia();
  });
  password.addEventListener("input", () => {
    if (password.value.length >= 6) marcar(fieldPassword, true);
    else marcar(fieldPassword, false);
    validarCoincidencia();
  });

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

  document.querySelectorAll(".reg-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;

      const esPassword = target.type === "password";
      target.type = esPassword ? "text" : "password";

      btn.classList.toggle("is-visible", esPassword);
      btn.setAttribute(
        "aria-label",
        esPassword ? "Ocultar contraseña" : "Mostrar contraseña"
      );
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = fullname.value.trim();
    const correo = email.value.trim();
    const pass   = password.value;
    const pass2  = password2.value;

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

    const btnSubmit = document.getElementById("btnSubmit");
    const spanBtn = btnSubmit.querySelector("span");
    const textoOriginal = spanBtn.textContent;
    btnSubmit.disabled = true;
    spanBtn.textContent = "Creando cuenta...";

    try {
      const { data, error } = await supabase.auth.signUp({
        email: correo,
        password: pass,
        options: {
          data: { fullname: nombre }
        }
      });

      if (error) {
        console.error("Error Supabase:", error);

        let mensaje = error.message;

        if (error.message.toLowerCase().includes("already registered") ||
            error.message.toLowerCase().includes("already been registered") ||
            error.message.toLowerCase().includes("user already exists")) {
          mensaje = "Este correo ya está registrado. Intenta iniciar sesión.";
          fieldEmail.classList.add("error");
          setTimeout(() => fieldEmail.classList.remove("error"), 2000);
        } else if (error.message.toLowerCase().includes("password")) {
          mensaje = "La contraseña no cumple con los requisitos mínimos.";
          fieldPassword.classList.add("error");
          setTimeout(() => fieldPassword.classList.remove("error"), 2000);
        } else if (error.message.toLowerCase().includes("email")) {
          mensaje = "El correo electrónico no es válido.";
          fieldEmail.classList.add("error");
          setTimeout(() => fieldEmail.classList.remove("error"), 2000);
        }

        alert("❌ " + mensaje);
        btnSubmit.disabled = false;
        spanBtn.textContent = textoOriginal;
        return;
      }

      console.log("✅ Usuario creado:", data.user);

      try {
        localStorage.setItem("finix_new_user", JSON.stringify({
          nombre,
          email: correo,
          supabaseId: data.user?.id,
          createdAt: new Date().toISOString()
        }));
      } catch (err) { /* ignore */ }

      registerScreen.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      registerScreen.style.opacity = "0";
      registerScreen.style.transform = "translateX(40px)";

      setTimeout(() => {
        window.location.href = "Login.html";
      }, 420);

    } catch (err) {
      console.error("Error inesperado:", err);
      alert("❌ Hubo un error inesperado. Intenta de nuevo.");
      btnSubmit.disabled = false;
      spanBtn.textContent = textoOriginal;
    }
  });

  const googleRegistroBtn = document.getElementById("googleRegistroBtn");
  if (googleRegistroBtn) {
    googleRegistroBtn.addEventListener("click", async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://nojavid.github.io/nojavid/Finix/Login.html'
        }
      });

      if (error) {
        console.error("Error al registrarse con Google:", error);
        alert("Hubo un error al conectar con Google. Intenta de nuevo.");
      }
    });
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
      console.log("✅ Sesión de Google detectada:", session.user);

      try {
        localStorage.setItem("finix_user", JSON.stringify({
          email: session.user.email,
          name: session.user.user_metadata?.full_name ||
                session.user.user_metadata?.name ||
                session.user.user_metadata?.fullname ||
                "",
          picture: session.user.user_metadata?.avatar_url ||
                   session.user.user_metadata?.picture ||
                   "",
          provider: "google",
          supabaseId: session.user.id,
          remember: true,
          loginAt: new Date().toISOString()
        }));
      } catch (err) { /* ignore */ }

      registerScreen.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      registerScreen.style.opacity = "0";
      registerScreen.style.transform = "translateX(40px)";

      setTimeout(() => {
        window.location.href = "finix.html";
      }, 420);
    }
  });

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

  let lastTouch = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouch <= 300) e.preventDefault();
    lastTouch = now;
  }, { passive: false });

})();