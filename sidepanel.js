// ===================== i18n =====================
var currentLang = localStorage.getItem('gf_lang') || 'es';

var i18n = {
  es: {
    status_connected: 'Flow detectado',
    status_disconnected: 'Abre Flow para empezar',
    status_meta_connected: 'Listo para crear',
    status_meta_disconnected: 'Necesitas un proyecto activo',
    sec_config: 'Configuración',
    lbl_mode: 'Tipo',
    mode_image: 'Imagen',
    mode_video: 'Vídeo',
    lbl_video_type: 'Tipo de vídeo',
    sub_frames: 'Fotogramas',
    sub_ingredients: 'Ingredientes',
    lbl_model: 'Modelo',
    lbl_format: 'Formato',
    lbl_gen: 'Imágenes por prompt',
    lbl_pause: 'Pausa entre prompts',
    lbl_enable: 'Extensión activa',
    btn_load: 'o cargar archivo .txt',
    btn_continue: 'Continuar',
    btn_retry: 'Reintentar fallidos',
    btn_download: 'Descargar todo',
    btn_status: 'Ver estado',
    btn_stop: 'Detener',
    btn_clear: 'Limpiar todo',
    btn_policy: 'Exportar bloqueados por política',
    btn_export: 'Exportar prompts fallidos',
    log_ready: 'FlowPilot listo',
    log_help: 'Pulsa el icono de ayuda para ver el tutorial',
    log_empty: 'Archivo vacío',
    log_loaded: 'prompts cargados de',
    log_no_tab: 'No se encontró pestaña de Flow',
    log_err_comm: 'Error comunicando con Flow: ',
    log_complete: 'Ejecución completada',
    tutorial: '<h3>Cómo usar</h3><div class="item"><p><b>1.</b> Abre Google Flow y entra en un proyecto.</p></div><div class="item"><p><b>2.</b> En la pestaña <b>Crear</b>, configura modelo, formato y nº de imágenes por prompt.</p></div><div class="item"><p><b>3.</b> Pega tus prompts (uno por línea) o carga un archivo .txt.</p></div><div class="item"><p><b>4.</b> Pulsa <b>Crear imágenes</b>. Verás el progreso en tiempo real.</p></div><div class="item"><p><b>5.</b> En <b>Resultados</b> aparecerán las imágenes mientras se generan, con auto-descarga.</p></div><h3>Ajustes</h3><div class="item"><p><b>Pausa entre prompts:</b> espera entre cada generación. Sube a 30-60s para batches grandes.</p></div><div class="item"><p><b>Extensión activa:</b> apaga para detener cualquier ejecución en curso.</p></div>'
  },
  en: {
    status_connected: 'Flow detected',
    status_disconnected: 'Open Flow to start',
    status_meta_connected: 'Ready to create',
    status_meta_disconnected: 'You need an active project',
    sec_config: 'Settings',
    lbl_mode: 'Type',
    mode_image: 'Image',
    mode_video: 'Video',
    lbl_video_type: 'Video type',
    sub_frames: 'Frames',
    sub_ingredients: 'Ingredients',
    lbl_model: 'Model',
    lbl_format: 'Format',
    lbl_gen: 'Images per prompt',
    lbl_pause: 'Pause between prompts',
    lbl_enable: 'Extension active',
    btn_load: 'or load .txt file',
    btn_continue: 'Continue',
    btn_retry: 'Retry failed',
    btn_download: 'Download all',
    btn_status: 'Show status',
    btn_stop: 'Stop',
    btn_clear: 'Clear everything',
    btn_policy: 'Export blocked by policy',
    btn_export: 'Export failed prompts',
    log_ready: 'FlowPilot ready',
    log_help: 'Click the help icon for the tutorial',
    log_empty: 'Empty file',
    log_loaded: 'prompts loaded from',
    log_no_tab: 'Flow tab not found',
    log_err_comm: 'Error communicating with Flow: ',
    log_complete: 'Run complete',
    tutorial: '<h3>How to use</h3><div class="item"><p><b>1.</b> Open Google Flow and enter a project.</p></div><div class="item"><p><b>2.</b> In the <b>Create</b> tab, set model, format and images per prompt.</p></div><div class="item"><p><b>3.</b> Paste your prompts (one per line) or load a .txt file.</p></div><div class="item"><p><b>4.</b> Click <b>Create images</b>. You will see live progress.</p></div><div class="item"><p><b>5.</b> In <b>Results</b> images will appear as they are generated, auto-downloaded.</p></div>'
  }
};

