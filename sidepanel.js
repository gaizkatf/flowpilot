// ===================== i18n =====================
var currentLang = localStorage.getItem('gf_lang') || 'es';

var i18n = {
  es: {
    // Status
    status_connected: 'Flow detectado',
    status_disconnected: 'Abre Flow para empezar',
    status_meta_connected: 'Listo para crear',
    status_meta_disconnected: 'Necesitas un proyecto activo',
    // Tabs
    tab_create: 'Crear',
    tab_results: 'Resultados',
    tab_status: 'Estado',
    // Sections
    sec_config: 'Configuración',
    sec_actions: 'Acciones',
    lbl_log: 'Registro',
    lbl_your_prompts: 'Tus prompts',
    // Settings
    lbl_mode: 'Tipo',
    mode_image: 'Imagen',
    mode_video: 'Vídeo',
    lbl_video_type: 'Tipo de vídeo',
    sub_frames: 'Fotogramas',
    sub_ingredients: 'Ingredientes',
    lbl_model: 'Modelo',
    lbl_format: 'Formato',
    lbl_gen_image: 'Imágenes por prompt',
    lbl_gen_video: 'Vídeos por prompt',
    lbl_pause: 'Pausa entre prompts',
    lbl_enable: 'Extensión activa',
    lbl_duration: 'Duración',
    lbl_character: 'Personaje',
    btn_load_chars: '🔄 Cargar personajes',
    char_none: 'Ninguno',
    char_loading: 'Buscando personajes...',
    char_none_found: 'No se encontraron personajes',
    char_need_flow: 'Abre Flow y entra en un proyecto para cargar personajes',
    char_fallback_name: 'Personaje',
    folder_save_failed: 'No pude guardar en la carpeta',
    grp_create: 'Creación',
    grp_run: 'Ejecución',
    grp_output: 'Salida',
    grp_run_ctl: 'Ejecución',
    grp_downloads: 'Descargas y exportar',
    grp_maint: 'Mantenimiento',
    pill_new: 'Nuevo',
    lbl_folder: 'Carpeta de descarga',
    btn_pick_folder: '📁 Elegir carpeta',
    btn_clear_folder: '✕',
    folder_default: 'Descargas (por defecto)',
    folder_current: 'Guardando en: {name} · se pedirá permiso al empezar cada lote',
    folder_denied: 'Permiso de carpeta denegado. Se usará Descargas.',
    folder_unsupported: 'Tu navegador no permite elegir carpeta. Se usará Descargas.',
    lbl_method: 'Método de envío',
    method_api: 'Rápido',
    method_sim: 'Más fiable',
    method_hint_api: 'Modo rápido. Crea cada imagen o vídeo en unos 2 segundos. A veces Google lo bloquea y hay que esperar un poco.',
    method_hint_sim: 'Modo más fiable pero más lento (5-10 segundos por prompt). Úsalo si el modo rápido falla mucho.',
    // Live preview
    preview_head: 'Vas a crear con',
    preview_meta: 'Auto-descarga activa · pausa {n}s entre prompts',
    // Paste / load
    paste_placeholder: 'Pega aquí tus prompts, uno por línea...',
    btn_load: 'o cargar archivo .txt',
    counter_singular: '{n} prompt',
    counter_plural: '{n} prompts',
    // CTA
    cta_image: 'Crear imágenes',
    cta_video: 'Crear vídeos',
    // Progress
    prog_running: 'Generando…',
    prog_done: 'Hechas',
    prog_downloaded: 'Descargadas',
    prog_failed: 'Fallidas',
    eta_calc: 'ETA calculando…',
    eta_starting: 'Empezando…',
    eta_completed: 'Completado en {t}',
    eta_running: 'ETA {t}',
    prog_stopped_title: 'Detenido',
    prog_stopped_meta: 'Refrescando Flow…',
    // Gallery
    gallery: 'Galería',
    gallery_count_image: '{n} imágenes',
    gallery_count_video: '{n} vídeos',
    btn_clear_gallery: 'Vaciar',
    empty_title_image: 'Aún no hay imágenes',
    empty_title_video: 'Aún no hay vídeos',
    empty_text_image: 'Ve a la pestaña Crear, pega tus prompts y pulsa Crear imágenes',
    empty_text_video: 'Ve a la pestaña Crear, pega tus prompts y pulsa Crear vídeos',
    // Actions
    btn_continue: 'Continuar',
    btn_retry: 'Reintentar fallidos',
    btn_download: 'Descargar todo',
    btn_status: 'Ver estado',
    btn_stop: 'Detener',
    btn_clear: 'Limpiar todo',
    btn_policy: 'Exportar bloqueados por política',
    btn_export: 'Exportar prompts fallidos',
    btn_clear_log: 'Limpiar registro',
    // Update banner
    update_new_version: 'Nueva versión',
    update_available: 'disponible',
    update_download: 'Descargar',
    // Tutorial
    tutorial_title: 'Cómo usar FlowPilot',
    btn_understood: 'Entendido',
    // Log messages
    log_ready: 'FlowPilot listo',
    log_help: 'Pulsa el icono de ayuda para ver el tutorial',
    log_empty: 'Archivo vacío',
    log_loaded: 'prompts cargados de',
    log_no_tab: 'No se encontró pestaña de Flow',
    log_err_comm: 'Error comunicando con Flow: ',
    log_complete: 'Ejecución completada',
    log_paste_first: 'Pega prompts antes de crear',
    log_loaded_count: 'prompts cargados',
    tutorial: '<h3>Cómo usar</h3><div class="item"><p><b>1.</b> Abre Google Flow y entra en un proyecto.</p></div><div class="item"><p><b>2.</b> En la pestaña <b>Crear</b>, configura modelo, formato y nº por prompt.</p></div><div class="item"><p><b>3.</b> Pega tus prompts (uno por línea) o carga un archivo .txt.</p></div><div class="item"><p><b>4.</b> Pulsa <b>Crear imágenes/vídeos</b>. Verás el progreso en tiempo real.</p></div><div class="item"><p><b>5.</b> En <b>Resultados</b> aparecerán las imágenes/vídeos mientras se generan, con auto-descarga.</p></div><h3>Personaje (consistencia)</h3><div class="item"><p><b>1.</b> Crea un personaje dentro de Flow (sección Characters).</p></div><div class="item"><p><b>2.</b> En Configuración pulsa <b>🔄 Cargar personajes</b> y elígelo en el desplegable.</p></div><div class="item"><p><b>3.</b> Todas las imágenes del lote mantendrán ese personaje. Solo aplica a imágenes.</p></div><h3>Carpeta de descarga</h3><div class="item"><p>Por defecto se guarda en <b>Descargas</b>. Pulsa <b>📁 Elegir carpeta</b> para guardar en otra. El navegador pedirá permiso 1 vez al empezar cada lote.</p></div><h3>Método de envío</h3><div class="item"><p><b>Rápido:</b> más veloz (~2s), pero a veces Google lo bloquea.</p></div><div class="item"><p><b>Más fiable:</b> más lento pero supera bloqueos. Úsalo si el rápido falla mucho.</p></div><h3>Ajustes</h3><div class="item"><p><b>Pausa entre prompts:</b> espera entre cada generación. Sube a 30-60s para batches grandes.</p></div><div class="item"><p><b>Detener:</b> en la pestaña Estado, para cualquier ejecución en curso.</p></div>'
  },
  en: {
    status_connected: 'Flow detected',
    status_disconnected: 'Open Flow to start',
    status_meta_connected: 'Ready to create',
    status_meta_disconnected: 'You need an active project',
    tab_create: 'Create',
    tab_results: 'Results',
    tab_status: 'Status',
    sec_config: 'Settings',
    sec_actions: 'Actions',
    lbl_log: 'Log',
    lbl_your_prompts: 'Your prompts',
    lbl_mode: 'Type',
    mode_image: 'Image',
    mode_video: 'Video',
    lbl_video_type: 'Video type',
    sub_frames: 'Frames',
    sub_ingredients: 'Ingredients',
    lbl_model: 'Model',
    lbl_format: 'Format',
    lbl_gen_image: 'Images per prompt',
    lbl_gen_video: 'Videos per prompt',
    lbl_pause: 'Pause between prompts',
    lbl_enable: 'Extension active',
    lbl_duration: 'Duration',
    lbl_character: 'Character',
    btn_load_chars: '🔄 Load characters',
    char_none: 'None',
    char_loading: 'Searching characters...',
    char_none_found: 'No characters found',
    char_need_flow: 'Open Flow and enter a project to load characters',
    char_fallback_name: 'Character',
    folder_save_failed: 'Could not save to the folder',
    grp_create: 'Creation',
    grp_run: 'Execution',
    grp_output: 'Output',
    grp_run_ctl: 'Execution',
    grp_downloads: 'Downloads & export',
    grp_maint: 'Maintenance',
    pill_new: 'New',
    lbl_folder: 'Download folder',
    btn_pick_folder: '📁 Choose folder',
    btn_clear_folder: '✕',
    folder_default: 'Downloads (default)',
    folder_current: 'Saving to: {name} · you’ll be asked for permission at each batch',
    folder_denied: 'Folder permission denied. Using Downloads.',
    folder_unsupported: 'Your browser can’t pick a folder. Using Downloads.',
    lbl_method: 'Send method',
    method_api: 'Fast',
    method_sim: 'Reliable',
    method_hint_api: 'Fast mode. Creates each image or video in about 2 seconds. Google sometimes blocks it and you’ll need to wait a bit.',
    method_hint_sim: 'More reliable but slower (5-10 seconds per prompt). Use it if Fast mode fails often.',
    preview_head: 'You will create with',
    preview_meta: 'Auto-download on · {n}s pause between prompts',
    paste_placeholder: 'Paste your prompts here, one per line...',
    btn_load: 'or load .txt file',
    counter_singular: '{n} prompt',
    counter_plural: '{n} prompts',
    cta_image: 'Create images',
    cta_video: 'Create videos',
    prog_running: 'Generating…',
    prog_done: 'Done',
    prog_downloaded: 'Downloaded',
    prog_failed: 'Failed',
    eta_calc: 'ETA calculating…',
    eta_starting: 'Starting…',
    eta_completed: 'Completed in {t}',
    eta_running: 'ETA {t}',
    prog_stopped_title: 'Stopped',
    prog_stopped_meta: 'Refreshing Flow…',
    gallery: 'Gallery',
    gallery_count_image: '{n} images',
    gallery_count_video: '{n} videos',
    btn_clear_gallery: 'Clear',
    empty_title_image: 'No images yet',
    empty_title_video: 'No videos yet',
    empty_text_image: 'Go to the Create tab, paste your prompts and click Create images',
    empty_text_video: 'Go to the Create tab, paste your prompts and click Create videos',
    btn_continue: 'Continue',
    btn_retry: 'Retry failed',
    btn_download: 'Download all',
    btn_status: 'Show status',
    btn_stop: 'Stop',
    btn_clear: 'Clear everything',
    btn_policy: 'Export blocked by policy',
    btn_export: 'Export failed prompts',
    btn_clear_log: 'Clear log',
    update_new_version: 'New version',
    update_available: 'available',
    update_download: 'Download',
    tutorial_title: 'How to use FlowPilot',
    btn_understood: 'Got it',
    log_ready: 'FlowPilot ready',
    log_help: 'Click the help icon for the tutorial',
    log_empty: 'Empty file',
    log_loaded: 'prompts loaded from',
    log_no_tab: 'Flow tab not found',
    log_err_comm: 'Error communicating with Flow: ',
    log_complete: 'Run complete',
    log_paste_first: 'Paste prompts before creating',
    log_loaded_count: 'prompts loaded',
    tutorial: '<h3>How to use</h3><div class="item"><p><b>1.</b> Open Google Flow and enter a project.</p></div><div class="item"><p><b>2.</b> In the <b>Create</b> tab, set model, format and number per prompt.</p></div><div class="item"><p><b>3.</b> Paste your prompts (one per line) or load a .txt file.</p></div><div class="item"><p><b>4.</b> Click <b>Create images/videos</b>. You will see live progress.</p></div><div class="item"><p><b>5.</b> In <b>Results</b> images/videos will appear as they are generated, auto-downloaded.</p></div><h3>Character (consistency)</h3><div class="item"><p><b>1.</b> Create a character inside Flow (Characters section).</p></div><div class="item"><p><b>2.</b> In Settings click <b>🔄 Load characters</b> and pick it from the dropdown.</p></div><div class="item"><p><b>3.</b> Every image in the batch keeps that character. Images only.</p></div><h3>Download folder</h3><div class="item"><p>Defaults to <b>Downloads</b>. Click <b>📁 Choose folder</b> to save elsewhere. The browser asks for permission once at each batch.</p></div><h3>Send method</h3><div class="item"><p><b>Fast:</b> quicker (~2s), but Google may block it sometimes.</p></div><div class="item"><p><b>Reliable:</b> slower but bypasses blocks. Use it if Fast fails often.</p></div><h3>Settings</h3><div class="item"><p><b>Pause between prompts:</b> wait between generations. Raise to 30-60s for large batches.</p></div><div class="item"><p><b>Stop:</b> in the Status tab, halts any running execution.</p></div>'
  }
};

