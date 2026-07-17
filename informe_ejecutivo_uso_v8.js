// ============================================
// CONFIGURACIÓN Y API
// ============================================

const CONFIG = {
    API_BASE_URL: 'https://panel.qinaya.co/api2',
    ENDPOINTS: {
        organizations: '/organizations.asp',
        usage:         '/usage.asp',
        computers:     '/computers.asp',
        websites:      '/websites.asp',
        apps:          '/apps.asp',
    },
    HEADERS: { 'Accept': 'application/json' },
    DEFAULT_ORG_ID: '28', // Secretaría de Educación de Bogotá
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

    async getWebsites(orgId, since, until) {
        return this.request(CONFIG.ENDPOINTS.websites, { org: orgId, since, until });
    }

    async getApps(orgId, since, until) {
        return this.request(CONFIG.ENDPOINTS.apps, { org: orgId, since, until });
    }
}

// ============================================
// LÓGICA DEL REPORTE
// ============================================

const api = new QinayaAPI(CONFIG);

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar fecha de hoy
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('fecha-hoy').textContent = new Date().toLocaleDateString('es-ES', options);

    // Configurar selectores de fecha por defecto
    const projectStart = new Date(2026, 2, 4); // 4 de marzo de 2026
    const today = new Date();

    const fromInput = document.getElementById('dateFrom');
    const toInput = document.getElementById('dateTo');
    
    fromInput.value = formatDate(projectStart);
    toInput.value = formatDate(today);

    document.getElementById('btnConsultar').addEventListener('click', loadData);

    // Cargar inicialmente
    loadData();
});

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) overlay.classList.remove('hidden');
    else overlay.classList.add('hidden');
}

async function loadData() {
    showLoading(true);
    const since = document.getElementById('dateFrom').value;
    const until = document.getElementById('dateTo').value;

    let orgDataList, pcData, websiteData, usageData, appsData;

    try {
        // Ejecución concurrente ya que no dependemos de proxies frágiles
        [orgDataList, pcData, websiteData, usageData, appsData] = await Promise.all([
            api.getOrganizations().catch(e => { console.warn(e); return []; }),
            api.getComputers(CONFIG.DEFAULT_ORG_ID, since, until).catch(e => { console.warn(e); return []; }),
            api.getWebsites(CONFIG.DEFAULT_ORG_ID, since, until).catch(e => { console.warn(e); return []; }),
            api.request(CONFIG.ENDPOINTS.usage, { org: CONFIG.DEFAULT_ORG_ID, since, until }).catch(e => { console.warn(e); return null; }),
            api.getApps(CONFIG.DEFAULT_ORG_ID, since, until).catch(e => { console.warn(e); return null; })
        ]);
        
        if (!Array.isArray(pcData)) pcData = [];
        if (!Array.isArray(websiteData)) websiteData = [];
        
    } catch (e) {
        console.error("Fallo general al conectar con la API:", e);
        pcData = [];
        websiteData = [];
        alert("Hubo un error al conectar con la base de datos. Por favor verifica tu conexión a internet.");
    }

    // Identificar la organización actual para obtener datos de instalación
    let currentOrg = null;
    if (Array.isArray(orgDataList)) {
        currentOrg = orgDataList.find(o => o.id == CONFIG.DEFAULT_ORG_ID);
    } else if (orgDataList && Array.isArray(orgDataList.value)) {
        currentOrg = orgDataList.value.find(o => o.id == CONFIG.DEFAULT_ORG_ID);
    }

    const sinceDate = new Date(since);
    const untilDate = new Date(until);
    let daysCount = Math.ceil((untilDate - sinceDate) / (1000 * 60 * 60 * 24)) + 1;
    if (daysCount < 1 || isNaN(daysCount)) daysCount = 1;

    processReportData(pcData, websiteData, usageData, appsData, currentOrg, daysCount);
    showLoading(false);
}

