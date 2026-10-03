// ============================================================
// CONFIGURACIÓN DE SUPABASE
// ============================================================
const SUPABASE_URL = 'https://dfhmekwkhsxvjuojuruv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_TxNdB8vq6tv0c12IWJ8GwQ_zCoUN4v8';

let supabaseClient = null;
if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase inicializado en finixjs.js');
} else {
    console.warn('⚠️ Librería de Supabase no detectada. Verifica el script en finix.html');
}

// ============================================================
// 1. CARGAR NOMBRE DEL USUARIO (desde Supabase o localStorage)
// ============================================================
async function cargarNombreUsuario() {
    const el = document.getElementById('nombreUsuario');
    if (!el) return;

    let nombreCompleto = '';

    if (supabaseClient) {
        try {
            const { data: { user }, error } = await supabaseClient.auth.getUser();

            if (error) {
                console.warn('⚠️ Error al obtener usuario:', error.message);
            }

            if (user) {
                nombreCompleto = user.user_metadata?.fullname
                              || user.user_metadata?.name
                              || user.user_metadata?.full_name
                              || '';
                console.log('👤 Usuario desde Supabase:', user.email, '| Nombre completo:', nombreCompleto);
            }
        } catch (e) {
            console.warn('⚠️ No se pudo obtener usuario desde Supabase:', e);
        }
    }

    if (!nombreCompleto) {
        try {
            const userLS = JSON.parse(localStorage.getItem('finix_user') || '{}');
            nombreCompleto = userLS.name || userLS.nombre || '';
            if (nombreCompleto) {
                console.log('👤 Usuario desde localStorage:', nombreCompleto);
            }
        } catch (e) {
            nombreCompleto = '';
        }
    }

    if (!nombreCompleto) {
        nombreCompleto = localStorage.getItem('finix_usuario')
                      || localStorage.getItem('nombreUsuario')
                      || '';
    }

    const primerNombre = nombreCompleto.trim().split(/\s+/)[0] || 'Usuario';

    el.textContent = primerNombre;
    console.log('✅ Nombre mostrado:', primerNombre);
}

// ============================================================
// 2. FORMATEAR PESOS COLOMBIANOS
// ============================================================
function formatoCOP(valor) {
    const num = Math.round(Number(valor) || 0);
    return '$' + num.toLocaleString('es-CO');
}

// ============================================================
// 3. LEER MOVIMIENTOS DE LOCALSTORAGE
// ============================================================
function leerMovimientos() {
    try {
        return JSON.parse(localStorage.getItem('finix_movimientos') || '[]');
    } catch (e) {
        return [];
    }
}

// ============================================================
// 4. CALCULAR TOTALES
// ============================================================
function calcularTotales() {
    const movs = leerMovimientos();
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();

    let totalIngresos = 0;
    let totalGastos = 0;
    let ingresosMes = 0;
    let gastosMes = 0;

    movs.forEach(m => {
        const precio = Number(m.precio) || 0;
        const fecha = new Date(m.fecha || Date.now());
        const esMesActual = fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;

        if (m.tipo === 'ingreso') {
            totalIngresos += precio;
            if (esMesActual) ingresosMes += precio;
        } else {
            totalGastos += precio;
            if (esMesActual) gastosMes += precio;
        }
    });

    return {
        totalIngresos,
        totalGastos,
        saldo: totalIngresos - totalGastos,
        ingresosMes,
        gastosMes
    };
}

// ============================================================
// 5. ACTUALIZAR SALDO PRINCIPAL
// ============================================================
function actualizarSaldo() {
    const { saldo } = calcularTotales();
    const el = document.getElementById('saldoTotal');
    if (el) el.textContent = formatoCOP(saldo);
}

