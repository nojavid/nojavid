// ============================================
// SISTEMA DE NOTIFICACIONES - NOJAVID
// Archivo: notificaciones.js
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔔 Sistema de notificaciones iniciado');

    // ============================================
    // 1. CREAR CONTENEDOR DE NOTIFICACIONES (TOAST)
    // ============================================
    const contenedorToast = document.createElement('div');
    contenedorToast.id = 'contenedor-toast';
    document.body.appendChild(contenedorToast);

    // ============================================
    // 2. FUNCIÓN PARA MOSTRAR NOTIFICACIONES TOAST
    // ============================================
    window.mostrarNotificacion = function(mensaje, tipo = 'info', duracion = 4000) {
        const colores = {
            info:    { bg: 'linear-gradient(135deg, #00e5ff, #d500f9)', icono: 'ℹ️' },
            success: { bg: 'linear-gradient(135deg, #00c853, #00e5ff)', icono: '✅' },
            warning: { bg: 'linear-gradient(135deg, #ffab00, #ff6d00)', icono: '⚠️' },
            error:   { bg: 'linear-gradient(135deg, #ff1744, #d500f9)', icono: '❌' },
            cambio:  { bg: 'linear-gradient(135deg, #d500f9, #00e5ff)', icono: '🔔' }
        };

        const estilo = colores[tipo] || colores.info;

        const toast = document.createElement('div');
        toast.className = 'toast-nojavid';
        toast.style.background = estilo.bg;

        toast.innerHTML = `
            <span class="toast-icono">${estilo.icono}</span>
            <span class="toast-mensaje">${mensaje}</span>
        `;

        contenedorToast.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('toast-visible');
        });

        toast.addEventListener('click', () => cerrarToast(toast));

        setTimeout(() => cerrarToast(toast), duracion);
    };

    function cerrarToast(toast) {
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-oculto');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 400);
    }

    // ============================================
    // 3. FUNCIÓN PARA NOTIFICACIÓN NATIVA DEL NAVEGADOR
    // ============================================
    window.notificarNavegador = function(titulo, cuerpo, icono = null) {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const notif = new Notification(titulo, {
                    body: cuerpo,
                    icon: icono || 'foto.png',
                    badge: 'foto.png',
                    vibrate: [200, 100, 200],
                    tag: 'nojavid-' + Date.now()
                });

                notif.onclick = function() {
                    window.focus();
                    notif.close();
                };

                setTimeout(() => notif.close(), 8000);
            } catch (e) {
                console.warn('No se pudo mostrar notificación nativa:', e);
            }
        }
    };

    // ============================================
    // 4. GESTIÓN DE PERMISO CON BANNER PERSONALIZADO
    // ============================================
    const banner = document.getElementById('banner-permiso');
    const btnPermitir = document.getElementById('btn-permitir');
    const btnRechazar = document.getElementById('btn-rechazar');

    // Clave para recordar la decisión del usuario
    const CLAVE_DECISION = 'nojavid_decision_notificaciones';
    const CLAVE_FECHA_RECHAZO = 'nojavid_fecha_rechazo';

    // Verificar si el navegador soporta notificaciones
    const soportaNotificaciones = 'Notification' in window;

    function debeMostrarBanner() {
        // Si no soporta notificaciones, no mostrar
        if (!soportaNotificaciones) return false;

        // Si ya dio permiso o lo denegó, no volver a mostrar
        if (Notification.permission === 'granted') return false;
        if (Notification.permission === 'denied') return false;

        // Si el usuario ya decidió antes, respetar su decisión
        const decision = localStorage.getItem(CLAVE_DECISION);

        if (decision === 'permitido') return false;

        if (decision === 'rechazado') {
            // Volver a preguntar después de 7 días
            const fechaRechazo = parseInt(localStorage.getItem(CLAVE_FECHA_RECHAZO) || '0');
            const diasTranscurridos = (Date.now() - fechaRechazo) / (1000 * 60 * 60 * 24);
            if (diasTranscurridos < 7) return false;
        }

        return true;
    }

    function mostrarBanner() {
        if (!banner) return;
        setTimeout(() => {
            banner.classList.add('banner-visible');
        }, 2000); // Mostrar 2 segundos después de cargar
    }

    function ocultarBanner() {
        if (!banner) return;
        banner.classList.remove('banner-visible');
        setTimeout(() => {
            banner.style.display = 'none';
        }, 500);
    }

    // Al hacer clic en "Permitir"
    if (btnPermitir) {
        btnPermitir.addEventListener('click', async function() {
            try {
                const permiso = await Notification.requestPermission();
                
                if (permiso === 'granted') {
                    localStorage.setItem(CLAVE_DECISION, 'permitido');
                    ocultarBanner();
                    
                    // Confirmación con toast y notificación nativa
                    mostrarNotificacion('¡Notificaciones activadas! 🎉', 'success', 4000);
                    
                    setTimeout(() => {
                        notificarNavegador(
                            'NOJAVID - Notificaciones activas',
                            'Ahora recibirás avisos de cambios importantes.'
                        );
                    }, 1000);
                } else if (permiso === 'denied') {
                    localStorage.setItem(CLAVE_DECISION, 'rechazado');
                    localStorage.setItem(CLAVE_FECHA_RECHAZO, Date.now().toString());
                    ocultarBanner();
                    mostrarNotificacion('Notificaciones bloqueadas en el navegador', 'warning', 4000);
                } else {
                    // El usuario cerró el diálogo sin decidir
                    ocultarBanner();
                    mostrarNotificacion('Puedes activarlas más tarde desde el botón 🔔', 'info', 4000);
                }
            } catch (error) {
                console.error('Error al pedir permiso:', error);
                ocultarBanner();
            }
        });
    }

    // Al hacer clic en "Ahora no"
    if (btnRechazar) {
        btnRechazar.addEventListener('click', function() {
            localStorage.setItem(CLAVE_DECISION, 'rechazado');
            localStorage.setItem(CLAVE_FECHA_RECHAZO, Date.now().toString());
            ocultarBanner();
            mostrarNotificacion('Entendido, no volveremos a preguntar por 7 días', 'info', 3000);
        });
    }

    // Mostrar el banner si corresponde
    if (debeMostrarBanner()) {
        mostrarBanner();
    }

    // ============================================
    // 5. FUNCIÓN PÚBLICA PARA PEDIR PERMISO MANUALMENTE
    // ============================================
    window.pedirPermisoNotificaciones = function() {
        if (!soportaNotificaciones) {
            mostrarNotificacion('Tu navegador no soporta notificaciones', 'error');
            return;
        }

        if (Notification.permission === 'granted') {
            mostrarNotificacion('Ya tienes las notificaciones activadas ✅', 'success');
            return;
        }

        if (Notification.permission === 'denied') {
            mostrarNotificacion('Las notificaciones están bloqueadas. Actívalas en la configuración del navegador.', 'warning', 6000);
            return;
        }

        // Mostrar el banner de nuevo
        if (banner) {
            banner.style.display = '';
            setTimeout(() => banner.classList.add('banner-visible'), 50);
        }
    };

    // ============================================
    // 6. DETECCIÓN DE CAMBIOS CON MutationObserver
    // ============================================
    let cambiosDetectados = 0;

    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'contenedor-toast' || 
                (mutation.target.closest && mutation.target.closest('#contenedor-toast'))) return;

            if (mutation.type === 'attributes') {
                cambiosDetectados++;
                console.log(`🔔 Cambio detectado: ${mutation.attributeName} en`, mutation.target);
                
                if (mutation.attributeName === 'class' && 
                    mutation.target.classList && 
                    mutation.target.classList.contains('active')) {
                    mostrarNotificacion('Menú abierto', 'info', 2000);
                }
            }

            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.id !== 'contenedor-toast') {
                        console.log('🆕 Nuevo elemento detectado:', node);
                    }
                });
            }

            if (mutation.type === 'characterData') {
                console.log('📝 Texto modificado:', mutation.target.data);
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
    });

    // ============================================
    // 7. DETECCIÓN DE CAMBIOS DE SECCIÓN (SCROLL)
    // ============================================
    const secciones = document.querySelectorAll('section[id]');
    const seccionesVisitadas = new Set();

    if (secciones.length > 0 && 'IntersectionObserver' in window) {
        const observerSecciones = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    if (!seccionesVisitadas.has(id)) {
                        seccionesVisitadas.add(id);
                        
                        const nombres = {
                            'inicio': 'Sección Inicio',
                            'proyectos': 'Sección Proyectos'
                        };
                        
                        mostrarNotificacion(
                            `📍 ${nombres[id] || id} visitada`,
                            'info',
                            2500
                        );
                    }
                }
            });
        }, { threshold: 0.5 });

        secciones.forEach(seccion => observerSecciones.observe(seccion));
    }

    // ============================================
    // 8. DETECCIÓN DE VISIBILIDAD DE LA PÁGINA
    // ============================================
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            console.log('👋 Página oculta');
        } else {
            console.log('👀 Página visible de nuevo');
            mostrarNotificacion('¡Bienvenido de nuevo!', 'success', 3000);
            notificarNavegador('NOJAVID', 'Has vuelto a la página');
        }
    });

    // ============================================
    // 9. DETECCIÓN DE CAMBIOS EN EL TÍTULO
    // ============================================
    const tituloOriginal = document.title;
    const tituloElement = document.querySelector('title');
    
    if (tituloElement) {
        const observerTitulo = new MutationObserver(() => {
            if (document.title !== tituloOriginal) {
                mostrarNotificacion(`📝 Título cambiado: "${document.title}"`, 'cambio');
                notificarNavegador('Título modificado', document.title);
            }
        });
        observerTitulo.observe(tituloElement, { 
            childList: true, 
            characterData: true, 
            subtree: true 
        });
    }

    // ============================================
    // 10. DETECCIÓN DE CONEXIÓN (ONLINE/OFFLINE)
    // ============================================
    window.addEventListener('online', () => {
        mostrarNotificacion('🌐 Conexión restaurada', 'success');
        notificarNavegador('Conexión restaurada', 'Ya tienes internet de nuevo');
    });

    window.addEventListener('offline', () => {
        mostrarNotificacion('📡 Sin conexión a internet', 'error', 6000);
        notificarNavegador('Sin conexión', 'Has perdido la conexión a internet');
    });

    // ============================================
    // 11. DETECCIÓN DE CLICS EN BOTONES
    // ============================================
    document.querySelectorAll('button, .proyecto-enlace').forEach(el => {
        el.addEventListener('click', function() {
            const texto = this.textContent.trim().substring(0, 30);
            console.log(`🖱️ Click en: ${texto}`);
        });
    });

    // ============================================
    // 12. MONITOR DE CAMBIOS EN LOCALSTORAGE
    // (ignora el canal de comunicación y claves internas)
    // ============================================
    window.addEventListener('storage', function(e) {
        // Ignorar el canal de comunicación (lo maneja comunicacion.js)
        if (e.key === 'nojavid_canal_eventos') return;

        // Ignorar claves internas de notificaciones
        if (e.key === 'nojavid_decision_notificaciones' ||
            e.key === 'nojavid_fecha_rechazo') return;

        mostrarNotificacion(
            `💾 Cambio detectado en "${e.key}"`,
            'cambio'
        );
        notificarNavegador('Cambio en almacenamiento', `La clave "${e.key}" ha cambiado`);
    });

    // ============================================
    // 13. FUNCIÓN PÚBLICA PARA NOTIFICAR CAMBIOS MANUALES
    // ============================================
    window.detectarCambio = function(descripcion, tipo = 'cambio') {
        mostrarNotificacion(descripcion, tipo);
        notificarNavegador('NOJAVID - Cambio detectado', descripcion);
    };

    // ============================================
    // 14. MENSAJE DE BIENVENIDA
    // ============================================
    setTimeout(() => {
        mostrarNotificacion('🔔 Sistema de notificaciones activo', 'success', 3500);
    }, 1500);

    // ============================================
    // 15. ESCUCHAR EVENTOS DE OTRAS PÁGINAS (Finix, Tanaj, etc.)
    // ============================================
    if (typeof escucharEventos === 'function') {
        escucharEventos(function(evento) {
            let mensaje = '';
            let tipo = 'info';

            switch (evento.tipo) {
                case 'usuario-entro':
                    mensaje = `👤 Alguien entró a ${evento.datos.pagina}`;
                    tipo = 'info';
                    break;
                case 'usuario-salio':
                    mensaje = `👋 Alguien salió de ${evento.datos.pagina}`;
                    tipo = 'info';
                    break;
                case 'login-exitoso':
                    mensaje = `✅ Login exitoso: ${evento.datos.usuario}`;
                    tipo = 'success';
                    break;
                case 'login-fallido':
                    mensaje = `❌ Login fallido (intento ${evento.datos.intentos})`;
                    tipo = 'error';
                    break;
                case 'registro-nuevo':
                    mensaje = `🎉 Nuevo registro: ${evento.datos.usuario}`;
                    tipo = 'success';
                    break;
                case 'proyecto-visitado':
                    mensaje = `📂 Proyecto visitado: ${evento.datos.proyecto}`;
                    tipo = 'cambio';
                    break;
                case 'finix-actualizado':
                    mensaje = `🔄 Finix actualizado: ${evento.datos.detalle}`;
                    tipo = 'cambio';
                    break;
                default:
                    mensaje = `📢 Evento: ${evento.tipo}`;
            }

            mostrarNotificacion(mensaje, tipo, 5000);
            notificarNavegador('NOJAVID', mensaje);
        });
    }

    console.log('✅ Todos los observadores activos');
});