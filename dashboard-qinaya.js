/*
    =========================================================
    Dashboard Qinaya — PRODUCCIÓN (API Real)
    =========================================================

    ARQUITECTURA:
    1. Conecta directamente a la API real de Qinaya
    2. Si la API no responde, muestra datos DEMO como fallback
    3. Parámetros de fecha: since / until (formato YYYY-MM-DD)
    4. Endpoints en formato .asp (organizations.asp, usage.asp, etc.)

    API BASE: https://panel.qinaya.co/api2/
    =========================================================
*/

// ============================================
// ⚙️ CONFIGURACIÓN DE LA API
// ============================================

const CONFIG = {
    // ✅ URL real de la API de Qinaya
    API_BASE_URL: 'https://panel.qinaya.co/api2',

    // Proxy CORS temporal (se usa si el servidor tiene header duplicado)
    // Quitar cuando el desarrollador corrija Access-Control-Allow-Origin en el servidor
    CORS_PROXY: 'https://corsproxy.io/?url=',

    // Endpoints (archivos .asp)
    ENDPOINTS: {
        organizations: '/organizations.asp',
        usage:         '/usage.asp',
        computers:     '/computers.asp',
        websites:      '/websites.asp',
    },

    // Headers
    HEADERS: {
        'Accept': 'application/json',
    },

    // Organización que se muestra por defecto
    DEFAULT_ORG: 'Secretaría de Educación de Bogotá',

    // Timeout (ms)
    TIMEOUT: 15000,
};


// ============================================
// 📅 UTILIDADES DE FECHA
// ============================================

function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Calcula { since, until } a partir del período seleccionado
 * @param {string} period - 'today' | 'week' | 'month'
 */
function getDateRange(period) {
    const today = new Date();
    const until = formatDate(today);

    if (period === 'today') {
        return { since: until, until };
    }

    if (period === 'week') {
        const d = new Date(today);
        d.setDate(d.getDate() - 6);
        return { since: formatDate(d), until };
    }

    if (period === 'month') {
        const d = new Date(today.getFullYear(), today.getMonth(), 1);
        return { since: formatDate(d), until };
    }

    // Default: últimos 7 días
    const d = new Date(today);
    d.setDate(d.getDate() - 6);
    return { since: formatDate(d), until };
}


// ============================================
// 🌐 CAPA DE CONEXIÓN A LA API
// ============================================

class QinayaAPI {
    constructor(config) {
        this.baseURL  = config.API_BASE_URL;
        this.proxy    = config.CORS_PROXY;
        this.headers  = config.HEADERS;
        this.timeout  = config.TIMEOUT;
        this.isConnected = false;
        this.usingDemo   = false;
        this.useProxy    = false;   // se activa si el fetch directo falla por CORS
    }

