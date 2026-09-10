// ============================================
// CONFIGURACIÓN Y API - CRESER TEC (STB)
// ============================================

const CONFIG = {
    API_BASE_URL: 'https://panel.qinaya.co/api2',
    ENDPOINTS: {
        organizations: '/organizations.asp',
        usage:         '/usage.asp',
        computers:     '/computers.asp',
        websites:      '/websites.asp',
        apps:          '/apps.asp',
        network:       '/network.asp',
    },
    HEADERS: { 'Accept': 'application/json' },
    DEFAULT_ORG_ID: '36', // CreSER Tec
    TIMEOUT: 60000,
};

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

class QinayaAPI {
    constructor(config) {
        this.baseURL  = config.API_BASE_URL;
        this.headers  = config.HEADERS;
        this.timeout  = config.TIMEOUT;
    }

    async request(endpoint, params = {}) {
        const queryParts = Object.entries(params)
            .filter(([, v]) => v !== null && v !== undefined && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
        const qs  = queryParts.length ? '?' + queryParts.join('&') : '';
        const url = this.baseURL + endpoint + qs;

        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), this.timeout);
        try {
            const response = await fetch(url, {
                method: 'GET',
                mode:   'cors',
                headers: this.headers,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`[QinayaAPI] Error en ${url}:`, error.message);
            throw error;
        }
    }

    async getOrganizations() {
        return this.request(CONFIG.ENDPOINTS.organizations);
    }

    async getComputers(orgId, since, until) {
        return this.request(CONFIG.ENDPOINTS.computers, { org: orgId, since, until });
    }

    async getUsage(orgId, since, until) {
        return this.request(CONFIG.ENDPOINTS.usage, { org: orgId, since, until });
    }

    async getWebsites(orgId, since, until) {
        return this.request(CONFIG.ENDPOINTS.websites, { org: orgId, since, until });
    }

    async getApps(orgId, since, until) {
        return this.request(CONFIG.ENDPOINTS.apps, { org: orgId, since, until });
    }

    async getNetwork(orgId, since, until, extra = {}) {
        return this.request(CONFIG.ENDPOINTS.network, { org: orgId, since, until, ...extra });
    }
}

const api = new QinayaAPI(CONFIG);

let allComputersGlobal = [];

document.addEventListener('DOMContentLoaded', () => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const elFecha = document.getElementById('fecha-hoy');
    if (elFecha) elFecha.textContent = new Date().toLocaleDateString('es-ES', options);

    // Rango por defecto: Inicio del proyecto CreSER Tec (9 de marzo de 2026) a hoy
    const projectStart = new Date(2026, 2, 9);
    const today = new Date();

    const fromInput = document.getElementById('dateFrom');
    const toInput   = document.getElementById('dateTo');
    
    if (fromInput) fromInput.value = formatDate(projectStart);
    if (toInput)   toInput.value   = formatDate(today);

    // Botón consultar
    const btnConsultar = document.getElementById('btnConsultar');
    if (btnConsultar) btnConsultar.addEventListener('click', loadData);

    // Presets de fechas
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const range = e.currentTarget.dataset.range;
            setPresetRange(range);
            loadData();
        });
    });

    // Filtro de búsqueda en tabla completa de STBs
    const searchInput = document.getElementById('searchSTB');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterAllSTBsTable(e.target.value.trim().toLowerCase());
        });
    }

    // Carga inicial
    loadData();
});

function setPresetRange(range) {
    const fromInput = document.getElementById('dateFrom');
    const toInput   = document.getElementById('dateTo');
    const now = new Date();

    if (range === 'history') {
        fromInput.value = '2026-03-09';
        toInput.value   = formatDate(now);
    } else if (range === 'last-week') {
        // Última semana hábil reciente
        const end = new Date(2026, 8, 4); // 4 de sep 2026
        const start = new Date(2026, 7, 31); // 31 de ago 2026
        fromInput.value = formatDate(start);
        toInput.value   = formatDate(end);
    } else if (range === 'last-month') {
        const start = new Date(2026, 7, 1);
        const end   = new Date(2026, 7, 31);
        fromInput.value = formatDate(start);
        toInput.value   = formatDate(end);
    } else if (range === 'first-phase') {
        // Periodo del informe general inicial (marzo - julio)
        fromInput.value = '2026-03-09';
        toInput.value   = '2026-07-08';
    }
}

