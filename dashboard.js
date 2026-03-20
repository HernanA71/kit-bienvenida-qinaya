/*
    =========================================================
    Dashboard Analítico Qinaya — JavaScript
    =========================================================
    
    ARQUITECTURA:
    1. Intenta conectar a la API real de Qinaya
    2. Si la API no responde, usa datos DEMO para demostración
    3. Siempre arranca mostrando "Secretaría de Educación de Bogotá"
    4. El filtro se llena dinámicamente con TODOS los clientes de la API
    
    PARA CONECTAR LA API REAL:
    Solo cambia la variable API_BASE_URL y ajusta los endpoints
    según la documentación de la API de Qinaya.
    =========================================================
*/

// ============================================
// ⚙️ CONFIGURACIÓN DE LA API
// ============================================

const CONFIG = {
    // 🔧 CAMBIAR ESTA URL por la URL real de la API de Qinaya
    API_BASE_URL: 'https://api.qinaya.example.com/v1',

    // Endpoints esperados de la API
    ENDPOINTS: {
        organizations: '/organizations',       // Lista de clientes/organizaciones
        usage: '/usage',               // Datos de uso (horas local/virtual)
        computers: '/computers',           // Detalle por computador
        websites: '/websites',            // Top sitios web visitados
    },

    // Headers para autenticación (ajustar según la API)
    HEADERS: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer TU_TOKEN_AQUI',
    },

    // Organización que se muestra por defecto al abrir el dashboard
    DEFAULT_ORG: 'Secretaría de Educación de Bogotá',

    // Timeout para las peticiones (ms)
    TIMEOUT: 10000,
};


// ============================================
// 🌐 CAPA DE CONEXIÓN A LA API
// ============================================

class QinayaAPI {
    constructor(config) {
        this.baseURL = config.API_BASE_URL;
        this.headers = config.HEADERS;
        this.timeout = config.TIMEOUT;
        this.isConnected = false;
        this.usingDemo = false;
    }

