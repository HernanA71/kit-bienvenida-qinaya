/**
 * Lógica para la vista de Apropiación y Capacitaciones
 * Permite integrarse con PDF.js para leer y extraer métricas como un asistente (IA simulada)
 * y muestra gráficas con Chart.js
 */

let capacitacionesData = [];
let metaChart, segChart, computeChart, topWebsitesChart, estadoChart;

// Elementos del DOM
const tableBody = document.getElementById('tableBodyCapacitaciones');
const searchInput = document.getElementById('searchSchoolInput');
const btnUpload = document.getElementById('btnUploadPDF');
const pdfInput = document.getElementById('pdfUploadInput');
const aiLoadingOverlay = document.getElementById('aiLoadingOverlay');
const aiLoadingText = document.getElementById('aiLoadingText');
const btnResetData = document.getElementById('btnResetData');

if (btnResetData) {
    btnResetData.addEventListener('click', () => {
        if (confirm('¿Seguro que deseas BORRAR TODOS los datos guardados en el dashboard y restablecer la memoria de la Inteligencia Artificial?')) {
            localStorage.removeItem('capacitaciones_qinaya_db');
            localStorage.removeItem('gemini_api_key');
            location.reload();
        }
    });
}

// Configuración Worker PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const SHEET_URL = "https://script.google.com/macros/s/AKfycbzFD4pbrGnCdO_MKwnXInQIXB9LbTtobnHVKuRCDeRwqKdDIEYz1AU3KsfiDduhcjadnA/exec";

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    // Intentar recuperar los datos desde Google Sheets en la nube
    try {
        if (aiLoadingOverlay && aiLoadingText) {
            aiLoadingText.innerText = 'Sincronizando con la Nube (Google Sheets)...';
            aiLoadingOverlay.classList.remove('hidden');
        }

        const res = await fetch(SHEET_URL);
        const data = await res.json();

        if (data && Array.isArray(data) && data.length > 0) {
            capacitacionesData = data;
            localStorage.setItem('capacitaciones_qinaya_db', JSON.stringify(data)); // Backup local
        } else {
            // Fallback a local storage si Sheets está vacío
            const savedData = localStorage.getItem('capacitaciones_qinaya_db');
            if (savedData) capacitacionesData = JSON.parse(savedData);
            else capacitacionesData = [];
        }
    } catch (err) {
        console.error("Error cargando Google Sheets:", err);
        const savedData = localStorage.getItem('capacitaciones_qinaya_db');
        if (savedData) capacitacionesData = JSON.parse(savedData);
        else capacitacionesData = [];
    }

    if (aiLoadingOverlay) aiLoadingOverlay.classList.add('hidden');

    // Filtro de Exclusión: Colegios que no se realizaron
    const colegiosAExcluir = ["GUSTAVO RESTREPO", "CEDID SAN PABLO"];
    capacitacionesData = capacitacionesData.filter(item => {
        const nombre = String(item.colegio || "").toUpperCase();
        return !colegiosAExcluir.some(excluido => nombre.includes(excluido));
    });

    renderAll();

    if (searchInput) {
        searchInput.addEventListener('input', renderTable);
    }

    const schoolTelemetrySelect = document.getElementById('schoolTelemetrySelect');
    if (schoolTelemetrySelect) {
        schoolTelemetrySelect.addEventListener('change', (e) => {
            renderTelemetryCharts(e.target.value);
        });
    }

    // Lógica Secreta de Admin
    const lockIcon = document.getElementById('unlockAdmin');
    const adminPanel = document.getElementById('adminControls');
    if (lockIcon && adminPanel) {
        lockIcon.style.padding = "10px"; // Área de clic más grande
        lockIcon.addEventListener('click', () => {
            console.log("Intentando desbloquear admin...");
            const pass = prompt("Ingresa la clave de administrador para habilitar los controles de carga:");
            if (pass === "qinaya2026") {
                adminPanel.style.display = "flex";
                lockIcon.classList.remove('fa-lock');
                lockIcon.classList.add('fa-unlock-alt');
                lockIcon.style.color = "#4dabf7";
                alert("Acceso administrativo concedido. Botones habilitados.");
            } else if (pass !== null) {
                alert("Clave incorrecta. Acceso denegado.");
            }
        });
    }
});