// ============================================================
// 6. ACTUALIZAR RESUMEN RÁPIDO
// ============================================================
function actualizarResumen() {
    const { ingresosMes, gastosMes } = calcularTotales();
    const totalMes = ingresosMes + gastosMes;

    const ingresoEl = document.getElementById('ingresoMes');
    const gastoEl = document.getElementById('gastoMes');
    if (ingresoEl) ingresoEl.textContent = formatoCOP(ingresosMes);
    if (gastoEl) gastoEl.textContent = formatoCOP(gastosMes);

    const pctIngreso = totalMes > 0 ? Math.round((ingresosMes / totalMes) * 100) : 0;
    const pctGasto = totalMes > 0 ? Math.round((gastosMes / totalMes) * 100) : 0;

    const progIngreso = document.getElementById('progresoIngreso');
    const progGasto = document.getElementById('progresoGasto');
    const pctIngresoEl = document.getElementById('porcentajeIngreso');
    const pctGastoEl = document.getElementById('porcentajeGasto');

    if (progIngreso) progIngreso.style.width = pctIngreso + '%';
    if (progGasto) progGasto.style.width = pctGasto + '%';
    if (pctIngresoEl) pctIngresoEl.textContent = pctIngreso + '%';
    if (pctGastoEl) pctGastoEl.textContent = pctGasto + '%';
}

// ============================================================
// 7. ACTUALIZAR GRÁFICA DE ONDAS
// ============================================================
function actualizarGrafica() {
    const linea = document.getElementById('lineaGrafica');
    if (!linea) return;

    const movs = leerMovimientos();

    if (movs.length === 0) {
        linea.setAttribute('d',
            'M0,45 Q20,42 40,44 T80,43 T120,44 T160,42 L167,43'
        );
        return;
    }

    const ordenados = [...movs].sort((a, b) => {
        const fa = new Date(a.fecha || 0).getTime();
        const fb = new Date(b.fecha || 0).getTime();
        return fa - fb;
    });

    const puntos = [0];
    let acumulado = 0;
    ordenados.forEach(m => {
        const precio = Number(m.precio) || 0;
        acumulado += (m.tipo === 'ingreso' ? precio : -precio);
        puntos.push(acumulado);
    });

    const min = Math.min(...puntos);
    const max = Math.max(...puntos);
    const rango = (max - min) || 1;

    const Y_ARRIBA = 12;
    const Y_ABAJO = 55;
    const alto = Y_ABAJO - Y_ARRIBA;

    const ys = puntos.map(p => {
        const norm = (p - min) / rango;
        return Y_ABAJO - norm * alto;
    });

    const ancho = 167;
    const pasoX = ancho / (ys.length - 1 || 1);

    let d = `M0,${ys[0].toFixed(2)}`;
    for (let i = 1; i < ys.length; i++) {
        const x = (i * pasoX).toFixed(2);
        const y = ys[i].toFixed(2);
        const xMid = ((i - 0.5) * pasoX).toFixed(2);
        const yMid = ((ys[i - 1] + ys[i]) / 2).toFixed(2);
        d += ` Q${xMid},${yMid} ${x},${y}`;
    }

    linea.setAttribute('d', d);
}

// ============================================================
// 8. RENDERIZAR METAS DE AHORRO (desde Supabase)
// ============================================================
async function renderizarMetas() {
    const contenedor = document.getElementById('metasLista');
    if (!contenedor) return;

    let metas = [];

    // 👇 1) Intentar leer desde Supabase (tabla registros, seccion = 'ahorro')
    if (supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('registros')
                .select('*')
                .eq('seccion', 'ahorro')
                .order('fecha', { ascending: true });

            if (error) {
                console.warn('⚠️ Error al leer metas desde Supabase:', error.message);
            } else if (Array.isArray(data)) {
                metas = data.map(r => ({
                    nombre: r.nombre || 'Meta',
                    icono: r.icono || '🎯',
                    actual: Number(r.montoPagado) || 0,
                    meta: Number(r.monto) || 0
                }));
                console.log('🎯 Metas desde Supabase:', metas.length);
            }
        } catch (e) {
            console.warn('⚠️ Excepción leyendo metas desde Supabase:', e);
        }
    }

    // 👇 2) Fallback: si no hay nada en Supabase, intentar localStorage
    if (metas.length === 0) {
        try {
            const local = JSON.parse(localStorage.getItem('finix_metas') || '[]');
            if (Array.isArray(local)) metas = local;
        } catch (e) {
            metas = [];
        }
    }

    // 👇 3) Estado vacío
    if (metas.length === 0) {
        contenedor.innerHTML = `
            <div class="metas-vacio">
                <div class="metas-vacio-icono">🎯</div>
                <p class="metas-vacio-titulo">Aún no has creado una meta</p>
                <p class="metas-vacio-sub">Empieza a ahorrar y crea tu primera meta</p>
            </div>
        `;
        return;
    }

    // 👇 4) Solo las 2 primeras
    metas = metas.slice(0, 2);
    contenedor.innerHTML = '';

    metas.forEach(meta => {
        const actual = Number(meta.actual) || 0;
        const objetivo = Number(meta.meta) || 1;
        const pct = Math.min(Math.round((actual / objetivo) * 100), 100);

        const card = document.createElement('div');
        card.className = 'meta-card';
        card.innerHTML = `
            <div class="meta-icono">${meta.icono || '🎯'}</div>
            <div class="meta-info">
                <div class="meta-nombre">${meta.nombre || 'Meta'}</div>
                <div class="meta-progreso-texto">${formatoCOP(actual)} de ${formatoCOP(objetivo)}</div>
                <div class="meta-barra">
                    <div class="meta-barra-fill" style="width:${pct}%"></div>
                </div>
            </div>
            <div class="meta-porcentaje">${pct}%</div>
        `;
        contenedor.appendChild(card);
    });
}

