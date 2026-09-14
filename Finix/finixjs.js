// ============================================
// 1. FECHA ACTUAL
// ============================================
function actualizarFecha() {
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const ahora = new Date();
    const mes = meses[ahora.getMonth()];
    const año = ahora.getFullYear();
    const fechaElement = document.getElementById('fechaActual');
    if (fechaElement) {
        fechaElement.textContent = mes + " de " + año;
    }
}
actualizarFecha();

// ============================================
// 2. MENÚ HAMBURGUESA
// ============================================
const menuBtn = document.getElementById('menuHamburguesa');
const menuOverlay = document.getElementById('menuOverlay');
const menuClose = document.getElementById('menuClose');

function abrirMenu() { if (menuOverlay) menuOverlay.classList.add('active'); }
function cerrarMenu() { if (menuOverlay) menuOverlay.classList.remove('active'); }

if (menuBtn) menuBtn.addEventListener('click', abrirMenu);
if (menuClose) menuClose.addEventListener('click', cerrarMenu);
if (menuOverlay) {
    menuOverlay.addEventListener('click', function(e) {
        if (e.target === this) cerrarMenu();
    });
}

// ============================================
// 3. AUDIO POPUP
// ============================================
const seccionAudio = document.getElementById('seccionAudio');
const audioPopup = document.getElementById('audioPopup');
const audioClose = document.getElementById('audioPopupClose');

function abrirAudioPopup(e) {
    if (e) e.stopPropagation();
    if (audioPopup) audioPopup.classList.add('active');
}
function cerrarAudioPopup() {
    if (audioPopup) audioPopup.classList.remove('active');
}

if (seccionAudio) seccionAudio.addEventListener('click', abrirAudioPopup);
if (audioClose) audioClose.addEventListener('click', cerrarAudioPopup);
if (audioPopup) {
    audioPopup.addEventListener('click', function(e) {
        if (e.target === this) cerrarAudioPopup();
    });
}

// ============================================
// 4. CÁMARA → camara.html
// ============================================
const seccionCamara = document.getElementById('seccionCamara');
if (seccionCamara) {
    seccionCamara.addEventListener('click', function() {
        window.location.href = 'camara.html';
    });
}

// ============================================
// 5. VARIABLES GLOBALES DE ESCRITURA
// ============================================
const escrituraEl = document.getElementById('escrituraAnimada');
const btnEnviar = document.getElementById('btnEnviar');
const btnConfirmar = document.getElementById('btnConfirmar');

let animacionInterval = null;
let estaEditando = false;
let textoOriginal = '';
let animacionEnCurso = false;
let procesandoIA = false;

const textosAnimacion = [
    'Almuerzo 25 mil + uber 12k',
    'Procesando...',
    'Almuerzo: $25.000\nUber: $12.000'
];

// ============================================
// DETECCIÓN DE TEXTO DE ANIMACIÓN
// ============================================
function esTextoDeAnimacion(texto) {
    const textos = [
        'Almuerzo 25 mil + uber 12k',
        'Procesando...',
        'Almuerzo: $25.000',
        'Uber: $12.000',
        'Almuerzo:',
        'Uber:'
    ];
    const textoLimpio = texto.trim();
    return textos.some(t => textoLimpio.includes(t));
}

function hayDatosValidos() {
    if (!escrituraEl) return false;
    const texto = escrituraEl.textContent.trim();
    if (texto.length === 0) return false;
    if (esTextoDeAnimacion(texto)) return false;
    return true;
}

function actualizarBotonEnviar() {
    if (!btnEnviar || !escrituraEl) return;
    if (hayDatosValidos() && estaEditando) {
        btnEnviar.style.display = 'block';
    } else {
        btnEnviar.style.display = 'none';
    }
}

function ocultarBotones() {
    if (btnEnviar) btnEnviar.style.display = 'none';
    if (btnConfirmar) btnConfirmar.style.display = 'none';
}

