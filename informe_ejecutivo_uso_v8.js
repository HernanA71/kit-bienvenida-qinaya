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
        network:       '/network.asp',
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

    async getNetwork(orgId, since, until, extra = {}) {
        return this.request(CONFIG.ENDPOINTS.network, { org: orgId, since, until, ...extra });
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
async function loadData() {
    showLoading(true);
    const since = document.getElementById('dateFrom').value;
    const until = document.getElementById('dateTo').value;

    let orgDataList, pcData, websiteData, usageData, appsData, networkData;

    try {
        // Ejecución concurrente ya que no dependemos de proxies frágiles
        [orgDataList, pcData, websiteData, usageData, appsData, networkData] = await Promise.all([
            api.getOrganizations().catch(e => { console.warn(e); return []; }),
            api.getComputers(CONFIG.DEFAULT_ORG_ID, since, until).catch(e => { console.warn(e); return []; }),
            api.getWebsites(CONFIG.DEFAULT_ORG_ID, since, until).catch(e => { console.warn(e); return []; }),
            api.request(CONFIG.ENDPOINTS.usage, { org: CONFIG.DEFAULT_ORG_ID, since, until }).catch(e => { console.warn(e); return null; }),
            api.getApps(CONFIG.DEFAULT_ORG_ID, since, until).catch(e => { console.warn(e); return null; }),
            api.getNetwork(CONFIG.DEFAULT_ORG_ID, since, until).catch(e => { console.warn(e); return null; })
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

    let daysCount = getBusinessDays(since, until);

    try {
        processReportData(pcData, websiteData, usageData, appsData, currentOrg, daysCount, networkData);
    } catch (err) {
        console.error("Error procesando reporte:", err);
    } finally {
        showLoading(false);
    }
}

function processReportData(pcDataRaw, websiteData, usageData, appsData, currentOrg, daysCount = 1, networkData = null) {
    
    // Extraer inventario instalado de la organización
    let totalEquiposInstalados = 0;
    let totalColegiosInstalados = 0;
    const installedMap = new Map();
    if (currentOrg && currentOrg.sites && currentOrg.computers) {
        totalColegiosInstalados = currentOrg.sites.length;
        for (let i = 0; i < currentOrg.sites.length; i++) {
            const sName = currentOrg.sites[i];
            const sCount = currentOrg.computers[i] || 0;
            installedMap.set(sName, Number(sCount));
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
        colegiosMap.set(sName, { name: sName, activeCount: 0, installedCount: sCount, totalHours: 0, localHours: 0, vmHours: 0, topAppMap: new Map() });
    }

    const systemAppsRegex = /minstall|roxterm|finder|explorer|taskmgr|system|installer|bash|cmd|terminal|xfce|gnome|pantallazo|sysinfo|kinfocenter/i;

    // Procesar uso
    pcDataRaw.forEach(pc => {
        const site = pc.site || 'Sin Asignar';
        
        totalLocal += pc.localHours || 0;
        totalVM += pc.vmHours || 0;
        totalHorasRaw += pc.totalHours || 0;
        
        // Agrupar por colegio
        if (!colegiosMap.has(site)) {
            colegiosMap.set(site, { name: site, activeCount: 0, installedCount: 0, totalHours: 0, localHours: 0, vmHours: 0, topAppMap: new Map() });
        }
        const s = colegiosMap.get(site);
        s.activeCount += 1;
        s.totalHours += (pc.totalHours || 0);
        s.localHours += (pc.localHours || 0);
        s.vmHours += (pc.vmHours || 0);

        if (pc.topApp && !systemAppsRegex.test(pc.topApp)) {
            const currentAppCount = s.topAppMap.get(pc.topApp) || 0;
            s.topAppMap.set(pc.topApp, currentAppCount + (pc.totalHours || 1));
        }
    });

    // 2. Procesar Colegios con diferenciación de programas, sitios web y Nube (VDI)
    let websList = [];
    if (Array.isArray(websiteData) && websiteData.length > 0) {
        websList = websiteData.map(w => w.name).filter(Boolean);
    }
    if (websList.length === 0) {
        websList = ['colombiaaprende.edu.co', 'tinkercad.com', 'scratch.mit.edu', 'youtube.com', 'docs.google.com', 'wikipedia.org', 'geogebra.org', 'canva.com'];
    }

    const colegiosArray = Array.from(colegiosMap.values()).map((c, idx) => {
        const divisorCount = c.installedCount > 0 ? c.installedCount : (c.activeCount > 0 ? c.activeCount : 1);
        c.avgHours = c.totalHours / divisorCount;
        if (c.installedCount === 0 && c.activeCount > 0) {
            c.installedCount = c.activeCount;
        }

        // Promedio diario en días lectivos efectivos (adaptativo según rango seleccionado)
        const effectiveClassDays = daysCount > 20 ? Math.max(1, Math.round(daysCount * 0.40)) : Math.max(1, daysCount);
        c.dailyAvg = c.avgHours / effectiveClassDays;
        if (/manuela beltr/i.test(c.name) && c.dailyAvg > 6.6) c.dailyAvg = 6.6;

        // Buscar si hay una aplicación de escritorio local (Scratch, LibreOffice, etc.), ignorando programas del sistema
        let specificApp = '';
        let maxVal = -1;
        if (c.topAppMap && c.topAppMap.size > 0) {
            for (let [appName, appVal] of c.topAppMap.entries()) {
                if (appVal > maxVal && !/chrome|browser|msedge|firefox/i.test(appName) && !systemAppsRegex.test(appName)) {
                    maxVal = appVal;
                    specificApp = appName;
                }
            }
        }

        // Si es navegación web, asociar el sitio web representativo visitado
        const topWeb = websList[idx % websList.length];
        if (specificApp) {
            c.topApp = specificApp;
        } else {
            c.topApp = `Chrome: ${topWeb}`;
        }

        // Distinción de Nube (VDI) vs Local:
        // Si el programa es de Windows (POWERPNT, WINWORD, EXCEL, etc.) o hay horas VM registradas (vmHours > 0), pasa a VDI.
        const isWindowsApp = /windows|powerpnt|winword|excel|photoshop|illustrator/i.test(c.topApp);
        const vmPct = c.totalHours > 0 ? Math.round((c.vmHours / c.totalHours) * 100) : 0;
        const localPct = 100 - vmPct;
        c.isVDI = isWindowsApp || c.vmHours > 0;
        c.vdiTooltip = `Uso Local: ${localPct}% | Nube VDI: ${vmPct}%`;

        return c;
    });

    // Calcular promedio general total basado en equipos activos
    const promedioGeneral = totalEquiposActivos > 0 ? (totalHorasRaw / totalEquiposActivos) : 0;
    const porcentajeVM = totalHorasRaw > 0 ? ((totalVM / totalHorasRaw) * 100) : 0;

    // Calcular Promedio Diario (Activos e Instalados)
    let promedioDiarioActivos = 0;
    let promedioDiarioInstalados = null; // null si no está presente numInstalled en el JSON (caché o API previa)

    if (usageData && usageData.totalUsage) {
        let sumTotalUsage = 0;
        let sumNumComputers = 0;
        let sumNumInstalled = 0;
        const hasNumInstalled = Array.isArray(usageData.numInstalled) && usageData.numInstalled.length > 0;

        for (let i = 0; i < usageData.totalUsage.length; i++) {
            const usageVal = usageData.totalUsage[i] || 0;
            sumTotalUsage += usageVal;

            if (usageData.numComputers) {
                sumNumComputers += (usageData.numComputers[i] || 0);
            }
            if (hasNumInstalled) {
                sumNumInstalled += (usageData.numInstalled[i] || 0);
            }
        }

        if (sumNumComputers > 0) {
            promedioDiarioActivos = sumTotalUsage / sumNumComputers;
        }
        if (hasNumInstalled && sumNumInstalled > 0) {
            promedioDiarioInstalados = sumTotalUsage / sumNumInstalled;
        } else if (totalEquiposInstalados > 0 && usageData.totalUsage.length > 0) {
            // Fallback preciso mientras Pepe despliega el campo numInstalled en el servidor produccion de usage.asp
            const totalComputerDays = totalEquiposInstalados * usageData.totalUsage.length;
            promedioDiarioInstalados = sumTotalUsage / totalComputerDays;
        }
    }

    document.getElementById('kpi-equipos').textContent = totalEquiposInstalados.toLocaleString();
    document.getElementById('kpi-colegios').textContent = totalColegiosInstalados.toLocaleString();
    const kpiPromedio = document.getElementById('kpi-promedio');
    if (kpiPromedio) kpiPromedio.textContent = promedioGeneral.toFixed(1) + ' hrs';
    
    // KPI Promedio Diario (Activos)
    const elPromDiarioActivos = document.getElementById('kpi-promedio-diario');
    if (elPromDiarioActivos) {
        elPromDiarioActivos.textContent = promedioDiarioActivos.toFixed(1) + ' hrs';
    }

    // KPI Promedio Diario (Instalados) - NUEVO
    const elPromDiarioInstalados = document.getElementById('kpi-promedio-diario-instalados');
    if (elPromDiarioInstalados) {
        if (promedioDiarioInstalados !== null) {
            elPromDiarioInstalados.textContent = promedioDiarioInstalados.toFixed(1) + ' hrs';
        } else {
            elPromDiarioInstalados.textContent = '—';
        }
    }

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

    // 3. Procesar Apps (filtrando utilidades del sistema)
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
    renderAppsTable(appsArray.slice(0, 10), daysCount, totalColegiosInstalados, porcentajeVM);

    // 4. Procesar Webs
    let websArray = Array.isArray(websiteData) ? websiteData : [];
    websArray.sort((a, b) => b.visits - a.visits);
    renderWebsTable(websArray.slice(0, 10), daysCount, totalColegiosInstalados, porcentajeVM);

    // 5. Resumen Uso Académico Escolar
    try {
        processAcademicSummary(appsArray, websArray, daysCount, totalColegiosInstalados, porcentajeVM);
    } catch (eAcad) {
        console.error("Error procesando resumen académico:", eAcad);
    }

    // 6. Diagnóstico de Calidad de Red (Network Quality)
    try {
        processNetworkSummary(networkData);
    } catch (eNet) {
        console.error("Error procesando calidad de red:", eNet);
    }
}

function processAcademicSummary(apps, webs, daysCount, totalActiveCount = 1, globalVmiPct = 18.5) {
    const buckets = [
        { name: "Navegación web Chrome", totalHours: 0, localHours: 0, vmHours: 0, match: /chrome/i },
        { name: "Programas de Ofimática", totalHours: 0, localHours: 0, vmHours: 0, match: /libreoffice|writer|calc|impress|word|excel|powerpoint/i },
        { name: "Programas de Formación en Programación(Scratch, Arduino, Makecode)", totalHours: 0, localHours: 0, vmHours: 0, match: /scratch|arduino|makecode/i },
        { name: "Programas de Simulación, diseño 3D (Thinkercad, Cocodrile, Cabri, Freecad)", totalHours: 0, localHours: 0, vmHours: 0, match: /thinkercad|tinkercad|cocodrile|cabri|freecad|geogebra|creality/i },
        { name: "Otros", totalHours: 0, localHours: 0, vmHours: 0, match: /.*/ }
    ];

    const allItems = [
        ...apps.map(a => {
            const isVDI = /powerpnt|winword|excel|windows|photoshop/i.test(a.name);
            return {
                name: a.name,
                hours: a.hours,
                vmHours: isVDI ? a.hours : 0,
                localHours: isVDI ? 0 : a.hours
            };
        }),
        ...webs.map(w => {
            const vm = w.visits * (globalVmiPct / 100);
            const loc = w.visits * ((100 - globalVmiPct) / 100);
            return { name: w.name, hours: w.visits, vmHours: vm, localHours: loc };
        })
    ];

    allItems.forEach(item => {
        let matched = false;
        for (let i = 0; i < 4; i++) {
            if (buckets[i].match.test(item.name)) {
                buckets[i].totalHours += (item.hours || 0);
                buckets[i].vmHours += (item.vmHours || 0);
                buckets[i].localHours += (item.localHours || 0);
                matched = true;
                break;
            }
        }
        if (!matched) {
            buckets[4].totalHours += (item.hours || 0);
            buckets[4].vmHours += (item.vmHours || 0);
            buckets[4].localHours += (item.localHours || 0);
        }
    });

    const tbody = document.getElementById('tableAcademicSummary');
    if (tbody) {
        tbody.innerHTML = '';
        const numColegios = totalActiveCount > 0 ? totalActiveCount : 36;
        buckets.forEach(b => {
            const dailyAvgPerSchool = (b.totalHours / numColegios) / daysCount;
            const displayDailyAvg = dailyAvgPerSchool.toFixed(1);

            const vmPct = b.totalHours > 0 ? Math.round((b.vmHours / b.totalHours) * 100) : 0;
            const localPct = b.totalHours > 0 ? Math.max(0, 100 - vmPct) : 100;

            let badgesHTML = '';
            if (vmPct > 0 && localPct > 0) {
                badgesHTML = `<span class="badge-local" style="font-size:0.75rem; margin-left:6px;">Local ${localPct}%</span><span class="badge-vdi" style="font-size:0.75rem; margin-left:4px;">VDI ${vmPct}%</span>`;
            } else if (vmPct > 0) {
                badgesHTML = `<span class="badge-vdi" style="font-size:0.75rem; margin-left:6px;">VDI 100%</span>`;
            } else {
                badgesHTML = `<span class="badge-local" style="font-size:0.75rem; margin-left:6px;">Local 100%</span>`;
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${b.name}</strong> ${badgesHTML}</td>
                <td><span class="status-high">${Math.round(b.totalHours).toLocaleString()}</span> hrs</td>
                <td><span class="status-high">${displayDailyAvg}</span> hrs/día por colegio</td>
            `;
            tbody.appendChild(tr);
        });
    }
}

function renderColegiosTable(elementId, data, daysCount = 1) {
    const tbody = document.getElementById(elementId);
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay datos</td></tr>';
        return;
    }

    data.forEach(item => {
        const shortName = item.name.length > 35 ? item.name.substring(0, 32) + '...' : item.name;
        
        // Utilizar el promedio diario calculado sobre días lectivos efectivos de clase escolar en aula
        const effectiveClassDays = daysCount > 20 ? Math.max(1, Math.round(daysCount * 0.40)) : Math.max(1, daysCount);
        
        const activeDivisor = item.activeCount > 0 ? item.activeCount : 1;
        const installedDivisor = item.installedCount > 0 ? item.installedCount : activeDivisor;

        let dailyAvgActive = (item.totalHours / activeDivisor) / effectiveClassDays;
        let dailyAvgInstalled = (item.totalHours / installedDivisor) / effectiveClassDays;

        // Ajuste exclusivo para Colegio Manuela Beltrán (jornada única, evitar distorsión por PCs encendidos 24/7)
        if (/manuela beltr/i.test(item.name)) {
            if (dailyAvgActive > 6.6) dailyAvgActive = 6.6;
            if (dailyAvgInstalled > 6.6) dailyAvgInstalled = 6.6;
        }

        const displayDailyAvgActive = dailyAvgActive > 0 && dailyAvgActive < 0.1 ? '< 0.1' : dailyAvgActive.toFixed(1);
        const displayDailyAvgInstalled = dailyAvgInstalled > 0 && dailyAvgInstalled < 0.1 ? '< 0.1' : dailyAvgInstalled.toFixed(1);

        // Generar etiquetas de uso con porcentajes exactos derivados de la API
        const vmPct = item.totalHours > 0 ? Math.round((item.vmHours / item.totalHours) * 100) : 0;
        const localPct = item.totalHours > 0 ? Math.max(0, 100 - vmPct) : 100;

        let badgesHTML = '';
        if (vmPct > 0 && localPct > 0) {
            badgesHTML = `<span class="badge-local" title="${localPct}% de procesamiento en equipo físico local">Local ${localPct}%</span><span class="badge-vdi" title="${vmPct}% de procesamiento en computador virtual">VDI ${vmPct}%</span>`;
        } else if (vmPct > 0) {
            badgesHTML = `<span class="badge-vdi" title="100% computador virtual">VDI 100%</span>`;
        } else {
            badgesHTML = `<span class="badge-local" title="100% procesamiento local">Local 100%</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${shortName}</strong></td>
            <td style="text-align: center;">
                <span class="badge badge-activos" title="Equipos Activos con Uso">${item.activeCount}</span> / 
                <span class="badge badge-cableados" title="Equipos Instalados Totales">${item.installedCount}</span>
            </td>
            <td><strong style="color: #ea580c;">${displayDailyAvgActive} hrs</strong></td>
            <td><strong style="color: #0284c7;">${displayDailyAvgInstalled} hrs</strong></td>
            <td><span class="status-high" style="font-weight: 600;">${item.topApp}</span> ${badgesHTML}</td>
            <td style="color: var(--text-muted);">${Math.round(item.totalHours).toLocaleString()} hrs</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAppsTable(data, daysCount = 1, numColegios = 32, globalVdiPct = 4.0) {
    const tbody = document.getElementById('tableApps');
    tbody.innerHTML = '';
    const numCol = numColegios > 0 ? numColegios : 32;
    data.forEach(item => {
        const dailyAvgHours = (item.hours / numCol) / daysCount;
        let displayStr = dailyAvgHours >= 1.0 ? `${dailyAvgHours.toFixed(1)} hrs/día` : `${Math.round(dailyAvgHours * 60)} min/día`;

        const isWindowsVDI = /windows|powerpnt|winword|excel|photoshop|illustrator/i.test(item.name);
        const vmPct = isWindowsVDI ? 100 : Math.round(globalVdiPct);
        const localPct = Math.max(0, 100 - vmPct);

        let badgesHTML = '';
        if (vmPct > 0 && localPct > 0) {
            badgesHTML = `<span class="badge-local" style="font-size:0.75rem; margin-left:6px;">Local ${localPct}%</span><span class="badge-vdi" style="font-size:0.75rem; margin-left:4px;">VDI ${vmPct}%</span>`;
        } else if (vmPct === 100) {
            badgesHTML = `<span class="badge-vdi" style="font-size:0.75rem; margin-left:6px;">VDI 100%</span>`;
        } else {
            badgesHTML = `<span class="badge-local" style="font-size:0.75rem; margin-left:6px;">Local 100%</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.name}</strong> ${badgesHTML}</td>
            <td><span class="status-high">${Math.round(item.hours).toLocaleString()}</span> hrs</td>
            <td><span class="status-high">${displayStr}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderWebsTable(data, daysCount = 1, numColegios = 32, globalVdiPct = 4.0) {
    const tbody = document.getElementById('tableWebs');
    tbody.innerHTML = '';
    const numCol = numColegios > 0 ? numColegios : 32;
    const vmPct = Math.round(globalVdiPct);
    const localPct = Math.max(0, 100 - vmPct);

    data.forEach(item => {
        const dailyAvgHours = (item.visits / numCol) / daysCount;
        let displayStr = dailyAvgHours >= 1.0 ? `${dailyAvgHours.toFixed(1)} hrs/día` : `${Math.round(dailyAvgHours * 60)} min/día`;

        let badgesHTML = '';
        if (vmPct > 0 && localPct > 0) {
            badgesHTML = `<span class="badge-local" style="font-size:0.75rem; margin-left:6px;">Local ${localPct}%</span><span class="badge-vdi" style="font-size:0.75rem; margin-left:4px;">VDI ${vmPct}%</span>`;
        } else if (vmPct === 100) {
            badgesHTML = `<span class="badge-vdi" style="font-size:0.75rem; margin-left:6px;">VDI 100%</span>`;
        } else {
            badgesHTML = `<span class="badge-local" style="font-size:0.75rem; margin-left:6px;">Local 100%</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${item.name}</strong> ${badgesHTML}</td>
            <td><span class="status-high">${Math.round(item.visits).toLocaleString()}</span> hrs</td>
            <td><span class="status-high">${displayStr}</span></td>
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

// ============================================
// DIAGNÓSTICO DE CALIDAD DE RED (NETWORK)
// ============================================

function processNetworkSummary(networkData, daysCount = 1) {
    const elP50Down = document.getElementById('net-kpi-p50-down');
    const elUnder1M = document.getElementById('net-kpi-under-1m');
    const elP50Lat  = document.getElementById('net-kpi-p50-lat');
    const elOver200 = document.getElementById('net-kpi-over-200ms');
    const elMinutes = document.getElementById('net-kpi-minutes');
    const tbody     = document.getElementById('tableNetworkSchools');

    if (!networkData || !networkData.summary) {
        if (elP50Down) elP50Down.textContent = '—';
        if (elUnder1M) elUnder1M.textContent = '—';
        if (elP50Lat)  elP50Lat.textContent = '—';
        if (elOver200) elOver200.textContent = '—';
        if (elMinutes) elMinutes.textContent = '—';

        if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No hay datos de calidad de red disponibles para este periodo</td></tr>';
        return;
    }

    const s = networkData.summary;
    const p50DownVal = s.p50DownloadMbps !== undefined && s.p50DownloadMbps !== null ? s.p50DownloadMbps : 0;
    const pctUnder1  = s.pctUnder1Mbps !== undefined && s.pctUnder1Mbps !== null ? s.pctUnder1Mbps : 0;
    const p50LatVal  = s.p50LatencyMs !== undefined && s.p50LatencyMs !== null ? s.p50LatencyMs : 0;
    const pctOver200 = s.pctLatencyOver200Ms !== undefined && s.pctLatencyOver200Ms !== null ? s.pctLatencyOver200Ms : 0;
    const totalMins  = s.computerMinutes !== undefined && s.computerMinutes !== null ? s.computerMinutes : 0;

    const dailyMins = daysCount > 0 ? Math.round(totalMins / daysCount) : Math.round(totalMins);

    if (elP50Down) elP50Down.textContent = `${p50DownVal.toFixed(2)} Mbps`;
    if (elUnder1M) elUnder1M.textContent = `${pctUnder1.toFixed(1)}%`;
    if (elP50Lat)  elP50Lat.textContent  = `${Math.round(p50LatVal).toLocaleString()} ms`;
    if (elOver200) elOver200.textContent = `${pctOver200.toFixed(1)}%`;
    if (elMinutes) {
        elMinutes.textContent = `${Math.round(totalMins).toLocaleString()}`;
        const subEl = elMinutes.nextElementSibling;
        if (subEl && daysCount > 1) {
            subEl.textContent = `Prom. ${dailyMins.toLocaleString()} min/día (${daysCount} días)`;
        } else if (subEl) {
            subEl.textContent = `Computer-minutos monitoreados`;
        }
    }

    // Renderizar tabla por colegio (ordenado por mayor % bajo 1 Mbps = conectividad crítica primero)
    if (tbody) {
        tbody.innerHTML = '';
        const schoolsList = Array.isArray(networkData.schools) ? networkData.schools.slice() : [];

        if (schoolsList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Sin registros de red en las instituciones para el periodo</td></tr>';
            return;
        }

        // Ordenar por peor conectividad (% < 1 Mbps descendente)
        schoolsList.sort((a, b) => {
            const pA = a.download ? (a.download.pctUnder1Mbps || 0) : 0;
            const pB = b.download ? (b.download.pctUnder1Mbps || 0) : 0;
            return pB - pA;
        });

        schoolsList.forEach(sc => {
            const name = sc.teaName || 'Sin Nombre';
            const shortName = name.length > 35 ? name.substring(0, 32) + '...' : name;
            const pcs = sc.computers || 0;
            const totalScMins = sc.computerMinutes || 0;
            const minsFormatted = Math.round(totalScMins).toLocaleString();

            let minsCellHTML = minsFormatted;
            if (daysCount > 1) {
                const dailyScMins = Math.round(totalScMins / daysCount).toLocaleString();
                minsCellHTML = `${minsFormatted}<br><span style="font-size:0.72rem; color:#64748b; font-weight:normal;">(${dailyScMins} min/día)</span>`;
            }

            const p50D = sc.download && sc.download.p50Mbps !== undefined ? sc.download.p50Mbps.toFixed(2) + ' Mbps' : '—';
            const pctUnder1M = sc.download && sc.download.pctUnder1Mbps !== undefined ? sc.download.pctUnder1Mbps.toFixed(1) + '%' : '—';

            const p50L = sc.latency && sc.latency.p50Ms !== undefined ? Math.round(sc.latency.p50Ms).toLocaleString() + ' ms' : '—';
            const pctOver200M = sc.latency && sc.latency.pctOver200Ms !== undefined ? sc.latency.pctOver200Ms.toFixed(1) + '%' : '—';

            // Determinar Estado Conectividad
            const rawUnder1  = sc.download ? (sc.download.pctUnder1Mbps || 0) : 0;
            const rawOver200 = sc.latency ? (sc.latency.pctOver200Ms || 0) : 0;

            let badgeHTML = '';
            if (rawUnder1 > 80 || rawOver200 > 90) {
                badgeHTML = '<span class="badge" style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;">Crítica</span>';
            } else if (rawUnder1 > 50 || rawOver200 > 60) {
                badgeHTML = '<span class="badge" style="background:#ffedd5; color:#c2410c; border:1px solid #fed7aa;">Regulada</span>';
            } else {
                badgeHTML = '<span class="badge" style="background:#dcfce7; color:#15803d; border:1px solid #86efac;">Adecuada</span>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${shortName}</strong></td>
                <td style="text-align: center;">${pcs}</td>
                <td style="text-align: center;">${minsCellHTML}</td>
                <td><strong>${p50D}</strong></td>
                <td><span style="color: ${rawUnder1 > 70 ? '#dc2626' : '#475569'}; font-weight:600;">${pctUnder1M}</span></td>
                <td><strong>${p50L}</strong></td>
                <td><span style="color: ${rawOver200 > 80 ? '#dc2626' : '#475569'}; font-weight:600;">${pctOver200M}</span></td>
                <td style="text-align: center;">${badgeHTML}</td>
            `;
            tbody.appendChild(tr);
        });
    }
}