// ============================================================
// 9. RENDERIZAR MOVIMIENTOS (solo los 5 últimos)
// ============================================================
function renderizarMovimientos() {
    const contenedor = document.getElementById('movimientosLista');
    const vacio = document.getElementById('movimientosVacio');
    if (!contenedor) return;

    const movs = leerMovimientos();

    if (movs.length === 0) {
        contenedor.innerHTML = '';
        if (vacio) vacio.style.display = 'block';
        return;
    }

    if (vacio) vacio.style.display = 'none';

    // 👇 Ordena del más reciente al más antiguo y toma solo los 5 primeros
    const ordenados = [...movs].sort((a, b) => {
        const fa = new Date(a.fecha || 0).getTime();
        const fb = new Date(b.fecha || 0).getTime();
        return fb - fa;
    }).slice(0, 5);

    contenedor.innerHTML = '';

    ordenados.forEach(mov => {
        const esIngreso = mov.tipo === 'ingreso';
        const fecha = new Date(mov.fecha || Date.now());
        const fechaStr = formatearFecha(fecha);

        const card = document.createElement('div');
        card.className = 'mov-card';
        card.dataset.id = mov.id || '';
        card.dataset.nombre = mov.nombre || 'Movimiento';
        card.innerHTML = `
            <div class="mov-icono ${esIngreso ? 'ingreso' : 'gasto'}">
                ${mov.icono || (esIngreso ? '💰' : '💸')}
            </div>
            <div class="mov-info">
                <div class="mov-nombre">${mov.nombre || 'Movimiento'}</div>
                <div class="mov-fecha">${fechaStr}</div>
            </div>
            <div class="mov-precio ${esIngreso ? 'ingreso' : 'gasto'}">
                ${esIngreso ? '+' : '-'}${formatoCOP(mov.precio)}
            </div>
        `;
        contenedor.appendChild(card);
    });

    inicializarLongPress();
}