    /**
     * Petición GET genérica — intenta directo, si falla por CORS usa proxy
     */
    async request(endpoint, params = {}) {
        const queryParts = Object.entries(params)
            .filter(([, v]) => v !== null && v !== undefined && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
        const qs  = queryParts.length ? '?' + queryParts.join('&') : '';
        const directUrl = this.baseURL + endpoint + qs;

        // Si ya sabemos que necesitamos proxy, ir directo al proxy
        if (this.useProxy) {
            return this._fetch(this.proxy + encodeURIComponent(directUrl));
        }

        // Intentar conexión directa primero
        try {
            return await this._fetch(directUrl);
        } catch (err) {
            console.warn('[QinayaAPI] Directo falló, intentando por proxy CORS…', err.message);
            this.useProxy = true;
            return this._fetch(this.proxy + encodeURIComponent(directUrl));
        }
    }

    /** Fetch interno con timeout */
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
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('[QinayaAPI] ❌ Error en:', url, '→', error.message);
            throw error;
        }
    }


    /** Lista de organizaciones/clientes */
    async getOrganizations() {
        const data = await this.request(CONFIG.ENDPOINTS.organizations);
        // La API devuelve { value: [...], Count: N } — normalizamos a array
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.value)) return data.value;
        return [];
    }

    /**
     * Histórico de uso
     * @param {string} orgId  - OrgId numérico
     * @param {string} since  - YYYY-MM-DD
     * @param {string} until  - YYYY-MM-DD
     * @param {string} site   - Nombre del colegio (opcional)
     */
    async getUsageData(orgId, since, until, site = '') {
        return this.request(CONFIG.ENDPOINTS.usage, { org: orgId, since, until, site });
    }

    /**
     * Detalle de equipos
     */
    async getComputers(orgId, since, until, site = '') {
        return this.request(CONFIG.ENDPOINTS.computers, { org: orgId, since, until, site });
    }

    /**
     * Top sitios web (en horas de uso)
     */
    async getWebsites(orgId, since, until, site = '') {
        return this.request(CONFIG.ENDPOINTS.websites, { org: orgId, since, until, site });
    }

    /** Test de conexión — verifica que la API responde JSON válido */
    async testConnection() {
        try {
            const data = await this.request(CONFIG.ENDPOINTS.organizations);
            // Aceptar tanto array directo como { value: [...] }
            const ok = Array.isArray(data) || (data && Array.isArray(data.value));
            if (!ok) throw new Error('Respuesta inesperada: ' + JSON.stringify(data).substring(0, 100));
            console.log('[QinayaAPI] ✅ Conectado. Orgs recibidas:', Array.isArray(data) ? data.length : data.value.length);
            this.isConnected = true;
            this.usingDemo = false;
            return true;
        } catch (e) {
            console.error('[QinayaAPI] ❌ testConnection falló:', e.message);
            this.isConnected = false;
            this.usingDemo = true;
            return false;
        }
    }
}


// ============================================
// 📦 DATOS DE DEMOSTRACIÓN (FALLBACK)
// ============================================
// Estructuras idénticas a las que devuelve la API real.

const DEMO_DATA = {
    organizations: [
        {
            id: '28',
            name: 'Secretaría de Educación de Bogotá',
            isPrimary: true,
            sites: [
                'Colegio Virginia Gutiérrez de Pineda',
                'Colegio El Salitre',
                'Colegio Los Comuneros',
            ]
        },
        { id: '31', name: 'Gobernación Tolima',    sites: ['Espinal', 'Suárez'] },
        { id: '5',  name: 'Comfandi',               sites: ['Sede Palmira', 'Sede Yumbo', 'Sede Jamundí'] },
        { id: '12', name: 'Celsia Corp.',            sites: ['Sede Medellín', 'Sede Cali'] },
        { id: '7',  name: 'CreSER Tec',              sites: ['Sede Principal'] },
    ],

    generateUsage(since, until) {
        const labels = [], localUsage = [], vmUsage = [], totalUsage = [];
        const start = new Date(since + 'T00:00:00');
        const end   = new Date(until + 'T00:00:00');

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            labels.push(d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }));
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            const loc  = isWeekend ? 200 + Math.random() * 300  : 2800 + Math.random() * 1500;
            const vm   = isWeekend ? 0                           : Math.random() * 200;
            localUsage.push(parseFloat(loc.toFixed(2)));
            vmUsage.push(parseFloat(vm.toFixed(2)));
            totalUsage.push(parseFloat((loc + vm).toFixed(2)));
        }
        return { labels, localUsage, vmUsage, totalUsage };
    },

    generateComputers(site = '') {
        const apps  = ['Chrome', 'QinayaDeskLauncher', 'Scratch', 'TinkerCAD', 'Google Docs', 'YouTube', 'Khan Academy', 'MakeCode'];
        const sites = site ? [site] : ['Colegio Virginia Gutiérrez de Pineda', 'Colegio El Salitre', 'Colegio Los Comuneros'];
        const pcs   = [];

        sites.forEach(s => {
            const count = 15 + Math.floor(Math.random() * 10);
            for (let i = 1; i <= count; i++) {
                const localHrs = parseFloat((40 + Math.random() * 60).toFixed(2));
                const vmHrs    = parseFloat((Math.random() * 30).toFixed(2));
                pcs.push({
                    id:         `RE0${500 + pcs.length + 1}`,
                    site:       s,
                    status:     'online',
                    localHours: localHrs,
                    vmHours:    vmHrs,
                    totalHours: parseFloat((localHrs + vmHrs).toFixed(2)),
                    topApp:     apps[Math.floor(Math.random() * apps.length)],
                });
            }
        });
        return pcs.sort((a, b) => b.totalHours - a.totalHours);
    },

    generateWebsites() {
        return [
            { name: 'www.google.com',          visits: parseFloat((900 + Math.random() * 200).toFixed(2)), category: 'General' },
            { name: 'www.youtube.com',          visits: parseFloat((800 + Math.random() * 200).toFixed(2)), category: 'General' },
            { name: 'www.tinkercad.com',        visits: parseFloat((750 + Math.random() * 150).toFixed(2)), category: 'General' },
            { name: 'docs.google.com',          visits: parseFloat((300 + Math.random() * 100).toFixed(2)), category: 'General' },
            { name: 'colombiaaprende.edu.co',   visits: parseFloat((200 + Math.random() *  80).toFixed(2)), category: 'General' },
            { name: 'scratch.mit.edu',          visits: parseFloat((180 + Math.random() *  60).toFixed(2)), category: 'General' },
            { name: 'makecode.microbit.org',    visits: parseFloat((150 + Math.random() *  50).toFixed(2)), category: 'General' },
            { name: 'khanacademy.org',          visits: parseFloat((120 + Math.random() *  40).toFixed(2)), category: 'General' },
        ].sort((a, b) => b.visits - a.visits);
    }
};


