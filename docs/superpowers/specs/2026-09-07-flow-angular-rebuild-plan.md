# FlowPilot — Plan de reconstrucción para el Flow nuevo (Angular)

Fecha: 2026-09-07
Estado: plan propuesto (pendiente aprobación del usuario)

## Qué ha pasado

Google reescribió Google Flow por completo. Todo lo que la extensión usaba para
funcionar ha cambiado a la vez:

| Pieza | Antes (v0.12.x) | Ahora |
|---|---|---|
| Dominio | `labs.google/fx/tools/flow` | `flow.google.com` |
| Framework | React / Next.js | **Angular + Angular Material** |
| API generación | `aisandbox-pa.googleapis.com/v1/...` (REST/JSON) | `flow.google.com/_/AiSandboxAngularFrontend/data/batchexecute` (RPC `batchexecute`) |
| Autenticación | Bearer de `/fx/api/auth/session` | Cookies (el endpoint ya no existe) |
| Editor de prompt | Slate | **ProseMirror** |
| Estado interno | Zustand (`promptBoxStore`) vía React fiber | No existe (Angular) |
| URL de media | `labs.google/.../getMediaUrlRedirect` | `flow-content.google/image/<uuid>` (URL firmada, caduca) |

Consecuencia: la extensión ni siquiera se carga (el manifest no incluye el dominio
nuevo), y aunque se cargara, sus dos modos dependen de cosas que ya no existen.

## Hallazgo decisivo (verificado en vivo)

En el Flow nuevo, la automatización por interfaz **funciona con eventos sintéticos**:

- Escribir el prompt: `div.ProseMirror` + `document.execCommand('insertText', ...)` → ✅
- Pulsar enviar: `button[aria-label="Iniciar generación"].click()` → ✅ **generó imágenes**

En la versión React el click sintético estaba bloqueado (por eso se necesitaba
`chrome.debugger` con el banner amarillo, y después el truco del store de React).
**Eso ya no hace falta.** La extensión puede funcionar sin depurador, sin banner y
sin huella de CDP — más limpia que cualquier versión anterior.

## Decisión de arquitectura (aprobada por el usuario)

**Dos fases: automatización de interfaz primero (v1.0), API directa después (v1.1).**

- El modo "Más fiable" tal como estaba (React fiber + Zustand) desaparece: no existe
  en Angular. Su sustituto es la automatización de interfaz **sin CDP**.
- El modo "Rápido" (API directa) se reconstruirá sobre `batchexecute` en una segunda
  fase, porque aporta algo que la automatización no da gratis: **funcionar con la
  ventana minimizada** y ~5× de velocidad.

### Por qué la automatización va primero

Devuelve la extensión a un estado funcional en poco tiempo y sin gastar créditos en
mapear un protocolo. Además es la red de seguridad si Flow sigue cambiando: lee
etiquetas de la interfaz, así que sobrevive a cambios que romperían la API.

## Ventana minimizada (medido, no teoría)

Con la pestaña de Flow **oculta en segundo plano**:

| Prueba | Resultado |
|---|---|
| Escribir el prompt (`execCommand`) | ✅ funciona |
| Botón de enviar activo | ✅ sí |
| Espera programada de 50 ms | ⚠️ tardó **1005 ms** |

Medición posterior con la pestaña oculta durante varios minutos:

| Minuto oculta | Espera pedida | Espera real |
|---|---|---|
| 0 | 200 ms | 1.003 ms |
| 1+ | 200 ms | **58.003 ms** |

El frenado intensivo entra **al minuto**, no a los cinco.

**El truco del audio silencioso NO funciona.** Se probó un oscilador con ganancia
0,0001: el `AudioContext` se mantuvo en `running` y aun así la pestaña quedó frenada a
~1 operación por minuto. Chrome ya no exime a las pestañas con audio inaudible. El
código de keep-alive se retiró por inútil.

**Conclusión definitiva de la fase 1:** la automatización por interfaz necesita que la
pestaña de Flow esté **visible**. La ventana puede estar detrás de otras (eso no cuenta
como oculta), pero **no** minimizada ni con otra pestaña delante. En su lugar la
extensión avisa en el registro cuando detecta que la pestaña pasa a segundo plano.

Trabajar minimizado es, por tanto, la razón de peso para la **fase 6 (API directa)**:
al no depender del DOM y tener pocas esperas (largas), el frenado apenas le afecta —
que es exactamente por qué el antiguo modo "Rápido" sí aguantaba minimizado.

