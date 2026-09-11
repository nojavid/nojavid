// ============================================ 
// 1. RUTA DEL ARCHIVO DE DATOS
// ============================================
// Ruta base donde están los archivos JSON
const RUTA_BASE = '../Tanaj/libros/';

// Mapeo de libros disponibles
const LIBROS = {
    genesis: { archivo: 'genesis.json', nombre: 'Génesis' },
    exodo: { archivo: 'exodo.json', nombre: 'Exodo' },
    levitco: {archivo: 'levitico.json', nombre: 'Levitico'},
    numeros: {archivo: 'numeros.json', nombre: 'Numeros'},
    deuteronomio: {archivo: 'deuteronomio.json', nombre: 'Deuteronomio'},
    josue: {archivo: 'josue.json', nombre: 'Josue'},
    jueces: {archivo: 'jueces.json', nombre: 'Juces'},
    rut: {archivo: 'rut.json', nombre: 'Rut'},
    isamuel: {archivo: 'isamuel.json', nombre: '1 Samuel'},
    iisamuel: {archivo: 'iisamuel.json', nombre: '2 Samuel'},
    ireyes: {archivo: 'ireyes.json', nombre: '1 Reyes'},
    iireyes: {archivo: 'iireyes.json', nombre: '2 Reyes'},
    icronicas: {archivo: 'icronicas.json', nombre: '1 Cronicas'},
    iicronicas: {archivo: 'iicronicas.json', nombre: '2 Cronicas'},
    esdras: {archivo: 'esdras.json', nombre: 'Esdras'},
    nehemias: {archivo: 'nehemias.json', nombre: 'Nehemias'},
    ester: {archivo: 'ester.json', nombre: 'Ester'},
    job: {archivo: 'job.json', nombre: 'Job'},
    salmos: {archivo: 'salmos.json', nombre: 'Salmos'},
    proverbios: {archivo: 'proverbios.json', nombre: 'Proverbios'},
    eclesiastes: {archivo: 'eclesiastes.json', nombre: 'Eclesiastes'},
    cantar: {archivo: 'cantar.json', nombre: 'Cantar de los Cantares'},
    isaias: {archivo: 'isaias.json', nombre: 'Isaias'},
    jeremias: {archivo: 'jeremias.json', nombre: 'Jeremias'},
    lamentaciones: {archivo: 'lamentaciones.json', nombre: 'Lamentaciones'},
    ezequiel: {archivo: 'ezequiel.json', nombre: 'Ezequiel'},
    daniel: {archivo: 'daniel.json', nombre: 'Daniel'},
    oseas: {archivo: 'oseas.json', nombre: 'Oseas'},
    joel: {archivo: 'joel.json', nombre: 'Joel'},
    amos: {archivo: 'amos.json', nombre: 'Amos'},
    abdias: {archivo: 'abdias.json', nombre: 'Abdias'},
    jonas: {archivo: 'jonas.json', nombre: 'Jonas'},
    miqueas: {archivo: 'miqueas.json', nombre: 'miqueas'},
    nahum: {archivo: 'nahum.json', nombre: 'Nahum'},
    habacuc: {archivo: 'habacuc.json', nombre: 'Havacuc'},
    sofonias: {archivo: 'sofonias.json', nombre: 'Sofonias'},
    hageo: {archivo: 'hageo.json', nombre: 'Hageo'},
    zacarias: {archivo: 'zacarias.json', nombre: 'Zacarias'},
    malaquias: {archivo: 'malaquias.json', nombre: 'Malaquias'},
    mateo: {archivo: 'mateo.json', nombre: 'Mateo'},
    marcos: {archivo: 'marcos.json', nombre: 'Marcos'},
    lucas: {archivo: 'lucas.json', nombre: 'Lucas'},
    juan: {archivo: 'juan.json', nombre: 'Juan'},
    hechos: {archivo: 'jeremias.json', nombre: 'Jeremias'},
    romanos: {archivo: 'romanos.json', nombre: 'Romanos'},
    icoritios: {archivo: 'icorintios.json', nombre: '1 Corintios'},
    iicoritios: {archivo: 'iicorintios.json', nombre: '2 Corintios'},
    galatas: {archivo: 'galatas.json', nombre: 'Galatas'},
    efesios: {archivo: 'efesios.json', nombre: 'Efesios'},
    filipenses: {archivo: 'filipenses.json', nombre: 'Filipenses'},
    colosenses: {archivo: 'Colosenses.json', nombre: 'Colosenses'},
    itesalonicenses: {archivo: 'itesalonicenses.json', nombre: '1 Tesalonicenses'},
    iitesalonicenses: {archivo: 'iitesalonicenses.json', nombre: '2 Tesalonicenses'},
    itimoteo: {archivo: 'itimoteo.json', nombre: '1 Timoteo'},
    iitimoteo: {archivo: 'iitimoteo.json', nombre: '2 Timoteo'},
    tito: {archivo: 'tito.json', nombre: 'Tito'},
    filemon: {archivo: 'filemon.json', nombre: 'Filemon'},
    hebreos: {archivo: 'hebreos.json', nombre: 'Hebreos'},
    santiago: {archivo: 'santiago.json', nombre: 'Santiago'},
    ipedro: {archivo: 'ipedro.json', nombre: '1 pedro'},
    iipedro: {archivo: 'iipedro.json', nombre: '2 Pedro'},
    ijuan: {archivo: 'ijuan.json', nombre: '1 Juan'},
    iijuan: {archivo: 'iijuan.json', nombre: '2 Juan'},
    iiijuan: {archivo: 'iiijuan.json', nombre: '3 Juan'},
    judas: {archivo: 'judas.json', nombre: 'Judas'},
    apocalipsis: {archivo: 'apocalipsis.json', nombre: 'Apocalipsis'}
};

