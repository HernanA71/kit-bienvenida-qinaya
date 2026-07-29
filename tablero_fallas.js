/**
 * QINAYA ANALYTICS - Tablero de Fallas de Instalación
 * Registro interactivo de incidencias, propuesta de solución, edición completa y sincronización con Google Sheets.
 */

const STORAGE_KEY = "qinaya_fallas_instalacion_v2";

// URL del WebApp de Google Apps Script vinculado a la Hoja de Google Sheets "Fallas"
let SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzvYba-iyXqNzeJiFz4pBdWsYVRiI3Zkktm0rthR-EhtxdBTxwNia7FpImA1y3iaRE-rw/exec";

// Lista de Colegios Oficiales del Convenio SED Bogotá
const LISTA_COLEGIOS = [
    "Manuela Beltran - Teusaquillo",
    "Colegio Atanasio Girardot - SEDE A",
    "Colegio Manuel Cepeda Vargas (IED)",
    "Colegio Santa Lucía IED - SEDE PRINCIPAL",
    "Colegio Eduardo Santos -SEDE PRINCIPAL",
    "Colegio Gustavo Morales Morales",
    "Colegio Antonio García",
    "Colegio Virginia Gutierrez de Pineda (IED)",
    "Colegio El Salitre - Suba (IED)-SEDE A",
    "Colegio Externado Nacional Camilo Torres-SEDE UNICA",
    "Colegio Nuevo Horizonte - SEDE B",
    "Colegio Distrital La Joya",
    "Colegio Sorrento -SEDE A",
    "Colegio José Manuel Restrepo- SEDE UNICA",
    "Colegio Marco Tulio Fernández IED - SEDE B",
    "Colegio Moralba Suroriental sede A",
    "Colegio La Estrella del Sur",
    "Colegio Paraiso Mirador -SEDE A",
    "Colegio Distrital Costa Rica sede B",
    "Colegio Ciudad de Villavicencio",
    "Colegio campestre monte verde",
    "Colegio Villemar El Carmen IED",
    "Colegio Rural Pasquilla -SEDE-PASQUILLA",
    "Colegio Rodrigo Lara Bonilla - SEDE A",
    "Colegio Villamar IED",
    "Colegio Los Comuneros - Oswaldo Guayasamin (IED)",
    "Colegio San Francisco de Asis-SEDE A",
    "Colegio Antonia Santos",
    "Colegio Policarpa Salavarrieta IED",
    "Colegio Pablo Neruda IED",
    "Colegio Liceo Nacional Agustín Nieto Caballero -SEDE PRINCIPAL",
    "Colegio John F. Kennedy IED",
    "Colegio Paulo VI IED"
];

// Opciones por defecto de fallas
let fallasOpciones = [
    "Puertos USB dañados o deshabilitados por BIOS",
    "Computadores nuevos con restricción de garantía",
    "Red corporativa con claves / credenciales restringidas",
    "Laboratorio sin fluido eléctrico o sin tomacorrientes",
    "Sin conectividad a Internet en el colegio",
    "Equipos obsoletos sin requerimientos mínimos de RAM",
    "Laboratorio cerrado / Sin acceso por directivos",
    "Problemas de booteo o clave en BIOS (Soporte OTIC)",
    "Saturación o inestabilidad en red corporativa OIT"
];

// Datos iniciales de prueba y reales del reporte
const DATOS_INICIALES = [
    {
        id: 101,
        incidencia: "Problemas de booteo o clave en BIOS (Soporte OTIC)",
        colegio: "Colegio Manuel Cepeda Vargas (IED)",
        cantidad: 15,
        estado: "En Revisión",
        solucion: "Computadores con problemas de boot y clave en BIOS. Soporte escalado a la OTIC.",
        fecha: "2026-07-28",
        esEjemplo: false
    },
    {
        id: 102,
        incidencia: "Saturación o inestabilidad en red corporativa OIT",
        colegio: "Colegio Los Comuneros - Oswaldo Guayasamin (IED)",
        cantidad: 18,
        estado: "En Revisión",
        solucion: "Conexión a internet con alta saturación. Respuesta e intervención técnica pendiente de la OIT.",
        fecha: "2026-07-27",
        esEjemplo: false
    },
    {
        id: 103,
        incidencia: "Puertos USB dañados o deshabilitados por BIOS",
        colegio: "Colegio Policarpa Salavarrieta IED",
        cantidad: 12,
        estado: "Con Solución",
        solucion: "Se requiere usar lector de tarjetas SD interno o booteo por red local PXE.",
        fecha: "2026-07-26",
        esEjemplo: true
    },
    {
        id: 104,
        incidencia: "Computadores nuevos con restricción de garantía",
        colegio: "Colegio Liceo Nacional Agustín Nieto Caballero -SEDE PRINCIPAL",
        cantidad: 20,
        estado: "Sin Solución",
        solucion: "No aplica / Sin solución desde Qinaya debido a sellos de garantía de fábrica del proveedor.",
        fecha: "2026-07-25",
        esEjemplo: true
    }
];

