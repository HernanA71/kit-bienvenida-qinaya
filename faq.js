/**
 * Lógica del FAQ Dinámico Multiproducto - Kit Qinaya
 */

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz1uJKZlXIxGYtfn4-t1ExeGt4XIk4rGC30hrMKgsIxV-M7nWu4TSNN_bivYov5-MVq6Q/exec';

let faqData = [];
let currentCategory = 'all';
let currentProduct = 'Upcycle';

// Referencias del DOM
const faqItemsContainer = document.getElementById('faqItems');
const categoryListContainer = document.getElementById('categoryList');
const searchInput = document.getElementById('faqSearch');
const loadingState = document.getElementById('loading');
const noResults = document.getElementById('noResults');
const videoModal = document.getElementById('videoModal');
const closeBtn = document.querySelector('.close-modal');
const productTabs = document.querySelectorAll('.prod-tab');

/**
 * Carga inicial de datos desde Google Sheets
 */
async function loadFAQData() {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getFAQ`);
        if (response.ok) {
            faqData = await response.json();
        } else {
            throw new Error('Error en la API');
        }
    } catch (error) {
        console.warn('Cargando base de conocimiento local (Sincronización pendiente):', error);
        faqData = getFallbackData();
    } finally {
        loadingState.style.display = 'none';
        renderCategories();
        renderFAQ();
        initProductTabs();
    }
}

/**
 * Gestión de pestañas de Producto (Upcycle / STB)
 */
function initProductTabs() {
    productTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            productTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentProduct = tab.dataset.product;
            currentCategory = 'all'; // Reinicia categoría al cambiar de equipo
            renderCategories();
            renderFAQ();
        });
    });
}

/**
 * Renderiza dinámicamente las categorías disponibles para el producto actual
 */
function renderCategories() {
    const productSpecificFAQ = faqData.filter(item => item.Producto === currentProduct);
    const categoriesSet = new Set(productSpecificFAQ.map(item => item.Categoria));
    const categories = ['all', ...Array.from(categoriesSet)];

    const catIcons = {
        'all': '📋',
        'Pantalla': '🖥️',
        'Mouse y teclado': '🖱️',
        'Sonido': '🔊',
        'Instalar una cámara Web': '📷',
        'Conexión a Internet': '🌐',
        'Conexión a corriente': '🔌',
        'Aplicaciones': '📱',
        'Escritorio Virtual': '💻',
        'Nube': '☁️',
        'Periféricos': '🔌',
        'Uso Sistema': '⚙️'
    };

    categoryListContainer.innerHTML = categories.map(cat => `
        <button class="cat-btn ${cat === currentCategory ? 'active' : ''}" data-category="${cat}">
            <span class="cat-icon">${catIcons[cat] || '❓'}</span> ${cat === 'all' ? 'Todas' : cat}
        </button>
    `).join('');

    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            renderFAQ();
        });
    });
}

/**
 * Renderiza y filtra la lista de preguntas
 */
function renderFAQ() {
    const searchTerm = searchInput.value.toLowerCase();

    const filtered = faqData.filter(item => {
        const matchesProduct = item.Producto === currentProduct;
        const matchesCat = currentCategory === 'all' || item.Categoria === currentCategory;
        const matchesSearch = item.Pregunta.toLowerCase().includes(searchTerm) ||
            item.Respuesta.toLowerCase().includes(searchTerm);
        return matchesProduct && matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
        faqItemsContainer.innerHTML = '';
        noResults.style.display = 'block';
        // Reset botones de reporte si estaban ocultos
        document.getElementById('btnLogQuestion').style.display = 'inline-block';
        document.getElementById('btnLogQuestion').disabled = false;
        document.getElementById('btnLogQuestion').innerText = 'Enviar mi duda al soporte';
        document.getElementById('logFeedback').style.display = 'none';
    } else {
        noResults.style.display = 'none';
        faqItemsContainer.innerHTML = filtered.map(item => `
            <div class="faq-card">
                <div class="faq-question">
                    <span>${item.Pregunta}</span>
                    <span class="faq-icon">▼</span>
                </div>
                <div class="faq-answer">
                    <p>${item.Respuesta}</p>
                    ${item.VideoLink ? `
                        <div class="video-link-btn" onclick="openVideo('${item.VideoLink}', '${item.Pregunta}')">
                            <span>▶ Ver solución en video</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.faq-question').forEach(q => {
            q.addEventListener('click', () => {
                const card = q.parentElement;
                const wasOpen = card.classList.contains('open');
                if (!wasOpen) card.classList.add('open');
                else card.classList.remove('open');
            });
        });
    }
}

/**
 * Gestión del Reproductor de Video (Modal)
 */
function openVideo(url, title) {
    const container = document.getElementById('videoContainer');
    const videoTitle = document.getElementById('videoTitle');
    videoTitle.innerText = title;

    let embedUrl = url;
    if (url.includes('youtube.com/watch?v=')) {
        embedUrl = url.replace('watch?v=', 'embed/');
    } else if (url.includes('youtu.be/')) {
        embedUrl = url.replace('youtu.be/', 'www.youtube.com/embed/');
    }

    container.innerHTML = `<iframe src="${embedUrl}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    videoModal.style.display = 'flex';
}

closeBtn.addEventListener('click', () => {
    videoModal.style.display = 'none';
    document.getElementById('videoContainer').innerHTML = '';
});

window.addEventListener('click', (e) => {
    if (e.target === videoModal) closeBtn.click();
});

searchInput.addEventListener('input', renderFAQ);

/**
 * Base de Conocimiento de Backup (Enfocada en USO)
 */
function getFallbackData() {
    return [
        // --- UPCYCLE LINUX ---
        {
            Producto: 'Upcycle',
            Categoria: 'Mouse y teclado',
            Pregunta: '¿Cómo escribo el arroba (@) y otros símbolos?',
            Respuesta: 'Asegúrate de que el idioma esté en "Español (Latinoamérica)". Usa la combinación Alt Gr + Q o Alt Gr + 2. Si estás en modo Inglés, usa Shift + 2.',
            VideoLink: ''
        },
        {
            Producto: 'Upcycle',
            Categoria: 'Pantalla',
            Pregunta: 'Mi monitor es antiguo (VGA/RGB), ¿cómo lo conecto?',
            Respuesta: 'Debes usar el adaptador HDMI a VGA incluido en tu kit. Conecta el cable RGB (VGA) al adaptador y luego el adaptador al puerto HDMI del equipo Upcycle. Asegúrate de apretar los tornillos del cable.',
            VideoLink: ''
        },
        {
            Producto: 'Upcycle',
            Categoria: 'Nube',
            Pregunta: '¿Cómo guardo mis archivos para que no se pierdan?',
            Respuesta: 'Guarda tus trabajos siempre dentro de la sesión del Escritorio Virtual o usa servicios como Google Drive/OneDrive desde el navegador. Los archivos guardados localmente en "Descargas" del equipo físico podrían borrarse si se restaura el sistema.',
            VideoLink: ''
        },
        {
            Producto: 'Upcycle',
            Categoria: 'Escritorio Virtual',
            Pregunta: '¿Puedo navegar en mis sitios habituales desde la nube?',
            Respuesta: '¡Sí! Al entrar a "Mi Qinaya", abre el navegador (Chrome/Edge) dentro de la ventana de Windows. Podrás acceder a tus correos, sitios de trabajo y plataformas de la misma forma que en un PC convencional, pero con la velocidad de la nube.',
            VideoLink: ''
        },
        {
            Producto: 'Upcycle',
            Categoria: 'Periféricos',
            Pregunta: '¿Dónde está el receptor del kit de teclado y mouse inalámbrico?',
            Respuesta: 'El receptor USB (dongle) viene guardado dentro del compartimento de las pilas del MOUSE. Debes sacarlo de ahí y conectarlo a un puerto USB del equipo Upcycle para que ambos dispositivos funcionen.',
            VideoLink: ''
        },

        // --- QINAYA STB ---
        {
            Producto: 'STB',
            Categoria: 'Pantalla',
            Pregunta: 'La imagen se sale de los bordes de mi televisor',
            Respuesta: 'Es un problema de "Overscan". Ve a Configuración > Pantalla > Screen Position. Usa los botones de Zoom Out hasta que los marcos blancos coincidan con los bordes de tu TV o monitor.',
            VideoLink: ''
        },
        {
            Producto: 'STB',
            Categoria: 'Conexión a corriente',
            Pregunta: '¿Cómo debo conectar la fuente de poder?',
            Respuesta: 'Usa siempre el adaptador de corriente original incluido. Conéctalo primero al equipo STB y luego al toma corriente. Si usas un puerto USB de la TV para darle energía, el equipo podría reiniciarse por falta de potencia.',
            VideoLink: ''
        },
        {
            Producto: 'STB',
            Categoria: 'Sonido',
            Pregunta: 'No escucho audio en mi televisor',
            Respuesta: 'Verifica que el cable HDMI esté bien conectado en ambos extremos. En la configuración de la STB, busca "Audio Output" y asegúrate de que esté seleccionado "HDMI" o "Auto". Revisa también que el volumen de la STB esté al máximo usando su control remoto.',
            VideoLink: ''
        },
        {
            Producto: 'STB',
            Categoria: 'Instalar una cámara Web',
            Pregunta: '¿Puedo conectar una cámara para videollamadas?',
            Respuesta: 'Sí, conecta cualquier cámara web USB estándar en los puertos laterales. Abre aplicaciones como Zoom o Meet desde el navegador o la Play Store para probarla. Se recomienda usar puertos USB 3.0 (color azul) para mejor fluidez.',
            VideoLink: ''
        },
        {
            Producto: 'STB',
            Categoria: 'Aplicaciones',
            Pregunta: '¿Cómo instalo nuevas aplicaciones?',
            Respuesta: 'Ingresa a la Google Play Store con tu cuenta de Gmail. Busca la aplicación que desees (Netflix, YouTube, juegos) y haz clic en Instalar. Asegúrate de tener espacio disponible y buena conexión a internet.',
            VideoLink: ''
        },
        {
            Producto: 'STB',
            Categoria: 'Mouse y teclado',
            Pregunta: '¿Dónde encuentro el conector del teclado inalámbrico?',
            Respuesta: 'Al igual que en otros modelos, el conector USB está oculto en la parte trasera, dentro del compartimiento de las baterías del teclado o del mouse. Solo necesitas conectar ese único receptor para que ambos funcionen.',
            VideoLink: ''
        }
    ];
}

/**
 * Registra una duda que no obtuvo resultados en la búsqueda
 */
async function logUnfoundQuestion() {
    const question = searchInput.value.trim();
    const btn = document.getElementById('btnLogQuestion');
    const feedback = document.getElementById('logFeedback');

    if (!question) return;

    btn.disabled = true;
    btn.innerText = 'Enviando...';

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify({
                action: 'logQuestion',
                question: `[FAQ-${currentProduct}] ${question}`
            })
        });

        // Mostrar éxito y limpiar después de un momento
        feedback.style.display = 'block';
        feedback.classList.remove('error');
        feedback.innerText = '¡Recibido! Revisaremos tu duda para incluirla pronto.';
        btn.style.display = 'none';

        // Esperar 5 segundos para que el usuario lea, luego limpiar y resetear
        setTimeout(() => {
            searchInput.value = '';
            renderFAQ();
        }, 5000);

    } catch (error) {
        console.error('Error al loguear duda:', error);
        feedback.style.display = 'block';
        feedback.classList.add('error');
        feedback.innerText = 'Tuvimos un problema al enviar. Intenta más tarde.';
        btn.disabled = false;
        btn.innerText = 'Reintentar envío';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadFAQData();
    document.getElementById('btnLogQuestion').addEventListener('click', logUnfoundQuestion);
});