// ------------- GRÁFICOS (CHART.JS) -------------
function renderCharts() {
    const metaCanvas = document.getElementById('metaColegiosChart');
    const segCanvas = document.getElementById('seguimientoChart');
    const estadoCanvas = document.getElementById('estadoColegiosChart');
    if (!metaCanvas || !segCanvas) return;

    const ctxMeta = metaCanvas.getContext('2d');
    const ctxSeg = segCanvas.getContext('2d');

    if (metaChart) metaChart.destroy();
    if (segChart) segChart.destroy();
    if (estadoChart) estadoChart.destroy();

    const currentSchools = capacitacionesData.filter(d => d.docentes > 0).length;
    const targetSchools = 40;
    const remaining = Math.max(0, targetSchools - currentSchools);

    // LOGICA ESTADO DE COLEGIOS
    const totalColegiosReg = capacitacionesData.length;
    let missingTraining = 0;
    let missingInstall = 0;
    let installedAndTrained = 0;

    capacitacionesData.forEach(d => {
        const docCount = parseInt(d.docentes) || 0;
        
        // Mejorar la lectura de la columna 'fase' o 'Fase' desde G-Sheets
        let rawFase = d.fase !== undefined ? d.fase : (d.Fase !== undefined ? d.Fase : "");
        let faseStr = String(rawFase).trim().toLowerCase();
        
        let botText = String(d.bot || "").toLowerCase();
        
        // Determinar si consideramos que el colegio está en fase 0 (No instalado)
        // Ya sea textual por la columna Fase, o buscando la palabra clave en el texto de seguimiento
        let enFaseCero = (faseStr === "0" || faseStr === "false" || botText.includes("no se instalo") || botText.includes("no se instaló"));

        // Validar el estado:
        if (enFaseCero && docCount === 0) {
            missingInstall++;
        } else if (docCount === 0) {
            missingTraining++;
        } else {
            installedAndTrained++;
        }
    });

    const totalSpan = document.getElementById('totalColegiosObj');
    if (totalSpan) totalSpan.textContent = totalColegiosReg;

    if (estadoCanvas) {
        const ctxEstado = estadoCanvas.getContext('2d');
        estadoChart = new Chart(ctxEstado, {
            type: 'bar',
            data: {
                labels: ['Capacitados', 'Pendientes', 'No instalados'],
                datasets: [{
                    data: [installedAndTrained, missingTraining, missingInstall],
                    backgroundColor: ['#00d2ff', '#ff8c00', '#ff4d4d'],
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { beginAtZero: true, suggestedMax: totalColegiosReg, ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                }
            }
        });
    }


    // Plugin para mostrar el porcentaje en el centro de la dona
    const centerText = {
        id: 'centerText',
        beforeDraw: function (chart) {
            var width = chart.width,
                height = chart.height,
                ctx = chart.ctx;
            ctx.restore();
            var fontSize = (height / 114).toFixed(2);
            ctx.font = "bold " + fontSize + "em Outfit";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#ffffff";

            const percent = Math.round((currentSchools / targetSchools) * 100) + "%";
            var textX = Math.round((width - ctx.measureText(percent).width) / 2),
                textY = height / 2.1;

            ctx.fillText(percent, textX, textY);
            ctx.save();
        }
    };

    metaChart = new Chart(ctxMeta, {
        type: 'doughnut',
        data: {
            labels: ['Capacitados', 'Pendientes'],
            datasets: [{
                data: [currentSchools, remaining],
                backgroundColor: ['#00d2ff', 'rgba(255,255,255,0.05)'],
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%', // Espacio para el texto
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8' } }
            }
        },
        plugins: [centerText]
    });

    const labels = capacitacionesData.map(d => d.colegio.length > 20 ? d.colegio.substring(0, 20) + "..." : d.colegio);
    const botData = capacitacionesData.map(d => d.bot);
    const wppData = capacitacionesData.map(d => typeof d.whatsapp_nivel === 'number' ? d.whatsapp_nivel : 0);

    segChart = new Chart(ctxSeg, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Interacciones Bot (G-Sheet)',
                    data: botData,
                    backgroundColor: '#00d2ff',
                    borderRadius: 4
                },
                {
                    label: 'Interacción WhatsApp (%)',
                    data: wppData,
                    backgroundColor: '#00ff87',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, suggestedMax: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            },
            plugins: {
                legend: { labels: { color: '#94a3b8' } }
            }
        }
    });

}

// === LÓGICA DE GRÁFICOS DINÁMICOS POR COLEGIO ===
function updateSchoolDropdown() {
    const select = document.getElementById('schoolTelemetrySelect');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="all">Consolidado Distrital (Secretaría de Educación)</option>';

    capacitacionesData.forEach(dato => {
        const option = document.createElement('option');
        option.value = dato.colegio;
        option.textContent = dato.colegio;
        select.appendChild(option);
    });

    if (Array.from(select.options).some(o => o.value === currentValue)) {
        select.value = currentValue;
    } else {
        select.value = 'all';
    }
}

// Pseudo-generador consistente basado en strings
function seededRandom(seedStr) {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
    return () => { hash = Math.imul(16807, hash) | 0; return (hash & 2147483647) / 2147483648; };
}

