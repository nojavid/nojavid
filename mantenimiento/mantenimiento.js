// ============================================ 
// MANTENIMIENTO - CONTROL DE VISIBILIDAD
// ============================================

// Configuración del texto de mantenimiento (puedes modificarlo aquí)
const CONFIG_MANTENIMIENTO = {
    icono: '🛠️',
    titulo: 'Mantenimiento',
    descripcion: 'La versión de escritorio se encuentra en mantenimiento.',
    subDescripcion: 'Por favor, utiliza tu dispositivo móvil para acceder al contenido.',
    estado: '⚡ Actualizando sistema ⚡',
    version: 'NOJAVID • Versión 1.0',
    umbralPC: 769 // Ancho mínimo para considerar PC
};

// ===== DETECTAR TIPO DE DISPOSITIVO =====
function detectarTipoDispositivo() {
    const ancho = window.innerWidth;
    const esPC = ancho >= CONFIG_MANTENIMIENTO.umbralPC;
    
    // Actualizar el data attribute en el HTML
    const detector = document.getElementById('sistema-deteccion');
    if (detector) {
        detector.setAttribute('data-tipo', esPC ? 'pc' : 'movil');
        detector.setAttribute('data-ancho', ancho);
    }
    
    return {
        esPC: esPC,
        ancho: ancho,
        tipo: esPC ? 'PC' : 'Móvil'
    };
}

// ===== CREAR PANTALLA DE MANTENIMIENTO DINÁMICAMENTE =====
function crearPantallaMantenimiento() {
    // Verificar si ya existe
    if (document.getElementById('pantalla-mantenimiento')) {
        return;
    }

    // Crear el contenedor principal
    const mantContainer = document.createElement('div');
    mantContainer.id = 'pantalla-mantenimiento';
    
    // Crear el contenido usando la configuración
    mantContainer.innerHTML = `
        <div class="mantenimiento-content">
            <div class="mantenimiento-icon">${CONFIG_MANTENIMIENTO.icono}</div>
            <h1>${CONFIG_MANTENIMIENTO.titulo}</h1>
            <p>${CONFIG_MANTENIMIENTO.descripcion}</p>
            <p class="mantenimiento-sub">${CONFIG_MANTENIMIENTO.subDescripcion}</p>
            <div class="mantenimiento-spinner"></div>
            <div class="mantenimiento-bar">
                <div class="mantenimiento-bar-progress"></div>
            </div>
            <div class="mantenimiento-status">${CONFIG_MANTENIMIENTO.estado}</div>
            <div class="mantenimiento-version">${CONFIG_MANTENIMIENTO.version}</div>
        </div>
    `;
    
    // Insertar al final del body (después del contenido principal)
    document.body.appendChild(mantContainer);
    
    console.log('✅ Pantalla de mantenimiento creada dinámicamente');
}

// ===== ACTUALIZAR VISIBILIDAD SEGÚN DISPOSITIVO =====
function actualizarVisibilidad() {
    const dispositivo = detectarTipoDispositivo();
    const body = document.body;
    const mantPantalla = document.getElementById('pantalla-mantenimiento');
    const contenido = document.getElementById('contenido-principal');
    
    console.log(`📱 Dispositivo detectado: ${dispositivo.tipo} (${dispositivo.ancho}px)`);
    console.log(`📊 Umbral PC: ${CONFIG_MANTENIMIENTO.umbralPC}px`);
    
    if (!mantPantalla || !contenido) {
        console.warn('⚠️ Elementos no encontrados');
        return;
    }
    
    if (dispositivo.esPC) {
        // Modo MANTENIMIENTO para PC
        body.classList.remove('modo-normal');
        body.classList.add('modo-mantenimiento');
        
        // Asegurar que la pantalla de mantenimiento se muestre
        mantPantalla.classList.add('mostrar');
        mantPantalla.style.display = 'flex';
        
        console.log('🖥️ Modo mantenimiento activado (PC)');
    } else {
        // Modo NORMAL para móvil
        body.classList.remove('modo-mantenimiento');
        body.classList.add('modo-normal');
        
        // Ocultar pantalla de mantenimiento
        mantPantalla.classList.remove('mostrar');
        mantPantalla.style.display = 'none';
        
        // Restaurar fondo del body al estilo original
        body.style.background = '';
        body.style.overflow = '';
        
        console.log('📱 Modo normal activado (Móvil)');
    }
}

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Mantenimiento.js cargado');
    
    // Crear la pantalla de mantenimiento
    crearPantallaMantenimiento();
    
    // Verificar el estado inicial
    actualizarVisibilidad();
});

