# -*- coding: utf-8 -*-
"""
Script para generar el documento oficial en Word (.docx) del:
'Módulo de Computación en la Nube: Capacitación Docente y Revitalización de Equipos Escolares'
Para Qinaya.
"""

import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    """Establece el color de fondo de una celda."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Establece márgenes internos de una celda."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def add_callout_box(doc, title, text, border_color="1E5BA8", bg_color="F1F5F9"):
    """Crea una caja destacada tipo callout con borde lateral izquierdo."""
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    cell = table.rows[0].cells[0]
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=200, right=200)
    
    # Borde izquierdo grueso
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="36" w:space="0" w:color="{border_color}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    run_t = p.add_run(title)
    run_t.font.name = "Calibri"
    run_t.font.size = Pt(11)
    run_t.font.bold = True
    run_t.font.color.rgb = RGBColor.from_string(border_color)
    
    p2 = cell.add_paragraph()
    p2.paragraph_format.space_before = Pt(0)
    p2.paragraph_format.space_after = Pt(0)
    run_b = p2.add_run(text)
    run_b.font.name = "Calibri"
    run_b.font.size = Pt(10)
    run_b.font.color.rgb = RGBColor(51, 65, 85)
    
    # Espacio tras la tabla
    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(4)
    p_after.paragraph_format.space_after = Pt(4)

def build_docx(filename="Modulo_de_Computacion_en_la_Nube_Qinaya.docx"):
    doc = docx.Document()
    
    # Configuración de márgenes
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(1)
        s.bottom_margin = Inches(1)
        s.left_margin = Inches(1)
        s.right_margin = Inches(1)
        
        # Header y Footer
        header = s.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("QINAYA | MÓDULO DE COMPUTACIÓN EN LA NUBE")
        hrun.font.name = "Calibri"
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(148, 163, 184)
        
        footer = s.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Programa de Capacitación Docente y Revitalización Digital • 2026")
        frun.font.name = "Calibri"
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(148, 163, 184)

    # ==========================================
    # PORTADA / ENCABEZADO PRINCIPAL
    # ==========================================
    p_pre = doc.add_paragraph()
    p_pre.paragraph_format.space_before = Pt(10)
    p_pre.paragraph_format.space_after = Pt(4)
    run_badge = p_pre.add_run("QINAYA EDUCACIÓN DIGITAL • CAPACITACIÓN INSTITUCIONAL")
    run_badge.font.name = "Calibri"
    run_badge.font.size = Pt(10)
    run_badge.font.bold = True
    run_badge.font.color.rgb = RGBColor(234, 88, 12) # Qinaya Orange

    # Título Principal
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(8)
    run_title = p_title.add_run("Módulo de Computación en la Nube")
    run_title.font.name = "Calibri"
    run_title.font.size = Pt(26)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(30, 91, 168) # Primary Blue

    # Subtítulo
    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(18)
    run_sub = p_sub.add_run("Guía Docente de Revitalización de Equipos Escolares con Qinaya Linux, Computadores Virtuales y Herramientas de Nube")
    run_sub.font.name = "Calibri"
    run_sub.font.size = Pt(13)
    run_sub.font.color.rgb = RGBColor(71, 85, 105)

    # Tabla Ficha Metadatos
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Destinatarios:", "Docentes de Tecnología, Informática y Áreas Técnicas del Colegio"),
        ("Duración Total:", "3 Sesiones Teórico-Prácticas (Intensidad total: 7.5 Horas)"),
        ("Modelo Pedagógico:", "Train the Trainer (Aprende el Docente y Replica en el Aula con los Estudiantes)"),
        ("Tecnologías Centrales:", "Qinaya Linux (SO Liviano), Computadores Virtuales en la Nube, Rufus, Dropbox y MEGA")
    ]
    for i, (k, v) in enumerate(meta_data):
        row = meta_table.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width = Inches(2.0)
        c1.width = Inches(4.5)
        set_cell_background(c0, "F8FAFC")
        set_cell_background(c1, "F1F5F9")
        set_cell_margins(c0, top=60, bottom=60, left=100, right=100)
        set_cell_margins(c1, top=60, bottom=60, left=100, right=100)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(k)
        r0.font.bold = True
        r0.font.size = Pt(9.5)
        r0.font.color.rgb = RGBColor(30, 91, 168)
        
        p1 = c1.paragraphs[0]
        r1 = p1.add_run(v)
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # ==========================================
    # 1. INTRODUCCIÓN Y ENFOQUE
    # ==========================================
    h1 = doc.add_heading(level=1)
    h1.paragraph_format.space_before = Pt(16)
    h1.paragraph_format.space_after = Pt(8)
    r_h1 = h1.add_run("1. Introducción y Enfoque Pedagógico")
    r_h1.font.name = "Calibri"
    r_h1.font.color.rgb = RGBColor(30, 91, 168)

    p_intro = doc.add_paragraph()
    p_intro.paragraph_format.space_after = Pt(10)
    p_intro.add_run(
        "Las instituciones educativas cuentan con profesores altamente capacitados que ya conocen el mantenimiento físico de computadores "
        "(limpieza de partes, verificación de hardware y ensamble). Sin embargo, las salas de cómputo enfrentan una problemática recurrente: "
        "computadores con 8 a 12 años de uso que ya no soportan los sistemas operativos tradicionales ni sus constantes actualizaciones pesadas, "
        "volviendo la experiencia de clase lenta y frustrante tanto para el docente como para el estudiante.\n\n"
        "Frente a este escenario, la respuesta tradicional suele ser declarar los equipos obsoletos y solicitar cuantiosos presupuestos para reemplazarlos. "
        "El presente Módulo de Computación en la Nube propone un camino diferente e innovador desarrollado por Qinaya: revitalizar esos mismos equipos "
        "sin exigir especificaciones de hardware local, combinando un sistema operativo ultra liviano (Qinaya Linux) con la potencia de computadores en la nube "
        "y un ecosistema colaborativo de almacenamiento digital."
    )

    add_callout_box(
        doc,
        "La Gran Ecuación de la Revitalización Qinaya:",
        "Equipo Escolar Antiguo + Sistema Liviano (<450MB RAM) + Computador Virtual en la Nube = Estación de Trabajo Rápida, Segura y Libre de Virus.",
        border_color="0284C7",
        bg_color="E0F2FE"
    )

    # Metodología Aprende y Replica
    p_met = doc.add_paragraph()
    p_met.paragraph_format.space_after = Pt(12)
    p_met.add_run(
        "El módulo está estructurado bajo la metodología 'Aprende y Replica': cada sesión está diseñada para que el docente adquiera el dominio técnico "
        "y conceptual, y cuente a la vez con retos de laboratorio estructurados para aplicar directamente con sus estudiantes en el aula de clases."
    )

    # ==========================================
    # 2. SESIÓN 1
    # ==========================================
    doc.add_page_break()
    h2_s1 = doc.add_heading(level=1)
    h2_s1.paragraph_format.space_before = Pt(14)
    h2_s1.paragraph_format.space_after = Pt(6)
    r_s1 = h2_s1.add_run("2. Sesión 1: Sistemas Operativos Livianos, Qinaya Linux y el Computador en la Nube")
    r_s1.font.name = "Calibri"
    r_s1.font.color.rgb = RGBColor(30, 91, 168)

    p_s1_meta = doc.add_paragraph()
    p_s1_meta.paragraph_format.space_after = Pt(10)
    r_dur1 = p_s1_meta.add_run("Duración estimada: ")
    r_dur1.bold = True
    p_s1_meta.add_run("2 Horas  |  ")
    r_enf1 = p_s1_meta.add_run("Enfoque: ")
    r_enf1.bold = True
    p_s1_meta.add_run("Fundamentación teórica, especificaciones de Qinaya Linux y exploración del entorno dual (local vs. virtual).")

    # 2.1 Objetivos de Aprendizaje
    h3 = doc.add_heading(level=2)
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after = Pt(6)
    r_obj1 = h3.add_run("2.1 Objetivos de Aprendizaje")
    r_obj1.font.color.rgb = RGBColor(2, 132, 199)

    obj_s1_table = doc.add_table(rows=2, cols=2)
    obj_s1_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    # Headers
    h_c0, h_c1 = obj_s1_table.rows[0].cells[0], obj_s1_table.rows[0].cells[1]
    h_c0.width, h_c1.width = Inches(3.25), Inches(3.25)
    set_cell_background(h_c0, "1E5BA8")
    set_cell_background(h_c1, "EA580C")
    set_cell_margins(h_c0, 80, 80, 100, 100)
    set_cell_margins(h_c1, 80, 80, 100, 100)
    p_h0 = h_c0.paragraphs[0]
    p_h0.add_run("Objetivos para el Docente").font.bold = True
    p_h0.runs[0].font.color.rgb = RGBColor(255, 255, 255)
    p_h1 = h_c1.paragraphs[0]
    p_h1.add_run("Objetivos de Transferencia a Estudiantes").font.bold = True
    p_h1.runs[0].font.color.rgb = RGBColor(255, 255, 255)
    # Body
    b_c0, b_c1 = obj_s1_table.rows[1].cells[0], obj_s1_table.rows[1].cells[1]
    set_cell_background(b_c0, "F8FAFC")
    set_cell_background(b_c1, "FFF7ED")
    set_cell_margins(b_c0, 100, 100, 120, 120)
    set_cell_margins(b_c1, 100, 100, 120, 120)
    
    b_c0.paragraphs[0].add_run(
        "• Diferenciar entre procesamiento local en la máquina física y computación virtual en la nube.\n"
        "• Conocer las especificaciones técnicas de Qinaya Linux (<450MB de RAM y arranque en <35s).\n"
        "• Dominar el discurso pedagógico para motivar a los estudiantes sobre el poder del software libre y la nube."
    ).font.size = Pt(9.5)
    
    b_c1.paragraphs[0].add_run(
        "• Desmitificar la necesidad de computadores nuevos costosos para aprender tecnología avanzada.\n"
        "• Manejar la interfaz amigable de Qinaya Linux y sus aplicaciones locales.\n"
        "• Autenticarse e iniciar sesión en el Computador Virtual de Qinaya desde el Launcher."
    ).font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 2.2 Conceptos Clave
    h3 = doc.add_heading(level=2)
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after = Pt(6)
    r_conc1 = h3.add_run("2.2 Conceptos Clave y Documentación")
    r_conc1.font.color.rgb = RGBColor(2, 132, 199)

    doc.add_paragraph(
        "A. ¿Qué es un Sistema Operativo Liviano?\n"
        "Es una distribución construida sobre el kernel de Linux depurada de procesos comerciales superfluos, indexación pesada y telemetría de rastreo. "
        "A diferencia de Windows 10/11 que satura la memoria RAM y el disco duro mecánico al 100%, Qinaya Linux deja el hardware en reposo absoluto, "
        "permitiendo que toda la máquina esté disponible para la navegación y la conexión de red.\n\n"
        "B. El Ecosistema Dual de Qinaya Linux:\n"
        "Qinaya Linux no es una terminal ciega; integra dos capas complementarias:\n"
        "1. Capa Local: Incluye un navegador web ágil preinstalado, utilidades de diagnóstico de conectividad (Ethernet/WiFi), selector de resolución y "
        "soporte nativo para periféricos educativos (cámaras web, diademas con audio y micro, y reconocimiento de placas de robótica como Arduino y BBC Micro:bit).\n"
        "2. Capa Virtual (La Nube): Un icono en el escritorio abre el Launcher de Qinaya. Al introducir sus credenciales escolares, el usuario se conecta "
        "en pantalla completa a una máquina virtual robusta con abundante RAM y capacidad de procesamiento para suites de ofimática, edición y programación.\n\n"
        "C. Ventajas de Trabajar en el Computador Virtual:\n"
        "• Rendimiento uniforme: Todos los estudiantes disfrutan de la misma velocidad sin importar el año del computador físico.\n"
        "• Protección contra desconfiguraciones: Si el alumno comete un error grave en la sesión, la máquina virtual se reinicia a su estado óptimo de fábrica en segundos."
    )

    # 2.3 Ejercicio Práctico Estudiantes
    add_callout_box(
        doc,
        "Reto Estudiantil #1: 'Explorando la Nube con Qinaya'",
        "Actividad de Aula para Estudiantes:\n"
        "1. Encender el computador con Qinaya Linux y cronometrar con un reloj el tiempo hasta ver el escritorio (meta de clase: menos de 40 segundos).\n"
        "2. Abrir el navegador web local y comprobar la navegación por un portal de investigación escolar.\n"
        "3. Conectar una memoria USB o diadema con micrófono y verificar la detección inmediata de sonido.\n"
        "4. Abrir el Launcher de Qinaya, iniciar sesión con su usuario y acceder al escritorio virtual en la nube.\n"
        "5. Abrir la suite ofimática en la nube y redactar una breve comparación.\n\n"
        "Entregable del Estudiante: Ficha técnica estudiantil comparando la velocidad de arranque y las aplicaciones abiertas en local vs. virtual.",
        border_color="EA580C",
        bg_color="FFF7ED"
    )

    # ==========================================
    # 3. SESIÓN 2
    # ==========================================
    doc.add_page_break()
    h2_s2 = doc.add_heading(level=1)
    h2_s2.paragraph_format.space_before = Pt(14)
    h2_s2.paragraph_format.space_after = Pt(6)
    r_s2 = h2_s2.add_run("3. Sesión 2: Instalación y Puesta a Punto de Qinaya Linux")
    r_s2.font.name = "Calibri"
    r_s2.font.color.rgb = RGBColor(30, 91, 168)

    p_s2_meta = doc.add_paragraph()
    p_s2_meta.paragraph_format.space_after = Pt(10)
    p_s2_meta.add_run("Duración estimada: ").bold = True
    p_s2_meta.add_run("3 Horas  |  ")
    p_s2_meta.add_run("Enfoque: ").bold = True
    p_s2_meta.add_run("Creación de medios de arranque con Rufus, configuración de BIOS/UEFI e instalación limpia en disco.")

    # 3.1 Objetivos de Aprendizaje
    h3 = doc.add_heading(level=2)
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after = Pt(6)
    r_obj2 = h3.add_run("3.1 Objetivos de Aprendizaje")
    r_obj2.font.color.rgb = RGBColor(2, 132, 199)

    obj_s2_table = doc.add_table(rows=2, cols=2)
    obj_s2_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    h_c0, h_c1 = obj_s2_table.rows[0].cells[0], obj_s2_table.rows[0].cells[1]
    h_c0.width, h_c1.width = Inches(3.25), Inches(3.25)
    set_cell_background(h_c0, "1E5BA8")
    set_cell_background(h_c1, "EA580C")
    set_cell_margins(h_c0, 80, 80, 100, 100)
    set_cell_margins(h_c1, 80, 80, 100, 100)
    h_c0.paragraphs[0].add_run("Objetivos para el Docente").font.bold = True
    h_c0.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    h_c1.paragraphs[0].add_run("Objetivos de Transferencia a Estudiantes").font.bold = True
    h_c1.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    
    b_c0, b_c1 = obj_s2_table.rows[1].cells[0], obj_s2_table.rows[1].cells[1]
    set_cell_background(b_c0, "F8FAFC")
    set_cell_background(b_c1, "FFF7ED")
    set_cell_margins(b_c0, 100, 100, 120, 120)
    set_cell_margins(b_c1, 100, 100, 120, 120)
    
    b_c0.paragraphs[0].add_run(
        "• Dominar la herramienta de software libre Rufus para flashear imágenes ISO en memorias USB.\n"
        "• Aprender los parámetros de BIOS/UEFI (arranque Legacy vs. UEFI y desactivación de Secure Boot).\n"
        "• Guiar y supervisar el despliegue del sistema operativo en lote en la sala de informática del colegio."
    ).font.size = Pt(9.5)
    
    b_c1.paragraphs[0].add_run(
        "• Conocer qué es una imagen ISO y cómo funciona el arranque de un computador desde un medio externo.\n"
        "• Aprender a ingresar al Boot Menu de diferentes marcas de computadores sin temor.\n"
        "• Ejecutar el proceso de instalación guiada de software libre paso a paso."
    ).font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 3.2 Paso a Paso Técnico
    h3 = doc.add_heading(level=2)
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after = Pt(6)
    r_conc2 = h3.add_run("3.2 Paso a Paso Técnico: Grabación con Rufus y Configuración de Arranque")
    r_conc2.font.color.rgb = RGBColor(2, 132, 199)

    doc.add_paragraph(
        "A. Creación de la Memoria USB Booteable con Rufus:\n"
        "1. Conectar una memoria USB de al menos 4 GB o 8 GB (advertir que su contenido previo será borrado).\n"
        "2. Abrir Rufus (herramienta gratuita y portable).\n"
        "3. En 'Dispositivo', verificar que esté seleccionada la memoria USB correcta.\n"
        "4. En 'Elección de arranque', hacer clic en 'SELECCIONAR' y elegir el archivo .ISO de Qinaya Linux.\n"
        "5. Esquema de partición: Si el PC del colegio es antiguo (BIOS tradicional), seleccionar 'MBR'. Si el equipo cuenta con UEFI moderno, elegir 'GPT'.\n"
        "6. Pulsar 'EMPEZAR' y aceptar la opción recomendada 'Escribir en modo imagen ISO'. Esperar a que la barra complete el 100%.\n\n"
        "B. Ajustes de BIOS/UEFI y Menú de Arranque:\n"
        "Al encender el computador, presionar de inmediato y de forma repetida la tecla correspondiente a la marca del equipo:"
    )

    # Tabla de Teclas de Boot
    boot_table = doc.add_table(rows=5, cols=3)
    boot_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    boot_headers = ["Fabricante / Marca", "Tecla Boot Menu (Arranque Rápido)", "Tecla Configuración BIOS"]
    for j, htext in enumerate(boot_headers):
        cell = boot_table.rows[0].cells[j]
        set_cell_background(cell, "1E5BA8")
        set_cell_margins(cell, 60, 60, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(htext)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)
    
    boot_data = [
        ("HP / Compaq", "F9  (o Esc seguido de F9)", "F10"),
        ("Lenovo / ThinkCentre", "F12", "F1  /  Enter"),
        ("Dell / OptiPlex / Vostro", "F12", "F2"),
        ("Asus / Acer / Clones", "F8  /  F12", "Supr / Del  /  F2")
    ]
    for row_idx, data_row in enumerate(boot_data):
        row = boot_table.rows[row_idx + 1]
        for col_idx, cell_value in enumerate(data_row):
            cell = row.cells[col_idx]
            bg = "F8FAFC" if row_idx % 2 == 0 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 50, 50, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(cell_value)
            r.font.size = Pt(9)
            if col_idx == 1:
                r.font.bold = True
                r.font.color.rgb = RGBColor(234, 88, 12)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    doc.add_paragraph(
        "C. Instalación en Disco Duro:\n"
        "1. Seleccionar la memoria USB en el menú de arranque.\n"
        "2. El instalador de Qinaya Linux cargará automáticamente en pantalla.\n"
        "3. Seleccionar el idioma Español (Latinoamérica) y distribución de teclado.\n"
        "4. En tipo de instalación, elegir 'Borrar disco e instalar Qinaya Linux' (configura partición Ext4 y memoria Swap de apoyo).\n"
        "5. Al finalizar el proceso, retirar la memoria USB y pulsar Enter para reiniciar. ¡El computador escolar ha quedado revitalizado!"
    )

    # 3.3 Ejercicio Práctico Estudiantes
    add_callout_box(
        doc,
        "Reto Estudiantil #2: 'Misión Rescate: Flasheo e Instalación'",
        "Actividad de Aula para Estudiantes:\n"
        "1. En parejas de técnicos escolares, preparar una memoria USB booteable con Rufus y la ISO de Qinaya Linux.\n"
        "2. Asignar un computador en desuso del colegio e identificar su marca para seleccionar la tecla de arranque.\n"
        "3. Acceder al BIOS si es necesario y verificar que Secure Boot esté desactivado (Disabled).\n"
        "4. Ejecutar la instalación completa en disco.\n"
        "5. Reiniciar, verificar que arranque en menos de 40 segundos y probar auriculares y conexión a internet.\n\n"
        "Entregable del Estudiante: Acta de Entrega Técnica diligenciada con serial del equipo, tiempo de arranque y firma de conformidad.",
        border_color="EA580C",
        bg_color="FFF7ED"
    )

    # ==========================================
    # 4. SESIÓN 3
    # ==========================================
    doc.add_page_break()
    h2_s3 = doc.add_heading(level=1)
    h2_s3.paragraph_format.space_before = Pt(14)
    h2_s3.paragraph_format.space_after = Pt(6)
    r_s3 = h2_s3.add_run("4. Sesión 3: Herramientas de Nube, Gestión de Archivos y Trabajo Colaborativo")
    r_s3.font.name = "Calibri"
    r_s3.font.color.rgb = RGBColor(30, 91, 168)

    p_s3_meta = doc.add_paragraph()
    p_s3_meta.paragraph_format.space_after = Pt(10)
    p_s3_meta.add_run("Duración estimada: ").bold = True
    p_s3_meta.add_run("2.5 Horas  |  ")
    p_s3_meta.add_run("Enfoque: ").bold = True
    p_s3_meta.add_run("El Puente de Archivos, repositorios en la nube, casillas de entrega de tareas y salas blindadas contra virus.")

    # 4.1 Objetivos de Aprendizaje
    h3 = doc.add_heading(level=2)
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after = Pt(6)
    r_obj3 = h3.add_run("4.1 Objetivos de Aprendizaje")
    r_obj3.font.color.rgb = RGBColor(2, 132, 199)

    obj_s3_table = doc.add_table(rows=2, cols=2)
    obj_s3_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    h_c0, h_c1 = obj_s3_table.rows[0].cells[0], obj_s3_table.rows[0].cells[1]
    h_c0.width, h_c1.width = Inches(3.25), Inches(3.25)
    set_cell_background(h_c0, "1E5BA8")
    set_cell_background(h_c1, "16A34A")
    set_cell_margins(h_c0, 80, 80, 100, 100)
    set_cell_margins(h_c1, 80, 80, 100, 100)
    h_c0.paragraphs[0].add_run("Objetivos para el Docente").font.bold = True
    h_c0.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    h_c1.paragraphs[0].add_run("Objetivos de Transferencia a Estudiantes").font.bold = True
    h_c1.paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    
    b_c0, b_c1 = obj_s3_table.rows[1].cells[0], obj_s3_table.rows[1].cells[1]
    set_cell_background(b_c0, "F8FAFC")
    set_cell_background(b_c1, "F0FDF4")
    set_cell_margins(b_c0, 100, 100, 120, 120)
    set_cell_margins(b_c1, 100, 100, 120, 120)
    
    b_c0.paragraphs[0].add_run(
        "• Implementar casillas de recepción de tareas automáticas en la nube para el aula.\n"
        "• Dominar el 'Puente de Archivos' entre el computador virtual y dispositivos locales (celulares o USBs).\n"
        "• Erradicar definitivamente la epidemia de virus por memorias USB en la sala de sistemas."
    ).font.size = Pt(9.5)
    
    b_c1.paragraphs[0].add_run(
        "• Guardar y respaldar sus proyectos escolares en repositorios seguros en la nube.\n"
        "• Entregar tareas académicas por medio de enlaces digitales directos sin requerir cuentas complejas.\n"
        "• Trabajar en equipo simultáneamente sobre documentos compartidos en la nube."
    ).font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # 4.2 Conceptos Clave
    h3 = doc.add_heading(level=2)
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after = Pt(6)
    r_conc3 = h3.add_run("4.2 Conceptos Clave y Ecosistema de Almacenamiento")
    r_conc3.font.color.rgb = RGBColor(2, 132, 199)

    doc.add_paragraph(
        "A. El Paradigma del 'Puente de Archivos':\n"
        "En un esquema de computación en la nube, el computador virtual no debe confundirse con una simple memoria USB. Los estudiantes rotan "
        "por diferentes máquinas físicas a lo largo de la semana. Por tanto, el trabajo debe guardarse en la nube para asegurar que esté accesible "
        "desde cualquier computador del colegio o desde casa.\n\n"
        "B. Herramientas Recomendadas para el Aula:\n"
        "1. Dropbox y su función 'Solicitud de Archivos' (File Request):\n"
        "Es la solución ideal para la recolección de tareas. El docente genera un enlace único para su clase (ej. 'Taller Robótica 9A'). "
        "Los estudiantes ingresan a ese enlace desde el computador virtual y suben sus archivos. "
        "¡Los alumnos NO necesitan registrarse ni tener cuenta en Dropbox! El docente recibe todos los trabajos centralizados y organizados con el nombre de cada alumno.\n\n"
        "2. MEGA (20 GB Gratuitos Cifrados):\n"
        "Excelente alternativa para proyectos pesados de multimedia, programación o diseño 3D que sobrepasan los límites de un correo o Drive convencional.\n\n"
        "3. Wormhole & SwissTransfer (Transferencias Efímeras con Código QR):\n"
        "Permite pasar archivos pesados al instante entre el computador virtual y el celular del estudiante o una memoria física mediante un código QR sin crear cuentas.\n\n"
        "C. La Gran Ventaja Oculta: Salas Escolares Blindadas contra Virus:\n"
        "En las salas tradicionales con Windows, una sola memoria USB infectada propaga gusanos y accesos directos por toda la red. "
        "En el ecosistema Qinaya, los virus habituales de Windows (.exe, .vbs, autorun) son completamente inofensivos tanto para Qinaya Linux "
        "como para los servidores en la nube. Se acaba la necesidad de formatear los computadores cada periodo académico."
    )

    # 4.3 Ejercicio Práctico Estudiantes
    add_callout_box(
        doc,
        "Reto Estudiantil #3: 'La Carrera de la Nube Colaborativa'",
        "Actividad de Aula para Estudiantes:\n"
        "1. Iniciar sesión en el computador virtual de Qinaya.\n"
        "2. En equipos de 2 o 3 estudiantes, abrir la suite ofimática en la nube y redactar un informe conjunto sobre una temática asignada.\n"
        "3. Entregar el archivo final directamente en el enlace de 'Solicitud de Archivos' de Dropbox preparado por el profesor.\n"
        "4. Utilizar Wormhole.app para generar un código QR y descargar una copia de respaldo del informe en su teléfono móvil.\n"
        "5. Cerrar la sesión en el computador virtual y confirmar que el equipo físico queda completamente limpio para la siguiente clase.\n\n"
        "Entregable del Estudiante: Confirmación de entrega digital en la bandeja del profesor y portafolio digital disponible en la nube.",
        border_color="16A34A",
        bg_color="F0FDF4"
    )

    # ==========================================
    # 5. ANEXOS: FORMATOS IMPRIMIBLES
    # ==========================================
    doc.add_page_break()
    h2_anx = doc.add_heading(level=1)
    h2_anx.paragraph_format.space_before = Pt(14)
    h2_anx.paragraph_format.space_after = Pt(6)
    r_anx = h2_anx.add_run("5. Anexo: Formato QN-REV-01 (Ficha Técnica de Equipo Revitalizado)")
    r_anx.font.name = "Calibri"
    r_anx.font.color.rgb = RGBColor(30, 91, 168)

    doc.add_paragraph(
        "Este formato está diseñado para ser fotocopiado y utilizado en las sesiones prácticas con los estudiantes "
        "en el laboratorio de sistemas del colegio."
    )

    ficha_table = doc.add_table(rows=7, cols=3)
    ficha_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    ficha_headers = ["Elemento Verificado", "Especificación / Observación", "Estado Post-Qinaya"]
    for j, htext in enumerate(ficha_headers):
        cell = ficha_table.rows[0].cells[j]
        set_cell_background(cell, "1E5BA8")
        set_cell_margins(cell, 60, 60, 100, 100)
        p = cell.paragraphs[0]
        r = p.add_run(htext)
        r.font.bold = True
        r.font.size = Pt(9.5)
        r.font.color.rgb = RGBColor(255, 255, 255)

    ficha_rows = [
        ("Identificación del Equipo", "Número de Equipo: _________   |  Ubicación en Sala: _________", "[  ] Registrado"),
        ("Memoria RAM Física", "Capacidad: [  ] 1GB   [  ] 2GB   [  ] 4GB   [  ] Otra", "[  ] Reconocida"),
        ("Instalación de Qinaya Linux", "Medio utilizado: Memoria USB creada con Rufus", "[  ] Instalación Exitosa"),
        ("Tiempo de Arranque Medido", "Segundos desde encendido hasta ver escritorio: _______ seg", "[  ] Menor a 40 seg"),
        ("Periféricos y Sonido", "Audio probado con auriculares: [  ] Sí  |  Red: [  ] WiFi [  ] Cable", "[  ] Operativo 100%"),
        ("Conexión al PC Virtual", "Launcher Qinaya ejecutado y sesión iniciada con usuario escolar", "[  ] Sesión Conectada")
    ]
    for r_idx, r_data in enumerate(ficha_rows):
        row = ficha_table.rows[r_idx + 1]
        for c_idx, c_val in enumerate(r_data):
            cell = row.cells[c_idx]
            bg = "F8FAFC" if r_idx % 2 == 0 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 60, 60, 100, 100)
            p = cell.paragraphs[0]
            r = p.add_run(c_val)
            r.font.size = Pt(9)
            if c_idx == 0:
                r.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(20)

    # Firmas
    firmas_p = doc.add_paragraph()
    firmas_p.paragraph_format.space_before = Pt(30)
    firmas_p.paragraph_format.space_after = Pt(0)
    firmas_p.add_run(
        "________________________________________                  ________________________________________\n"
        "       Firma del Estudiante Técnico                               Firma del Docente de Tecnología"
    ).font.size = Pt(10)

    # Guardar
    doc.save(filename)
    print(f"Documento guardado con éxito en: {filename}")

if __name__ == "__main__":
    build_docx()
