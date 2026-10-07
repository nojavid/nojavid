// ============================================
// REFERENCIAS AL DOM
// ============================================
const inputValor        = document.getElementById('inputValor');
const nombreUsuario     = document.getElementById('nombreUsuario');
const totalIngreso      = document.getElementById('totalIngreso');
const totalGasto        = document.getElementById('totalGasto');
const contenedorQR      = document.getElementById('contenedorQR');
const qrPlaceholder     = document.getElementById('qrPlaceholder');
const btnCodigo         = document.getElementById('btnCodigo');
const btnPagado         = document.getElementById('btnPagado');
const btnCancelar       = document.getElementById('btnCancelar');
const selectorMovimiento = document.getElementById('selectorMovimiento');
const listaMovimientos  = document.getElementById('listaMovimientos');
const contenedorOtro    = document.getElementById('contenedorOtro');
const inputOtro         = document.getElementById('inputOtro');

// Overlay de advertencia
const overlayAdvertencia     = document.getElementById('overlayAdvertencia');
const advertenciaTexto       = document.getElementById('advertenciaTexto');
const btnCerrarAdvertencia   = document.getElementById('btnCerrarAdvertencia');

// ============================================
// ESTADO
// ============================================
let totalIngresos = 0;
let totalGastos   = 0;
let qrGenerado    = false;
let movimientos   = [];
let inputEnfocado = null;

// ============================================
// ICONOS POR CATEGORÍA
// ============================================
const ICONOS = {
    'Didi':      '🚗',
    'Uber':      '🚙',
    'Indrive':   '🚕',
    'Yango':     '🚖',
    'Gasolina':  '⛽',
    'Pinchada':  '🔧',
    'Otro':      '💸'
};

// ============================================
// 0. OVERLAY DE ADVERTENCIA
// ============================================
function mostrarAdvertencia(mensaje) {
    if (!overlayAdvertencia) return;
    if (advertenciaTexto) advertenciaTexto.textContent = mensaje;
    overlayAdvertencia.classList.add('activo');
    document.body.style.overflow = 'hidden';
}

function cerrarAdvertencia() {
    if (!overlayAdvertencia) return;
    overlayAdvertencia.classList.remove('activo');
    document.body.style.overflow = '';

    // Devolver el foco al input correspondiente
    if (inputEnfocado === 'otro' && inputOtro) {
        inputOtro.focus();
    } else if (inputValor) {
        inputValor.focus();
    }
}

if (btnCerrarAdvertencia) {
    btnCerrarAdvertencia.addEventListener('click', cerrarAdvertencia);
}

if (overlayAdvertencia) {
    overlayAdvertencia.addEventListener('click', (e) => {
        if (e.target === overlayAdvertencia) cerrarAdvertencia();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlayAdvertencia?.classList.contains('activo')) {
        cerrarAdvertencia();
    }
});

// ============================================
// 1. CARGAR NOMBRE DEL USUARIO (CORREGIDO)
// ============================================
async function cargarUsuario() {
    try {
        // 1) Verificar dependencias
        if (typeof supabaseClient === 'undefined' || typeof dbObtenerPerfil !== 'function') {
            console.error('❌ Supabase o dbObtenerPerfil no están disponibles.');
            const nombreLocal = localStorage.getItem("nombreUsuario");
            nombreUsuario.textContent = nombreLocal || 'Usuario';
            return;
        }

        // 2) Traer perfil desde Supabase (SIEMPRE, para tener el dato más reciente)
        const perfil = await dbObtenerPerfil();
        console.log('🔎 PERFIL RECIBIDO:', perfil); 

        if (!perfil) {
            const nombreLocal = localStorage.getItem("nombreUsuario");
            nombreUsuario.textContent = nombreLocal || 'Invitado';
            return;
        }

        // 3) Buscar el nombre. Si no hay full_name, usamos el email
        let nombre = 
            perfil.full_name ||
            perfil.nombre ||
            perfil.nombre_completo ||
            perfil.name ||
            perfil.username ||
            perfil.display_name;

        // Si no hay nombre, usamos la parte antes del @ del email
        if (!nombre && perfil.email) {
            nombre = perfil.email.split('@')[0]; 
        }

        // Si aún así no hay nada, usamos "Usuario"
        if (!nombre) {
            nombre = 'Usuario';
        }

        console.log('✅ NOMBRE USADO:', nombre);
        nombreUsuario.textContent = nombre;

        // 4) Guardar en localStorage (solo si es un nombre real)
        if (nombre && nombre !== 'Usuario' && nombre !== 'Invitado') {
            localStorage.setItem("nombreUsuario", nombre);
        }

    } catch (error) {
        console.error('❌ Error cargando usuario:', error);
        const nombreLocal = localStorage.getItem("nombreUsuario");
        nombreUsuario.textContent = nombreLocal || 'Usuario';
    }
}