let fallasData = [];
let chartFallasInstance = null;
let editingId = null;

document.addEventListener('DOMContentLoaded', () => {
    initColegiosSelect();
    loadFallasData();
    renderAll();
    syncWithGoogleSheetRemote();
});

// Poblar y reconstruir desplegable de colegios (incluyendo personalizados)
function initColegiosSelect() {
    const select = document.getElementById('selectColegio');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Seleccionar Colegio o escribir nuevo --</option>';
    
    LISTA_COLEGIOS.forEach(col => {
        const opt = document.createElement('option');
        opt.value = col;
        opt.textContent = col;
        select.appendChild(opt);
    });

    const optNuevo = document.createElement('option');
    optNuevo.value = "__NUEVO_COLEGIO__";
    optNuevo.textContent = "+ Escribir otro colegio / sede personalizada...";
    select.appendChild(optNuevo);

    if (currentVal && currentVal !== "__NUEVO_COLEGIO__") {
        select.value = currentVal;
    }
}

// Mostrar/ocultar input para colegio personalizado
function toggleCustomColegioInput() {
    const select = document.getElementById('selectColegio');
    const groupCustom = document.getElementById('groupCustomColegio');
    const inputCustom = document.getElementById('inputCustomColegio');

    if (select.value === '__NUEVO_COLEGIO__') {
        groupCustom.style.display = 'block';
        inputCustom.required = true;
        inputCustom.focus();
    } else {
        groupCustom.style.display = 'none';
        inputCustom.required = false;
        inputCustom.value = '';
    }
}

// Cargar datos desde localStorage o iniciales
function loadFallasData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        try {
            fallasData = JSON.parse(raw);
        } catch (e) {
            fallasData = [...DATOS_INICIALES];
        }
    } else {
        fallasData = [...DATOS_INICIALES];
        saveToStorage();
    }

    fallasData.forEach(item => {
        if (item.incidencia && !fallasOpciones.includes(item.incidencia)) {
            fallasOpciones.push(item.incidencia);
        }
        if (item.colegio && !LISTA_COLEGIOS.includes(item.colegio)) {
            LISTA_COLEGIOS.push(item.colegio);
        }
    });

    initColegiosSelect();
    rebuildIncidenciasSelect();
}

// Reconstruir selector de incidencias agregando cualquier nueva personalizada
function rebuildIncidenciasSelect() {
    const select = document.getElementById('selectIncidencia');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Seleccionar falla o escribir nueva --</option>';
    
    fallasOpciones.forEach(op => {
        const option = document.createElement('option');
        option.value = op;
        option.textContent = op;
        select.appendChild(option);
    });

    const optNueva = document.createElement('option');
    optNueva.value = "__NUEVA__";
    optNueva.textContent = "+ Escribir nueva causa personalizada...";
    select.appendChild(optNueva);

    if (currentVal && currentVal !== "__NUEVA__") {
        select.value = currentVal;
    }
}

// Mostrar/ocultar input para nueva falla personalizada
function toggleCustomIncidenciaInput() {
    const select = document.getElementById('selectIncidencia');
    const groupCustom = document.getElementById('groupCustomIncidencia');
    const inputCustom = document.getElementById('inputCustomIncidencia');

    if (select.value === '__NUEVA__') {
        groupCustom.style.display = 'block';
        inputCustom.required = true;
        inputCustom.focus();
    } else {
        groupCustom.style.display = 'none';
        inputCustom.required = false;
        inputCustom.value = '';
    }
}

// Guardar datos en localStorage
function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fallasData));
}

