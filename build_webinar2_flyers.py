import os
import math
from PIL import Image, ImageDraw, ImageFont

WORKSPACE = r"c:\Users\USER\Desktop\Kit Bienvenida Qinaya"
LOGO_RENUBE = os.path.join(WORKSPACE, "logoqinayarenube.jpeg")
LOGO_QINAYA = os.path.join(WORKSPACE, "logo Qinaya.png")
LOGO_SED = os.path.join(WORKSPACE, "logo_sed_bogota.png")
GAME_IMG_PATH = os.path.join(WORKSPACE, "juego scratch webinar2.png")

FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_SEMI = r"C:\Windows\Fonts\segoeui.ttf"
FONT_ITALIC = r"C:\Windows\Fonts\segoeuii.ttf"

def create_gradient(width, height, start_color, end_color):
    base = Image.new("RGBA", (width, height), start_color)
    top = Image.new("RGBA", (width, height), end_color)
    mask = Image.new("L", (width, height))
    mask_draw = ImageDraw.Draw(mask)
    for y in range(height):
        alpha = int(255 * (y / height))
        mask_draw.line([(0, y), (width, y)], fill=alpha)
    return Image.composite(top, base, mask)

def draw_rounded_rect(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=int(width))

def draw_vector_check(draw, cx, cy, radius, bg_color, check_color, border_color=None):
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=bg_color, outline=border_color, width=1)
    p1 = (cx - radius * 0.45, cy)
    p2 = (cx - radius * 0.1, cy + radius * 0.4)
    p3 = (cx + radius * 0.5, cy - radius * 0.35)
    draw.line([p1, p2, p3], fill=check_color, width=2)

def draw_clock_icon(draw, cx, cy, radius, color):
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), outline=color, width=2)
    draw.line([(cx, cy), (cx, cy - radius * 0.55)], fill=color, width=2)
    draw.line([(cx, cy), (cx + radius * 0.45, cy)], fill=color, width=2)