function tf(key, vars) {
  var s = t(key);
  if (vars) Object.keys(vars).forEach(function(k){ s = s.replace('{' + k + '}', vars[k]); });
  return s;
}

function t(key) { return (i18n[currentLang] && i18n[currentLang][key]) || (i18n.es[key]) || key; }

function applyLanguage() {
  // Plain data-i18n
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  // Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
  });
  // Mode-dependent labels (lbl_gen/cta/empty_title/empty_text → +"_image" or "_video")
  applyModeLabels();
  // Tutorial body
  var tc = document.getElementById('tutorialContent');
  if (tc) tc.innerHTML = t('tutorial');
  // Lang switch button state
  document.getElementById('btnLangEs').classList.toggle('active', currentLang === 'es');
  document.getElementById('btnLangEn').classList.toggle('active', currentLang === 'en');
  refreshConnectionUI();
  // Refresh dynamic UI sections that build their own text
  if (typeof updateLivePreview === 'function') updateLivePreview();
  if (typeof updateMethodHint === 'function') updateMethodHint();
  if (typeof rebuildCharSelect === 'function') rebuildCharSelect();
  if (typeof updateFolderHint === 'function') updateFolderHint();
  if (typeof recountPasted === 'function') recountPasted();
  ensureGalleryEmpty();
}