// Enviar datos en segundo plano a Google Apps Script evitando problemas de CORS (Content-Type: text/plain)
async function sendToGoogleSheet(record) {
    if (!SHEETS_WEBAPP_URL) return;
    try {
        await fetch(SHEETS_WEBAPP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify(record)
        });
    } catch (e) {
        console.warn("Sincronización remota con Google Sheets en pausa o fuera de línea:", e);
    }
}

// Sincronizar remotamente al iniciar si hay URL
async function syncWithGoogleSheetRemote() {
    if (!SHEETS_WEBAPP_URL) return;
    try {
        const res = await fetch(SHEETS_WEBAPP_URL + '?action=getFallas&t=' + new Date().getTime());
        const remoteData = await res.json();
        if (remoteData && Array.isArray(remoteData) && remoteData.length > 0) {
            fallasData = remoteData;
            saveToStorage();
            renderAll();
        }
    } catch (e) {
        console.log("Servicio remoto de Google Sheets inicializado en modo híbrido local/remoto.");
    }
}

// Manejar envío del formulario (Creación o Edición)
function handleFormSubmit(e) {
    e.preventDefault();

    const selectIncidencia = document.getElementById('selectIncidencia');
    const inputCustomIncidencia = document.getElementById('inputCustomIncidencia');
    const selectColegio = document.getElementById('selectColegio');
    const inputCustomColegio = document.getElementById('inputCustomColegio');
    const inputCantidad = document.getElementById('inputCantidad');
    const selectEstadoSolucion = document.getElementById('selectEstadoSolucion');
    const inputSolucion = document.getElementById('inputSolucion');

    let incidenciaFinal = selectIncidencia.value;
    if (incidenciaFinal === '__NUEVA__') {
        incidenciaFinal = inputCustomIncidencia.value.trim();
        if (!incidenciaFinal) {
            alert('Por favor escriba el nombre de la nueva falla.');
            return;
        }
        if (!fallasOpciones.includes(incidenciaFinal)) {
            fallasOpciones.push(incidenciaFinal);
            rebuildIncidenciasSelect();
        }
    }

    let colegioFinal = selectColegio.value;
    if (colegioFinal === '__NUEVO_COLEGIO__') {
        colegioFinal = inputCustomColegio.value.trim();
        if (!colegioFinal) {
            alert('Por favor escriba el nombre del nuevo colegio o sede.');
            return;
        }
        if (!LISTA_COLEGIOS.includes(colegioFinal)) {
            LISTA_COLEGIOS.push(colegioFinal);
            initColegiosSelect();
        }
    }

    if (editingId) {
        // MODO EDICIÓN: Actualizar registro existente
        const targetIndex = fallasData.findIndex(item => item.id === editingId);
        let updatedRecord = null;
        if (targetIndex !== -1) {
            updatedRecord = {
                ...fallasData[targetIndex],
                incidencia: incidenciaFinal,
                colegio: colegioFinal,
                cantidad: parseInt(inputCantidad.value) || 0,
                estado: selectEstadoSolucion.value,
                solucion: inputSolucion.value.trim()
            };
            fallasData[targetIndex] = updatedRecord;
        }
        editingId = null;
        resetFormUI();
        saveToStorage();
        if (updatedRecord) sendToGoogleSheet(updatedRecord);
        renderAll();

        showFormNotification('¡Registro Actualizado Exitosamente!', '#2563eb');
    } else {
        // MODO CREACIÓN: Agregar nuevo registro
        const nuevoRegistro = {
            id: Date.now(),
            incidencia: incidenciaFinal,
            colegio: colegioFinal,
            cantidad: parseInt(inputCantidad.value) || 0,
            estado: selectEstadoSolucion.value,
            solucion: inputSolucion.value.trim(),
            fecha: new Date().toISOString().split('T')[0],
            esEjemplo: false
        };

        fallasData.unshift(nuevoRegistro);
        resetFormUI();
        saveToStorage();
        sendToGoogleSheet(nuevoRegistro);
        renderAll();

        showFormNotification('¡Falla Registrada Exitosamente!', '#10b981');
    }
}

