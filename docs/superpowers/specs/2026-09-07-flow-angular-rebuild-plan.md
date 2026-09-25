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

## API nueva — mapeo completo (hecho, 2026-09-07)

### Cómo se midió sin gastar cuota

Las peticiones van por **XMLHttpRequest**, no por `fetch` (esto tumbó el primer intento
de captura). Envolviendo `XMLHttpRequest.prototype.send` se lee el cuerpo y, si el
`rpcid` es de generación, se vuelve a llamar a `open()` apuntando a una ruta muerta del
propio dominio: la petición no llega nunca a Google, Flow enseña *"No se ha podido
generar… **No se te ha cobrado por esta generación**"* y nosotros nos quedamos con el
payload. Así se hicieron ~20 pruebas gratis; solo dos generaciones reales (una imagen y
un vídeo) para leer las respuestas.

Aviso operativo: la pestaña tiene que estar **visible** también para esto. Oculta, cada
paso tardaba más de 45 s y todo daba timeout.

### Transporte

```
POST flow.google.com/_/AiSandboxAngularFrontend/data/batchexecute?rpcids=<RPC>&…
cuerpo (form): f.req=[[["<RPC>","<json interno>",null,"generic"]]]  &  at=<token XSRF>
```

- `at` → `WIZ_global_data.SNlM0e` (42 caracteres, accesible desde la página)
- projectId → de la URL, y también dentro del bloque de contexto

### RPCs

| RPC | Qué hace |
|---|---|
| `ogiZ0b` | generar imagen |
| `YhhmEf` | generar vídeo de texto (t2v) |
| `MZZa6b` | generar vídeo con personaje/ingredientes (r2v) |
| `jwpduf`, `nzlxg` | consultar el estado de una generación en curso |

**La cantidad (x1–x4) no viaja en el payload**: Flow manda **una petición por imagen**.
Con x4 salen 4 `ogiZ0b` idénticos salvo semilla y uuids.

### Payload de imagen (`ogiZ0b`)

| Posición | Contenido |
|---|---|
| `[1][0][3]` | semilla (entero aleatorio) |
| `[1][0][4]` | formato: **1:1=1 · 9:16=2 · 16:9=3 · 3:4=4 · 4:3=5** |
| `[1][0][5]` | modelo: `GEM_PIX_2` Nano Banana Pro · `NARWHAL` Nano Banana 2 · `HARBOR_SEAL` Nano Banana 2 Lite |
| `[1][0][7]` | contexto: `[null,22,null,null,null,<projectId>,…,[<token reCAPTCHA>,1]]` |
| `[1][0][8][0][0][0]` | prompt |
| `[1][0][10][0][0]` | uuid del personaje (ausente si no hay) |
| `[1][0][12]`, `[1][0][13]`, `[4][0]` | uuids que genera el cliente |
| `[3]` | copia del bloque de contexto |

Respuesta: `[0][0][6][0][13]` es la **URL firmada de la imagen**
(`flow-content.google/image/<uuid>?Expires,KeyName,Signature`), `[0][0][6][2]` sus
dimensiones y `[0][0][6][0][11]` el id del medio.

### Payload de vídeo de texto (`YhhmEf`)

| Posición | Contenido |
|---|---|
| `[0][0][0][2][0][0][0]` | prompt |
| `[0][0][1]` | modelo+duración: `abra_t2v_4s` / `_6s` / `_8s` / `_10s`, con sufijo `_360p` si se pide 360p (720p no lleva sufijo) |
| `[0][0][2]` | formato: **9:16=1 · 16:9=2** (¡enum distinto al de imagen!) |
| `[0][0][4][4]`, `[0][0][4][5]` | uuids del cliente |
| `[1]`, `[2][0]` | contexto y uuid |

### Payload de vídeo con personaje (`MZZa6b`)

Igual que el anterior pero **desplazado una posición**, y con el personaje aparte:

| Posición | Contenido |
|---|---|
| `[0][0][0][2][0][0][0]` | prompt |
| `[0][0][2]` | `abra_r2v_10s` (r2v = referencia a vídeo) |
| `[0][0][3]` | formato |
| `[0][0][9][0][0]` | uuid del personaje |

El envío devuelve ids de operación; el vídeo se recoge después consultando con `jwpduf`
(`[2][0][5][8][0]` es el estado).

### reCAPTCHA

```js
grecaptcha.enterprise.execute(<siteKey>, { action: 'IMAGE_GENERATION' })
```

La `siteKey` está en el parámetro `render` del script
`www.google.com/recaptcha/enterprise.js` que carga la propia página. El token dura poco
y hay que pedir uno nuevo por generación.

### Lo único sin resolver