function applyModeLabels() {
  var suffix = currentSettings.mode === 'video' ? '_video' : '_image';
  document.querySelectorAll('[data-i18n-mode]').forEach(function(el) {
    var base = el.getAttribute('data-i18n-mode');
    el.textContent = t(base + suffix);
  });
}

// ===================== Settings =====================
var currentSettings = {
  mode: 'image',
  model: 'nano_banana_pro',
  generationCount: 1,
  delaySeconds: 20,
  aspectRatio: '16:9',
  videoSubMode: 'frames',
  videoDuration: 8,
  enabled: true,
  method: 'api',
  characterId: '',
  characterName: '',
  useCustomFolder: false
};

var imageModels = [
  { value: 'nano_banana_pro', label: 'Nano Banana Pro' },
  { value: 'nano_banana_2', label: 'Nano Banana 2' },
  { value: 'nano_banana_2_lite', label: 'Nano Banana 2 Lite' }
];
var videoModels = [
  { value: 'omni_flash', label: 'Omni Flash' },
  { value: 'veo_lite', label: 'Veo 3.1 Lite' },
  { value: 'veo_fast', label: 'Veo 3.1 Fast' },
  { value: 'veo_quality', label: 'Veo 3.1 Quality' }
];
var imageRatios = ['16:9', '4:3', '1:1', '3:4', '9:16'];
var videoRatios = ['16:9', '9:16'];

var MODEL_LABELS = {
  nano_banana_pro: 'Nano Banana Pro',
  nano_banana_2: 'Nano Banana 2',
  nano_banana_2_lite: 'Nano Banana 2 Lite',
  omni_flash: 'Omni Flash',
  veo_lite: 'Veo 3.1 Lite',
  veo_fast: 'Veo 3.1 Fast',
  veo_quality: 'Veo 3.1 Quality'
};

try {
  var saved = localStorage.getItem('gf_settings');
  if (saved) currentSettings = Object.assign(currentSettings, JSON.parse(saved));
} catch(e) {}

function saveSettings() {
  localStorage.setItem('gf_settings', JSON.stringify(currentSettings));
}

// ===================== DOM refs =====================
var modeSeg = document.getElementById('modeSeg');
var videoSubRow = document.getElementById('videoSubRow');
var videoSubSeg = document.getElementById('videoSubSeg');
var modelSel = document.getElementById('modelSel');
var ratioSeg = document.getElementById('ratioSeg');
var genSeg = document.getElementById('genSeg');
var delaySl = document.getElementById('delaySl');
var delayVal = document.getElementById('delayVal');
var methodSeg = document.getElementById('methodSeg');
var videoDurRow = document.getElementById('videoDurRow');
var videoDurSeg = document.getElementById('videoDurSeg');
var charRow = document.getElementById('charRow');
var charSel = document.getElementById('charSel');
var btnLoadChars = document.getElementById('btnLoadChars');
var charThumb = document.getElementById('charThumb');
var btnPickFolder = document.getElementById('btnPickFolder');
var btnClearFolder = document.getElementById('btnClearFolder');
var folderHint = document.getElementById('folderHint');
var logDiv = document.getElementById('log');
var statusDot = document.getElementById('statusDot');
var connDot = document.getElementById('connDot');
var connText = document.getElementById('connText');
var connMeta = document.getElementById('connMeta');

// ===================== Segment helpers =====================
function setupSeg(container, onChange) {
  var btns = container.querySelectorAll('button');
  btns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      btns.forEach(function(b) { b.classList.remove('on'); });
      btn.classList.add('on');
      onChange(btn.getAttribute('data-val'));
    });
  });
}

function setSegValue(container, val) {
  var btns = container.querySelectorAll('button');
  btns.forEach(function(b) {
    b.classList.toggle('on', b.getAttribute('data-val') === String(val));
  });
}

function rebuildModelSelect() {
  var models = currentSettings.mode === 'video' ? videoModels : imageModels;
  modelSel.innerHTML = '';
  models.forEach(function(m) {
    var opt = document.createElement('option');
    opt.value = m.value; opt.textContent = m.label;
    modelSel.appendChild(opt);
  });
  var validValues = models.map(function(m) { return m.value; });
  if (validValues.indexOf(currentSettings.model) === -1) {
    currentSettings.model = models[0].value;
  }
  modelSel.value = currentSettings.model;
}

function rebuildRatios() {
  var ratios = currentSettings.mode === 'video' ? videoRatios : imageRatios;
  ratioSeg.innerHTML = '';
  ratios.forEach(function(r) {
    var btn = document.createElement('button');
    btn.setAttribute('data-val', r);
    btn.textContent = r;
    if (r === currentSettings.aspectRatio) btn.classList.add('on');
    ratioSeg.appendChild(btn);
  });
  if (ratios.indexOf(currentSettings.aspectRatio) === -1) {
    currentSettings.aspectRatio = ratios[0];
    setSegValue(ratioSeg, ratios[0]);
  }
  setupSeg(ratioSeg, function(val) {
    currentSettings.aspectRatio = val;
    saveSettings(); sendSettings();
    updateLivePreview();
    applyThumbAspect(val);
  });
}

function updateVideoSubVisibility() {
  videoSubRow.style.display = currentSettings.mode === 'video' ? '' : 'none';
}

function updateVideoDurVisibility() {
  // Show only when Video mode + Omni Flash (it's the only model with selectable duration)
  if (!videoDurRow) return;
  var show = currentSettings.mode === 'video' && currentSettings.model === 'omni_flash';
  videoDurRow.style.display = show ? '' : 'none';
}

// ===================== Characters =====================
var charactersList = [];
try {
  var savedChars = localStorage.getItem('fp_characters');
  if (savedChars) charactersList = JSON.parse(savedChars) || [];
} catch (e) {}

function saveCharacters() {
  try { localStorage.setItem('fp_characters', JSON.stringify(charactersList.slice(0, 200))); } catch (e) {}
}

function updateCharVisibility() {
  if (!charRow) return;
  // Characters apply to image generation only.
  charRow.style.display = currentSettings.mode === 'image' ? '' : 'none';
}

function renderCharThumb() {
  if (!charThumb) return;
  charThumb.innerHTML = '';
  var c = charactersList.find(function(x){ return x.id === currentSettings.characterId; });
  if (c && c.thumb) {
    var img = document.createElement('img');
    img.src = c.thumb;
    img.alt = c.name || '';
    charThumb.appendChild(img);
  }
}

function rebuildCharSelect() {
  if (!charSel) return;
  charSel.innerHTML = '';
  var none = document.createElement('option');
  none.value = ''; none.textContent = t('char_none');
  charSel.appendChild(none);
  charactersList.forEach(function(c){
    var opt = document.createElement('option');
    opt.value = c.id; opt.textContent = c.name || t('char_fallback_name');
    charSel.appendChild(opt);
  });
  // Restore selection if the saved character still exists; otherwise reset to none.
  var exists = charactersList.some(function(c){ return c.id === currentSettings.characterId; });
  if (!exists) { currentSettings.characterId = ''; currentSettings.characterName = ''; }
  charSel.value = currentSettings.characterId || '';
  renderCharThumb();
}