Lo que sí se mantiene de las mitigaciones: **esperar por condición y no por tiempo**,
que hace el motor más rápido y tolerante en general.

## API nueva — investigación previa (hecha)

Capturada una generación real. El formato es reconstruible:

```
POST flow.google.com/_/AiSandboxAngularFrontend/data/batchexecute?rpcids=ogiZ0b&…
body (form): f.req=[[["ogiZ0b","<json interno>",null,"generic"]]]  &  at=<token XSRF>

json interno = [null,null,null, <seed>, 3, "GEM_PIX_2", null,
                [null,22,null,null,null,"<projectId>",null,null,null,null,["<token reCAPTCHA>",1]],
                [[["<prompt>"]]],
                null,null,null, "<uuid>", "<uuid>"]
```

Piezas ya resueltas:
- `at` (XSRF) → `WIZ_global_data.SNlM0e` (accesible desde la página)
- Modelo → **mismos códigos que antes** (`GEM_PIX_2` = Nano Banana Pro)
- reCAPTCHA → **misma site key** que la versión anterior
- projectId → de la URL; prompt y seed → posiciones conocidas

Pendiente de mapear para la fase 2 (cada uno requiere generar y comparar payloads):
formato, cantidad, personaje, y todo el bloque de vídeo (modo, duración, resolución).
Estimación: ~15-20 generaciones de prueba.

Riesgo asumido: son arrays **posicionales sin nombres**. Cualquier campo que Google
añada o mueva rompe el modo API en silencio y obliga a re-mapear. Por eso la
automatización de interfaz se mantiene siempre como modo por defecto y red de
seguridad, y la API queda como modo opcional de velocidad/minimizado.

## Mapa de la interfaz nueva (verificado)

Elementos Angular estables:

- Composer: `flow-prompt-box-instruction-card-wrapper`
- Editor: `div.ProseMirror` (dentro de `flow-rich-text-editor`)
- Enviar: `button[aria-label="Iniciar generación"]`
- Ajustes: `button[aria-label="Activador de ajustes"]` → abre `flow-prompt-box-settings`
- Ingredientes/personajes: `button[aria-label="Añade ingredientes…"]` → `flow-add-menu-popover-content`
- Resultados: `flow-grid-tile-container[aria-label="<texto del prompt>"]` → `img.image`

Panel de ajustes = `mat-button-toggle-group` con botones `role="radio"` (estado en
`aria-checked`), seleccionables por texto:

- **Imagen**: modo (Imagen/Vídeo) · formato (16:9, 4:3, 1:1, 3:4, 9:16) · cantidad (x1–x4)
- **Vídeo**: modo · tipo (Fotogramas/Ingredientes) · formato (16:9, 9:16) ·
  **resolución (360p/720p — nuevo)** · **duración (4/6/8/10 s)** · cantidad (x1–x4)
- Modelo: `button[aria-label="Seleccionar familia de modelos"]` → menú
  - Imagen: Nano Banana Pro · Nano Banana 2 · Nano Banana 2 Lite
  - Vídeo: "Omni 1.1 Flash" (+ resto por confirmar)

Personajes: menú de ingredientes → barra lateral (`Todo, Imágenes, Vídeos, Voces,
**Personajes**, Subidas`) → item → botón "Añadir a petición".

## Plan de trabajo

### Fase 1 — Que vuelva a conectar
1. `manifest.json`: añadir `*://flow.google.com/*` (matches + host_permissions) y
   `*://flow-content.google/*` (para descargar las imágenes firmadas).
2. `background.js`: `isFlowUrl()` debe reconocer el dominio nuevo.
3. Verificar que el panel conecta y el log responde.

### Fase 2 — Motor de generación nuevo
4. Sustituir `pureSendOne` / `replayAutoOne` / `replayAutoVideoOne` por un único
   `sendOne()` que: aplique ajustes → escriba el prompt → pulse enviar.
5. Aplicar ajustes por UI: abrir el panel, clicar los `role="radio"` por texto,
   elegir modelo en el menú. Verificar con `aria-checked` antes de continuar.
6. Personaje: menú de ingredientes → Personajes → seleccionar → "Añadir a petición".
   (Comprobar si persiste entre prompts o hay que repetirlo, como antes.)

### Fase 3 — Captura y descarga
7. Detectar resultados nuevos: observar la aparición de
   `flow-grid-tile-container` cuyo `aria-label` coincide con el prompt enviado.
