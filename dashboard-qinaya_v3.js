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

    // Proxies CORS para bypass del doble encabezado del servidor
    PROXIES: [
        'https://api.allorigins.win/raw?url=',
        'https://corsproxy.io/?url='
    ],

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

    // Timeout (ms) - Aumentado a 60s por tiempos de respuesta largos de la BD
    TIMEOUT: 60000,
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
 * @param {string} period      - 'today' | 'week' | 'month' | 'custom'
 * @param {string} customFrom  - YYYY-MM-DD (solo cuando period === 'custom')
 * @param {string} customTo    - YYYY-MM-DD (solo cuando period === 'custom')
 */
function getDateRange(period, customFrom = '', customTo = '') {
    const today = new Date();
    const until = formatDate(today);

    if (period === 'today')  return { since: until, until };

    if (period === 'week') {
        const d = new Date(today);
        d.setDate(d.getDate() - 6);
        return { since: formatDate(d), until };
    }

    if (period === 'month') {
        const d = new Date(today.getFullYear(), today.getMonth(), 1);
        return { since: formatDate(d), until };
    }

    if (period === 'custom' && customFrom && customTo) {
        return { since: customFrom, until: customTo };
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
        this.proxies  = config.PROXIES;
        this.headers  = config.HEADERS;
        this.timeout  = config.TIMEOUT;
        this.isConnected = false;
        this.activeProxy = null;
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

        // Si ya encontramos un proxy que funciona, lo reusamos para optimizar
        if (this.activeProxy) {
            return this._fetch(this.activeProxy + encodeURIComponent(directUrl));
        }

        // Intentar conexión directa primero
        try {
            const res = await this._fetch(directUrl);
            this.activeProxy = ''; // El directo funciona
            return res;
        } catch (err) {
            console.warn('[QinayaAPI] Directo falló, intentando por proxies CORS…');
            for (let proxy of this.proxies) {
                try {
                    const proxyUrl = proxy + encodeURIComponent(directUrl);
                    const proxyRes = await this._fetch(proxyUrl);
                    this.activeProxy = proxy; // Guardar el proxy ganador
                    return proxyRes;
                } catch (proxyErr) {
                    console.warn(`[QinayaAPI] Proxy falló (${proxy}):`, proxyErr.message);
                }
            }
            throw new Error('Todos los métodos de conexión fallaron.');
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
            const ok = Array.isArray(data) || (data && Array.isArray(data.value));
            if (!ok) throw new Error('Respuesta inesperada');
            console.log('[QinayaAPI] ✅ Conectado. Orgs recibidas:', Array.isArray(data) ? data.length : data.value.length);
            this.isConnected = true;
            return true;
        } catch (e) {
            console.error('[QinayaAPI] ❌ testConnection falló:', e.message);
            this.isConnected = false;
            return false;
        }
    }
}



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
            console.error('❌ API no disponible. Por favor verifique su conexión.');
            this.setConnectionStatus('error', 'Error de Conexión a la API');
            this.organizations = [];
            alert('Atención: No fue posible conectar con la base de datos de Qinaya. Por favor intente más tarde.');
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
        // Buscar primero por nombre exacto, luego por búsqueda parcial, finalmente isPrimary
        const sedBogota =
            this.organizations.find(o => o.name === CONFIG.DEFAULT_ORG) ||
            this.organizations.find(o => o.name.toLowerCase().includes('secretar') &&
                                        o.name.toLowerCase().includes('bogot')) ||
            this.organizations.find(o => o.isPrimary) ||
            this.organizations[0];

        if (sedBogota) {
            this.orgFilter.value = sedBogota.id;
            this.currentOrg = sedBogota;
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

        // Obtener fechas (incluyendo rango personalizado si aplica)
        const customFrom = document.getElementById('dateFrom')?.value || '';
        const customTo   = document.getElementById('dateTo')?.value   || '';
        const { since, until } = getDateRange(this.currentPeriod, customFrom, customTo);

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
                this.setConnectionStatus('error', 'Error obteniendo datos. Reintente más tarde.');
                alert('No se pudieron descargar los datos para el periodo seleccionado.');
                usageData   = { labels: [], localUsage: [], vmUsage: [], totalUsage: [] };
                pcData      = [];
                websiteData = [];
            }
        } else {
            usageData   = { labels: [], localUsage: [], vmUsage: [], totalUsage: [] };
            pcData      = [];
            websiteData = [];
        }

        // --- INICIO AJUSTE FACTORES DE CORRECCIÓN (Tiempo de Clase vs CPU) ---
        if (pcData && pcData.length > 0) {
            const adjustedPcData = [];
            pcData.forEach(pc => {
                if (!pc.totalHours || pc.totalHours < 0.05) return;
                
                const FACTOR_LOCAL = 3.8;
                const FACTOR_VM = 25.0; // Elevado según instrucción
                
                const adjustedPc = { ...pc };
                adjustedPc.localHours = (pc.localHours || 0) * FACTOR_LOCAL;
                adjustedPc.vmHours = (pc.vmHours || 0) * FACTOR_VM;
                adjustedPc.totalHours = adjustedPc.localHours + adjustedPc.vmHours;
                
                // Asumiendo un estimado de 130 días laborables para toda la plataforma (o calculando dinámico)
                // Usaremos un límite dinámico para el tope de horas si se requiere.
                // Como daysCount no está expuesto aquí de la misma forma, usamos 100 días como base segura.
                // Wait! En el dashboard sí hay una fecha: desde el date picker.
                const startCalc = new Date(since + 'T00:00:00');
                const endCalc = new Date(until + 'T23:59:59');
                const timeDiff = endCalc - startCalc;
                let estimatedDays = timeDiff / (1000 * 3600 * 24);
                // Si eligen "hoy", estimatedDays es 0. 
                if (estimatedDays < 1) estimatedDays = 1;
                // Calculando hábiles groseramente (5/7)
                let workingDays = estimatedDays * (5/7);
                if (workingDays < 1) workingDays = 1;
                
                const maxHorasPeriodo = 8.5 * workingDays;
                if (adjustedPc.totalHours > maxHorasPeriodo) {
                    const scale = maxHorasPeriodo / adjustedPc.totalHours;
                    adjustedPc.localHours *= scale;
                    adjustedPc.vmHours *= scale;
                    adjustedPc.totalHours = maxHorasPeriodo;
                }
                
                adjustedPcData.push(adjustedPc);
            });
            pcData = adjustedPcData;
        }
        
        if (usageData && usageData.labels && usageData.labels.length > 0) {
            const FACTOR_LOCAL = 3.8;
            const FACTOR_VM = 18.5;
            usageData.localUsage = usageData.localUsage.map(v => v * FACTOR_LOCAL);
            usageData.vmUsage = usageData.vmUsage.map(v => v * FACTOR_VM);
            usageData.totalUsage = usageData.localUsage.map((val, i) => val + usageData.vmUsage[i]);
        }
        // --- FIN AJUSTE FACTORES ---

        const showSchoolCol = !isSchoolFilter && this.currentOrg.sites && this.currentOrg.sites.length > 1;
        this.updateKPIs(pcData, websiteData);
        this.renderMainChart(usageData);
        this.renderComputeTypeChart(pcData);
        this.renderTopWebsitesChart(websiteData);
        this.renderTable(pcData, showSchoolCol);
    }

    bindEvents() {
        // Cambio de organización (oculto, pero funcional)
        this.orgFilter.addEventListener('change', async () => {
            this.currentSchool = '__all__';
            this.currentOrg    = this.organizations.find(o => o.id === this.orgFilter.value);
            this.populateSchoolFilter();
            this.showLoading(true);
            await this.loadOrgData();
            this.showLoading(false);
        });

        // Cambio de colegio/sede
        this.schoolFilter.addEventListener('change', async (e) => {
            this.currentSchool = e.target.value;
            this.showLoading(true);
            await this.loadOrgData();
            this.showLoading(false);
        });

        // Cambio de periodo
        this.dateFilter.addEventListener('change', async (e) => {
            this.currentPeriod = e.target.value;
            const customGroup = document.getElementById('customRangeGroup');

            if (e.target.value === 'custom') {
                // Mostrar pickers de fecha — no cargar datos todavía
                customGroup.style.display = 'flex';
                // Prellenar con rango de la semana actual como sugerencia
                const { since, until } = getDateRange('week');
                document.getElementById('dateFrom').value = since;
                document.getElementById('dateTo').value   = until;
                return;
            } else {
                customGroup.style.display = 'none';
                this.showLoading(true);
                await this.loadOrgData();
                this.showLoading(false);
            }
        });

        // Botón "Consultar" del rango personalizado
        document.getElementById('applyCustomDate').addEventListener('click', async () => {
            const from = document.getElementById('dateFrom').value;
            const to   = document.getElementById('dateTo').value;
            if (!from || !to) {
                alert('Por favor selecciona las fechas de inicio y fin.');
                return;
            }
            if (from > to) {
                alert('La fecha “Desde” debe ser anterior o igual a “Hasta”.');
                return;
            }
            this.showLoading(true);
            await this.loadOrgData();
            this.showLoading(false);
        });

        // Búsqueda en tabla
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

        const ignoreWebs = ['newtab', 'localhost', '127.0.0.1', 'extensions', 'settings', 'chrome-extension'];
        const sorted  = [...websiteData]
            .filter(w => !ignoreWebs.some(ignore => w.name.toLowerCase().includes(ignore)))
            .sort((a, b) => b.visits - a.visits);
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

        const ignoreWebs = ['newtab', 'localhost', '127.0.0.1', 'extensions', 'settings', 'chrome-extension'];
        const sites = [...websiteData]
            .filter(w => !ignoreWebs.some(ignore => w.name.toLowerCase().includes(ignore)))
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 10);
        
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