// ===================== Download folder (File System Access API) =====================
// Default: browser Downloads (anchor download in content). Optional: pick any folder;
// content fetches the media, passes it here, and we write it into the chosen folder.
var folderHandle = null;

// Minimal IndexedDB store for the directory handle (handles are structured-cloneable).
function idbOpen() {
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open('flowpilot', 1);
    req.onupgradeneeded = function() { req.result.createObjectStore('handles'); };
    req.onsuccess = function() { resolve(req.result); };
    req.onerror = function() { reject(req.error); };
  });
}
function idbPut(key, val) {
  return idbOpen().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction('handles', 'readwrite');
      tx.objectStore('handles').put(val, key);
      tx.oncomplete = function() { resolve(); };
      tx.onerror = function() { reject(tx.error); };
    });
  });
}
function idbGet(key) {
  return idbOpen().then(function(db) {
    return new Promise(function(resolve, reject) {
      var tx = db.transaction('handles', 'readonly');
      var r = tx.objectStore('handles').get(key);
      r.onsuccess = function() { resolve(r.result || null); };
      r.onerror = function() { reject(r.error); };
    });
  });
}
function idbDel(key) {
  return idbOpen().then(function(db) {
    return new Promise(function(resolve) {
      var tx = db.transaction('handles', 'readwrite');
      tx.objectStore('handles').delete(key);
      tx.oncomplete = function() { resolve(); };
    });
  });
}

function updateFolderHint() {
  if (!folderHint) return;
  if (folderHandle) {
    folderHint.textContent = tf('folder_current', { name: folderHandle.name });
    if (btnClearFolder) btnClearFolder.style.display = '';
  } else {
    folderHint.textContent = t('folder_default');
    if (btnClearFolder) btnClearFolder.style.display = 'none';
  }
}

// Returns true if we have (or just obtained) readwrite permission. withRequest must be
// called under a user gesture (button click) to prompt.
async function ensureFolderPermission(withRequest) {
  if (!folderHandle) return false;
  try {
    var opts = { mode: 'readwrite' };
    if ((await folderHandle.queryPermission(opts)) === 'granted') return true;
    if (withRequest && (await folderHandle.requestPermission(opts)) === 'granted') return true;
  } catch (e) {}
  return false;
}

async function pickDownloadFolder() {
  if (typeof window.showDirectoryPicker !== 'function') {
    addLog(t('folder_unsupported'), '#f59e0b');
    return;
  }
  try {
    var handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    folderHandle = handle;
    await idbPut('downloadDir', handle);
    currentSettings.useCustomFolder = true;
    saveSettings(); sendSettings();
    updateFolderHint();
  } catch (e) {
    // AbortError = user cancelled the picker (expected). Anything else = real failure.
    if (e && e.name !== 'AbortError') {
      addLog(t('folder_unsupported'), '#f59e0b');
    }
  }
}

async function clearDownloadFolder() {
  folderHandle = null;
  try { await idbDel('downloadDir'); } catch (e) {}
  currentSettings.useCustomFolder = false;
  saveSettings(); sendSettings();
  updateFolderHint();
}

// Write a blob into the chosen folder, uniquifying the name on collision.
async function writeToFolder(filename, blob) {
  if (!folderHandle) return false;
  var granted = await ensureFolderPermission(false);
  if (!granted) return false;
  var name = filename;
  // Uniquify: if the name exists, append " (n)".
  try {
    var dot = filename.lastIndexOf('.');
    var base = dot > 0 ? filename.slice(0, dot) : filename;
    var ext = dot > 0 ? filename.slice(dot) : '';
    var n = 1;
    /* eslint-disable no-constant-condition */
    while (true) {
      var clash = true;
      try { await folderHandle.getFileHandle(name, { create: false }); }
      catch (e) { clash = false; }
      if (!clash) break;
      name = base + ' (' + n + ')' + ext;
      n++;
      if (n > 999) break;
    }
  } catch (e) {}
  try {
    var fh = await folderHandle.getFileHandle(name, { create: true });
    var w = await fh.createWritable();
    await w.write(blob);
    await w.close();
    return true;
  } catch (e) {
    addLog('⚠️ ' + t('folder_save_failed') + ': ' + (e && e.message || e), '#f59e0b');
    return false;
  }
}

// Restore the saved folder handle on load (permission is re-checked before each batch).
(async function initFolder() {
  try {
    var h = await idbGet('downloadDir');
    if (h) { folderHandle = h; }
  } catch (e) {}
  updateFolderHint();
})();

function initControls() {
  setSegValue(modeSeg, currentSettings.mode);
  updateVideoSubVisibility();
  setupSeg(modeSeg, function(val) {
    currentSettings.mode = val;
    updateVideoSubVisibility();
    rebuildModelSelect();
    rebuildRatios();
    updateVideoDurVisibility();
    updateCharVisibility();
    saveSettings(); sendSettings();
    applyModeLabels();
    updateLivePreview();
    ensureGalleryEmpty();
  });

  setSegValue(videoSubSeg, currentSettings.videoSubMode || 'frames');
  setupSeg(videoSubSeg, function(val) {
    currentSettings.videoSubMode = val;
    saveSettings(); sendSettings();
  });

  // Video duration selector (Omni Flash only)
  setSegValue(videoDurSeg, currentSettings.videoDuration || 8);
  setupSeg(videoDurSeg, function(val) {
    currentSettings.videoDuration = parseInt(val, 10);
    saveSettings(); sendSettings();
  });
  updateVideoDurVisibility();

  // Character picker
  rebuildCharSelect();
  updateCharVisibility();
  if (charSel) {
    charSel.addEventListener('change', function() {
      currentSettings.characterId = charSel.value;
      var c = charactersList.find(function(x){ return x.id === charSel.value; });
      currentSettings.characterName = c ? (c.name || '') : '';
      renderCharThumb();
      saveSettings(); sendSettings();
    });
  }
  if (btnLoadChars) {
    btnLoadChars.addEventListener('click', function() {
      if (!connected) { addLog(t('char_need_flow'), '#f59e0b'); return; }
      btnLoadChars.textContent = t('char_loading');
      btnLoadChars.disabled = true;
      sendToContent({ action: 'scanCharacters' });
      // Safety re-enable in case no response comes back.
      setTimeout(function(){ if (btnLoadChars.disabled) { btnLoadChars.disabled = false; btnLoadChars.textContent = t('btn_load_chars'); } }, 15000);
    });
  }

  // Download folder
  if (btnPickFolder) btnPickFolder.addEventListener('click', function() { pickDownloadFolder(); });
  if (btnClearFolder) btnClearFolder.addEventListener('click', function() { clearDownloadFolder(); });

  rebuildModelSelect();
  modelSel.addEventListener('change', function() {
    currentSettings.model = modelSel.value;
    updateVideoDurVisibility();
    saveSettings(); sendSettings();
    updateLivePreview();
  });

  rebuildRatios();

  setSegValue(genSeg, currentSettings.generationCount);
  setupSeg(genSeg, function(val) {
    currentSettings.generationCount = parseInt(val);
    saveSettings(); sendSettings();
    updateLivePreview();
  });

  delaySl.value = currentSettings.delaySeconds;
  delayVal.textContent = currentSettings.delaySeconds + 's';
  delaySl.addEventListener('input', function() {
    currentSettings.delaySeconds = parseInt(delaySl.value);
    delayVal.textContent = currentSettings.delaySeconds + 's';
    saveSettings(); sendSettings();
    updateLivePreview();
  });

  // Extension is always "on"; stopping a run is done via the Detener button. The green
  // status dot now purely reflects the Flow connection.
  currentSettings.enabled = true;
  if (statusDot) statusDot.classList.toggle('on', connected);

  // Method toggle: 'api' (fast, direct) or 'simulated' (stealth, page-native button).
  // Default 'api' for users whose accounts pass reCAPTCHA. Switch to 'simulated' if 403 errors persist.
  var validMethods = ['api', 'simulated'];
  if (validMethods.indexOf(currentSettings.method) === -1) currentSettings.method = 'api';
  setSegValue(methodSeg, currentSettings.method);
  methodSeg.querySelectorAll('button').forEach(function(b) {
    b.addEventListener('click', function() {
      var val = b.getAttribute('data-val');
      setSegValue(methodSeg, val);
      currentSettings.method = val;
      saveSettings();
      updateMethodHint();
      updateLivePreview();
    });
  });
  updateMethodHint();
  saveSettings();
  updateLivePreview();
}