8. Sacar la URL de `img.image` y descargar (las URLs caducan → descargar pronto;
   mantener el reintento con backoff que ya existe).
9. Mantener la carpeta de descarga personalizada (esa parte no depende de Flow).

### Fase 4 — Reaprovechar lo que sigue valiendo
Se conserva prácticamente todo el panel: pestañas, galería, i18n, selector de
carpeta, pausas, contador, banner de actualización, tutorial, lote/reanudación.
Se borra: código de `chrome.debugger`/CDP, React fiber, store de Zustand, API
`aisandbox-pa`, obtención de Bearer, selector de método de envío.

### Fase 5 — Robustez
10. Detectar errores nuevos (cuota, bloqueo de contenido) leyendo la UI, ya que no
    hay respuesta JSON que inspeccionar.
11. Revisar si sigue haciendo falta la recarga preventiva cada 15 (era para limpiar
    el widget de reCAPTCHA; probablemente sí, pero hay que medirlo).
12. Audio silencioso + esperas por condición (ver sección de ventana minimizada) y
    validación con un lote real minimizado.

### Fase 6 — Modo API directa (v1.1, después de que v1.0 funcione)
13. Mapear las posiciones restantes del payload generando con cada ajuste y
    comparando (formato, cantidad, personaje, vídeo completo).
14. Construir el envío: `at` de `WIZ_global_data.SNlM0e`, token de reCAPTCHA propio,
    `f.req` armado, POST a `batchexecute`.
15. Parsear la respuesta para sacar las URLs de media.
16. Reintroducir el selector de método (Interfaz / Directo) con **Interfaz por
    defecto**, y caída automática a Interfaz si el modo Directo falla — así una
    rotura del protocolo nunca deja al usuario tirado.

## Riesgos

- **Selectores en español**: `aria-label="Iniciar generación"` depende del idioma de
  la cuenta. Hay que localizar por icono (`arrow_forward`) o por posición/estructura
  como alternativa, no solo por texto.
- **Flow puede seguir cambiando**: acaba de reescribirse, es previsible que siga
  moviéndose semanas. Conviene concentrar los selectores en un único sitio del
  código para poder arreglarlos rápido.
- Sin API, no hay códigos de error limpios: los fallos habrá que deducirlos de la UI.

## Estado de la reconstrucción (v0.13.0 publicada)

| Pieza | Estado |
|---|---|
| Dominio nuevo / conexión del panel | ✅ hecho y verificado |
| Motor por interfaz (ajustes → prompt → enviar → capturar) | ✅ hecho |
| Imagen: generar + descargar + galería | ✅ verificado por el usuario (4 prompts) |
| Vídeo: aplicar los 6 controles (modo/tipo/formato/resolución/duración/cantidad) | ✅ verificado sin generar |
| Vídeo: generación real | ⏳ pendiente |
| Personajes: listar / adjuntar / quitar | ✅ verificado en vivo |
| Personajes: generación real con personaje | ⏳ pendiente |
| Ventana minimizada | ❌ **imposible por interfaz** (medido). Necesita la fase 6 |
| Lote largo (recarga cada 15) | ⏳ pendiente |
| Modo API directa (batchexecute) | 📋 fase 6, no empezado |

Detalles útiles descubiertos al implementar:

- El botón "+" de la barra superior usa el **mismo icono `add`** que el de ingredientes
  de la caja de prompt. Hay que acotar el selector a `flow-add-menu button` o se abre
  el menú equivocado (Subir / Nueva colección / Crear personaje / Nueva escena).
- Un personaje adjunto aparece como `<flow-character-ingredient-chip>`; se quita con el
  botón de icono `cancel`. En la interfaz nueva **no hay id**: el personaje se elige por
  nombre, así que el nombre pasa a ser el identificador que guardamos.
- Tras adjuntar un personaje el popover puede quedarse abierto y tapar el botón de
  generar: hay que cerrarlo siempre antes de escribir el prompt.
- La rejilla de resultados está virtualizada y las URLs van firmadas, así que comparar
  solo URLs no basta para saber qué es nuevo: hay que comparar también los elementos.

## Alcance

Reescritura del núcleo de `main.js` (aprox. la mitad). `sidepanel.js` / `sidepanel.html`
se mantienen casi enteros. Versión objetivo: **v1.0.0** (cambio de arquitectura).