function processReportData(pcDataRaw, websiteData, usageData, appsData, currentOrg, daysCount = 1) {
    
    // Extraer inventario instalado de la organización
    let totalEquiposInstalados = 0;
    let totalColegiosInstalados = 0;
    const installedMap = new Map();
    if (currentOrg && currentOrg.sites && currentOrg.computers) {
        totalColegiosInstalados = currentOrg.sites.length;
        if (currentOrg.sites.length !== currentOrg.computers.length) {
            console.error("Mismatch entre cantidad de colegios y computadores en organizations.asp");
        }
        for (let i = 0; i < currentOrg.sites.length; i++) {
            const sName = currentOrg.sites[i];
            const sCount = currentOrg.computers[i] || 0;
            installedMap.set(sName, sCount);
            totalEquiposInstalados += Number(sCount);
        }
    }

    // 1. KPIs Globales de Uso Activo
    const totalEquiposActivos = pcDataRaw.length;
    let totalLocal = 0;
    let totalVM = 0;
    let totalHorasRaw = 0;
    
    const colegiosMap = new Map();

    // Inicializar el mapa con TODOS los colegios instalados, aunque no tengan uso
    for (let [sName, sCount] of installedMap.entries()) {
        colegiosMap.set(sName, { name: sName, activeCount: 0, installedCount: sCount, totalHours: 0, localHours: 0, vmHours: 0 });
    }

    // Procesar uso
    pcDataRaw.forEach(pc => {
        const site = pc.site || 'Sin Asignar';
        
        totalLocal += pc.localHours || 0;
        totalVM += pc.vmHours || 0;
        totalHorasRaw += pc.totalHours || 0;
        
        // Agrupar por colegio
        if (!colegiosMap.has(site)) {
            // Si hay un colegio en uso que no estaba en installedMap, lo agregamos con installedCount = 0 (o fallback a 1)
            colegiosMap.set(site, { name: site, activeCount: 0, installedCount: 0, totalHours: 0, localHours: 0, vmHours: 0 });
        }
        const s = colegiosMap.get(site);
        s.activeCount += 1;
        s.totalHours += (pc.totalHours || 0);
        s.localHours += (pc.localHours || 0);
        s.vmHours += (pc.vmHours || 0);
    });

    // 2. Procesar Colegios
    const colegiosArray = Array.from(colegiosMap.values()).map(c => {
        // Promedio de horas por equipo ACTIVO de ese colegio
        c.avgHours = c.activeCount > 0 ? (c.totalHours / c.activeCount) : 0;
        // Si no hay datos instalados para este colegio (porque apareció en pcData pero no en org), usar el activo como fallback visual
        if (c.installedCount === 0 && c.activeCount > 0) {
            c.installedCount = c.activeCount;
        }
        return c;
    });

    // Calcular promedio general total basado en equipos activos
    const promedioGeneral = totalEquiposActivos > 0 ? (totalHorasRaw / totalEquiposActivos) : 0;
    const porcentajeVM = totalHorasRaw > 0 ? ((totalVM / totalHorasRaw) * 100) : 0;

    // Calcular Promedio Diario
    let promedioDiario = 0;
    if (usageData && usageData.totalUsage && usageData.numComputers) {
        let sumTotalUsage = 0;
        let sumNumComputers = 0;
        for (let i = 0; i < usageData.totalUsage.length; i++) {
            sumTotalUsage += (usageData.totalUsage[i] || 0);
            sumNumComputers += (usageData.numComputers[i] || 0);
        }
        if (sumNumComputers > 0) {
            promedioDiario = sumTotalUsage / sumNumComputers;
        }
    }

    document.getElementById('kpi-equipos').textContent = totalEquiposInstalados.toLocaleString();
    document.getElementById('kpi-colegios').textContent = totalColegiosInstalados.toLocaleString();
    const kpiPromedio = document.getElementById('kpi-promedio');
    if (kpiPromedio) kpiPromedio.textContent = promedioGeneral.toFixed(1) + ' hrs';
    document.getElementById('kpi-promedio-diario').textContent = promedioDiario.toFixed(1) + ' hrs';
    document.getElementById('kpi-horas').textContent = Math.round(totalHorasRaw).toLocaleString() + ' hrs';
    document.getElementById('kpi-vdi').textContent = porcentajeVM.toFixed(1) + '%';


    // Ordenar por promedio de horas
    colegiosArray.sort((a, b) => b.avgHours - a.avgHours);

    // Filtrar los que tienen cero horas de los tops, pero mantenerlos en 'All'
    const colegiosConUso = colegiosArray.filter(c => c.avgHours > 0);
    const top5 = colegiosConUso.slice(0, 5);
    const bottom5 = colegiosConUso.slice().reverse().slice(0, 5);

    renderColegiosTable('tableTopColegios', top5, daysCount);
    renderColegiosTable('tableBottomColegios', bottom5, daysCount);

    // Renderizar Detalle de Todos los Colegios (Ordenado por mayor uso)
    renderColegiosTable('tableAllColegios', colegiosArray, daysCount);

    // Renderizar Gráfico
    renderComputeTypeChart(totalLocal, totalVM);

    // 3. Procesar Apps
    let appsArray = [];
    if (appsData && appsData.progams && appsData.usage) {
        for (let i = 0; i < appsData.progams.length; i++) {
            let name = appsData.progams[i];
            let hours = appsData.usage[i] || 0;
            appsArray.push({ name, hours });
        }
    }
    appsArray.sort((a, b) => b.hours - a.hours);
    renderAppsTable(appsArray.slice(0, 10), daysCount);

    // 4. Procesar Webs
    let websArray = Array.isArray(websiteData) ? websiteData : [];
    websArray.sort((a, b) => b.visits - a.visits);
    renderWebsTable(websArray.slice(0, 10), daysCount);
}

