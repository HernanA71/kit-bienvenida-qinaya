// Informe General de Seguimiento Proyecto Renube - SED Bogotá
const API_BASE = "https://panel.qinaya.co/api2/";
const ORG_ID = "28";
const SINCE = "2026-07-07";
const TODAY = "2026-07-25";
const COLEGIOS_API = [{name:"Agustín Nieto Caballero",pcs:40},{name:"Antonia Santos",pcs:12},{name:"Antonio Garcia",pcs:18},{name:"Atanasio Girardot",pcs:24},{name:"Campestre Monte Verde",pcs:9},{name:"Ciudad de Villavicencio",pcs:37},{name:"Costa Rica Sede B",pcs:10},{name:"Distrital La Joya",pcs:27},{name:"Eduardo Santos",pcs:38},{name:"Eduardo Umana Luna IED",pcs:3},{name:"El Salitre",pcs:26},{name:"El Verjón IED",pcs:2},{name:"Estrella del Sur Sede B",pcs:34},{name:"Externado Nacional Camilo Torres",pcs:38},{name:"Francisco de Paula Santander",pcs:10},{name:"Gustavo Morales Morales",pcs:20},{name:"John F. Kennedy IED",pcs:28},{name:"Jose Manuel Restrepo",pcs:10},{name:"Los Comuneros - Oswaldo Guayasamin",pcs:40},{name:"Manuel Cepeda Vargas",pcs:30},{name:"Manuela Beltrán",pcs:21},{name:"Marco Tulio Fernandez",pcs:20},{name:"Moralba Suroriental Sede A",pcs:20},{name:"Nuevo Horizonte Sede A",pcs:12},{name:"Pablo Neruda IED",pcs:13},{name:"Paraiso Mirador",pcs:6},{name:"Paulo VI IED",pcs:15},{name:"Policarpa Salavarrieta",pcs:22},{name:"Rodrigo Lara Bonilla",pcs:32},{name:"Rural Pasquilla",pcs:36},{name:"San Francisco de Asis",pcs:20},{name:"Santa Lucia",pcs:37},{name:"Sorrento",pcs:40},{name:"Villamar IED",pcs:20},{name:"Villemar El Carmen IED",pcs:17},{name:"Virginia Gutierrez de Pineda",pcs:27}];
const nowStr = new Date().toLocaleDateString("es-CO", {year:"numeric",month:"long",day:"numeric"});
document.addEventListener("DOMContentLoaded", function() { if (document.getElementById("coverDate")) document.getElementById("coverDate").textContent = nowStr; if (document.getElementById("footerDate")) document.getElementById("footerDate").textContent = "Fecha de corte: " + nowStr; renderDocument(); loadAPIData();  });
function renderDocument() { const body = document.getElementById("docBody"); if (!body) return; body.innerHTML = getChapter1() + getChapter2() + getChapter3() + getChapter4() + getChapter5() + getChapter6() + getChapter7(); }
function getChapter1() {
    return `<div class="section">
        <div class="section-header">
            <div class="section-num">Capítulo 1</div>
            <h2 class="section-title">El Origen: Una Alianza Estratégica para la Educación de Bogotá</h2>
            <p class="section-lead">De las primeras experiencias de innovación a la consolidación del Proyecto Renube</p>
            <div class="section-divider"></div>
        </div>
        <div class="story-box">
            <div class="story-title"><i class="fas fa-history"></i> El Origen del Proyecto Renube: Del Pilotaje Inicial a la Ampliación Distrital</div>
            <p class="prose">Es de recordar que el proyecto Renube tuvo su origen en un piloto desarrollado por Qinaya en alianza con la Secretaría de Educación de Bogotá y financiado por la Fundación Bolívar Davivienda. En el marco de este proyecto se intervinieron más de 14 instituciones educativas y se instalaron más de 200 soluciones Qinaya en siete de ellas, lo que permitió validar en condiciones reales de operación el desempeño de <strong>Qinaya Linux</strong> como una alternativa eficaz para combatir la obsolescencia tecnológica.</p>
            <p class="prose">Los resultados del piloto demostraron un desempeño satisfactorio en términos de estabilidad, calidad del servicio y número de horas efectivas de uso en el aula, confirmando la viabilidad de la solución para extender la vida útil de equipos existentes y ampliar el acceso a tecnologías digitales en entornos educativos.</p>
            <p class="prose" style="margin-bottom:0;">Los resultados de ese primer piloto sirvieron como fundamento para diseñar una fase de ampliación orientada a <strong>recuperar 3.000 computadores obsoletos en Bogotá</strong> mediante licencias de virtualización y acceso a la nube. La ejecución se distribuyó entre varios proveedores, correspondiéndole a <strong>Qinaya la implementación de 1.000 de esas licencias</strong>.</p>
        </div>
        <div class="page-break"></div>
        <h3 style="margin:28px 0 16px;font-size:1.25rem;">Nuestro Piloto: La Transformación de los Primeros Laboratorios</h3>
        <p class="prose">Con el respaldo de la experiencia previa, Qinaya dio inicio al <strong>piloto</strong> en dos instituciones representativas de Bogotá: el Colegio Manuela Beltrán (Teusaquillo) y el Colegio Costa Rica Sede B (Fontibón). Estas intervenciones demostraron la capacidad de transformar salas rezagadas en espacios digitales modernos en tiempo récord.</p>
        <div class="pilot-narrative">
            <div class="pilot-card-nav">
                <div class="pilot-card-nav-header blue"><i class="fas fa-school"></i> Colegio Manuela Beltrán (Teusaquillo)</div>
                <p class="prose" style="font-size:0.92rem;">En una sala de sistemas con equipos que se encontraban inoperativos por el paso del tiempo, la solución Qinaya entregó <strong>21 computadores totalmente repotenciados y operativos</strong>. La intervención permitió a los estudiantes pasar de perder la clase esperando el encendido a ingresar de inmediato a <strong>Scratch, Python y guías de ofimática</strong>, convirtiendo la sede en uno de los colegios líderes en retención y uso pedagógico activo del proyecto.</p>
            </div>
            <div class="pilot-card-nav">
                <div class="pilot-card-nav-header teal"><i class="fas fa-school"></i> Colegio Costa Rica Sede B (Fontibón)</div>
                <p class="prose" style="font-size:0.92rem;">Una sala subutilizada por falta de capacidad real de los equipos fue recuperada por completo con <strong>10 computadores repotenciados</strong>. Este laboratorio permitió validar la rapidez del proceso —alcanzando un promedio de <strong>10 a 15 minutos por equipo</strong>— y hoy beneficia activamente a los niños en proyectos de <strong>Arduino, Tinkercad y plataformas educativas de Google</strong>.</p>
            </div>
        </div>
        <div class="hbox blue">
            <p><i class="fas fa-check-circle" style="margin-right:8px;"></i><strong>Aprendizajes Clave del Despliegue Inicial:</strong> La experiencia del Piloto 0 demostró que el modelo es altamente escalable: tiempos de instalación optimizados de 10 a 15 minutos por equipo, coordinación fluida con los delegados OTIC de las instituciones y una validación de conectividad previa que garantiza el éxito en cada sala.</p>
        </div>
    </div>`;
}

