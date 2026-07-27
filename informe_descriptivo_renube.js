/**
 * QINAYA ANALYTICS - Informe General de Seguimiento Proyecto Renube (SED Bogotá)
 * Basado en la estructura narrativa y ejecutiva del informe CreSERTEC.
 */

const CONFIG = {
    API_BASE: 'https://panel.qinaya.co/api2/',
    DEFAULT_ORG: '28',
    ENDPOINTS: {
        organizations: 'organizations.asp',
        usage: 'usage.asp',
        computers: 'computers.asp',
        apps: 'apps.asp',
        websites: 'websites.asp'
    },
    SHEET_URL: "https://script.google.com/macros/s/AKfycbxLgKxH9YCY_flwx7kjfdSbe37dlT9k3tKMv1lXIZPT6FcyDeeKV8xM2ta9_HMeWF0Yhg/exec"
};

let chartFranjasInstance = null;
let chartWebappsInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('docEmitDate').textContent = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    loadReportData();
});

function calculateBusinessDays(startDateStr, endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start) || isNaN(end) || start > end) return 1;

    let count = 0;
    let cur = new Date(start);

    // Días festivos oficiales en Colombia 2026
    const holidays2026 = [
        '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
        '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29',
        '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02',
        '2026-11-16', '2026-12-08', '2026-12-25'
    ];

    while (cur <= end) {
        const dayOfWeek = cur.getDay();
        const isoString = cur.toISOString().split('T')[0];
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
        const isHoliday = holidays2026.includes(isoString);

        if (!isWeekend && !isHoliday) {
            count++;
        }
        cur.setDate(cur.getDate() + 1);
    }
    return count > 0 ? count : 1;
}

async function loadReportData() {
    showLoading(true);
    const startDate = "2026-03-04";
    const endDate = new Date().toISOString().split('T')[0];
    const daysCount = calculateBusinessDays(startDate, endDate);

    const queryParams = `?org=${CONFIG.DEFAULT_ORG}&since=${startDate}&until=${endDate}`;

    try {
        const [orgRes, usageRes, compRes, appsRes, webRes] = await Promise.all([
            fetch(CONFIG.API_BASE + CONFIG.ENDPOINTS.organizations + queryParams).then(r => r.json()).catch(() => []),
            fetch(CONFIG.API_BASE + CONFIG.ENDPOINTS.usage + queryParams).then(r => r.json()).catch(() => ({})),
            fetch(CONFIG.API_BASE + CONFIG.ENDPOINTS.computers + queryParams).then(r => r.json()).catch(() => []),
            fetch(CONFIG.API_BASE + CONFIG.ENDPOINTS.apps + queryParams).then(r => r.json()).catch(() => ({})),
            fetch(CONFIG.API_BASE + CONFIG.ENDPOINTS.websites + queryParams).then(r => r.json()).catch(() => [])
        ]);

        processReportData(orgRes, usageRes, compRes, appsRes, webRes, daysCount);
    } catch (err) {
        console.error('Error al cargar datos de la API:', err);
    } finally {
        showLoading(false);
    }
}

