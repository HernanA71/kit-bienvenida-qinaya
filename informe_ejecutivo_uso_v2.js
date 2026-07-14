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

function getBusinessDays(startDate, endDate) {
    let count = 0;
    let curDate = new Date(startDate.getTime());
    
    // Vacaciones: Junio 16 a Julio 3 de 2026
    const vacacionInicio = new Date('2026-06-16T00:00:00');
    const vacacionFin = new Date('2026-07-03T23:59:59');

    while (curDate <= endDate) {
        const dayOfWeek = curDate.getDay();
        const enVacaciones = (curDate >= vacacionInicio && curDate <= vacacionFin);

        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !enVacaciones) { // Lunes a Viernes y no vacaciones
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
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
}

// Eliminado DEMO_DATA para mostrar solo datos reales

// ============================================
// LÓGICA DEL REPORTE
// ============================================

const api = new QinayaAPI(CONFIG);

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar fecha de hoy
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('fecha-hoy').textContent = new Date().toLocaleDateString('es-ES', options);

    // Configurar selectores de fecha por defecto
    // Para que muestre todos los datos iniciales, pondremos desde el inicio del proyecto (marzo 2026)
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

    let pcData, websiteData, instalacionesData;

    try {
        // Ejecución secuencial para mayor estabilidad con el proxy CORS gratuito
        pcData = await api.getComputers(CONFIG.DEFAULT_ORG_ID, since, until);
        websiteData = await api.getWebsites(CONFIG.DEFAULT_ORG_ID, since, until);
        
        try {
            const res = await fetch(CONFIG.INSTALACIONES_SHEET_URL);
            instalacionesData = await res.json();
        } catch (e) {
            console.warn("No se pudo cargar hoja de instalaciones", e);
            instalacionesData = [];
        }
        
        if (!Array.isArray(pcData)) pcData = [];
        if (!Array.isArray(websiteData)) websiteData = [];
        
    } catch (e) {
        console.error("Fallo al conectar con la API:", e);
        pcData = [];
        websiteData = [];
        alert("Hubo un error al conectar con la base de datos. Por favor intenta de nuevo más tarde o verifica tu conexión.");
    }

    const sinceDate = new Date(since + 'T00:00:00');
    const untilDate = new Date(until + 'T23:59:59');
    
    // Calcular solo días hábiles (lunes a viernes) escolares
    let daysCount = getBusinessDays(sinceDate, untilDate);
    if (daysCount < 1 || isNaN(daysCount)) daysCount = 1;

    processReportData(pcData, websiteData, instalacionesData, daysCount, sinceDate, untilDate);
    showLoading(false);
}