function getChapter2() { return `<div class="section"><div class="section-header"><div class="section-num">Capítulo 2</div><h2 class="section-title">La Expansión: 36 Colegios en Operación</h2><p class="section-lead">De los 2 colegios piloto al despliegue en múltiples localidades de Bogotá</p><div class="section-divider teal"></div></div><p class="prose">Con el piloto validado y los procesos estandarizados, el equipo Qinaya comenzó el despliegue masivo en las Instituciones Educativas Distritales de Bogotá. <strong>A la fecha del presente informe, el proyecto opera activamente en 36 colegios con 814 equipos instalados</strong>, distribuidos en múltiples localidades de la ciudad.</p><div class="kpi-grid"><div class="kpi-card blue-k"><div class="kpi-card-icon">🏫</div><div class="kpi-val">36</div><div class="kpi-label">Colegios Activos</div></div><div class="kpi-card teal-k"><div class="kpi-card-icon">💻</div><div class="kpi-val">814</div><div class="kpi-label">PCs Instalados</div></div><div class="kpi-card amber-k"><div class="kpi-card-icon">🎯</div><div class="kpi-val">1.000</div><div class="kpi-label">Meta del Convenio</div></div><div class="kpi-card green-k"><div class="kpi-card-icon">📊</div><div class="kpi-val">81.4%</div><div class="kpi-label">Avance hacia la Meta</div></div></div><div class="hbox amber"><p><i class="fas fa-map-marked-alt" style="margin-right:8px;"></i><strong>La realidad del promedio por colegio:</strong> La meta inicial de 40 equipos por colegio no pudo mantenerse de manera uniforme. La distribución real varió enormemente: desde <strong>2 PCs en el Colegio El Verjón IED</strong> hasta <strong>40 PCs en sedes como Sorrento, Los Comuneros, Agustín Nieto Caballero</strong>. Esto refleja la heterogeneidad del inventario tecnológico real en las IED bogotanas.</p></div><div class="page-break"></div><div class="chart-box"><h4><i class="fas fa-chart-bar" style="color:#2563eb;margin-right:8px;"></i>PCs Instalados por Institución Educativa</h4><p>Distribución actual de equipos repotenciados en los 36 colegios activos del Proyecto Renube - Fuente: API Qinaya</p><canvas id="chartColegios" height="380"></canvas></div><div class="chart-box" style="margin-top:20px;"><h4><i class="fas fa-chart-bar" style="color:#0d9488;margin-right:8px;"></i>Avance hacia la Meta de 1.000 Equipos</h4><p>814 equipos instalados representan el 81.4% de la meta del convenio.</p><canvas id="chartMeta" height="120"></canvas></div></div>`; }
function getChapter3() {
    return `<div class="page-break"></div><div class="section">
        <div class="section-header">
            <div class="section-num">Capítulo 3</div>
            <h2 class="section-title">Aprovechamiento Pedagógico e Intensidad de Uso</h2>
            <p class="section-lead">Medición del uso real de los laboratorios escolares en jornadas de alta operación</p>
            <div class="section-divider amber"></div>
        </div>

        <p class="prose">El compromiso de Qinaya va más allá de la instalación: <strong>medimos el uso efectivo de los equipos en tiempo real</strong> mediante la plataforma de telemetría CODEGEN. En jornadas lectivas de operación plena, los equipos registran un promedio de <strong>5.4 horas diarias por computador en jornada única</strong>, alcanzando en sedes de doble jornada (mañana y tarde) máximos de operación intensiva de <strong>hasta 10 horas diarias por laboratorio</strong>.</p>

        <div class="kpi-grid kpi-5col">
            <div class="kpi-card blue-k"><div class="kpi-card-icon">⏱️</div><div class="kpi-val" id="kpiHorasTotal">97.2K hrs</div><div class="kpi-label">Horas Totales Acumuladas</div></div>
            <div class="kpi-card teal-k"><div class="kpi-card-icon">📅</div><div class="kpi-val" id="kpiPromDiario" style="color:#0d9488;">5.4 hrs</div><div class="kpi-label">Hrs/Día por Equipo Activo</div></div>
            <div class="kpi-card amber-k"><div class="kpi-card-icon">📊</div><div class="kpi-val" id="kpiPromDiarioTotal" style="color:#d97706;">4.8 hrs</div><div class="kpi-label">Promedio Diario Total</div></div>
            <div class="kpi-card blue-k"><div class="kpi-card-icon">🖥️</div><div class="kpi-val" id="kpiActivos">721</div><div class="kpi-label">Equipos con Transmisión<br><span style="font-size:0.68rem;text-transform:none;color:#64748b;font-weight:500;">(tomado en el momento de elaboración del informe)</span></div></div>
            <div class="kpi-card green-k"><div class="kpi-card-icon">✅</div><div class="kpi-val" id="kpiActivacion">88.6%</div><div class="kpi-label">Tasa de Activación</div></div>
        </div>
        <div style="text-align:center;font-size:0.8rem;color:#64748b;margin-top:-14px;margin-bottom:20px;font-style:italic;font-weight:500;">(Tomado en el tiempo de elaboración del informe en un rango aleatorio)</div>

        <div class="formula-box" style="padding:14px 20px;margin-bottom:20px;">
            <div class="formula-title" style="font-size:0.95rem;"><i class="fas fa-calculator"></i> Metodología de Medición — Operación Efectiva en Jornadas Activas</div>
            <div class="formula-line"><span class="var">Promedio Diario por Equipo Activo</span> <span class="op">=</span> Horas Totales Diarias / Equipos Activos <span class="op">=</span> <strong>5.4 hrs/día por equipo</strong></div>
            <div class="formula-line"><span class="var">Promedio Diario Total por Equipo Instalado</span> <span class="op">=</span> Horas Totales Diarias / Total Equipos Instalados <span class="op">=</span> <strong>4.8 hrs/día por equipo</strong></div>
        </div>

        <!-- GRID 1: CLASIFICACION POR INTENSIDAD -->
        <h3 style="margin:24px 0 12px;font-size:1.15rem;">Clasificación de Colegios por Intensidad de Uso</h3>
        <div class="chart-grid-2col">
            <div class="chart-box chart-box-sm">
                <h4><i class="fas fa-pie-chart" style="color:#2563eb;margin-right:6px;"></i>Colegios por Franja de Uso Diario</h4>
                <p>Distribución de las 36 sedes por horas diarias</p>
                <div class="chart-doughnut-container">
                    <canvas id="chartFranjas"></canvas>
                </div>
            </div>
            <div class="chart-box chart-box-sm">
                <h4><i class="fas fa-list-ol" style="color:#0d9488;margin-right:6px;"></i>Criterios de Clasificación</h4>
                <p>Rangos de intensidad en horas/día por laboratorio</p>
                <table class="data-table" style="font-size:.82rem;">
                    <thead><tr><th>Franja</th><th>Criterio</th><th>Sedes</th></tr></thead>
                    <tbody>
                        <tr><td><span style="color:#16a34a;font-weight:700;">🟢 Uso Alto</span></td><td>>= 4.0 hrs/día (Máx. 10h)</td><td id="f4count">21 sedes (58%)</td></tr>
                        <tr><td><span style="color:#2563eb;font-weight:700;">🔵 Uso Medio</span></td><td>2.0 a 3.9 hrs/día</td><td id="f3count">10 sedes (28%)</td></tr>
                        <tr><td><span style="color:#d97706;font-weight:700;">🟡 Uso Bajo</span></td><td>1.0 a 1.9 hrs/día</td><td id="f2count">3 sedes (8%)</td></tr>
                        <tr><td><span style="color:#dc2626;font-weight:700;">🔴 Uso Mínimo</span></td><td>< 1.0 hr/día</td><td id="f1count">2 sedes (6%)</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- GRID 2: TOP PROGRAMAS Y TOP WEBS EN PROMEDIO DIARIO -->
        <h3 style="margin:28px 0 12px;font-size:1.15rem;"><i class="fas fa-chart-bar" style="color:#2563eb;margin-right:8px;"></i>Uso Pedagógico Diario: Software y Plataformas Web</h3>
        <p class="prose" style="margin-bottom:12px;">Comparación compacta del <strong>promedio diario de uso continuo por laboratorio</strong> para programas de escritorio y plataformas web educacionales (ordenados de mayor a menor frecuencia diaria):</p>
        
        <div class="chart-grid-2col">
            <div class="chart-box chart-box-sm">
                <h4><i class="fas fa-laptop-code" style="color:#2563eb;margin-right:6px;"></i>Top Programas — Promedio Diario (Hrs/Día)</h4>
                <p>Promedio estimado de horas diarias por laboratorio</p>
                <canvas id="chartApps" height="190"></canvas>
            </div>
            <div class="chart-box chart-box-sm">
                <h4><i class="fas fa-globe" style="color:#0d9488;margin-right:6px;"></i>Top Webs — Promedio Diario (Visitas/Día)</h4>
                <p>Promedio de visitas diarias por laboratorio escolar</p>
                <canvas id="chartWebs" height="190"></canvas>
            </div>
        </div>

        <!-- GRID 3: CONSOLIDACION DEL TIEMPO & ROBOTICA STEM -->
        <h3 style="margin:28px 0 12px;font-size:1.15rem;"><i class="fas fa-microchip" style="color:#0d9488;margin-right:8px;"></i>Enfoque Académico: Consolidación del Uso y Robótica STEM</h3>
        <p class="prose" style="margin-bottom:12px;">Distribución del tiempo pedagógico y promedio de horas diarias dedicadas al prototipado con <strong>Arduino y Micro:bit</strong>:</p>

        <div class="chart-grid-2col">
            <div class="chart-box chart-box-sm">
                <h4><i class="fas fa-chart-pie" style="color:#8b5cf6;margin-right:6px;"></i>Consolidación del Tiempo Pedagógico Diario</h4>
                <p>Porcentaje estimado por categoría en el aula</p>
                <div class="chart-doughnut-container">
                    <canvas id="chartConsolidacion"></canvas>
                </div>
            </div>
            <div class="chart-box chart-box-sm">
                <h4><i class="fas fa-robot" style="color:#0d9488;margin-right:6px;"></i>Robótica STEM (Promedio Diario por Lab)</h4>
                <p>Uso diario de herramientas Maker y Micro:bit</p>
                <canvas id="chartSTEM" height="190"></canvas>
            </div>
        </div>

        <div class="hbox teal" style="padding:12px 18px;margin:14px 0;">
            <p><i class="fas fa-plug" style="margin-right:8px;"></i><strong>Conectividad Física y Laboratorios Maker en el Aula:</strong> La solución Qinaya garantiza soporte plug-and-play en los puertos USB para programar componentes electrónicos. Herramientas como <strong>Tinkercad Circuits (1.94 hrs/día)</strong>, <strong>Scratch (1.86 hrs/día)</strong> y <strong>MakeCode Micro:bit (1.184 visitas)</strong> convierten las salas en talleres Maker activos.</p>
        </div>

        <!-- GRID 4: INVESTIGACION WEB Y PRODUCCION DIGITAL -->
        <h3 style="margin:28px 0 12px;font-size:1.15rem;"><i class="fas fa-search" style="color:#2563eb;margin-right:8px;"></i>Investigación Web y Producción Digital Colaborativa</h3>
        
        <div class="chart-grid-2col">
            <div class="chart-box chart-box-sm">
                <h4><i class="fas fa-graduation-cap" style="color:#2563eb;margin-right:6px;"></i>Investigación Web (Visitas/Día por Lab)</h4>
                <p>Promedio diario de visitas a plataformas investigativas</p>
                <canvas id="chartInvestigacion" height="190"></canvas>
            </div>
            <div class="chart-box chart-box-sm" style="display:flex;flex-direction:column;justify-content:center;">
                <h4 style="color:#1e40af;"><i class="fas fa-lightbulb" style="color:#2563eb;margin-right:6px;"></i>Hallazgos del Aprendizaje Investigativo</h4>
                <p class="prose" style="font-size:0.85rem;margin-bottom:8px;">Los datos reales de telemetría demuestran la alta adopción de motores de búsqueda e IA asistida:</p>
                <ul style="font-size:0.83rem;color:#334155;line-height:1.5;padding-left:18px;">
                    <li><strong>Google Búsquedas:</strong> 4.11 visitas/día por laboratorio</li>
                    <li><strong>YouTube Educativo:</strong> 2.57 visitas/día (videotutoriales)</li>
                    <li><strong>GeoGebra Matemáticas:</strong> 0.74 visitas/día por laboratorio</li>
                    <li><strong>Google Docs / Co-creación:</strong> 0.67 visitas/día por lab</li>
                    <li><strong>ChatGPT (IA Asistida):</strong> 0.67 visitas/día por lab</li>
                </ul>
            </div>
        </div>
    </div>`;
}

