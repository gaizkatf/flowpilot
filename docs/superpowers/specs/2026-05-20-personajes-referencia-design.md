# FlowPilot — Personajes de referencia (character consistency)

Fecha: 2026-05-20
Estado: diseño aprobado (pendiente revisión usuario)

## Objetivo

Permitir que un lote de generación use un **personaje de Flow como referencia**, para
que todas las imágenes mantengan el mismo personaje (consistencia). El usuario elige 1
personaje desde un desplegable en el panel de FlowPilot; ese personaje se aplica a cada
prompt del lote, en ambos modos (Rápido/Directo y Más fiable/Pure).

Fuera de alcance (v1): crear personajes desde la extensión, personaje distinto por
prompt, personajes en vídeo.

## Hechos verificados (recon en Flow live)

- **Lista de personajes**: no hay API. Se leen del DOM. La otra extensión de referencia
  abre el diálogo de "añadir referencia" (overlay `div[role="dialog"]`) y raspa la lista;
  no cambia de pestaña.
- **Tile de personaje**: `div[data-tile-id]` con un `img` dentro.
  - `characterServerId = data-tile-id` sin el prefijo `fe_id_`
    (ej. `fe_id_fb83d44b-...` → `fb83d44b-...`).
  - nombre = `img alt` (puede ser "Untitled Character").
  - thumbnail = `img src` (URL `getMediaUrlRedirect`).
- **Aplicar en Pure (Más fiable)**: store expone
  `actions.addCharacterIngredient({ characterServerId, source })`. El ingrediente
  resultante en `state.ingredients` es
  `{ type:"CHARACTER", ingredientId, characterServerId, preferredIngredientType:"REFERENCE", isLoading:false }`.
  `source` observado en telemetría = `"REUSE_PROMPT"`.
- **Aplicar en Directo (Rápido)**: en el body de `flowMedia:batchGenerateImages`, cada
  `requests[i]` lleva `referenceEntities: [{ entityId: characterServerId }]`
  (junto a `imageInputs: []`).
- **No persiste**: el personaje se borra tras cada generación. Hay que re-aplicarlo en
  cada prompt.

## Componentes

### 1. Descubrimiento de personajes (content script, MAIN world)

`scanCharacters()` → devuelve `[{ id, name, thumb }]`.

Estrategia (no disruptiva):
1. Abrir el diálogo de añadir referencia:
   - localizar el botón "add" del prompt box (icono `add_2`) y hacer click DOM
   - en el diálogo, click en el botón tipo "personaje" (icono `accessibility_new`)
2. Esperar tiles `div[role="dialog"] div[data-tile-id]:has(img)` (poll hasta 5s).
3. Leer id/name/thumb de cada tile. Dedupe por id.
4. Cerrar el diálogo (Escape o botón close).
5. Devolver lista + cachear en `localStorage.fp_characters`.

Fallback si el diálogo no aparece: leer `div[data-tile-id] img` visibles en la página
(por si el usuario ya tiene el tab Characters abierto). Si tampoco, error claro:
"No pude leer los personajes. Abre Flow y espera a que cargue."

### 2. UI panel (sección nueva "Personaje")

- Situada en Configuración, solo visible en modo Imagen.
- Desplegable: opción "Ninguno" (default) + un item por personaje (miniatura + nombre).
- Botón "🔄 Cargar personajes de Flow" → dispara `scanCharacters`, rellena el desplegable.
- Selección persiste en `gf_settings.characterId` (+ `characterName` para mostrar).
- Al abrir el panel, si hay `fp_characters` cacheado, poblar el desplegable sin re-escanear.

### 3. Inyección por prompt

Se re-aplica en cada iteración porque Flow no lo conserva.

- **Pure (`pureSendOne`)**: tras fijar modo/modelo/ratio/prompt y antes de `onSubmit`,
  si `settings.characterId`:
  - leer `state.ingredients`; si no hay CHARACTER con ese `characterServerId`:
    `actions.addCharacterIngredient({ characterServerId: id, source: 'REUSE_PROMPT' })`.
  - fallback: `store.setState({ ingredients: [...ingredients, charIngredient] })`
    construyendo el objeto CHARACTER a mano.
  - esperar ~150ms a que el ingrediente registre antes de `onSubmit`.
- **Directo (`buildAutoBody`)**: si `opts.characterId`, añadir a cada request
  `referenceEntities: [{ entityId: opts.characterId }]`.

### 4. Persistencia y reload

- `characterId` + `characterName` en `gf_settings` (ya se serializa) → sobrevive la
  recarga proactiva (cada 15) y el auto-resume.
- Lista de personajes en `localStorage.fp_characters` para no re-escanear cada vez.

## Casos borde

- Personaje seleccionado pero borrado en Flow → Directo devolverá error de generación
  para ese prompt; se registra en el log y el lote continúa (comportamiento actual de fallo).
- Escaneo falla (Flow no cargado / UI cambió) → mensaje claro, no rompe el lote; el
  usuario puede reintentar o dejar "Ninguno".
- Modo vídeo → sección personaje oculta (no aplica en v1).
- Sin personaje seleccionado ("Ninguno") → comportamiento actual sin cambios.

## Versión

Bump a v0.12.0 (feature nueva). GF_V + manifest + zip + release GitHub.
