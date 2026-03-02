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

    // Helper function for more robust matching
    const matches = (keywords) => {
        return keywords.some(key => q.includes(key));
    };

    setTimeout(() => {
        let response = "";

        // 1. Saludos
        if (matches(['hola', 'buen', 'como estas', 'quien eres'])) {
            response = "¡Hola! Soy el Asistente Qinaya, tu IA educativa de apoyo. Mi misión es ayudarte a que la tecnología sea tu mejor aliada en el aula. ¿En qué duda técnica o pedagógica puedo ayudarte hoy, profe?";
        }
        // 2. Utilidad en el aula / Beneficios
        else if (matches(['para que sirve', 'para qué sirve', 'ventajas', 'beneficios', 'aula', 'clase'])) {
            response = "Qinaya transforma tu aula de tres maneras clave:\n\n1. **Equidad:** Da superpoderes a PCs antiguos para que todos tus estudiantes usen software moderno.\n2. **Sin Límites:** Ejecuta herramientas pesadas directamente desde la nube (como Scratch o simuladores).\n3. **Gestión:** Te permite supervisar el avance de tus estudiantes en un entorno controlado y seguro.";
        }
        // 3. Herramientas para Docentes
        else if (matches(['herramienta', 'recursos', 'ofrece', 'tengo', 'que hay'])) {
            response = "En este Kit tienes todo lo necesario:\n• **Notebook Inteligente:** Analiza fuentes y crea cuestionarios con IA.\n• **Video-Tutoriales:** Guías paso a paso de uso técnico.\n• **Guía Visual de Soporte:** Un FAQ listo para imprimir ante cualquier error.\n• **Zona de Juegos:** Actividades interactivas de Scratch y electrónica.";
        }
        // 4. Computador Virtual / Acceso Escritorio
        else if (matches(['computador virtual', 'escritorio', 'entrar', 'abrir', 'como accedo'])) {
            response = "Acceder a tu PC virtual es muy fácil:\n1. Entra a **qinaya.co** e inicia sesión.\n2. Haz clic en el botón **'Acceder a mi Escritorio'**.\n3. En pocos segundos, verás tu sistema QinayaLinux listo para trabajar desde cualquier navegador.";
        }
        // 5. Agradecimientos / Despedidas
        else if (matches(['gracias', 'chau', 'adios', 'chao', 'listo', 'perfecto'])) {
            response = "¡Espero que esto te sea de gran utilidad! Recuerda que la tecnología en tus manos transforma vidas. ¡Mucho éxito en tu jornada educativa, profe!";
        }
        // 6. Pantalla en negro (Nomodeset)
        else if (matches(['pantalla', 'negro', 'negra', 'no arranca'])) {
            response = "Si la pantalla está en negro tras el arranque:\n1. En el menú de GRUB, presiona 'e'.\n2. Busca 'quiet splash' y agrega al final: **'nomodeset'**.\n3. Presiona F10 para arrancar. Luego instala los drivers privativos desde 'Controladores adicionales'.";
        }
        // 7. Micro:bit / Arduino
        else if (matches(['micro:bit', 'microbit', 'arduino', 'hardware'])) {
            response = "¡Compatibilidad total! Qinaya reconoce tus tarjetas Micro:bit y Arduino por USB. Puedes usar los simuladores del Kit o programar físicamente sin instalar drivers pesados en el PC local.";
        }
        // 8. Quiénes son / Misión
        else if (matches(['que es qinaya', 'quienes son', 'impacto'])) {
            response = "Somos una empresa colombiana que convierte la brecha digital en oportunidad. Reciclamos hardware y usamos el poder de la nube para llevar educación de calidad a donde más se necesita.";
        }
        // 9. STB / Setup
        else if (matches(['stb', 'cajita', 'mini pc', 'boot', 'tecla'])) {
            response = "Recuerda: HP usa F9, Dell/Lenovo usan F12 para el Boot Menu. Si usas el **STB Qinaya**, recuerda que puedes resetearlo con un alfiler en el puerto AV si necesitas repararlo.";
        }
        // Fallback
        else {
            response = "Es una excelente pregunta, profe. Como soy un bot de soporte rápido, quizás no tengo el detalle exacto. Te recomiendo revisar nuestro **'Notebook Inteligente'** o el **'Manual Maestro'** en la sección de Recursos para una respuesta a profundidad.";
        }

        appendMessage(response, 'bot-msg');
    }, 800);
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

