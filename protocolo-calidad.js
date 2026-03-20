// =============================================
// PROTOCOLO QINAYA — APP DE CULTURA CPE
// Solo para funcionarios internos de Qinaya
// =============================================

const ROLES = {
    1: {
        title: 'Desarrollador Backend',
        subtitle: 'Creador de la ISO Base',
        icon: 'fas fa-server',
        colorClass: 'blue',
        phase: 'CREAR',
        tagClass: 'blue-tag',
        culture: {
            title: '¿Por qué la cultura CPE es vital para ti?',
            icon: 'fas fa-lightbulb',
            html: `
                <p>Tú construyes los <strong>cimientos</strong>. La ISO que creas es lo primero que arranca cuando un niño enciende un computador Qinaya en un colegio. Si esa base tiene un error, <strong>todo lo que viene después falla</strong>: el frontend, la instalación, la capacitación.</p>
                <p>Tu trabajo no termina cuando compilas la ISO. Termina cuando la <strong>pruebas tú mismo</strong> y verificas que arranca, que los servicios cargan, que los drivers responden.</p>
                <div class="culture-example" style="border-color:var(--blue); background:rgba(0,210,255,0.04)">
                    <strong>💡 Ejemplo concreto:</strong> Antes de entregar una ISO al equipo de Frontend, ¿la arrancaste en un equipo de prueba? ¿Verificaste que el Micro:bit se reconoce? Si la respuesta es no, entonces estás "pasando el problema al que sigue" — y eso es lo que queremos cambiar.
                </div>
            `
        },
        quiz: [
            '¿Arranco la ISO en un equipo real (o VM) antes de entregarla al Frontend?',
            '¿Verifico que todos los servicios base (red, audio, pantalla) cargan correctamente?',
            '¿Pruebo que los drivers de Micro:bit funcionan antes de marcar la ISO como lista?',
            '¿Pruebo que los drivers de Arduino están incluidos y funcionales?',
            '¿Genero la ISO con un número de versión y fecha identificable?',
            '¿Entrego la ISO con una nota documentando qué cambió respecto a la versión anterior?',
        ]
    },
    2: {
        title: 'Desarrollador Frontend',
        subtitle: 'Entorno e Interfaz de Usuario',
        icon: 'fas fa-palette',
        colorClass: 'purple',
        phase: 'CREAR',
        tagClass: 'purple-tag',
        culture: {
            title: '¿Por qué la cultura CPE es vital para ti?',
            icon: 'fas fa-lightbulb',
            html: `
                <p>Tú eres la <strong>cara visible</strong> de Qinaya. Cuando un docente o un estudiante abre el computador, lo primero que ve es tu trabajo: la interfaz, los botones, los lanzadores de apps. Si algo no abre, si se ve mal, si hay un error en pantalla — la primera impresión de Qinaya se rompe.</p>
                <p>No se trata solo de que "se vea bonito". Se trata de que <strong>cada lanzador abra lo que debe abrir</strong>, que la transición entre el entorno local y la nube sea fluida, y que no haya errores en consola que afecten la experiencia.</p>
                <div class="culture-example" style="border-color:var(--purple); background:rgba(138,43,226,0.04)">
                    <strong>💡 Ejemplo concreto:</strong> Antes de entregar una actualización del entorno, ¿hiciste clic en CADA lanzador para verificar que abre? ¿Probaste en diferentes resoluciones? ¿Revisaste la consola del navegador por errores? Esos 15 minutos de prueba te ahorran horas de soporte.
                </div>
            `
        },
        quiz: [
            '¿Verifico que la interfaz carga completamente sin errores visuales antes de entregar?',
            '¿Hago clic en cada lanzador de aplicaciones para confirmar que abre correctamente?',
            '¿Pruebo la navegación entre el entorno local y la nube antes de marcar como terminado?',
            '¿Verifico que el diseño se adapta bien a diferentes resoluciones de pantalla?',
            '¿Reviso la consola del navegador para asegurarme de que no hay errores de JavaScript?',
            '¿Entrego al Técnico de Instalación con notas claras de qué cambió en esta versión?',
        ]
    },
    3: {
        title: 'Técnico de Instalación',
        subtitle: 'El Validador del "Puente" — Hardware',
        icon: 'fas fa-screwdriver-wrench',
        colorClass: 'green',
        phase: 'PROBAR',
        tagClass: 'green-tag',
        culture: {
            title: '¿Por qué la cultura CPE es vital para ti?',
            icon: 'fas fa-lightbulb',
            html: `
                <p>Tú eres el <strong>último filtro</strong> antes del cliente. Si el Backend hizo algo mal, o el Frontend tiene un error, tú lo deberías detectar durante la instalación. Pero solo lo detectas si <strong>realmente pruebas cada equipo</strong>, no si solo lo instalas y te vas.</p>
                <p>Tu rol no es solo "poner la ISO y encender". Tu rol es <strong>validar que todo funciona como si tú fueras el usuario final</strong>. Si conectas un Micro:bit y no se reconoce, NO lo dejas así — lo reportas y no entregas hasta que funcione.</p>
                <div class="culture-example" style="border-color:var(--green); background:rgba(0,255,135,0.04)">
                    <strong>💡 Ejemplo concreto:</strong> Llegas al colegio, instalas los 40 equipos. ¿Encendiste CADA uno? ¿Conectaste un teclado, un mouse, un Micro:bit en al menos una muestra? ¿O te fuiste apenas terminaste de instalar la imagen? La diferencia entre "instalar" y "validar" es lo que nos separa de la competencia.
                </div>
            `
        },
        quiz: [
            '¿Enciendo cada equipo instalado para verificar que el software arranca correctamente?',
            '¿Conecto un Micro:bit y verifico que el sistema operativo lo reconoce?',
            '¿Pruebo que el Arduino puede ser detectado y programado desde el equipo?',
            '¿Verifico teclado, mouse y auriculares (incluyendo nivel de batería)?',
            '¿Pruebo la conectividad de red (WiFi/Ethernet) en cada sala de instalación?',
            '¿Verifico cámara y micrófono si la configuración del cliente lo requiere?',
            '¿Me aseguro de que cada equipo tiene imagen limpia, sin sesiones anteriores?',
            '¿Documento la instalación con foto o acta de entrega antes de irme del sitio?',
        ]
    },
    4: {
        title: 'Académico',
        subtitle: 'Maestría en la Solución — UX Pedagógica',
        icon: 'fas fa-chalkboard-teacher',
        colorClass: 'orange',
        phase: 'ENTREGAR',
        tagClass: 'orange-tag',
        culture: {
            title: '¿Por qué la cultura CPE es vital para ti?',
            icon: 'fas fa-lightbulb',
            html: `
                <p>Tú eres el puente que hace que la solución Qinaya sea realidad para el cliente final (docentes, empresarios o estudiantes). Tu misión no es solo 'dar una capacitación', sino asegurar que el cliente <strong>domine cada parte de la solución</strong>.</p>
                <p>El éxito pedagógico depende de que el usuario entienda desde el hardware (STB) hasta la Nube. Si el docente o empresario se siente confundido con herramientas nuevas como Linux u Ofimática libre, el proceso de calidad se detiene en su mano. Por eso, tu <strong>"Marcha Blanca"</strong> debe anticipar cada obstáculo que ellos puedan tener.</p>
                <div class="culture-example" style="border-color:var(--orange); background:rgba(255,140,0,0.04)">
                    <strong>💡 Ejemplo concreto:</strong> Antes de ir al colegio o empresa, ¿probaste tú mismo cómo se guardan archivos desde el PC Virtual a la Nube? ¿Sabes explicar cómo abrir la suite de Ofimática libre si el cliente solo conoce Microsoft? Resolver esto antes evita que el cliente pierda confianza en la tecnología.
                </div>
            `
        },
        quiz: [
            '¿Le enseñé al cliente cómo manejar el STB (Set Top Box) y acceder al Computador Virtual?',
            '¿Capacité al cliente en el uso de Qinaya tanto en Android como en el entorno PC Virtual?',
            '¿Si la solución es sobre PC local con Linux, aseguré que el cliente sepa navegar ese entorno?',
            '¿Expliqué el uso de las herramientas de Ofimática de libre acceso y sus diferencias con las tradicionales?',
            '¿Mostré detalladamente cómo guardar, subir y descargar archivos en la Nube de Qinaya?',
            '¿Verifiqué que el cliente dominó el paso de archivos entre el computador local y el virtual?',
            '¿Hice una "Marcha Blanca" simulando la sesión para detectar dudas técnicas antes del cliente?',
            '¿Confirmé que el usuario puede trabajar de forma autónoma sin depender de soporte constante?',
        ]
    },
    5: {
        title: 'Especialista en Virtualización',
        subtitle: 'Administrador de Máquinas Virtuales',
        icon: 'fas fa-cloud',
        colorClass: 'red',
        phase: 'CREAR',
        tagClass: 'red-tag',
        culture: {
            title: '¿Por qué la cultura CPE es vital para ti?',
            icon: 'fas fa-lightbulb',
            html: `
                <p>Las máquinas virtuales son la <strong>extensión en la nube</strong> de cada computador Qinaya. Cuando un docente abre el entorno virtual, espera que funcione <strong>inmediatamente</strong>, sin pasos extra, sin configuración, sin errores. Si la VM no carga, se pierde la clase.</p>
                <p>Tu cultura CPE se demuestra cuando no solo clonas las VMs, sino que <strong>verificas que el clon funciona</strong>: que el usuario puede acceder, que no hay errores de red, que el software educativo está pre-instalado.</p>
                <div class="culture-example" style="border-color:var(--red); background:rgba(255,77,106,0.04)">
                    <strong>💡 Ejemplo concreto:</strong> Clonas 40 VMs para un colegio nuevo. ¿Accediste a al menos 5 de ellas para verificar que arrancan? ¿O confiaste ciegamente en que el proceso de clonación fue perfecto? Un solo error de red en la plantilla se multiplica por 40 si no lo compruebas.
                </div>
            `
        },
        quiz: [
            '¿Realizo una prueba de acceso después de clonar cada lote de VMs?',
            '¿Verifico que el usuario puede acceder directamente sin pasos de configuración extra?',
            '¿Pruebo el rendimiento de la VM para asegurar que no hay lag excesivo?',
            '¿Confirmo que el software educativo está pre-instalado y funcional en la VM?',
            '¿Hago una prueba de conexión desde un equipo cliente real antes de marcar como listo?',
            '¿Documento el número de VMs activas y sus asignaciones por colegio/sede?',
        ]
    },
    6: {
        title: 'Asistente Administrativo y Comercial',
        subtitle: 'Gestión de Agenda, Reuniones y Almacén',
        icon: 'fas fa-handshake',
        colorClass: 'gold',
        phase: 'ENTREGAR',
        tagClass: 'gold-tag',
        culture: {
            title: '¿Por qué la cultura CPE es vital para ti?',
            icon: 'fas fa-lightbulb',
            html: `
                <p>Tú eres quien <strong>hace que las cosas pasen</strong>. Gestionas la agenda de la CEO, coordinas reuniones entre Qinaya y los clientes, y te aseguras de que cada encuentro se lleve a cabo con éxito. Si una reunión falla por falta de confirmación, <strong>la imagen de toda la empresa se afecta</strong>.</p>
                <p>Además, cumples un rol clave como <strong>almacenista</strong>: eres responsable de que el hardware que se entrega al cliente esté revisado, completo y en perfecto estado. Un equipo que llega incompleto o sin verificar genera desconfianza desde el primer minuto.</p>
                <p>Tu cultura CPE se aplica en dos frentes: <strong>CREAR</strong> la cita o la orden de despacho con todos los datos, <strong>PROBAR</strong> que todo está confirmado y el hardware revisado, y <strong>ENTREGAR</strong> con la confianza de que nada falta y nadie queda desinformado.</p>
                <div class="culture-example" style="border-color:var(--gold); background:rgba(255,215,0,0.04)">
                    <strong>💡 Ejemplo concreto:</strong> La CEO tiene una reunión con un cliente el jueves. ¿Confirmaste con el cliente que la reunión sigue en pie? ¿La CEO tiene toda la información actualizada? ¿Si es una entrega de equipos, verificaste que las cajas están completas con todos los periféricos? Una caja que llega sin el cable de poder o sin el mouse destruye la primera impresión.
                </div>
            `
        },
        quiz: [
            '¿Agendo cada reunión de la CEO con todos los datos: fecha, hora, lugar, contacto y objetivo?',
            '¿Reconfirmo con el cliente 24-48 horas antes de cada reunión que la cita sigue en pie?',
            '¿Me aseguro de que la CEO tiene toda la información necesaria antes de cada reunión?',
            '¿Confirmo las condiciones del sitio (sala, internet, energía) cuando aplica?',
            '¿Mantengo informados tanto al cliente como al equipo interno sobre cualquier cambio de agenda?',
            '¿Reviso físicamente el hardware antes de despacharlo (equipo completo, cables, periféricos)?',
            '¿Verifico que cada caja de equipos tiene todo lo necesario antes de entregarla al cliente?',
            '¿Llevo un registro organizado de qué hardware se entregó, a quién y cuándo?',
            '¿Hago seguimiento post-reunión o post-entrega para confirmar que todo estuvo bien?',
        ]
    }
};

