/**
 * Lógica para la vista de Gestión de Instalaciones (Fase 2)
 * Se conecta a dos fuentes:
 * 1. El script de la Fase 1 para totales históricos
 * 2. El CSV publicado del nuevo Google Sheets para gestión diaria
 */

const FASE1_API_URL = "https://script.google.com/macros/s/AKfycbxLgKxH9YCY_flwx7kjfdSbe37dlT9k3tKMv1lXIZPT6FcyDeeKV8xM2ta9_HMeWF0Yhg/exec";
const FASE2_CSV_URL = "https://docs.google.com/spreadsheets/d/1gu-gf5Kz4oxOhQUmaw3VZ7eoIzAkd-peY_wO2Yge0PM/export?format=csv";

const META_GLOBAL = 1000;

let totalEquiposFase1 = 0;
let totalSedesFase1 = 0;
let totalEquiposFase2Completados = 0;
let metaChartObj = null;

// Normalizar la fila de Fase 1 para contar (similar a instalaciones.js)
function getVal(obj, ...keywords) {
    const keys = Object.keys(obj);
    for (const kw of keywords) {
        const found = keys.find(k => k.toLowerCase().replace(/[áéíóúñü]/g, c => {
            return { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n', 'ü': 'u' }[c] || c;
        }).includes(kw.toLowerCase()));
        if (found !== undefined) return obj[found];
    }
    return '';
}

async function loadFase1Data() {
    try {
        const res = await fetch(FASE1_API_URL);
        const data = await res.json();
        
        if (data && Array.isArray(data)) {
            let sedesSet = new Set();
            totalEquiposFase1 = 0;

            data.forEach(row => {
                const instalados = parseInt(getVal(row, 'cantidad de computadores', 'computadores instalados')) || 0;
                if (instalados > 0) {
                    const colegio = getVal(row, 'colegio') || 'Sin nombre';
                    sedesSet.add(colegio.trim());
                    totalEquiposFase1 += instalados;
                }
            });
            totalSedesFase1 = sedesSet.size;
            
            document.getElementById('kpi-f1-sedes').innerText = totalSedesFase1;
            document.getElementById('kpi-f1-equipos').innerText = totalEquiposFase1;
        }
    } catch (e) {
        console.error("Error cargando Fase 1:", e);
        document.getElementById('kpi-f1-sedes').innerText = "Err";
        document.getElementById('kpi-f1-equipos').innerText = "Err";
    }
}

async function loadFase2Data() {
    return new Promise((resolve, reject) => {
        Papa.parse(FASE2_CSV_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                const data = results.data;
                renderFase2Table(data);
                resolve();
            },
            error: function(err) {
                console.error("Error cargando CSV Fase 2:", err);
                reject(err);
            }
        });
    });
}

function renderFase2Table(data) {
    const tableBody = document.getElementById('tableBodyGestion');
    let html = '';
    totalEquiposFase2Completados = 0;

    // Invertir para mostrar los más recientes arriba
    const reversedData = [...data].reverse();

    reversedData.forEach(row => {
        // Extraer valores con nombres de columna (pueden variar un poco, usamos fallback seguro)
        const fecha = row['Fecha'] || '-';
        const colegio = row['Colegio'] || 'Sin nombre';
        const sede = row['Sede'] || '-';
        const direccion = row['Direccion'] || '-';
        const almacenista = row['Almacenista'] || '-';
        const telefono = row['Telefono'] || row['Teléfono'] || '-';
        const tipoEquipos = row['Tipo de computadores'] || '-';
        const posibles = parseInt(row['Cantidad de computadores posibles a Instalar'] || row['Cantidad de computadores posibles a instalar']) || 0;
        const observaciones = row['Observaciones'] || '-';
        const instalador = row['Instalador'] || '-';
        const diaVisita = row['Dia Posible a Instalar'] || row['Dia Posible a instalar'] || '-';
        const estado = (row['Estado'] || 'Pendiente').trim();

        // Determinar badge para Estado
        let estadoClase = 'estado-default';
        const estLower = estado.toLowerCase();
        if (estLower.includes('pendiente') || estLower.includes('contactar')) estadoClase = 'estado-pendiente';
        else if (estLower.includes('proceso') || estLower.includes('agendado')) estadoClase = 'estado-proceso';
        else if (estLower.includes('completado') || estLower.includes('instalado')) {
            estadoClase = 'estado-completado';
            // Sumamos los posibles a equipos completados
            totalEquiposFase2Completados += posibles;
        }
        else if (estLower.includes('visita')) estadoClase = 'estado-visita';

        // Determinar badge para Tipo Equipos
        let tipoClase = '';
        const tipoLower = tipoEquipos.toLowerCase();
        if (tipoLower.includes('cableado')) tipoClase = 'badge-cableados';
        else if (tipoLower.includes('wifi')) tipoClase = 'badge-wifi';
        else if (tipoLower.includes('ambos')) tipoClase = 'badge-ambos';

        html += `
            <tr>
                <td><small style="color:var(--text-secondary);">${fecha}</small></td>
                <td><strong style="color:var(--blue-800);">${colegio}</strong><br><small>${sede}</small></td>
                <td>${direccion}</td>
                <td>${almacenista}<br><small style="color:var(--text-secondary);"><i class="fas fa-phone-alt" style="font-size:0.75rem;"></i> ${telefono}</small></td>
                <td><span style="font-weight:500;">${diaVisita}</span></td>
                <td><span class="badge ${tipoClase}">${tipoEquipos}</span></td>
                <td style="text-align: center; font-weight:700; color:var(--blue-600);">${posibles}</td>
                <td><small>${observaciones}<br>Instalador: ${instalador}</small></td>
                <td><span class="badge ${estadoClase}">${estado}</span></td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
    
    // Actualizar KPI de Fase 2
    document.getElementById('kpi-f2-equipos').innerText = totalEquiposFase2Completados;
    document.getElementById('kpi-f2-trend').innerHTML = `<i class="fas fa-arrow-up"></i> Equipos sumados a la meta`;
}

function updateMeta() {
    const totalAcumulado = totalEquiposFase1 + totalEquiposFase2Completados;
    const porcentaje = Math.min(100, Math.round((totalAcumulado / META_GLOBAL) * 100));

    // Update Text and Progress Bar
    document.getElementById('meta-total-text').innerText = totalAcumulado.toLocaleString('es-CO');
    const progressBar = document.getElementById('meta-progress-bar');
    progressBar.style.width = `${porcentaje}%`;
    progressBar.innerText = `${porcentaje}%`;

    // Render Doughnut Chart
    const canvas = document.getElementById('metaChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (metaChartObj) metaChartObj.destroy();

    const pendientes = Math.max(0, META_GLOBAL - totalAcumulado);

    metaChartObj = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completados', 'Faltantes'],
            datasets: [{
                data: [totalAcumulado, pendientes],
                backgroundColor: ['#10b981', '#e2e8f0'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => ` ${c.raw.toLocaleString('es-CO')} equipos` } }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Cargar ambas fuentes en paralelo
        await Promise.all([
            loadFase1Data(),
            loadFase2Data()
        ]);
        
        // Calcular y renderizar meta global
        updateMeta();
    } catch (e) {
        console.error("Error global de inicialización:", e);
    } finally {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }
});
