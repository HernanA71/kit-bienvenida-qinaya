const menuData = [
    {
        title: "Guía para Docentes",
        description: "Recursos y manuales para el aprovechamiento tecnológico en el aula.",
        url: "Entrar al Panel →",
        link: "recursos.html",
        icon: "📁",
        colorClass: "green"
    },
    {
        title: "Video-Tutoriales",
        description: "Aprende paso a paso con nuestros tutoriales visuales de Qinaya.",
        url: "Ver Tutoriales →",
        link: "video-tutoriales.html",
        icon: "▶",
        colorClass: "red"
    },
    {
        title: "Centro de Ayuda FAQ",
        description: "¿Tienes dudas técnicas? Encuentra soluciones y videos paso a paso.",
        url: "Ver Preguntas Frecuentes →",
        link: "faq.html",
        target: "_blank",
        icon: "⚙",
        colorClass: "orange"
    },
    {
        title: "Zona de Juegos",
        description: "¡Rétate! Juegos interactivos sobre Arduino, Micro:bit y Nube.",
        url: "¡Jugar Ahora! →",
        link: "juegos.html",
        icon: "🎮",
        colorClass: "purple"
    }
];

function renderMenu() {
    const menuGrid = document.getElementById('menu-grid');
    if (!menuGrid) return;
    menuGrid.innerHTML = '';

    menuData.forEach((item) => {
        const itemElement = document.createElement('a');
        itemElement.href = item.link;

        // Prioritize explicit target from data
        if (item.target) {
            itemElement.target = item.target;
        } else if (item.link.startsWith('http')) {
            itemElement.target = "_blank";
        }

        itemElement.className = `menu-item ${item.colorClass}`;

        itemElement.innerHTML = `
            <div class="icon">${item.icon}</div>
            <div class="item-content">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <span class="url">${item.url}</span>
            </div>
        `;

        menuGrid.appendChild(itemElement);
    });
}

// Scroll to Top Logic
function initScrollToTop() {
    const fab = document.getElementById('scrollToTop');
    if (!fab) return;

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
        if (scrollTop > 100) {
            fab.classList.add('show');
        } else {
            fab.classList.remove('show');
        }
    });

    fab.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

let chatState = 'NORMAL';
let ticketData = { name: '', school: '', issue: '', datetime: '' };

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz1uJKZlXIxGYtfn4-t1ExeGt4XIk4rGC30hrMKgsIxV-M7nWu4TSNN_bivYov5-MVq6Q/exec';

function sendTicketToGoogle(data) {
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
            action: 'createTicket',
            name: data.name,
            school: data.school,
            issue: data.issue,
            datetime: data.datetime
        })
    })
        .then(response => {
            appendMessage(`✅ ¡Listo, Profe! Tu solicitud ha sido guardada en nuestra base de datos con tu preferencia de horario: **${data.datetime}**. El equipo técnico te confirmará la visita.`, 'bot-msg');
        })
        .catch(error => {
            appendMessage("❌ Ups, parece que mi conexión a la base de datos de los técnicos falló en este momento. Inténtalo de nuevo más tarde profe.", 'bot-msg');
        });
}

function logQuestionToGoogle(question) {
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
            action: 'logQuestion',
            question: question
        })
    }).catch(error => console.error("Error logging question:", error));
}

// Chatbot Logic
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
        chatWindow.classList.toggle('show');
    }
}