// ===== VERIFICAR AL CAMBIAR EL TAMAÑO =====
let timeoutResize;
window.addEventListener('resize', function() {
    clearTimeout(timeoutResize);
    timeoutResize = setTimeout(function() {
        actualizarVisibilidad();
    }, 250);
});

// ===== VERIFICAR AL CAMBIAR ORIENTACIÓN =====
window.addEventListener('orientationchange', function() {
    setTimeout(function() {
        actualizarVisibilidad();
    }, 500);
});

// ===== VERIFICAR TAMBIÉN CUANDO SE CARGA COMPLETAMENTE =====
window.addEventListener('load', function() {
    // Pequeño retraso para asegurar que todo esté renderizado
    setTimeout(function() {
        actualizarVisibilidad();
    }, 100);
});

// ============================================
// FUNCIONES DE UTILIDAD PARA MANIPULACIÓN
// ============================================

// ===== FUNCIÓN PARA ACTUALIZAR EL TEXTO DINÁMICAMENTE =====
function actualizarTextoMantenimiento(nuevoTexto) {
    const mantContainer = document.getElementById('pantalla-mantenimiento');
    if (!mantContainer) return;
    
    const icono = mantContainer.querySelector('.mantenimiento-icon');
    const titulo = mantContainer.querySelector('h1');
    const descripcion = mantContainer.querySelector('p:not(.mantenimiento-sub)');
    const subDescripcion = mantContainer.querySelector('.mantenimiento-sub');
    const estado = mantContainer.querySelector('.mantenimiento-status');
    const version = mantContainer.querySelector('.mantenimiento-version');
    
    if (nuevoTexto.icono) icono.textContent = nuevoTexto.icono;
    if (nuevoTexto.titulo) titulo.textContent = nuevoTexto.titulo;
    if (nuevoTexto.descripcion) descripcion.textContent = nuevoTexto.descripcion;
    if (nuevoTexto.subDescripcion) subDescripcion.textContent = nuevoTexto.subDescripcion;
    if (nuevoTexto.estado) estado.textContent = nuevoTexto.estado;
    if (nuevoTexto.version) version.textContent = nuevoTexto.version;
    
    console.log('✅ Texto de mantenimiento actualizado');
}

// ===== FUNCIÓN PARA CAMBIAR EL ESTADO DINÁMICAMENTE =====
function cambiarEstadoMantenimiento(nuevoEstado) {
    const estado = document.querySelector('.mantenimiento-status');
    if (estado) {
        estado.textContent = nuevoEstado;
        console.log('✅ Estado actualizado:', nuevoEstado);
    }
}

// ===== FUNCIÓN PARA CAMBIAR EL ICONO =====
function cambiarIconoMantenimiento(nuevoIcono) {
    const icono = document.querySelector('.mantenimiento-icon');
    if (icono) {
        icono.textContent = nuevoIcono;
        console.log('✅ Icono actualizado:', nuevoIcono);
    }
}

// ===== FUNCIÓN PARA OBTENER EL ESTADO ACTUAL =====
function obtenerEstadoSistema() {
    const detector = document.getElementById('sistema-deteccion');
    if (detector) {
        return {
            tipo: detector.getAttribute('data-tipo'),
            ancho: detector.getAttribute('data-ancho'),
            modo: document.body.classList.contains('modo-mantenimiento') ? 'mantenimiento' : 'normal'
        };
    }
    return null;
}

// ===== FUNCIÓN PARA FORZAR UN MODO ESPECÍFICO =====
function forzarModo(modo) {
    // modo: 'pc' o 'movil'
    const detector = document.getElementById('sistema-deteccion');
    if (detector) {
        detector.setAttribute('data-forzado', modo);
        actualizarVisibilidad();
        console.log(`🔄 Modo forzado a: ${modo}`);
    }
}

// Ejemplos de uso (descomentar para probar):
// actualizarTextoMantenimiento({
//     titulo: 'Nuevo Título',
//     descripcion: 'Descripción personalizada',
//     estado: '🔄 Procesando...'
// });
// cambiarEstadoMantenimiento('🚀 Casi listo...');
// cambiarIconoMantenimiento('⚙️');
// console.log('Estado actual:', obtenerEstadoSistema());
// forzarModo('pc'); // Forzar modo PC
// forzarModo('movil'); // Forzar modo móvil