function t(key) { return (i18n[currentLang] && i18n[currentLang][key]) || (i18n.es[key]) || key; }

function applyLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  var tc = document.getElementById('tutorialContent');
  if (tc) tc.innerHTML = t('tutorial');
  document.getElementById('btnLangEs').classList.toggle('active', currentLang === 'es');
  document.getElementById('btnLangEn').classList.toggle('active', currentLang === 'en');
  refreshConnectionUI();
}

// ===================== Settings =====================
var currentSettings = {
  mode: 'image',
  model: 'nano_banana_pro',
  generationCount: 1,
  delaySeconds: 20,
  aspectRatio: '16:9',
  videoSubMode: 'frames',
  enabled: true
};

var imageModels = [
  { value: 'nano_banana_pro', label: 'Nano Banana Pro' },
  { value: 'nano_banana_2', label: 'Nano Banana 2' },
  { value: 'imagen_4', label: 'Imagen 4' }
];
var videoModels = [
  { value: 'veo_fast', label: 'Veo 3.1 Fast' },
  { value: 'veo_quality', label: 'Veo 3.1 Quality' }
];
var imageRatios = ['16:9', '4:3', '1:1', '3:4', '9:16'];
var videoRatios = ['16:9', '9:16'];

var MODEL_LABELS = {
  nano_banana_pro: 'Nano Banana Pro',
  nano_banana_2: 'Nano Banana 2',
  imagen_4: 'Imagen 4',
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
var enabledTgl = document.getElementById('enabledTgl');
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

function initControls() {
  setSegValue(modeSeg, currentSettings.mode);
  updateVideoSubVisibility();
  setupSeg(modeSeg, function(val) {
    currentSettings.mode = val;
    updateVideoSubVisibility();
    rebuildModelSelect();
    rebuildRatios();
    saveSettings(); sendSettings();
    updateLivePreview();
  });

  setSegValue(videoSubSeg, currentSettings.videoSubMode || 'frames');
  setupSeg(videoSubSeg, function(val) {
    currentSettings.videoSubMode = val;
    saveSettings(); sendSettings();
  });

  rebuildModelSelect();
  modelSel.addEventListener('change', function() {
    currentSettings.model = modelSel.value;
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

  enabledTgl.checked = currentSettings.enabled;
  statusDot.classList.toggle('on', currentSettings.enabled);
  enabledTgl.addEventListener('change', function() {
    currentSettings.enabled = enabledTgl.checked;
    statusDot.classList.toggle('on', currentSettings.enabled && connected);
    saveSettings();
    sendToContent({ action: 'setEnabled', enabled: currentSettings.enabled });
  });

  updateLivePreview();
}

function updateLivePreview() {
  var lpBody = document.getElementById('lpBody');
  var lpMeta = document.getElementById('lpMeta');
  var modelLbl = MODEL_LABELS[currentSettings.model] || currentSettings.model;
  if (lpBody) lpBody.textContent = modelLbl + ' · ' + currentSettings.aspectRatio + ' · ×' + currentSettings.generationCount;
  if (lpMeta) lpMeta.textContent = 'Auto-descarga activa · pausa ' + currentSettings.delaySeconds + 's entre prompts';
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
  if (statusDot) statusDot.classList.toggle('on', connected && currentSettings.enabled);
}

function setConnected(val) {
  connected = val;
  refreshConnectionUI();
}

async function checkConnection() {
  var tab = await getActiveFlowTab();
  if (!tab) { setConnected(false); return; }
  try {
    var resp = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
    var ok = resp && resp.status === 'ok';
    setConnected(ok);
    if (ok && !galleryRestored) {
      galleryRestored = true;
      sendToContent({ action: 'restoreGallery' }, true);
    }
  } catch(e) {
    setConnected(false);
  }
}
setInterval(checkConnection, 3000);
checkConnection();

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
  document.getElementById('progressTitle').textContent = 'Generando…';
  document.getElementById('progressMeta').textContent = '0 / ' + total;
  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('progressGen').textContent = '0';
  document.getElementById('progressDl').textContent = '0';
  document.getElementById('progressFail').textContent = '0';
  document.getElementById('progressEta').textContent = 'Empezando…';
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
    document.getElementById('progressEta').textContent = 'ETA ' + formatDuration(remaining);
  } else if (gen >= progressState.total) {
    document.getElementById('progressEta').textContent = 'Completado en ' + formatDuration((Date.now() - progressState.startedAt) / 1000);
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
  if (meta) {
    var withImg = galleryThumbs.filter(function(t){ return t.hasImage; }).length;
    meta.textContent = withImg + ' imágenes';
  }
  var badge = document.getElementById('tabResultsBadge');
  if (badge) badge.textContent = galleryThumbs.filter(function(t){ return t.hasImage; }).length;
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

function fillThumbWithImage(idx, suffix, url, prompt) {
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
      entry.wrap.title = '#' + idx + (prompt ? ' — ' + prompt.substring(0, 80) : '');
      entry.img.onload = (function(e) {
        return function() {
          var detected = detectAspectRatio(this.naturalWidth, this.naturalHeight);
          e.ratioEl.textContent = detected;
          e.ratioEl.classList.add('shown');
          e.ratioEl.title = this.naturalWidth + 'x' + this.naturalHeight;
          this.classList.add('loaded');
          e.wrap.classList.remove('skeleton');
        };
      })(entry);
      entry.img.onerror = function() { this.style.opacity = '0.3'; };
      entry.img.src = url;
      entry.hasImage = true;
      ensureGalleryEmpty();
      return true;
    }
  }
  // No matching skeleton found — append new thumb
  var t = makeThumb(idx, suffix);
  var entry2 = { idx: idx, suffix: suffix || '', wrap: t.wrap, img: t.img, ratioEl: t.ratioEl, hasImage: true, url: url, prompt: prompt };
  t.wrap.title = '#' + idx + (prompt ? ' — ' + prompt.substring(0, 80) : '');
  t.wrap.addEventListener('click', function() { window.open(url, '_blank'); });
  t.img.onload = function() {
    var detected = detectAspectRatio(this.naturalWidth, this.naturalHeight);
    entry2.ratioEl.textContent = detected;
    entry2.ratioEl.classList.add('shown');
    entry2.ratioEl.title = this.naturalWidth + 'x' + this.naturalHeight;
    this.classList.add('loaded');
    entry2.wrap.classList.remove('skeleton');
  };
  t.img.onerror = function() { this.style.opacity = '0.3'; };
  t.img.src = url;
  galleryThumbs.push(entry2);
  galleryEl.appendChild(t.wrap);
  ensureGalleryEmpty();
  return true;
}

function addGalleryThumbs(idx, prompt, urls) {
  if (!urls || !urls.length) return;
  for (var i = 0; i < urls.length; i++) {
    var suffix = urls.length > 1 ? String.fromCharCode(97 + i) : '';
    fillThumbWithImage(idx, suffix, urls[i], prompt);
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
    addGalleryThumbs(msg.promptIndex, msg.prompt, msg.urls || []);
  } else if (msg.type === 'batch_start') {
    showProgress(msg.total);
    createSkeletons(msg.prompts, msg.imagesPerPrompt);
  } else if (msg.type === 'progress') {
    updateProgress(msg.gen, msg.dl, msg.fail);
  } else if (msg.type === 'batch_cancelled') {
    markPendingCancelled();
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
    if (title) title.textContent = 'Detenido';
    if (eta) eta.textContent = 'Refrescando Flow…';
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
    flashFileFeedback('Archivo vacío', false);
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
  flashFileFeedback('"' + file.name + '" — ' + lines.length + ' prompts', true);
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
  pasteCount.textContent = lines.length + ' prompt' + (lines.length === 1 ? '' : 's');
  pasteCount.classList.toggle('has', lines.length > 0);
}
if (pasteArea) {
  pasteArea.addEventListener('input', recountPasted);
  pasteArea.addEventListener('paste', function(){ setTimeout(recountPasted, 0); });
}
document.getElementById('btnLoadPasted').addEventListener('click', function() {
  if (!pasteArea) return;
  var lines = pasteArea.value.split('\n').map(function(l){return l.trim();}).filter(function(l){return l.length > 0;});
  if (!lines.length) { addLog('Pega prompts antes de crear', '#f59e0b'); return; }
  addLog(lines.length + ' prompts cargados', '#6366f1');
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