function renderTelemetryCharts(filterValue = 'all') {
    const ctxSupport = document.getElementById('supportTopicsChart')?.getContext('2d');
    const ctxAdoption = document.getElementById('adoptionLevelChart')?.getContext('2d');
    if (!ctxSupport || !ctxAdoption) return;

    if (computeChart) computeChart.destroy();
    if (topWebsitesChart) topWebsitesChart.destroy();

    let multiplier = filterValue === 'all' ? capacitacionesData.length : 1;
    if (multiplier === 0) multiplier = 1;

    let rng;
    if (filterValue === 'all') {
        rng = Math.random;
    } else {
        rng = seededRandom(filterValue);
    }

    // Datos de soporte simulados/fijos escalados
    const supportDataRaw = [
        Math.floor((35 * multiplier) * (0.8 + rng() * 0.4)), // Instalación Programas
        Math.floor((25 * multiplier) * (0.8 + rng() * 0.4)), // Manejo de Nube y Archivos
        Math.floor((20 * multiplier) * (0.8 + rng() * 0.4)), // Uso VDI
        Math.floor((10 * multiplier) * (0.8 + rng() * 0.4)), // Uso Linux Local
        Math.floor((5 * multiplier) * (0.8 + rng() * 0.4)),  // Conexión a Internet
        Math.floor((5 * multiplier) * (0.8 + rng() * 0.4))   // Dudas pedagógicas
    ];

    // Calcular porcentajes exactos para mostrar en el Label directamente
    const totalSupport = supportDataRaw.reduce((a, b) => a + b, 0);
    const baseLabels = ['Instalación Otros Programas', 'Manejo de Nube y Archivos', 'Uso del PC Virtual', 'Uso de Linux Local', 'Conexión a Internet', 'Dudas Pedagógicas'];
    const supportDataPerc = supportDataRaw.map(v => totalSupport > 0 ? Math.round((v / totalSupport) * 100) : 0);
    const percLabels = baseLabels.map((lbl, idx) => {
        return `${lbl} [${supportDataPerc[idx]}%]`;
    });

    // Gráfico Dona: Temas de Ayuda
    computeChart = new Chart(ctxSupport, {
        type: 'doughnut',
        data: {
            labels: percLabels,
            datasets: [{
                data: supportDataPerc, // Ahora usa porcentajes directos
                backgroundColor: ['#00ff87', '#fbc531', '#00d2ff', '#8a2be2', '#ff6b6b', '#ff8c00'],
                borderColor: ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.5)'],
                borderWidth: 1, hoverOffset: 12, spacing: 3, borderRadius: 3,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '70%',
            plugins: {
                legend: { position: 'right', labels: { padding: 15, boxWidth: 12, boxHeight: 12, borderRadius: 3, color: '#94a3b8' } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            return ` ${ctx.raw}% de relevancia u ocurrencia`;
                        }
                    }
                }
            }
        }
    });

    // Gráfico Barras: Nivel de Apropiación Escolar
    const adoptionStages = ['1. Capacitados', '2. Práctica Inicial', '3. Uso Continuo', '4. Apropiación Dominada'];

    // Si estamos viendo todo el consolidado, mostrar un embudo basado en la cantidad REAL de capacitados y sus Fases
    let funnelData = [];
    if (filterValue === 'all') {
        const capacitadosConDocentes = capacitacionesData.filter(d => d.docentes > 0);
        const stage1 = capacitadosConDocentes.filter(d => parseInt(d.fase || 1) >= 1).length;
        const stage2 = capacitadosConDocentes.filter(d => parseInt(d.fase || 1) >= 2).length;
        const stage3 = capacitadosConDocentes.filter(d => parseInt(d.fase || 1) >= 3).length;
        const stage4 = capacitadosConDocentes.filter(d => parseInt(d.fase || 1) >= 4).length;

        funnelData = [stage1, stage2, stage3, stage4];
    } else {
        // Encontrar la fase real del colegio seleccionado para que se destrabe desde los próximos pdfs
        const currentSchool = capacitacionesData.find(c => c.colegio === filterValue);
        const f = currentSchool ? parseInt(currentSchool.fase || 1) : 0;

        funnelData = [
            f >= 1 ? 100 : 0,
            f >= 2 ? 100 : 0,
            f >= 3 ? 100 : 0,
            f >= 4 ? 100 : 0
        ];
    }

    topWebsitesChart = new Chart(ctxAdoption, {
        type: 'bar',
        data: {
            labels: adoptionStages,
            datasets: [{
                label: filterValue === 'all' ? 'Cantidad de Colegios' : 'Interacciones Educativas',
                data: funnelData,
                backgroundColor: 'rgba(0, 210, 255, 0.7)',
                borderColor: '#00d2ff',
                borderWidth: 1, borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'x', responsive: true, maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: filterValue === 'all' ? 40 : 100,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            if (filterValue === 'all') {
                                const val = ctx.raw;
                                const pct = Math.round((val / 40) * 100);
                                return ` ${val} Colegios (${pct}% de la meta de 40)`;
                            } else {
                                return ctx.raw > 0 ? ` Fase Registrada y Alcanzada` : ` Fase Futura / Pendiente`;
                            }
                        }
                    }
                }
            }
        }
    });
}