// ============================================
// 6. ENVIAR DATOS → PROCESAR CON IA
// ============================================
async function enviarDatos() {
    const texto = escrituraEl.textContent.trim();
    if (!texto) return;

    procesandoIA = true;

    // Ocultar botones
    ocultarBotones();

    // Mostrar "Procesando con IA..."
    escrituraEl.innerHTML = '';
    escrituraEl.classList.add('ia-analizando');
    escrituraEl.textContent = 'Procesando con IA...';
    escrituraEl.style.color = '#00FFD4';
    escrituraEl.style.fontWeight = '600';
    escrituraEl.style.display = 'block';
    escrituraEl.style.padding = '8px';

    // Llamar a la IA
    let movimientos = [];
    try {
        movimientos = await analizarConIA(texto);
    } catch (e) {
        console.error('Error IA:', e);
    }

    procesandoIA = false;
    escrituraEl.classList.remove('ia-analizando');

    // Si no detectó nada
    if (!movimientos || movimientos.length === 0) {
        escrituraEl.innerHTML = '<span style="color:#ff5555;">⚠️ No pude detectar movimientos. Intenta de nuevo.</span>';
        escrituraEl.style.padding = '8px';
        setTimeout(() => {
            escrituraEl.innerHTML = '';
            escrituraEl.dataset.textoPersonalizado = 'false';
            estaEditando = false;
            animacionEnCurso = false;
            escrituraEl.contentEditable = false;
            escrituraEl.style.cssText = '';
            escrituraEl.style.color = '#c0d0e0';
            iniciarAnimacion();
        }, 2500);
        return;
    }

    // Mostrar items detectados
    mostrarItemsDetectados(movimientos);
}

