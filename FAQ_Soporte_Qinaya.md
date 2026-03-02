# 🛠️ Guía de Soporte y Preguntas Frecuentes - Kit Qinaya

Este documento contiene las soluciones a los problemas técnicos más comunes reportados por docentes y estudiantes al usar el ecosistema Qinaya.

---

## 1. Problemas de Inicio y Pantalla
### ❓ La pantalla se queda en negro después de arrancar (Solución Nomodeset)
**Problema:** Común en equipos con tarjetas de video NVIDIA o drivers gráficos antiguos.
**Solución:**
1. En el menú de GRUB (al arrancar), presiona la tecla **'e'** para editar las opciones.
2. Busca la línea que dice `quiet splash`.
3. Agrega al final de esa línea un espacio y la palabra: `nomodeset`.
4. Presiona **F10** para arrancar.
5. Una vez dentro de QinayaLinux, ve al menú y busca "Controladores adicionales" para instalar el driver privativo.

### ❓ No aparece el menú de QinayaLinux y entra directo a Windows
**Solución:** Windows a veces "pisa" el arranque. 
1. Entra a Windows.
2. Abre la terminal (CMD) como administrador.
3. Escribe el siguiente comando y presiona Enter:
   `bcdedit /set {bootmgr} path \EFI\qinayalinux\grubx64.efi`

---

## 2. Instalación y BIOS
### ❓ ¿Cuáles son las teclas para entrar al Boot Menu?
*   **HP:** F9 o Esc
*   **Dell, Lenovo, Acer, Toshiba:** F12
*   **Asus:** Esc o F8
*   **BIOS General:** F2, F10 o Del.

### ❓ Error de "Security Boot" o "Invalid Signature"
**Solución:** Debes entrar a la BIOS y buscar la pestaña "Security" o "Boot" y cambiar **Secure Boot** a `Disabled`.

---

## 3. Conectividad y Red
### ❓ No aparece ninguna red WiFi
**Solución:**
1. Revisa si hay una tecla física de WiFi o la combinación `Fn + F2`.
2. Si persiste, conecta un cable Ethernet temporalmente.
3. Ve a "Controladores adicionales" y verifica si hay un driver de Broadcom o Realtek pendiente por activar.

---

## 4. Estación de Trabajo (STB)
### ❓ ¿Cómo restauro mi cajita (STB) Qinaya?
Si el sistema no arranca:
1. Inserta un alfiler en el orificio **AV** (Pinhole) mientras conectas la energía.
2. Entrarás al modo Recovery.
3. Selecciona "Apply update from EXT" y busca el archivo `update.zip` en una MicroSD o USB.

---

## 5. Rendimiento en la Nube
### ❓ Siento la Nube lenta o con retraso (Lag)
**Solución:**
1. Usa conexión por cable (Ethernet) en lugar de WiFi para mayor estabilidad.
2. Cierra pestañas pesadas en tu navegador local.
3. Verifica tu ping en `qinaya.co/test`. Un ping saludable para trabajar es menor a **60ms**.

---
*Para soporte técnico personalizado, contáctanos en: bit.ly/Qinaya-Soporte*