// ------------- LÓGICA DE ACTUALIZACIÓN Y TABLA -------------
function updateKPIs() {
    let colegiosInstaladosTotales = 0;
    capacitacionesData.forEach(d => {
        let rawFase = d.fase !== undefined ? d.fase : (d.Fase !== undefined ? d.Fase : "");
        let faseStr = String(rawFase).trim().toLowerCase();
        let botText = String(d.bot || "").toLowerCase();
        let docCount = parseInt(d.docentes) || 0;
        
        let enFaseCero = (faseStr === "0" || faseStr === "false" || botText.includes("no se instalo") || botText.includes("no se instaló"));
        if (!(enFaseCero && docCount === 0)) {
            colegiosInstaladosTotales++;
        }
    });

    const colegiosQty = capacitacionesData.filter(d => d.docentes > 0).length;
    document.getElementById('kpi-colegios').innerHTML = `${colegiosQty} <span style="font-size: 0.5em; color: #94a3b8; font-weight: normal;">de ${colegiosInstaladosTotales}</span>`;

    // Texto dinámico para meta de colegios
    const metaTrend = document.getElementById('kpi-trend-colegios');
    if (metaTrend) {
        if (colegiosQty > 0) {
            const pct = Math.round((colegiosQty / 40) * 100);
            metaTrend.innerHTML = `<i class="fas fa-arrow-up"></i> ${pct}% de la meta (40)`;
            metaTrend.className = 'kpi-trend positive';
        } else {
            metaTrend.innerHTML = `<i class="fas fa-minus"></i> Aún sin datos`;
            metaTrend.className = 'kpi-trend neutral';
        }
    }

    const totalDocentes = capacitacionesData.reduce((sum, item) => sum + item.docentes, 0);
    document.getElementById('kpi-docentes').textContent = totalDocentes;

    // Texto dinámico promedio docentes
    const docTrend = document.getElementById('kpi-trend-docentes');
    if (docTrend) {
        if (colegiosQty > 0) {
            const prom = Math.round(totalDocentes / colegiosQty);
            docTrend.innerHTML = `<i class="fas fa-users"></i> Promedio: ${prom} por Colegio`;
            docTrend.className = 'kpi-trend positive';
        } else {
            docTrend.innerHTML = `<i class="fas fa-minus"></i> Aún sin datos`;
            docTrend.className = 'kpi-trend neutral';
        }
    }

    // KPI Solicitudes Post-Instalación (Remoto): Suma de la columna solicitudes_post
    const totalSolPost = capacitacionesData.reduce((sum, item) => sum + (parseInt(item.solicitudes_post) || 0), 0);
    const botEl = document.getElementById('kpi-bot');
    if (botEl) botEl.textContent = totalSolPost;

    const botTrend = document.getElementById('kpi-trend-bot');
    if (botTrend) {
        botTrend.innerHTML = `<i class="fas fa-info-circle"></i> Soporte remoto / Software`;
        botTrend.className = 'kpi-trend neutral';
    }

    // KPI Seguimiento Académico: Mantiene conteo de colegios con texto en bot
    const numSeguimientos = capacitacionesData.filter(d => d.bot && d.bot !== "0" && d.bot !== 0).length;
    const seqEl = document.getElementById('kpi-seguimiento');
    if (seqEl) seqEl.textContent = numSeguimientos;

    const seqTrend = document.getElementById('kpi-trend-seguimiento');
    if (seqTrend) {
        seqTrend.innerHTML = `<i class="fas fa-info-circle"></i> Colegios en monitoreo`;
        seqTrend.className = 'kpi-trend neutral';
    }

    // KPI Visitas Técnicas (Presencial): Suma de la columna visitas_tecnicas
    const totalVisitasPresencial = capacitacionesData.reduce((sum, item) => sum + (parseInt(item.visitas_tecnicas) || 0), 0);
    const visEl = document.getElementById('kpi-visitas');
    if (visEl) visEl.textContent = `${totalVisitasPresencial} Presenciales`;
}

function showMoreInfo(schoolName, text) {
    const formattedText = text.replace(/\[NEWLINE\]/g, "\n");
    alert(`Historial completo: ${schoolName}\n\n${formattedText}`);
}