function getChapter4() {
    return `<div class="page-break"></div><div class="section">
        <div class="section-header">
            <div class="section-num">Capítulo 4</div>
            <h2 class="section-title">Capacitaciones y Apropiación Docente</h2>
            <p class="section-lead">Formación integral, desarrollo de competencias STEM y acompañamiento permanente en el aula</p>
            <div class="section-divider green"></div>
        </div>

        <p class="prose">Uno de los pilares fundamentales del Proyecto Renube radica en que <strong>la instalación tecnológica es solo el comienzo</strong>. Para asegurar un impacto pedagógico real y duradero, Qinaya despliega una estrategia continua de formación y apropiación docente que transforma el potencial del hardware repotenciado en competencias digitales activas para los estudiantes de Bogotá.</p>

        <div class="kpi-grid">
            <div class="kpi-card blue-k"><div class="kpi-card-icon">👨‍🏫</div><div class="kpi-val">86+</div><div class="kpi-label">Docentes Capacitados</div></div>
            <div class="kpi-card teal-k"><div class="kpi-card-icon">🏫</div><div class="kpi-val">36</div><div class="kpi-label">Colegios en Operación</div></div>
            <div class="kpi-card amber-k"><div class="kpi-card-icon">📚</div><div class="kpi-val">2.4</div><div class="kpi-label">Prom. Docentes / Colegio</div></div>
            <div class="kpi-card green-k"><div class="kpi-card-icon">💻</div><div class="kpi-val">100%</div><div class="kpi-label">Cobertura Virtual y Presencial</div></div>
        </div>

        <h3 style="margin:28px 0 14px;font-size:1.18rem;"><i class="fas fa-calendar-check" style="color:#2563eb;margin-right:8px;"></i>Proceso de Contacto y Agendamiento Institucional</h3>
        <p class="prose">Posterior a la instalación técnica de la solución Qinaya en cada laboratorio, el equipo de Apropiación contacta a las <strong>Rectorías y Coordinaciones Académicas</strong> de las Instituciones Educativas Distritales. A través de estos canales directos se articulan los horarios para agendar las jornadas de capacitación con los docentes encargados del área de tecnología y los educadores que imparten clases en las salas intervenidas.</p>

        <div class="chart-grid-2col">
            <div class="chart-box chart-box-sm">
                <h4><i class="fas fa-video" style="color:#2563eb;margin-right:6px;"></i>Capacitaciones virtuales del Sistema Operativo y solución Qinaya</h4>
                <p class="prose" style="font-size:0.84rem;margin-bottom:8px;">En estas capacitaciones se brinda toda la explicación, contexto y visualización gráfica del sistema QL, de sus herramientas, sus apps en local y su acceso al computador virtual. Se explica a detalle todo el manejo del sistema y la integración de las diferentes herramientas propias del aula.</p>
                <div style="text-align:center;margin-top:10px;">
                    <img src="img_meet_call_v48.png?v=20260810_v48" alt="Capacitaciones virtuales del Sistema Operativo y solución Qinaya" style="max-width:100%;max-height:165px;border-radius:6px;border:1px solid #e2e8f0;object-fit:cover;">
                </div>
            </div>
            <div class="chart-box chart-box-sm">
                <h4><i class="fab fa-whatsapp" style="color:#25d366;margin-right:6px;"></i>Acompañamiento Activo en Grupos de WhatsApp</h4>
                <p class="prose" style="font-size:0.84rem;margin-bottom:8px;">Cada colegio cuenta con un canal directo de WhatsApp. Además de resolver inquietudes técnicas, el equipo indaga sobre el desarrollo de las clases y comparte periódicamente <strong>enlaces educativos, guías interactivas y recursos didácticos para niños</strong>.</p>
                <div style="text-align:center;margin-top:10px;">
                    <img src="img_whatsapp_chat_v48.png?v=20260810_v48" alt="Acompañamiento Activo en Grupos de WhatsApp" style="max-width:100%;max-height:165px;border-radius:6px;border:1px solid #e2e8f0;object-fit:cover;">
                </div>
            </div>
        </div>

        <h3 style="margin:28px 0 14px;font-size:1.18rem;"><i class="fas fa-chalkboard-teacher" style="color:#0d9488;margin-right:8px;"></i>Acompañamiento al Docente</h3>
        <p class="prose">Como complemento fundamental a la formación virtual, profesionales del equipo Qinaya realizan <strong>visitas presenciales de acompañamiento en los laboratorios escolares</strong>. Durante estas jornadas, los profesionales evidencian el buen manejo de la solución Qinaya en clase y aporta al docente estrategias que puedan contribuir al mejoramiento metodológico o de trabajo con las herramientas educativas.</p>

        <div class="chart-grid-2col">
            <div class="chart-box chart-box-sm" style="display:flex;flex-direction:column;justify-content:center;">
                <h4 style="color:#0f766e;"><i class="fas fa-users" style="margin-right:6px;"></i>Impacto del Acompañamiento al Docente</h4>
                <ul style="font-size:0.84rem;color:#334155;line-height:1.55;padding-left:18px;">
                    <li><strong>Validación de la solución en sitio:</strong> Revisión de la estabilidad del sistema y de las aplicaciones en clase con los docentes.</li>
                    <li><strong>Asistencia pedagógica directa:</strong> Resolución de dudas no solamente en cuanto a manejo del sistema, experticia en el manejo de Nube o de cualquier herramienta pedagógica tecnológica en el aula.</li>
                    <li><strong>Retroalimentación docente:</strong> Ajustes y mejoras continuas a la solicitud de nuevos programas instalados.</li>
                </ul>
            </div>
            <div class="chart-box chart-box-sm" style="text-align:center;">
                <h4><i class="fas fa-camera" style="color:#0d9488;margin-right:6px;"></i>Evidencia de Acompañamiento en el Aula</h4>
                <img src="img_scratch_screen_v48.png?v=20260810_v48" alt="Evidencia de Acompañamiento en el Aula" style="max-width:100%;max-height:170px;border-radius:6px;border:1px solid #e2e8f0;object-fit:cover;margin-top:6px;">
            </div>
        </div>

        <div class="hbox teal" style="margin-top:16px;">
            <p><i class="fas fa-user-friends" style="margin-right:8px;"></i><strong>Acompañamiento Adaptado:</strong> La estrategia de seguimiento y capacitación docente se adapta al tamaño y realidad de cada sala de sistemas, garantizando que tanto sedes con 2 equipos repotenciados como instituciones con 40 reciban una atención personalizada y equitativa.</p>
        </div>
    </div>`;
}

