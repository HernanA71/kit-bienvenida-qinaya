import pandas as pd
import json
import unicodedata

# Cargar la lista completa de colegios desde sheet_data.json
try:
    with open('sheet_data.json', 'r', encoding='utf-8') as f:
        sheet_data = json.load(f)
    
    colegios_base = []
    for item in sheet_data:
        bot_text = str(item.get('bot', ''))
        fase = item.get('fase', 1)
        # Excluir si la fase es 0 o si en los comentarios dice que no se instaló
        if fase == 0 or 'no se instalo' in bot_text.lower() or 'no se instaló' in bot_text.lower():
            continue
        colegios_base.append(item['colegio'])
except Exception as e:
    colegios_base = []

# Cargar el archivo Excel
try:
    df = pd.read_excel('soportes tecnicos.xlsx')
except Exception as e:
    print(json.dumps({"error": str(e)}))
    exit()

# Limpiar nombres de columnas si tienen espacios o caracteres raros al final
df.columns = [str(c).strip() for c in df.columns]

colegio_col = 'Lugar de visita.'
actividad_col = 'Actividad a Realizar.'

# Función para estandarizar el nombre del colegio SIN perder sedes
def limpiar_nombre(nombre):
    if pd.isna(nombre):
        return "DESCONOCIDO"
    n = str(nombre).upper()
    n = n.replace('COLEGIO', '')
    n = n.replace('(IED)', '')
    n = n.replace('IED', '')
    n = n.replace('- SEDE PRINCIPAL', '')
    n = n.replace('-SEDE PRINCIPAL', '')
    n = n.replace('DISTRITAL', '')
    n = ''.join(c for c in unicodedata.normalize('NFD', n) if unicodedata.category(c) != 'Mn')
    return n.strip()

# Preparar diccionario base
soportes_por_colegio_dict = {}

for col_orig in colegios_base:
    soportes_por_colegio_dict[col_orig] = 0

df['Colegio_Limpio'] = df[colegio_col].apply(limpiar_nombre)

# Identificar cuáles son soportes
df['Es_Soporte'] = df[actividad_col].astype(str).str.lower().str.contains('soporte')

# Filtrar solo soportes
df_soportes = df[df['Es_Soporte']].copy()

# Mapear a colegios base
for _, row in df_soportes.iterrows():
    c_limpio = row['Colegio_Limpio']
    
    if "QINAYA" in c_limpio or "TIC TAC" in c_limpio or "SECRETARIA DE EDUCACION" in c_limpio:
        continue
        
    encontrado = False
    for cb in colegios_base:
        cb_limpio = limpiar_nombre(cb)
        if cb_limpio in c_limpio or c_limpio in cb_limpio or cb_limpio[:10] == c_limpio[:10]:
            soportes_por_colegio_dict[cb] += 1
            encontrado = True
            break
            
    if not encontrado:
        # Manejo manual para casos raros en el Excel que no cruzan automáticamente
        if "SUBA SALITRE" in c_limpio:
            for cb in colegios_base:
                if "SALITRE" in cb.upper():
                    soportes_por_colegio_dict[cb] += 1
                    encontrado = True
                    break
        # Ignoramos cualquier otro soporte que no corresponda a los 30 colegios base (ej: Mosquera Sibate)

# Días hábiles desde ~13 Abril hasta 15 de Junio: aprox 44 días.
# 44 días * 3.5 horas/día = 154 sesiones totales estimadas en el periodo
SESIONES_ESTIMADAS = 154

resultados = []
for nombre_mostrar, soportes in soportes_por_colegio_dict.items():
    sesiones_exitosas = SESIONES_ESTIMADAS - soportes
    if sesiones_exitosas < 0:
        sesiones_exitosas = 0
        
    indicador_autonomia = (sesiones_exitosas / SESIONES_ESTIMADAS) * 100
    
    resultados.append({
        "colegio": nombre_mostrar,
        "total_sesiones_estimadas": SESIONES_ESTIMADAS,
        "soportes_requeridos": int(soportes),
        "sesiones_sin_soporte": int(sesiones_exitosas),
        "indicador_q07": round(indicador_autonomia, 2)
    })

# Ordenar por indicador de menor a mayor
resultados = sorted(resultados, key=lambda x: x['indicador_q07'])

total_colegios = len(resultados)
promedio_q07 = sum([r['indicador_q07'] for r in resultados]) / total_colegios if total_colegios > 0 else 100

# El promedio se calcula dividiendo por el total de los 30 colegios (dará un % bajito)
promedio_soportes = sum([r['soportes_requeridos'] for r in resultados]) / total_colegios if total_colegios > 0 else 0

output = {
    "resumen": {
        "sesiones_promedio_dia": 3.5,
        "dias_habiles_periodo": 44,
        "sesiones_mes_estimadas": SESIONES_ESTIMADAS,
        "total_colegios": total_colegios,
        "promedio_autonomia_global": round(promedio_q07, 2),
        "promedio_soportes_colegio_mes": round(promedio_soportes, 2)
    },
    "detalle_colegios": resultados
}

with open('data_indicadores.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, ensure_ascii=False, indent=4)

csv_df = pd.DataFrame(resultados)
csv_df.columns = ['Colegio', 'Total Sesiones Estimadas (Abr-Jun 15)', 'Soportes Requeridos', 'Sesiones Exitosas (Sin Soporte)', 'Indicador Q-07 Autonomía (%)']
csv_df.to_csv('indicadores_soportes.csv', index=False, encoding='utf-8-sig')

print("Procesamiento completado.")