function formatearFecha(fecha) {
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Ahora mismo';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHrs < 24) return `Hace ${diffHrs} h`;
    if (diffDias < 7) return `Hace ${diffDias} d`;

    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${fecha.getFullYear()}`;
}

// ============================================================
// 9.1 LONG PRESS PARA ELIMINAR MOVIMIENTO
// ============================================================
let longPressTimer = null;
let movimientoAEliminarId = null;

function inicializarLongPress() {
    const tarjetas = document.querySelectorAll('.mov-card');

    tarjetas.forEach(card => {
        if (card.dataset.longPressActivo === 'true') return;
        card.dataset.longPressActivo = 'true';

        let startX = 0, startY = 0;
        let movido = false;

        const iniciar = (e) => {
            movido = false;
            const punto = e.touches ? e.touches[0] : e;
            startX = punto.clientX;
            startY = punto.clientY;

            card.classList.add('presionado');

            longPressTimer = setTimeout(() => {
                if (movido) return;
                card.classList.remove('presionado');
                abrirModalEliminar(card.dataset.id, card.dataset.nombre);
            }, 600);
        };

        const cancelar = () => {
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
            card.classList.remove('presionado');
        };

        const mover = (e) => {
            const punto = e.touches ? e.touches[0] : e;
            const dx = Math.abs(punto.clientX - startX);
            const dy = Math.abs(punto.clientY - startY);
            if (dx > 8 || dy > 8) {
                movido = true;
                cancelar();
            }
        };

        card.addEventListener('mousedown', iniciar);
        card.addEventListener('mouseup', cancelar);
        card.addEventListener('mouseleave', cancelar);
        card.addEventListener('mousemove', mover);

        card.addEventListener('touchstart', iniciar, { passive: true });
        card.addEventListener('touchend', cancelar);
        card.addEventListener('touchcancel', cancelar);
        card.addEventListener('touchmove', mover, { passive: true });

        card.addEventListener('contextmenu', (e) => e.preventDefault());
    });
}

// ============================================================
// 9.2 MODAL ELIMINAR
// ============================================================
function abrirModalEliminar(id, nombre) {
    const modal = document.getElementById('modalEliminar');
    const texto = document.getElementById('modalEliminarTexto');
    if (!modal) return;

    movimientoAEliminarId = id;

    if (texto) {
        texto.textContent = `¿Seguro que quieres eliminar "${nombre}"? Esta acción no se puede deshacer.`;
    }

    modal.classList.add('activo');
    document.body.style.overflow = 'hidden';
}

function cerrarModalEliminar() {
    const modal = document.getElementById('modalEliminar');
    if (!modal) return;
    modal.classList.remove('activo');
    document.body.style.overflow = '';
    movimientoAEliminarId = null;
}

function confirmarEliminar() {
    if (!movimientoAEliminarId) return;

    let movs = leerMovimientos();
    movs = movs.filter(m => String(m.id) !== String(movimientoAEliminarId));

    localStorage.setItem('finix_movimientos', JSON.stringify(movs));

    actualizarSaldo();
    actualizarResumen();
    actualizarGrafica();
    renderizarMovimientos();

    cerrarModalEliminar();

    console.log('🗑️ Movimiento eliminado:', movimientoAEliminarId);
}

function inicializarModalEliminar() {
    const modal = document.getElementById('modalEliminar');
    const btnCancelar = document.getElementById('btnCancelarEliminar');
    const btnConfirmar = document.getElementById('btnConfirmarEliminar');

    if (btnCancelar) btnCancelar.addEventListener('click', cerrarModalEliminar);
    if (btnConfirmar) btnConfirmar.addEventListener('click', confirmarEliminar);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) cerrarModalEliminar();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') cerrarModalEliminar();
    });
}

// ============================================================
// 10. BOTÓN "EN TEXTO"
// ============================================================
function configurarBotonTexto() {
    const btn = document.getElementById('btnTexto');
    if (btn) {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // La pantalla de texto se abre con inicializarPantallaTexto()
        });
    }
}

// ============================================================
// 11. SWITCH DE TEMA CON DRAG
// ============================================================
function inicializarSwitchTema() {
    const track = document.getElementById('switchTrack');
    const thumb = document.getElementById('switchThumb');
    const thumbIcono = document.getElementById('thumbIcono');

    if (!track || !thumb || !thumbIcono) return;

    const esModoOscuro = document.body.classList.contains('dark-mode');

    const MIN_LEFT = 2;
    const MAX_LEFT = 32;

    const SVG_SOL = `
        <circle cx="12" cy="12" r="4"/>
        <line x1="12" y1="2" x2="12" y2="4"/>
        <line x1="12" y1="20" x2="12" y2="22"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="2" y1="12" x2="4" y2="12"/>
        <line x1="20" y1="12" x2="22" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    `;

    const SVG_LUNA = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    `;

    function aplicarEstadoInicial() {
        if (esModoOscuro) {
            document.body.classList.add('dark-mode');
            thumbIcono.innerHTML = SVG_LUNA;
            thumb.style.transition = 'none';
            thumb.style.left = MAX_LEFT + 'px';
            void thumb.offsetWidth;
            thumb.style.transition = '';
        } else {
            document.body.classList.remove('dark-mode');
            thumbIcono.innerHTML = SVG_SOL;
            thumb.style.transition = 'none';
            thumb.style.left = MIN_LEFT + 'px';
            void thumb.offsetWidth;
            thumb.style.transition = '';
        }
    }

    aplicarEstadoInicial();

    let arrastrando = false;
    let startX = 0;
    let thumbStartLeft = 0;
    const movimientoMinimo = 5;

    function cambiarTema(nuevoModoOscuro) {
        const temaActualOscuro = document.body.classList.contains('dark-mode');
        if (nuevoModoOscuro === temaActualOscuro) return;

        localStorage.setItem('finix_tema', nuevoModoOscuro ? 'oscuro' : 'claro');

        if (nuevoModoOscuro) {
            document.body.classList.add('dark-mode');
            thumbIcono.innerHTML = SVG_LUNA;
        } else {
            document.body.classList.remove('dark-mode');
            thumbIcono.innerHTML = SVG_SOL;
        }
    }

    track.addEventListener('click', () => {
        if (arrastrando) return;
        const estaOscuro = document.body.classList.contains('dark-mode');
        cambiarTema(!estaOscuro);
    });

    thumb.addEventListener('mousedown', iniciarDrag);
    thumb.addEventListener('touchstart', iniciarDrag, { passive: true });

    function iniciarDrag(e) {
        arrastrando = false;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        startX = clientX;
        thumbStartLeft = parseInt(thumb.style.left) || MIN_LEFT;
        track.classList.add('dragging');

        document.addEventListener('mousemove', moverDrag);
        document.addEventListener('touchmove', moverDrag, { passive: false });
        document.addEventListener('mouseup', terminarDrag);
        document.addEventListener('touchend', terminarDrag);
    }

    function moverDrag(e) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const delta = clientX - startX;

        if (Math.abs(delta) > movimientoMinimo) {
            arrastrando = true;
        }

        if (!arrastrando) return;

        let nuevoLeft = thumbStartLeft + delta;
        nuevoLeft = Math.max(MIN_LEFT, Math.min(MAX_LEFT, nuevoLeft));
        thumb.style.left = nuevoLeft + 'px';
    }

    function terminarDrag() {
        document.removeEventListener('mousemove', moverDrag);
        document.removeEventListener('touchmove', moverDrag);
        document.removeEventListener('mouseup', terminarDrag);
        document.removeEventListener('touchend', terminarDrag);
        track.classList.remove('dragging');

        if (!arrastrando) return;

        const leftActual = parseInt(thumb.style.left) || MIN_LEFT;
        const centro = (MIN_LEFT + MAX_LEFT) / 2;
        const debeIrOscuro = leftActual > centro;

        thumb.style.left = (debeIrOscuro ? MAX_LEFT : MIN_LEFT) + 'px';

        setTimeout(() => {
            cambiarTema(debeIrOscuro);
        }, 180);

        arrastrando = false;
    }
}