// Variable para el libro actual
let libroActual = 'genesis';
let RUTA_JSON = RUTA_BASE + LIBROS[libroActual].archivo;

// ============================================
// 2. VARIABLES GLOBALES
// ============================================
let datosCompletos = [];
let indiceActual = 0;
let vistaActual = 'capitulo';
let versuloAResaltar = null;

// Variables para el swipe
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

// ============================================
// 3. FUNCIÓN PARA CAMBIAR DE LIBRO
// ============================================
function cambiarLibro(nombreLibro) {
    if (LIBROS[nombreLibro]) {
        libroActual = nombreLibro;
        RUTA_JSON = RUTA_BASE + LIBROS[libroActual].archivo;
        
        const url = new URL(window.location.href);
        url.searchParams.set('libro', nombreLibro);
        url.searchParams.delete('capitulo');
        url.searchParams.delete('verso');
        window.history.pushState({}, '', url);
        
        cargarBiblia();
    }
}

// ============================================
// 4. FUNCIÓN PARA CARGAR LOS DATOS
// ============================================
async function cargarBiblia() {
    const contenedor = document.getElementById('contenedor-principal');
    contenedor.innerHTML = '<div class="mensaje-carga">Cargando archivo de datos...</div>';

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const libroParam = urlParams.get('libro');
        const capituloParam = urlParams.get('capitulo');
        const versoParam = urlParams.get('verso');
        
        if (libroParam && LIBROS[libroParam]) {
            libroActual = libroParam;
            RUTA_JSON = RUTA_BASE + LIBROS[libroActual].archivo;
        }
        
        const respuesta = await fetch(RUTA_JSON);

        if (!respuesta.ok) {
            throw new Error('No se pudo cargar el archivo JSON');
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos) || datos.length === 0) {
            throw new Error('El JSON debe ser un arreglo con al menos un capítulo');
        }

        datosCompletos = datos;
        
        generarListaLibrosMenu();
        
        if (capituloParam !== null) {
            indiceActual = parseInt(capituloParam);
            if (versoParam !== null) {
                versuloAResaltar = parseInt(versoParam);
                mostrarCapituloConResaltado(indiceActual, versuloAResaltar);
            } else {
                mostrarCapituloPorIndice(indiceActual);
            }
        } else {
            indiceActual = 0;
            const titulo = datos[0]?.titulo || 'Sin título';
            const indices = datos.map((_, i) => i);
            mostrarListaCapitulos(titulo, indices);
        }

        actualizarMenuActivo();

    } catch (error) {
        document.getElementById('contenedor-principal').innerHTML = 
            '<div class="mensaje-error">ERROR: ' + error.message + '. Verifica que el archivo "' + RUTA_JSON + '" exista.</div>';
    }
}