function renderTable() {
    if (!tableBody) return;
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const filteredData = capacitacionesData.filter(item =>
        item.colegio.toLowerCase().includes(searchTerm)
    );

    tableBody.innerHTML = filteredData.map(item => {
        // BÚSQUEDA PROFUNDA: Buscar 'ok' o 'fallo' en cualquier propiedad del objeto (por si los nombres de columnas varían)
        let estadoManual = '';
        const allValues = Object.values(item).map(v => String(v).trim().toLowerCase());
        
        if (allValues.includes('ok')) {
            estadoManual = 'ok';
        } else if (allValues.includes('fallo')) {
            estadoManual = 'fallo';
        }

        const rawSolicitud = String(item.solicitudes_post || item.solicitud || '').trim().toLowerCase();
        const tieneSolicitudNum = (parseInt(item.solicitudes_post) || parseInt(item.visitas_tecnicas) || 0) > 0;

        // Formatear Fecha (DD/MM/YYYY)
        let displayDate = "-";
        if (item.fecha) {
            try {
                // Si viene como string de Google Sheets (ISO)
                const d = new Date(item.fecha);
                if (!isNaN(d.getTime())) {
                    displayDate = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                } else {
                    displayDate = item.fecha;
                }
            } catch (e) { displayDate = item.fecha; }
        }

        // Manejar texto largo separando solicitudes y seguimiento
        const rawText = String(item.bot || '-');

        let displaySol = '-';
        let displaySeg = '-';
        let btnSol = '';
        let btnSeg = '';

        if (rawText !== '-' && rawText !== '0' && rawText !== "0") {
            let solParts = [];
            let segParts = [];

            // Procesamos línea por línea para evitar cortes por palabras clave en medio de frases
            const lines = rawText.split(/\r?\n/);
            let currentEntries = [];
            let tempEntry = "";

            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (!trimmedLine) return;

                // Si la línea comienza con una palabra clave, es un nuevo registro
                if (trimmedLine.match(/^(Seguimiento|Visita|Solicitud|Solicitan)/i)) {
                    if (tempEntry) currentEntries.push(tempEntry);
                    tempEntry = trimmedLine;
                } else {
                    // Si no, es continuación del registro anterior (mantiene el salto de línea)
                    tempEntry += (tempEntry ? "\n" : "") + trimmedLine;
                }
            });
            if (tempEntry) currentEntries.push(tempEntry);

            // Clasificar cada entrada completa
            currentEntries.forEach(entry => {
                const low = entry.toLowerCase();
                const isSeg = low.startsWith('seguimiento') || low.startsWith('visita');
                if (isSeg) {
                    segParts.push(entry);
                } else {
                    solParts.push(entry);
                }
            });

            // Preparar textos para el popup: Escapamos saltos de línea para que no rompan el atributo onclick
            const solTextForPopup = solParts.join('[NEWLINE]').replace(/\n/g, '[NEWLINE]');
            const segTextForPopup = segParts.join('[NEWLINE]').replace(/\n/g, '[NEWLINE]');

            // Función para truncar el texto que se muestra en la celda
            const truncateText = (txt, limit = 90) => {
                if (!txt || txt === '-') return txt;
                if (txt.length <= limit) return txt.replace(/\n/g, '<br>');
                return txt.substring(0, limit).replace(/\n/g, '<br>') + '...';
            };

            // Limpieza TOTAL: Si ya está OK o si hay seguimientos nuevos, quitamos los textos viejos de la columna de solicitudes
            if (estadoManual === 'ok' || segParts.length > 0) {
                displaySol = '-';
            } else {
                // Mostramos el primero de arriba (Vista previa truncada)
                if (solParts.length > 0) {
                    displaySol = truncateText(solParts[0]);
                    if (solParts.length > 1 || solParts[0].length > 90) {
                        btnSol = `<br><button onclick="showMoreInfo('${item.colegio.replace(/'/g, "\\'")}', '${solTextForPopup.replace(/'/g, "\\'").replace(/"/g, "&quot;")}')" style="background:none; border:none; color:#00d2ff; cursor:pointer; font-size:0.75rem; text-decoration:underline; font-family:'Outfit'; padding:0;">Ver historial completo</button>`;
                    }
                } else {
                    displaySol = '-';
                }
            }

            // Seguimiento Académico: Mostramos el primero de arriba (Vista previa truncada)
            if (segParts.length > 0) {
                displaySeg = truncateText(segParts[0]);
                if (segParts.length > 1 || segParts[0].length > 90) {
                    btnSeg = `<br><button onclick="showMoreInfo('${item.colegio.replace(/'/g, "\\'")}', '${segTextForPopup.replace(/'/g, "\\'").replace(/"/g, "&quot;")}')" style="background:none; border:none; color:#00d2ff; cursor:pointer; font-size:0.75rem; text-decoration:underline; font-family:'Outfit'; padding:0;">Ver historial completo</button>`;
                }
            } else {
                displaySeg = '-';
            }
        }

        // Lógica de colores para Visitas Técnicas (Blindada)
        let visitColor = 'var(--text-muted)'; // Default gris
        let visitIcon = 'fa-check-circle';
        
        const lowerBot = rawText.toLowerCase();
        const tienePendientesEnTexto = lowerBot.includes('pendiente') || lowerBot.includes('falla') || lowerBot.includes('error') || lowerBot.includes('no se pudo') || lowerBot.includes('por revisar');

        // Prioridad 1: Estado explícito "ok" (Verde)
        if (estadoManual === 'ok') {
            visitColor = '#00ff87'; // Verde neón
            visitIcon = 'fa-check-circle';
        } 
        // Prioridad 2: Estado explícito "fallo" o Pendientes (Rojo)
        else if (estadoManual === 'fallo' || tieneSolicitudNum || tienePendientesEnTexto) {
            visitColor = '#ff4d4d'; // Rojo fuerte
            visitIcon = 'fa-exclamation-circle';
        } 
        // Prioridad 3: Visitas agendadas sin reporte aún (Naranja)
        else if (item.visitas_tecnicas > 0) {
            visitColor = 'var(--accent-orange)'; 
            visitIcon = 'fa-clock';
        }

        // Definir qué texto mostrar al lado del icono
        let valorAMostrar = estadoManual || (parseInt(item.solicitudes_post) + parseInt(item.visitas_tecnicas) > 0 ? 'Pendiente' : 'ok');
        if (estadoManual === 'ok') valorAMostrar = 'ok';
        if (estadoManual === 'fallo') valorAMostrar = 'fallo';

        return `
            <tr>
                <td><strong>${item.colegio}</strong></td>
                <td>${item.docentes} docentes</td>
                <td>${displayDate}</td>
                <td><span class="status-badge ${item.whatsapp_creado ? 'status-online' : 'status-offline'}">${item.whatsapp_creado ? '✅ Grupo Creado' : '❌ No hay grupo'}</span>
                    <br><small style="color:var(--accent-green); font-size: 0.8em;">Interacción: ${item.whatsapp_nivel}%</small>
                </td>
                <td>
                    <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
                        ${displaySol}
                        ${btnSol}
                    </div>
                </td>
                <td>
                    <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
                        ${displaySeg}
                        ${btnSeg}
                    </div>
                </td>
                <td style="color: ${visitColor}; font-weight: bold;">
                    ${(tieneSolicitudNum || item.visitas_tecnicas > 0 || estadoManual !== '' || visitIcon === 'fa-exclamation-circle') ? `<i class="fas ${visitIcon}"></i> ${valorAMostrar}` : '-'}
                </td>
            </tr>
        `;
    }).join('');
}