// ============================================
// 2. FORMATEAR MONEDA
// ============================================
function formatearMoneda(valor) {
    return '$' + Math.abs(valor).toLocaleString('es-CO');
}

// ============================================
// 3. ACTUALIZAR TOTALES
// ============================================
function actualizarTotal() {
    totalIngreso.textContent = '+' + formatearMoneda(totalIngresos);
    totalGasto.textContent   = '-' + formatearMoneda(totalGastos);
}

// ============================================
// 4. FORMATEAR INPUT MIENTRAS ESCRIBE
// ============================================
function formatearInput(valorCrudo) {
    const soloNumeros = valorCrudo.replace(/\D/g, '');
    if (!soloNumeros) return '';
    return Number(soloNumeros).toLocaleString('es-CO');
}

function obtenerValorNumerico() {
    const limpio = inputValor.value.replace(/\./g, '').replace(/\D/g, '');
    return parseInt(limpio, 10) || 0;
}

// ============================================
// 5. PAYLOAD BRE-B + CRC
// ============================================
const PLANTILLA_BREB = "00020101021126320014CO.COM.RBM.LLA0210313874406649250014CO.COM.RBM.RED0103RBM50310013CO.COM.RBM.CU0110000000000051220013CO.COM.RBM.CA0101052040000530317054075000.005802CO59010600106101062270710CC3D75AE64080200110363180270016CO.COM.RBM.CANAL0103APP81250015CO.COM.RBM.CIVA01020282260014CO.COM.RBM.IVA01040.0083270015CO.COM.RBM.BASE01040.0084250015CO.COM.RBM.CINC01020285260014CO.COM.RBM.INC01040.0090430016CO.COM.RBM.TRXID0119000002FSStDLs2ndrBr91460014CO.COM.RBM.SEC0124eXnV6BwgdGNLszxps5ijFyfR6304A413";