// ============================================
// 5. GENERAR LISTA DE LIBROS EN EL MENÚ
// ============================================
function generarListaLibrosMenu() {
    const lista = document.getElementById('lista-libros-menu');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    Object.keys(LIBROS).forEach((nombreClave) => {
        const libroInfo = LIBROS[nombreClave];
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = libroInfo.nombre;
        a.dataset.libro = nombreClave;
        a.title = 'Libro de ' + libroInfo.nombre;
        
        if (nombreClave === libroActual) {
            a.classList.add('activo');
        }
        
        a.addEventListener('click', function(e) {
            e.preventDefault();
            const libroSeleccionado = this.dataset.libro;
            cambiarLibro(libroSeleccionado);
            cerrarMenu();
        });
        
        li.appendChild(a);
        lista.appendChild(li);
    });
}

// ============================================
// 6. MOSTRAR LISTA DE CAPÍTULOS DE UN LIBRO
// ============================================
function mostrarListaCapitulos(titulo, indices) {
    const contenedor = document.getElementById('contenedor-principal');
    contenedor.innerHTML = '';
    vistaActual = 'lista-capitulos';

    if (!indices || indices.length === 0) {
        contenedor.innerHTML = '<div class="mensaje-error">No hay capítulos para mostrar.</div>';
        return;
    }

    const menuDiv = document.createElement('div');
    menuDiv.className = 'menu-hamburguesa';
    
    const menuBtn = document.createElement('span');
    menuBtn.className = 'boton-hamburguesa';
    menuBtn.textContent = '☰';
    menuBtn.setAttribute('aria-label', 'Abrir menú de libros');
    menuBtn.addEventListener('click', toggleMenu);
    
    menuDiv.appendChild(menuBtn);
    contenedor.appendChild(menuDiv);

    const tituloLibro = document.createElement('h1');
    tituloLibro.className = 'titulo-libro-completo';
    tituloLibro.textContent = titulo;
    contenedor.appendChild(tituloLibro);

    const listaContainer = document.createElement('div');
    listaContainer.className = 'lista-capitulos-container';
    listaContainer.style.marginTop = '30px';

    const subtituloLista = document.createElement('h3');
    subtituloLista.style.color = '#291b5a';
    subtituloLista.style.fontSize = '18px';
    subtituloLista.style.marginBottom = '20px';
    subtituloLista.style.borderBottom = '2px solid #a9b4d4';
    subtituloLista.style.paddingBottom = '10px';
    subtituloLista.textContent = '📖 Capítulos (' + indices.length + ')';
    listaContainer.appendChild(subtituloLista);

    const listaCaps = document.createElement('ul');
    listaCaps.style.listStyle = 'none';
    listaCaps.style.padding = '0';
    listaCaps.style.margin = '0';

    indices.forEach((index) => {
        const capitulo = datosCompletos[index];
        if (!capitulo) return;

        const li = document.createElement('li');
        li.style.margin = '8px 0';
        li.style.borderBottom = '1px solid #f0ece6';
        li.style.padding = '8px 0';

        const a = document.createElement('a');
        const nombreCapitulo = capitulo.capitulo || 'Capítulo ' + (indices.indexOf(index) + 1);
        a.textContent = '▶ ' + nombreCapitulo;
        a.href = '#';
        a.style.display = 'block';
        a.style.padding = '10px 15px';
        a.style.color = '#1f1a3d';
        a.style.textDecoration = 'none';
        a.style.borderRadius = '6px';
        a.style.transition = 'background 0.2s, color 0.2s';
        a.style.fontSize = '16px';
        a.style.cursor = 'pointer';
        
        a.addEventListener('mouseenter', function() {
            this.style.background = '#f0ece6';
        });
        a.addEventListener('mouseleave', function() {
            this.style.background = 'transparent';
        });

        a.addEventListener('click', function(e) {
            e.preventDefault();
            indiceActual = index;
            mostrarListaVersiculos(indiceActual);
        });

        li.appendChild(a);
        listaCaps.appendChild(li);
    });

    listaContainer.appendChild(listaCaps);
    contenedor.appendChild(listaContainer);
}

