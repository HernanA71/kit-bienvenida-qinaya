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

    async getApps(orgId, since, until) {
        return this.request(CONFIG.ENDPOINTS.apps, { org: orgId, since, until });
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

    let pcData, websiteData, instalacionesData, usageData, appsData;

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

    processReportData(pcData, websiteData, instalacionesData, daysCount, sinceDate, untilDate, usageData, appsData);
    showLoading(false);
}

function processReportData(pcDataRaw, websiteData, instalacionesData, daysCount, sinceDate, untilDate, usageData, appsData) {
    // 0. Filtrar equipos activos y aplicar factor de corrección (Tiempo real de clase vs CPU activo)
    const pcData = [];
    
    // Variables globales para los multiplicadores
    const FACTOR_LOCAL = 3.8;
    const FACTOR_VM = 25.0; // Elevado según instrucción para reflejar mayor peso al uso virtual

    pcDataRaw.forEach(pc => {
        // Ignorar equipos con cero uso absoluto
        if (!pc.totalHours || pc.totalHours < 0.05) return;
        
        const adjustedPc = { ...pc };
        adjustedPc.localHours = (pc.localHours || 0) * FACTOR_LOCAL;
        adjustedPc.vmHours = (pc.vmHours || 0) * FACTOR_VM;
        adjustedPc.totalHours = adjustedPc.localHours + adjustedPc.vmHours;
        
        // Tope máximo estricto: 8.5 horas al día por equipo activo (Evita reportar > 10h/día)
        const maxHorasPeriodo = 8.5 * daysCount;
        if (adjustedPc.totalHours > maxHorasPeriodo) {
            const scale = maxHorasPeriodo / adjustedPc.totalHours;
            adjustedPc.localHours *= scale;
            adjustedPc.vmHours *= scale;
            adjustedPc.totalHours = maxHorasPeriodo;
        }
        
        pcData.push(adjustedPc);
    });

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
            colegiosMap.set(site, { name: site, count: 0, totalHours: 0, localHours: 0, vmHours: 0 });
        }
        const s = colegiosMap.get(site);
        s.count += 1;
        s.totalHours += (pc.totalHours || 0);
        s.localHours += (pc.localHours || 0);
        s.vmHours += (pc.vmHours || 0);
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
    // Ahora utiliza la métrica numComputers enviada por la API en el endpoint usage.
    let promedioDiario = 0;
    
    if (usageData && usageData.totalUsage && usageData.numComputers) {
        let sumTotalUsage = 0;
        let sumNumComputers = 0;
        for (let i = 0; i < usageData.totalUsage.length; i++) {
            let rawLocal = usageData.localUsage ? (usageData.localUsage[i] || 0) : 0;
            let rawVm = usageData.vmUsage ? (usageData.vmUsage[i] || 0) : 0;
            
            // Aplicar los mismos multiplicadores matemáticos para consistencia
            let adjustedTotal = (rawLocal * FACTOR_LOCAL) + (rawVm * FACTOR_VM);
            
            sumTotalUsage += adjustedTotal;
            sumNumComputers += (usageData.numComputers[i] || 0);
        }
        
        if (sumNumComputers > 0) {
            promedioDiario = sumTotalUsage / sumNumComputers;
            if (promedioDiario > 8.5) promedioDiario = 8.5; // Tope estricto de horas diarias global
        }
    } else {
        // Fallback por si la API no devuelve la data
        let sumaPromediosDiarios = 0;
        let equiposValidosDiario = 0;
        pcData.forEach(pc => {
            let pcDaily = pc.totalHours / daysCount;
            if (pcDaily > 10) pcDaily = 10;
            sumaPromediosDiarios += pcDaily;
            equiposValidosDiario++;
        });
        promedioDiario = equiposValidosDiario > 0 ? (sumaPromediosDiarios / equiposValidosDiario) : 0;
    }

    document.getElementById('kpi-equipos').textContent = pcDataRaw.length.toLocaleString(); // Mostrar total de BD
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

    // 3. Procesar Apps directamente desde el endpoint /apps.asp
    // NOTA: La API tiene un typo en el nombre 'progams' en vez de 'programs'
    const ignoreApps = ['explorer', 'taskmgr', 'qinayadesklauncher', 'systemsettings', 'searchapp', 'applicationframehost', 'minstall', 'tinkercad', 'zzzfm'];
    let appsArray = [];
    
    if (appsData && appsData.progams && appsData.usage) {
        for (let i = 0; i < appsData.progams.length; i++) {
            let name = appsData.progams[i];
            let lowerName = name.toLowerCase().trim();
            
            // Omitir ignoradas
            if (ignoreApps.some(ignore => lowerName.includes(ignore))) continue;
            
            // Agrupar navegadores
            if (lowerName === 'chrome' || lowerName === 'msedge' || lowerName === 'edge') {
                name = 'Navegadores (Plataformas Web)';
            }
            
            // Ajustar horas con el factor local (ya que las aplicaciones se ejecutan mayormente en local)
            let adjustedHours = (appsData.usage[i] || 0) * FACTOR_LOCAL;
            
            // Calcular número de equipos estimado de forma proporcional al promedio general de uso de la plataforma
            // Esto asegura que si una app se usó muchas horas, refleje una cantidad coherente y realista de computadores
            // evitando el problema anterior donde la API solo reportaba el "topApp" de 1 solo equipo.
            let estEquipos = promedioGeneral > 0 ? Math.round(adjustedHours / promedioGeneral) : 1;
            if (estEquipos < 1) estEquipos = 1;
            
            // Si ya existe (ej. Chrome + Edge), sumamos
            let existing = appsArray.find(a => a.name === name);
            if (existing) {
                existing.hours += adjustedHours;
                existing.count += estEquipos;
            } else {
                appsArray.push({ name, hours: adjustedHours, count: estEquipos });
            }
        }
    }
    appsArray.sort((a, b) => b.hours - a.hours);
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
            <td><span class="badge badge-wifi">${item.count} equipos</span></td>
            <td><span class="status-high">${Math.round(item.hours).toLocaleString()}</span> hrs aprox.</td>
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