function renderColegiosTable(elementId, data, daysCount = 1) {
    const tbody = document.getElementById(elementId);
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay datos</td></tr>';
        return;
    }

    data.forEach(item => {
        const shortName = item.name.length > 35 ? item.name.substring(0, 32) + '...' : item.name;
        const displayAvg = item.avgHours > 0 && item.avgHours < 0.1 ? '< 0.1' : item.avgHours.toFixed(1);
        const dailyAvg = item.avgHours / daysCount;
        const displayDailyAvg = dailyAvg > 0 && dailyAvg < 0.1 ? '< 0.1' : dailyAvg.toFixed(1);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${shortName}</strong></td>
            <td style="text-align: center;"><span class="badge badge-cableados" title="Equipos Instalados">${item.installedCount}</span></td>
            <td><strong>${displayDailyAvg} hrs</strong></td>
            <td><strong>${displayAvg} hrs</strong></td>
            <td style="color: var(--text-muted);">${Math.round(item.totalHours).toLocaleString()} hrs</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAppsTable(data, daysCount = 1) {
    const tbody = document.getElementById('tableApps');
    tbody.innerHTML = '';
    data.forEach(item => {
        const dailyAvg = item.hours / daysCount;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td><span class="status-high">${Math.round(item.hours).toLocaleString()}</span> hrs</td>
            <td><span class="status-high">${dailyAvg.toFixed(1)}</span> hrs</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderWebsTable(data, daysCount = 1) {
    const tbody = document.getElementById('tableWebs');
    tbody.innerHTML = '';
    data.forEach(item => {
        const dailyAvg = item.visits / daysCount;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td><span class="status-high">${Math.round(item.visits).toLocaleString()}</span> hrs</td>
            <td><span class="status-high">${dailyAvg.toFixed(1)}</span> hrs</td>
        `;
        tbody.appendChild(tr);
    });
}

let computeChart = null;
function renderComputeTypeChart(totalLocal, totalVM) {
    const ctx = document.getElementById('computeTypeChart');
    if (!ctx) return;
    
    if (computeChart) computeChart.destroy();
    
    Chart.defaults.font.family = 'Outfit';
    
    computeChart = new Chart(ctx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Máquina Virtual (VDI)', 'Equipo Local'],
            datasets: [{
                data: [totalVM.toFixed(1), totalLocal.toFixed(1)],
                backgroundColor: ['rgba(138,43,226,0.7)', 'rgba(0,210,255,0.7)'],
                borderColor:     ['rgba(138,43,226,1)',   'rgba(0,210,255,1)'],
                borderWidth: 2, hoverOffset: 10, spacing: 4, borderRadius: 5,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { padding: 10, boxWidth: 12, boxHeight: 12, font: {size: 11} } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const total = ctx.dataset.data.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
                            const pct   = ((parseFloat(ctx.parsed) / total) * 100).toFixed(1);
                            return ` ${ctx.label}: ${ctx.parsed} hrs (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}