function updateMethodHint() {
  var hintEl = document.getElementById('methodHint');
  if (!hintEl) return;
  var key = currentSettings.method === 'simulated' ? 'method_hint_sim' : 'method_hint_api';
  hintEl.textContent = t(key);
}

function updateLivePreview() {
  var lpBody = document.getElementById('lpBody');
  var lpMeta = document.getElementById('lpMeta');
  var modelLbl = MODEL_LABELS[currentSettings.model] || currentSettings.model;
  var body = modelLbl + ' · ' + currentSettings.aspectRatio + ' · ×' + currentSettings.generationCount;
  // Surface the selected character so the user sees it will be applied.
  if (currentSettings.mode === 'image' && currentSettings.characterId && currentSettings.characterName) {
    body += ' · 🎭 ' + currentSettings.characterName;
  }
  if (lpBody) lpBody.textContent = body;
  if (lpMeta) lpMeta.textContent = tf('preview_meta', { n: currentSettings.delaySeconds });
}

// ===================== Tabs =====================
var tabBtns = document.querySelectorAll('.tab');
var tabContents = document.querySelectorAll('.tab-content');
tabBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    var target = btn.getAttribute('data-tab');
    tabBtns.forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    tabContents.forEach(function(c) { c.classList.remove('active'); });
    var el = document.getElementById('tab-' + target);
    if (el) el.classList.add('active');
  });
});

function switchTab(name) {
  tabBtns.forEach(function(b) { b.classList.toggle('active', b.getAttribute('data-tab') === name); });
  tabContents.forEach(function(c) { c.classList.toggle('active', c.id === 'tab-' + name); });
}

// ===================== Messaging =====================
function isFlowUrl(url) {
  return url && (url.includes('labs.google') || url.includes('aisandbox.google.com'));
}

async function getActiveFlowTab() {
  try {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && isFlowUrl(tabs[0].url)) return tabs[0];
    return null;
  } catch (e) { return null; }
}

async function getFlowTabAnywhere() {
  try {
    var active = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (active[0] && isFlowUrl(active[0].url)) return active[0];
    var all = await chrome.tabs.query({});
    for (var i = 0; i < all.length; i++) {
      if (isFlowUrl(all[i].url)) return all[i];
    }
    return null;
  } catch(e) { return null; }
}

async function sendToContent(msg, silent) {
  var tab = await getFlowTabAnywhere();
  if (!tab) {
    if (!silent) addLog(t('log_no_tab'), '#ef4444');
    return null;
  }
  try {
    return await chrome.tabs.sendMessage(tab.id, msg);
  } catch(e) {
    if (!silent) addLog(t('log_err_comm') + e.message, '#ef4444');
    return null;
  }
}

function sendSettings() {
  sendToContent({ action: 'updateSettings', settings: currentSettings }, true);
}

// ===================== Connection =====================
var connected = false;
var galleryRestored = false;

function refreshConnectionUI() {
  if (connText) connText.textContent = connected ? t('status_connected') : t('status_disconnected');
  if (connMeta) connMeta.textContent = connected ? t('status_meta_connected') : t('status_meta_disconnected');
  if (connDot) connDot.classList.toggle('on', connected);
  if (statusDot) statusDot.classList.toggle('on', connected);
}

function setConnected(val) {
  connected = val;
  refreshConnectionUI();
}

var _fpConnAttempts = 0;
var _fpConnTimer = null;

async function checkConnection() {
  var tab = await getActiveFlowTab();
  if (!tab) {
    setConnected(false);
    _fpConnAttempts = 0;
    return;
  }
  try {
    var resp = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
    var ok = resp && resp.status === 'ok';
    setConnected(ok);
    if (ok) {
      _fpConnAttempts = 999; // settle to slow polling
      if (!galleryRestored) {
        galleryRestored = true;
        sendToContent({ action: 'restoreGallery' }, true);
      }
    } else {
      _fpConnAttempts++;
    }
  } catch(e) {
    setConnected(false);
    _fpConnAttempts++;
  }
}

// Adaptive polling: fast (1s) during initial connect, slow (4s) once stable
function scheduleNextCheck() {
  if (_fpConnTimer) clearTimeout(_fpConnTimer);
  var delay = _fpConnAttempts < 15 ? 1000 : 4000;
  _fpConnTimer = setTimeout(function() {
    checkConnection().finally(scheduleNextCheck);
  }, delay);
}

function forceImmediateCheck() {
  _fpConnAttempts = 0;
  if (_fpConnTimer) { clearTimeout(_fpConnTimer); _fpConnTimer = null; }
  checkConnection().finally(scheduleNextCheck);
}

// React to tab/window changes immediately instead of waiting for poll
try {
  chrome.tabs.onActivated.addListener(function() { forceImmediateCheck(); });
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo) {
    if (changeInfo.status === 'complete' || changeInfo.url) forceImmediateCheck();
  });
  if (chrome.windows && chrome.windows.onFocusChanged) {
    chrome.windows.onFocusChanged.addListener(function() { forceImmediateCheck(); });
  }
} catch (e) {}

forceImmediateCheck();

// ===================== Log =====================
function addLog(text, color) {
  var line = document.createElement('div');
  line.className = 'log-line';
  var time = document.createElement('span');
  time.className = 'log-time';
  time.textContent = new Date().toLocaleTimeString();
  line.appendChild(time);
  var msg = document.createElement('span');
  msg.style.color = color || 'var(--text)';
  msg.textContent = text;
  line.appendChild(msg);
  logDiv.appendChild(line);
  logDiv.scrollTop = logDiv.scrollHeight;
  while (logDiv.children.length > 500) logDiv.removeChild(logDiv.firstChild);
}