function getChapter5() { return `<div class="page-break"></div><div class="section"><div class="section-header"><div class="section-num">Capítulo 5</div><h2 class="section-title">Soporte Técnico Efectivo: El Servicio que Marca la Diferencia</h2><p class="section-lead">Un equipo humano detrás de cada sala de sistemas, respondiendo en tiempo real</p><div class="section-divider green"></div></div><p class="prose">Uno de los pilares del éxito del Proyecto Renube radica en que <strong>la instalación es solo el comienzo</strong>. Qinaya ha consolidado un modelo de soporte técnico que acompaña de manera activa y permanente a cada institución durante las dos jornadas escolares (mañana y tarde).</p><div class="kpi-grid"><div class="kpi-card blue-k"><div class="kpi-card-icon"><i class="fab fa-whatsapp"></i></div><div class="kpi-val">36</div><div class="kpi-label">Grupos WhatsApp Activos</div></div><div class="kpi-card green-k"><div class="kpi-card-icon">⚡</div><div class="kpi-val">1-2 min</div><div class="kpi-label">Tiempo de Respuesta</div></div><div class="kpi-card teal-k"><div class="kpi-card-icon"><i class="fas fa-robot"></i></div><div class="kpi-val">Bot IA</div><div class="kpi-label">Agendamiento Automático</div></div><div class="kpi-card amber-k"><div class="kpi-card-icon"><i class="fas fa-clock"></i></div><div class="kpi-val">6:30-17:30</div><div class="kpi-label">Horario Operativo L-V</div></div></div><h3 style="margin:28px 0 16px;font-size:1.2rem;">El Proceso Post-Instalación</h3><div class="process-flow"><div class="process-step"><div class="process-icon"><i class="fas fa-tools"></i></div><div class="process-label">1. Instalación Técnica</div></div><div class="process-step"><div class="process-icon"><i class="fas fa-calendar-check"></i></div><div class="process-label">2. Agendamiento Capacitación</div></div><div class="process-step"><div class="process-icon"><i class="fas fa-chalkboard-teacher"></i></div><div class="process-label">3. Capacitación Docentes</div></div><div class="process-step"><div class="process-icon"><i class="fas fa-box-open"></i></div><div class="process-label">4. Entrega Kit Bienvenida</div></div><div class="process-step"><div class="process-icon" style="background:#0d9488;"><i class="fab fa-whatsapp"></i></div><div class="process-label">5. Alta Grupo WhatsApp</div></div><div class="process-step"><div class="process-icon" style="background:#16a34a;"><i class="fas fa-headset"></i></div><div class="process-label">6. Seguimiento Continuo</div></div></div><h3 style="margin:28px 0 16px;font-size:1.2rem;">Las Mesas de Ayuda: Soporte en Tiempo Real en el Aula</h3><p class="prose">Cada uno de los <strong>36 colegios intervenidos</strong> tiene un grupo exclusivo de WhatsApp coordinado por el equipo de ingenieros de Qinaya. El grupo incluye a los docentes del laboratorio y a <strong>la totalidad del equipo técnico de Qinaya</strong>, garantizando monitoreo 360 grados y respuesta inmediata.</p><div class="evidence-grid"><div class="evidence-card"><img src="grupowhatsaap.png" alt="Grupo WhatsApp"><div class="evidence-caption"><i class="fab fa-whatsapp" style="color:#25d366;"></i> Mesa de Ayuda WhatsApp por Colegio</div></div><div class="evidence-card"><img src="fotobotvisitatecnica.png" alt="Bot IA"><div class="evidence-caption"><i class="fas fa-robot" style="color:#2563eb;"></i> QinayaBot: Agendamiento con IA</div></div><div class="evidence-card"><img src="fotokitdebienvenida.png" alt="Kit de Bienvenida"><div class="evidence-caption"><i class="fas fa-box-open" style="color:#d97706;"></i> Kit de Bienvenida Digital</div></div></div><h3 style="margin:28px 0 16px;font-size:1.2rem;">Compromisos de Nivel de Servicio (SLA)</h3><table class="sla-table"><thead><tr><th>Criticidad</th><th>Tipo de Incidente</th><th>Tiempo Respuesta Real</th><th>Tiempo Solución</th><th>Límite Contractual</th></tr></thead><tbody><tr class="crit"><td><span class="sla-badge crit">CRÍTICA</span></td><td>Falla de conectividad con la nube - sala completa sin acceso</td><td><span class="sla-time">1-2 min</span> (WhatsApp)</td><td>Remoto: 5-10 min / Presencial: visita agendada</td><td>Máx. 4 horas hábiles</td></tr><tr class="med"><td><span class="sla-badge med">MEDIA</span></td><td>Fallo parcial - audio, video, software específico</td><td><span class="sla-time">2-3 min</span> (WhatsApp/Bot)</td><td>Remoto: 10-15 min / Presencial: coordinado</td><td>Máx. 24 horas hábiles</td></tr><tr class="low"><td><span class="sla-badge low">BAJA</span></td><td>Consultas, capacitaciones adicionales, mejoras</td><td><span class="sla-time">1-2 min</span> (Canales digitales)</td><td>Según agendamiento con el colegio</td><td>Máx. 72 horas hábiles</td></tr></tbody></table><div class="hbox green"><p><i class="fas fa-comments" style="margin-right:8px;"></i><strong>Monitoreo Conversacional Proactivo:</strong> El equipo de soporte no solo responde: tambien indaga periódicamente el estado de cada colegio. Mensajes como <em>"Profe, cómo han funcionado los equipos esta semana? Tiene alguna novedad técnica?"</em> forman parte del protocolo de seguimiento activo.</p></div><h3 style="margin:28px 0 16px;font-size:1.2rem;">El Kit de Bienvenida: Formación y Autonomía Docente</h3><table class="data-table"><thead><tr><th>Recurso</th><th>Contenido</th><th>Proposito</th></tr></thead><tbody><tr><td>Manual de Uso Qinaya</td><td>Guía completa de instalación, acceso y uso de la plataforma</td><td>Autonomía operativa del docente</td></tr><tr><td>Guía de Scratch</td><td>Tutorial para programación con estudiantes de primaria</td><td>Iniciación al pensamiento computacional</td></tr><tr><td>Guía de Tinkercad</td><td>Diseño 3D y modelado para proyectos de ingeniería escolar</td><td>Competencias STEM en el aula</td></tr><tr><td>Guía de IA en Educación</td><td>Uso de ChatGPT, NotebookLM y herramientas de IA</td><td>Innovación pedagógica con IA</td></tr><tr><td>Video Tutoriales</td><td>Videos paso a paso para cada herramienta del ecosistema</td><td>Aprendizaje visual y autónomo</td></tr><tr><td>Zona de Juegos Educativos</td><td>Actividades interactivas para practicar programación</td><td>Motivación y gamificacion del aprendizaje</td></tr></tbody></table></div>`; }
function getChapter6() { return `<div class="page-break"></div><div class="section"><div class="section-header"><div class="section-num">Capítulo 6</div><h2 class="section-title">Voces del Aula: Casos de Éxito</h2><p class="section-lead">Evidencia directa de docentes que vivieron la transformacion en sus laboratorios</p><div class="section-divider teal"></div></div><p class="prose">Las métricas de uso y los indicadores técnicos cuentan una parte de la historia. Pero la evidencia más contundente del impacto del Proyecto Renube viene de las voces directas de los docentes que trabajan diariamente con los computadores repotenciados.</p><div class="testimonial-card"><div class="testimonial-header blue-h"><div class="t-avatar">MB</div><div><div class="t-school-name">Colegio Manuela Beltrán (IED)</div><div class="t-meta"><i class="fas fa-map-marker-alt"></i> Teusaquillo &nbsp;·&nbsp; <i class="fas fa-desktop"></i> 21 PCs Repotenciados &nbsp;·&nbsp; <i class="fas fa-user-tie"></i> Docente: Iván Flores &nbsp;·&nbsp; <i class="fas fa-star"></i> Colegio Piloto Inicial</div></div></div><div class="testimonial-body"><div class="t-intro"><i class="fas fa-info-circle" style="color:#2563eb;"></i> En el Colegio Manuela Beltrán de la localidad de Teusaquillo, donde 21 equipos repotenciados operan activamente desde el despliegue inicial del proyecto, el profesor <strong>Iván Flores</strong> destaca la fluidez pedagógica alcanzada en sus clases y manifiesta lo siguiente:</div><div class="quote-block"><div class="quote-tag"><i class="fas fa-chalkboard-teacher"></i> Apropiación y Dinámica en el Aula</div><p class="quote-text">"Antes la clase se nos iba intentando encender los computadores o esperando a que cargara una aplicación. Con la solución Qinaya la velocidad cambió totalmente: los estudiantes ingresan de inmediato a Scratch, Python y sus guías de trabajo sin perder tiempo de clase."</p></div><div class="quote-block"><div class="quote-tag"><i class="fas fa-code"></i> Programas y Producción Académica</div><p class="quote-text">"Los computadores que antes estaban archivados por obsolescencia ahora permiten trabajar programas de programación y guías de ofimática durante toda la jornada sin interrupciones."</p></div><div class="quote-block"><div class="quote-tag"><i class="fab fa-whatsapp"></i> Valoración del Soporte Técnico</div><p class="quote-text">"El profesor manifiesta una alta valoración al acompañamiento constante por parte del equipo de ingenieros y la efectividad en la atención de requerimientos a traves del grupo de WhatsApp."</p></div><div class="audio-section"><div class="audio-title"><i class="fas fa-volume-up"></i> Escuchar Testimonios en Voz del Docente Iván Flores</div><div class="audio-item"><div class="audio-label"><i class="fas fa-play-circle" style="color:#2563eb;"></i> Testimonio 1: Velocidad y cambio de dinámica en el aula</div><audio controls preload="metadata"><source src="audiocasoexitomanuelab1.mp4" type="audio/mp4"></audio><a href="https://hernana71.github.io/kit-bienvenida-qinaya/audiocasoexitomanuelab1.mp4" target="_blank" class="audio-pdf-link"><i class="fas fa-volume-up"></i> Escuchar Audio 1</a></div><div class="audio-item"><div class="audio-label"><i class="fas fa-play-circle" style="color:#2563eb;"></i> Testimonio 2: Programas académicos sin interrupciones</div><audio controls preload="metadata"><source src="audiocasoexitomanuelab2.mp4" type="audio/mp4"></audio><a href="https://hernana71.github.io/kit-bienvenida-qinaya/audiocasoexitomanuelab2.mp4" target="_blank" class="audio-pdf-link"><i class="fas fa-volume-up"></i> Escuchar Audio 2</a></div><div class="audio-item"><div class="audio-label"><i class="fas fa-play-circle" style="color:#2563eb;"></i> Testimonio 3: Valoración del soporte técnico continuo</div><audio controls preload="metadata"><source src="audiocasoexitomanuelab3.mp4" type="audio/mp4"></audio><a href="https://hernana71.github.io/kit-bienvenida-qinaya/audiocasoexitomanuelab3.mp4" target="_blank" class="audio-pdf-link"><i class="fas fa-volume-up"></i> Escuchar Audio 3</a></div></div></div></div><div class="testimonial-card"><div class="testimonial-header teal-h"><div class="t-avatar">AG</div><div><div class="t-school-name">Colegio Atanasio Girardot — Sede A</div><div class="t-meta"><i class="fas fa-map-marker-alt"></i> Santa Fe &nbsp;·&nbsp; <i class="fas fa-desktop"></i> 24 PCs Repotenciados &nbsp;·&nbsp; <i class="fas fa-user-tie"></i> Docente: Gladys González</div></div></div><div class="testimonial-body"><div class="t-intro" style="border-left-color:#0d9488;"><i class="fas fa-info-circle" style="color:#0d9488;"></i> En la localidad de Santa Fe, en el Colegio Atanasio Girardot donde operan 24 computadores Qinaya, la docente <strong>Gladys González</strong> relata la recuperación de la sala de sistemas y manifiesta lo siguiente:</div><div class="quote-block" style="border-left-color:#0d9488;"><div class="quote-tag" style="color:#0d9488;"><i class="fas fa-cube"></i> Recuperación del Laboratorio y Diseño 3D</div><p class="quote-text">"Teníamos equipos que dábamos prácticamente por perdidos. Tras la instalación de la solución Qinaya, la sala de sistemas se recuperó por completo y los niños trabajan activamente en diseño 3D con Tinkercad y programación sin bloqueo de equipos."</p></div><div class="quote-block" style="border-left-color:#0d9488;"><div class="quote-tag" style="color:#0d9488;"><i class="fas fa-fire"></i> Impacto y Motivación Estudiantil</div><p class="quote-text">"La motivación de los estudiantes se renovó al ver que los programas responden con fluidez, permitiendoles desarrollar sus guías pedagógicas y proyectos de robótica con total entusiasmo."</p></div><div class="quote-block" style="border-left-color:#0d9488;"><div class="quote-tag" style="color:#0d9488;"><i class="fas fa-headset"></i> Soporte Técnico y Acompañamiento</div><p class="quote-text">"La docente Gladys González resalta el excelente acompañamiento del equipo de soporte de Qinaya, destacando la prontitud y disposición constante de los ingenieros para resolver cualquier inquietud técnica."</p></div><div class="audio-section"><div class="audio-title"><i class="fas fa-volume-up"></i> Escuchar Testimonios en Voz de la Docente Gladys González</div><div class="audio-item"><div class="audio-label"><i class="fas fa-play-circle" style="color:#0d9488;"></i> Testimonio 1: Uso de Tinkercad y proyectos estudiantiles</div><audio controls preload="metadata"><source src="audiocasoexitoatanasio2.mp4" type="audio/mp4"></audio><a href="https://hernana71.github.io/kit-bienvenida-qinaya/audiocasoexitoatanasio2.mp4" target="_blank" class="audio-pdf-link"><i class="fas fa-volume-up"></i> Escuchar Audio 1</a></div><div class="audio-item"><div class="audio-label"><i class="fas fa-play-circle" style="color:#0d9488;"></i> Testimonio 2: Soporte técnico e impacto en el aula</div><audio controls preload="metadata"><source src="audiocasoexitoatanasio3.mp4" type="audio/mp4"></audio><a href="https://hernana71.github.io/kit-bienvenida-qinaya/audiocasoexitoatanasio3.mp4" target="_blank" class="audio-pdf-link"><i class="fas fa-volume-up"></i> Escuchar Audio 2</a></div></div></div></div><div class="hbox teal"><p><i class="fas fa-quote-right" style="margin-right:8px;"></i><strong>Estos casos no son excepciones, son el modelo:</strong> Los testimonios de Iván Flores y Gladys González reflejan la experiencia de los 36 colegios que hoy tienen la solución Qinaya instalada y operando. La retención del 100% de las instituciónes intervenidas, sin una sola desinstalación, confirma que el modelo de soporte y apropiación esta funcionando.</p></div></div>`; }
function getChapter7() { return `<div class="page-break"></div><div class="section"><div class="section-header"><div class="section-num">Capítulo 7</div><h2 class="section-title">Conclusiones y Próximos Pasos</h2><p class="section-lead">Lo que hemos construido juntos y el camino hacia la meta</p><div class="section-divider"></div></div><p class="prose">El Proyecto Renube Qinaya es hoy <strong>uno de los casos mas concretos y medibles de equidad digital en la educación pública bogotana</strong>. Los resultados hablan por sí mismos: 814 computadores que estaban en obsolescencia funcional hoy generan horas reales de aprendizaje en las aulas.</p><div class="conclusion-grid"><div class="conclusion-card"><h4><i class="fas fa-trophy" style="color:#d97706;"></i> Logros Alcanzados</h4><ul><li><strong>36 colegios</strong> activos en el proyecto</li><li><strong>814 equipos</strong> repotenciados (81.4% de la meta)</li><li><strong id="concHoras">97.195+</strong> horas de uso en el aula</li><li><strong>86+</strong> docentes capacitados</li><li><strong>0%</strong> de desinstalaciones registradas</li><li>SLA de respuesta real: <strong>1-2 minutos</strong></li></ul></div><div class="conclusion-card"><h4><i class="fas fa-road" style="color:#2563eb;"></i> Próximos Pasos</h4><ul><li>Alcanzar los <strong>1.000 equipos</strong> meta del convenio</li><li>Incorporar nuevos colegios focalizados por SED/Ágata</li><li>Webinars interactivos para apropiación masiva</li><li>Evolucion hacia <strong>Comunidad de Practica</strong> docente</li><li>Encuestas formales de satisfacción (CNC)</li><li>Visitas de seguimiento preventivas en todas las sedes</li></ul></div><div class="conclusion-card"><h4><i class="fas fa-lightbulb" style="color:#0d9488;"></i> Nuestra Propuesta de Valor</h4><ul><li>Repotenciación eficiente sin compra de hardware nuevo</li><li>Soporte en tiempo real durante las clases</li><li>Apropiación pedagógica acompañada</li><li>Telemetría y reportes en tiempo real para la SED</li><li>Kit de bienvenida y formación docente incluidos</li><li>Bot IA para agendamiento automático de visitas</li></ul></div></div><div class="cta-box"><h3>Un Proyecto que Demuestra que la Equidad Digital es Posible</h3><p>En los marcos internacionales de la UNESCO y el BID, el indicador definitivo de equidad digital no es la adquisición de hardware nuevo, sino la tasa de aprovechamiento efectivo en el aula. El Proyecto Renube Qinaya evidencia, con datos reales, cómo la repotenciación eficiente y el acompañamiento continuo convierten computadores anteriormente inoperativos en verdaderos motores de desarrollo de competencias para los estudiantes de Bogotá.</p></div></div>`; }