// Color map for dynamic styling
const COLOR_MAP = {
    blue: { main: '#00d2ff', bg: 'rgba(0,210,255,', border: 'rgba(0,210,255,' },
    purple: { main: '#8a2be2', bg: 'rgba(138,43,226,', border: 'rgba(138,43,226,' },
    green: { main: '#00ff87', bg: 'rgba(0,255,135,', border: 'rgba(0,255,135,' },
    orange: { main: '#ff8c00', bg: 'rgba(255,140,0,', border: 'rgba(255,140,0,' },
    red: { main: '#ff4d6a', bg: 'rgba(255,77,106,', border: 'rgba(255,77,106,' },
    gold: { main: '#ffd700', bg: 'rgba(255,215,0,', border: 'rgba(255,215,0,' },
};

let currentRole = null;

// ============================
// NAVEGACIÓN ENTRE PANTALLAS
// ============================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================
// MOSTRAR ROL SELECCIONADO
// ============================
function showRole(roleId) {
    currentRole = roleId;
    const role = ROLES[roleId];
    const c = COLOR_MAP[role.colorClass];

    // Header
    document.getElementById('detailHeader').innerHTML = `
        <div class="dh-icon" style="background:${c.bg}0.12); color:${c.main}">
            <i class="${role.icon}"></i>
        </div>
        <div class="dh-text">
            <h2>${role.title}</h2>
            <div class="dh-sub">${role.subtitle}</div>
        </div>
        <div class="dh-tag-group">
            <span class="dh-tag-pill ${role.phase === 'CREAR' ? 'active' : ''}" 
                  style="${role.phase === 'CREAR' ? `background:${c.bg}0.15); color:${c.main}` : ''}">CREAR</span>
            <span class="dh-tag-pill ${role.phase === 'PROBAR' ? 'active' : ''}" 
                  style="${role.phase === 'PROBAR' ? `background:${c.bg}0.15); color:${c.main}` : ''}">PROBAR</span>
            <span class="dh-tag-pill ${role.phase === 'ENTREGAR' ? 'active' : ''}" 
                  style="${role.phase === 'ENTREGAR' ? `background:${c.bg}0.15); color:${c.main}` : ''}">ENTREGAR</span>
        </div>
    `;

    // Culture explanation
    document.getElementById('detailCulture').innerHTML = `
        <h3><i class="${role.culture.icon}" style="color:${c.main}"></i> ${role.culture.title}</h3>
        <div class="culture-text">${role.culture.html}</div>
    `;

    // Quiz / Self-evaluation
    const quizItemsHTML = role.quiz.map((q, idx) => `
        <li class="quiz-item" data-idx="${idx}">
            <div class="qi-toggle">
                <button class="qi-btn btn-yes" onclick="toggleQuiz(${idx}, 'yes', event)" title="Sí, lo hago">✓</button>
                <button class="qi-btn btn-no" onclick="toggleQuiz(${idx}, 'no', event)" title="No, debo mejorar">✗</button>
            </div>
            <span class="qi-text">${q}</span>
        </li>
    `).join('');

    document.getElementById('detailQuiz').innerHTML = `
        <h3><i class="fas fa-clipboard-question" style="color:${c.main}"></i> Autoevaluación: ¿Aplicas CPE en tu día a día?</h3>
        <p class="quiz-desc">Responde honestamente. Esto es para tu aprendizaje, no es una evaluación de desempeño. Marca <strong style="color:var(--green)">✓ Sí</strong> o <strong style="color:var(--red)">✗ No</strong> en cada pregunta.</p>
        <ul class="quiz-list">${quizItemsHTML}</ul>
        <div class="quiz-progress">
            <span style="font-size:0.85rem; color:var(--muted);">Respondidas:</span>
            <div class="qp-bar"><div class="qp-fill" id="quizFill" style="background:linear-gradient(90deg,${c.main},${c.bg}0.6))"></div></div>
            <span class="qp-label" id="quizLabel">0/${role.quiz.length}</span>
        </div>
    `;

    // Hide result initially
    document.getElementById('detailResult').classList.remove('visible');
    document.getElementById('detailResult').innerHTML = '';

    showScreen('screenDetail');
}