// ===================== Progress =====================
var progressState = {
  total: 0, gen: 0, dl: 0, fail: 0, startedAt: 0
};

function showProgress(total) {
  progressState = { total: total, gen: 0, dl: 0, fail: 0, startedAt: Date.now() };
  var card = document.getElementById('progressCard');
  if (card) card.classList.add('active');
  document.getElementById('progressTitle').textContent = t('prog_running');
  document.getElementById('progressMeta').textContent = '0 / ' + total;
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('progressGen').textContent = '0';
  document.getElementById('progressDl').textContent = '0';
  document.getElementById('progressFail').textContent = '0';
  document.getElementById('progressEta').textContent = t('eta_starting');
}

function updateProgress(gen, dl, fail) {
  progressState.gen = gen;
  if (typeof dl === 'number') progressState.dl = dl;
  if (typeof fail === 'number') progressState.fail = fail;
  var pct = progressState.total > 0 ? (gen / progressState.total) * 100 : 0;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressMeta').textContent = gen + ' / ' + progressState.total;
  document.getElementById('progressGen').textContent = gen;
  document.getElementById('progressDl').textContent = progressState.dl;
  document.getElementById('progressFail').textContent = progressState.fail;
  // ETA
  if (gen > 0 && gen < progressState.total) {
    var elapsed = (Date.now() - progressState.startedAt) / 1000;
    var perItem = elapsed / gen;
    var remaining = (progressState.total - gen) * perItem;
    document.getElementById('progressEta').textContent = tf('eta_running', { t: formatDuration(remaining) });
  } else if (gen >= progressState.total) {
    document.getElementById('progressEta').textContent = tf('eta_completed', { t: formatDuration((Date.now() - progressState.startedAt) / 1000) });
  }
}

function formatDuration(s) {
  s = Math.max(0, Math.round(s));
  if (s < 60) return s + 's';
  var m = Math.floor(s / 60);
  var rem = s % 60;
  if (m < 60) return m + 'm ' + rem + 's';
  var h = Math.floor(m / 60);
  return h + 'h ' + (m % 60) + 'm';
}

function hideProgress() {
  setTimeout(function() {
    var card = document.getElementById('progressCard');
    if (card) card.classList.remove('active');
  }, 4000);
}

// ===================== Gallery =====================
var galleryEl = document.getElementById('liveGallery');
var galleryEmptyEl = document.getElementById('galleryEmpty');
var galleryThumbs = []; // {idx, suffix, el, img, ratioEl, hasImage}

function detectAspectRatio(w, h) {
  if (!w || !h) return '?';
  var r = w / h;
  if (Math.abs(r - 16/9) < 0.05) return '16:9';
  if (Math.abs(r - 9/16) < 0.05) return '9:16';
  if (Math.abs(r - 4/3) < 0.05) return '4:3';
  if (Math.abs(r - 3/4) < 0.05) return '3:4';
  if (Math.abs(r - 1) < 0.05) return '1:1';
  return r.toFixed(2);
}

// Set CSS variable so gallery thumbs respect chosen aspect ratio
function applyThumbAspect(ratioStr) {
  var map = { '16:9': '16/9', '9:16': '9/16', '4:3': '4/3', '3:4': '3/4', '1:1': '1/1' };
  var val = map[ratioStr] || '1';
  if (galleryEl) galleryEl.style.setProperty('--thumb-aspect', val);
}

function makeThumb(idx, suffix) {
  var wrap = document.createElement('div');
  wrap.className = 'thumb skeleton';
  var idxEl = document.createElement('span');
  idxEl.className = 'thumb-idx';
  idxEl.textContent = '#' + String(idx).padStart(3, '0') + (suffix || '');
  var ratioEl = document.createElement('span');
  ratioEl.className = 'thumb-ratio';
  var img = document.createElement('img');
  img.loading = 'lazy';
  img.alt = '';
  wrap.appendChild(img);
  wrap.appendChild(idxEl);
  wrap.appendChild(ratioEl);
  return { wrap: wrap, img: img, ratioEl: ratioEl };
}

function ensureGalleryEmpty() {
  if (galleryEmptyEl) galleryEmptyEl.style.display = (galleryThumbs.length === 0) ? 'block' : 'none';
  var meta = document.getElementById('galleryMeta');
  var withImg = galleryThumbs.filter(function(t){ return t.hasImage; });
  if (meta) {
    var anyVideo = withImg.some(function(t){ return t.isVideo; });
    var key = (anyVideo || currentSettings.mode === 'video') ? 'gallery_count_video' : 'gallery_count_image';
    meta.textContent = tf(key, { n: withImg.length });
  }
  var badge = document.getElementById('tabResultsBadge');
  if (badge) badge.textContent = withImg.length;
}

function clearGallery() {
  galleryEl.innerHTML = '';
  galleryThumbs = [];
  ensureGalleryEmpty();
}

function createSkeletons(promptsCount, imagesPerPrompt) {
  // Reset gallery for new batch
  clearGallery();
  applyThumbAspect(currentSettings.aspectRatio);
  for (var p = 1; p <= promptsCount; p++) {
    for (var k = 0; k < imagesPerPrompt; k++) {
      var suffix = imagesPerPrompt > 1 ? String.fromCharCode(97 + k) : '';
      var t = makeThumb(p, suffix);
      var entry = { idx: p, suffix: suffix, wrap: t.wrap, img: t.img, ratioEl: t.ratioEl, hasImage: false };
      t.wrap.addEventListener('click', (function(e) {
        return function() { if (e.hasImage && e.url) window.open(e.url, '_blank'); };
      })(entry));
      galleryThumbs.push(entry);
      galleryEl.appendChild(t.wrap);
    }
  }
  ensureGalleryEmpty();
}

function attachLoadHandlers(entry, url, isVideo) {
  if (isVideo) {
    entry.img.style.display = 'none';
    // Replace img with video element
    var vid = document.createElement('video');
    vid.muted = true;
    vid.playsInline = true;
    vid.preload = 'metadata';
    vid.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;opacity:0;transition:opacity 0.4s ease';
    vid.addEventListener('loadedmetadata', function() {
      var detected = detectAspectRatio(this.videoWidth, this.videoHeight);
      entry.ratioEl.textContent = detected;
      entry.ratioEl.classList.add('shown');
      entry.ratioEl.title = this.videoWidth + 'x' + this.videoHeight;
      this.style.opacity = '1';
      entry.wrap.classList.remove('skeleton', 'video-pending');
    });
    vid.addEventListener('error', function() { this.style.opacity = '0.3'; });
    vid.src = url;
    entry.wrap.appendChild(vid);
    entry.videoEl = vid;
    // Play on hover (play() returns a Promise that may reject — swallow it)
    entry.wrap.addEventListener('mouseenter', function() {
      try { var p = vid.play(); if (p && typeof p.catch === 'function') p.catch(function(){}); } catch(e) {}
    });
    entry.wrap.addEventListener('mouseleave', function() {
      try { vid.pause(); vid.currentTime = 0; } catch(e) {}
    });
  } else {
    entry.img.onload = function() {
      var detected = detectAspectRatio(this.naturalWidth, this.naturalHeight);
      entry.ratioEl.textContent = detected;
      entry.ratioEl.classList.add('shown');
      entry.ratioEl.title = this.naturalWidth + 'x' + this.naturalHeight;
      this.classList.add('loaded');
      entry.wrap.classList.remove('skeleton');
    };
    entry.img.onerror = function() { this.style.opacity = '0.3'; };
    entry.img.src = url;
  }
}