# ==========================================================
# 1. HORIZONTAL BANNER (1200 x 630 px) - WEBINAR 2 (NOV 5)
# WITH HUGE GAME SCREENSHOT SHOWCASE
# ==========================================================
def build_horizontal_banner():
    W, H = 1200, 630
    img = Image.new("RGBA", (W, H), (10, 18, 36, 255))
    
    grad = create_gradient(W, H, (8, 16, 32, 255), (14, 34, 68, 255))
    img.paste(grad, (0, 0))
    
    # Ambient glows
    glow_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_overlay)
    glow_draw.ellipse((-80, -80, 420, 420), fill=(255, 140, 26, 45))    # Scratch Orange
    glow_draw.ellipse((680, 100, 1250, 650), fill=(37, 99, 235, 60))    # Tech Blue glow behind game
    glow_draw.ellipse((500, -100, 950, 300), fill=(16, 185, 129, 35))   # Success green
    img = Image.alpha_composite(img, glow_overlay)
    draw = ImageDraw.Draw(img)

    # Fonts
    f_badge = ImageFont.truetype(FONT_BOLD, 12)
    f_cat = ImageFont.truetype(FONT_BOLD, 12.5)
    f_title = ImageFont.truetype(FONT_BOLD, 23.5)
    f_sub = ImageFont.truetype(FONT_SEMI, 13.5)
    f_bullet = ImageFont.truetype(FONT_SEMI, 12)
    f_bullet_b = ImageFont.truetype(FONT_BOLD, 12)
    f_footer = ImageFont.truetype(FONT_SEMI, 11)
    
    f_card_tag = ImageFont.truetype(FONT_BOLD, 11)
    f_cal_m = ImageFont.truetype(FONT_BOLD, 11)
    f_cal_d = ImageFont.truetype(FONT_BOLD, 24)
    f_card_h = ImageFont.truetype(FONT_BOLD, 18)
    f_card_time = ImageFont.truetype(FONT_BOLD, 14)
    f_perk = ImageFont.truetype(FONT_SEMI, 11)
    f_perk_b = ImageFont.truetype(FONT_BOLD, 11)
    f_btn = ImageFont.truetype(FONT_BOLD, 13)

    # LEFT COLUMN (Width ~610 px)
    curr_x = 45
    logo_y = 35
    logo_h = 42

    # SED Logo
    if os.path.exists(LOGO_SED):
        raw_sed = Image.open(LOGO_SED).convert("RGBA")
        sed_w = int((logo_h / raw_sed.height) * raw_sed.width)
        raw_sed = raw_sed.resize((sed_w, logo_h), Image.Resampling.LANCZOS)
        box_w = sed_w + 16
        draw_rounded_rect(draw, (curr_x, logo_y, curr_x + box_w, logo_y + logo_h + 10), radius=8, fill=(255, 255, 255, 255))
        img.paste(raw_sed, (curr_x + 8, logo_y + 5), raw_sed)
        curr_x += box_w + 12

    # ReNube Logo
    if os.path.exists(LOGO_RENUBE):
        raw_rn = Image.open(LOGO_RENUBE).convert("RGBA")
        rn_w = int((logo_h / raw_rn.height) * raw_rn.width)
        raw_rn = raw_rn.resize((rn_w, logo_h), Image.Resampling.LANCZOS)
        box_w = rn_w + 16
        draw_rounded_rect(draw, (curr_x, logo_y, curr_x + box_w, logo_y + logo_h + 10), radius=8, fill=(255, 255, 255, 255))
        img.paste(raw_rn, (curr_x + 8, logo_y + 5), raw_rn)
        curr_x += box_w + 12

    # Tag pill: NUEVA FECHA CONFIRMADA
    tag_w = 260
    draw_rounded_rect(draw, (curr_x, logo_y + 3, curr_x + tag_w, logo_y + logo_h + 7), radius=18, fill=(17, 34, 64, 230), outline=(255, 140, 26, 200), width=2)
    draw.ellipse((curr_x + 14, logo_y + 19, curr_x + 24, logo_y + 29), fill=(255, 140, 26, 255))
    draw.text((curr_x + 32, logo_y + 16), "NUEVA FECHA CONFIRMADA", font=f_badge, fill=(255, 255, 255, 255))

    # Super title
    draw.text((45, 106), "WEBINAR 2 • FORMACIÓN PRÁCTICA DOCENTE EN VIVO", font=f_cat, fill=(255, 171, 25, 255))

    # Main Headline
    draw.text((45, 128), "Creación de Videojuegos Educativos con Scratch", font=f_title, fill=(255, 255, 255, 255))
    draw.text((45, 166), "Programación Creativa y Gamificación en Qinaya", font=f_title, fill=(56, 189, 248, 255))
    draw.text((45, 210), "Taller paso a paso: variables, gravedad, colisiones, puntos, vidas y reinicio", font=f_sub, fill=(203, 213, 225, 255))

    # Bullets
    bullets = [
        ("Configuración de Sprites:", " Escenario, Monkey y Bananas con movimiento fluido."),
        ("Lógica de Juego y Clones:", " Gravedad, velocidad y duplicados de objetos."),
        ("Variables Puntos y Vidas:", " Detección de colisión, conteo y sonidos interactivos."),
        ("Game Over y Reinicio:", " Reinicio de partida y adaptación a materias curriculares.")
    ]
    
    start_y = 248
    for b_bold, b_text in bullets:
        draw_vector_check(draw, 56, start_y + 10, 9, (255, 140, 26, 50), (255, 171, 25, 255), (255, 140, 26, 120))
        draw.text((75, start_y + 1), b_bold, font=f_bullet_b, fill=(255, 255, 255, 255))
        bold_w = int(draw.textlength(b_bold, font=f_bullet_b))
        draw.text((75 + bold_w, start_y + 1), b_text, font=f_bullet, fill=(226, 232, 240, 255))
        start_y += 26

    # DATE & TIME HIGHLIGHT CARD ON LEFT COLUMN
    date_box_y = 365
    date_box_w = 565
    date_box_h = 105
    draw_rounded_rect(draw, (45, date_box_y, 45 + date_box_w, date_box_y + date_box_h), radius=16, fill=(15, 26, 48, 240), outline=(255, 140, 26, 220), width=2)
    
    # Calendar tile NOV 05
    cal_x = 65
    cal_y = date_box_y + 16
    draw_rounded_rect(draw, (cal_x, cal_y, cal_x + 72, cal_y + 72), radius=14, fill=(255, 140, 26, 255), outline=(255, 210, 130, 220), width=1)
    draw.text((cal_x + 22, cal_y + 9), "NOV", font=f_cal_m, fill=(255, 255, 255, 255))
    draw.text((cal_x + 20, cal_y + 26), "05", font=f_cal_d, fill=(255, 255, 255, 255))

    draw.text((cal_x + 88, cal_y + 8), "Jueves, 5 de Noviembre de 2026", font=f_card_h, fill=(255, 255, 255, 255))
    draw_clock_icon(draw, cal_x + 98, cal_y + 45, 8, (251, 146, 60, 255))
    draw.text((cal_x + 115, cal_y + 35), "5:30 p.m. a 7:00 p.m. (Hora Colombia)", font=f_card_time, fill=(251, 146, 60, 255))

    # Perks strip under date
    strip_y = 485
    p_items = [
        ("Enlace en vivo:", " Compartido en tu grupo de WhatsApp"),
        ("Plantilla editable:", " Código de Scratch listo para usar"),
        ("Asistencia en línea:", " Formulario oficial SED - Ágata")
    ]
    for p_title, p_desc in p_items:
        draw_vector_check(draw, 56, strip_y + 7, 7, (37, 99, 235, 80), (56, 189, 248, 255), (96, 165, 250, 120))
        draw.text((70, strip_y), p_title, font=f_perk_b, fill=(255, 255, 255, 255))
        tw = int(draw.textlength(p_title, font=f_perk_b))
        draw.text((70 + tw, strip_y), p_desc, font=f_perk, fill=(203, 213, 225, 255))
        strip_y += 24

    # Footer note
    draw.line([(45, 575), (610, 575)], fill=(255, 255, 255, 30), width=1)
    draw.text((45, 588), "Scratch Local en Qinaya: Cero latencia y sin consumir internet • Duración: 90 Min", font=f_footer, fill=(148, 163, 184, 255))

    # RIGHT COLUMN: HUGE VISUAL GAME SHOWCASE
    right_x = 640
    right_w = 515
    game_box_h = 490

    if os.path.exists(GAME_IMG_PATH):
        raw_game = Image.open(GAME_IMG_PATH).convert("RGBA")
        # Target game width: 505 px! Height ~396 px! (Vastly larger than before!)
        gw = 505
        gh = int((gw / raw_game.width) * raw_game.height)
        raw_game = raw_game.resize((gw, gh), Image.Resampling.LANCZOS)
        
        frame_x = right_x + (right_w - gw) // 2
        frame_y = 40
        
        # Outer decorative gaming frame
        draw_rounded_rect(draw, (frame_x - 8, frame_y - 8, frame_x + gw + 8, frame_y + gh + 8), radius=18, fill=(15, 23, 42, 245), outline=(255, 140, 26, 230), width=3)
        img.paste(raw_game, (frame_x, frame_y), raw_game)

        # Badge on Game Frame (Bottom Right over ground)
        draw_rounded_rect(draw, (frame_x + gw - 250, frame_y + gh - 32, frame_x + gw - 12, frame_y + gh - 10), radius=6, fill=(15, 23, 42, 230), outline=(255, 255, 255, 90), width=1)
        draw.text((frame_x + gw - 240, frame_y + gh - 28), "PROYECTO EN VIVO: MONKEY & BANANAS", font=ImageFont.truetype(FONT_BOLD, 9.5), fill=(255, 171, 25, 255))
        
        # Bottom Button under huge game
        btn_y = frame_y + gh + 22
        btn_h = 58
        btn_box = (right_x, btn_y, right_x + right_w, btn_y + btn_h)
        draw_rounded_rect(draw, btn_box, radius=14, fill=(234, 88, 12, 255))
        btn_txt = "¡CONÉCTATE ESTE JUEVES 5 DE NOVIEMBRE!"
        bw = int(draw.textlength(btn_txt, font=ImageFont.truetype(FONT_BOLD, 15)))
        draw.text((right_x + (right_w - bw) // 2, btn_y + 19), btn_txt, font=ImageFont.truetype(FONT_BOLD, 15), fill=(255, 255, 255, 255))

    out_banner = os.path.join(WORKSPACE, "banner_webinar_2_octubre.png")
    temp_banner = os.path.join(WORKSPACE, "temp_banner.png")
    img.save(temp_banner, format="PNG")
    if os.path.exists(out_banner):
        try:
            os.remove(out_banner)
        except Exception:
            pass
    import shutil
    shutil.move(temp_banner, out_banner)
    print(f"Banner guardado exitosamente en: {out_banner}")


# ==========================================================
# 2. WHATSAPP INVITATION FLYER (1080 x 1350 px) - WEBINAR 2 (NOV 5)
# WITH HUGE GAME SCREENSHOT SHOWCASE
# ==========================================================
def build_whatsapp_flyer():
    W, H = 1080, 1350
    img = Image.new("RGBA", (W, H), (10, 18, 36, 255))
    
    grad = create_gradient(W, H, (8, 18, 38, 255), (15, 38, 74, 255))
    img.paste(grad, (0, 0))
    
    # Ambient glows
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    g_draw.ellipse((-120, -100, 500, 500), fill=(255, 140, 26, 45))   # Scratch Orange
    g_draw.ellipse((450, 450, 1150, 1050), fill=(37, 99, 235, 60))    # Blue behind game
    g_draw.ellipse((650, 1000, 1200, 1400), fill=(249, 115, 22, 45))  # Bottom Orange
    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # Fonts
    f_subhead = ImageFont.truetype(FONT_BOLD, 14)
    f_badge = ImageFont.truetype(FONT_BOLD, 15)
    f_title = ImageFont.truetype(FONT_BOLD, 33)
    f_subtitle = ImageFont.truetype(FONT_SEMI, 16.5)
    
    f_date_h = ImageFont.truetype(FONT_BOLD, 27)
    f_date_time = ImageFont.truetype(FONT_BOLD, 22)
    f_cal_m = ImageFont.truetype(FONT_BOLD, 13)
    f_cal_d = ImageFont.truetype(FONT_BOLD, 32)
    
    f_sec_h = ImageFont.truetype(FONT_BOLD, 15.5)
    f_card_b = ImageFont.truetype(FONT_BOLD, 14.5)
    f_card_p = ImageFont.truetype(FONT_SEMI, 13)
    
    f_info_b = ImageFont.truetype(FONT_BOLD, 13.5)
    f_info_p = ImageFont.truetype(FONT_SEMI, 13.5)
    f_btn = ImageFont.truetype(FONT_BOLD, 17.5)

    # 1. TOP LOGOS ROW: SED + ReNube
    curr_x = 50
    logo_y = 35
    logo_h = 50

    # SED Logo
    if os.path.exists(LOGO_SED):
        raw_sed = Image.open(LOGO_SED).convert("RGBA")
        sed_w = int((logo_h / raw_sed.height) * raw_sed.width)
        raw_sed = raw_sed.resize((sed_w, logo_h), Image.Resampling.LANCZOS)
        box_w = sed_w + 18
        draw_rounded_rect(draw, (curr_x, logo_y, curr_x + box_w, logo_y + logo_h + 10), radius=10, fill=(255, 255, 255, 255))
        img.paste(raw_sed, (curr_x + 9, logo_y + 5), raw_sed)
        curr_x += box_w + 14

    # ReNube Logo
    if os.path.exists(LOGO_RENUBE):
        raw_rn = Image.open(LOGO_RENUBE).convert("RGBA")
        rn_w = int((logo_h / raw_rn.height) * raw_rn.width)
        raw_rn = raw_rn.resize((rn_w, logo_h), Image.Resampling.LANCZOS)
        box_w = rn_w + 18
        draw_rounded_rect(draw, (curr_x, logo_y, curr_x + box_w, logo_y + logo_h + 10), radius=10, fill=(255, 255, 255, 255))
        img.paste(raw_rn, (curr_x + 9, logo_y + 5), raw_rn)
        curr_x += box_w + 14

    # Pill tag: High contrast
    tag_w = 340
    draw_rounded_rect(draw, (curr_x, logo_y + 4, curr_x + tag_w, logo_y + logo_h + 6), radius=22, fill=(17, 34, 64, 230), outline=(255, 140, 26, 180), width=2)
    draw.ellipse((curr_x + 16, logo_y + 24, curr_x + 26, logo_y + 34), fill=(255, 140, 26, 255))
    draw.text((curr_x + 36, logo_y + 19), "PROYECTO RENUBE • QINAYA", font=f_badge, fill=(255, 255, 255, 255))

    # Category title
    draw.text((50, 115), "WEBINAR 2 • NUEVA FECHA CONFIRMADA", font=f_subhead, fill=(255, 171, 25, 255))

    # Titles
    draw.text((50, 138), "Creación de Videojuegos Educativos con Scratch", font=f_title, fill=(255, 255, 255, 255))
    draw.text((50, 182), "Programación Creativa y Gamificación en Qinaya", font=f_title, fill=(56, 189, 248, 255))
    draw.text((50, 228), "Taller práctico paso a paso: variables, colisiones, disfraces y diseño de niveles", font=f_subtitle, fill=(203, 213, 225, 255))

    # 2. HUGE GAME SCREENSHOT CONTAINER (MUCH BIGGER AND VISUAL)
    # Expanding to width 680 px and height 532 px!
    game_card_y = 265
    game_card_h = 425
    draw_rounded_rect(draw, (50, game_card_y, W - 50, game_card_y + game_card_h), radius=18, fill=(15, 23, 42, 235), outline=(255, 140, 26, 210), width=3)
    
    if os.path.exists(GAME_IMG_PATH):
        raw_game = Image.open(GAME_IMG_PATH).convert("RGBA")
        g_target_h = game_card_h - 18
        g_target_w = int((g_target_h / raw_game.height) * raw_game.width)
        raw_game = raw_game.resize((g_target_w, g_target_h), Image.Resampling.LANCZOS)
        gx = (W - g_target_w) // 2
        gy = game_card_y + (game_card_h - g_target_h) // 2
        img.paste(raw_game, (gx, gy), raw_game)
        
        # Badge on game preview (Bottom Right over ground)
        draw_rounded_rect(draw, (gx + g_target_w - 265, gy + g_target_h - 32, gx + g_target_w - 14, gy + g_target_h - 10), radius=6, fill=(15, 23, 42, 230), outline=(255, 255, 255, 90), width=1)
        draw.text((gx + g_target_w - 255, gy + g_target_h - 28), "PROYECTO EN VIVO: JUEGO MONKEY & BANANAS", font=ImageFont.truetype(FONT_BOLD, 9.5), fill=(255, 171, 25, 255))

    # 3. DATE & TIME HIGHLIGHT BOX (JUEVES, 5 DE NOVIEMBRE)
    box_date_y = 705
    box_date_w = W - 100
    box_date_h = 125
    
    draw_rounded_rect(draw, (50, box_date_y, 50 + box_date_w, box_date_y + box_date_h), radius=16, fill=(17, 34, 64, 240), outline=(255, 140, 26, 220), width=2)
    
    cal_x = 75
    cal_y = box_date_y + 16
    draw_rounded_rect(draw, (cal_x, cal_y, cal_x + 92, cal_y + 92), radius=16, fill=(255, 140, 26, 255), outline=(255, 210, 130, 200), width=1)
    draw.text((cal_x + 25, cal_y + 13), "NOV", font=f_cal_m, fill=(255, 255, 255, 255))
    draw.text((cal_x + 25, cal_y + 36), "05", font=f_cal_d, fill=(255, 255, 255, 255))

    draw.text((cal_x + 115, box_date_y + 22), "Jueves, 5 de Noviembre de 2026", font=f_date_h, fill=(255, 255, 255, 255))
    
    # Clock icon
    draw_clock_icon(draw, cal_x + 126, box_date_y + 78, 9, (251, 146, 60, 255))
    draw.text((cal_x + 144, box_date_y + 66), "5:30 p.m. a 7:00 p.m. (Hora Colombia)", font=f_date_time, fill=(251, 146, 60, 255))

    # 4. WHAT WILL YOU LEARN CARDS
    sec_y = 845
    draw.text((50, sec_y), "¿QUÉ CONSTRUIREMOS PASO A PASO EN ESTE TALLER?", font=f_sec_h, fill=(255, 171, 25, 255))

    items = [
        ("1. Personaje y Movimiento (Monkey):", 
         "Control con flechas del teclado, animación de disfraces y límites del escenario."),
        ("2. Objetos que Caen (Bananas & Clones):", 
         "Generación aleatoria en el eje X, velocidad progresiva y duplicados de objetos."),
        ("3. Variables Dinámicas de Puntos y Vidas:", 
         "Detección de colisiones (¿tocando al Monkey?), suma de bananas y pérdida de vidas."),
        ("4. Sonidos, Game Over y Reinicio:", 
         "Efectos de audio interactivos, pantalla de fin de juego y botón de reinicio de partida.")
    ]

    card_y = sec_y + 25
    for title, desc in items:
        draw_rounded_rect(draw, (50, card_y, W - 50, card_y + 65), radius=10, fill=(15, 26, 48, 200), outline=(255, 255, 255, 30), width=1)
        draw_rounded_rect(draw, (50, card_y, 56, card_y + 65), radius=3, fill=(255, 140, 26, 255))
        
        draw_vector_check(draw, 75, card_y + 32, 8, (255, 140, 26, 60), (255, 171, 25, 255), (255, 140, 26, 140))
        draw.text((98, card_y + 11), title, font=f_card_b, fill=(255, 255, 255, 255))
        draw.text((98, card_y + 35), desc, font=f_card_p, fill=(203, 213, 225, 255))
        card_y += 72

    # 5. BOTTOM INFO BOX WITH VECTOR BULLETS
    info_y = card_y + 8
    draw_rounded_rect(draw, (50, info_y, W - 50, info_y + 105), radius=14, fill=(10, 20, 38, 230), outline=(255, 255, 255, 35), width=1)
    
    info_points = [
        ("Transmisión en vivo por Google Meet (Enlace en el grupo de WhatsApp de tu colegio)", (226, 232, 240, 255), f_info_p),
        ("Scratch preinstalado en Qinaya Linux: ¡Ejecución ultra-rápida y sin gastar internet!", (56, 189, 248, 255), f_info_b),
        ("Entregaremos las plantillas editables y la grabación completa para usar con tus alumnos.", (226, 232, 240, 255), f_info_p),
        ("Asistencia certificada en línea durante la transmisión.", (254, 215, 170, 255), f_info_b)
    ]
    
    py = info_y + 12
    for pt_text, pt_col, pt_font in info_points:
        draw_vector_check(draw, 68, py + 8, 6, (37, 99, 235, 90), (56, 189, 248, 255), (96, 165, 250, 140))
        draw.text((86, py), pt_text, font=pt_font, fill=pt_col)
        py += 22

    # BUTTON (Safely positioned before bottom edge)
    btn_y = info_y + 118
    btn_h = 56
    btn_box = (50, btn_y, W - 50, btn_y + btn_h)
    draw_rounded_rect(draw, btn_box, radius=12, fill=(234, 88, 12, 255))
    btn_txt = "¡CONÉCTATE ESTE JUEVES 5 DE NOVIEMBRE A LAS 5:30 P.M.!"
    bw = int(draw.textlength(btn_txt, font=f_btn))
    draw.text((50 + (W - 100 - bw) // 2, btn_y + 16), btn_txt, font=f_btn, fill=(255, 255, 255, 255))

    out_wa = os.path.join(WORKSPACE, "invitacion_whatsapp_webinar_2_octubre.png")
    temp_wa = os.path.join(WORKSPACE, "temp_wa.png")
    img.save(temp_wa, format="PNG")
    if os.path.exists(out_wa):
        try:
            os.remove(out_wa)
        except Exception:
            pass
    import shutil
    shutil.move(temp_wa, out_wa)
    print(f"Invitación de WhatsApp guardada exitosamente en: {out_wa}")

if __name__ == '__main__':
    build_horizontal_banner()
    build_whatsapp_flyer()
