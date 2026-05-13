# FlowPilot

Extensión de Chrome para generar imágenes en lote en **Google Flow**. Pegas tus prompts, eliges modelo y formato, y la extensión los genera y descarga automáticamente.

## Características

- Genera en lote sin tocar la interfaz de Flow
- Auto-descarga cada imagen con el prompt como nombre
- Galería en vivo dentro de la extensión con miniaturas
- Auto-resume si la sesión caduca
- Reanuda automáticamente tras refresco de página
- Soporte multi-modelo: Nano Banana Pro / Banana 2 / Imagen 4
- Multi-formato: 16:9, 9:16, 1:1, 4:3, 3:4

---

## Instalación inicial

### 1. Descargar el ZIP

Ve al último release y descarga `FlowPilot.zip`:

**[Descargar última versión](https://github.com/gaizkatf/flowpilot/releases/latest/download/FlowPilot.zip)**

### 2. Descomprimir

1. Mueve `FlowPilot.zip` a una carpeta donde quieras guardarlo (ejemplo: `C:\Extensiones\FlowPilot\`)
2. Click derecho → **Extraer todo** → confirma
3. Tendrás una carpeta `FlowPilot/` con todos los archivos dentro

### 3. Cargar en Chrome

1. Abre Chrome y entra en `chrome://extensions`
2. **Activa el "Modo desarrollador"** (toggle arriba a la derecha)
3. Click en el botón **"Cargar descomprimida"**
4. Selecciona la carpeta `FlowPilot/` que descomprimiste
5. La extensión se instala y aparece en tu lista

### 4. Usar

1. Abre [Google Flow](https://labs.google/fx/tools/flow) y entra en un proyecto
2. Click en el icono de FlowPilot (puedes anclarlo desde el menú de extensiones)
3. Se abre el side panel
4. Pega tus prompts (uno por línea) o carga un archivo `.txt`
5. Configura modelo, formato y nº de imágenes por prompt
6. Click **"Crear imágenes"**

---

## Actualizar a una nueva versión

Cuando salga una versión nueva, verás un **banner morado** en la parte superior de la extensión: *"Nueva versión vX.Y.Z disponible — Descargar"*.

### Pasos para actualizar:

1. Click en el botón **"Descargar"** del banner (o ve a [Releases](https://github.com/gaizkatf/flowpilot/releases/latest))
2. Se descarga el nuevo `FlowPilot.zip`
3. **Borra el contenido antiguo** de tu carpeta `FlowPilot/` (o haz backup si quieres)
4. Descomprime el nuevo ZIP **dentro de la misma carpeta** `FlowPilot/`
5. Abre `chrome://extensions`
6. Localiza FlowPilot en la lista
7. Click en el **icono circular de recargar** (🔄) en la tarjeta de la extensión
8. Listo, ya tienes la versión nueva

> ⚠️ **No borres ni renombres la carpeta** — Chrome perdería la referencia y tendrías que reinstalar desde cero. Solo reemplaza el contenido.

### Comprobar versión actual

- Abre `chrome://extensions`
- Busca FlowPilot
- Debajo del nombre verás el número de versión

---

## Solución de problemas

| Problema | Causa probable | Solución |
|----------|---------------|----------|
| Banner de "Nueva versión" no aparece | Aún no han pasado 6h desde el chequeo, o estás en la última | Espera, o cierra y abre Chrome |
| Errores HTTP 403 con "reCAPTCHA" | Sesión Flow caducada | La extensión refresca sola; si persiste, cierra y reabre Flow |
| HTTP 429 "Límite diario alcanzado" | Has agotado la cuota gratuita de Flow | Espera 24h o usa otra cuenta Google |
| Después de actualizar, sigue versión antigua | No le diste a recargar 🔄 | `chrome://extensions` → icono recargar en la tarjeta de FlowPilot |

---

## Privacidad

La extensión:

- **No envía datos a ningún servidor externo** (solo a Google Flow, igual que tú haciéndolo manualmente)
- **No recopila estadísticas**
- **Sólo se ejecuta en `labs.google` y `aisandbox.google.com`**
- Comprueba GitHub cada 6h sólo para detectar versiones nuevas

---

## Licencia y uso

Uso personal. No oficial — sin afiliación con Google.