function fillThumbWithImage(idx, suffix, url, prompt, isVideo, isReady) {
  // Dedupe: skip if URL already shown (prevents duplicates after restoreGallery / reload)
  for (var d = 0; d < galleryThumbs.length; d++) {
    if (galleryThumbs[d].hasImage && galleryThumbs[d].url === url) return false;
  }
  // Find first matching skeleton with same idx + suffix and no image yet
  for (var i = 0; i < galleryThumbs.length; i++) {
    var entry = galleryThumbs[i];
    if (entry.idx === idx && entry.suffix === (suffix || '') && !entry.hasImage) {
      entry.url = url;
      entry.prompt = prompt;
      entry.isVideo = !!isVideo;
      entry.wrap.title = '#' + idx + (prompt ? ' — ' + prompt.substring(0, 80) : '');
      if (isVideo) {
        if (isReady) {
          // Pure mode: URL is mp4 (VIDEO type). Render <video> + VIDEO badge. Hover plays.
          addVideoBadge(entry.wrap);
          attachLoadHandlers(entry, url, true);
        } else {
          // API mode: keep pending until pollVideoStatus completes (markVideoReady fires)
          entry.wrap.classList.add('video-pending');
          addVideoBadge(entry.wrap);
        }
      } else {
        attachLoadHandlers(entry, url, false);
      }
      entry.hasImage = true;
      ensureGalleryEmpty();
      return true;
    }
  }
  // No matching skeleton found — append new thumb
  var t = makeThumb(idx, suffix);
  var entry2 = { idx: idx, suffix: suffix || '', wrap: t.wrap, img: t.img, ratioEl: t.ratioEl, hasImage: true, url: url, prompt: prompt, isVideo: !!isVideo };
  t.wrap.title = '#' + idx + (prompt ? ' — ' + prompt.substring(0, 80) : '');
  t.wrap.addEventListener('click', function() { window.open(url, '_blank'); });
  if (isVideo) {
    if (isReady) {
      addVideoBadge(t.wrap);
      attachLoadHandlers(entry2, url, true);
    } else {
      t.wrap.classList.add('video-pending');
      addVideoBadge(t.wrap);
    }
  } else {
    attachLoadHandlers(entry2, url, false);
  }
  galleryThumbs.push(entry2);
  galleryEl.appendChild(t.wrap);
  ensureGalleryEmpty();
  return true;
}

function addVideoBadge(wrap) {
  if (wrap.querySelector('.thumb-video-badge')) return;
  var b = document.createElement('span');
  b.className = 'thumb-video-badge';
  b.textContent = 'VIDEO';
  b.style.cssText = 'position:absolute;top:4px;right:4px;background:rgba(99,102,241,0.85);color:#fff;font-size:8px;font-weight:800;padding:2px 5px;border-radius:3px;letter-spacing:0.05em;z-index:2';
  wrap.appendChild(b);
}

function markVideoReady(mediaId, url) {
  for (var i = 0; i < galleryThumbs.length; i++) {
    var e = galleryThumbs[i];
    if (e.isVideo && (e.url || '').indexOf(encodeURIComponent(mediaId)) > -1) {
      // attach video element now that backend has rendered it
      attachLoadHandlers(e, url || e.url, true);
      // Remove existing static badge (replaced by inline detected ratio + video tag)
      var staticBadge = e.wrap.querySelector('.thumb-video-badge');
      if (staticBadge) staticBadge.remove();
      return;
    }
  }
}
function markVideoFailed(mediaId) {
  for (var i = 0; i < galleryThumbs.length; i++) {
    var e = galleryThumbs[i];
    if (e.isVideo && (e.url || '').indexOf(encodeURIComponent(mediaId)) > -1) {
      e.wrap.classList.remove('skeleton', 'video-pending');
      e.wrap.classList.add('cancelled'); // re-use cancelled style
      return;
    }
  }
}

function addGalleryThumbs(idx, prompt, urls, isVideo, isReady) {
  if (!urls || !urls.length) return;
  for (var i = 0; i < urls.length; i++) {
    var suffix = urls.length > 1 ? String.fromCharCode(97 + i) : '';
    fillThumbWithImage(idx, suffix, urls[i], prompt, isVideo, isReady);
  }
  galleryEl.scrollTop = galleryEl.scrollHeight;
}

// ===================== Runtime messages =====================
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.type === 'log') {
    addLog(msg.text, msg.color);
  } else if (msg.type === 'ready') {
    setConnected(true);
    sendToContent({ action: 'restoreGallery' }, true);
  } else if (msg.type === 'complete') {
    addLog(t('log_complete'), '#10b981');
    hideProgress();
  } else if (msg.type === 'images_ready') {
    addGalleryThumbs(msg.promptIndex, msg.prompt, msg.urls || [], !!msg.isVideo, !!msg.isReady);
  } else if (msg.type === 'media_ready') {
    markVideoReady(msg.mediaId, msg.url);
  } else if (msg.type === 'media_failed') {
    markVideoFailed(msg.mediaId);
  } else if (msg.type === 'batch_start') {
    showProgress(msg.total);
    createSkeletons(msg.prompts, msg.imagesPerPrompt);
  } else if (msg.type === 'progress') {
    updateProgress(msg.gen, msg.dl, msg.fail);
  } else if (msg.type === 'batch_cancelled') {
    markPendingCancelled();
  } else if (msg.type === 'characters_list') {
    if (btnLoadChars) { btnLoadChars.disabled = false; btnLoadChars.textContent = t('btn_load_chars'); }
    charactersList = msg.characters || [];
    saveCharacters();
    rebuildCharSelect();
    if (!charactersList.length) addLog(t('char_none_found'), '#f59e0b');
  } else if (msg.type === 'save_media') {
    // Content fetched the media and passed it here as a data URL; write into the chosen folder.
    (async function() {
      try {
        var resp = await fetch(msg.dataUrl);
        var blob = await resp.blob();
        var wrote = await writeToFolder(msg.filename, blob);
        if (!wrote) {
          // Folder write failed (permission lost, etc.) — don't lose the file, fall back to Downloads.
          var u = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = u; a.download = msg.filename; a.click();
          URL.revokeObjectURL(u);
        }
      } catch (e) {
        addLog('⚠️ ' + t('folder_save_failed') + ': ' + (e && e.message || e), '#f59e0b');
      }
    })();
  }
});

function markPendingCancelled() {
  for (var i = 0; i < galleryThumbs.length; i++) {
    var entry = galleryThumbs[i];
    if (!entry.hasImage) {
      entry.wrap.classList.remove('skeleton');
      entry.wrap.classList.add('cancelled');
    }
  }
  // Update progress card
  var card = document.getElementById('progressCard');
  if (card) {
    var title = document.getElementById('progressTitle');
    var eta = document.getElementById('progressEta');
    if (title) title.textContent = t('prog_stopped_title');
    if (eta) eta.textContent = t('prog_stopped_meta');
  }
}

