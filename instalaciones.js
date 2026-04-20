/**
 * Lógica para la vista de Instalaciones Técnicas
 * Carga datos desde Google Sheets y muestra KPIs, gráficas y tabla detallada
 * Tema: Light Mode con acentos azules
 */

let instalacionesData = [];
let metaInstChart, incidenciasChartObj, resultadoChart, colegiosBarChartObj;

// =====================================================
// CONFIGURACIÓN: Cambia esta URL por la de tu Google Apps Script
// desplegado desde la hoja "Qinaya Instalaciones SED"
// =====================================================
const INSTALACIONES_SHEET_URL = "https://script.google.com/macros/s/AKfycbxLgKxH9YCY_flwx7kjfdSbe37dlT9k3tKMv1lXIZPT6FcyDeeKV8xM2ta9_HMeWF0Yhg/exec";

const META_INSTALACIONES = 1000;
const META_POR_COLEGIO = 40;

// Elementos del DOM
const tableBody = document.getElementById('tableBodyInstalaciones');
const searchInput = document.getElementById('searchInstInput');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

// Normalizar claves del objeto que viene de Google Sheets
function normalizeRow(raw) {
    const get = (obj, ...keywords) => {
        const keys = Object.keys(obj);
        for (const kw of keywords) {
            const found = keys.find(k => k.toLowerCase().replace(/[áéíóúñü]/g, c => {
                return { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n', 'ü': 'u' }[c] || c;
            }).includes(kw.toLowerCase()));
            if (found !== undefined) return obj[found];
        }
        return '';
    };

    return {
        colegio: get(raw, 'colegio') || 'Sin nombre',
        fecha: get(raw, 'fecha'),
        computadores_registrados: parseInt(get(raw, 'computadores total', 'registrados por agatha', 'total registrados')) || 0,
        se_pudo_instalar: get(raw, 'se pudo', 'pudo instalar'),
        computadores_instalados: parseInt(get(raw, 'cantidad de computadores', 'computadores instalados')) || 0,
        diferencia_meta: parseInt(get(raw, 'diferencia')) || 0,
        sedes: get(raw, 'sede'),
        aula: get(raw, 'aula'),
        licencias: parseInt(get(raw, 'licencias')) || 0,
        instaladores: get(raw, 'instaladores'),
        acta: get(raw, 'acta'),
        funcionario: get(raw, 'funcionario'),
        estado: get(raw, 'estado actual', 'estado'),
        incidencia: get(raw, 'incidencia')
    };
}

// Clasificar severidad de incidencia
function clasificarSeveridad(estado, incidencia) {
    const texto = ((estado || '') + ' ' + (incidencia || '')).toLowerCase();
    if (!texto.trim() || texto.includes('sin incidencia') || texto.includes('n/a') || texto.includes('ninguna') || texto.includes('funcionamiento')) {
        return 'ok';
    }
    if (texto.includes('grave') || texto.includes('critico') || texto.includes('crítico') || texto.includes('fallo total') || texto.includes('no se pudo') || texto.includes('no se instal') || texto.includes('bloqueante')) {
        return 'grave';
    }
    if (texto.includes('media') || texto.includes('parcial') || texto.includes('intermitente') || texto.includes('latencia')) {
        return 'media';
    }
    if (texto.includes('menor') || texto.includes('leve') || texto.includes('minima') || texto.includes('mínima')) {
        return 'menor';
    }
    // Si hay texto de incidencia pero no matchea categorías exactas
    if (texto.includes('incidencia')) {
        if (texto.includes('grave')) return 'grave';
        if (texto.includes('media')) return 'media';
        if (texto.includes('menor')) return 'menor';
        return 'media'; // Default para "Con Incidencia" sin especificar
    }
    return 'ok';
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (loadingOverlay && loadingText) {
            loadingText.innerText = 'Sincronizando con Google Sheets...';
            loadingOverlay.classList.remove('hidden');
        }

        const res = await fetch(INSTALACIONES_SHEET_URL);
        const data = await res.json();

        if (data && Array.isArray(data) && data.length > 0) {
            instalacionesData = data.map(normalizeRow);
            localStorage.setItem('instalaciones_qinaya_db', JSON.stringify(instalacionesData));
        } else {
            const savedData = localStorage.getItem('instalaciones_qinaya_db');
            if (savedData) instalacionesData = JSON.parse(savedData);
            else instalacionesData = [];
        }
    } catch (err) {
        console.error("Error cargando Google Sheets:", err);
        const savedData = localStorage.getItem('instalaciones_qinaya_db');
        if (savedData) instalacionesData = JSON.parse(savedData);
        else instalacionesData = [];
    }

    if (loadingOverlay) loadingOverlay.classList.add('hidden');
    renderAll();

    if (searchInput) {
        searchInput.addEventListener('input', renderTable);
    }
});