function processReportData(pcData, websiteData, instalacionesData, daysCount, sinceDate, untilDate) {
    // 1. KPIs Globales
    const totalEquipos = pcData.length;
    let totalLocal = 0;
    let totalVM = 0;
    
    const colegiosMap = new Map();
    const appsMap = new Map();

    pcData.forEach(pc => {
        const site = pc.site || 'Sin Asignar';
        
        // Excluir colegios de prueba o demostración
        if (site === 'Colegio La Bici') return;

        totalLocal += pc.localHours || 0;
        totalVM += pc.vmHours || 0;
        
        // Agrupar por colegio
        if (!colegiosMap.has(site)) {
            colegiosMap.set(site, { name: site, count: 0, totalHours: 0 });
        }
        const colData = colegiosMap.get(site);
        colData.count += 1;
        colData.totalHours += pc.totalHours || 0;
        
        // Agrupar por App
        const app = pc.topApp || 'N/A';
        if (app !== 'N/A' && app !== '') {
            appsMap.set(app, (appsMap.get(app) || 0) + 1);
        }
    });

    // 2. Procesar Colegios para obtener promedios por colegio primero
    const mapInstalaciones = new Map();
    if (Array.isArray(instalacionesData)) {
        instalacionesData.forEach(row => {
            if (row.colegio && row["fecha de instalación"]) {
                mapInstalaciones.set(row.colegio.toLowerCase().trim(), new Date(row["fecha de instalación"]));
            }
        });
    }

    const colegiosArray = Array.from(colegiosMap.values()).map(c => {
        c.avgHours = c.count > 0 ? (c.totalHours / c.count) : 0;
        
        // Buscar si el colegio tiene una fecha de instalación específica
        let schoolDaysCount = daysCount;
        const nombreBuscado = c.name.toLowerCase().trim();
        let fechaInst = mapInstalaciones.get(nombreBuscado);
        
        if (!fechaInst) {
            // Intentar búsqueda parcial si no hay coincidencia exacta
            for (let [key, val] of mapInstalaciones.entries()) {
                if (nombreBuscado.includes(key) || key.includes(nombreBuscado)) {
                    fechaInst = val;
                    break;
                }
            }
        }
        
        if (fechaInst) {
            // Si la fecha de instalación es posterior al inicio del reporte, contamos desde instalación
            const startCalcDate = fechaInst > sinceDate ? fechaInst : sinceDate;
            schoolDaysCount = getBusinessDays(startCalcDate, untilDate);
            if (schoolDaysCount < 1) schoolDaysCount = 1;
        }

        c.avgDailyHours = c.avgHours / schoolDaysCount;
        return c;
    });

    // Calcular promedio general total
    const totalHorasRaw = totalLocal + totalVM;
    const promedioGeneral = totalEquipos > 0 ? (totalHorasRaw / totalEquipos) : 0;
    const porcentajeVM = totalHorasRaw > 0 ? ((totalVM / totalHorasRaw) * 100) : 0;

    // Calcular Promedio Diario EFECTIVO
    // Ajustado a la cantidad de PCs activos y con un tope de 10 horas/día 
    // para evitar que equipos dejados encendidos distorsionen la media.
    let sumaPromediosDiarios = 0;
    pcData.forEach(pc => {
        let pcDaily = pc.totalHours / daysCount;
        if (pcDaily > 10) pcDaily = 10;
        sumaPromediosDiarios += pcDaily;
    });
    
    let promedioDiario = totalEquipos > 0 ? (sumaPromediosDiarios / totalEquipos) : 0;

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

    // Renderizar Detalle de Todos los Colegios (Ordenado Alfabéticamente)
    const allColegios = colegiosArray.slice().sort((a, b) => a.name.localeCompare(b.name));
    renderColegiosTable('tableAllColegios', allColegios);

    // Renderizar Gráfico
    renderComputeTypeChart(totalLocal, totalVM);

    // 3. Procesar Apps (Filtrando sistema)
    const ignoreApps = ['chrome', 'msedge', 'explorer', 'taskmgr', 'qinayadesklauncher', 'systemsettings', 'searchapp', 'applicationframehost', 'minstall'];
    let appsArray = Array.from(appsMap.entries()).map(([name, count]) => ({ name, count }));
    appsArray = appsArray.filter(a => {
        const appName = a.name.toLowerCase();
        return !ignoreApps.some(ignore => appName.includes(ignore));
    });
    appsArray.sort((a, b) => b.count - a.count);
    renderAppsTable(appsArray.slice(0, 10));

    // 4. Procesar Webs (Filtrando sistema y newtab)
    const ignoreWebs = ['newtab', 'localhost', '127.0.0.1', 'extensions', 'settings', 'chrome-extension'];
    let websArray = Array.isArray(websiteData) ? websiteData : [];
    websArray = websArray.filter(w => {
        const url = w.name.toLowerCase();
        return !ignoreWebs.some(ignore => url.includes(ignore));
    });
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
        const displayDaily = item.avgDailyHours > 0 && item.avgDailyHours < 0.1 ? '< 0.1' : item.avgDailyHours.toFixed(1);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${shortName}</strong></td>
            <td style="text-align: center;"><span class="badge badge-cableados">${item.count}</span></td>
            <td><strong>${displayAvg} hrs</strong></td>
            <td><strong style="color: #ea580c;">${displayDaily} hrs</strong></td>
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
            <td><span class="badge badge-wifi">${item.count} equipos</span> la tienen como principal</td>
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
            <td><span class="status-high">${Math.round(item.visits).toLocaleString()}</span> hrs aprox.</td>
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