function askBot(question) {
    appendMessage(question, 'user-msg');

    // Solo registrar preguntas sueltas que no formen parte del llenado del ticket
    if (chatState === 'NORMAL') {
        logQuestionToGoogle(question);
    }

    const q = question.toLowerCase().trim();

    const matches = (keywords) => {
        return keywords.some(key => q.includes(key));
    };

    setTimeout(() => {
        let response = "";

        // Máquina de estados para recolectar datos del ticket
        if (chatState === 'AWAITING_NAME') {
            ticketData.name = question;
            chatState = 'AWAITING_SCHOOL';
            response = `Gracias, ${question}. ¿De qué institución educativa (colegio) nos escribes?`;
        } else if (chatState === 'AWAITING_SCHOOL') {
            ticketData.school = question;
            chatState = 'AWAITING_ISSUE';
            response = `Entendido. Por favor, descríbeme con detalle cuál es la falla que presentan los equipos o qué tipo de soporte necesitas para que el técnico vaya preparado.`;
        } else if (chatState === 'AWAITING_ISSUE') {
            ticketData.issue = question;
            chatState = 'AWAITING_DATETIME';
            response = `Perfecto. Por último, ¿En qué fecha y hora te gustaría recibir la visita del técnico? (Ejemplo: "Mañana a las 10 am" o "El martes a las 2 pm")`;
        } else if (chatState === 'AWAITING_DATETIME') {
            ticketData.datetime = question;
            chatState = 'NORMAL';
            response = `¡Tomo nota, Profe ${ticketData.name}! Estoy enviando tu solicitud a la central técnica para agendar la cita para el horario sugerido (${ticketData.datetime})...`;
            appendMessage(response, 'bot-msg');

            // Enviar a Google Apps Script y salir para no agregar doble mensaje
            sendTicketToGoogle(ticketData);
            return;
        } else {
            // FLUJO NORMAL DEL BOT

            // 1. Saludos
            if (matches(['hola', 'buen', 'quien eres', 'nombre'])) {
                response = "¡Hola! Soy **QinayaBot** tu asistente. Mi misión es apoyarte para que la tecnología sea tu mejor aliada en el aula. ¿En qué puedo ayudarte hoy profe?";
            }
            // 2. Ticket de Soporte (Trigger)
            else if (matches(['tecnico', 'técnico', 'visita', 'agendar', 'soporte tecnico', 'fallan los equipos', 'fallos', 'reparar'])) {
                chatState = 'AWAITING_NAME';
                response = "Entiendo Profe, lamento los inconvenientes. Para agendar una visita técnica y apoyarte lo más pronto posible, por favor indícame tu **Nombre Completo**.";
            }
            // 2.1 Preguntas sobre la visita agendada
            else if (matches(['cuando', 'cuándo', 'qué día', 'que hora', 'fecha', 'cita', 'horario'])) {
                if (ticketData.name !== '') {
                    response = `Profe ${ticketData.name}, tu visita quedó registrada con preferencia para: **${ticketData.datetime}**. ¡El técnico te confirmará pronto su llegada!`;
                } else {
                    response = "Aún no hemos agendado ninguna visita. Si tienes alguna falla y necesitas un técnico, escríbeme: **'visita técnica'**.";
                }
            }
            // 3. QinayaLinux (La Solución Técnica)
            else if (matches(['qinaya linux', 'qinayalinux', 'sistema', 'so', 'operativo', 'instalado', 'pc virtual'])) {
                response = "Profe, **QinayaLinux** es el sistema operativo que tienes instalado en tus computadores. Sus herramientas clave son:\n• **Escritorio Virtual:** Acceso a potencia de Windows en la nube.\n• **Gestor de Software:** Apps precargadas para educación.\n• **Ligereza:** Hace que PCs antiguos vuelen.\n• **Compatibilidad:** Conecta Micro:bit y Arduino sin configuraciones complejas.";
            }
            // 4. Kit de Bienvenida (Los Recursos del Sitio)
            else if (matches(['kit', 'recursos', 'este sitio', 'para que es este kit', 'material'])) {
                response = "Este **Kit de Bienvenida** es tu biblioteca pedagógica. Aquí encuentras:\n• **Video-Tutoriales:** Guías de uso paso a paso.\n• **Recursos Didácticos:** PDFs, presentaciones y manuales.\n• **Notebook Inteligente:** Para chatear con tus documentos.\n• **Juegos Digitales:** Retos interactivos para tus estudiantes.";
            }
            // 5. Herramientas Docentes (Cruce de ambos)
            else if (matches(['herramienta', 'que tengo', 'que ofrece'])) {
                response = "Profe, tienes dos frentes de apoyo:\n1. **En los computadores (QinayaLinux):** Tienes el software de programación, internet seguro y la Nube.\n2. **En este Kit:** Tienes las guías, el FAQ visual para imprimir y el asistente para resolver dudas pedagógicas.";
            }
            // 6. Soporte y Fallas menores (La Guía Visual)
            else if (matches(['error', 'falla', 'problema', 'negro', 'negra', 'no arranca', 'wifi'])) {
                response = "Profe, revisa primero la **Guía Visual de Soporte** en la sección de Recursos.\n• Recuerda el comando `nomodeset` si la pantalla es negra.\n• Si ya lo leíste y necesitas revisión presencial, escríbeme: **'necesito agendar visita técnica'**.";
            }
            // 7. Computador Virtual / Nube
            else if (matches(['abrir', 'entrar', 'nube', 'virtual', 'escritorio', 'mi qinaya'])) {
                response = "1. Al iniciar tu computador con Qinaya Linux y estar en el escritorio o en tus Apps, busca el Icono de MIQinaya el cual es tu entrada a tu computador en la Nube, a tu escritorio virtual desde donde podras trabajar todas tus aplicaciones con una super potencia y navegar por internet a gran velocidad!";
            }
            // 8. Micro:bit / Arduino / Scratch
            else if (matches(['micro:bit', 'microbit', 'arduino', 'hardware', 'scratch', 'makecode', 'logica'])) {
                response = "¡Total compatibilidad, Profe! En **QinayaLinux** puedes programar tus tarjetas por USB. Los simuladores de **Scratch** y **MakeCode** los encuentras aquí mismo en la **Zona de Juegos** para que practiques antes de conectar el hardware real.";
            }
            // 9. Despedidas
            else if (matches(['gracias', 'chau', 'adios', 'listo'])) {
                response = "¡Con gusto, Profe! Mucho éxito en su jornada educativa. Si necesita algo más sobre el Kit o la Solución Qinaya, aquí estaré.";
            }
            // Fallback
            else {
                response = "Esa es una buena pregunta, Profe. Si necesitas reportar una falla escribeme **'visita técnica'**. Para detallar el uso del Kit, te recomiendo consultar el 'Manual Maestro' en la sección de Recursos.";
            }
        }

        appendMessage(response, 'bot-msg');
    }, 600);
}

function appendMessage(text, type) {
    const chatBody = document.getElementById('chatBody');
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${type}`;
    msgDiv.innerText = text;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (text) {
        askBot(text);
        input.value = '';
    }
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
    renderMenu();
    initScrollToTop();

    // Chat trigger
    const chatTrigger = document.getElementById('chatTrigger');
    if (chatTrigger) {
        chatTrigger.addEventListener('click', toggleChat);
    }

    // Enter key for chat
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }
});

