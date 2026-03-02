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
        // 2. Black Screen / Nomodeset (Specific Solution from screenshot)
        else if (q.includes('pantalla') && (q.includes('negro') || q.includes('negra') || q.includes('no arranca'))) {
            response = "Si la pantalla se queda en negro al arrancar (común en NVIDIA):\n1. En el menú de GRUB, presiona 'e' para editar.\n2. Busca la línea que dice 'quiet splash'.\n3. Agrega al final: 'nomodeset'.\n4. Presiona F10 para arrancar.\n5. Una vez dentro, instala los controladores adicionales desde el menú de configuración.";
        }
        // 3. Installation / Linux / Dual Boot
        else if (q.includes('instalar') || q.includes('instalacion') || q.includes('linux') || q.includes('dual boot') || q.includes('particion')) {
            response = "Para instalar QinayaLinux en Dual Boot:\n1. Prepara 20-30GB de espacio libre en Windows.\n2. Arranca desde el USB (F12/F9).\n3. En el instalador, elige 'Instalar junto a Windows'.\n4. Si no aparece, usa la opción 'Más opciones' para crear las particiones manualmente (Raíz '/', Swap y EFI).";
        }
        // 4. Boot Keys / BIOS
        else if (q.includes('boot') || q.includes('tecla') || q.includes('bios') || q.includes('f12') || q.includes('f9') || q.includes('grub')) {
            response = "Teclas de Boot Menu:\n• HP: F9 o Esc\n• Dell, Lenovo, Acer, Toshiba: F12\n• Asus: Esc o F8\nSi no ves el menú de GRUB tras instalar, entra a Windows y ejecuta 'bcdedit /set {bootmgr} path \\EFI\\qinayalinux\\grubx64.efi' como administrador.";
        }
        // 5. Secure Boot / Troubleshooting
        else if (q.includes('secure boot') || q.includes('error') || q.includes('problemas') || q.includes('wifi')) {
            if (q.includes('wifi')) {
                response = "Si el WiFi no funciona:\n1. Verifica la tecla física o Fn+F2.\n2. Prueba con cable Ethernet.\n3. Ve a 'Controladores adicionales' para activar el driver privativo (Broadcom/Realtek).";
            } else {
                response = "Si tienes errores al arrancar: \n• Desactiva 'Secure Boot' en la BIOS.\n• Cambia el orden de arranque prioritario al USB.\n• Verifica si el disco está en modo AHCI.\n• Si no ves el menú tras instalar, usa 'sudo update-grub' desde la terminal.";
            }
        }
        // 6. STB / Hardware
        else if (q.includes('stb') || q.includes('cajita') || q.includes('mini pc') || q.includes('recovery')) {
            response = "El STB Qinaya es nuestra estación de trabajo compacta. Si necesitas restaurarlo: Inserta un alfiler en el orificio AV al encenderlo para entrar en modo Recovery y actualizar desde una microSD con el archivo 'update.zip'.";
        }
        // 7. Educational Tools / Coding
        else if (q.includes('scratch') || q.includes('programar') || q.includes('logica') || q.includes('juegos')) {
            response = "¡La educación maker es clave! En este Kit tienes una 'Zona de Juegos' para practicar. Scratch y MakeCode funcionan perfecto en la Nube Qinaya. También puedes ver tutoriales paso a paso en nuestra sección de Videos.";
        }
        // 8. Micro:bit / Arduino
        else if (q.includes('micro:bit') || q.includes('microbit') || q.includes('arduino') || q.includes('hardware')) {
            response = "QinayaLinux es totalmente compatible con Micro:bit y Arduino. Puedes programarlos con simuladores o directamente conectándolos por USB. El sistema los reconocerá automáticamente para cargar tus códigos.";
        }
        // 9. Cloud / Nube / Velocity
        else if (q.includes('nube') || q.includes('lento') || q.includes('velocidad') || q.includes('rendimiento')) {
            response = "Para mejorar la experiencia en la Nube:\n1. Usa una conexión por cable si es posible.\n2. Cierra pestañas innecesarias en el navegador local.\n3. Verifica tu ping en qinaya.co/test. Si es menor a 50ms, la experiencia será como un PC local.";
        }
        // 10. Fallback (Detailed)
        else {
            response = "¡Es una pregunta interesante! Para detalles técnicos específicos sobre hardware, te recomiendo consultar qinaya.co/manuals o usar el 'Notebook Inteligente' de este Kit. Si necesitas soporte humano, contáctanos en bit.ly/Qinaya-Soporte.";
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

