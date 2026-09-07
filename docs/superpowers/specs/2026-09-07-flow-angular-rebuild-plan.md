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

Conclusión: con la ventana **tapada por otras** funciona (solo más lento: Chrome
impone un mínimo de ~1 s a cada espera). El problema es **minimizar mucho rato**:
pasados ~5 minutos Chrome aplica frenado intensivo (~1 operación por minuto), que
haría el lote inviable.

Mitigaciones a implementar en v1.0:
1. **Audio silencioso** en la pestaña: exime del frenado intensivo.
2. **Esperar por condición, no por tiempo**: en vez de "espera 300 ms", esperar a que
   el elemento cambie de estado. Así el mínimo de 1 s apenas penaliza.

Esto se validará con un lote real minimizado. Si no aguanta, la fase 2 (API) lo cubre.

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

## Alcance

Reescritura del núcleo de `main.js` (aprox. la mitad). `sidepanel.js` / `sidepanel.html`
se mantienen casi enteros. Versión objetivo: **v1.0.0** (cambio de arquitectura).
