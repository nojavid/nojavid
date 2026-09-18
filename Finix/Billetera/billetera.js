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

// ===== Inicializar =====
document.addEventListener("DOMContentLoaded", () => {
  actualizarFecha();
  cargarNombre();
});