// ------------- KPIs -------------
function updateKPIs() {
    const totalColegios = instalacionesData.length;
    const totalInstalados = instalacionesData.reduce((sum, d) => sum + d.computadores_instalados, 0);
    const pctMeta = META_INSTALACIONES > 0 ? Math.round((totalInstalados / META_INSTALACIONES) * 100) : 0;

    const incidenciasActivas = instalacionesData.filter(d => {
        return clasificarSeveridad(d.estado, d.incidencia) !== 'ok';
    }).length;

    // KPI: Colegios
    const colEl = document.getElementById('kpi-colegios');
    if (colEl) colEl.textContent = totalColegios;
    const colTrend = document.getElementById('kpi-trend-colegios');
    if (colTrend) {
        colTrend.innerHTML = `<i class="fas fa-building"></i> Sedes con instalación registrada`;
        colTrend.className = totalColegios > 0 ? 'kpi-trend positive' : 'kpi-trend';
    }

    // KPI: Computadores
    const compEl = document.getElementById('kpi-computadores');
    if (compEl) compEl.textContent = totalInstalados.toLocaleString('es-CO');
    const compTrend = document.getElementById('kpi-trend-computadores');
    if (compTrend) {
        const totalFaltante = instalacionesData.reduce((sum, d) => sum + d.diferencia_meta, 0);
        compTrend.innerHTML = `<i class="fas fa-arrow-down"></i> Faltan ${totalFaltante.toLocaleString('es-CO')} para cubrir meta (${META_POR_COLEGIO}/colegio)`;
        compTrend.className = totalFaltante > 0 ? 'kpi-trend negative' : 'kpi-trend positive';
    }

    // KPI: Meta
    const metaEl = document.getElementById('kpi-meta');
    if (metaEl) metaEl.textContent = `${pctMeta}%`;
    const metaTrend = document.getElementById('kpi-trend-meta');
    if (metaTrend) {
        metaTrend.innerHTML = `<i class="fas fa-arrow-up"></i> ${totalInstalados.toLocaleString('es-CO')} de ${META_INSTALACIONES.toLocaleString('es-CO')}`;
        metaTrend.className = pctMeta >= 50 ? 'kpi-trend positive' : 'kpi-trend';
    }
    const progressBar = document.getElementById('meta-progress-bar');
    if (progressBar) progressBar.style.width = `${Math.min(pctMeta, 100)}%`;

    // KPI: Incidencias
    const incEl = document.getElementById('kpi-incidencias');
    if (incEl) incEl.textContent = incidenciasActivas;
    const incTrend = document.getElementById('kpi-trend-incidencias');
    if (incTrend) {
        const graves = instalacionesData.filter(d => clasificarSeveridad(d.estado, d.incidencia) === 'grave').length;
        if (graves > 0) {
            incTrend.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${graves} grave(s) requieren atención`;
            incTrend.className = 'kpi-trend negative';
        } else if (incidenciasActivas > 0) {
            incTrend.innerHTML = `<i class="fas fa-info-circle"></i> Sin incidencias graves`;
            incTrend.className = 'kpi-trend';
        } else {
            incTrend.innerHTML = `<i class="fas fa-check-circle"></i> Todo operando correctamente`;
            incTrend.className = 'kpi-trend positive';
        }
    }
}

// ------------- GRÁFICAS (Light Theme Colors) -------------
function renderCharts() {
    renderMetaChart();
    renderIncidenciasChart();
    renderResultadoChart();
    renderColegiosChart();
}

function renderMetaChart() {
    const canvas = document.getElementById('metaInstalacionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (metaInstChart) metaInstChart.destroy();

    const totalInstalados = instalacionesData.reduce((sum, d) => sum + d.computadores_instalados, 0);
    const remaining = Math.max(0, META_INSTALACIONES - totalInstalados);
    const pct = Math.round((totalInstalados / META_INSTALACIONES) * 100);

    const centerText = {
        id: 'centerTextMeta',
        beforeDraw: function (chart) {
            const w = chart.width, h = chart.height, ctx2 = chart.ctx;
            ctx2.restore();
            const fontSize = (h / 120).toFixed(2);
            ctx2.font = "bold " + fontSize + "em Outfit";
            ctx2.textBaseline = "middle";
            ctx2.fillStyle = "#1e293b";
            const text = pct + "%";
            const tX = Math.round((w - ctx2.measureText(text).width) / 2);
            ctx2.fillText(text, tX, h / 2.1);
            ctx2.save();
        }
    };

    metaInstChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Instalados', 'Pendientes'],
            datasets: [{
                data: [totalInstalados, remaining],
                backgroundColor: ['#3b82f6', '#e2e8f0'],
                borderWidth: 0,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '72%',
            plugins: {
                legend: { position: 'bottom', labels: { color: '#64748b', padding: 12 } },
                tooltip: { callbacks: { label: (c) => ` ${c.raw.toLocaleString('es-CO')} computadores` } }
            }
        },
        plugins: [centerText]
    });
}

function renderIncidenciasChart() {
    const canvas = document.getElementById('incidenciasChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (incidenciasChartObj) incidenciasChartObj.destroy();

    let counts = { grave: 0, media: 0, menor: 0, ok: 0 };
    instalacionesData.forEach(d => { counts[clasificarSeveridad(d.estado, d.incidencia)]++; });

    incidenciasChartObj = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Grave', 'Media', 'Menor', 'Sin Incidencia'],
            datasets: [{
                data: [counts.grave, counts.media, counts.menor, counts.ok],
                backgroundColor: ['#dc2626', '#ea580c', '#eab308', '#059669'],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 8,
                spacing: 2,
                borderRadius: 3
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { padding: 10, boxWidth: 12, boxHeight: 12, color: '#64748b' } },
                tooltip: { callbacks: { label: (c) => ` ${c.raw} colegio(s) — ${c.label}` } }
            }
        }
    });
}

function renderResultadoChart() {
    const canvas = document.getElementById('resultadoInstalacionChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (resultadoChart) resultadoChart.destroy();

    let siCount = 0, noCount = 0;
    instalacionesData.forEach(d => {
        const val = String(d.se_pudo_instalar).toLowerCase().trim();
        if (val === 'no') { noCount++; }
        else { siCount++; }
    });

    resultadoChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Instalación Exitosa', 'No se pudo instalar'],
            datasets: [{
                data: [siCount, noCount],
                backgroundColor: ['#3b82f6', '#dc2626'],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 8,
                spacing: 2,
                borderRadius: 3
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { padding: 10, boxWidth: 12, boxHeight: 12, color: '#64748b' } },
                tooltip: { callbacks: { label: (c) => ` ${c.raw} colegio(s)` } }
            }
        }
    });
}

function renderColegiosChart() {
    const canvas = document.getElementById('colegiosBarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (colegiosBarChartObj) colegiosBarChartObj.destroy();

    const labels = instalacionesData.map(d => d.colegio.length > 25 ? d.colegio.substring(0, 25) + '...' : d.colegio);
    const registrados = instalacionesData.map(d => d.computadores_registrados);
    const instalados = instalacionesData.map(d => d.computadores_instalados);

    colegiosBarChartObj = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Registrados (Agatha)',
                    data: registrados,
                    backgroundColor: 'rgba(147, 197, 253, 0.7)',
                    borderColor: '#93c5fd',
                    borderWidth: 1,
                    borderRadius: 6
                },
                {
                    label: 'Instalados',
                    data: instalados,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: { color: '#64748b' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b', maxRotation: 45, minRotation: 25, font: { size: 11 } }
                }
            },
            plugins: {
                legend: { labels: { color: '#64748b', padding: 15 } },
                tooltip: {
                    callbacks: {
                        afterBody: (items) => {
                            const idx = items[0].dataIndex;
                            const d = instalacionesData[idx];
                            const diff = d.computadores_instalados - d.computadores_registrados;
                            return `Diferencia: ${diff >= 0 ? '+' : ''}${diff}`;
                        }
                    }
                }
            }
        }
    });
}

// ------------- TABLA -------------
function renderTable() {
    if (!tableBody) return;
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const filteredData = instalacionesData.filter(item =>
        item.colegio.toLowerCase().includes(searchTerm) ||
        (item.sedes && item.sedes.toLowerCase().includes(searchTerm)) ||
        (item.estado && item.estado.toLowerCase().includes(searchTerm))
    );

    tableBody.innerHTML = filteredData.map(item => {
        let displayDate = "-";
        if (item.fecha) {
            try {
                const d = new Date(item.fecha);
                if (!isNaN(d.getTime())) {
                    displayDate = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                } else { displayDate = item.fecha; }
            } catch (e) { displayDate = item.fecha; }
        }

        const severidad = clasificarSeveridad(item.estado, item.incidencia);
        const sevLabels = { grave: 'Grave', media: 'Media', menor: 'Menor', ok: 'OK' };
        const sevBadge = `<span class="severity-badge severity-${severidad}">${sevLabels[severidad]}</span>`;

        // Diferencia = faltante para meta de 40 (positivo = faltan, 0 = cumplido)
        const faltante = item.diferencia_meta;
        let faltanteColor, faltanteText;
        if (faltante > 0) {
            faltanteColor = '#dc2626';
            faltanteText = `<i class="fas fa-arrow-down" style="font-size:0.7rem;"></i> ${faltante}`;
        } else {
            faltanteColor = '#059669';
            faltanteText = `<i class="fas fa-check" style="font-size:0.7rem;"></i> 0`;
        }

        // Acta: si contiene URL, hacerla clickeable
        let actaDisplay = '-';
        const actaVal = String(item.acta || '').trim();
        if (actaVal && (actaVal.startsWith('http') || actaVal.startsWith('drive.google'))) {
            actaDisplay = `<a href="${actaVal}" target="_blank" rel="noopener" style="color: var(--blue-600); text-decoration: none; font-weight: 600;"><i class="fas fa-file-alt"></i> Ver Acta</a>`;
        } else if (actaVal && actaVal !== '-' && actaVal.length > 1) {
            actaDisplay = `<small style="color: var(--text-secondary);">${actaVal}</small>`;
        }

        const incText = item.incidencia || '-';
        const displayInc = incText.length > 55 ? incText.substring(0, 55) + '...' : incText;

        return `
            <tr>
                <td><strong style="color: var(--blue-800);">${item.colegio}</strong></td>
                <td>${displayDate}</td>
                <td style="text-align:center;">${item.computadores_registrados}</td>
                <td style="text-align:center; color: var(--blue-600); font-weight: 700;">${item.computadores_instalados}</td>
                <td style="text-align:center; color: ${faltanteColor}; font-weight: 600;">${faltanteText}</td>
                <td><small style="color: var(--text-secondary);">${item.sedes || '-'}</small></td>
                <td style="text-align:center;">${item.licencias || '-'}</td>
                <td>${actaDisplay}</td>
                <td>${sevBadge}</td>
                <td><small style="color: var(--text-secondary);" title="${incText}">${displayInc}</small></td>
            </tr>
        `;
    }).join('');
}

// ------------- RENDER ALL -------------
function renderAll() {
    renderTable();
    updateKPIs();
    renderCharts();
    localStorage.setItem('instalaciones_qinaya_db', JSON.stringify(instalacionesData));
}
