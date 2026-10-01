// ============================================
// SISTEMA DE COMUNICACIÓN ENTRE PÁGINAS - NOJAVID
// Archivo: comunicacion.js
// ============================================

(function() {
    'use strict';

    const STORAGE_KEY = 'nojavid_canal_eventos';

    console.log('🔗 Comunicación iniciada desde:', window.location.pathname);

    // ============================================
    // EMITIR EVENTO (enviar a otras pestañas)
    // ============================================
    window.emitirEvento = function(tipo, datos = {}) {
        const evento = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            tipo: tipo,
            datos: datos,
            origen: window.location.pathname,
            hora: new Date().toISOString()
        };

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(evento));
            console.log('📤 Evento emitido:', evento);
        } catch (e) {
            console.error('❌ Error al emitir evento:', e);
        }

        return evento;
    };

    // ============================================
    // ESCUCHAR EVENTOS (recibir de otras pestañas)
    // ============================================
    window.escucharEventos = function(callback) {
        window.addEventListener('storage', function(e) {
            if (e.key === STORAGE_KEY && e.newValue) {
                try {
                    const evento = JSON.parse(e.newValue);
                    console.log('📥 Evento recibido:', evento);
                    callback(evento);
                } catch (err) {
                    console.error('❌ Error al parsear evento:', err);
                }
            }
        });
    };

    // ============================================
    // ATAJOS DE EVENTOS
    // ============================================
    window.eventos = {
        usuarioEntro:      (pagina)   => emitirEvento('usuario-entro',      { pagina }),
        usuarioSalio:      (pagina)   => emitirEvento('usuario-salio',      { pagina }),
        loginExitoso:      (usuario)  => emitirEvento('login-exitoso',      { usuario }),
        loginFallido:      (intentos) => emitirEvento('login-fallido',      { intentos }),
        registroNuevo:     (usuario)  => emitirEvento('registro-nuevo',     { usuario }),
        proyectoVisitado:  (proyecto) => emitirEvento('proyecto-visitado',  { proyecto }),
        finixActualizado:  (detalle)  => emitirEvento('finix-actualizado',  { detalle })
    };
})();