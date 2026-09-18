// ===== Fecha actual en formato: Mes de Año =====
function actualizarFecha() {
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun",
                 "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const hoy = new Date();
  const mes = meses[hoy.getMonth()];
  const anio = hoy.getFullYear();
  document.getElementById("fechaActual").textContent = `${mes} de ${anio}`;
}

// ===== Nombre del usuario (puedes cambiarlo o traerlo de localStorage) =====
function cargarNombre() {
  const nombre = localStorage.getItem("nombreUsuario") || "Name";
  document.getElementById("nombreUsuario").textContent = nombre;
}

// ===== Marcar el ícono activo en la barra inferior =====
function marcarActivo() {
  const paginaActual = window.location.pathname.split("/").pop() || "billetera.html";
  const enlaces = document.querySelectorAll(".bottom-nav a");
  enlaces.forEach((enlace) => {
    const dataPage = enlace.getAttribute("data-page");
    if (dataPage === paginaActual) {
      enlace.classList.add("active");
    } else {
      enlace.classList.remove("active");
    }
  });
}

// ===== Inicializar =====
document.addEventListener("DOMContentLoaded", () => {
  actualizarFecha();
  cargarNombre();
  marcarActivo();
});