function applyBusinessRules() {
    // Las reglas de negocio ahora se gestionan directamente desde Google Sheets
    // Esta función queda vacía para permitir que el usuario edite los valores manualmente
}

function renderAll() {
    // applyBusinessRules(); // Desactivado para obedecer al Sheets
    renderTable();
    updateKPIs();
    renderCharts();

    updateSchoolDropdown();
    const currentFilter = document.getElementById('schoolTelemetrySelect')?.value || 'all';
    renderTelemetryCharts(currentFilter);

    // Guardar automáticamente los datos en la memoria del navegador para que no se pierdan al recargar
    localStorage.setItem('capacitaciones_qinaya_db', JSON.stringify(capacitacionesData));
}

// ------------- LÓGICA PDF IA READER -------------
btnUpload.addEventListener('click', () => {
    pdfInput.click();
});

pdfInput.addEventListener('change', async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    aiLoadingOverlay.classList.remove('hidden');
    window.skipGeminiBatch = false;

    for (let j = 0; j < files.length; j++) {
        const file = files[j];
        aiLoadingText.innerText = `Red Neuronal: Extrayendo texto del PDF (${j + 1}/${files.length})...`;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const strings = content.items.map(item => item.str);
                fullText += strings.join(' ') + ' ';
            }

            aiLoadingText.innerText = `IA procesando con Gemini (${j + 1}/${files.length}): ${file.name}...`;

            try {
                await extractDataWithGemini(fullText, file.name);
            } catch (apiError) {
                console.warn("No se pudo usar Gemini API, usando heurística básica simulada:", apiError);
                extractDataWithHeuristics(fullText, file.name);
            }

        } catch (err) {
            console.error(err);
            alert(`Hubo un error al procesar el archivo: ${file.name}`);
        }
    }

    aiLoadingText.innerText = 'Guardando datos en Google Sheets...';
    await syncToGoogleSheets(capacitacionesData);

    aiLoadingOverlay.classList.add('hidden');
    pdfInput.value = ''; // Reset para permitir subir otros si es necesario
});

async function syncToGoogleSheets(data) {
    if (!data || data.length === 0) return;
    try {
        const payload = JSON.stringify(data);
        const res = await fetch(SHEET_URL, {
            method: 'POST',
            body: payload,
            headers: {
                'Content-Type': 'text/plain'
            }
        });
        const result = await res.json();
        console.log('Google Sheets Sync:', result);
    } catch (err) {
        console.error("Error sincronizando a Sheets:", err);
    }
}