// ============================================
// 🎨 CONFIGURACIÓN GLOBAL DE CHART.JS
// ============================================
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = 'Outfit';
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.85)';
Chart.defaults.plugins.tooltip.cornerRadius = 10;
Chart.defaults.plugins.tooltip.padding = 12;


// ============================================
// 🚀 CONTROLADOR PRINCIPAL DEL DASHBOARD
// ============================================

class DashboardController {
    constructor() {
        this.api           = new QinayaAPI(CONFIG);
        this.organizations = [];
        this.currentOrg    = null;
        this.currentSchool = '__all__';
        this.currentPeriod = 'week';   // 'today' | 'week' | 'month'

        this.mainChart     = null;
        this.computeChart  = null;
        this.websitesChart = null;

        this.orgFilter       = document.getElementById('orgFilter');
        this.dateFilter      = document.getElementById('dateFilter');
        this.searchInput     = document.getElementById('searchPcInput');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.loadingOverlay  = document.getElementById('loadingOverlay');
        this.schoolFilterBar = document.getElementById('schoolFilterBar');
        this.schoolFilter    = document.getElementById('schoolFilter');
        this.siteCountEl     = document.getElementById('siteCount');
        this.dateRangeLabel  = document.getElementById('dateRangeLabel');
    }

    async init() {
        this.showLoading(true);
        this.setConnectionStatus('connecting', 'Conectando a la API de Qinaya...');

        const apiAvailable = await this.api.testConnection();

        if (apiAvailable) {
            console.log('✅ Conectado a la API real de Qinaya:', CONFIG.API_BASE_URL);
            this.setConnectionStatus('connected', 'Conectado — Datos en tiempo real');
            this.organizations = await this.api.getOrganizations();
        } else {
            console.warn('⚠️ API no disponible. Usando datos de demostración.');
            this.setConnectionStatus('demo', 'Modo Demo — datos simulados');
            this.organizations = DEMO_DATA.organizations;
        }

        this.populateOrgFilter();
        this.selectDefaultOrg();
        this.populateSchoolFilter();
        this.bindEvents();
        await this.loadOrgData();

        this.showLoading(false);
    }

    populateOrgFilter() {
        this.orgFilter.innerHTML = '';
        const primaryOrg = this.organizations.find(o => o.name === CONFIG.DEFAULT_ORG || o.isPrimary);
        const otherOrgs  = this.organizations
            .filter(o => o !== primaryOrg)
            .sort((a, b) => a.name.localeCompare(b.name));

        if (primaryOrg) {
            const optGroup = document.createElement('optgroup');
            optGroup.label = '⭐ Cliente Principal';
            const opt = document.createElement('option');
            opt.value = primaryOrg.id;
            opt.textContent = primaryOrg.name;
            opt.selected = true;
            optGroup.appendChild(opt);
            this.orgFilter.appendChild(optGroup);
        }

        if (otherOrgs.length > 0) {
            const optGroup = document.createElement('optgroup');
            optGroup.label = '📋 Todos los Clientes';
            otherOrgs.forEach(org => {
                const opt = document.createElement('option');
                opt.value = org.id;
                opt.textContent = org.name;
                optGroup.appendChild(opt);
            });
            this.orgFilter.appendChild(optGroup);
        }
    }

