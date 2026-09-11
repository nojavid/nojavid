(function() {
    // DOM refs
    const inicialInput = document.getElementById('inicialInput');
    const finalInput = document.getElementById('finalInput');
    const valesInput = document.getElementById('valesInput');
    const adicionalesInput = document.getElementById('adicionalesInput');

    const personasValue = document.getElementById('personasValue');
    const personasSinValeValue = document.getElementById('personasSinValeValue');
    const plataValue = document.getElementById('plataValue');
    const totalPreviewValue = document.getElementById('totalPreviewValue');

    const sInicial = document.getElementById('sInicial');
    const sFinal = document.getElementById('sFinal');
    const sPersonas = document.getElementById('sPersonas');
    const sVales = document.getElementById('sVales');
    const sSinVale = document.getElementById('sSinVale');
    const sPlata = document.getElementById('sPlata');
    const sAdicionales = document.getElementById('sAdicionales');
    const totalFinal = document.getElementById('totalFinal');

    const valeWarning = document.getElementById('valeWarning');

    // formatear moneda colombiana
    function formatCOP(valor) {
        if (valor === undefined || valor === null || isNaN(valor)) return '$0';
        const number = Math.floor(valor);
        return '$' + number.toLocaleString('es-CO');
    }

    // obtener número entero desde input (respetando ceros a la izquierda como string)
    function getIntFromInput(input) {
        const raw = input.value.trim();
        if (raw === '') return NaN;
        return parseInt(raw, 10);
    }

    // función principal de cálculo
    function calcularTodo() {
        // 1. Leer valores
        const inicial = getIntFromInput(inicialInput);
        const final = getIntFromInput(finalInput);
        const vales = parseInt(valesInput.value, 10) || 0;
        const adicionales = parseInt(adicionalesInput.value, 10) || 0;

        // 2. Calcular personas
        let personas = 0;
        let personasValidas = false;
        if (!isNaN(inicial) && !isNaN(final)) {
            personas = final - inicial;
            if (personas < 0) {
                personas = 0;
            }
            personasValidas = true;
        }

        // 3. Mostrar personas
        if (personasValidas) {
            personasValue.textContent = personas;
        } else {
            personasValue.textContent = '—';
        }

        // 4. Calcular personas sin vale
        let personasSinVale = 0;
        let valesValidos = false;
        let warningVisible = false;

        if (personasValidas && !isNaN(vales) && vales >= 0) {
            if (vales <= personas) {
                personasSinVale = personas - vales;
                valesValidos = true;
                warningVisible = false;
            } else {
                personasSinVale = 0;
                valesValidos = true;
                warningVisible = true;
            }
        } else {
            personasSinVale = 0;
            valesValidos = false;
            warningVisible = false;
        }

        // mostrar warning
        if (warningVisible && personasValidas) {
            valeWarning.classList.remove('hidden');
        } else {
            valeWarning.classList.add('hidden');
        }

        // Mostrar personas sin vale
        if (personasValidas && valesValidos) {
            personasSinValeValue.textContent = personasSinVale;
        } else {
            personasSinValeValue.textContent = '—';
        }

        // 5. Calcular PLATA = personasSinVale * 1500
        let plata = 0;
        if (personasValidas && valesValidos && personasSinVale > 0) {
            plata = personasSinVale * 1500;
        } else {
            plata = 0;
        }
        plataValue.textContent = formatCOP(plata);

        // 6. Calcular TOTAL = PLATA + adicionales
        let total = plata + (adicionales > 0 ? adicionales : 0);
        if (!personasValidas || !valesValidos) {
            total = 0;
        }
        totalPreviewValue.textContent = formatCOP(total);

        // 7. Actualizar resumen grande
        const inicialStr = inicialInput.value.trim() || '—';
        const finalStr = finalInput.value.trim() || '—';

        sInicial.textContent = inicialStr;
        sFinal.textContent = finalStr;
        sPersonas.textContent = personasValidas ? personas : '—';
        sVales.textContent = (personasValidas && !isNaN(vales) && vales >= 0) ? vales : '—';
        sSinVale.textContent = (personasValidas && valesValidos) ? personasSinVale : '—';
        sPlata.textContent = formatCOP(plata);
        sAdicionales.textContent = formatCOP(adicionales);

        // total final
        let totalFinalValue = 0;
        if (personasValidas && valesValidos) {
            totalFinalValue = plata + (adicionales > 0 ? adicionales : 0);
        } else {
            totalFinalValue = 0;
        }
        totalFinal.textContent = formatCOP(totalFinalValue);

        // si no hay personas, mostramos 0 en todo
        if (!personasValidas) {
            plataValue.textContent = '$0';
            totalPreviewValue.textContent = '$0';
            totalFinal.textContent = '$0';
        }
    }

    // Event listeners para actualizar automáticamente
    function attachEvents() {
        const inputs = [inicialInput, finalInput, valesInput, adicionalesInput];
        inputs.forEach(inp => {
            inp.addEventListener('input', calcularTodo);
            inp.addEventListener('change', calcularTodo);
        });
    }

    // Reset (nuevo cálculo) - limpia todos los campos
    function resetear() {
        inicialInput.value = '';
        finalInput.value = '';
        valesInput.value = '';
        adicionalesInput.value = '';
        valeWarning.classList.add('hidden');
        calcularTodo();
        inicialInput.focus();
    }

    // Inicializar
    function init() {
        // Ya no se asignan valores por defecto, solo placeholders
        attachEvents();
        calcularTodo();

        document.getElementById('resetBtn').addEventListener('click', resetear);
    }

    init();
})();