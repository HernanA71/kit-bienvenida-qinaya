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

    // Simulate thinking
    setTimeout(() => {
        let response = "";

        // 1. Definition / About Qinaya
        if (q.includes('qué es qinaya') || q.includes('que es qinaya') || q.includes('quienes son') || q.includes('qinaya?')) {
            response = "Qinaya es una plataforma integral que busca cerrar la brecha digital en Colombia. Convertimos equipos antiguos u obsoletos en computadores de alto rendimiento mediante computación en la nube, permitiendo que estudiantes de estratos 1 y 2 accedan a tecnología de punta.";
        }
        // 2. Installation / Linux
        else if (q.includes('instalar') || q.includes('instalacion') || q.includes('linux') || q.includes('manual')) {
            response = "Para instalar QinayaLinux: \n1. Descarga el ISO oficial.\n2. Prepara una USB con Ventoy.\n3. Arranca desde el USB (F12 en Dell/Lenovo, F9 en HP).\n4. Desactiva el Secure Boot en la BIOS.\n5. Sigue el instalador (Idioma: Español, Teclado: Latam).";
        }
        // 3. Boot Keys / BIOS
        else if (q.includes('boot') || q.includes('tecla') || q.includes('bios') || q.includes('f12') || q.includes('f9')) {
            response = "Las teclas de Boot Menu según la marca son:\n• HP: F9 o Esc\n• Dell, Lenovo, Acer, Toshiba: F12\n• Asus: Esc o F8\nPara entrar a la BIOS/UEFI generalmente usas F2, F10 o Del. ¡Recuerda deshabilitar el Secure Boot para que el USB arranque!";
        }
        // 4. Secure Boot / Troubleshooting
        else if (q.includes('secure boot') || q.includes('error') || q.includes('no arranca') || q.includes('problemas')) {
            response = "Si tienes problemas al arrancar: \n• Desactiva 'Secure Boot' en la BIOS.\n• Cambia el orden de arranque prioritario al USB.\n• Verifica si el disco está en modo AHCI.\n• Si no ves el menú tras instalar, usa 'sudo update-grub' desde la terminal.";
        }
        // 5. STB / Hardware
        else if (q.includes('stb') || q.includes('cajita') || q.includes('mini pc') || q.includes('recovery')) {
            response = "El STB Qinaya es nuestra estación de trabajo compacta. Si necesitas restaurarlo, usa un alfiler en el orificio AV (pinhole) para entrar en modo Recovery y actualizar desde una microSD o USB con el archivo update.zip.";
        }
        // 6. WiFi / Connectivity
        else if (q.includes('wifi') || q.includes('internet') || q.includes('red') || q.includes('conectar')) {
            response = "Si el WiFi no funciona:\n1. Verifica la tecla física o Fn+F2.\n2. Prueba con cable Ethernet para bajar drivers.\n3. En QinayaLinux, ve a 'Controladores adicionales' para activar el driver privativo si es necesario.";
        }
        // 7. Educational Tools / Coding
        else if (q.includes('scratch') || q.includes('programar') || q.includes('logica') || q.includes('juegos')) {
            response = "¡La educación maker es clave! En este Kit tienes una 'Zona de Juegos' para practicar. Scratch y MakeCode funcionan perfecto en la Nube Qinaya. También puedes ver tutoriales paso a paso en nuestra sección de Videos.";
        }
        // 8. Micro:bit / Arduino
        else if (q.includes('micro:bit') || q.includes('microbit') || q.includes('arduino') || q.includes('hardware')) {
            response = "QinayaLinux es compatible con Micro:bit y Arduino por USB. El sistema los monta como unidades externas. Puedes programarlos con simuladores o directamente arrastrando los archivos .hex al dispositivo.";
        }
        // 9. Reach / Company mission
        else if (q.includes('mision') || q.includes('impacto') || q.includes('donde') || q.includes('empresa')) {
            response = "Estamos presentes en Palmira, El Espinal, Bogotá y muchas otras zonas de Colombia. Nuestra misión es que ningún niño se quede sin estudiar por falta de un computador potente.";
        }
        // 10. Fallback
        else {
            response = "¡Es una pregunta interesante! Aunque soy un bot de soporte rápido, he registrado tu duda. Para detalles técnicos profundos, te recomiendo consultar qinaya.co/manuals o usar el 'Notebook Inteligente' de este Kit para chatear con la IA experta en nuestras fuentes.";
        }

        appendMessage(response, 'bot-msg');
    }, 1000);
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