    selectDefaultOrg() {
        const defaultOrg = this.organizations.find(o => o.name === CONFIG.DEFAULT_ORG || o.isPrimary);
        if (defaultOrg) {
            this.orgFilter.value = defaultOrg.id;
            this.currentOrg = defaultOrg;
        } else if (this.organizations.length > 0) {
            this.orgFilter.value = this.organizations[0].id;
            this.currentOrg = this.organizations[0];
        }
    }

    populateSchoolFilter() {
        const org = this.currentOrg;
        if (!org || !org.sites || org.sites.length <= 1) {
            this.schoolFilterBar.style.display = 'none';
            this.currentSchool = '__all__';
            return;
        }

        this.schoolFilterBar.style.display = 'flex';
        this.siteCountEl.textContent = org.sites.length;

        this.schoolFilter.innerHTML = '';
        const allOpt = document.createElement('option');
        allOpt.value = '__all__';
        allOpt.textContent = `📊 Todos los Colegios (${org.sites.length} sedes — Vista General)`;
        this.schoolFilter.appendChild(allOpt);

        [...org.sites].sort().forEach(site => {
            const opt = document.createElement('option');
            opt.value = site;
            opt.textContent = `🏫 ${site}`;
            this.schoolFilter.appendChild(opt);
        });

        this.schoolFilter.value = '__all__';
        this.currentSchool = '__all__';
    }

    async loadOrgData() {
        const orgId = this.orgFilter.value;
        this.currentOrg = this.organizations.find(o => o.id === orgId);
        if (!this.currentOrg) return;

        const { since, until } = getDateRange(this.currentPeriod);

        // Actualizar etiqueta de rango de fechas
        if (this.dateRangeLabel) {
            this.dateRangeLabel.textContent = since === until
                ? since
                : `${since} → ${until}`;
        }

        const isSchoolFilter = this.currentSchool !== '__all__';
        const siteParam      = isSchoolFilter ? this.currentSchool : '';

        let usageData, pcData, websiteData;

        if (this.api.isConnected) {
            try {
                [usageData, pcData, websiteData] = await Promise.all([
                    this.api.getUsageData(orgId, since, until, siteParam),
                    this.api.getComputers(orgId, since, until, siteParam),
                    this.api.getWebsites(orgId, since, until, siteParam),
                ]);
            } catch (err) {
                console.error('Error cargando datos de la API:', err);
                this.setConnectionStatus('error', 'Error de conexión — mostrando datos demo');
                usageData   = DEMO_DATA.generateUsage(since, until);
                pcData      = DEMO_DATA.generateComputers(siteParam);
                websiteData = DEMO_DATA.generateWebsites();
            }
        } else {
            usageData   = DEMO_DATA.generateUsage(since, until);
            pcData      = DEMO_DATA.generateComputers(siteParam);
            websiteData = DEMO_DATA.generateWebsites();
        }

        const showSchoolCol = !isSchoolFilter && this.currentOrg.sites && this.currentOrg.sites.length > 1;
        this.updateKPIs(pcData, websiteData);
        this.renderMainChart(usageData);
        this.renderComputeTypeChart(pcData);
        this.renderTopWebsitesChart(websiteData);
        this.renderTable(pcData, showSchoolCol);
    }