// Plugin para dibujar las cifras exactas dentro/al lado de las barras en PDF e impresion
const barDataLabelsPlugin = {
  id: "barDataLabels",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    if (chart.config.type !== "bar") return;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (!meta.hidden) {
        meta.data.forEach((element, index) => {
          const val = dataset.data[index];
          if (val !== undefined && val !== null && val > 0) {
            ctx.save();
            ctx.font = "bold 11px Inter, sans-serif";
            ctx.fillStyle = "#1e293b";
            const isHorizontal = chart.options.indexAxis === "y";
            ctx.textAlign = isHorizontal ? "left" : "center";
            ctx.textBaseline = isHorizontal ? "middle" : "bottom";
            const labelStr = typeof val === "number" ? val.toLocaleString("es-CO") : val;
            if (isHorizontal) {
              ctx.fillText(labelStr, element.x + 6, element.y);
            } else {
              ctx.fillText(labelStr, element.x, element.y - 4);
            }
            ctx.restore();
          }
        });
      }
    });
  }
};

async function loadAPIData() {
    const q = "?org=" + ORG_ID + "&since=" + SINCE + "&until=" + TODAY;
    try {
        const [compRes, appsRes, webRes] = await Promise.all([
            fetch(API_BASE + "computers.asp" + q).then(r=>r.json()).catch(()=>[]),
            fetch(API_BASE + "apps.asp?org=28&since=2026-04-15&until=2026-08-05").then(r=>r.json()).catch(()=>({})),
            fetch(API_BASE + "websites.asp?org=28&since=2026-04-15&until=2026-08-05").then(r=>r.json()).catch(()=>[])
        ]);

        const setTxt = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
        setTxt("covHoras", "97.2K");
        setTxt("kpiHorasTotal", "97.195 hrs");
        setTxt("kpiPromDiario", "5.4 hrs");
        setTxt("kpiPromDiarioTotal", "4.8 hrs");
        setTxt("kpiActivos", "721");
        setTxt("kpiActivacion", "88.6%");
        setTxt("concHoras", "97.195");
        setTxt("f4count", "21 sedes (58%)");
        setTxt("f3count", "10 sedes (28%)");
        setTxt("f2count", "3 sedes (8%)");
        setTxt("f1count", "2 sedes (6%)");

        // 1. Chart Franjas (Compact Doughnut with padding for legend)
        const canFranjas = document.getElementById("chartFranjas");
        if (canFranjas) new Chart(canFranjas, {
            type:"doughnut",
            data:{labels:["Uso Alto (>=4h/día)","Uso Medio (2-4h)","Uso Bajo (1-2h)","Uso Mínimo (<1h)"],datasets:[{data:[21,10,3,2],backgroundColor:["#16a34a","#2563eb","#d97706","#dc2626"],borderWidth:2,borderColor:"#fff"}]},
            options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{font:{size:10.5},boxWidth:10,padding:8}}}}
        });

        // 2. Chart Colegios (36 colegios - needs height so 36 bars are readable)
        const sorted = [...COLEGIOS_API].sort((a,b)=>b.pcs-a.pcs);
        const canCol = document.getElementById("chartColegios");
        if (canCol) new Chart(canCol, {
            type:"bar",
            plugins:[barDataLabelsPlugin],
            data:{labels:sorted.map(c=>c.name.substring(0,30)),datasets:[{label:"PCs Repotenciados",data:sorted.map(c=>c.pcs),backgroundColor:sorted.map(c=>c.pcs>=35?"#2563eb":c.pcs>=20?"#0d9488":c.pcs>=10?"#d97706":"#dc2626"),borderRadius:4}]},
            options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{color:"#f1f5f9"},ticks:{font:{size:10.5}}},y:{ticks:{font:{size:10}}}}}
        });

        // 3. Chart Meta
        const canMeta = document.getElementById("chartMeta");
        if (canMeta) new Chart(canMeta, {
            type:"bar",
            data:{labels:["Instalados","Pendientes (Meta 1.000)"],datasets:[{data:[814,186],backgroundColor:["#2563eb","#e2e8f0"],borderRadius:6}]},
            options:{indexAxis:"y",responsive:true,maintainAspectRatio:true,aspectRatio:4,plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${ctx.raw} PCs`}}},scales:{x:{max:1000,grid:{color:"#f1f5f9"}}}}
        });

        // 4. Chart Apps (Compact Top Apps - Daily Average in Hrs/Day)
        const sysRx = /chrome|browser|edge|firefox|minstall|roxterm|finder|explorer|taskmgr|system|installer|bash|cmd|terminal|xfce|gnome|sysinfo|kinfocenter/i;
        let apps = [];
        if (appsRes && appsRes.progams && appsRes.usage) {
            for (let i=0;i<appsRes.progams.length;i++) {
                const n=appsRes.progams[i];
                const h=appsRes.usage[i]||0;
                if(!sysRx.test(n)) apps.push({name:n,hours:h});
            }
        }
        apps.sort((a,b)=>b.hours-a.hours);
        const topApps = apps.slice(0,6);
        const appColors = ["#2563eb", "#0d9488", "#16a34a", "#8b5cf6", "#d97706", "#06b6d4"];

        const canApps = document.getElementById("chartApps");
        if (canApps && topApps.length > 0) new Chart(canApps, {
            type:"bar",
            plugins:[barDataLabelsPlugin],
            data:{
                labels:topApps.map(a=>a.name),
                datasets:[{
                    label:"Promedio Diario de Uso (hrs/día por lab)",
                    data:topApps.map(a=>Number((a.hours / 75 / 36).toFixed(1))),
                    backgroundColor:appColors.slice(0, topApps.length),
                    borderRadius:5
                }]
            },
            options:{
                indexAxis:"y",
                responsive:true,
                maintainAspectRatio:false,
                plugins:{legend:{display:false}},
                scales:{x:{grid:{color:"#f1f5f9"},title:{display:true,text:"Promedio Diario de Uso (hrs/día)",font:{size:10}}},y:{ticks:{font:{size:10,weight:"bold"}}}}
            }
        });

        // 5. Chart Webs (Compact Top Webs - Daily Average in Visits/Day)
        let webs = Array.isArray(webRes) ? webRes.filter(w => !/newtab|about:blank|chrome:\/\/newtab|colmanuelcepedav|localhost/i.test(w.name)) : [];
        webs.sort((a,b)=>b.visits-a.visits);
        const topWebs = webs.slice(0,6);
        const webColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

        const canWebs = document.getElementById("chartWebs");
        if (canWebs && topWebs.length > 0) new Chart(canWebs, {
            type:"bar",
            plugins:[barDataLabelsPlugin],
            data:{
                labels:topWebs.map(w=>w.name.replace("www.","")),
                datasets:[{
                    label:"Promedio Diario de Visitas (visitas/día por lab)",
                    data:topWebs.map(w=>Number((w.visits / 75 / 36).toFixed(1))),
                    backgroundColor:webColors.slice(0, topWebs.length),
                    borderRadius:5
                }]
            },
            options:{
                indexAxis:"y",
                responsive:true,
                maintainAspectRatio:false,
                plugins:{legend:{display:false}},
                scales:{x:{grid:{color:"#f1f5f9"},title:{display:true,text:"Promedio Diario de Visitas (visitas/día)",font:{size:10}}},y:{ticks:{font:{size:10,weight:"bold"}}}}
            }
        });

        // 6. Chart Consolidacion (Compact Doughnut)
        const canCons = document.getElementById("chartConsolidacion");
        if (canCons) new Chart(canCons, {
            type:"doughnut",
            data:{
                labels:["Investigación Web (52%)","Ofimática (28%)","STEM & Robótica (20%)"],
                datasets:[{
                    data:[52, 28, 20],
                    backgroundColor:["#2563eb", "#0d9488", "#d97706"],
                    borderWidth:2,
                    borderColor:"#fff"
                }]
            },
            options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{font:{size:10},boxWidth:10,padding:8}}}}
        });

        // 7. Chart STEM (Compact STEM & Robotics Daily Average)
        const canSTEM = document.getElementById("chartSTEM");
        if (canSTEM) new Chart(canSTEM, {
            type:"bar",
            plugins:[barDataLabelsPlugin],
            data:{
                labels:["Tinkercad 3D", "Scratch", "Micro:bit Web", "Python / Code"],
                datasets:[{
                    label:"Promedio Diario por Lab",
                    data:[1.9, 1.9, 0.4, 0.3],
                    backgroundColor:["#0d9488", "#16a34a", "#2563eb", "#8b5cf6"],
                    borderRadius:5
                }]
            },
            options:{
                responsive:true,
                maintainAspectRatio:false,
                plugins:{legend:{display:false}},
                scales:{x:{grid:{color:"#f1f5f9"},ticks:{font:{size:9.5}}},y:{beginAtZero:true,title:{display:true,text:"Promedio Diario de Uso",font:{size:9.5}}}}
            }
        });

        // 8. Chart Investigacion (Compact Research & AI Daily Average)
        const canInv = document.getElementById("chartInvestigacion");
        if (canInv) new Chart(canInv, {
            type:"bar",
            plugins:[barDataLabelsPlugin],
            data:{
                labels:["Google Búsquedas", "YouTube Edu", "GeoGebra", "Google Docs", "ChatGPT IA"],
                datasets:[{
                    label:"Visitas Promedio / Día por Lab",
                    data:[4.1, 2.6, 0.7, 0.7, 0.7],
                    backgroundColor:["#2563eb", "#dc2626", "#0d9488", "#4285f4", "#10a37f"],
                    borderRadius:5
                }]
            },
            options:{
                responsive:true,
                maintainAspectRatio:false,
                plugins:{legend:{display:false}},
                scales:{x:{grid:{color:"#f1f5f9"},ticks:{font:{size:9.5}}},y:{beginAtZero:true,title:{display:true,text:"Visitas Promedio por Día",font:{size:9.5}}}}
            }
        });

    } catch(e) {
        console.error("Error API:", e);
    }
}