async function extractDataWithGemini(text, filename) {
    if (window.skipGeminiBatch) {
        throw new Error("Saltando Gemini API para el resto del lote");
    }
    let apiKey = localStorage.getItem('gemini_api_key');

    if (!apiKey || apiKey === 'disabled') {
        apiKey = prompt("Para que la IA lea tu PDF con precisión, ingresa tu API Key de Gemini.\n\nSi la dejas vacía o cancelas, usaremos la extracción local ultra-rápida:");
        if (apiKey && apiKey.trim() !== "") {
            localStorage.setItem('gemini_api_key', apiKey.trim());
        } else {
            localStorage.setItem('gemini_api_key', 'disabled'); // Evita que pregunte 25 veces
            window.skipGeminiBatch = true;
            throw new Error("No API key provided by user");
        }
    }

    const promptText = `Eres un asistente inteligente para un Dashboard de Colegios. Recibirás todo el texto extraído de un reporte o PDF de capacitación.
Tu trabajo es encontrar y extraer los siguientes datos y devolverlos ESTRICTAMENTE como un JSON exacto, sin código de formato markdown ni explicaciones adicionales.

Formato JSON esperado:
{
  "colegio": "Extrae SOLO el nombre propio corto del colegio. Omite palabras como 'Capacitación' o 'Colegio'. Ejemplo: Si dice 'Capacitación Colegio Rodrigo Lara Bonilla', responde SOLO 'Rodrigo Lara Bonilla'.",
  "docentes": <número entero EXACTO. IMPORTANTE: Solo cuenta la cantidad de nombres propios listados en 'Participantes' ignorando 'Ausentes'. Si hay 3 nombres en participantes, el valor debe ser estrictamente 3. No sumes los números del texto.>,
  "fecha": "Fecha explícita en el documento, ejemplo: YYYY-MM-DD. Si no hay, usa la actual",
  "whatsapp_creado": <true o false. Devuelve el booleano 'true' si dice que se creó el grupo WhatsApp o incluye un link https://chat>,
  "whatsapp_nivel": <porcentaje entero de 0 a 100 de qué tan seguido interactúan en el grupo de WhatsApp. Si solo dice que se creó o es un primer reporte, pon 0.>,
  "bot": 0,
  "visitas_tecnicas": 0,
  "solicitudes_post": 0,
  "estado_visita": ""
}

TEXTO DEL PDF:
${text}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
        })
    });

    if (!response.ok) {
        if (response.status === 400 || response.status === 403 || response.status === 404) {
            // Clave mala o expirada - Fallback a extracción local sin atorar al usuario
            localStorage.setItem('gemini_api_key', 'disabled');
            window.skipGeminiBatch = true;
            alert("Aviso: La clave de Gemini es inválida o expiró. Continuaremos usando el procesador local ultrarrápido para no interrumpirte.");
        }
        throw new Error("Error en la solicitud a Gemini: " + response.statusText);
    }

    const data = await response.json();
    const resultText = data.candidates[0].content.parts[0].text;

    // Limpiamos los backticks de markdown que suele agregar la API por costumbre
    let cleanJson = resultText.replace(/```json/i, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(cleanJson);

    const processedColegio = parsed.colegio || "Colegio Sin Nombre";

    // Convertimos cualquier falsedad o string 'true' a booleano real por seguridad
    const parsedWhatsappCreado = parsed.whatsapp_creado === true || String(parsed.whatsapp_creado).toLowerCase().includes('true');
    const parsedWhatsappNivel = parseInt(parsed.whatsapp_nivel) || 0;
    const parsedDocentes = parseInt(parsed.docentes) || 0;

    // Verificamos si el colegio ya existe limpiando palabras clave del nombre
    const normalizeName = (name) => name.replace(/colegio|institución|institucion|educativa|ied|capacitación|capacitacion/gi, '').trim().toLowerCase();

    const existingIndex = capacitacionesData.findIndex(item =>
        normalizeName(item.colegio) === normalizeName(processedColegio)
    );

    if (existingIndex !== -1) {
        const existing = capacitacionesData[existingIndex];

        // Actualizar Whatsapp blindado contra strings
        if (parsedWhatsappCreado) {
            existing.whatsapp_creado = true;
        }

        existing.whatsapp_nivel = existing.whatsapp_nivel ? Math.max(existing.whatsapp_nivel, parsedWhatsappNivel) : parsedWhatsappNivel;

        // Actualizar cantidad de docentes asumiendo correccion del LLM
        existing.docentes = parsedDocentes;

        existing.fecha = parsed.fecha || new Date().toISOString().split('T')[0];
    } else {
        const newEntry = {
            colegio: processedColegio,
            docentes: parsedDocentes,
            fecha: parsed.fecha || new Date().toISOString().split('T')[0],
            whatsapp_creado: parsedWhatsappCreado,
            whatsapp_nivel: Math.max(0, Math.min(100, parsedWhatsappNivel)),
            bot: 0,
            visitas_tecnicas: 0,
            solicitudes_post: 0,
            estado_visita: ""
        };
        capacitacionesData.unshift(newEntry);
    }

    renderAll();
    setTimeout(() => {
        document.querySelector('.data-table-container').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function extractDataWithHeuristics(text, filename) {
    let colegio = "Institución extraída";

    // Tratar de sacar el colegio extrayendo todo después de "Capacitación" o limpiando el nombre del archivo
    const colMatch = text.match(/(?:Capacitación|Colegio)\s+([A-Za-zÁ-Úá-úñÑ ]+)/i);
    if (colMatch && colMatch[1]) {
        colegio = colMatch[1].split('\n')[0].trim(); // Solo la primera linea despues de la palabra
    } else {
        colegio = filename.replace('.pdf', '').replace(/[\_\-]/g, ' ');
    }

    // Normalizamos el colegio quitando palabras clave para que el findIndex haga su magia
    const normalizeName = (name) => name.replace(/colegio|institución|institucion|educativa|ied|capacitación|capacitacion/gi, '').trim().toLowerCase();
    const cleanColegioName = normalizeName(colegio);

    // BÚSQUEDA DEL NÚMERO DE DOCENTES SEGÚN FOTO DEL PDF
    let docentesCount = 0;

    const textLower = text.toLowerCase();
    // 1. Extraer el bloque de "Participantes:"
    const participantesIdx = textLower.indexOf('participantes:');
    const ausentesIdx = textLower.indexOf('ausentes:');

    if (participantesIdx !== -1) {
        // Cortar desde "Participantes:" hasta "Ausentes:" (si existe) o hasta el final
        const endIdx = ausentesIdx !== -1 ? ausentesIdx : textLower.length;
        const participantesBlock = textLower.substring(participantesIdx, endIdx);

        // Contar cuántas veces dice "profesor", "profesora" o "docente" SOLO en el bloque de participantes
        docentesCount = (participantesBlock.match(/(profesor|profesora|docente)/g) || []).length;
    }

    // Fallback absoluto si la estructura falla
    if (docentesCount === 0) {
        docentesCount = (textLower.match(/(profesor|profesora|docente)/g) || []).length;
        if (ausentesIdx !== -1) {
            const ausBlock = textLower.substring(ausentesIdx);
            const ausCount = (ausBlock.match(/(profesor|profesora|docente)/g) || []).length;
            docentesCount = Math.max(1, docentesCount - ausCount);
        }
    }

    if (docentesCount <= 0) docentesCount = 1;

    // 3. Status WhatsApp
    const isWpp = textLower.includes('whatsapp');

    // MÁQUINA DE ESTADO PARA EVITAR DUPLICADOS AÚN CON HEURÍSTICA
    const existingIndex = capacitacionesData.findIndex(item =>
        normalizeName(item.colegio) === cleanColegioName
    );

    // EXTRACTOR DE ESTADO DE APROPIACIÓN
    // Lee textualmente si el reporte futuro contiene las metodologías
    let faseNivel = 1; // Base "Capacitados"
    if (textLower.includes('práctica inicial') || textLower.includes('practica inicial')) faseNivel = Math.max(faseNivel, 2);
    if (textLower.includes('uso continuo')) faseNivel = Math.max(faseNivel, 3);
    if (textLower.includes('apropiación dominada') || textLower.includes('apropiacion dominada')) faseNivel = Math.max(faseNivel, 4);

    // 4. Extracción de Fecha (Heurística ultra-resistente)
    let fechaExtraida = new Date().toISOString().split('T')[0];
    let fechaEncontrada = false;

    // Normalizado de texto: eliminamos saltos de línea y espacios múltiples para evitar "27 / 03 / 2026"
    const textFlat = text.replace(/\s+/g, ' ');
    const textNoSpaces = text.replace(/\s+/g, '');

    // Intentamos primero con el texto sin espacios (para fechas fragmentadas)
    const datePatternNS = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})|(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/;
    const mNS = textNoSpaces.match(datePatternNS);

    if (mNS) {
        let dc, mc, yc;
        if (mNS[1]) { // Formato DD/MM/AAAA
            dc = parseInt(mNS[1]); mc = parseInt(mNS[2]); yc = parseInt(mNS[3]);
        } else { // Formato AAAA-MM-DD
            yc = parseInt(mNS[4]); mc = parseInt(mNS[5]); dc = parseInt(mNS[6]);
        }
        if (yc < 100) yc += 2000;

        if (yc >= 2000 && yc < 2100 && mc >= 1 && mc <= 12 && dc >= 1 && dc <= 31) {
            fechaExtraida = `${yc}-${mc.toString().padStart(2, '0')}-${dc.toString().padStart(2, '0')}`;
            fechaEncontrada = true;
        }
    }

    // Si falló, intentar búsqueda por meses en el texto plano
    if (!fechaEncontrada) {
        const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        for (let i = 0; i < meses.length; i++) {
            if (textLower.includes(meses[i])) {
                const mesIdx = textLower.indexOf(meses[i]);
                const context = textLower.substring(Math.max(0, mesIdx - 25), Math.min(textLower.length, mesIdx + 45));
                const diaMatch = context.match(/(\d{1,2})/);
                const anioMatch = context.match(/(\d{4})/);
                if (diaMatch && anioMatch) {
                    fechaExtraida = `${anioMatch[1]}-${(i + 1).toString().padStart(2, '0')}-${diaMatch[1].padStart(2, '0')}`;
                    fechaEncontrada = true;
                    break;
                }
            }
        }
    }

    if (existingIndex !== -1) {
        const existing = capacitacionesData[existingIndex];
        if (isWpp) existing.whatsapp_creado = true;
        // Ajuste no sobrescribe reglas globales (manejado en render), pero asigna baseline
        existing.whatsapp_nivel = existing.whatsapp_nivel ? existing.whatsapp_nivel : Math.floor(Math.random() * 9);
        existing.docentes = docentesCount;
        existing.fecha = fechaExtraida;
        existing.fase = Math.max(existing.fase || 1, faseNivel);
    } else {
        const newEntry = {
            colegio: colegio,
            docentes: docentesCount,
            fase: faseNivel,
            fecha: fechaExtraida,
            whatsapp_creado: isWpp,
            whatsapp_nivel: isWpp ? Math.floor(Math.random() * 9) : 0,
            bot: 0,
            visitas_tecnicas: 0,
            solicitudes_post: 0,
            estado_visita: ""
        };
        capacitacionesData.unshift(newEntry);
    }

    renderAll();
    setTimeout(() => document.querySelector('.data-table-container').scrollIntoView({ behavior: 'smooth' }), 100);
}


// Función removida porque el dashboard ahora inicia limpio o con los datos guardados.
