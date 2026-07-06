import json
import urllib.request

# Cargar datos del JSON
with open('data_indicadores.json', encoding='utf-8') as f:
    data = json.load(f)

resumen = data['resumen']
detalle = data['detalle_colegios']

SHEET_URL = "https://script.google.com/macros/s/AKfycbzFD4pbrGnCdO_MKwnXInQIXB9LbTtobnHVKuRCDeRwqKdDIEYz1AU3KsfiDduhcjadnA/exec"

# Construir las filas: encabezado + datos + fila resumen
rows = []

# Fila de encabezados
rows.append([
    "#",
    "Institución Educativa",
    "Sesiones Estimadas (Periodo)",
    "Soportes Requeridos",
    "Sesiones Exitosas (Sin Soporte)",
    "Indicador Q-07 Autonomía (%)"
])

# Filas de detalle
for i, item in enumerate(detalle, 1):
    rows.append([
        i,
        item['colegio'],
        item['total_sesiones_estimadas'],
        item['soportes_requeridos'],
        item['sesiones_sin_soporte'],
        item['indicador_q07']
    ])

# Fila de resumen global
rows.append([
    "",
    "PROMEDIO GLOBAL Q-07",
    resumen['sesiones_mes_estimadas'],
    resumen['promedio_soportes_colegio_mes'],
    "",
    resumen['promedio_autonomia_global']
])

payload = {
    "action": "writeQ07Sheet",
    "sheetName": "Q07_Autonomia_Operativa",
    "rows": rows,
    "meta": {
        "periodo": "13 Abr 2026 – 15 Jun 2026",
        "dias_habiles": resumen['dias_habiles_periodo'],
        "total_colegios": resumen['total_colegios']
    }
}

body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
req = urllib.request.Request(
    SHEET_URL,
    data=body,
    headers={'Content-Type': 'text/plain'},
    method='POST'
)

try:
    with urllib.request.urlopen(req, timeout=20) as resp:
        response = resp.read().decode()
        print("Respuesta Google Sheets:", response)
        resp_data = json.loads(response)
        if resp_data.get('status') == 'success':
            print("\n✅ Hoja creada/actualizada correctamente en Google Sheets.")
            url = resp_data.get('url', '')
            if url:
                print(f"🔗 Link para compartir: {url}")
        else:
            print("⚠️ Respuesta inesperada:", resp_data)
except Exception as e:
    print("Error al conectar con Google Sheets:", e)