// ============================================
// 7. MOSTRAR ITEMS DETECTADOS
// ============================================
function mostrarItemsDetectados(movimientos) {
    escrituraEl.innerHTML = '';
    escrituraEl.style.display = 'flex';
    escrituraEl.style.flexDirection = 'column';
    escrituraEl.style.gap = '6px';
    escrituraEl.style.padding = '4px 0';
    escrituraEl.style.color = '#c0d0e0';
    escrituraEl.style.fontWeight = '500';

    movimientos.forEach((mov, i) => {
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            background: ${mov.tipo === 'ingreso' ? 'rgba(0, 255, 136, 0.12)' : 'rgba(255, 80, 80, 0.12)'};
            border: 1px solid ${mov.tipo === 'ingreso' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 80, 80, 0.3)'};
            border-radius: 8px;
            padding: 6px 12px;
            margin: 2px 0;
            opacity: 0;
            transform: translateX(-10px);
            transition: all 0.35s ease;
        `;

        const icono = document.createElement('span');
        icono.textContent = mov.icono || '📌';
        icono.style.cssText = 'font-size: 18px;';

        const nombre = document.createElement('span');
        nombre.textContent = mov.nombre + ': ';
        nombre.style.cssText = 'color: white; font-size: 13px; font-weight: 500; flex: 1;';

        const precio = document.createElement('span');
        precio.textContent = '$' + Number(mov.precio).toLocaleString('es-CO');
        precio.style.cssText = `
            color: ${mov.tipo === 'ingreso' ? '#00FF88' : '#00FFD4'};
            font-weight: 700;
            font-size: 13px;
        `;

        itemDiv.appendChild(icono);
        itemDiv.appendChild(nombre);
        itemDiv.appendChild(precio);
        escrituraEl.appendChild(itemDiv);

        setTimeout(() => {
            itemDiv.style.opacity = '1';
            itemDiv.style.transform = 'translateX(0)';
        }, 80 * i);
    });

    // Guardar pendientes
    escrituraEl.dataset.movimientosPendientes = JSON.stringify(movimientos);

    // Mostrar botón CONFIRMAR
    setTimeout(() => {
        if (btnConfirmar) btnConfirmar.style.display = 'block';
    }, 300);
}

// ============================================
// 8. CONFIRMAR Y ENVIAR A REPORTES
// ============================================
function confirmarYEnviar() {
    const pendientes = escrituraEl.dataset.movimientosPendientes;
    if (!pendientes) return;

    try {
        const movimientos = JSON.parse(pendientes);
        guardarMovimientos(movimientos);

        btnConfirmar.textContent = '✓ Guardado';
        btnConfirmar.style.background = 'linear-gradient(135deg, #00FF88, #00cc66)';

        setTimeout(() => {
            // Limpiar
            escrituraEl.innerHTML = '';
            escrituraEl.dataset.textoPersonalizado = 'false';
            escrituraEl.dataset.movimientosPendientes = '';
            estaEditando = false;
            animacionEnCurso = false;
            escrituraEl.contentEditable = false;
            escrituraEl.style.cssText = '';
            escrituraEl.style.color = '#c0d0e0';

            btnConfirmar.style.display = 'none';
            btnConfirmar.textContent = '✓ Guardar';
            btnConfirmar.style.background = '';

            // Redirigir
            window.location.href = 'reportes.html';
        }, 800);
    } catch (e) {
        console.error('Error al confirmar:', e);
    }
}

// ============================================
// GUARDAR MOVIMIENTOS EN LOCALSTORAGE
// ============================================
function guardarMovimientos(movimientos) {
    try {
        const existentes = JSON.parse(localStorage.getItem('finix_movimientos') || '[]');
        const conFecha = movimientos.map(m => ({
            ...m,
            fecha: new Date().toISOString(),
            id: Date.now() + Math.random().toString(36).slice(2, 8)
        }));
        const actualizados = existentes.concat(conFecha);
        localStorage.setItem('finix_movimientos', JSON.stringify(actualizados));
        console.log('✅ Guardados', conFecha.length, 'movimientos');
    } catch (e) {
        console.error('Error guardando en localStorage:', e);
    }
}

// ============================================
// 9. EVENTOS DE BOTONES
// ============================================
if (btnEnviar) {
    btnEnviar.addEventListener('mousedown', e => e.preventDefault());
    btnEnviar.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        enviarDatos();
    });
}

if (btnConfirmar) {
    btnConfirmar.addEventListener('mousedown', e => e.preventDefault());
    btnConfirmar.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        confirmarYEnviar();
    });
}

// ============================================
// 10. FUNCIONES DE ANIMACIÓN
// ============================================
function escribirConEfecto(texto, velocidad = 50, callback) {
    if (!escrituraEl || estaEditando) return;

    animacionEnCurso = true;
    let index = 0;
    escrituraEl.textContent = '';
    escrituraEl.style.color = '#c0d0e0';
    escrituraEl.classList.add('animando');

    function escribirLetra() {
        if (estaEditando || procesandoIA) {
            escrituraEl.classList.remove('animando');
            return;
        }
        if (index < texto.length) {
            const char = texto.charAt(index);
            escrituraEl.textContent += char;
            index++;

            let velocidadActual = velocidad;
            if (char === ' ' || char === '.') velocidadActual = velocidad * 1.5;
            else if (index % 5 === 0) velocidadActual = velocidad * 0.8;

            setTimeout(escribirLetra, velocidadActual);
        } else {
            escrituraEl.classList.remove('animando');
            animacionEnCurso = false;
            if (callback) callback();
        }
    }
    escribirLetra();
}

function mostrarResultadoConEstilos() {
    if (estaEditando || procesandoIA) return;

    animacionEnCurso = true;
    escrituraEl.innerHTML = '';
    escrituraEl.style.color = '#c0d0e0';
    escrituraEl.style.display = 'flex';
    escrituraEl.style.flexDirection = 'column';
    escrituraEl.style.gap = '6px';
    escrituraEl.style.padding = '4px 0';

    const items = [
        {
            icono: '🍽️',
            texto: 'Almuerzo: $25.000',
            color: 'rgba(255, 50, 50, 0.15)',
            borderColor: 'rgba(255, 50, 50, 0.3)'
        },
        {
            icono: '🚗',
            texto: 'Uber: $12.000',
            color: 'rgba(50, 150, 255, 0.15)',
            borderColor: 'rgba(50, 150, 255, 0.3)'
        }
    ];

    let itemIndex = 0;

    function agregarItemConEfecto() {
        if (itemIndex >= items.length || estaEditando || procesandoIA) {
            animacionEnCurso = false;
            setTimeout(function() {
                if (!estaEditando && !animacionEnCurso && !procesandoIA) {
                    escrituraEl.innerHTML = '';
                    escrituraEl.style.display = 'block';
                    escrituraEl.style.padding = '0';
                    escrituraEl.style.gap = '0';
                    cicloAnimacion();
                }
            }, 3000);
            return;
        }

        const item = items[itemIndex];
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = `
            display: flex; align-items: center; gap: 10px;
            background: ${item.color};
            border: 1px solid ${item.borderColor};
            border-radius: 8px; padding: 6px 12px; margin: 2px 0;
            box-shadow: 0 0 20px rgba(0,0,0,0.2);
            opacity: 0; transform: translateX(-10px);
            transition: all 0.3s ease;
        `;

        const iconoSpan = document.createElement('span');
        iconoSpan.textContent = item.icono;
        iconoSpan.style.cssText = 'font-size: 18px; margin-right: 4px;';

        const textoSpan = document.createElement('span');
        textoSpan.style.cssText = 'color: white; font-size: 13px; font-weight: 500;';

        const partes = item.texto.split(': ');
        textoSpan.textContent = partes[0] + ': ';
        const precio = document.createElement('span');
        precio.textContent = partes[1];
        precio.style.cssText = 'color: #00FFD4; font-weight: 700; font-size: 13px;';
        textoSpan.appendChild(precio);

        itemDiv.appendChild(iconoSpan);
        itemDiv.appendChild(textoSpan);
        escrituraEl.appendChild(itemDiv);

        setTimeout(() => {
            itemDiv.style.opacity = '1';
            itemDiv.style.transform = 'translateX(0)';
        }, 50);

        itemIndex++;
        setTimeout(agregarItemConEfecto, 500);
    }
    agregarItemConEfecto();
}

function cicloAnimacion() {
    if (estaEditando || animacionEnCurso || procesandoIA) return;

    escrituraEl.style.display = 'block';
    escrituraEl.style.padding = '0';
    escrituraEl.style.gap = '0';

    escribirConEfecto(textosAnimacion[0], 60, function() {
        setTimeout(function() {
            if (estaEditando || procesandoIA) return;

            escrituraEl.innerHTML = '';
            setTimeout(function() {
                if (estaEditando || procesandoIA) return;

                escrituraEl.textContent = 'Procesando...';
                escrituraEl.classList.add('procesando');
                escrituraEl.style.color = '#00FFD4';
                escrituraEl.style.fontWeight = '600';

                setTimeout(function() {
                    if (estaEditando || procesandoIA) return;

                    escrituraEl.classList.remove('procesando');
                    escrituraEl.textContent = '';
                    escrituraEl.style.color = '#c0d0e0';
                    escrituraEl.style.fontWeight = '500';

                    mostrarResultadoConEstilos();
                }, 1500);
            }, 300);
        }, 1000);
    });
}

function iniciarAnimacion() {
    if (animacionInterval) {
        clearInterval(animacionInterval);
        animacionInterval = null;
    }
    ocultarBotones();

    if (!estaEditando && !procesandoIA && escrituraEl &&
        (!escrituraEl.dataset.textoPersonalizado || escrituraEl.dataset.textoPersonalizado === 'false')) {
        escrituraEl.innerHTML = '';
        escrituraEl.style.color = '#c0d0e0';
        escrituraEl.style.fontWeight = '500';
        escrituraEl.style.display = 'block';
        escrituraEl.style.padding = '0';
        escrituraEl.style.gap = '0';

        setTimeout(function() {
            if (!estaEditando && !procesandoIA) {
                cicloAnimacion();
            }
        }, 500);
    }
}

function detenerAnimacion() {
    animacionEnCurso = false;
    if (animacionInterval) {
        clearInterval(animacionInterval);
        animacionInterval = null;
    }
}

function entrarEnEdicion() {
    if (procesandoIA) return;

    detenerAnimacion();
    animacionEnCurso = false;
    estaEditando = true;

    textoOriginal = escrituraEl.textContent;

    escrituraEl.innerHTML = '';
    escrituraEl.style.color = 'white';
    escrituraEl.style.display = 'block';
    escrituraEl.style.padding = '8px';
    escrituraEl.style.gap = '0';
    escrituraEl.style.fontWeight = '500';
    escrituraEl.style.opacity = '1';

    escrituraEl.contentEditable = true;
    escrituraEl.focus();

    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();

    const range = document.createRange();
    range.setStart(escrituraEl.firstChild || escrituraEl, 0);
    range.collapse(true);
    if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
    }

    escrituraEl.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
    escrituraEl.style.border = '1px solid #00FFD4';
    escrituraEl.style.borderRadius = '4px';
    escrituraEl.style.outline = 'none';
    escrituraEl.style.color = 'white';

    escrituraEl.dataset.textoPersonalizado = 'true';
    ocultarBotones();
}

function salirDeEdicion(guardar = true) {
    if (!estaEditando) return;

    estaEditando = false;
    animacionEnCurso = false;

    escrituraEl.contentEditable = false;

    escrituraEl.style.backgroundColor = 'transparent';
    escrituraEl.style.border = 'none';
    escrituraEl.style.borderRadius = '0';
    escrituraEl.style.padding = '0';
    escrituraEl.style.outline = 'none';
    escrituraEl.style.color = '#c0d0e0';
    escrituraEl.style.display = 'block';
    escrituraEl.style.gap = '0';
    escrituraEl.style.fontWeight = '500';
    escrituraEl.innerHTML = escrituraEl.textContent.replace(/\n/g, '<br>');

    if (!escrituraEl.textContent || escrituraEl.textContent.trim() === '') {
        escrituraEl.dataset.textoPersonalizado = 'false';
        escrituraEl.innerHTML = '';
        escrituraEl.style.color = '#c0d0e0';
        ocultarBotones();

        setTimeout(function() {
            if (!estaEditando && !procesandoIA) {
                iniciarAnimacion();
            }
        }, 300);
    } else {
        escrituraEl.dataset.textoPersonalizado = 'true';
        escrituraEl.style.color = '#c0d0e0';
        detenerAnimacion();
        if (btnEnviar) btnEnviar.style.display = 'block';
    }

    const selection = window.getSelection();
    if (selection) selection.removeAllRanges();
}

// ============================================
// 11. EVENTOS DE ESCRITURA
// ============================================
if (escrituraEl) {
    escrituraEl.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        if (!estaEditando && !procesandoIA) entrarEnEdicion();
    });

    escrituraEl.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            if (!e.shiftKey) {
                e.preventDefault();
                salirDeEdicion(true);
            }
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            if (textoOriginal && textoOriginal.trim() !== '' && !esTextoDeAnimacion(textoOriginal)) {
                escrituraEl.innerHTML = textoOriginal;
                escrituraEl.dataset.textoPersonalizado = 'true';
                escrituraEl.style.color = '#c0d0e0';
                if (btnEnviar) btnEnviar.style.display = 'block';
            } else {
                escrituraEl.dataset.textoPersonalizado = 'false';
                escrituraEl.innerHTML = '';
                escrituraEl.style.color = '#c0d0e0';
                ocultarBotones();
                setTimeout(function() {
                    if (!estaEditando && !procesandoIA) iniciarAnimacion();
                }, 300);
            }
            estaEditando = false;
            animacionEnCurso = false;
            escrituraEl.contentEditable = false;
            escrituraEl.style.backgroundColor = 'transparent';
            escrituraEl.style.border = 'none';
            escrituraEl.style.borderRadius = '0';
            escrituraEl.style.padding = '0';
            escrituraEl.style.outline = 'none';
            escrituraEl.style.color = '#c0d0e0';

            const selection = window.getSelection();
            if (selection) selection.removeAllRanges();
        }
    });

    escrituraEl.addEventListener('input', function() {
        if (estaEditando) actualizarBotonEnviar();
    });

    escrituraEl.addEventListener('paste', function() {
        setTimeout(function() {
            if (estaEditando) actualizarBotonEnviar();
        }, 10);
    });

    escrituraEl.addEventListener('blur', function() {
        if (estaEditando) {
            setTimeout(function() {
                if (estaEditando) salirDeEdicion(true);
            }, 150);
        }
    });
}

// Click fuera para salir
document.addEventListener('click', function(e) {
    if (escrituraEl && estaEditando) {
        if (!escrituraEl.contains(e.target) &&
            (!btnEnviar || !btnEnviar.contains(e.target)) &&
            (!btnConfirmar || !btnConfirmar.contains(e.target))) {
            salirDeEdicion(true);
        }
    }
});

// ============================================
// 12. INICIO
// ============================================
setTimeout(function() {
    iniciarAnimacion();
}, 500);

// ============================================
// 13. ANÁLISIS CON IA (vía Cloudflare Worker)
// ============================================

// ⚠️ URL real del Worker desplegado en Cloudflare
const WORKER_URL = 'https://finix-ai-proxy.nojavid-finix.workers.dev';

/**
 * Envía el texto libre al Worker y devuelve un array de movimientos:
 * [{ tipo: "gasto"|"ingreso", nombre: "Comida", precio: 30000, icono: "🍔" }]
 */
async function analizarConIA(texto) {
    if (!texto || !texto.trim()) return [];

    try {
        const res = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto: texto.trim() }),
        });

        // Worker caído / error HTTP
        if (!res.ok) {
            console.error('Worker respondió con status', res.status);
            return fallbackParser(texto);
        }

        const data = await res.json();

        // JSON inválido / array vacío / respuesta no-array
        if (!Array.isArray(data) || data.length === 0) {
            console.warn('IA devolvió array vacío o inválido, usando fallback');
            return fallbackParser(texto);
        }

        // Normalización defensiva final
        return data.map(m => ({
            tipo: m.tipo === 'ingreso' ? 'ingreso' : 'gasto',
            nombre: String(m.nombre || 'Movimiento'),
            precio: Math.round(Number(m.precio) || 0),
            icono: m.icono || '📌',
        }));
    } catch (err) {
        console.error('Error de red llamando al Worker:', err);
        return fallbackParser(texto);
    }
}

/**
 * Parser local de respaldo: se usa si el Worker falla o no responde.
 * Cubre casos comunes ("comida 30mil", "uber 12k", separados por + , ; o saltos).
 */
function fallbackParser(texto) {
    const partes = texto
        .split(/[+,\n;]+/)
        .map(s => s.trim())
        .filter(Boolean);

    const iconosPorCategoria = [
        { keys: ['comida', 'almuerzo', 'cena', 'desayuno', 'restaurante', 'café'], icono: '🍔' },
        { keys: ['gasolina', 'uber', 'taxi', 'bus', 'transporte', 'pasaje', 'moto'], icono: '⛽' },
        { keys: ['ropa', 'zapatos', 'camisa', 'pantalón', 'tenis'], icono: '👟' },
        { keys: ['salario', 'sueldo', 'pago', 'nómina', 'recibí', 'me pagaron'], icono: '💰' },
        { keys: ['mercado', 'supermercado', 'tienda', 'víveres'], icono: '🛒' },
        { keys: ['arriendo', 'renta', 'alquiler'], icono: '🏠' },
        { keys: ['luz', 'agua', 'gas', 'internet', 'teléfono', 'servicios'], icono: '💡' },
        { keys: ['salud', 'médico', 'farmacia', 'medicinas'], icono: '💊' },
        { keys: ['cine', 'juego', 'netflix', 'spotify', 'entretenimiento'], icono: '🎮' },
    ];

    const palabrasIngreso = ['me pagaron', 'recibí', 'sueldo', 'salario', 'ingreso', 'me consignaron', 'cobré', 'venta'];

    const resultado = [];

    for (const parte of partes) {
        const match = parte.match(/([\d.,]+)\s*(k|mil|m|millones?)?/i);
        if (!match) continue;

        let numStr = match[1].replace(/\./g, '').replace(/,/g, '.');
        let valor = parseFloat(numStr);
        if (isNaN(valor)) continue;

        const unidad = (match[2] || '').toLowerCase();
        if (unidad === 'k' || unidad === 'mil') valor *= 1000;
        else if (unidad === 'm' || unidad.startsWith('millon')) valor *= 1000000;

        const nombreRaw = parte.slice(0, match.index).replace(/[-:]+$/, '').trim();
        const nombre = nombreRaw
            ? nombreRaw.charAt(0).toUpperCase() + nombreRaw.slice(1)
            : 'Movimiento';

        let icono = '📌';
        const lower = nombre.toLowerCase();
        for (const cat of iconosPorCategoria) {
            if (cat.keys.some(k => lower.includes(k))) { icono = cat.icono; break; }
        }

        const textoLower = texto.toLowerCase();
        const tipo = palabrasIngreso.some(p => textoLower.includes(p)) ? 'ingreso' : 'gasto';

        resultado.push({
            tipo,
            nombre,
            precio: Math.round(valor),
            icono,
        });
    }

    return resultado;
}

console.log('✅ FinixJS cargado correctamente - IA integrada (gemini-3.1-flash-lite)');
console.log('✅ Worker URL:', WORKER_URL);
