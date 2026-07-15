// ============================================
// CONFIGURACIÓN Y API
// ============================================

const CONFIG = {
    API_BASE_URL: 'https://panel.qinaya.co/api2',
    PROXIES: [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?url='
    ],
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
        this.proxies  = config.PROXIES;
        this.headers  = config.HEADERS;
        this.timeout  = config.TIMEOUT;
        this.activeProxy = null;
    }

    async request(endpoint, params = {}) {
        const queryParts = Object.entries(params)
            .filter(([, v]) => v !== null && v !== undefined && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
        const qs  = queryParts.length ? '?' + queryParts.join('&') : '';
        const directUrl = this.baseURL + endpoint + qs;

        if (this.activeProxy) {
            return this._fetch(this.activeProxy + encodeURIComponent(directUrl));
        }

        try {
            const res = await this._fetch(directUrl);
            this.activeProxy = '';
            return res;
        } catch (err) {
            console.warn('[QinayaAPI] Directo falló, intentando por proxies CORS…');
            for (let proxy of this.proxies) {
                try {
                    const proxyUrl = proxy + encodeURIComponent(directUrl);
                    const proxyRes = await this._fetch(proxyUrl);
                    this.activeProxy = proxy;
                    return proxyRes;
                } catch (proxyErr) {
                    console.warn(`[QinayaAPI] Proxy falló (${proxy}):`, proxyErr.message);
                }
            }
            throw new Error('Todos los métodos de conexión fallaron.');
        }
    }

    async _fetch(url) {
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
            throw error;
        }
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

    let pcData, websiteData, usageData, appsData;

    try {
        // Ejecución secuencial para mayor estabilidad con el proxy CORS gratuito
        pcData = await api.getComputers(CONFIG.DEFAULT_ORG_ID, since, until);
        websiteData = await api.getWebsites(CONFIG.DEFAULT_ORG_ID, since, until);
        
        try {
            usageData = await api.request(CONFIG.ENDPOINTS.usage, { org: CONFIG.DEFAULT_ORG_ID, since, until });
        } catch (e) {
            console.warn("No se pudo cargar usageData", e);
            usageData = null;
        }

        try {
            appsData = await api.getApps(CONFIG.DEFAULT_ORG_ID, since, until);
        } catch (e) {
            console.warn("No se pudo cargar appsData", e);
            appsData = null;
        }
        
        if (!Array.isArray(pcData)) pcData = [];
        if (!Array.isArray(websiteData)) websiteData = [];
        
    } catch (e) {
        console.error("Fallo al conectar con la API:", e);
        pcData = [];
        websiteData = [];
        alert("Hubo un error al conectar con la base de datos. Por favor intenta de nuevo más tarde o verifica tu conexión.");
    }

    processReportData(pcData, websiteData, usageData, appsData);
    showLoading(false);
}

function processReportData(pcDataRaw, websiteData, usageData, appsData) {
    // 1. KPIs Globales
    const totalEquipos = pcDataRaw.length;
    let totalLocal = 0;
    let totalVM = 0;
    let totalHorasRaw = 0;
    
    const colegiosMap = new Map();

    pcDataRaw.forEach(pc => {
        const site = pc.site || 'Sin Asignar';
        
        totalLocal += pc.localHours || 0;
        totalVM += pc.vmHours || 0;
        totalHorasRaw += pc.totalHours || 0;
        
        // Agrupar por colegio
        if (!colegiosMap.has(site)) {
            colegiosMap.set(site, { name: site, count: 0, totalHours: 0, localHours: 0, vmHours: 0 });
        }
        const s = colegiosMap.get(site);
        s.count += 1;
        s.totalHours += (pc.totalHours || 0);
        s.localHours += (pc.localHours || 0);
        s.vmHours += (pc.vmHours || 0);
    });

    // 2. Procesar Colegios
    const colegiosArray = Array.from(colegiosMap.values()).map(c => {
        c.avgHours = c.count > 0 ? (c.totalHours / c.count) : 0;
        return c;
    });

    // Calcular promedio general total
    const promedioGeneral = totalEquipos > 0 ? (totalHorasRaw / totalEquipos) : 0;
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

    document.getElementById('kpi-equipos').textContent = totalEquipos.toLocaleString();
    document.getElementById('kpi-colegios').textContent = colegiosMap.size.toLocaleString();
    document.getElementById('kpi-promedio').textContent = promedioGeneral.toFixed(1) + ' hrs';
    document.getElementById('kpi-promedio-diario').textContent = promedioDiario.toFixed(1) + ' hrs';
    document.getElementById('kpi-horas').textContent = Math.round(totalHorasRaw).toLocaleString() + ' hrs';
    document.getElementById('kpi-vdi').textContent = porcentajeVM.toFixed(1) + '%';


    // Ordenar por promedio de horas
    colegiosArray.sort((a, b) => b.avgHours - a.avgHours);

    const top5 = colegiosArray.slice(0, 5);
    const bottom5 = colegiosArray.slice().reverse().slice(0, 5);

    renderColegiosTable('tableTopColegios', top5);
    renderColegiosTable('tableBottomColegios', bottom5);

    // Renderizar Detalle de Todos los Colegios (Ordenado por mayor uso)
    const allColegios = colegiosArray.slice().sort((a, b) => b.avgHours - a.avgHours);
    renderColegiosTable('tableAllColegios', allColegios);

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
    renderAppsTable(appsArray.slice(0, 10));

    // 4. Procesar Webs
    let websArray = Array.isArray(websiteData) ? websiteData : [];
    websArray.sort((a, b) => b.visits - a.visits);
    renderWebsTable(websArray.slice(0, 10));
}

function renderColegiosTable(elementId, data) {
    const tbody = document.getElementById(elementId);
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay datos</td></tr>';
        return;
    }

    data.forEach(item => {
        const shortName = item.name.length > 35 ? item.name.substring(0, 32) + '...' : item.name;
        const displayAvg = item.avgHours > 0 && item.avgHours < 0.1 ? '< 0.1' : item.avgHours.toFixed(1);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${shortName}</strong></td>
            <td style="text-align: center;"><span class="badge badge-cableados">${item.count}</span></td>
            <td><strong>${displayAvg} hrs</strong></td>
            <td style="color: var(--text-muted);">${Math.round(item.totalHours).toLocaleString()} hrs</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAppsTable(data) {
    const tbody = document.getElementById('tableApps');
    tbody.innerHTML = '';
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td><span class="status-high">${Math.round(item.hours).toLocaleString()}</span> hrs</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderWebsTable(data) {
    const tbody = document.getElementById('tableWebs');
    tbody.innerHTML = '';
    data.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.name}</strong></td>
            <td><span class="status-high">${Math.round(item.visits).toLocaleString()}</span> hrs</td>
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