// Cargar un registro en el formulario para Editar
function editRegistro(id) {
    const item = fallasData.find(x => x.id === id);
    if (!item) return;

    editingId = id;

    const selectIncidencia = document.getElementById('selectIncidencia');
    const inputCustomIncidencia = document.getElementById('inputCustomIncidencia');
    const groupCustomIncidencia = document.getElementById('groupCustomIncidencia');

    const selectColegio = document.getElementById('selectColegio');
    const inputCustomColegio = document.getElementById('inputCustomColegio');
    const groupCustomColegio = document.getElementById('groupCustomColegio');

    const inputCantidad = document.getElementById('inputCantidad');
    const selectEstadoSolucion = document.getElementById('selectEstadoSolucion');
    const inputSolucion = document.getElementById('inputSolucion');

    if (fallasOpciones.includes(item.incidencia)) {
        selectIncidencia.value = item.incidencia;
        groupCustomIncidencia.style.display = 'none';
        inputCustomIncidencia.value = '';
    } else {
        selectIncidencia.value = '__NUEVA__';
        groupCustomIncidencia.style.display = 'block';
        inputCustomIncidencia.value = item.incidencia;
    }

    if (LISTA_COLEGIOS.includes(item.colegio)) {
        selectColegio.value = item.colegio;
        groupCustomColegio.style.display = 'none';
        inputCustomColegio.value = '';
    } else {
        selectColegio.value = '__NUEVO_COLEGIO__';
        groupCustomColegio.style.display = 'block';
        inputCustomColegio.value = item.colegio;
    }
    inputCantidad.value = item.cantidad;
    selectEstadoSolucion.value = item.estado;
    inputSolucion.value = item.solucion;

    const btnSubmit = document.querySelector('.btn-submit');
    btnSubmit.style.backgroundColor = '#1d4ed8';
    btnSubmit.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Registro de Falla';

    let btnCancel = document.getElementById('btnCancelEdit');
    if (!btnCancel) {
        btnCancel = document.createElement('button');
        btnCancel.id = 'btnCancelEdit';
        btnCancel.type = 'button';
        btnCancel.className = 'btn-submit';
        btnCancel.style.backgroundColor = '#64748b';
        btnCancel.style.marginTop = '8px';
        btnCancel.innerHTML = '<i class="fas fa-times"></i> Cancelar Edición';
        btnCancel.onclick = cancelEdit;
        btnSubmit.parentNode.appendChild(btnCancel);
    }

    document.querySelector('.card-box').scrollIntoView({ behavior: 'smooth' });
}

// Cancelar edición
function cancelEdit() {
    editingId = null;
    resetFormUI();
}

// Restaurar UI del formulario al estado por defecto
function resetFormUI() {
    document.getElementById('formFalla').reset();
    document.getElementById('groupCustomIncidencia').style.display = 'none';
    document.getElementById('groupCustomColegio').style.display = 'none';
    
    const btnSubmit = document.querySelector('.btn-submit');
    btnSubmit.style.backgroundColor = '';
    btnSubmit.innerHTML = '<i class="fas fa-save"></i> Guardar Registro de Falla';

    const btnCancel = document.getElementById('btnCancelEdit');
    if (btnCancel) btnCancel.remove();
}