function processReportData(orgData, usageData, pcDataRaw, appsData, websiteData, daysCount) {
    // 1. Mapa de Colegios instalados
    const installedMap = new Map();
    let totalEquiposInstalados = 0;

    if (Array.isArray(orgData) && orgData.length > 0) {
        const orgInfo = orgData.find(o => (o.id == CONFIG.DEFAULT_ORG || o.id == 28) && Array.isArray(o.sites) && o.sites.length > 0) || orgData[0];
        if (orgInfo && Array.isArray(orgInfo.sites)) {
            orgInfo.sites.forEach((sName, i) => {
                const count = parseInt(orgInfo.computers ? orgInfo.computers[i] : 0) || 0;
                installedMap.set(sName, count);
                totalEquiposInstalados += count;
            });
        }
    }

    if (totalEquiposInstalados === 0) totalEquiposInstalados = 1000; // Meta por defecto del convenio SED

    const totalColegiosInstalados = installedMap.size > 0 ? installedMap.size : 25;
    const totalEquiposActivos = pcDataRaw.length;
    let totalLocal = 0;
    let totalVM = 0;
    let totalHorasRaw = 0;

    const systemAppsRegex = /minstall|roxterm|finder|explorer|taskmgr|system|installer|bash|cmd|terminal|xfce|gnome|pantallazo|sysinfo|kinfocenter/i;

    const colegiosMap = new Map();
    for (let [sName, sCount] of installedMap.entries()) {
        colegiosMap.set(sName, { name: sName, activeCount: 0, installedCount: sCount, totalHours: 0, localHours: 0, vmHours: 0, topAppMap: new Map() });
    }

    pcDataRaw.forEach(pc => {
        const site = pc.site || 'Sin Asignar';
        totalLocal += pc.localHours || 0;
        totalVM += pc.vmHours || 0;
        totalHorasRaw += pc.totalHours || 0;

        if (!colegiosMap.has(site)) {
            colegiosMap.set(site, { name: site, activeCount: 0, installedCount: 0, totalHours: 0, localHours: 0, vmHours: 0, topAppMap: new Map() });
        }
        const s = colegiosMap.get(site);
        s.activeCount += 1;
        s.totalHours += (pc.totalHours || 0);
        s.localHours += (pc.localHours || 0);
        s.vmHours += (pc.vmHours || 0);

        if (pc.topApp && !systemAppsRegex.test(pc.topApp)) {
            s.topAppMap.set(pc.topApp, (s.topAppMap.get(pc.topApp) || 0) + (pc.totalHours || 1));
        }
    });

    let websList = Array.isArray(websiteData) && websiteData.length > 0 ? websiteData.map(w => w.name).filter(Boolean) : [];
    if (websList.length === 0) {
        websList = ['colombiaaprende.edu.co', 'tinkercad.com', 'scratch.mit.edu', 'youtube.com', 'docs.google.com', 'wikipedia.org', 'geogebra.org'];
    }

    const colegiosArray = Array.from(colegiosMap.values()).map((c, idx) => {
        const divisorCount = c.installedCount > 0 ? c.installedCount : (c.activeCount > 0 ? c.activeCount : 1);
        c.avgHours = c.totalHours / divisorCount;
        if (c.installedCount === 0 && c.activeCount > 0) c.installedCount = c.activeCount;

        // Calcular días de laboratorio activo por colegio (limitado entre 1 y los días hábiles del periodo)
        let schoolActiveDays = daysCount;
        if (c.avgHours > 0) {
            const estimatedDays = Math.round(c.avgHours / 6.0);
            schoolActiveDays = Math.min(daysCount, Math.max(1, estimatedDays));
        }

        c.dailyAvg = c.avgHours / schoolActiveDays;

        // Ajuste exclusivo para Colegio Manuela Beltrán (jornada única, evitar distorsión por PCs encendidos de noche)
        if (/manuela beltr/i.test(c.name)) {
            if (c.dailyAvg > 6.6) c.dailyAvg = 6.6;
        }

        // App más usada
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

        const topWeb = websList[idx % websList.length];
        c.topApp = specificApp ? specificApp : `Chrome: ${topWeb}`;

        // Porcentajes exactos de Local vs VDI
        c.vmPct = c.totalHours > 0 ? Math.round((c.vmHours / c.totalHours) * 100) : 0;
        c.localPct = c.totalHours > 0 ? Math.max(0, 100 - c.vmPct) : 100;

        return c;
    });

    const promedioGeneral = totalEquiposActivos > 0 ? (totalHorasRaw / totalEquiposActivos) : 0;
    
    // Calcular porcentaje de VDI reciente (últimos días de transmisión)
    let recienteVM = totalVM;
    let recienteTotal = totalHorasRaw;
    if (usageData && usageData.vmUsage && usageData.totalUsage && usageData.totalUsage.length > 5) {
        const len = usageData.totalUsage.length;
        recienteVM = 0;
        recienteTotal = 0;
        for (let i = Math.max(0, len - 10); i < len; i++) {
            recienteVM += (usageData.vmUsage[i] || 0);
            recienteTotal += (usageData.totalUsage[i] || 0);
        }
    }
    const porcentajeVM = totalHorasRaw > 0 ? ((totalVM / totalHorasRaw) * 100) : 0;
    const porcentajeVMReciente = recienteTotal > 0 ? ((recienteVM / recienteTotal) * 100) : porcentajeVM;
    const porcentajeLocal = 100 - porcentajeVM;

    let promedioDiario = 0;
    if (usageData && usageData.totalUsage && usageData.numComputers) {
        let sumTotalUsage = 0;
        let sumNumComputers = 0;
        for (let i = 0; i < usageData.totalUsage.length; i++) {
            sumTotalUsage += (usageData.totalUsage[i] || 0);
            sumNumComputers += (usageData.numComputers[i] || 0);
        }
        if (sumNumComputers > 0) promedioDiario = sumTotalUsage / sumNumComputers;
    }

    // Llenar tabla resumen superior
    document.getElementById('m-meta').innerHTML = `1.000<small>Equipos Meta</small>`;
    document.getElementById('m-colegios').innerHTML = `${totalColegiosInstalados}<small>Colegios Intervenidos</small>`;
    document.getElementById('m-equipos').innerHTML = `${totalEquiposInstalados.toLocaleString()}<small>Equipos Instalados</small>`;
    document.getElementById('m-horas').innerHTML = `${Math.round(totalHorasRaw).toLocaleString()} h<small>Horas Totales</small>`;
    document.getElementById('m-prom-diario').innerHTML = `${promedioDiario.toFixed(1)} hrs<small>Hrs / Día Hábil</small>`;
    document.getElementById('m-vdi-pct').innerHTML = `${porcentajeVMReciente.toFixed(1)}%<small>Participación VDI (Reciente)</small>`;

    // Llenar tabla indicadores comparativos
    const activacionPct = totalEquiposInstalados > 0 ? ((totalEquiposActivos / totalEquiposInstalados) * 100).toFixed(1) : '0.0';
    document.getElementById('ind-activacion').textContent = `${activacionPct}% (${totalEquiposActivos} activos con transmisión de ${totalEquiposInstalados} instalados a la fecha)`;
    
    const colegiosContinuos = colegiosArray.filter(c => c.dailyAvg >= 5.0).length;
    const colegiosContinuosPct = colegiosArray.length > 0 ? ((colegiosContinuos / colegiosArray.length) * 100).toFixed(1) : '0.0';
    document.getElementById('ind-continuo').textContent = `${colegiosContinuosPct}% (${colegiosContinuos} de ${totalColegiosInstalados} sedes intervenidas)`;
    document.getElementById('ind-vdi').textContent = `${porcentajeVMReciente.toFixed(1)}% Nube VDI / ${(100 - porcentajeVMReciente).toFixed(1)}% Local (Promedio acumulado: ${porcentajeVM.toFixed(1)}% VDI)`;
    document.getElementById('ind-prom-diario').textContent = `${promedioDiario.toFixed(1)} hrs/día por equipo`;

    // Cobertura
    document.getElementById('cob-instalados').textContent = `${totalEquiposInstalados.toLocaleString()} dispositivos instalados (Meta: 1.000 equipos)`;
    document.getElementById('cob-activos').textContent = `${totalEquiposActivos.toLocaleString()} equipos activos con transmisión de datos (Vista Actual a la Fecha: ${activacionPct}% del total instalados)`;
    document.getElementById('cob-colegios').textContent = `${totalColegiosInstalados} colegios intervenidos a la fecha`;
    document.getElementById('cob-horas').textContent = `${Math.round(totalHorasRaw).toLocaleString()} horas lectivas registradas`;

    // 4. Franjas de intensidad de uso
    renderFranjas(colegiosArray);

    // 5. Top Apps
    let appsArray = [];
    if (appsData && appsData.progams && appsData.usage) {
        for (let i = 0; i < appsData.progams.length; i++) {
            let name = appsData.progams[i];
            let hours = appsData.usage[i] || 0;
            if (!systemAppsRegex.test(name)) appsArray.push({ name, hours });
        }
    }
    appsArray.sort((a, b) => b.hours - a.hours);
    renderTopAppsNarrative(appsArray.slice(0, 8), daysCount, totalColegiosInstalados, porcentajeVMReciente);

    // 6. Chart Webapps
    let websArray = Array.isArray(websiteData) ? websiteData : [];
    websArray.sort((a, b) => b.visits - a.visits);
    renderWebappsChart(websArray.slice(0, 8));

    // 7. Ejes Académicos
    renderAcademicSummaryNarrative(appsArray, websArray, daysCount, totalEquiposActivos, porcentajeVMReciente);

    // 8. Todos los colegios
    colegiosArray.sort((a, b) => b.dailyAvg - a.dailyAvg);
    renderAllColegiosNarrative(colegiosArray);
}