// ============================
// TOGGLE QUIZ ANSWER
// ============================
function toggleQuiz(idx, answer, event) {
    event.stopPropagation();
    const item = document.querySelector(`.quiz-item[data-idx="${idx}"]`);
    const yesBtn = item.querySelector('.btn-yes');
    const noBtn = item.querySelector('.btn-no');

    // Reset
    yesBtn.classList.remove('selected');
    noBtn.classList.remove('selected');
    item.classList.remove('yes', 'no');

    // Set
    if (answer === 'yes') {
        yesBtn.classList.add('selected');
        item.classList.add('yes');
    } else {
        noBtn.classList.add('selected');
        item.classList.add('no');
    }

    updateQuizProgress();
}

function updateQuizProgress() {
    const role = ROLES[currentRole];
    const total = role.quiz.length;
    const answered = document.querySelectorAll('.quiz-item.yes, .quiz-item.no').length;
    const yesCount = document.querySelectorAll('.quiz-item.yes').length;
    const pct = Math.round((answered / total) * 100);

    document.getElementById('quizFill').style.width = pct + '%';
    document.getElementById('quizLabel').textContent = `${answered}/${total}`;

    // Show result when all are answered
    if (answered === total) {
        showResult(yesCount, total);
    }
}

// ============================
// RESULTADO FINAL
// ============================
function showResult(yesCount, total) {
    const pct = Math.round((yesCount / total) * 100);
    const role = ROLES[currentRole];
    const c = COLOR_MAP[role.colorClass];
    let icon, title, desc, bgStyle;

    if (pct >= 85) {
        icon = '🏆';
        title = '¡Excelente! Todo listo para la entrega';
        desc = `Has verificado <strong style="color:var(--green)">${yesCount} de ${total}</strong> puntos clave de calidad. Estás listo para generar tu Acta de Entrega y pasar al siguiente dueño de proceso.`;
        bgStyle = 'background:rgba(0,255,135,0.06); border:1px solid rgba(0,255,135,0.15)';
    } else {
        icon = '🔧';
        title = 'Revisión técnica sugerida';
        desc = `Has marcado <strong style="color:var(--green)">${yesCount} de ${total}</strong> tareas como realizadas. Te recomendamos completar todos los puntos antes de realizar la entrega formal para garantizar la calidad total.`;
        bgStyle = 'background:rgba(255,77,106,0.06); border:1px solid rgba(255,77,106,0.15)';
    }

    const resultEl = document.getElementById('detailResult');
    resultEl.innerHTML = `
        <div class="result-icon">${icon}</div>
        <div class="result-title">${title}</div>
        <div class="result-desc">${desc}</div>
        
        <div class="signature-setup">
            <p><i class="fas fa-signature"></i> Nombre del funcionario que entrega:</p>
            <input type="text" id="signerName" class="input-name" placeholder="Escribe tu nombre completo...">
            <div class="result-actions">
                <button class="btn-print" onclick="printActa()">
                    <i class="fas fa-file-pdf"></i> Generar Acta de Calidad
                </button>
                <button class="btn-retry" onclick="showScreen('screenRoles')">
                    Explorar otro rol
                </button>
            </div>
        </div>
    `;
    resultEl.style = bgStyle;
    resultEl.classList.add('visible');
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ============================
// GENERAR ACTA PARA IMPRESIÓN
// ============================
function printActa() {
    const name = document.getElementById('signerName').value.trim() || '__________________________';
    const role = ROLES[currentRole];
    const date = new Date().toLocaleDateString();

    // Generar contenido del acta
    const printableArea = document.getElementById('printableActa');

    // Obtener qué items se marcaron como SI
    const items = document.querySelectorAll('.quiz-item');
    let checklistHTML = '';
    items.forEach((item, i) => {
        const isYes = item.classList.contains('yes');
        const text = item.querySelector('.qi-text').textContent;
        checklistHTML += `
            <li>
                <div class="print-check-box">${isYes ? '✓' : ''}</div>
                <div>${text}</div>
            </li>
        `;
    });

    printableArea.innerHTML = `
        <div class="print-header">
            <img src="logo Qinaya.png" class="print-logo" onerror="this.style.display='none'">
            <div class="print-title">
                <h1>ACTA DE ENTREGA DE PROCESO</h1>
                <p>Protocolo de Calidad Qinaya — Tecnología que Transforma</p>
            </div>
            <div style="font-size: 9pt; text-align: right;">
                <b>Fecha:</b> ${date}<br>
                <b>Versión:</b> 2.0
            </div>
        </div>

        <div class="print-body">
            <div class="print-section">
                <h3>DATOS DEL PROCESO</h3>
                <p><b>Rol Responsable:</b> ${role.title}</p>
                <p><b>Protocolo Aplicado:</b> Ciclo CPE (Crear · Probar · Entregar)</p>
                <p><b>Funcionario Responsable:</b> ${name}</p>
            </div>

            <div class="print-section">
                <h3>CHECKLIST DE CALIDAD VERIFICADO</h3>
                <p style="font-size: 9pt; color: #666; margin-bottom: 10px;">
                    El funcionario responsable certifica que ha realizado las siguientes pruebas y validaciones técnicas antes de realizar la entrega al siguiente dueño de proceso.
                </p>
                <ul class="print-checklist">
                    ${checklistHTML}
                </ul>
            </div>

            <div class="print-section">
                <h3>CERTIFICACIÓN DE CALIDAD</h3>
                <p>
                    Por medio de la presente, confirmo que he seguido el <b>Protocolo Qinaya: Tecnología que Transforma, Calidad que Cumple</b>. 
                    Certifico que las pruebas realizadas garantizan que el producto/proceso entregado cumple con los estándares 
                    necesarios para que la siguiente etapa pueda proceder sin errores técnicos.
                </p>
            </div>

            <div class="print-signatures">
                <div class="sig-line">
                    <span class="sig-label">${name}</span>
                    <span class="sig-sub">Entrega (Responsable de ${role.title})</span>
                </div>
                <div class="sig-line">
                    <span class="sig-label">__________________________</span>
                    <span class="sig-sub">Recibe (Siguiente Dueño de Proceso)</span>
                </div>
            </div>
        </div>

        <div class="print-footer">
            Qinaya — Computadores que Transforman la Educación en Colombia<br>
            Este documento es un registro interno de calidad para asegurar el éxito en la implementación.
        </div>
    `;

    // Disparar impresión
    window.print();
}

// ============================
// TOGGLE TEMA CLARO / OSCURO
// ============================
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('themeIcon');
    body.classList.toggle('light-mode');
    const isLight = body.classList.contains('light-mode');
    icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
    localStorage.setItem('qinaya_protocolo_theme', isLight ? 'light' : 'dark');
}

// Cargar tema guardado al inicio
(function loadTheme() {
    const saved = localStorage.getItem('qinaya_protocolo_theme');
    if (saved === 'light') {
        document.body.classList.add('light-mode');
        // El icono se actualiza después de que el DOM carga si es necesario, 
        // pero aquí lo podemos hacer directo si el elemento ya existe.
        window.addEventListener('DOMContentLoaded', () => {
            document.getElementById('themeIcon').className = 'fas fa-moon';
        });
    }
})();
