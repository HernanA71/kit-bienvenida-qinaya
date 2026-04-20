/**
 * Lógica para la vista de Instalaciones Técnicas
 * Carga datos desde Google Sheets y muestra KPIs, gráficas y tabla detallada
 */

let instalacionesData = [];
let metaInstChart, incidenciasChart, resultadoChart, colegiosBarChart;

// =====================================================
// CONFIGURACIÓN: Cambia esta URL por la de tu Google Apps Script
// que sirva los datos de la hoja "Instalaciones"
// =====================================================
const INSTALACIONES_SHEET_URL = "https://script.google.com/macros/s/AKfycbyuQzKFvUuSz6wmUl-WMzhALDCnP_BGvR5VgU1hMoKxwfUPKGQ_lk1k-tUDQfeTaiqy7A/exec?tab=Instalaciones";

const META_INSTALACIONES = 1000;

// Elementos del DOM
const tableBody = document.getElementById('tableBodyInstalaciones');
const searchInput = document.getElementById('searchInstInput');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');

// Normalizar claves del objeto que viene de Google Sheets
function normalizeRow(raw) {
    // Mapeo flexible: busca por coincidencia parcial insensible a acentos
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

// Clasificar severidad de incidencia basada en el texto
function clasificarSeveridad(estado, incidencia) {
    const texto = ((estado || '') + ' ' + (incidencia || '')).toLowerCase();
    if (!texto.trim() || texto.includes('sin incidencia') || texto.includes('n/a') || texto.includes('ninguna') || texto.includes('ok') || texto.includes('exitoso')) {
        return 'ok';
    }
    if (texto.includes('grave') || texto.includes('critico') || texto.includes('crítico') || texto.includes('fallo total') || texto.includes('no se pudo') || texto.includes('bloqueante')) {
        return 'grave';
    }
    if (texto.includes('media') || texto.includes('parcial') || texto.includes('intermitente') || texto.includes('pendiente')) {
        return 'media';
    }
    // Default para incidencias que existen pero no son graves ni medias
    if (texto.includes('menor') || texto.includes('leve') || texto.includes('minima') || texto.includes('mínima') || texto.length > 3) {
        return 'menor';
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

    // Contar incidencias activas (que no son "ok")
    const incidenciasActivas = instalacionesData.filter(d => {
        const sev = clasificarSeveridad(d.estado, d.incidencia);
        return sev !== 'ok';
    }).length;

    // KPI: Colegios
    const colEl = document.getElementById('kpi-colegios');
    if (colEl) colEl.textContent = totalColegios;
    const colTrend = document.getElementById('kpi-trend-colegios');
    if (colTrend) {
        colTrend.innerHTML = `<i class="fas fa-building"></i> Sedes con instalación registrada`;
        colTrend.className = totalColegios > 0 ? 'kpi-trend positive' : 'kpi-trend neutral';
    }

    // KPI: Computadores
    const compEl = document.getElementById('kpi-computadores');
    if (compEl) compEl.textContent = totalInstalados.toLocaleString('es-CO');
    const compTrend = document.getElementById('kpi-trend-computadores');
    if (compTrend) {
        const totalRegistrados = instalacionesData.reduce((sum, d) => sum + d.computadores_registrados, 0);
        compTrend.innerHTML = `<i class="fas fa-server"></i> De ${totalRegistrados.toLocaleString('es-CO')} registrados`;
        compTrend.className = 'kpi-trend neutral';
    }

    // KPI: Meta
    const metaEl = document.getElementById('kpi-meta');
    if (metaEl) metaEl.textContent = `${pctMeta}%`;
    const metaTrend = document.getElementById('kpi-trend-meta');
    if (metaTrend) {
        metaTrend.innerHTML = `<i class="fas fa-arrow-up"></i> ${totalInstalados.toLocaleString('es-CO')} de ${META_INSTALACIONES.toLocaleString('es-CO')}`;
        metaTrend.className = pctMeta >= 50 ? 'kpi-trend positive' : 'kpi-trend neutral';
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
            incTrend.className = 'kpi-trend';
            incTrend.style.color = '#ff4d4d';
        } else if (incidenciasActivas > 0) {
            incTrend.innerHTML = `<i class="fas fa-info-circle"></i> Sin incidencias graves`;
            incTrend.className = 'kpi-trend neutral';
        } else {
            incTrend.innerHTML = `<i class="fas fa-check-circle"></i> Todo operando correctamente`;
            incTrend.className = 'kpi-trend positive';
        }
    }
}

// ------------- GRÁFICAS -------------
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
            const width = chart.width, height = chart.height, ctx = chart.ctx;
            ctx.restore();
            const fontSize = (height / 114).toFixed(2);
            ctx.font = "bold " + fontSize + "em Outfit";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#ffffff";
            const text = pct + "%";
            const textX = Math.round((width - ctx.measureText(text).width) / 2);
            const textY = height / 2.1;
            ctx.fillText(text, textX, textY);
            ctx.save();
        }
    };

    metaInstChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Instalados', 'Pendientes'],
            datasets: [{
                data: [totalInstalados, remaining],
                backgroundColor: ['#00d2ff', 'rgba(255,255,255,0.05)'],
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8' } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.raw.toLocaleString('es-CO')} computadores`
                    }
                }
            }
        },
        plugins: [centerText]
    });
}

