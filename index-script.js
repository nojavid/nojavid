// script.js - Efecto de escritura, menú desplegable y navegación
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script cargado correctamente');

    // ===== EFECTO DE ESCRITURA FLUIDA PARA EL TÍTULO =====
    const titulo = document.getElementById('tituloNojavid');
    if (titulo) {
        console.log('Título encontrado');
        
        // Función que ejecuta la animación de escritura fluida
        function ejecutarAnimacionEscritura() {
            // Resetear la animación
            titulo.style.animation = 'none';
            titulo.offsetHeight; // Forzar reflow
            
            // Aplicar animación de escritura fluida
            titulo.style.animation = 'escribirFluido 2.5s cubic-bezier(0.4, 0.0, 0.2, 1) 0.5s forwards';
            
            // Añadir parpadeo del cursor
            setTimeout(() => {
                titulo.style.animation = 'escribirFluido 2.5s cubic-bezier(0.4, 0.0, 0.2, 1) 0.5s forwards, parpadeoFluido 0.8s ease-in-out 3';
            }, 100);
            
            // Eliminar el borde después de la animación
            setTimeout(() => {
                titulo.style.borderColor = 'transparent';
            }, 4000);
        }

        // Función que ejecuta el borrado fluido
        function ejecutarBorrado() {
            return new Promise((resolve) => {
                titulo.style.animation = 'borrarFluido 0.8s cubic-bezier(0.4, 0.0, 0.2, 1) forwards';
                setTimeout(() => {
                    resolve();
                }, 1000);
            });
        }

        // Ejecutar la primera vez
        ejecutarAnimacionEscritura();

        // Configurar repetición cada 2 minutos (120000 ms)
        setInterval(async () => {
            // Primero borrar el texto con animación fluida
            await ejecutarBorrado();
            
            // Pequeña pausa antes de escribir de nuevo
            setTimeout(() => {
                ejecutarAnimacionEscritura();
            }, 500);
            
        }, 120000); // 2 minutos
    } else {
        console.error('No se encontró el título');
    }

    // ===== MENÚ QUE SE DESLIZA DESDE LA IZQUIERDA =====
    const menuBtn = document.getElementById('menuBtn');
    const menuOverlay = document.getElementById('menuOverlay');
    const menuSlide = document.getElementById('menuSlide');
    const menuClose = document.getElementById('menuClose');

    window.cerrarMenuYScroll = function(seccionId) {
        cerrarMenu();
        setTimeout(() => {
            scrollToSeccion(seccionId);
        }, 300);
    };

    if (menuBtn && menuOverlay && menuSlide) {
        function cerrarMenu() {
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        function abrirMenu() {
            menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            abrirMenu();
        });

        menuClose.addEventListener('click', function(e) {
            e.stopPropagation();
            cerrarMenu();
        });

        menuOverlay.addEventListener('click', function(e) {
            if (e.target === menuOverlay) {
                cerrarMenu();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && menuOverlay.classList.contains('active')) {
                cerrarMenu();
            }
        });

        menuSlide.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        document.addEventListener('click', function(e) {
            if (menuOverlay.classList.contains('active')) {
                const isClickInsideMenu = menuSlide.contains(e.target);
                const isClickOnMenuBtn = menuBtn.contains(e.target);
                const isClickOnCloseBtn = menuClose.contains(e.target);
                
                if (!isClickInsideMenu && !isClickOnMenuBtn && !isClickOnCloseBtn) {
                    cerrarMenu();
                }
            }
        });
    }

    // ===== FUNCIÓN PARA SCROLL SUAVE A SECCIONES =====
    window.scrollToSeccion = function(seccionId) {
        const elemento = document.getElementById(seccionId);
        if (elemento) {
            const headerOffset = 80;
            const elementPosition = elemento.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };
});