function showLoading(show) {
    const el = document.getElementById('loadingOverlay');
    if (el) {
        if (show) {
            el.style.display = 'flex';
            el.classList.remove('hidden');
        } else {
            el.style.display = 'none';
            el.classList.add('hidden');
        }
    }
}

function getBusinessDays(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) return 1;
    let startParts = startDateStr.split('-');
    let endParts = endDateStr.split('-');
    let curDate = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    let end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

    const holidays = [
        "2026-01-01", "2026-01-12", "2026-03-23", "2026-04-02", "2026-04-03",
        "2026-05-01", "2026-05-18", "2026-06-08", "2026-06-15", "2026-06-29",
        "2026-07-20", "2026-08-07", "2026-08-17", "2026-10-12", "2026-11-02",
        "2026-11-16", "2026-12-08", "2026-12-25"
    ];

    let count = 0;
    while (curDate <= end) {
        const dayOfWeek = curDate.getDay();
        const y = curDate.getFullYear();
        const m = String(curDate.getMonth() + 1).padStart(2, '0');
        const d = String(curDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays.includes(dateStr)) {
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count === 0 ? 1 : count;
}

async function loadData() {
    showLoading(true);
    const since = document.getElementById('dateFrom').value;
    const until = document.getElementById('dateTo').value;

    let orgDataList, pcData, websiteData, usageData, appsData, networkData;

    try {
        [orgDataList, pcData, websiteData, usageData, appsData, networkData] = await Promise.all([
            api.getOrganizations().catch(e => { console.warn(e); return []; }),
            api.getComputers(CONFIG.DEFAULT_ORG_ID, since, until).catch(e => { console.warn(e); return []; }),
            api.getWebsites(CONFIG.DEFAULT_ORG_ID, since, until).catch(e => { console.warn(e); return []; }),
            api.getUsage(CONFIG.DEFAULT_ORG_ID, since, until).catch(e => { console.warn(e); return null; }),
            api.getApps(CONFIG.DEFAULT_ORG_ID, since, until).catch(e => { console.warn(e); return null; }),
            api.getNetwork(CONFIG.DEFAULT_ORG_ID, since, until).catch(e => { console.warn(e); return null; })
        ]);

        if (!Array.isArray(pcData)) pcData = [];
        if (!Array.isArray(websiteData)) websiteData = [];

    } catch (e) {
        console.error("Fallo general al conectar con la API:", e);
        pcData = [];
        websiteData = [];
        alert("Hubo un error al conectar con la API de Qinaya. Por favor verifica tu conexión.");
    }

    let currentOrg = null;
    if (Array.isArray(orgDataList)) {
        currentOrg = orgDataList.find(o => o.id == CONFIG.DEFAULT_ORG_ID);
    } else if (orgDataList && Array.isArray(orgDataList.value)) {
        currentOrg = orgDataList.value.find(o => o.id == CONFIG.DEFAULT_ORG_ID);
    }

    let daysCount = getBusinessDays(since, until);

    try {
        processCreSerTecReport(pcData, websiteData, usageData, appsData, currentOrg, daysCount, networkData);
    } catch (err) {
        console.error("Error procesando reporte CreSER Tec:", err);
    } finally {
        showLoading(false);
    }
}

function processCreSerTecReport(pcDataRaw, websiteData, usageData, appsData, currentOrg, daysCount = 1, networkData = null) {
    // 1. Metas del Programa e Inventario
    const metaPrograma = 1000;
    let totalEntregados = 1000; // Según API numInstalled o computers
    if (currentOrg && currentOrg.computers && currentOrg.computers[0]) {
        totalEntregados = Number(currentOrg.computers[0]);
    }

    // 2. Dispositivos STB Activos con Telemetría en el Periodo
    const totalActivos = pcDataRaw.length;
    let totalHoras = 0;
    let totalLocal = 0;
    let totalVM = 0;

    const systemAppsRegex = /minstall|roxterm|finder|explorer|taskmgr|system|installer|bash|cmd|terminal|xfce|gnome|pantallazo|sysinfo|kinfocenter|Rel_upgrade/i;

    const computersProcessed = pcDataRaw.map(pc => {
        const h = Number(pc.totalHours || 0);
        const lh = Number(pc.localHours || 0);
        const vh = Number(pc.vmHours || 0);
        totalHoras += h;
        totalLocal += lh;
        totalVM += vh;

        const dailyAvg = daysCount > 0 ? (h / daysCount) : 0;
        let topApp = pc.topApp || 'Navegador Web';
        if (topApp === 'Soffice') topApp = 'LibreOffice';
        if (topApp === 'th.dtv') topApp = 'Reproductor Multimedia';

        return {
            id: pc.id,
            site: pc.site || 'Buma',
            status: pc.status || 'online',
            totalHours: h,
            localHours: lh,
            vmHours: vh,
            dailyAvg: dailyAvg,
            topApp: topApp
        };
    });

    // Guardar copia global para filtrado en buscador
    allComputersGlobal = computersProcessed;

    // 3. Cálculos de Promedio Diario con base en usageData
    let promedioDiarioActivos = 0;
    let promedioDiarioInstalados = 0;
    let maxDAU = 0;
    let sumTotalUsage = 0;

    if (usageData && usageData.totalUsage && usageData.totalUsage.length > 0) {
        let sumComputersDays = 0;
        let sumInstalledDays = 0;

        for (let i = 0; i < usageData.totalUsage.length; i++) {
            const usageVal = Number(usageData.totalUsage[i] || 0);
            sumTotalUsage += usageVal;

            const nComp = Number(usageData.numComputers ? usageData.numComputers[i] : 0);
            sumComputersDays += nComp;
            if (nComp > maxDAU) maxDAU = nComp;

            const nInst = Number((usageData.numInstalled && usageData.numInstalled[i]) ? usageData.numInstalled[i] : totalEntregados);
            sumInstalledDays += nInst;
        }

        if (sumComputersDays > 0) {
            promedioDiarioActivos = sumTotalUsage / sumComputersDays;
        } else if (totalActivos > 0 && daysCount > 0) {
            promedioDiarioActivos = totalHoras / totalActivos / daysCount;
        }

        if (sumInstalledDays > 0) {
            promedioDiarioInstalados = sumTotalUsage / sumInstalledDays;
        } else if (totalEntregados > 0 && daysCount > 0) {
            promedioDiarioInstalados = totalHoras / totalEntregados / daysCount;
        }
    } else {
        sumTotalUsage = totalHoras;
        promedioDiarioActivos = totalActivos > 0 ? (totalHoras / totalActivos / daysCount) : 0;
        promedioDiarioInstalados = totalEntregados > 0 ? (totalHoras / totalEntregados / daysCount) : 0;
    }

    const tasaActivacion = totalEntregados > 0 ? ((totalActivos / totalEntregados) * 100) : 0;

    // 4. Actualizar KPIs Principales en UI
    document.getElementById('kpi-meta').textContent = metaPrograma.toLocaleString();
    document.getElementById('kpi-activos').textContent = totalActivos.toLocaleString();
    document.getElementById('kpi-tasa-activacion').textContent = tasaActivacion.toFixed(1) + '%';
    document.getElementById('kpi-horas').textContent = Math.round(totalHoras).toLocaleString() + ' hrs';
    document.getElementById('kpi-promedio-activos').textContent = promedioDiarioActivos.toFixed(1) + ' hrs';
    document.getElementById('kpi-promedio-instalados').textContent = promedioDiarioInstalados.toFixed(2) + ' hrs';

    // 5. Segmentación por Franjas de Uso
    let sinActivacion = Math.max(0, totalEntregados - totalActivos);
    let usoMinimo = 0;
    let usoBajo = 0;
    let usoMedio = 0;
    let usoAlto = 0;

    const isShortRange = daysCount < 30;
    const thresholdAlto = isShortRange ? (daysCount * 2.0) : 150;
    const thresholdMedio = isShortRange ? (daysCount * 0.7) : 20;
    const thresholdBajo = isShortRange ? (daysCount * 0.15) : 1;

    computersProcessed.forEach(c => {
        if (c.totalHours >= thresholdAlto) {
            usoAlto++;
        } else if (c.totalHours >= thresholdMedio) {
            usoMedio++;
        } else if (c.totalHours >= thresholdBajo) {
            usoBajo++;
        } else {
            usoMinimo++;
        }
    });

    renderFranjasTable({
        sinActivacion,
        usoMinimo,
        usoBajo,
        usoMedio,
        usoAlto,
        total: totalEntregados,
        totalActivos
    });

    // 6. Gráfico de Franjas de Adopción
    renderAdoptionChart({ sinActivacion, usoMinimo, usoBajo, usoMedio, usoAlto });

    // 7. Tops de Terminales STB
    computersProcessed.sort((a, b) => b.totalHours - a.totalHours);

    const top10 = computersProcessed.slice(0, 10);
    const bottom10 = computersProcessed.filter(c => c.totalHours > 0).slice().reverse().slice(0, 10);

    renderSTBTable('tableTopSTBs', top10, daysCount, true);
    renderSTBTable('tableBottomSTBs', bottom10, daysCount, false);

    // Tabla completa
    renderAllSTBsTable(computersProcessed, daysCount);

    // 8. Programas Más Usados
    let appsArray = [];
    if (appsData && appsData.progams && appsData.usage) {
        for (let i = 0; i < appsData.progams.length; i++) {
            let name = appsData.progams[i];
            let hours = appsData.usage[i] || 0;
            if (!systemAppsRegex.test(name)) {
                appsArray.push({ name, hours });
            }
        }
    }
    appsArray.sort((a, b) => b.hours - a.hours);
    renderAppsTable(appsArray.slice(0, 8), totalActivos, daysCount);

    // 9. Sitios Web y Categorías CreSER Tec
    let websArray = Array.isArray(websiteData) ? websiteData : [];
    websArray.sort((a, b) => b.visits - a.visits);
    renderWebsTable(websArray.slice(0, 10), totalActivos, daysCount);

    // 10. Resumen Categorizado del Ecosistema CreSER Tec
    renderEcosystemCategories(websArray, appsArray);

    // 11. Diagnóstico de Calidad de Conectividad (Network Quality)
    try {
        processNetworkQuality(networkData, daysCount);
    } catch (eNet) {
        console.error("Error procesando calidad de red:", eNet);
    }
}

function renderFranjasTable(stats) {
    const tbody = document.getElementById('tableFranjas');
    if (!tbody) return;

    const rows = [
        { label: 'Uso Alto (Heavy Users)', count: stats.usoAlto, criterio: '> 150 hrs acumuladas', color: '#16a34a', bg: '#dcfce7', desc: 'Emprendedores que integraron el STB a su rutina diaria' },
        { label: 'Uso Medio', count: stats.usoMedio, criterio: '20 - 150 hrs acumuladas', color: '#0284c7', bg: '#e0f2fe', desc: 'Uso regular comercial y formativo recurrente' },
        { label: 'Uso Bajo', count: stats.usoBajo, criterio: '1 - 20 hrs acumuladas', color: '#d97706', bg: '#fef3c7', desc: 'Uso esporádico o puntual' },
        { label: 'Uso Mínimo', count: stats.usoMinimo, criterio: '< 1 hr registrada', color: '#ea580c', bg: '#ffedd5', desc: 'Se encendieron pero sin apropiación continua (Accionables)' },
        { label: 'Sin Activación en API', count: stats.sinActivacion, criterio: '0 horas de telemetría', color: '#dc2626', bg: '#fee2e2', desc: 'Pendientes por primer encendido o sin conexión' },
    ];

    tbody.innerHTML = rows.map(r => {
        const pctTotal = stats.total > 0 ? ((r.count / stats.total) * 100).toFixed(1) : 0;
        const pctActivos = stats.totalActivos > 0 && r.label !== 'Sin Activación en API' 
            ? ` (${((r.count / stats.totalActivos) * 100).toFixed(1)}% de activos)` 
            : '';
        return `
            <tr>
                <td>
                    <span class="badge" style="background: ${r.bg}; color: ${r.color}; font-weight: 700;">${r.label}</span>
                </td>
                <td style="text-align: center; font-weight: 700; font-size: 1rem; color: #1e293b;">${r.count.toLocaleString()}</td>
                <td style="text-align: center; font-weight: 600; color: ${r.color};">${pctTotal}%${pctActivos}</td>
                <td><span style="font-size: 0.82rem; color: #475569;">${r.criterio}</span></td>
                <td><span style="font-size: 0.8rem; color: #64748b;">${r.desc}</span></td>
            </tr>
        `;
    }).join('');
}

let adoptionChart = null;
function renderAdoptionChart(stats) {
    const ctx = document.getElementById('adoptionChart');
    if (!ctx) return;
    if (adoptionChart) adoptionChart.destroy();

    Chart.defaults.font.family = 'Outfit';

    adoptionChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: [
                'Uso Alto (>150h)',
                'Uso Medio (20-150h)',
                'Uso Bajo (1-20h)',
                'Uso Mínimo (<1h)',
                'Sin Activación'
            ],
            datasets: [{
                data: [stats.usoAlto, stats.usoMedio, stats.usoBajo, stats.usoMinimo, stats.sinActivacion],
                backgroundColor: [
                    '#16a34a',
                    '#0284c7',
                    '#f59e0b',
                    '#f97316',
                    '#e2e8f0'
                ],
                borderWidth: 2,
                borderColor: '#ffffff',
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, padding: 8, font: { size: 10 } }
                },
                tooltip: {
                    callbacks: {
                        label: (c) => {
                            const total = c.dataset.data.reduce((a, b) => a + b, 0);
                            const val = c.parsed;
                            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
                            return ` ${c.label}: ${val} terminales (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderSTBTable(elementId, data, daysCount, isTop) {
    const tbody = document.getElementById(elementId);
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No se registraron datos en el periodo</td></tr>';
        return;
    }

    data.forEach((stb, idx) => {
        const rank = idx + 1;
        const dailyAvg = daysCount > 0 ? (stb.totalHours / daysCount) : 0;
        const displayAvg = dailyAvg >= 1.0 ? `${dailyAvg.toFixed(1)} hrs/día` : `${Math.round(dailyAvg * 60)} min/día`;

        const badgeColor = isTop ? '#15803d' : '#b45309';
        const badgeBg = isTop ? '#dcfce7' : '#fef3c7';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="badge" style="background: ${badgeBg}; color: ${badgeColor}; font-weight: 700; min-width: 22px; text-align: center;">#${rank}</span>
                <strong style="margin-left: 6px; color: #1e293b; font-family: monospace; font-size: 0.95rem;">${stb.id}</strong>
            </td>
            <td><span class="badge" style="background: #f1f5f9; color: #475569;">${stb.site}</span></td>
            <td><strong style="color: ${isTop ? '#15803d' : '#b45309'}; font-size: 0.95rem;">${stb.totalHours.toFixed(1)} hrs</strong></td>
            <td><span style="color: #475569; font-weight: 600;">${displayAvg}</span></td>
            <td><span class="status-high" style="color: #0284c7; font-weight: 600;"><i class="fas fa-layer-group"></i> ${stb.topApp}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAllSTBsTable(data, daysCount) {
    const tbody = document.getElementById('tableAllSTBs');
    const badgeCount = document.getElementById('countSTBList');
    if (badgeCount) badgeCount.textContent = `${data.length} terminales`;

    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #94a3b8;">No hay terminales STB con telemetría en este periodo</td></tr>';
        return;
    }

    renderSTBChunk(data.slice(0, 100), tbody, daysCount);
}

function renderSTBChunk(items, tbody, daysCount) {
    tbody.innerHTML = items.map((stb, i) => {
        const dailyAvg = daysCount > 0 ? (stb.totalHours / daysCount) : 0;
        const displayAvg = dailyAvg >= 1.0 ? `${dailyAvg.toFixed(1)} hrs/día` : `${Math.round(dailyAvg * 60)} min/día`;
        
        let levelBadge = '';
        if (stb.totalHours >= 150) {
            levelBadge = '<span class="badge" style="background: #dcfce7; color: #15803d;">Alto</span>';
        } else if (stb.totalHours >= 20) {
            levelBadge = '<span class="badge" style="background: #e0f2fe; color: #0284c7;">Medio</span>';
        } else if (stb.totalHours >= 1) {
            levelBadge = '<span class="badge" style="background: #fef3c7; color: #b45309;">Bajo</span>';
        } else {
            levelBadge = '<span class="badge" style="background: #ffedd5; color: #c2410c;">Mínimo</span>';
        }

        return `
            <tr>
                <td style="font-family: monospace; font-weight: 700; color: #1e293b;">${stb.id}</td>
                <td>${stb.site}</td>
                <td>${levelBadge}</td>
                <td style="font-weight: 700; color: #0284c7;">${stb.totalHours.toFixed(1)} hrs</td>
                <td style="color: #475569;">${displayAvg}</td>
                <td><span style="color: #334155; font-weight: 500;">${stb.topApp}</span></td>
            </tr>
        `;
    }).join('');
}

function filterAllSTBsTable(query) {
    const tbody = document.getElementById('tableAllSTBs');
    if (!tbody) return;
    const daysCount = 1;
    if (!query) {
        renderSTBChunk(allComputersGlobal.slice(0, 100), tbody, daysCount);
        return;
    }
    const filtered = allComputersGlobal.filter(c => 
        c.id.toLowerCase().includes(query) || 
        c.topApp.toLowerCase().includes(query)
    );
    renderSTBChunk(filtered.slice(0, 100), tbody, daysCount);
}

function renderAppsTable(apps, totalActivos, daysCount) {
    const tbody = document.getElementById('tableApps');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (apps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #94a3b8;">Sin registros de programas</td></tr>';
        return;
    }

    apps.forEach(a => {
        const dailyAvg = (totalActivos > 0 && daysCount > 0) ? (a.hours / totalActivos / daysCount) : 0;
        const displayAvg = dailyAvg >= 1.0 ? `${dailyAvg.toFixed(1)} hrs/día` : `${Math.round(dailyAvg * 60)} min/día`;

        let icon = 'fa-desktop';
        if (/chrome|firefox|opera/i.test(a.name)) icon = 'fa-globe';
        if (/calc|excel/i.test(a.name)) icon = 'fa-table';
        if (/writer|word/i.test(a.name)) icon = 'fa-file-alt';
        if (/youtube/i.test(a.name)) icon = 'fa-play-circle';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><i class="fas ${icon}" style="color: #2563eb; width: 18px;"></i> <strong>${a.name}</strong></td>
            <td><strong style="color: #047857;">${Math.round(a.hours).toLocaleString()} hrs</strong></td>
            <td><span style="color: #475569; font-weight: 600;">${displayAvg}</span></td>
            <td><span class="badge" style="background: #f1f5f9; color: #475569;">STB Local</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderWebsTable(webs, totalActivos, daysCount) {
    const tbody = document.getElementById('tableWebs');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (webs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #94a3b8;">Sin registros de navegación web</td></tr>';
        return;
    }

    webs.forEach(w => {
        const dailyAvg = (totalActivos > 0 && daysCount > 0) ? (w.visits / totalActivos / daysCount) : 0;
        const displayAvg = dailyAvg >= 1.0 ? `${dailyAvg.toFixed(1)} hrs/día` : `${Math.round(dailyAvg * 60)} min/día`;

        let badge = '<span class="badge" style="background: #f1f5f9; color: #475569;">General</span>';
        if (/campus\.ccc/i.test(w.name)) {
            badge = '<span class="badge" style="background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca;"><i class="fas fa-university"></i> Campus CCC</span>';
        } else if (/buildingmarkets/i.test(w.name)) {
            badge = '<span class="badge" style="background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe;"><i class="fas fa-briefcase"></i> Buma E-Learning</span>';
        } else if (/chatgpt/i.test(w.name)) {
            badge = '<span class="badge" style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;"><i class="fas fa-robot"></i> IA Generativa</span>';
        } else if (/canva/i.test(w.name)) {
            badge = '<span class="badge" style="background: #fdf4ff; color: #a21caf; border: 1px solid #f5d0fe;"><i class="fas fa-palette"></i> Diseño Digital</span>';
        } else if (/whatsapp/i.test(w.name)) {
            badge = '<span class="badge" style="background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;"><i class="fab fa-whatsapp"></i> Comunicación & Ventas</span>';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${w.name}</strong></td>
            <td><strong style="color: #0284c7;">${Math.round(w.visits).toLocaleString()} hrs</strong></td>
            <td><span style="color: #475569; font-weight: 600;">${displayAvg}</span></td>
            <td>${badge}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderEcosystemCategories(webs, apps) {
    const tbody = document.getElementById('tableCategories');
    if (!tbody) return;

    let totalCampus = 0;
    let totalIAProductividad = 0;
    let totalComercialVentas = 0;
    let totalVideoGeneral = 0;

    webs.forEach(w => {
        const v = Number(w.visits || 0);
        if (/ccc\.org|buildingmarkets/i.test(w.name)) {
            totalCampus += v;
        } else if (/chatgpt|canva/i.test(w.name)) {
            totalIAProductividad += v;
        } else if (/whatsapp|mail\.google/i.test(w.name)) {
            totalComercialVentas += v;
        } else {
            totalVideoGeneral += v;
        }
    });

    apps.forEach(a => {
        const h = Number(a.hours || 0);
        if (/calc|writer|draw|libreoffice/i.test(a.name)) {
            totalIAProductividad += h;
        }
    });

    const categories = [
        {
            name: 'Plataformas de Formación y Alianzas (Campus CCC & Buma)',
            hours: totalCampus,
            desc: 'Cursos virtuales de fortalecimiento empresarial de la Cámara de Comercio de Cali y Building Markets.',
            badge: '<span class="badge" style="background: #eff6ff; color: #1d4ed8;">Prioridad Programa</span>'
        },
        {
            name: 'Productividad, Ofimática e Inteligencia Artificial (ChatGPT, Canva, LibreOffice)',
            hours: totalIAProductividad,
            desc: 'Creación de contenidos, cotizaciones, gestión financiera y asistencia por IA en los micronegocios.',
            badge: '<span class="badge" style="background: #ecfdf5; color: #047857;">Alto Valor Económico</span>'
        },
        {
            name: 'Ventas, Canales de Contacto y Comunicación (WhatsApp Web, Gmail)',
            hours: totalComercialVentas,
            desc: 'Coordinación con clientes, recepción de pedidos y correos comerciales de los emprendedores.',
            badge: '<span class="badge" style="background: #f0fdf4; color: #15803d;">Operación Comercial</span>'
        },
        {
            name: 'Investigación, Video y Navegación General (YouTube, Búsqueda Google)',
            hours: totalVideoGeneral,
            desc: 'Autoaprendizaje audiovisual, tutoriales técnicos y consultas generales de mercado.',
            badge: '<span class="badge" style="background: #f8fafc; color: #64748b;">Navegación Abierta</span>'
        }
    ];

    tbody.innerHTML = categories.map(c => `
        <tr>
            <td>
                <strong>${c.name}</strong><br>
                <span style="font-size: 0.78rem; color: #64748b;">${c.desc}</span>
            </td>
            <td style="font-weight: 700; color: #1e293b; font-size: 0.95rem;">${Math.round(c.hours).toLocaleString()} hrs</td>
            <td>${c.badge}</td>
        </tr>
    `).join('');
}

function processNetworkQuality(networkData, daysCount = 1) {
    const elP50Down = document.getElementById('net-kpi-p50-down');
    const elUnder1M = document.getElementById('net-kpi-under-1m');
    const elP50Lat  = document.getElementById('net-kpi-p50-lat');
    const elOver200 = document.getElementById('net-kpi-over-200ms');

    const hasData = networkData && networkData.summary && networkData.summary.hasData !== false;

    if (!hasData) {
        if (elP50Down) elP50Down.textContent = 'Sin datos';
        if (elUnder1M) elUnder1M.textContent = 'Sin datos';
        if (elP50Lat)  elP50Lat.textContent  = 'Sin datos';
        if (elOver200) elOver200.textContent = 'Sin datos';
        return;
    }

    const s = networkData.summary;
    const p50Down = s.p50DownloadMbps;
    const pctUnder1 = s.pctUnder1Mbps;
    const p50Lat = s.p50LatencyMs;
    const pctOver200 = s.pctLatencyOver200Ms;

    if (elP50Down) elP50Down.textContent = (p50Down !== null && p50Down !== undefined) ? `${p50Down.toFixed(2)} Mbps` : '—';
    if (elUnder1M) elUnder1M.textContent = (pctUnder1 !== null && pctUnder1 !== undefined) ? `${pctUnder1.toFixed(1)}%` : '—';
    if (elP50Lat)  elP50Lat.textContent  = (p50Lat !== null && p50Lat !== undefined) ? `${Math.round(p50Lat).toLocaleString()} ms` : '—';
    if (elOver200) elOver200.textContent = (pctOver200 !== null && pctOver200 !== undefined) ? `${pctOver200.toFixed(1)}%` : '—';
}