**De dónde sale el uuid del personaje.** No está en el DOM ni en el HTML inicial: la
lista de personajes se pide **una sola vez al cargar la página** y se queda en memoria,
así que para verla hay que tener el espía puesto *antes* de que cargue.

Ese mismo comportamiento tiene una consecuencia para el usuario, confirmada en uso
real: **un personaje creado después de cargar la página no existe para la página**. No
aparece en el menú de ingredientes por mucho que se vuelva a abrir (reabrirlo no lanza
ninguna petición: está cacheado), y por tanto "Cargar personajes" no lo encuentra. La
única salida es recargar la pestaña de Flow. Desde v0.13.5 se avisa de esto en el
registro cada vez que se cargan personajes, bajo el desplegable y en el tutorial.

### Modo turbo: grabar y repetir (implementado en v0.13.4)

Construir el payload a mano campo por campo es frágil (son arrays posicionales sin
nombres: si Google mueve un campo, el modo API falla en silencio). Sale mucho mejor
**grabar la primera petición que construye la propia interfaz de Flow** al enviar el
primer prompt del lote, y reutilizarla como plantilla para el resto cambiando solo:

- el prompt
- la semilla y los uuids (nuevos por petición)
- el token reCAPTCHA (nuevo por petición)

Así el personaje, el projectId, el modelo y los enums de formato vienen ya puestos por
Flow, y no hace falta resolver el uuid del personaje ni mantener las tablas de enums.
Solo el primer prompt necesita la ventana visible; el resto puede ir minimizado.

El mapeo de arriba sigue valiendo como red de seguridad y para poder cambiar ajustes a
mitad de lote sin volver a la interfaz.

**Verificado en vivo:**

| Prueba | Resultado |
|---|---|
| Grabar la petición desde la interfaz | ✅ plantilla capturada con prompt, `at` (42 car.) y contexto |
| Repetir con prompt nuevo, ventana **a la vista** | ✅ HTTP 200, URL de imagen devuelta, 7,1 s |
| Repetir con la ventana **minimizada** | ✅ HTTP 200, URL de imagen devuelta, **6,8 s** (`document.hidden === true`) |
| Token reCAPTCHA nuevo por petición, minimizado | ✅ 267 ms |

Minimizado va **igual de rápido** que a la vista: es exactamente lo que la
automatización por interfaz no puede hacer.

Detalles de implementación:

- El espía se instala envolviendo `XMLHttpRequest` al cargar `main.js` y solo lee.
- Por petición se cambian: prompt, semilla, los tres uuids de cliente y el token
  reCAPTCHA (de un solo uso). El bloque de contexto aparece **dos veces** en el payload
  y hay que poner el token en las dos.
- `_reqid` de la URL sube 100000 en cada envío; repetirlo puede hacer que se descarte
  la respuesta.
- Antes de enviar se comprueba que la plantilla tiene la forma esperada; si no, no se
  manda nada y el prompt va por interfaz.
- **El refresco proactivo cada 15 se salta en turbo**: recargar tiraría la plantilla y
  volver a grabarla exige pestaña visible, así que un lote minimizado se atascaría cada
  15 prompts. Turbo tampoco acumula el estado del DOM que ese refresco venía a limpiar.
- Si una repetición falla, ese prompt se reintenta por interfaz y se vuelve a grabar.
- Vídeo sigue por interfaz: su generación va por otra llamada y se encola en el
  servidor, así que hace falta mapear también el sondeo de estado.

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

## Estado de la reconstrucción (v0.13.2)

| Pieza | Estado |
|---|---|
| Dominio nuevo / conexión del panel | ✅ hecho y verificado |
| Motor por interfaz (ajustes → prompt → enviar → capturar) | ✅ hecho |
| Imagen: generar + descargar + galería | ✅ verificado por el usuario (4 prompts) |
| Vídeo: aplicar los 6 controles (modo/tipo/formato/resolución/duración/cantidad) | ✅ verificado |
| Vídeo: generación real | ✅ verificado en vivo (cola larga, hasta 15 min) |
| Vídeo: descarga del `.mp4` real | ✅ verificado en vivo (blob interceptado, 1,8 MB, `video/mp4`) |
| Personajes: listar / adjuntar / quitar | ✅ verificado en vivo |
| Personajes: generación real con personaje | ✅ verificado en vivo |
| Resolución 360p de vídeo | ✅ funciona (ver nota sobre `aria-checked`) |
| Ventana minimizada, modo normal | ❌ **imposible por interfaz** (medido) |
| Ventana minimizada, modo turbo | ✅ verificado en vivo (misma velocidad que a la vista) |
| Lote largo (recarga cada 15) | ⏳ pendiente |
| Modo turbo (grabar y repetir, imágenes) | ✅ implementado y verificado |
| Turbo en vídeo | 📋 pendiente: falta mapear el sondeo de estado |

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
- **Los vídeos no exponen su fichero en el DOM**: el recuadro solo tiene el póster
  (`flow-content.google/image/<uuid>`). El `.mp4` vive en `.../video/<uuid>` con una
  firma distinta, así que cambiar `/image/` por `/video/` en la URL del póster falla
  (`TypeError: Failed to fetch`). La vía que funciona es el propio menú de Flow:
  `more_vert` → `Descargar` → submenú de calidad. Ahí se elige la resolución mayor que
  no esté `disabled` (1080p y 4K son de pago) descartando la opción GIF, y se intercepta
  el `Blob` en `URL.createObjectURL` anulando el `click()` del `<a download>` para que
  Flow no lo guarde también en la carpeta de descargas del navegador. Así FlowPilot
  mantiene el nombre del prompt y la carpeta elegida por el usuario.