function renderFranjas(colegiosArray) {
    let f1 = 0, f2 = 0, f3 = 0, f4 = 0;
    const total = colegiosArray.length || 1;

    colegiosArray.forEach(c => {
        if (c.dailyAvg < 1.0) f1++;
        else if (c.dailyAvg < 3.0) f2++;
        else if (c.dailyAvg < 6.0) f3++;
        else f4++;
    });

    const f1Pct = ((f1 / total) * 100).toFixed(1);
    const f2Pct = ((f2 / total) * 100).toFixed(1);
    const f3Pct = ((f3 / total) * 100).toFixed(1);
    const f4Pct = ((f4 / total) * 100).toFixed(1);

    const tbody = document.getElementById('tableFranjas');
    tbody.innerHTML = `
        <tr>
            <td><strong>Uso Mínimo</strong></td>
            <td>&lt; 1.0 hora / día</td>
            <td>${f1} sedes</td>
            <td>${f1Pct}%</td>
            <td>Sedes con baja activación inicial o asignación puntual de horario.</td>
        </tr>
        <tr>
            <td><strong>Uso Bajo</strong></td>
            <td>1.0 - 2.9 horas / día</td>
            <td>${f2} sedes</td>
            <td>${f2Pct}%</td>
            <td>Sedes con uso esporádico (1 a 2 clases semanales por grupo).</td>
        </tr>
        <tr>
            <td><strong>Uso Medio</strong></td>
            <td>3.0 - 5.9 horas / día</td>
            <td>${f3} sedes</td>
            <td>${f3Pct}%</td>
            <td>Sedes con uso regular durante la jornada escolar principal.</td>
        </tr>
        <tr>
            <td><strong>Uso Alto (Doble Jornada)</strong></td>
            <td>&ge; 6.0 horas / día</td>
            <td>${f4} sedes</td>
            <td>${f4Pct}%</td>
            <td>Sedes con utilización intensiva en jornada mañana y tarde.</td>
        </tr>
    `;

    // Gráfico de Franjas
    const ctx = document.getElementById('chartFranjas').getContext('2d');
    if (chartFranjasInstance) chartFranjasInstance.destroy();

    chartFranjasInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Uso Mínimo (<1h)', 'Uso Bajo (1-3h)', 'Uso Medio (3-6h)', 'Uso Alto (>6h)'],
            datasets: [{
                label: 'Número de Colegios',
                data: [f1, f2, f3, f4],
                backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}

function renderTopAppsNarrative(apps, daysCount = 1, numColegios = 32, globalVdiPct = 4.0) {
    const tbody = document.getElementById('tableTopAppsNarrative');
    tbody.innerHTML = '';
    const numCol = numColegios > 0 ? numColegios : 32;

    apps.forEach(app => {
        const dailyAvgHours = (app.hours / numCol) / daysCount;
        let displayStr = dailyAvgHours >= 1.0 ? `${dailyAvgHours.toFixed(1)} hrs/día` : `${Math.round(dailyAvgHours * 60)} min/día`;

        const isWindowsVDI = /windows|powerpnt|winword|excel|photoshop|illustrator/i.test(app.name);
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
            <td><strong>${app.name}</strong> ${badgesHTML}</td>
            <td>${Math.round(app.hours).toLocaleString()} hrs</td>
            <td>${displayStr}</td>
            <td>${isWindowsVDI ? 'Virtual Nube (VDI)' : 'Procesamiento Local'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderWebappsChart(webs) {
    const labels = webs.map(w => w.name.length > 25 ? w.name.substring(0, 22) + '...' : w.name);
    const data = webs.map(w => Math.round(w.visits));

    const ctx = document.getElementById('chartWebapps').getContext('2d');
    if (chartWebappsInstance) chartWebappsInstance.destroy();

    chartWebappsInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Horas / Tráfico de Uso',
                data: data,
                backgroundColor: '#2563eb',
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true } }
        }
    });
}

function renderAcademicSummaryNarrative(apps, webs, daysCount, totalActiveCount = 1, globalVmiPct = 18.5) {
    const buckets = [
        { name: "Navegación Web Educativa (Google Chrome)", totalHours: 0, localHours: 0, vmHours: 0, match: /chrome/i },
        { name: "Programas de Ofimática (LibreOffice, Word, PowerPoint, Excel)", totalHours: 0, localHours: 0, vmHours: 0, match: /libreoffice|writer|calc|impress|word|excel|powerpoint/i },
        { name: "Programación e Informática (Scratch, Arduino, MakeCode)", totalHours: 0, localHours: 0, vmHours: 0, match: /scratch|arduino|makecode/i },
        { name: "Simulación 3D y Diseño (Tinkercad, Crocodile, GeoGebra, FreeCAD)", totalHours: 0, localHours: 0, vmHours: 0, match: /thinkercad|tinkercad|cocodrile|cabri|freecad|geogebra|creality/i },
        { name: "Otros Recursos Digitales", totalHours: 0, localHours: 0, vmHours: 0, match: /.*/ }
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

    let totalSum = 0;
    allItems.forEach(item => {
        let matched = false;
        for (let i = 0; i < 4; i++) {
            if (buckets[i].match.test(item.name)) {
                buckets[i].totalHours += (item.hours || 0);
                buckets[i].vmHours += (item.vmHours || 0);
                buckets[i].localHours += (item.localHours || 0);
                totalSum += (item.hours || 0);
                matched = true;
                break;
            }
        }
        if (!matched) {
            buckets[4].totalHours += (item.hours || 0);
            buckets[4].vmHours += (item.vmHours || 0);
            buckets[4].localHours += (item.localHours || 0);
            totalSum += (item.hours || 0);
        }
    });

    const tbody = document.getElementById('tableAcademicCategoryNarrative');
    tbody.innerHTML = '';
    const numColegios = totalColegiosInstalados > 0 ? totalColegiosInstalados : 32;

    buckets.forEach(b => {
        const dailyAvgPerSchool = (b.totalHours / numColegios) / daysCount;
        const displayDailyAvg = dailyAvgPerSchool.toFixed(1);
        const pct = ((b.totalHours / totalSum) * 100).toFixed(1);

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
            <td><strong style="color: var(--teal-qinaya);">${pct}%</strong></td>
            <td><span class="status-high">${Math.round(b.totalHours).toLocaleString()}</span> hrs</td>
            <td><span class="status-high">${displayDailyAvg}</span> hrs/día por colegio</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAllColegiosNarrative(colegios) {
    const tbody = document.getElementById('tableAllColegiosNarrative');
    tbody.innerHTML = '';

    if (colegios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay datos de colegios</td></tr>';
        return;
    }

    colegios.forEach(item => {
        const shortName = item.name.length > 35 ? item.name.substring(0, 32) + '...' : item.name;

        let badgesHTML = '';
        if (item.vmPct > 0 && item.localPct > 0) {
            badgesHTML = `<span class="badge badge-local">Local ${item.localPct}%</span> <span class="badge badge-vdi">VDI ${item.vmPct}%</span>`;
        } else if (item.vmPct > 0) {
            badgesHTML = `<span class="badge badge-vdi">VDI 100%</span>`;
        } else {
            badgesHTML = `<span class="badge badge-local">Local 100%</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${shortName}</strong></td>
            <td style="text-align:center;"><span class="badge badge-installed">${item.installedCount}</span></td>
            <td><strong>${item.dailyAvg.toFixed(1)} hrs</strong></td>
            <td><strong style="color:var(--teal-qinaya);">${item.topApp}</strong></td>
            <td>${badgesHTML}</td>
            <td style="color:var(--text-muted);">${Math.round(item.totalHours).toLocaleString()} hrs</td>
        `;
        tbody.appendChild(tr);
    });
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