// ============================================================
// 12. MARCAR NAV ACTIVA
// ============================================================
function marcarActivo() {
    const paginaActual = window.location.pathname.split('/').pop() || 'finix.html';
    const enlaces = document.querySelectorAll('.bottom-nav a');
    enlaces.forEach((enlace) => {
        const dataPage = enlace.getAttribute('data-page');
        if (dataPage === paginaActual) {
            enlace.classList.add('active');
        } else {
            enlace.classList.remove('active');
        }
    });
}

// ============================================================
// 13. PANTALLA ENTRADA POR TEXTO
// ============================================================
function inicializarPantallaTexto() {
    const overlay        = document.getElementById('pantallaTexto');
    const btnCerrar      = document.getElementById('ptBtnCerrar');
    const btnProcesar    = document.getElementById('ptBtnProcesar');
    const btnDoble       = document.getElementById('ptBtnDoble');
    const btnAgregarOtro = document.getElementById('ptBtnAgregarOtro');
    const btnEnviar      = document.getElementById('ptBtnEnviar');
    const input          = document.getElementById('ptInput');
    const typing         = document.getElementById('ptTyping');
    const cursor         = document.getElementById('ptCursor');
    const animacion      = document.getElementById('ptAnimacion');
    const procesando     = document.getElementById('ptProcesando');
    const tarjetas       = document.getElementById('ptTarjetas');
    const preview        = document.getElementById('ptPreview');
    const previewLista   = document.getElementById('ptPreviewLista');
    const btnTexto       = document.getElementById('btnTexto');

    if (!overlay || !btnTexto) return;

    const EJEMPLOS = [
        {
            texto: 'almuerzo 18k + uber 15mil',
            resultados: [
                { icono: '🍽️', nombre: 'Almuerzo', valor: '$18.000', tipo: 'gasto' },
                { icono: '🚗', nombre: 'Uber',     valor: '$15.000', tipo: 'gasto' }
            ]
        },
        {
            texto: 'ingreso de didi 25k',
            resultados: [
                { icono: '🚗', nombre: 'Didi', valor: '$25.000', tipo: 'ingreso' }
            ]
        },
        {
            texto: 'café 5mil + mercado 120.000',
            resultados: [
                { icono: '☕', nombre: 'Café',    valor: '$5.000',   tipo: 'gasto' },
                { icono: '🛒', nombre: 'Mercado', valor: '$120.000', tipo: 'gasto' }
            ]
        }
    ];

    let ejemplosIndex = 0;

    let typingTimeout = null;
    let inputVacioTimeout = null;
    let loopActivo = false;
    let escribiendoAhora = false;

    let movimientosPendientes = [];

    btnTexto.addEventListener('click', (e) => {
        e.preventDefault();
        overlay.classList.add('activo');
        document.body.style.overflow = 'hidden';
        movimientosPendientes = [];
        ejemplosIndex = 0;

        loopActivo = true;
        setTimeout(() => iniciarCiclo(), 350);
    });

    function cerrarPantalla() {
        overlay.classList.remove('activo');
        document.body.style.overflow = '';
        loopActivo = false;
        escribiendoAhora = false;
        movimientosPendientes = [];

        if (typingTimeout) {
            clearTimeout(typingTimeout);
            typingTimeout = null;
        }
        if (inputVacioTimeout) {
            clearTimeout(inputVacioTimeout);
            inputVacioTimeout = null;
        }
    }

    btnCerrar.addEventListener('click', cerrarPantalla);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cerrarPantalla();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('activo')) {
            cerrarPantalla();
        }
    });

    function iniciarCiclo() {
        if (!loopActivo) return;
        escribirTexto();
    }

    function escribirTexto() {
        if (!loopActivo) return;
        escribiendoAhora = true;

        const ejemploActual = EJEMPLOS[ejemplosIndex];
        const textoActual = ejemploActual.texto;

        typing.textContent = '';
        cursor.style.display = 'inline-block';
        animacion.style.display = 'flex';
        procesando.classList.remove('activo');
        tarjetas.classList.remove('activo');
        tarjetas.innerHTML = '';
        preview.classList.remove('activo');
        btnDoble.classList.remove('activo');

        let i = 0;
        const velocidad = 55;

        function escribir() {
            if (!loopActivo) return;

            if (i < textoActual.length) {
                typing.textContent += textoActual.charAt(i);
                i++;
                typingTimeout = setTimeout(escribir, velocidad);
            } else {
                typingTimeout = setTimeout(() => {
                    cursor.style.display = 'none';
                    mostrarProcesando();
                }, 600);
            }
        }

        escribir();
    }

    function mostrarProcesando() {
        if (!loopActivo) return;

        animacion.style.display = 'none';
        procesando.classList.add('activo');

        typingTimeout = setTimeout(() => {
            if (!loopActivo) return;
            procesando.classList.remove('activo');
            mostrarTarjetas();
        }, 1200);
    }

    function mostrarTarjetas() {
        if (!loopActivo) return;

        const ejemploActual = EJEMPLOS[ejemplosIndex];
        const resultadosActuales = ejemploActual.resultados;

        tarjetas.innerHTML = '';
        tarjetas.classList.add('activo');

        resultadosActuales.forEach((item, index) => {
            const esIngreso = item.tipo === 'ingreso';
            const card = document.createElement('div');
            card.className = 'pt-tarjeta ' + (esIngreso ? 'pt-tarjeta-ingreso' : 'pt-tarjeta-gasto');
            card.style.animationDelay = (index * 0.15) + 's';
            card.innerHTML = `
                <div class="pt-tarjeta-icono">${item.icono}</div>
                <div class="pt-tarjeta-nombre">${item.nombre}</div>
                <div class="pt-tarjeta-valor ${esIngreso ? 'valor-ingreso' : 'valor-gasto'}">
                    ${esIngreso ? '+' : '-'}${item.valor}
                </div>
            `;
            tarjetas.appendChild(card);
        });

        typingTimeout = setTimeout(() => {
            if (!loopActivo) return;
            tarjetas.classList.remove('activo');
            tarjetas.innerHTML = '';
            escribiendoAhora = false;

            ejemplosIndex = (ejemplosIndex + 1) % EJEMPLOS.length;

            iniciarCiclo();
        }, 1800);
    }

    function detenerBucleYHabilitarInput() {
        loopActivo = false;
        escribiendoAhora = false;

        if (typingTimeout) {
            clearTimeout(typingTimeout);
            typingTimeout = null;
        }

        typing.textContent = '';
        cursor.style.display = 'none';
        animacion.style.display = 'none';
        procesando.classList.remove('activo');
        tarjetas.classList.remove('activo');
        tarjetas.innerHTML = '';
        preview.classList.remove('activo');
        btnDoble.classList.remove('activo');

        input.classList.add('activo');
        input.focus();
    }

    const rectangulo = document.getElementById('ptRectangulo');
    if (rectangulo) {
        rectangulo.addEventListener('click', (e) => {
            if (e.target === input) return;

            if (loopActivo) {
                detenerBucleYHabilitarInput();
            } else if (!input.classList.contains('activo') && !preview.classList.contains('activo')) {
                input.classList.add('activo');
                input.focus();
            }
        });
    }

    input.addEventListener('input', () => {
        const texto = input.value.trim();
        const tieneTexto = texto.length > 0;

        if (tieneTexto) {
            btnProcesar.classList.add('activo');
        } else {
            btnProcesar.classList.remove('activo');
        }

        if (!tieneTexto) {
            if (inputVacioTimeout) clearTimeout(inputVacioTimeout);
            inputVacioTimeout = setTimeout(() => {
                if (input.value.trim().length === 0 && !preview.classList.contains('activo')) {
                    volverAlBucle();
                }
            }, 900);
        } else {
            if (inputVacioTimeout) {
                clearTimeout(inputVacioTimeout);
                inputVacioTimeout = null;
            }
        }
    });

    function volverAlBucle() {
        input.value = '';
        input.classList.remove('activo');
        btnProcesar.classList.remove('activo');
        btnDoble.classList.remove('activo');
        preview.classList.remove('activo');
        previewLista.innerHTML = '';

        tarjetas.classList.remove('activo');
        tarjetas.innerHTML = '';
        procesando.classList.remove('activo');
        animacion.style.display = 'flex';
        typing.textContent = '';
        cursor.style.display = 'inline-block';

        loopActivo = true;
        iniciarCiclo();
    }

    btnProcesar.addEventListener('click', async () => {
        const texto = input.value.trim();
        if (!texto) return;

        console.log('📝 Procesar texto con IA:', texto);

        input.classList.remove('activo');
        btnProcesar.classList.remove('activo');
        procesando.classList.add('activo');

        const movimientos = await parsearTextoConIA(texto);

        procesando.classList.remove('activo');

        if (movimientos.length === 0) {
            input.classList.add('activo');
            input.focus();
            return;
        }

        const nuevos = movimientos.map((m, idx) => ({
            id: Date.now() + idx,
            nombre: m.nombre,
            precio: m.valor,
            tipo: m.tipo,
            icono: m.icono,
            fecha: new Date().toISOString()
        }));

        movimientosPendientes = [...movimientosPendientes, ...nuevos];

        console.log('📦 Pendientes acumulados:', movimientosPendientes.length);

        mostrarPreview();
    });

    function mostrarPreview() {
        previewLista.innerHTML = '';

        movimientosPendientes.forEach((m, index) => {
            const esIngreso = m.tipo === 'ingreso';
            const card = document.createElement('div');
            card.className = 'pt-tarjeta ' + (esIngreso ? 'pt-tarjeta-ingreso' : 'pt-tarjeta-gasto');
            card.style.animationDelay = (index * 0.12) + 's';
            card.innerHTML = `
                <div class="pt-tarjeta-icono">${m.icono}</div>
                <div class="pt-tarjeta-nombre">${m.nombre}</div>
                <div class="pt-tarjeta-valor ${esIngreso ? 'valor-ingreso' : 'valor-gasto'}">
                    ${esIngreso ? '+' : '-'}${formatoCOP(m.precio)}
                </div>
            `;
            previewLista.appendChild(card);
        });

        preview.classList.add('activo');
        btnDoble.classList.add('activo');

        input.value = '';
    }

    btnAgregarOtro.addEventListener('click', () => {
        preview.classList.remove('activo');
        btnDoble.classList.remove('activo');
        input.value = '';
        input.classList.add('activo');
        input.focus();
    });

    btnEnviar.addEventListener('click', () => {
        if (movimientosPendientes.length === 0) return;

        const existentes = leerMovimientos();
        localStorage.setItem(
            'finix_movimientos',
            JSON.stringify([...existentes, ...movimientosPendientes])
        );

        actualizarSaldo();
        actualizarResumen();
        actualizarGrafica();
        renderizarMovimientos();

        console.log('✅ Movimientos guardados:', movimientosPendientes.length);

        movimientosPendientes = [];
        cerrarPantalla();
    });

    async function parsearTextoConIA(texto) {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/functions/v1/parsear-texto`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'apikey': SUPABASE_ANON_KEY
                    },
                    body: JSON.stringify({ texto })
                }
            );

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`HTTP ${response.status}: ${err}`);
            }

            const data = await response.json();

            if (!data.movimientos || !Array.isArray(data.movimientos)) {
                throw new Error('Respuesta inválida del servidor');
            }

            console.log('🤖 IA respondió:', data.movimientos.length, 'movimientos');
            return data.movimientos;

        } catch (err) {
            console.error('❌ Error IA, usando parser local:', err);
            return parsearTextoLocal(texto);
        }
    }

    function parsearTextoLocal(texto) {
        const partes = texto.split(/[+,]/).map(p => p.trim()).filter(Boolean);
        const resultados = [];

        partes.forEach(parte => {
            const match = parte.match(/(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(k|mil|millones?)?/i);
            let valor = 0;
            let nombre = parte;

            if (match) {
                let numStr = match[1].replace(/\./g, '').replace(',', '.');
                let num = parseFloat(numStr);
                const unidad = (match[2] || '').toLowerCase();

                if (unidad === 'k' || unidad === 'mil') num *= 1000;
                else if (unidad.startsWith('millon')) num *= 1000000;

                valor = Math.round(num);
                nombre = parte.replace(match[0], '').trim() || 'Movimiento';
            }

            if (!nombre || valor <= 0) return;

            const n = nombre.toLowerCase();
            const esIngreso = /\b(ingreso|ingresó|recibí|recibi|me pagaron|consignaron|entró|entro|ganancia|sueldo|salario|venta|cobré|cobre)\b/.test(n);

            let icono = esIngreso ? '💰' : '💸';
            if (n.includes('almuerzo') || n.includes('comida') || n.includes('cena')) icono = '🍽️';
            else if (n.includes('uber') || n.includes('taxi') || n.includes('bus') || n.includes('didi')) icono = '🚗';
            else if (n.includes('café') || n.includes('cafe')) icono = '☕';
            else if (n.includes('zapato') || n.includes('tenis')) icono = '👟';
            else if (n.includes('ropa') || n.includes('camisa')) icono = '👕';
            else if (n.includes('mercado') || n.includes('supermercado')) icono = '🛒';
            else if (n.includes('gasolina')) icono = '⛽';
            else if (n.includes('regalo')) icono = '🎁';
            else if (n.includes('sueldo') || n.includes('salario')) icono = '💰';

            resultados.push({
                nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
                valor,
                icono,
                tipo: esIngreso ? 'ingreso' : 'gasto'
            });
        });

        return resultados;
    }
}

// ============================================================
// 14. INICIALIZACIÓN
// ============================================================
async function init() {
    const temaGuardado = localStorage.getItem('finix_tema');
    if (temaGuardado === 'oscuro') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }

    await cargarNombreUsuario();

    actualizarSaldo();
    actualizarResumen();
    actualizarGrafica();
    await renderizarMetas();      // 👈 ahora async
    renderizarMovimientos();
    configurarBotonTexto();
    inicializarSwitchTema();
    inicializarModalEliminar();
    inicializarPantallaTexto();
    marcarActivo();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ============================================================
// 15. ACTUALIZAR AL VOLVER A LA PESTAÑA
// ============================================================
window.addEventListener('focus', async () => {
    cargarNombreUsuario();
    actualizarSaldo();
    actualizarResumen();
    actualizarGrafica();
    await renderizarMetas();      // 👈 ahora async
    renderizarMovimientos();
});

console.log('✅ finixjs.js cargado correctamente');