- Esa descarga abre menús sobre la página, así que **no puede solaparse** con el envío
  del siguiente prompt: en modo vídeo la descarga va en línea, no en `pendingDownloads`.
- **El personaje en modo vídeo no se adjunta igual que en imagen** (arreglado en
  v0.13.3). El botón de ingredientes **solo existe con el subtipo Ingredientes**
  (icono `chrome_extension`); con Fotogramas no está, comprobado. Y a veces el clic en
  el personaje solo lo selecciona: hay que pulsar además el botón de confirmar
  ("Añadir a petición"), que es el único botón del popover que no es ni una ficha
  (`flow-add-menu-asset-item`) ni una entrada del lateral (`flow-add-menu-side-nav`).
  El chip acaba dentro de `flow-ingredient-bar`.
- Los avisos emergentes de Flow ("1 elemento movido a la papelera") **también son
  `.cdk-overlay-pane`**. Preguntar "¿hay algo abierto?" mirando si existe cualquier
  panel da siempre que sí mientras haya un aviso, y cada espera a que se cierre agota
  su tiempo entero. Hay que exigir que el panel contenga algo interactivo.
- Escape **no siempre cierra** el panel de ajustes; hacer clic en la caja de prompt sí,
  y además deja el cursor donde toca para escribir.
- El desplegable de modelos de imagen ahora ofrece **solo tres**: Nano Banana Pro,
  Nano Banana 2 y Nano Banana 2 Lite.
- Los `mat-button-toggle` tardan **~500 ms** en actualizar su `aria-checked` tras el
  clic. Leerlo justo después da un falso negativo — así se dio por roto el toggle de
  360p, que en realidad funciona. `selectRadio()` ya espera hasta 4 s, que es lo
  correcto; el error estuvo en una comprobación manual, no en el código.

## Alcance

Reescritura del núcleo de `main.js` (aprox. la mitad). `sidepanel.js` / `sidepanel.html`
se mantienen casi enteros. Versión objetivo: **v1.0.0** (cambio de arquitectura).

## Cambio de Google — 25 sept 2026 (v0.13.6)

Dos endurecimientos contra la automatización, verificados en vivo:

1. **El botón de generar ignora los clics sintéticos.** `el.click()`, una secuencia
   completa de pointer/mouse sintética y Enter en el editor no hacen nada; un clic real
   sí genera (`isTrusted: true`). El resto de controles (ajustes, menú de ingredientes)
   siguen aceptando eventos sintéticos. Arreglo: solo ese botón se pulsa con
   `chrome.debugger` (`Input.dispatchMouseEvent`), que ya existía de versiones antiguas.
   El primer evento tras conectar el depurador se pierde, por eso hay dos intentos; la
   prueba de envío es que la caja de prompt se vacía. Funciona incluso con la pestaña
   oculta. Efecto visible: la barra amarilla de "depurando este navegador" durante el
   lote; se desconecta al terminar o parar.
2. **La repetición de peticiones (modo turbo) se rechaza** con
   `PUBLIC_ERROR_UNUSUAL_ACTIVITY` (código 7). Probado: uuids nuevos o los originales,
   con y sin la cabecera `X-Same-Domain: 1` que Flow ahora envía. La respuesta de Flow
   por interfaz no ha cambiado. Flow ya no llama a `grecaptcha.enterprise.execute` por la
   propiedad pública (hay métodos nuevos `challengeAccount` y `eap`), así que lo más
   probable es que el token deba ir ligado a interacción real. Cada intento rechazado es
   una petición marcada contra la cuenta, así que turbo **se apaga solo al primer
   rechazo** y el lote sigue en modo normal.