function calcularCRC16(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
            crc &= 0xFFFF;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

function generarPayloadBreB(monto) {
    const montoFormateado = monto.toFixed(2);
    const longitudMonto   = montoFormateado.length.toString().padStart(2, '0');
    const nuevoTag54      = '54' + longitudMonto + montoFormateado;

    const payloadSinCRC = PLANTILLA_BREB.replace(/54\d{2}\d+\.\d{2}/, nuevoTag54);
    const payloadSinCRCAntiguo = payloadSinCRC.slice(0, -8);
    const payloadParaCRC = payloadSinCRCAntiguo.endsWith('6304')
        ? payloadSinCRCAntiguo
        : payloadSinCRCAntiguo + '6304';

    const nuevoCRC = calcularCRC16(payloadParaCRC);
    return payloadParaCRC + nuevoCRC;
}

// ============================================
// 6. GENERAR QR
// ============================================
function generarQR(monto) {
    const qrExistente = contenedorQR.querySelector('img');
    if (qrExistente) qrExistente.remove();

    const payloadBreB = generarPayloadBreB(monto);
    const urlQR = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payloadBreB)}`;

    const img = document.createElement('img');
    img.src = urlQR;
    img.alt = 'Código QR Bre-B';
    img.onload = () => {
        qrPlaceholder.style.display = 'none';
        contenedorQR.classList.add('activo');
        qrGenerado = true;
    };
    img.onerror = () => {
        qrPlaceholder.style.display = 'block';
        qrPlaceholder.innerHTML = '<p>Error al generar el QR</p>';
    };

    contenedorQR.appendChild(img);
}

function eliminarQR() {
    const img = contenedorQR.querySelector('img');
    if (img) img.remove();
    qrPlaceholder.style.display = 'block';
    qrPlaceholder.innerHTML = '<p>Tu QR aparecerá aquí</p>';
    contenedorQR.classList.remove('activo');
    qrGenerado = false;
}

// ============================================
// 7. RENDERIZAR LISTA DE MOVIMIENTOS
// ============================================
function renderizarMovimientos() {
    if (movimientos.length === 0) {
        listaMovimientos.innerHTML = '<p class="movimientos-vacio">Aquí verás tus movimientos</p>';
        return;
    }

    listaMovimientos.innerHTML = '';

    movimientos.slice().reverse().forEach((mov) => {
        const item = document.createElement('div');
        item.className = `movimiento-item ${mov.tipo}`;

        const signo = mov.tipo === 'ingreso' ? '+' : '-';
        const claseMonto = mov.tipo === 'ingreso' ? 'ingreso' : 'gasto';

        const categoriaMostrar = mov.descripcion
            ? `${mov.categoria}: ${mov.descripcion}`
            : mov.categoria;

        item.innerHTML = `
            <div class="movimiento-info">
                <span class="movimiento-categoria">${categoriaMostrar}</span>
                <span class="movimiento-tipo">${mov.tipo}</span>
            </div>
            <span class="movimiento-monto ${claseMonto}">${signo} ${formatearMoneda(mov.monto)}</span>
        `;

        listaMovimientos.appendChild(item);
    });
}

// ============================================
// 8. GUARDAR MOVIMIENTO EN SUPABASE
// ============================================
async function guardarMovimientoEnBD(tipo, categoria, monto, descripcion = '') {
    if (typeof supabaseClient === 'undefined') {
        console.warn('⚠️ Supabase no disponible, guardando solo localmente');
        return null;
    }

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            console.warn('⚠️ No hay usuario logueado, no se guarda en BD');
            return null;
        }

        const icono = ICONOS[categoria] || (tipo === 'ingreso' ? '💰' : '💸');

        const { data, error } = await supabaseClient
            .from('movimientos_plataformas')
            .insert({
                user_id: user.id,
                tipo,
                categoria,
                descripcion,
                monto,
                icono,
                fecha: new Date().toISOString(),
                sincronizado: false
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Error guardando movimiento:', error.message);
            return null;
        }

        console.log('✅ Movimiento guardado en Supabase:', data);
        return data;

    } catch (e) {
        console.error('❌ Excepción guardando movimiento:', e);
        return null;
    }
}

// ============================================
// 9. AGREGAR MOVIMIENTO (local + BD)
// ============================================
async function agregarMovimiento(tipo, categoria, monto, descripcion = '') {
    movimientos.push({
        tipo,
        categoria,
        monto,
        descripcion,
        fecha: new Date().toISOString(),
    });
    renderizarMovimientos();

    await guardarMovimientoEnBD(tipo, categoria, monto, descripcion);
}

// ============================================
// 10. MOSTRAR/OCULTAR INPUT "OTRO"
// ============================================
function actualizarVisibilidadOtro() {
    const [, categoria] = selectorMovimiento.value.split('|');

    if (categoria === 'Otro') {
        contenedorOtro.classList.add('visible');
        setTimeout(() => inputOtro.focus(), 150);
    } else {
        contenedorOtro.classList.remove('visible');
        inputOtro.value = '';
    }
}

selectorMovimiento.addEventListener('change', actualizarVisibilidadOtro);

// ============================================
// 11. INPUT: FORMATEO AUTOMÁTICO
// ============================================
inputValor.addEventListener('input', (e) => {
    const cursorPos = e.target.selectionStart;
    const valorAnterior = e.target.value;
    const formateado = formatearInput(e.target.value);
    e.target.value = formateado;

    const diferencia = formateado.length - valorAnterior.length;
    e.target.setSelectionRange(cursorPos + diferencia, cursorPos + diferencia);
});

// ============================================
// 12. BOTÓN CÓDIGO
// ============================================
btnCodigo.addEventListener('click', () => {
    const monto = obtenerValorNumerico();
    if (!monto || monto <= 0) {
        inputEnfocado = 'valor';
        mostrarAdvertencia('Por favor ingresa un valor válido antes de generar el QR.');
        return;
    }
    generarQR(monto);
});

// ============================================
// 13. BOTÓN PAGADO
// ============================================
btnPagado.addEventListener('click', async () => {
    const monto = obtenerValorNumerico();
    if (!monto || monto <= 0) {
        inputEnfocado = 'valor';
        mostrarAdvertencia('Por favor ingresa un valor válido antes de marcar como pagado.');
        return;
    }

    const [tipo, categoria] = selectorMovimiento.value.split('|');

    let descripcion = '';
    if (categoria === 'Otro') {
        descripcion = inputOtro.value.trim();
        if (!descripcion) {
            inputEnfocado = 'otro';
            mostrarAdvertencia('Por favor especifica qué fue antes de continuar.');
            return;
        }
    }

    if (tipo === 'ingreso') {
        totalIngresos += monto;
    } else {
        totalGastos += monto;
    }
    actualizarTotal();

    await agregarMovimiento(tipo, categoria, monto, descripcion);

    inputValor.value = '';
    inputOtro.value = '';
    contenedorOtro.classList.remove('visible');
});

// ============================================
// 14. BOTÓN CANCELAR
// ============================================
btnCancelar.addEventListener('click', () => {
    eliminarQR();
    inputValor.value = '';
    inputOtro.value = '';
    contenedorOtro.classList.remove('visible');
    inputValor.focus();
});

// ============================================
// 15. INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    await cargarUsuario();
    actualizarTotal();
    renderizarMovimientos();
});