    /**
     * Petición genérica a la API con timeout y manejo de errores
     */
    async request(endpoint, params = {}) {
        const url = new URL(this.baseURL + endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.headers,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Obtiene la lista de todas las organizaciones/clientes
     */
    async getOrganizations() {
        return this.request(CONFIG.ENDPOINTS.organizations);
    }

    /**
     * Obtiene datos de uso de una organización en un periodo
     */
    async getUsageData(orgId, days = 7) {
        return this.request(CONFIG.ENDPOINTS.usage, { org: orgId, days });
    }

    /**
     * Obtiene detalle de los computadores de una organización
     */
    async getComputers(orgId) {
        return this.request(CONFIG.ENDPOINTS.computers, { org: orgId });
    }

    /**
     * Obtiene los sitios web más visitados de una organización
     */
    async getWebsites(orgId) {
        return this.request(CONFIG.ENDPOINTS.websites, { org: orgId });
    }

    /**
     * Test de conexión a la API
     */
    async testConnection() {
        try {
            await this.request(CONFIG.ENDPOINTS.organizations);
            this.isConnected = true;
            this.usingDemo = false;
            return true;
        } catch (e) {
            this.isConnected = false;
            this.usingDemo = true;
            return false;
        }
    }
}


// ============================================
// 📦 DATOS DE DEMOSTRACIÓN (FALLBACK)
// ============================================
// Estos datos se usan cuando la API no está disponible.
// Simulan EXACTAMENTE la estructura que vendría de la API.

const DEMO_DATA = {
    organizations: [
        {
            id: 'sec-edu-bogota', name: 'Secretaría de Educación de Bogotá', pcsPerSite: 40, isPrimary: true,
            sites: [
                'Colegio Distrital Kennedy', 'Colegio Distrital Bosa', 'IE Simón Bolívar',
                'Colegio Distrital Suba', 'IE Antonio Nariño', 'Colegio Distrital Usaquén',
                'IE Rafael Uribe Uribe', 'Colegio San Cristóbal', 'IE Gustavo Restrepo',
                'Colegio Distrital Engativá', 'IE Nicolás Esguerra', 'Colegio Distrital Fontibón',
                'IE Francisco de Paula Santander', 'Colegio Distrital Teusaquillo',
                'IE Manuela Beltrán', 'Colegio Distrital Tunjuelito',
                'IE Julio Garavito Armero', 'Colegio Distrital Puente Aranda',
                'IE Agustín Fernández', 'Colegio Ciudad de Bogotá',
                'IE San José Norte', 'Colegio Distrital La Candelaria',
                'IE Rodrigo Lara Bonilla', 'Colegio Distrital Chapinero',
                'IE Juan Lozano y Lozano'
            ]
        },
        { id: 'apropiatics', name: 'ApropiaTICs', pcsPerSite: 20, sites: ['Sede Principal'] },
        { id: 'biblio-valle', name: 'Biblioteca Departamental del Valle', pcsPerSite: 50, sites: ['Sede Central Cali', 'Sede Norte', 'Sede Sur'] },
        { id: 'bolivar', name: 'Bolivar', pcsPerSite: 15, sites: ['Sede Cartagena'] },
        { id: 'celsia', name: 'Celsia Corp.', pcsPerSite: 30, sites: ['Sede Medellín', 'Sede Cali'] },
        { id: 'celsia-2', name: 'Celsia Corp. 2', pcsPerSite: 25, sites: ['Sede Barranquilla'] },
        { id: 'comfandi', name: 'Comfandi', pcsPerSite: 25, sites: ['Sede Palmira', 'Sede Yumbo', 'Sede Jamundí', 'Sede Tuluá'] },
        { id: 'comfandi-2', name: 'Comfandi 2', pcsPerSite: 20, sites: ['Sede Buenaventura'] },
        { id: 'creser-tec', name: 'CreSER Tec', pcsPerSite: 18, sites: ['Sede Principal'] },
        { id: 'florval', name: 'Florval', pcsPerSite: 12, sites: ['Sede Bogotá'] },
        { id: 'fund-bolivar', name: 'Fundación Bolivar', pcsPerSite: 22, sites: ['Sede Central'] },
        { id: 'gob-tolima', name: 'Gobernación Tolima', pcsPerSite: 30, sites: ['Sede Ibagué', 'Sede Melgar', 'Sede Espinal'] },
        { id: 'mil-programadores', name: 'Mil Programadores', pcsPerSite: 35, sites: ['Sede Bogotá', 'Sede Medellín'] },
        { id: 'palmipilos', name: 'Palmipilos', pcsPerSite: 15, sites: ['Sede Palmira'] },
        { id: 'pruebas', name: 'Pruebas', pcsPerSite: 10, sites: ['Laboratorio QA'] },
        { id: 'qinaya', name: 'Qinaya', pcsPerSite: 8, sites: ['Sede Interna'] },
        { id: 'santa-librada', name: 'Santa Librada', pcsPerSite: 40, sites: ['Sede Principal'] },
        { id: 'soc-port-cartagena', name: 'Sociedad Portuaria Cartagena', pcsPerSite: 28, sites: ['Sede Puerto'] },
        { id: 'univ-camacho', name: 'Universidad Camacho', pcsPerSite: 60, sites: ['Campus Principal', 'Campus Norte'] },
    ],

    // Función para generar datos de uso realistas
    generateUsage(orgId, days) {
        const labels = [];
        const localUsage = [];
        const vmUsage = [];
        const totalUsage = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' }));

            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const baseLocal = isWeekend ? 0.3 + Math.random() * 0.5 : 1.5 + Math.random() * 2.5;
            const baseVM = isWeekend ? 0.1 + Math.random() * 0.3 : 2.5 + Math.random() * 3;

            localUsage.push(parseFloat(baseLocal.toFixed(1)));
            vmUsage.push(parseFloat(baseVM.toFixed(1)));
            totalUsage.push(parseFloat((baseLocal + baseVM).toFixed(1)));
        }

        return { labels, localUsage, vmUsage, totalUsage };
    },

    // Función para generar datos de computadores
    generateComputers(count) {
        const pcs = [];
        const apps = [
            'Google Docs', 'Scratch', 'Khan Academy', 'YouTube Edu',
            'TinkerCAD', 'MakeCode', 'Canva', 'Office 365',
            'Colombia Aprende', 'Wikipedia', 'Duolingo', 'GeoGebra',
            'Zoom', 'Google Meet', 'Moodle', 'Edmodo'
        ];

        for (let i = 1; i <= count; i++) {
            const isOnline = Math.random() > 0.25;
            const localHrs = isOnline ? parseFloat((Math.random() * 5 + 0.5).toFixed(1)) : 0;
            const vmHrs = isOnline ? parseFloat((Math.random() * 6 + 1).toFixed(1)) : 0;

            pcs.push({
                id: `QPC-${String(i).padStart(3, '0')}`,
                status: isOnline ? 'online' : 'offline',
                localHours: localHrs,
                vmHours: vmHrs,
                totalHours: parseFloat((localHrs + vmHrs).toFixed(1)),
                topApp: apps[Math.floor(Math.random() * apps.length)]
            });
        }

        return pcs.sort((a, b) => b.totalHours - a.totalHours);
    },

    // Función para generar top websites
    generateWebsites() {
        return [
            { name: 'youtube.com', visits: 2800 + Math.floor(Math.random() * 600), category: 'General' },
            { name: 'docs.google.com', visits: 1900 + Math.floor(Math.random() * 400), category: 'Productividad' },
            { name: 'office.com', visits: 1500 + Math.floor(Math.random() * 400), category: 'Productividad' },
            { name: 'colombiaaprende.edu.co', visits: 1100 + Math.floor(Math.random() * 300), category: 'Educación' },
            { name: 'khanacademy.org', visits: 850 + Math.floor(Math.random() * 200), category: 'Educación' },
            { name: 'scratch.mit.edu', visits: 780 + Math.floor(Math.random() * 200), category: 'Educación' },
            { name: 'canva.com', visits: 650 + Math.floor(Math.random() * 150), category: 'Productividad' },
            { name: 'makecode.microbit.org', visits: 550 + Math.floor(Math.random() * 150), category: 'Educación' },
            { name: 'tinkercad.com', visits: 480 + Math.floor(Math.random() * 100), category: 'Educación' },
            { name: 'wikipedia.org', visits: 700 + Math.floor(Math.random() * 200), category: 'General' },
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
        this.api = new QinayaAPI(CONFIG);
        this.organizations = [];
        this.currentOrg = null;
        this.currentSchool = '__all__'; // '__all__' = vista general de toda la org
        this.currentDays = 7;

        // Instancias de gráficos (para poder destruirlas antes de redibujar)
        this.mainChart = null;
        this.computeChart = null;
        this.websitesChart = null;

        // Referencias al DOM
        this.orgFilter = document.getElementById('orgFilter');
        this.dateFilter = document.getElementById('dateFilter');
        this.searchInput = document.getElementById('searchPcInput');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.schoolFilterBar = document.getElementById('schoolFilterBar');
        this.schoolFilter = document.getElementById('schoolFilter');
        this.siteCountEl = document.getElementById('siteCount');
    }

    /**
     * Punto de entrada — se llama cuando el DOM está listo
     */
    async init() {
        this.showLoading(true);
        this.setConnectionStatus('connecting', 'Conectando a la API...');

        // 1. Intentar conectar a la API real
        const apiAvailable = await this.api.testConnection();

        if (apiAvailable) {
            // ✅ API real disponible
            console.log('✅ Conectado a la API real de Qinaya');
            this.setConnectionStatus('connected', 'Conectado a la API en tiempo real');
            this.organizations = await this.api.getOrganizations();
        } else {
            // ⚠️ API no disponible, usar demo
            console.warn('⚠️ API no disponible. Usando datos de demostración.');
            this.setConnectionStatus('demo', 'Modo Demo — datos simulados');
            this.organizations = DEMO_DATA.organizations;
        }

        // 2. Popular el filtro de organizaciones
        this.populateOrgFilter();

        // 3. Seleccionar la org por defecto (Secretaría de Educación)
        this.selectDefaultOrg();

        // 4. Actualizar sub-filtro de colegios
        this.populateSchoolFilter();

        // 5. Bindear eventos
        this.bindEvents();

        // 6. Cargar datos de la organización seleccionada
        await this.loadOrgData();

        this.showLoading(false);
    }

    /**
     * Llena el <select> de organizaciones dinámicamente desde la API
     */
    populateOrgFilter() {
        this.orgFilter.innerHTML = '';

        // Agrupar: primero la organización principal, luego el resto
        const primaryOrg = this.organizations.find(o => o.name === CONFIG.DEFAULT_ORG || o.isPrimary);
        const otherOrgs = this.organizations
            .filter(o => o !== primaryOrg)
            .sort((a, b) => a.name.localeCompare(b.name));

        // Opción de encabezado para la org principal
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

        // Separador y demás organizaciones
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

    /**
     * Selecciona Secretaría de Educación por defecto
     */
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

    /**
     * Muestra/oculta y rellena el sub-filtro de colegios
     */
    populateSchoolFilter() {
        const org = this.currentOrg;
        if (!org || !org.sites || org.sites.length <= 1) {
            // Org con 1 sola sede => ocultar sub-filtro
            this.schoolFilterBar.style.display = 'none';
            this.currentSchool = '__all__';
            return;
        }

        // Mostrar barra de sub-filtro
        this.schoolFilterBar.style.display = 'flex';
        this.siteCountEl.textContent = org.sites.length;

        // Popular el select
        this.schoolFilter.innerHTML = '';

        // Opción "Todos"
        const allOpt = document.createElement('option');
        allOpt.value = '__all__';
        allOpt.textContent = `📊 Todos los Colegios (${org.sites.length} sedes — Vista General)`;
        this.schoolFilter.appendChild(allOpt);

        // Cada colegio/sede
        org.sites.sort().forEach(site => {
            const opt = document.createElement('option');
            opt.value = site;
            opt.textContent = `🏫 ${site}`;
            this.schoolFilter.appendChild(opt);
        });

        this.schoolFilter.value = '__all__';
        this.currentSchool = '__all__';
    }

    /**
     * Carga todos los datos de la organización (y opcionalmente colegio) seleccionados
     */
    async loadOrgData() {
        const orgId = this.orgFilter.value;
        this.currentOrg = this.organizations.find(o => o.id === orgId);

        if (!this.currentOrg) return;

        const isSchoolFilter = this.currentSchool !== '__all__';
        let usageData, pcData, websiteData;

        if (this.api.isConnected) {
            // 🌐 Datos de la API real
            try {
                const params = { org: orgId, days: this.currentDays };
                if (isSchoolFilter) params.site = this.currentSchool;

                [usageData, pcData, websiteData] = await Promise.all([
                    this.api.getUsageData(orgId, this.currentDays),
                    this.api.getComputers(orgId),
                    this.api.getWebsites(orgId),
                ]);

                // Si estamos filtrando por colegio, filtrar los datos localmente
                // (o la API puede devolver datos filtrados directamente)
                if (isSchoolFilter && pcData) {
                    pcData = pcData.filter(pc => pc.site === this.currentSchool);
                }
            } catch (err) {
                console.error('Error cargando datos de la API:', err);
                this.setConnectionStatus('error', 'Error de conexión — reintentando...');
                usageData = DEMO_DATA.generateUsage(orgId, this.currentDays);
                pcData = this.getDemoPCData(isSchoolFilter);
                websiteData = DEMO_DATA.generateWebsites();
            }
        } else {
            // 📦 Datos de demostración
            usageData = DEMO_DATA.generateUsage(orgId, this.currentDays);
            pcData = this.getDemoPCData(isSchoolFilter);
            websiteData = DEMO_DATA.generateWebsites();
        }

        // Renderizar todo
        const showSchoolCol = !isSchoolFilter && this.currentOrg.sites && this.currentOrg.sites.length > 1;
        this.updateKPIs(pcData, websiteData);
        this.renderMainChart(usageData);
        this.renderComputeTypeChart(pcData);
        this.renderTopWebsitesChart(websiteData);
        this.renderTable(pcData, showSchoolCol);
    }

    /**
     * Genera datos demo de PCs, opcionalmente filtrados por colegio
     */
    getDemoPCData(isSchoolFilter) {
        const org = this.currentOrg;
        if (isSchoolFilter) {
            // Un colegio individual tiene ~pcsPerSite equipos
            const pcs = DEMO_DATA.generateComputers(org.pcsPerSite || 20);
            pcs.forEach(pc => pc.site = this.currentSchool);
            return pcs;
        } else {
            // Vista general: equipos de todas las sedes
            const sites = org.sites || ['Sede Principal'];
            const pcsPerSite = org.pcsPerSite || 20;
            let allPCs = [];
            sites.forEach(site => {
                const pcs = DEMO_DATA.generateComputers(pcsPerSite);
                pcs.forEach((pc, idx) => {
                    pc.site = site;
                    // Hacer IDs únicos por sede
                    const sitePrefix = site.substring(0, 3).toUpperCase().replace(/\s/g, '');
                    pc.id = `${sitePrefix}-${String(idx + 1).padStart(3, '0')}`;
                });
                allPCs = allPCs.concat(pcs);
            });
            return allPCs.sort((a, b) => b.totalHours - a.totalHours);
        }
    }

    /**
     * Bindea todos los eventos de filtros e interacción
     */
    bindEvents() {
        // Cambio de organización
        this.orgFilter.addEventListener('change', async () => {
            this.currentSchool = '__all__';
            this.currentOrg = this.organizations.find(o => o.id === this.orgFilter.value);
            this.populateSchoolFilter();
            this.showLoading(true);
            await this.loadOrgData();
            this.showLoading(false);
        });

        // Cambio de colegio/sede (sub-filtro)
        this.schoolFilter.addEventListener('change', async (e) => {
            this.currentSchool = e.target.value;
            this.showLoading(true);
            await this.loadOrgData();
            this.showLoading(false);
        });

        // Cambio de periodo
        this.dateFilter.addEventListener('change', async (e) => {
            switch (e.target.value) {
                case 'today': this.currentDays = 1; break;
                case 'week': this.currentDays = 7; break;
                case 'month': this.currentDays = 30; break;
                default: this.currentDays = 7;
            }
            this.showLoading(true);
            await this.loadOrgData();
            this.showLoading(false);
        });

        // Búsqueda en tabla
        this.searchInput.addEventListener('input', (e) => {
            const filter = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#tableBody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(filter) ? '' : 'none';
            });
        });
    }


    // ============================================
    // 📊 KPIs (Tarjetas de métricas)
    // ============================================
    updateKPIs(pcData, websiteData) {
        // Equipos registrados
        document.getElementById('kpi-total-pcs').textContent = pcData.length;

        // Promedio uso
        const activePCs = pcData.filter(pc => pc.status === 'online');
        const avgHrs = activePCs.length > 0
            ? (activePCs.reduce((sum, pc) => sum + pc.totalHours, 0) / activePCs.length).toFixed(1)
            : 0;
        document.getElementById('kpi-avg-hours').textContent = avgHrs + ' hrs';

        // % VM
        const totalLocal = pcData.reduce((sum, pc) => sum + pc.localHours, 0);
        const totalVM = pcData.reduce((sum, pc) => sum + pc.vmHours, 0);
        const vmPct = totalLocal + totalVM > 0
            ? Math.round((totalVM / (totalLocal + totalVM)) * 100) : 0;
        document.getElementById('kpi-vm-percent').textContent = vmPct + '%';

        // Top site
        const topSite = websiteData && websiteData.length > 0
            ? websiteData.sort((a, b) => b.visits - a.visits)[0]
            : { name: 'N/A' };
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
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#8a2be2',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                    },
                    {
                        label: 'Uso Local',
                        data: data.localUsage,
                        borderColor: '#00d2ff',
                        backgroundColor: gradientLocal,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#00d2ff',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                    },
                    {
                        label: 'Total Combinado',
                        data: data.totalUsage,
                        borderColor: '#00ff87',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Horas promedio por equipo', color: '#94a3b8' },
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                        ticks: { padding: 10 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { padding: 10 }
                    }
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

        const totalLocal = pcData.reduce((sum, pc) => sum + pc.localHours, 0);
        const totalVM = pcData.reduce((sum, pc) => sum + pc.vmHours, 0);

        this.computeChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Máquina Virtual (VDI)', 'Equipo Local'],
                datasets: [{
                    data: [totalVM.toFixed(1), totalLocal.toFixed(1)],
                    backgroundColor: ['rgba(138,43,226,0.7)', 'rgba(0,210,255,0.7)'],
                    borderColor: ['rgba(138,43,226,1)', 'rgba(0,210,255,1)'],
                    borderWidth: 2,
                    hoverOffset: 15,
                    spacing: 4,
                    borderRadius: 5,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { padding: 20, boxWidth: 14, boxHeight: 14, borderRadius: 4 }
                    },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => parseFloat(a) + parseFloat(b), 0);
                                const pct = ((parseFloat(ctx.parsed) / total) * 100).toFixed(0);
                                return ` ${ctx.label}: ${ctx.parsed} hrs (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }


    // ============================================
    // 📊 GRÁFICO BARRAS — Top Websites
    // ============================================
    renderTopWebsitesChart(websiteData) {
        const ctx = document.getElementById('topWebsitesChart').getContext('2d');
        if (this.websitesChart) this.websitesChart.destroy();

        const sites = websiteData.slice(0, 10);
        const labels = sites.map(s => s.name);
        const values = sites.map(s => s.visits);

        const categoryColors = {
            'Educación': { bg: 'rgba(0,255,135,0.7)', border: '#00ff87' },
            'Productividad': { bg: 'rgba(0,210,255,0.7)', border: '#00d2ff' },
            'General': { bg: 'rgba(255,140,0,0.7)', border: '#ff8c00' },
        };

        const colors = sites.map(s => (categoryColors[s.category] || categoryColors['General']).bg);
        const borders = sites.map(s => (categoryColors[s.category] || categoryColors['General']).border);

        this.websitesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Visitas',
                    data: values,
                    backgroundColor: colors,
                    borderColor: borders,
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.7,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
                        title: { display: true, text: 'Número de visitas', color: '#94a3b8' }
                    },
                    y: { grid: { display: false }, ticks: { font: { size: 11 } } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            afterLabel: (context) => {
                                const cat = sites[context.dataIndex]?.category || 'General';
                                const icon = cat === 'Educación' ? '📚' : cat === 'Productividad' ? '💼' : '🌐';
                                return `${icon} Categoría: ${cat}`;
                            }
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
        // Actualizar cabecera de la tabla según si mostramos columna de colegio
        const thead = document.querySelector('#dataTable thead tr');
        thead.innerHTML = `
            <th>ID del Equipo</th>
            ${showSchoolCol ? '<th>Colegio / Sede</th>' : ''}
            <th>Estado</th>
            <th>Uso Local (hrs)</th>
            <th>Uso Virtual (hrs)</th>
            <th>Total (hrs/sem)</th>
            <th>Top App</th>
        `;

        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';

        pcData.forEach(pc => {
            const row = document.createElement('tr');
            const statusCls = pc.status === 'online' ? 'status-online' : 'status-offline';
            const statusTxt = pc.status === 'online' ? '🟢 Activo' : '🔴 Inactivo';

            // Nombre corto del colegio para la tabla
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