// ============================================
// 7. MOSTRAR LISTA DE VERSÍCULOS DE UN CAPÍTULO
// ============================================
function mostrarListaVersiculos(indice) {
    const contenedor = document.getElementById('contenedor-principal');
    contenedor.innerHTML = '';
    vistaActual = 'lista-versiculos';

    const capitulo = datosCompletos[indice];
    if (!capitulo) {
        contenedor.innerHTML = '<div class="mensaje-error">Capítulo no encontrado.</div>';
        return;
    }

    const versiculosArray = capitulo.versiculo || capitulo.versiculos || [];
    
    if (versiculosArray.length === 0) {
        contenedor.innerHTML = '<div class="mensaje-error">No hay versículos en este capítulo.</div>';
        return;
    }

    const menuDiv = document.createElement('div');
    menuDiv.className = 'menu-hamburguesa';
    
    const menuBtn = document.createElement('span');
    menuBtn.className = 'boton-hamburguesa';
    menuBtn.textContent = '☰';
    menuBtn.setAttribute('aria-label', 'Abrir menú de libros');
    menuBtn.addEventListener('click', toggleMenu);
    
    menuDiv.appendChild(menuBtn);
    contenedor.appendChild(menuDiv);

    const titulo = document.createElement('h1');
    titulo.className = 'titulo-libro';
    titulo.textContent = capitulo.titulo || 'Sin título';
    contenedor.appendChild(titulo);

    const nombreCap = document.createElement('div');
    nombreCap.className = 'nombre-capitulo';
    nombreCap.textContent = capitulo.capitulo || 'Capítulo';
    contenedor.appendChild(nombreCap);

    const listaContainer = document.createElement('div');
    listaContainer.className = 'lista-versiculos-container';
    listaContainer.style.marginTop = '20px';

    const subtituloLista = document.createElement('h3');
    subtituloLista.style.color = '#0a0a0a';
    subtituloLista.style.fontSize = '18px';
    subtituloLista.style.marginBottom = '20px';
    subtituloLista.style.borderBottom = '2px solid #010235';
    subtituloLista.style.paddingBottom = '10px';
    subtituloLista.textContent = '📜 Versículos (' + versiculosArray.length + ')';
    listaContainer.appendChild(subtituloLista);

    const gridVersos = document.createElement('div');
    gridVersos.style.display = 'grid';
    gridVersos.style.gridTemplateColumns = 'repeat(auto-fill, minmax(60px, 1fr))';
    gridVersos.style.gap = '10px';
    gridVersos.style.marginTop = '10px';

    versiculosArray.forEach((v) => {
        const btn = document.createElement('button');
        btn.textContent = v.numero;
        btn.dataset.numero = v.numero;
        btn.style.padding = '12px 8px';
        btn.style.border = '2px solid #180044';
        btn.style.borderRadius = '8px';
        btn.style.background = '#ffffff';
        btn.style.color = '#1a1d3d';
        btn.style.fontSize = '18px';
        btn.style.fontWeight = '600';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'background 0.2s, transform 0.1s, box-shadow 0.2s';
        btn.style.boxShadow = '0 2px 4px rgba(255, 255, 255, 0.05)';
        
        btn.addEventListener('mouseenter', function() {
            this.style.background = '#1f138b';
            this.style.color = '#fff';
            this.style.borderColor = '#13298b';
            this.style.transform = 'scale(1.05)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.background = '#faf6f0';
            this.style.color = '#201a3d';
            this.style.borderColor = '#030302';
            this.style.transform = 'scale(1)';
        });
        
        btn.addEventListener('click', function() {
            const numeroVerso = parseInt(this.dataset.numero);
            const url = new URL(window.location.href);
            url.searchParams.set('libro', libroActual);
            url.searchParams.set('capitulo', indice);
            url.searchParams.set('verso', numeroVerso);
            window.location.href = url.toString();
        });

        gridVersos.appendChild(btn);
    });

    listaContainer.appendChild(gridVersos);
    contenedor.appendChild(listaContainer);

    const separador = document.createElement('hr');
    separador.className = 'separador-capitulo';
    contenedor.appendChild(separador);
}