// Notificación temporal en el botón
function showFormNotification(msg, bgColor) {
    const btn = document.querySelector('.btn-submit');
    const originalText = btn.innerHTML;
    btn.style.backgroundColor = bgColor;
    btn.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`;
    setTimeout(() => {
        btn.style.backgroundColor = '';
        btn.innerHTML = originalText;
    }, 2000);
}

// Eliminar un registro
function deleteRegistro(id) {
    if (confirm('¿Está seguro de eliminar este registro de falla?')) {
        if (editingId === id) cancelEdit();
        fallasData = fallasData.filter(item => item.id !== id);
        saveToStorage();
        renderAll();
    }
}

// Renderizar todo (KPIs, Tabla y Gráfico)
function renderAll() {
    renderKPIs();
    renderTable(fallasData);
    renderChart();
}

// Renderizar KPIs superiores
function renderKPIs() {
    let totalPCs = 0;
    const colegiosSet = new Set();
    const incidenciasMap = new Map();
    let conSolucionCount = 0;

    fallasData.forEach(item => {
        totalPCs += (item.cantidad || 0);
        colegiosSet.add(item.colegio);
        incidenciasMap.set(item.incidencia, (incidenciasMap.get(item.incidencia) || 0) + item.cantidad);
        
        if (item.estado === 'Con Solución') {
            conSolucionCount++;
        }
    });

    let causaPrincipal = "Ninguna";
    let maxCount = -1;
    for (let [causa, cant] of incidenciasMap.entries()) {
        if (cant > maxCount) {
            maxCount = cant;
            causaPrincipal = causa;
        }
    }
    if (causaPrincipal.length > 32) {
        causaPrincipal = causaPrincipal.substring(0, 30) + '...';
    }

    document.getElementById('kpi-total-no-instalados').textContent = totalPCs.toLocaleString();
    document.getElementById('kpi-colegios-afectados').textContent = colegiosSet.size;
    document.getElementById('kpi-causa-principal').textContent = causaPrincipal;
    document.getElementById('kpi-con-solucion').textContent = `${conSolucionCount} de ${fallasData.length}`;
}

// Renderizar Tabla
function renderTable(dataList) {
    const tbody = document.getElementById('tbodyFallas');
    const tfootTotal = document.getElementById('tfootTotalPCs');
    tbody.innerHTML = '';

    if (dataList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:25px; color:var(--text-muted);">No hay fallas de instalación registradas.</td></tr>';
        tfootTotal.textContent = '0 PCs';
        return;
    }

    let sumaTotalPCs = 0;

    dataList.forEach(item => {
        sumaTotalPCs += item.cantidad;

        let badgeEstadoClass = 'badge-amber';
        let estadoIcon = '<i class="fas fa-clock"></i>';
        if (item.estado === 'Con Solución') {
            badgeEstadoClass = 'badge-green';
            estadoIcon = '<i class="fas fa-check-circle"></i>';
        } else if (item.estado === 'Sin Solución') {
            badgeEstadoClass = 'badge-red';
            estadoIcon = '<i class="fas fa-times-circle"></i>';
        }

        const tagEjemplo = item.esEjemplo ? ' <span style="font-size:0.7rem; color:#64748b; font-weight:normal;">(Ejemplo)</span>' : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <strong style="color:var(--text-primary);">${item.incidencia}</strong>${tagEjemplo}<br>
                <small style="color:var(--text-muted);"><i class="far fa-calendar-alt"></i> ${item.fecha}</small>
            </td>
            <td><strong>${item.colegio}</strong></td>
            <td style="text-align: center;">
                <span class="badge badge-red" style="font-size:0.85rem; padding:5px 12px;">${item.cantidad} PCs</span>
            </td>
            <td>${item.solucion}</td>
            <td style="text-align: center;">
                <span class="badge ${badgeEstadoClass}">${estadoIcon} ${item.estado}</span>
            </td>
            <td style="text-align: center; white-space: nowrap;">
                <button class="btn-edit" onclick="editRegistro(${item.id})" title="Editar registro">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteRegistro(${item.id})" title="Eliminar registro">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tfootTotal.textContent = `${sumaTotalPCs.toLocaleString()} PCs No Instalados`;
}

// Filtrar tabla en tiempo real
function filterFallasTable() {
    const q = document.getElementById('searchFallaInput').value.toLowerCase().trim();
    if (!q) {
        renderTable(fallasData);
        return;
    }

    const filtered = fallasData.filter(item => 
        item.incidencia.toLowerCase().includes(q) ||
        item.colegio.toLowerCase().includes(q) ||
        item.solucion.toLowerCase().includes(q) ||
        item.estado.toLowerCase().includes(q)
    );

    renderTable(filtered);
}

// Renderizar Gráfico de Barras (Chart.js)
function renderChart() {
    const ctx = document.getElementById('chartFallasCanvas').getContext('2d');
    if (chartFallasInstance) chartFallasInstance.destroy();

    const map = new Map();
    fallasData.forEach(item => {
        map.set(item.incidencia, (map.get(item.incidencia) || 0) + item.cantidad);
    });

    const labels = Array.from(map.keys()).map(k => k.length > 30 ? k.substring(0, 28) + '...' : k);
    const dataVals = Array.from(map.values());

    chartFallasInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cantidad de PCs No Instalados',
                data: dataVals,
                backgroundColor: '#ef4444',
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => ` ${c.raw} equipos afectados` } }
            },
            scales: {
                x: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}