function renderIncidenciasChart() {
    const canvas = document.getElementById('incidenciasChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (incidenciasChart) incidenciasChart.destroy();

    let counts = { grave: 0, media: 0, menor: 0, ok: 0 };
    instalacionesData.forEach(d => {
        const sev = clasificarSeveridad(d.estado, d.incidencia);
        counts[sev]++;
    });

    incidenciasChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Grave', 'Media', 'Menor', 'Sin Incidencia'],
            datasets: [{
                data: [counts.grave, counts.media, counts.menor, counts.ok],
                backgroundColor: ['#ff4d4d', '#ff8c00', '#fbc531', '#00ff87'],
                borderColor: ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.4)'],
                borderWidth: 1,
                hoverOffset: 10,
                spacing: 3,
                borderRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { padding: 12, boxWidth: 12, boxHeight: 12, color: '#94a3b8' } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.raw} colegio(s) — ${ctx.label}`
                    }
                }
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
        if (val === 'si' || val === 'sí' || val === 'yes' || val === 'true' || val === '1') {
            siCount++;
        } else if (val && val !== '0' && val !== '' && val !== '-') {
            noCount++;
        } else {
            siCount++; // Default: si no dice nada, asumimos que sí
        }
    });

    resultadoChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Instalación Exitosa', 'No se pudo instalar'],
            datasets: [{
                data: [siCount, noCount],
                backgroundColor: ['#00ff87', '#ff4d4d'],
                borderColor: ['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.4)'],
                borderWidth: 1,
                hoverOffset: 10,
                spacing: 3,
                borderRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { padding: 12, boxWidth: 12, boxHeight: 12, color: '#94a3b8' } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.raw} colegio(s)`
                    }
                }
            }
        }
    });
}

function renderColegiosChart() {
    const canvas = document.getElementById('colegiosBarChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (colegiosBarChart) colegiosBarChart.destroy();

    const labels = instalacionesData.map(d => d.colegio.length > 22 ? d.colegio.substring(0, 22) + '...' : d.colegio);
    const registrados = instalacionesData.map(d => d.computadores_registrados);
    const instalados = instalacionesData.map(d => d.computadores_instalados);

    colegiosBarChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Registrados (Agatha)',
                    data: registrados,
                    backgroundColor: 'rgba(138, 43, 226, 0.6)',
                    borderColor: '#8a2be2',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Instalados',
                    data: instalados,
                    backgroundColor: 'rgba(0, 210, 255, 0.7)',
                    borderColor: '#00d2ff',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 30 }
                }
            },
            plugins: {
                legend: { labels: { color: '#94a3b8' } },
                tooltip: {
                    callbacks: {
                        afterBody: (tooltipItems) => {
                            const idx = tooltipItems[0].dataIndex;
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
        // Formatear Fecha
        let displayDate = "-";
        if (item.fecha) {
            try {
                const d = new Date(item.fecha);
                if (!isNaN(d.getTime())) {
                    displayDate = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                } else {
                    displayDate = item.fecha;
                }
            } catch (e) { displayDate = item.fecha; }
        }

        // Severidad
        const severidad = clasificarSeveridad(item.estado, item.incidencia);
        const sevLabels = { grave: 'Grave', media: 'Media', menor: 'Menor', ok: 'OK' };
        const sevBadge = `<span class="severity-badge severity-${severidad}">${sevLabels[severidad]}</span>`;

        // Diferencia visual
        const diff = item.diferencia_meta || (item.computadores_instalados - item.computadores_registrados);
        let diffColor = diff >= 0 ? '#00ff87' : '#ff4d4d';
        let diffText = diff >= 0 ? `+${diff}` : `${diff}`;

        // Incidencia truncada
        const incText = item.incidencia || '-';
        const displayInc = incText.length > 50 ? incText.substring(0, 50) + '...' : incText;

        return `
            <tr>
                <td><strong>${item.colegio}</strong></td>
                <td>${displayDate}</td>
                <td style="text-align:center;">${item.computadores_registrados}</td>
                <td style="text-align:center; color: #00d2ff; font-weight: 600;">${item.computadores_instalados}</td>
                <td style="text-align:center; color: ${diffColor}; font-weight: 600;">${diffText}</td>
                <td><small style="color: var(--text-secondary);">${item.sedes || '-'}</small></td>
                <td style="text-align:center;">${item.licencias || '-'}</td>
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
