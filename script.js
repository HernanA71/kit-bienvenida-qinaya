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
        title: "Soporte al Usuario",
        description: "Centro técnico para resolver dudas sobre tus equipos y software.",
        url: "bit.ly/Qinaya-Soporte",
        link: "https://qinaya.co/manuals/",
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
        if (item.link.startsWith('http')) {
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

// Chatbot Logic
function toggleChat() {
    const chatWindow = document.getElementById('chatWindow');
    if (chatWindow) {
        chatWindow.classList.toggle('show');
    }
}

function askBot(question) {
    appendMessage(question, 'user-msg');
    const q = question.toLowerCase().trim();

    const matches = (keywords) => {
        return keywords.some(key => q.includes(key));
    };

    setTimeout(() => {
        let response = "";

        // 1. Saludos
        if (matches(['hola', 'buen', 'quien eres'])) {
            response = "¡Hola Profe! ¿En qué puedo servirte hoy? Soy tu IA de apoyo para ayudarte a sacar el máximo provecho tanto a **QinayaLinux** como a este **Kit de Bienvenida**.";
        }
        // 2. QinayaLinux (La Solución Técnica)
        else if (matches(['qinaya linux', 'qinayalinux', 'sistema', 'so', 'operativo', 'instalado', 'pc virtual'])) {
            response = "Profe, **QinayaLinux** es el sistema operativo que tienes instalado en tus computadores. Sus herramientas clave son:\n• **Escritorio Virtual:** Acceso a potencia de Windows en la nube.\n• **Gestor de Software:** Apps precargadas para educación.\n• **Ligereza:** Hace que PCs antiguos vuelen.\n• **Compatibilidad:** Conecta Micro:bit y Arduino sin configuraciones complejas.";
        }
        // 3. Kit de Bienvenida (Los Recursos del Sitio)
        else if (matches(['kit', 'recursos', 'este sitio', 'para que es este kit', 'material'])) {
            response = "Este **Kit de Bienvenida** es tu biblioteca pedagógica. Aquí encuentras:\n• **Video-Tutoriales:** Guías de uso paso a paso.\n• **Recursos Didácticos:** PDFs, presentaciones y manuales.\n• **Notebook Inteligente:** Para chatear con tus documentos.\n• **Juegos Digitales:** Retos interactivos para tus estudiantes.";
        }
        // 4. Herramientas Docentes (Cruce de ambos)
        else if (matches(['herramienta', 'que tengo', 'que ofrece'])) {
            response = "Profe, tienes dos frentes de apoyo:\n1. **En los computadores (QinayaLinux):** Tienes el software de programación, internet seguro y la Nube.\n2. **En este Kit:** Tienes las guías, el FAQ visual para imprimir y el asistente para resolver dudas pedagógicas.";
        }
        // 5. Soporte y Fallas (La Guía Visual)
        else if (matches(['error', 'falla', 'problema', 'negro', 'negra', 'no arranca', 'wifi'])) {
            response = "Profe, para problemas técnicos en el arranque de **QinayaLinux**:\n• Revisa la **Guía Visual de Soporte** en la sección de Recursos.\n• Recuerda el comando `nomodeset` si la pantalla es negra.\n• Si es algo complejo, usa el botón de Soporte Qinaya para chatear con un técnico humano.";
        }
        // 6. Computador Virtual / Nube
        else if (matches(['abrir', 'entrar', 'nube', 'virtual', 'escritorio'])) {
            response = "Profe, para usar el **Computador Virtual** dentro de QinayaLinux:\n1. Inicia sesión en qinaya.co.\n2. Haz clic en 'Acceder a mi Escritorio'.\n¡Así de fácil tendrás un PC de alta potencia en la nube!";
        }
        // 7. Micro:bit / Arduino
        else if (matches(['micro:bit', 'microbit', 'arduino', 'hardware'])) {
            response = "¡Total compatibilidad, Profe! En **QinayaLinux** puedes programar tus tarjetas por USB. Los simuladores los encuentras aquí mismo en el **Kit de Bienvenida** para que los estudiantes practiquen antes de conectar el hardware real.";
        }
        // 8. Despedidas
        else if (matches(['gracias', 'chau', 'adios', 'listo'])) {
            response = "¡Con gusto, Profe! Mucho éxito en su jornada educativa. Si necesita algo más sobre el Kit o la Solución Qinaya, aquí estaré.";
        }
        // Fallback
        else {
            response = "Esa es una buena pregunta, Profe. Para detalles sobre **QinayaLinux** (el sistema) o este **Kit** (los recursos), le recomiendo usar el 'Notebook Inteligente' o consultar el 'Manual Maestro' en la sección de Recursos.";
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