    bindEvents() {
        this.orgFilter.addEventListener('change', async () => {
            this.currentSchool = '__all__';
            this.currentOrg    = this.organizations.find(o => o.id === this.orgFilter.value);
            this.populateSchoolFilter();
            this.showLoading(true);
            await this.loadOrgData();
            this.showLoading(false);
        });

        this.schoolFilter.addEventListener('change', async (e) => {
            this.currentSchool = e.target.value;
            this.showLoading(true);
            await this.loadOrgData();
            this.showLoading(false);
        });

        this.dateFilter.addEventListener('change', async (e) => {
            this.currentPeriod = e.target.value; // 'today' | 'week' | 'month'
            this.showLoading(true);
            await this.loadOrgData();
            this.showLoading(false);
        });

        this.searchInput.addEventListener('input', (e) => {
            const filter = e.target.value.toLowerCase();
            document.querySelectorAll('#tableBody tr').forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(filter) ? '' : 'none';
            });
        });
    }


    // ============================================
    // 📊 KPIs
    // ============================================
    updateKPIs(pcData, websiteData) {
        document.getElementById('kpi-total-pcs').textContent = pcData.length;

        const activePCs = pcData.filter(pc => pc.status === 'online');
        const avgHrs = activePCs.length > 0
            ? (activePCs.reduce((s, pc) => s + pc.totalHours, 0) / activePCs.length).toFixed(1)
            : 0;
        document.getElementById('kpi-avg-hours').textContent = avgHrs + ' hrs';

        const totalLocal = pcData.reduce((s, pc) => s + pc.localHours, 0);
        const totalVM    = pcData.reduce((s, pc) => s + pc.vmHours,    0);
        const vmPct = totalLocal + totalVM > 0
            ? Math.round((totalVM / (totalLocal + totalVM)) * 100) : 0;
        document.getElementById('kpi-vm-percent').textContent = vmPct + '%';

        const sorted  = [...websiteData].sort((a, b) => b.visits - a.visits);
        const topSite = sorted.length > 0 ? sorted[0] : { name: 'N/A' };
        document.getElementById('kpi-top-site').textContent = topSite.name;
    }


    // ============================================
    // 📈 GRÁFICO PRINCIPAL — Líneas de uso
    // ============================================
    renderMainChart(data) {
        const ctx = document.getElementById('mainUsageChart').getContext('2d');
        if (this.mainChart) this.mainChart.destroy();

        const gradientLocal = ctx.createLinearGradient(0, 0, 0, 300);
        gradientLocal.addColorStop(0, 'rgba(0, 210, 255, 0.3)');
        gradientLocal.addColorStop(1, 'rgba(0, 210, 255, 0.0)');

        const gradientVM = ctx.createLinearGradient(0, 0, 0, 300);
        gradientVM.addColorStop(0, 'rgba(138, 43, 226, 0.3)');
        gradientVM.addColorStop(1, 'rgba(138, 43, 226, 0.0)');

        this.mainChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Uso Virtual (VDI)',
                        data: data.vmUsage,
                        borderColor: '#8a2be2',
                        backgroundColor: gradientVM,
                        borderWidth: 3, fill: true, tension: 0.4,
                        pointBackgroundColor: '#8a2be2', pointBorderColor: '#fff',
                        pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 8,
                    },
                    {
                        label: 'Uso Local',
                        data: data.localUsage,
                        borderColor: '#00d2ff',
                        backgroundColor: gradientLocal,
                        borderWidth: 3, fill: true, tension: 0.4,
                        pointBackgroundColor: '#00d2ff', pointBorderColor: '#fff',
                        pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 8,
                    },
                    {
                        label: 'Total Combinado',
                        data: data.totalUsage,
                        borderColor: '#00ff87',
                        borderWidth: 2, borderDash: [5, 5],
                        fill: false, tension: 0.4,
                        pointRadius: 0, pointHoverRadius: 6,
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Horas de uso (acumulado)', color: '#94a3b8' },
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                        ticks: { padding: 10 }
                    },
                    x: { grid: { display: false }, ticks: { padding: 10 } }
                },
                plugins: {
                    legend: {
                        position: 'top', align: 'end',
                        labels: { padding: 20, boxWidth: 12, boxHeight: 12, borderRadius: 3 }
                    },
                    tooltip: {
                        callbacks: {
                            title: (items) => `📅 ${items[0].label}`,
                            label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} hrs`
                        }
                    }
                }
            }
        });
    }


    // ============================================
    // 🍩 GRÁFICO DONA — Local vs Virtual
    // ============================================
    renderComputeTypeChart(pcData) {
        const ctx = document.getElementById('computeTypeChart').getContext('2d');
        if (this.computeChart) this.computeChart.destroy();

        const totalLocal = pcData.reduce((s, pc) => s + pc.localHours, 0);
        const totalVM    = pcData.reduce((s, pc) => s + pc.vmHours,    0);

        this.computeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Máquina Virtual (VDI)', 'Equipo Local'],
                datasets: [{
                    data: [totalVM.toFixed(1), totalLocal.toFixed(1)],
                    backgroundColor: ['rgba(138,43,226,0.7)', 'rgba(0,210,255,0.7)'],
                    borderColor:     ['rgba(138,43,226,1)',   'rgba(0,210,255,1)'],
                    borderWidth: 2, hoverOffset: 15, spacing: 4, borderRadius: 5,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 20, boxWidth: 14, boxHeight: 14, borderRadius: 4 } },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
                                const pct   = ((parseFloat(ctx.parsed) / total) * 100).toFixed(0);
                                return ` ${ctx.label}: ${ctx.parsed} hrs (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }


    // ============================================
    // 📊 GRÁFICO BARRAS — Top Websites (en horas)
    // ============================================
    renderTopWebsitesChart(websiteData) {
        const ctx = document.getElementById('topWebsitesChart').getContext('2d');
        if (this.websitesChart) this.websitesChart.destroy();

        const sites  = [...websiteData].sort((a, b) => b.visits - a.visits).slice(0, 10);
        const labels = sites.map(s => s.name);
        const values = sites.map(s => s.visits);

        // Todos son "General" por ahora según la API
        const barColor    = 'rgba(255,140,0,0.75)';
        const borderColor = '#ff8c00';

        this.websitesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Horas de uso',
                    data: values,
                    backgroundColor: barColor,
                    borderColor: borderColor,
                    borderWidth: 1, borderRadius: 6, barPercentage: 0.7,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                        title: { display: true, text: 'Horas de uso acumuladas', color: '#94a3b8' }
                    },
                    y: { grid: { display: false }, ticks: { font: { size: 11 } } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => ` ${ctx.parsed.x} hrs de uso`,
                        }
                    }
                }
            }
        });
    }


    // ============================================
    // 📋 TABLA — Detalle por computador
    // ============================================
    renderTable(pcData, showSchoolCol = false) {
        const thead = document.querySelector('#dataTable thead tr');
        thead.innerHTML = `
            <th>ID del Equipo</th>
            ${showSchoolCol ? '<th>Colegio / Sede</th>' : ''}
            <th>Estado</th>
            <th>Uso Local (hrs)</th>
            <th>Uso Virtual (hrs)</th>
            <th>Total (hrs)</th>
            <th>Top App</th>
        `;

        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';

        pcData.forEach(pc => {
            const row       = document.createElement('tr');
            const statusCls = pc.status === 'online' ? 'status-online' : 'status-offline';
            const statusTxt = pc.status === 'online' ? '🟢 Activo'      : '🔴 Inactivo';
            const shortSite = pc.site ? (pc.site.length > 30 ? pc.site.substring(0, 28) + '…' : pc.site) : '';

            row.innerHTML = `
                <td><strong>${pc.id}</strong></td>
                ${showSchoolCol ? `<td title="${pc.site || ''}">${shortSite}</td>` : ''}
                <td><span class="status-badge ${statusCls}">${statusTxt}</span></td>
                <td>${pc.localHours} hrs</td>
                <td>${pc.vmHours} hrs</td>
                <td><strong>${pc.totalHours} hrs</strong></td>
                <td>${pc.topApp}</td>
            `;
            tbody.appendChild(row);
        });
    }


    // ============================================
    // 🔧 UTILIDADES DE UI
    // ============================================
    showLoading(visible) {
        if (visible) {
            this.loadingOverlay.classList.remove('hidden');
        } else {
            this.loadingOverlay.classList.add('hidden');
        }
    }

    setConnectionStatus(state, text) {
        this.connectionStatus.className = 'connection-status ' + state;
        this.connectionStatus.querySelector('.status-text').textContent = text;
    }
}


// ============================================
// 🏁 ARRANQUE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new DashboardController();
    dashboard.init();
});