// ===================== Action buttons =====================
document.getElementById('btnNuevo').addEventListener('click', function() {
  document.getElementById('fileInput').click();
});
document.getElementById('fileInput').addEventListener('change', async function(e) {
  var file = e.target.files[0];
  if (!file) return;
  var text = await file.text();
  var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
  if (lines.length === 0) {
    addLog(t('log_empty'), '#f59e0b');
    flashFileFeedback(t('log_empty'), false);
    e.target.value = '';
    return;
  }
  // Pour file content into textarea so user can review/edit before running
  if (pasteArea) {
    pasteArea.value = lines.join('\n');
    recountPasted();
    pasteArea.focus();
    pasteArea.scrollTop = 0;
  }
  addLog(lines.length + ' ' + t('log_loaded') + ' "' + file.name + '"', '#6366f1');
  flashFileFeedback('"' + file.name + '" — ' + tf(lines.length === 1 ? 'counter_singular' : 'counter_plural', { n: lines.length }), true);
  e.target.value = '';
});

// Inline visual feedback near the file button (and counter)
function flashFileFeedback(msg, ok) {
  var counter = document.getElementById('pasteCount');
  if (!counter) return;
  var prevText = counter.textContent;
  var prevColor = counter.style.color;
  counter.textContent = (ok ? '✓ ' : '✗ ') + msg;
  counter.style.color = ok ? 'var(--green)' : 'var(--red)';
  counter.style.fontWeight = '700';
  setTimeout(function() {
    counter.style.color = prevColor;
    counter.style.fontWeight = '';
    recountPasted();
  }, 2200);
}

document.getElementById('btnContinuar').addEventListener('click', function() {
  sendToContent({ action: 'continue', settings: currentSettings });
});
document.getElementById('btnReintentar').addEventListener('click', function() {
  sendToContent({ action: 'retry', settings: currentSettings });
});
document.getElementById('btnDetener').addEventListener('click', function() {
  sendToContent({ action: 'stop' });
});
document.getElementById('btnDescargar').addEventListener('click', function() {
  sendToContent({ action: 'download' });
});
document.getElementById('btnEstado').addEventListener('click', function() {
  sendToContent({ action: 'status' });
});
document.getElementById('btnLimpiar').addEventListener('click', function() {
  sendToContent({ action: 'clear' });
  clearGallery();
});
document.getElementById('btnPolitica').addEventListener('click', function() {
  sendToContent({ action: 'exportPolicy' });
});
document.getElementById('btnExportar').addEventListener('click', function() {
  sendToContent({ action: 'exportFailed' });
});
document.getElementById('btnLogClear').addEventListener('click', function() {
  logDiv.innerHTML = '';
});
document.getElementById('btnGalleryClear').addEventListener('click', function() {
  clearGallery();
});

// Paste textarea
var pasteArea = document.getElementById('pasteArea');
var pasteCount = document.getElementById('pasteCount');
function recountPasted() {
  if (!pasteArea || !pasteCount) return;
  var lines = pasteArea.value.split('\n').map(function(l){return l.trim();}).filter(function(l){return l.length > 0;});
  var key = lines.length === 1 ? 'counter_singular' : 'counter_plural';
  pasteCount.textContent = tf(key, { n: lines.length });
  pasteCount.classList.toggle('has', lines.length > 0);
  // Disable the main CTA when there is nothing to create (uses existing :disabled style).
  var cta = document.getElementById('btnLoadPasted');
  if (cta) cta.disabled = lines.length === 0;
}
if (pasteArea) {
  pasteArea.addEventListener('input', recountPasted);
  pasteArea.addEventListener('paste', function(){ setTimeout(recountPasted, 0); });
}
document.getElementById('btnLoadPasted').addEventListener('click', async function() {
  if (!pasteArea) return;
  var lines = pasteArea.value.split('\n').map(function(l){return l.trim();}).filter(function(l){return l.length > 0;});
  if (!lines.length) { addLog(t('log_paste_first'), '#f59e0b'); return; }
  // If a custom folder is set, (re)confirm write permission now — this click is the user
  // gesture Chrome requires. If denied/lost, fall back to Downloads for this batch.
  if (folderHandle) {
    var ok = await ensureFolderPermission(true);
    currentSettings.useCustomFolder = ok;
    if (!ok) addLog(t('folder_denied'), '#f59e0b');
    saveSettings(); sendSettings();
  } else {
    currentSettings.useCustomFolder = false;
  }
  addLog(lines.length + ' ' + t('log_loaded_count'), '#6366f1');
  switchTab('resultados');
  sendToContent({ action: 'startReplay', prompts: lines, settings: currentSettings });
});

// Tutorial
document.getElementById('btnTutorial').addEventListener('click', function() {
  document.getElementById('tutorialModal').classList.add('show');
});
document.getElementById('btnCloseTutorial').addEventListener('click', function() {
  document.getElementById('tutorialModal').classList.remove('show');
});
document.getElementById('tutorialModal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('show');
});

// Language
document.getElementById('btnLangEs').addEventListener('click', function() {
  currentLang = 'es'; localStorage.setItem('gf_lang', 'es'); applyLanguage();
});
document.getElementById('btnLangEn').addEventListener('click', function() {
  currentLang = 'en'; localStorage.setItem('gf_lang', 'en'); applyLanguage();
});

// ===================== Update checker UI =====================
async function refreshUpdateBanner() {
  try {
    var s = await chrome.storage.local.get(['fpUpdate', 'fpUpdateDismissed']);
    var info = s.fpUpdate;
    var dismissed = s.fpUpdateDismissed;
    var banner = document.getElementById('updateBanner');
    if (!banner) return;
    if (info && info.available && dismissed !== info.version) {
      document.getElementById('updateVersion').textContent = 'v' + info.version;
      var link = document.getElementById('updateLink');
      if (link) link.href = info.url || ('https://github.com/' + (info.repo || ''));
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  } catch (e) {}
}
var dismissBtn = document.getElementById('updateDismiss');
if (dismissBtn) dismissBtn.addEventListener('click', async function() {
  try {
    var s = await chrome.storage.local.get(['fpUpdate']);
    if (s.fpUpdate && s.fpUpdate.version) {
      await chrome.storage.local.set({ fpUpdateDismissed: s.fpUpdate.version });
    }
  } catch (e) {}
  var banner = document.getElementById('updateBanner');
  if (banner) banner.style.display = 'none';
});
// React to storage changes (background updates fpUpdate periodically)
try {
  chrome.storage.onChanged.addListener(function(changes, area) {
    if (area === 'local' && (changes.fpUpdate || changes.fpUpdateDismissed)) refreshUpdateBanner();
  });
} catch (e) {}
// Initial check + nudge background to check now
refreshUpdateBanner();
try { chrome.runtime.sendMessage({ type: 'check_update' }, function(_resp) { refreshUpdateBanner(); }); } catch (e) {}

// ===================== Init =====================
initControls();
applyLanguage();
applyThumbAspect(currentSettings.aspectRatio);
addLog(t('log_ready'), '#6366f1');
addLog(t('log_help'), '#6b7280');