// ============================================
// 8. FUNCIÓN DE SCROLL CON OBSERVER
// ============================================
function scrollAlVersiculo(numeroVerso) {
    let intentos = 0;
    const MAX_INTENTOS = 100;
    const INTERVALO = 100;
    
    function intentarScroll() {
        const versoElement = document.getElementById('verso-' + numeroVerso);
        
        if (versoElement) {
            requestAnimationFrame(function() {
                const rect = versoElement.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const targetPosition = rect.top + scrollTop - 80;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            });
            return true;
        } else if (intentos < MAX_INTENTOS) {
            intentos++;
            setTimeout(intentarScroll, INTERVALO);
            return false;
        } else {
            console.warn('No se pudo encontrar el versículo ' + numeroVerso);
            setTimeout(function() {
                const elemento = document.getElementById('verso-' + numeroVerso);
                if (elemento) {
                    const rect = elemento.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const targetPosition = rect.top + scrollTop - 80;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }, 500);
            return false;
        }
    }
    
    setTimeout(intentarScroll, 50);
}

// ============================================
// 9. MOSTRAR CAPÍTULO CON VERSÍCULO RESALTADO
// ============================================
function mostrarCapituloConResaltado(indice, numeroVerso) {
    const contenedor = document.getElementById('contenedor-principal');
    contenedor.innerHTML = '';
    vistaActual = 'capitulo';

    const capitulo = datosCompletos[indice];
    if (!capitulo) {
        contenedor.innerHTML = '<div class="mensaje-error">Capítulo no encontrado.</div>';
        return;
    }

    const versiculosArray = capitulo.versiculo || capitulo.versiculos || [];

    const menuDiv = document.createElement('div');
    menuDiv.className = 'menu-hamburguesa';
    
    const menuBtn = document.createElement('span');
    menuBtn.className = 'boton-hamburguesa';
    menuBtn.textContent = '☰';
    menuBtn.setAttribute('aria-label', 'Abrir menú de libros');
    menuBtn.addEventListener('click', toggleMenu);
    
    menuDiv.appendChild(menuBtn);
    contenedor.appendChild(menuDiv);

    const titulo = document.createElement('h1');
    titulo.className = 'titulo-libro';
    titulo.textContent = capitulo.titulo || 'Sin título';
    contenedor.appendChild(titulo);

    if (capitulo.subtitulo) {
        const subtitulo = document.createElement('div');
        subtitulo.className = 'subtitulo-capitulo';
        subtitulo.textContent = capitulo.subtitulo;
        contenedor.appendChild(subtitulo);
    }

    const nombreCap = document.createElement('div');
    nombreCap.className = 'nombre-capitulo';
    nombreCap.textContent = capitulo.capitulo || 'Capítulo';
    contenedor.appendChild(nombreCap);

    if (versiculosArray.length > 0) {
        for (let i = 0; i < versiculosArray.length; i++) {
            const v = versiculosArray[i];
            const p = document.createElement('p');
            p.className = 'versiculo';
            p.id = 'verso-' + v.numero;
            
            if (v.numero == numeroVerso) {
                p.classList.add('versiculo-resaltado-temporal');
                p.dataset.resaltado = 'true';
                
                setTimeout(function() {
                    p.classList.remove('versiculo-resaltado-temporal');
                    p.dataset.resaltado = 'false';
                }, 3500);
            }
            
            const spanNum = document.createElement('span');
            spanNum.className = 'numero';
            spanNum.textContent = v.numero + '.';
            
            const spanTexto = document.createElement('span');
            spanTexto.textContent = ' ' + v.texto;
            
            p.appendChild(spanNum);
            p.appendChild(spanTexto);
            contenedor.appendChild(p);
        }
    }

    const navDiv = document.createElement('div');
    navDiv.className = 'nav-botones';

    const btnIzq = document.createElement('button');
    btnIzq.className = 'btn-nav';
    btnIzq.textContent = '◀';
    btnIzq.disabled = (indice === 0);

    const btnDer = document.createElement('button');
    btnDer.className = 'btn-nav';
    btnDer.textContent = '▶';
    btnDer.disabled = (indice === datosCompletos.length - 1);

    const indicador = document.createElement('span');
    indicador.className = 'indicador-capitulo';
    indicador.textContent = (indice + 1) + ' / ' + datosCompletos.length;

    btnIzq.addEventListener('click', function() {
        if (indiceActual > 0) {
            indiceActual--;
            const url = new URL(window.location.href);
            url.searchParams.set('libro', libroActual);
            url.searchParams.set('capitulo', indiceActual);
            url.searchParams.delete('verso');
            window.location.href = url.toString();
        }
    });

    btnDer.addEventListener('click', function() {
        if (indiceActual < datosCompletos.length - 1) {
            indiceActual++;
            const url = new URL(window.location.href);
            url.searchParams.set('libro', libroActual);
            url.searchParams.set('capitulo', indiceActual);
            url.searchParams.delete('verso');
            window.location.href = url.toString();
        }
    });

    navDiv.appendChild(btnIzq);
    navDiv.appendChild(indicador);
    navDiv.appendChild(btnDer);
    contenedor.appendChild(navDiv);

    const separador = document.createElement('hr');
    separador.className = 'separador-capitulo';
    contenedor.appendChild(separador);
    
    actualizarMenuActivo();
    
    setTimeout(function() {
        scrollAlVersiculo(numeroVerso);
    }, 200);
    
    versuloAResaltar = null;
}

// ============================================
// 10. MOSTRAR UN CAPÍTULO SEGÚN ÍNDICE
// ============================================
function mostrarCapituloPorIndice(indice) {
    const contenedor = document.getElementById('contenedor-principal');
    contenedor.innerHTML = '';
    vistaActual = 'capitulo';

    const capitulo = datosCompletos[indice];
    if (!capitulo) {
        contenedor.innerHTML = '<div class="mensaje-error">Capítulo no encontrado.</div>';
        return;
    }

    const versiculosArray = capitulo.versiculo || capitulo.versiculos || [];

    const menuDiv = document.createElement('div');
    menuDiv.className = 'menu-hamburguesa';
    
    const menuBtn = document.createElement('span');
    menuBtn.className = 'boton-hamburguesa';
    menuBtn.textContent = '☰';
    menuBtn.setAttribute('aria-label', 'Abrir menú de libros');
    menuBtn.addEventListener('click', toggleMenu);
    
    menuDiv.appendChild(menuBtn);
    contenedor.appendChild(menuDiv);

    const titulo = document.createElement('h1');
    titulo.className = 'titulo-libro';
    titulo.textContent = capitulo.titulo || 'Sin título';
    contenedor.appendChild(titulo);

    if (capitulo.subtitulo) {
        const subtitulo = document.createElement('div');
        subtitulo.className = 'subtitulo-capitulo';
        subtitulo.textContent = capitulo.subtitulo;
        contenedor.appendChild(subtitulo);
    }

    const nombreCap = document.createElement('div');
    nombreCap.className = 'nombre-capitulo';
    nombreCap.textContent = capitulo.capitulo || 'Capítulo';
    contenedor.appendChild(nombreCap);

    if (versiculosArray.length > 0) {
        for (let i = 0; i < versiculosArray.length; i++) {
            const v = versiculosArray[i];
            const p = document.createElement('p');
            p.className = 'versiculo';
            
            const spanNum = document.createElement('span');
            spanNum.className = 'numero';
            spanNum.textContent = v.numero + '.';
            
            const spanTexto = document.createElement('span');
            spanTexto.textContent = ' ' + v.texto;
            
            p.appendChild(spanNum);
            p.appendChild(spanTexto);
            contenedor.appendChild(p);
        }
    }

    const navDiv = document.createElement('div');
    navDiv.className = 'nav-botones';

    const btnIzq = document.createElement('button');
    btnIzq.className = 'btn-nav';
    btnIzq.textContent = '◀';
    btnIzq.disabled = (indice === 0);

    const btnDer = document.createElement('button');
    btnDer.className = 'btn-nav';
    btnDer.textContent = '▶';
    btnDer.disabled = (indice === datosCompletos.length - 1);

    const indicador = document.createElement('span');
    indicador.className = 'indicador-capitulo';
    indicador.textContent = (indice + 1) + ' / ' + datosCompletos.length;

    btnIzq.addEventListener('click', function() {
        if (indiceActual > 0) {
            indiceActual--;
            const url = new URL(window.location.href);
            url.searchParams.set('libro', libroActual);
            url.searchParams.set('capitulo', indiceActual);
            url.searchParams.delete('verso');
            window.location.href = url.toString();
        }
    });

    btnDer.addEventListener('click', function() {
        if (indiceActual < datosCompletos.length - 1) {
            indiceActual++;
            const url = new URL(window.location.href);
            url.searchParams.set('libro', libroActual);
            url.searchParams.set('capitulo', indiceActual);
            url.searchParams.delete('verso');
            window.location.href = url.toString();
        }
    });

    navDiv.appendChild(btnIzq);
    navDiv.appendChild(indicador);
    navDiv.appendChild(btnDer);
    contenedor.appendChild(navDiv);

    const separador = document.createElement('hr');
    separador.className = 'separador-capitulo';
    contenedor.appendChild(separador);
    
    actualizarMenuActivo();
}

// ============================================
// 11. ACTUALIZAR ELEMENTO ACTIVO EN EL MENÚ
// ============================================
function actualizarMenuActivo() {
    const enlaces = document.querySelectorAll('#lista-libros-menu a');
    enlaces.forEach((a) => {
        const libro = a.dataset.libro;
        if (libro === libroActual) {
            a.classList.add('activo');
        } else {
            a.classList.remove('activo');
        }
    });
}

// ============================================
// 12. FUNCIONES DEL MENÚ HAMBURGUESA
// ============================================
function toggleMenu() {
    const menu = document.getElementById('menu-lateral');
    const overlay = document.getElementById('overlay-menu');
    
    menu.classList.toggle('menu-abierto');
    menu.classList.toggle('menu-cerrado');
    overlay.classList.toggle('activo');
    
    document.body.style.overflow = menu.classList.contains('menu-abierto') ? 'hidden' : '';
}

function cerrarMenu() {
    const menu = document.getElementById('menu-lateral');
    const overlay = document.getElementById('overlay-menu');
    
    menu.classList.remove('menu-abierto');
    menu.classList.add('menu-cerrado');
    overlay.classList.remove('activo');
    document.body.style.overflow = '';
}

// ============================================
// 13. FUNCIONES DE SWIPE PARA MÓVIL
// ============================================
function irCapituloAnterior() {
    if (indiceActual > 0) {
        indiceActual--;
        const url = new URL(window.location.href);
        url.searchParams.set('libro', libroActual);
        url.searchParams.set('capitulo', indiceActual);
        url.searchParams.delete('verso');
        window.location.href = url.toString();
    }
}

function irCapituloSiguiente() {
    if (indiceActual < datosCompletos.length - 1) {
        indiceActual++;
        const url = new URL(window.location.href);
        url.searchParams.set('libro', libroActual);
        url.searchParams.set('capitulo', indiceActual);
        url.searchParams.delete('verso');
        window.location.href = url.toString();
    }
}

function handleTouchStart(event) {
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
}

function handleTouchEnd(event) {
    if (vistaActual !== 'capitulo') return;
    
    touchEndX = event.changedTouches[0].screenX;
    touchEndY = event.changedTouches[0].screenY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const DISTANCIA_MINIMA = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (Math.abs(deltaX) > DISTANCIA_MINIMA) {
            if (deltaX > 0) {
                irCapituloAnterior();
            } else {
                irCapituloSiguiente();
            }
        }
    }
}

function configurarSwipe() {
    const contenedor = document.getElementById('contenedor-principal');
    if (contenedor) {
        contenedor.addEventListener('touchstart', handleTouchStart, { passive: true });
        contenedor.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
}

// ============================================
// 14. EJECUTAR - SOLO PARA MÓVIL
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Solo ejecutar si es móvil (ya validado desde el HTML)
    cargarBiblia();
    setTimeout(configurarSwipe, 100);
    
    const btnCerrar = document.getElementById('btn-cerrar-menu');
    const overlay = document.getElementById('overlay-menu');
    
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarMenu);
    if (overlay) overlay.addEventListener('click', cerrarMenu);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') cerrarMenu();
    });
});