// FlowPilot V2 v0.1.0 — API capture-and-replay
// Full access to React fiber, Slate editor, page JS
(function() {
  'use strict';
  if (window._gfMainLoaded) return;
  window._gfMainLoaded = true;

  // Mark alive for bridge ping
  document.documentElement.setAttribute('data-gf-alive', '1');

  var settings = { mode:'image', model:'nano_banana_pro', generationCount:1, delaySeconds:20, aspectRatio:'16:9', videoSubMode:'frames', enabled:true };
  var STOP = false, ejecutando = false, indiceActual = 0, prompts = [];

  // === LOG (via bridge → side panel) ===
  function vlog(text, color) {
    console.log('[GF] ' + text);
    window.postMessage({ source: 'gf-main', payload: { type: 'log', text: text, color: color || '#c8ccd4' } }, '*');
  }
  var wait = function(ms) { return new Promise(function(r) { setTimeout(r, ms); }); };

  // === TRUSTED INPUT (chrome.debugger via bridge → background) ===
  var _gfReqs = new Map();
  var _gfReqSeq = 0;
  window.addEventListener('message', function(ev) {
    if (!ev.data || ev.data.source !== 'gf-bridge') return;
    var p = ev.data.payload;
    if (p && p.reqId && _gfReqs.has(p.reqId)) {
      var resolve = _gfReqs.get(p.reqId);
      _gfReqs.delete(p.reqId);
      resolve(p.response);
    }
  });
  function trustedRequest(payload, timeoutMs) {
    return new Promise(function(resolve) {
      var reqId = ++_gfReqSeq;
      payload.reqId = reqId;
      _gfReqs.set(reqId, resolve);
      window.postMessage({ source: 'gf-main', payload: payload }, '*');
      setTimeout(function() {
        if (_gfReqs.has(reqId)) {
          _gfReqs.delete(reqId);
          resolve({ ok: false, error: 'timeout' });
        }
      }, timeoutMs || 6000);
    });
  }
  async function trustedClick(el, human) {
    if (!el) return { ok: false, error: 'no_element' };
    var rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { ok: false, error: 'zero_rect' };
    var x, y;
    if (human) {
      // Random offset within central 50% (anti-bot for sensitive clicks)
      x = Math.round(rect.left + rect.width * (0.25 + Math.random() * 0.5));
      y = Math.round(rect.top + rect.height * (0.25 + Math.random() * 0.5));
    } else {
      // Center (reliable for internal UI clicks)
      x = Math.round(rect.left + rect.width / 2);
      y = Math.round(rect.top + rect.height / 2);
    }
    return await trustedRequest({ type: 'trusted_click', x: x, y: y, human: !!human });
  }
  async function trustedKey(key, opts) {
    opts = opts || {};
    return await trustedRequest({
      type: 'trusted_key',
      key: key,
      code: opts.code || key,
      keyCode: opts.keyCode || 0,
      ctrl: !!opts.ctrl,
      shift: !!opts.shift,
      alt: !!opts.alt,
      meta: !!opts.meta
    });
  }
  async function trustedDetach() {
    return await trustedRequest({ type: 'trusted_detach' }, 3000);
  }

  function clickReal(el) {
    var rect = el.getBoundingClientRect();
    var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    var opts = { bubbles:true, cancelable:true, view:window, clientX:cx, clientY:cy, button:0 };
    el.dispatchEvent(new PointerEvent('pointerdown', opts));
    el.dispatchEvent(new MouseEvent('mousedown', opts));
    el.dispatchEvent(new PointerEvent('pointerup', opts));
    el.dispatchEvent(new MouseEvent('mouseup', opts));
    el.dispatchEvent(new MouseEvent('click', opts));
  }

  // === SLATE EDITOR ===
  function getSlateEditor(dom) {
    try {
      var fk = Object.keys(dom).find(function(k) { return k.startsWith('__reactFiber$'); });
      if (!fk) return null;
      var fiber = dom[fk];
      for (var d = 0; d < 50 && fiber; d++) {
        var p = fiber.memoizedProps;
        if (p && p.editor && typeof p.editor.insertText === 'function') return p.editor;
        if (fiber.stateNode && fiber.stateNode.editor && typeof fiber.stateNode.editor.insertText === 'function') return fiber.stateNode.editor;
        var st = fiber.memoizedState;
        for (var s = 0; s < 10 && st; s++) {
          var ms = st.memoizedState;
          if (ms && typeof ms === 'object') {
            if (ms.editor && typeof ms.editor.insertText === 'function') return ms.editor;
            if (Array.isArray(ms)) { for (var a = 0; a < ms.length; a++) { if (ms[a] && ms[a].editor && typeof ms[a].editor.insertText === 'function') return ms[a].editor; } }
          }
          if (ms && ms.editor) break;
          st = st.next;
        }
        fiber = fiber.return;
      }
    } catch(e) {}
    return null;
  }

  function obtenerEditor() {
    return document.querySelector('div[role="textbox"][contenteditable="true"]') ||
      document.querySelector('div[data-slate-editor="true"]');
  }

  function obtenerBotonEnviar() {
    var btns = document.querySelectorAll('button');
    // Priority 1: button with aria-label matching create/send AND arrow_forward icon
    for (var i = 0; i < btns.length; i++) {
      if (!btns[i].offsetParent) continue;
      var lbl = (btns[i].getAttribute('aria-label') || '').toLowerCase();
      if (!/(crear|create|enviar|send|generar|generate)/.test(lbl)) continue;
      var ic1 = btns[i].querySelector('i, span.material-icons, span.google-symbols, [class*="google-symbols"]');
      if (ic1 && /(arrow_forward|send)/.test(ic1.textContent.trim())) return btns[i];
    }
    // Priority 2: button text contains "Crear"/"Create" AND arrow_forward icon (sr-only label pattern)
    for (var i = 0; i < btns.length; i++) {
      if (!btns[i].offsetParent) continue;
      var ic2 = btns[i].querySelector('i, span.material-icons, span.google-symbols, [class*="google-symbols"]');
      var hasArrow = ic2 && ic2.textContent.trim() === 'arrow_forward';
      var txt = (btns[i].textContent || '');
      if (hasArrow && (txt.includes('Crear') || txt.includes('Create'))) return btns[i];
    }
    // Priority 3: button with arrow_forward icon only
    for (var i = 0; i < btns.length; i++) {
      if (!btns[i].offsetParent) continue;
      var ic3 = btns[i].querySelector('i, span.material-icons, span.google-symbols, [class*="google-symbols"]');
      if (ic3 && ic3.textContent.trim() === 'arrow_forward') return btns[i];
    }
    return null;
  }

  // Multi-method send with multi-signal verification
  async function enviarConFallback(boton, editorDom) {
    var textoAntes = (editorDom && editorDom.textContent || '').trim();
    if (!textoAntes) return false;
    var tilesAntes = document.querySelectorAll('[data-tile-id]').length;

    // Wait for button enabled (longer poll: 6s)
    for (var w = 0; w < 20; w++) {
      var disabled = boton.disabled || boton.getAttribute('aria-disabled') === 'true';
      if (!disabled) break;
      await wait(300);
    }

    var stillDisabled = boton.disabled || boton.getAttribute('aria-disabled') === 'true';
    if (stillDisabled) vlog('  ⚠️ Botón sigue disabled tras 6s', '#f59e0b');

    // Scroll button into view (debugger uses viewport coords)
    try { boton.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' }); } catch(e) {}
    await wait(150);

    async function envioOk() {
      // Signal 1: editor cleared
      var ahora = (editorDom && editorDom.textContent || '').trim();
      if (ahora.length < Math.max(3, textoAntes.length / 4)) return true;
      // Signal 2: new tile appeared
      var tilesAhora = document.querySelectorAll('[data-tile-id]').length;
      if (tilesAhora > tilesAntes) return true;
      // Signal 3: a "stop"/"cancel" / progress indicator appeared (button text changed to stop, or progress bar visible)
      var stopBtns = document.querySelectorAll('button');
      for (var sb = 0; sb < stopBtns.length; sb++) {
        if (!stopBtns[sb].offsetParent) continue;
        var stxt = (stopBtns[sb].textContent || '').toLowerCase();
        var sIc = stopBtns[sb].querySelector('i, span.material-icons, span.google-symbols, [class*="google-symbols"]');
        var sIcTxt = sIc ? sIc.textContent.trim() : '';
        if (sIcTxt === 'stop' || sIcTxt === 'cancel' || stxt.includes('detener') || stxt.includes('cancelar')) return true;
      }
      return false;
    }

    // Method 0 (PRIMARY): chrome.debugger trusted click w/ human-like path
    try {
      var rTrust = await trustedClick(boton, true);
      if (rTrust && rTrust.ok) {
        await wait(2000);
        if (await envioOk()) return true;
      } else if (rTrust && rTrust.error) {
        vlog('  ⚠️ trusted_click err: ' + rTrust.error, '#f59e0b');
      }
    } catch(e) { vlog('  ⚠️ trusted err: ' + e.message, '#f59e0b'); }

    // Method 1 (FALLBACK): synthetic click
    try { clickReal(boton); } catch(e) {}
    await wait(2000);
    if (await envioOk()) return true;

    // Re-fetch button reference (DOM may have re-rendered)
    var boton2 = obtenerBotonEnviar() || boton;

    // Method 2: form.requestSubmit
    try {
      var form = boton2.form || boton2.closest('form');
      if (form && typeof form.requestSubmit === 'function') {
        form.requestSubmit(boton2);
        await wait(1500);
        if (await envioOk()) { vlog('  ↳ requestSubmit', '#22c55e'); return true; }
      }
    } catch(e) {}

    // Method 3: Ctrl+Enter on editor
    try {
      if (editorDom) {
        editorDom.focus();
        await wait(100);
        var optsCtrl = { key:'Enter', code:'Enter', keyCode:13, which:13, ctrlKey:true, bubbles:true, cancelable:true, composed:true };
        editorDom.dispatchEvent(new KeyboardEvent('keydown', optsCtrl));
        editorDom.dispatchEvent(new KeyboardEvent('keypress', optsCtrl));
        editorDom.dispatchEvent(new KeyboardEvent('keyup', optsCtrl));
        await wait(1500);
        if (await envioOk()) { vlog('  ↳ Ctrl+Enter', '#22c55e'); return true; }
      }
    } catch(e) {}

    // Method 4: plain Enter on editor
    try {
      if (editorDom) {
        editorDom.focus();
        await wait(100);
        var optsEnter = { key:'Enter', code:'Enter', keyCode:13, which:13, bubbles:true, cancelable:true, composed:true };
        editorDom.dispatchEvent(new KeyboardEvent('keydown', optsEnter));
        editorDom.dispatchEvent(new KeyboardEvent('keypress', optsEnter));
        editorDom.dispatchEvent(new KeyboardEvent('keyup', optsEnter));
        await wait(1500);
        if (await envioOk()) { vlog('  ↳ Enter', '#22c55e'); return true; }
      }
    } catch(e) {}

    // Method 5: native HTMLElement.click()
    var boton5 = obtenerBotonEnviar() || boton;
    try { boton5.click(); } catch(e) {}
    await wait(1500);
    if (await envioOk()) { vlog('  ↳ native click', '#22c55e'); return true; }

    // Method 6: trigger pointerdown chain on button parent (Radix sometimes listens at parent)
    try {
      var btn6 = obtenerBotonEnviar() || boton;
      var parent = btn6.parentElement;
      if (parent) {
        var rect = btn6.getBoundingClientRect();
        var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        var optsP = { bubbles:true, cancelable:true, view:window, clientX:cx, clientY:cy, button:0, composed:true };
        parent.dispatchEvent(new PointerEvent('pointerdown', optsP));
        parent.dispatchEvent(new PointerEvent('pointerup', optsP));
        await wait(1500);
        if (await envioOk()) { vlog('  ↳ parent pointer', '#22c55e'); return true; }
      }
    } catch(e) {}

    // Method 7: invoke React onClick handler directly via fiber (bypasses event system / isTrusted check)
    try {
      var btn7 = obtenerBotonEnviar() || boton;
      var props = getReactProps(btn7);
      if (props && typeof props.onClick === 'function') {
        var rect7 = btn7.getBoundingClientRect();
        var fakeEvent = {
          currentTarget: btn7,
          target: btn7,
          type: 'click',
          bubbles: true,
          cancelable: true,
          defaultPrevented: false,
          isTrusted: true,
          clientX: rect7.left + rect7.width / 2,
          clientY: rect7.top + rect7.height / 2,
          button: 0,
          buttons: 1,
          preventDefault: function() {},
          stopPropagation: function() {},
          stopImmediatePropagation: function() {},
          persist: function() {},
          nativeEvent: new MouseEvent('click', { bubbles: true, cancelable: true })
        };
        props.onClick(fakeEvent);
        await wait(2000);
        if (await envioOk()) { vlog('  ↳ React onClick', '#22c55e'); return true; }
      } else {
        vlog('  ⚠️ Sin onClick en fiber', '#f59e0b');
      }
    } catch(e) { vlog('  ↳ fiber err: ' + e.message, '#ef4444'); }

    return false;
  }

  async function escribirPrompt(texto) {
    var editorDom = obtenerEditor();
    if (!editorDom) { vlog('  ❌ No hay editor', '#ef4444'); return false; }

    editorDom.focus();
    await wait(100);

    // Method 1 (PRIMARY): Slate API via fiber — updates internal state, not just DOM
    var slate = getSlateEditor(editorDom);
    if (slate) {
      try {
        // Clear existing
        if (slate.children && slate.children.length > 0) {
          try {
            var lastIdx = slate.children.length - 1;
            var lastNode = slate.children[lastIdx];
            var lastChildIdx = lastNode && lastNode.children ? lastNode.children.length - 1 : 0;
            var lastTextNode = lastNode && lastNode.children ? lastNode.children[lastChildIdx] : null;
            var endOff = lastTextNode && typeof lastTextNode.text === 'string' ? lastTextNode.text.length : 0;
            slate.select({
              anchor: { path: [0, 0], offset: 0 },
              focus: { path: [lastIdx, lastChildIdx], offset: endOff }
            });
            slate.deleteFragment();
          } catch(e2) {}
        }
        slate.insertText(texto);
        if (typeof slate.onChange === 'function') slate.onChange();
        await wait(300);
        if ((editorDom.textContent || '').trim().length > 5) return true;
      } catch(e) { vlog('  ↳ Slate err: ' + e.message, '#f59e0b'); }
    }

    // Select all (for replace mode)
    var sel = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(editorDom);
    sel.removeAllRanges();
    sel.addRange(range);
    await wait(50);

    // Method 2: beforeinput event
    try {
      if (editorDom.textContent.trim().length > 0) {
        editorDom.dispatchEvent(new InputEvent('beforeinput', {
          inputType: 'deleteContentBackward', bubbles: true, cancelable: true, composed: true
        }));
        await wait(50);
      }
      editorDom.dispatchEvent(new InputEvent('beforeinput', {
        inputType: 'insertText', data: texto, bubbles: true, cancelable: true, composed: true
      }));
      await wait(200);
      if ((editorDom.textContent || '').trim().length > 5) return true;
    } catch(e) {}

    // Method 3: execCommand
    try {
      editorDom.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, texto);
      await wait(200);
      if ((editorDom.textContent || '').trim().length > 5) return true;
    } catch(e) {}

    // Method 4: paste event
    try {
      editorDom.focus();
      var dt = new DataTransfer(); dt.setData('text/plain', texto);
      editorDom.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
      await wait(200);
      if ((editorDom.textContent || '').trim().length > 5) return true;
    } catch(e) {}

    vlog('  ❌ Escritura fallida', '#ef4444');
    return false;
  }

  // Find React props (onClick handler) on a DOM element via fiber
  function getReactProps(dom) {
    try {
      var fk = Object.keys(dom).find(function(k) { return k.startsWith('__reactProps$'); });
      if (fk) return dom[fk];
    } catch(e) {}
    return null;
  }

  async function esperarUI(max) {
    max = max || 20;
    for (var i = 1; i <= max; i++) {
      if (obtenerEditor() && obtenerBotonEnviar()) { return true; }
      if (i % 5 === 0) // waiting
      await wait(2000);
    }
    vlog('❌ UI no encontrada', '#ef4444'); return false;
  }

  // === FLOW CONFIGURATION ===
  // Strip accents + lowercase for robust matching
  function normTxt(s) {
    return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
  // Get all open popper roots (Flow may have several stacked)
  function getAllPoppers() {
    return document.querySelectorAll('[data-radix-popper-content-wrapper]');
  }
  // Helper: find tab by icon text — searches in given root OR all poppers
  function findTab(root, iconText) {
    var roots = root ? [root] : Array.from(getAllPoppers());
    for (var r = 0; r < roots.length; r++) {
      var tabs = roots[r].querySelectorAll('button[role="tab"], button[role="radio"], button.flow_tab_slider_trigger');
      for (var t = 0; t < tabs.length; t++) {
        var ic = tabs[t].querySelector('i, span.material-icons, span.google-symbols, [class*="google-symbols"], [class*="material-icons"]');
        if (ic && ic.textContent.trim() === iconText) return tabs[t];
      }
    }
    return null;
  }
  // Helper: find tab by text (accent-insensitive, partial match)
  function findTabByText(root, text) {
    var target = normTxt(text);
    var roots = root ? [root] : Array.from(getAllPoppers());
    for (var r = 0; r < roots.length; r++) {
      var tabs = roots[r].querySelectorAll('button[role="tab"], button[role="radio"], button.flow_tab_slider_trigger');
      for (var t = 0; t < tabs.length; t++) {
        var tn = normTxt(tabs[t].textContent);
        if (tn === target || tn.indexOf(target) !== -1) return tabs[t];
      }
    }
    return null;
  }
  // Universal click: CDP trusted first (required for isTrusted check), synthetic fallback
  async function realClick(el) {
    if (!el) return false;
    try { el.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' }); } catch(e) {}
    await wait(100);
    try {
      var r = await trustedClick(el);
      if (r && r.ok) return true;
    } catch(e) {}
    try { clickReal(el); return true; } catch(e) {}
    return false;
  }

  // Helper: click tab if not already active
  async function clickTabIfNeeded(tab, label) {
    if (!tab) { vlog('  ⚠️ Tab "' + label + '" no encontrado', '#f59e0b'); return false; }
    var alreadyOn = tab.getAttribute('data-state') === 'active'
      || tab.getAttribute('aria-selected') === 'true'
      || tab.getAttribute('aria-checked') === 'true';
    if (alreadyOn) return true;
    await realClick(tab);
    await wait(800);
    return true;
  }

  async function aplicarConfiguracion() {
    // configurando

    // Find config button (bottom bar: contains model name + xN/Nx)
    var configBtn = null;
    var allBtns = document.querySelectorAll('button');
    var xCountRe = /(?:[xX×]\s*[1-4]|[1-4]\s*[xX×])/;
    for (var i = 0; i < allBtns.length; i++) {
      if (!allBtns[i].offsetParent) continue;
      var txt = allBtns[i].textContent || '';
      var hasCount = xCountRe.test(txt);
      var hasModel = txt.includes('Banana') || txt.includes('Nano') || txt.includes('Imagen') || txt.includes('imagen') || txt.includes('Veo') || txt.includes('crop');
      if (hasCount && hasModel) { configBtn = allBtns[i]; break; }
    }
    // Fallback: button with only model name (no count)
    if (!configBtn) {
      for (var i2 = 0; i2 < allBtns.length; i2++) {
        if (!allBtns[i2].offsetParent) continue;
        var txt2 = allBtns[i2].textContent || '';
        if ((txt2.includes('Banana') || txt2.includes('Nano Banana') || txt2.includes('Imagen 4') || txt2.includes('Veo')) && txt2.length < 80) {
          configBtn = allBtns[i2]; break;
        }
      }
    }
    if (!configBtn) { vlog('⚠️ Config no encontrado', '#f59e0b'); return; }
    await realClick(configBtn); await wait(2000);

    var popper = null;
    for (var a = 0; a < 15; a++) { popper = document.querySelector('[data-radix-popper-content-wrapper]'); if (popper) break; await wait(500); }
    if (!popper) { vlog('⚠️ Popup no apareció', '#f59e0b'); return; }

    // 1. Mode: Image or Video (icons: "image" / "videocam")
    var wantVideo = settings.mode === 'video';
    var modeIcon = wantVideo ? 'videocam' : 'image';
    var modeTab = findTab(popper, modeIcon) || findTab(null, modeIcon);
    // Fallback by text — Spanish "Vídeo"/"Imagen" + English "video"/"image"
    if (!modeTab) {
      var txtCandidates = wantVideo ? ['video', 'vídeo'] : ['imagen', 'image'];
      for (var tc = 0; tc < txtCandidates.length && !modeTab; tc++) {
        modeTab = findTabByText(popper, txtCandidates[tc]) || findTabByText(null, txtCandidates[tc]);
      }
    }
    if (modeTab) {
      var modeLabel = wantVideo ? 'Vídeo' : 'Imagen';
      var alreadyMode = modeTab.getAttribute('data-state') === 'active' || modeTab.getAttribute('aria-selected') === 'true';
      if (!alreadyMode) vlog('  📍 Cambiando modo → ' + modeLabel, '#6b7280');
      await clickTabIfNeeded(modeTab, modeLabel);
      await wait(800);
      popper = document.querySelector('[data-radix-popper-content-wrapper]');
    } else {
      vlog('  ⚠️ Mode tab "' + (wantVideo ? 'video' : 'image') + '" no encontrado', '#f59e0b');
    }

    // 2. Video sub-mode: Frames or Ingredients (only in video mode)
    if (settings.mode === 'video' && settings.videoSubMode && popper) {
      var subText = settings.videoSubMode === 'ingredients' ? 'ingredient' : 'frame';
      // Also try Spanish: fotograma / ingrediente
      var subTab = findTabByText(popper, subText) || findTabByText(popper, settings.videoSubMode === 'ingredients' ? 'ingrediente' : 'fotograma');
      if (subTab) {
        await clickTabIfNeeded(subTab, settings.videoSubMode === 'ingredients' ? 'Ingredientes' : 'Fotogramas');
        await wait(500);
        popper = document.querySelector('[data-radix-popper-content-wrapper]');
      }
    }

    // 3. Aspect ratio (icons: "crop_16_9" / "crop_9_16" / "crop_square" etc, or text "16:9")
    if (popper) {
      var ratioMap = { '16:9': 'crop_16_9', '9:16': 'crop_9_16', '4:3': 'crop_4_3', '3:4': 'crop_3_4', '1:1': 'crop_square' };
      var ratioIcon = ratioMap[settings.aspectRatio];
      var ratioTab = ratioIcon ? findTab(popper, ratioIcon) : null;
      if (!ratioTab) ratioTab = findTabByText(popper, settings.aspectRatio);
      if (ratioTab) {
        await clickTabIfNeeded(ratioTab, settings.aspectRatio);
        await wait(300);
      }
    }

    // 4. Generation count: x1-x4 (matches "x1"/"1x"/"X1"/"×1" with optional whitespace)
    popper = document.querySelector('[data-radix-popper-content-wrapper]');
    if (popper) {
      var n = settings.generationCount;
      var xRe = new RegExp('^\\s*(?:[xX×]\\s*' + n + '|' + n + '\\s*[xX×])\\s*$');
      var ctrls = popper.querySelectorAll('.flow_tab_slider_trigger, button[role="tab"], button, [role="radio"], [role="option"], [role="menuitemradio"]');
      var found = null;
      for (var t = 0; t < ctrls.length; t++) {
        var ctxt = (ctrls[t].textContent || '').trim();
        if (xRe.test(ctxt)) { found = ctrls[t]; break; }
      }
      if (!found) {
        vlog('  ⚠️ x' + n + ' no encontrado', '#f59e0b');
      } else {
        var alreadyOn = found.getAttribute('data-state') === 'active' || found.getAttribute('aria-checked') === 'true' || found.getAttribute('aria-selected') === 'true';
        if (!alreadyOn) {
          await realClick(found);
          await wait(500);
        }
      }
    }

    // 5. Model selection
    var modelNames = { nano_banana_pro:'Nano Banana Pro', nano_banana_2:'Nano Banana 2', imagen_4:'Imagen 4', veo_fast:'Veo 3.1 - Fast', veo_quality:'Veo 3.1 - Quality' };
    var target = modelNames[settings.model] || 'Nano Banana Pro';
    popper = document.querySelector('[data-radix-popper-content-wrapper]');
    if (popper) {
      var trigger = null, pbtns = popper.querySelectorAll('button');
      for (var b = 0; b < pbtns.length; b++) {
        if (pbtns[b].getAttribute('role') === 'tab') continue;
        var bt = pbtns[b].textContent || '';
        if (bt.includes('arrow_drop_down') || bt.includes('Banana') || bt.includes('Imagen') || bt.includes('Veo')) { trigger = pbtns[b]; break; }
      }
      if (trigger && !trigger.textContent.includes(target)) {
        await realClick(trigger); await wait(1000);
        var poppers = document.querySelectorAll('[data-radix-popper-content-wrapper]');
        for (var pp = 0; pp < poppers.length; pp++) {
          var items = poppers[pp].querySelectorAll('[role="menuitem"]');
          for (var mi = 0; mi < items.length; mi++) {
            if (items[mi].textContent.includes(target)) { await realClick(items[mi]); vlog('  🎨 ' + target, '#22c55e'); await wait(800); break; }
          }
        }
      } else if (trigger) {
        // ya seleccionado
      }
    }

    // Close popup
    document.dispatchEvent(new KeyboardEvent('keydown', { key:'Escape', bubbles:true })); await wait(300);
    vlog('✅ Configuración aplicada', '#22c55e');
  }

  // === STATE ===
  function guardarEstado() { localStorage.setItem('gemini_estado', JSON.stringify({ promptsPendientes: prompts.slice(indiceActual), promptsFallidos: JSON.parse(localStorage.getItem('gemini_fallidos')||'[]'), settings: settings, timestamp: Date.now() })); }
  function obtenerEstado() { try { return JSON.parse(localStorage.getItem('gemini_estado')); } catch(e) { return null; } }
  function guardarFallido(p) { if(!p) return; var f = JSON.parse(localStorage.getItem('gemini_fallidos')||'[]'); if (f.indexOf(p)===-1) f.push(p); localStorage.setItem('gemini_fallidos', JSON.stringify(f)); }

  // === EXECUTION ===
  async function ejecutarPrompts(lista, esFallidos) {
    if (ejecutando) { vlog('⚠️ Ya en ejecución', '#f59e0b'); return; }
    ejecutando = true; STOP = false;
    var label = esFallidos ? 'RETRY' : 'PROMPT';
    if (!await esperarUI()) { ejecutando = false; return; }

    for (var i = 0; i < lista.length; i++) {
      if (STOP || !settings.enabled) {
        vlog('⛔ Detenido', '#ef4444');
        if (!esFallidos) { prompts = lista; indiceActual = i; guardarEstado(); }
        ejecutando = false;
        try { await trustedDetach(); } catch(e) {}
        return;
      }
      var raw = lista[i].trim(); indiceActual = i;
      vlog('[' + label + ' ' + (i+1) + '/' + lista.length + '] ' + raw.substring(0,60) + '...', esFallidos ? '#f97316' : '#7c5cfc');

      var ok = await escribirPrompt(raw);
      if (!ok) { await wait(1000); ok = await escribirPrompt(raw); }
      if (!ok) { vlog('  ❌ Saltando', '#ef4444'); guardarFallido(raw); continue; }

      // Force React state sync: dispatch generic input event on editor so React listeners fire
      var edSync = obtenerEditor();
      if (edSync) {
        try {
          edSync.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: raw, bubbles: true, cancelable: false, composed: true }));
          edSync.dispatchEvent(new Event('change', { bubbles: true }));
        } catch(e) {}
      }

      // Jittered pause before send (0.6-1.6s — variable thinking time)
      await wait(600 + Math.floor(Math.random() * 1000));
      var boton = obtenerBotonEnviar();
      var editorDom = obtenerEditor();
      if (boton) {
        var enviado = await enviarConFallback(boton, editorDom);
        if (enviado) vlog('  ✅ Enviado', '#22c55e');
        else { vlog('  ⚠️ Click no surtió efecto', '#f59e0b'); guardarFallido(raw); }
      } else { vlog('  ❌ Botón no encontrado', '#ef4444'); guardarFallido(raw); }

      if (!esFallidos) { prompts = lista; indiceActual = i+1; guardarEstado(); }
      if (i < lista.length - 1) {
        // Additive jitter: at least delaySeconds, plus 0-30% extra (anti-bot timing variability)
        var baseMs = settings.delaySeconds * 1000;
        var jitterMs = baseMs + Math.floor(Math.random() * baseMs * 0.3);
        vlog('  ⏱️ Esperando ' + settings.delaySeconds + 's', '#6b7280');
        await wait(jitterMs);
      }
    }

    if (!esFallidos) {
      var f = JSON.parse(localStorage.getItem('gemini_fallidos')||'[]');
      if (f.length > 0) { vlog('🔄 Reintentando ' + f.length + '...', '#f97316'); localStorage.setItem('gemini_fallidos','[]'); await wait(3000); await ejecutarPrompts(f, true); }
    }

    var fall = JSON.parse(localStorage.getItem('gemini_fallidos')||'[]');
    var pol = JSON.parse(localStorage.getItem('gemini_politica')||'[]');
    vlog('━━━ RESUMEN ━━━', '#7c5cfc');
    vlog('✅ ' + indiceActual + ' completados | ❌ ' + fall.length + ' fallidos | 🚫 ' + pol.length + ' política', '#7c5cfc');
    localStorage.removeItem('gemini_estado');
    ejecutando = false;
    // Detach debugger (removes yellow banner)
    try { await trustedDetach(); } catch(e) {}
    window.postMessage({ source: 'gf-main', payload: { type: 'complete' } }, '*');
  }

  // === DOWNLOAD ===
  function getPromptFromTile(tileEl) {
    var spans = tileEl.querySelectorAll('span[data-state]');
    for (var s = 0; s < spans.length; s++) {
      var fk = Object.keys(spans[s]).find(function(k) { return k.startsWith('__reactFiber$'); });
      if (!fk) continue;
      var node = spans[s][fk];
      for (var d = 0; d < 20 && node; d++) {
        var p = node.memoizedProps || node.pendingProps;
        if (p && p.subtitle && typeof p.subtitle === 'string' && p.subtitle.length > 10) return p.subtitle;
        node = node.return;
      }
    }
    return '';
  }

  async function descargarImagenes() {
    vlog('📥 Descargando...', '#3b82f6');
    var media = new Map(); // src → { name, type: 'image'|'video' }
    var container = document.querySelector('[data-testid="virtuoso-scroller"]') || document.documentElement;
    container.scrollTop = 0; await wait(1000);
    var lastScroll = 0, sameCount = 0;
    while (sameCount < 5) {
      await wait(1500);
      var tiles = document.querySelectorAll('[data-tile-id]');
      for (var ti = 0; ti < tiles.length; ti++) {
        var tile = tiles[ti];
        var prompt = getPromptFromTile(tile);

        // Check for video first
        var video = tile.querySelector('video');
        if (video && video.src && !media.has(video.src)) {
          var vName = (prompt || 'video_' + (media.size + 1)).substring(0,120).replace(/[<>:"/\\|?*\n\r]/g,'').replace(/\s+/g,' ').trim();
          media.set(video.src, { name: vName, type: 'video' });
          continue;
        }

        // Check for image
        var img = tile.querySelector('img[alt="Imagen generada"], img[alt="Generated image"]');
        if (img && img.src && !media.has(img.src) && img.naturalWidth > 100) {
          var iName = (prompt || 'image_' + (media.size + 1)).substring(0,120).replace(/[<>:"/\\|?*\n\r]/g,'').replace(/\s+/g,' ').trim();
          media.set(img.src, { name: iName, type: 'image' });
        }
      }
      container.scrollTop += 500;
      if (container.scrollTop === lastScroll) sameCount++; else { sameCount = 0; lastScroll = container.scrollTop; }
    }

    // Videos may not be visible in thumbnails — trigger hover on tiles to load <video>
    // Do a second pass: hover each tile briefly to reveal videos
    var tiles2 = document.querySelectorAll('[data-tile-id]');
    for (var ti2 = 0; ti2 < tiles2.length; ti2++) {
      var tile2 = tiles2[ti2];
      if (tile2.querySelector('video')) continue; // already has video
      // Quick hover to trigger lazy video load
      var rect = tile2.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight) continue; // not visible
      tile2.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, clientX: rect.left + 10, clientY: rect.top + 10 }));
      tile2.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, clientX: rect.left + 10, clientY: rect.top + 10 }));
      await wait(300);
      var vid = tile2.querySelector('video');
      if (vid && vid.src && !media.has(vid.src)) {
        var prompt2 = getPromptFromTile(tile2);
        var vn = (prompt2 || 'video_' + (media.size + 1)).substring(0,120).replace(/[<>:"/\\|?*\n\r]/g,'').replace(/\s+/g,' ').trim();
        media.set(vid.src, { name: vn, type: 'video' });
      }
      tile2.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    }

    if (media.size === 0) { vlog('❌ No hay contenido para descargar', '#ef4444'); return; }

    var imgCount = 0, vidCount = 0;
    for (var m of media) { if (m[1].type === 'video') vidCount++; else imgCount++; }
    vlog('📥 Descargando: ' + imgCount + ' imágenes, ' + vidCount + ' vídeos', '#3b82f6');

    var count = 0, errs = 0;
    for (var entry of media) {
      count++;
      var ext = entry[1].type === 'video' ? '.mp4' : '.png';
      var fn = entry[1].name + ext;
      try {
        var r = await fetch(entry[0]);
        var bl = await r.blob();
        var u = URL.createObjectURL(bl);
        var a = document.createElement('a'); a.href = u; a.download = fn; a.click();
        URL.revokeObjectURL(u);
      } catch(e) { errs++; vlog('  ❌ ' + e.message, '#ef4444'); }
      await wait(800);
    }
    if (errs > 0) vlog('📥 Completado: ' + (count - errs) + '/' + count, '#f59e0b');
    else vlog('📥 ¡' + count + ' archivos descargados!', '#22c55e');
  }

  // Download single image (used by auto-download per generation)
  // Filename = prompt text only (user already numbers prompts, do not re-prefix)
  async function descargarUnaImagen(item) {
    var ext = item.isVideo ? '.mp4' : '.png';
    var defaultName = (item.isVideo ? 'video_' : 'image_') + item.idx;
    var safe = (item.prompt || defaultName).replace(/[<>:"/\\|?*\n\r]/g, '').replace(/\s+/g, ' ').trim();
    if (safe.length > 180) safe = safe.substring(0, 180);
    var fname = safe + (item.suffix ? ' (' + item.suffix + ')' : '') + ext;
    try {
      var r = await fetch(item.url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var bl = await r.blob();
      var u = URL.createObjectURL(bl);
      var a = document.createElement('a');
      a.href = u; a.download = fname; a.click();
      URL.revokeObjectURL(u);
      return true;
    } catch (e) {
      vlog('  ⚠️ DL ' + fname + ': ' + e.message, '#f59e0b');
      return false;
    }
  }

  // Download all images from API-tracked URLs (V2: works without UI tiles)
  async function descargarGenerados() {
    if (generatedMedia.length === 0) {
      vlog('❌ Nada para descargar', '#ef4444');
      return;
    }
    vlog('📥 Descargando ' + generatedMedia.length + ' imágenes...', '#3b82f6');
    var ok = 0, fail = 0;
    for (var i = 0; i < generatedMedia.length; i++) {
      var m = generatedMedia[i];
      var safe = (m.prompt || ('image_' + m.idx)).replace(/[<>:"/\\|?*\n\r]/g, '').replace(/\s+/g, ' ').trim();
      if (safe.length > 180) safe = safe.substring(0, 180);
      var fname = safe + (m.suffix ? ' (' + m.suffix + ')' : '') + '.png';
      try {
        var r = await fetch(m.url);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var bl = await r.blob();
        var u = URL.createObjectURL(bl);
        var a = document.createElement('a');
        a.href = u; a.download = fname; a.click();
        URL.revokeObjectURL(u);
        ok++;
      } catch (e) {
        fail++;
        vlog('  ❌ ' + fname + ': ' + e.message, '#ef4444');
      }
      await wait(800);
    }
    vlog('📥 Descarga: ' + ok + ' ok, ' + fail + ' fail', fail > 0 ? '#f59e0b' : '#22c55e');
  }

  function exportarArchivo(key, filename, label) {
    var data = JSON.parse(localStorage.getItem(key) || '[]');
    if (!data.length) { vlog('✅ Sin ' + label, '#22c55e'); return; }
    var bl = new Blob([data.join('\n')], { type:'text/plain' });
    var u = URL.createObjectURL(bl); var a = document.createElement('a'); a.href=u; a.download=filename; a.click(); URL.revokeObjectURL(u);
    vlog('📥 ' + data.length + ' ' + label + ' exportados', '#7c5cfc');
  }

  // === V2 API REPLAY ===
  // Hardcoded constants (reverse-engineered from Flow)
  var FP_SITEKEY = '6LdsFiUsAAAAAIjVDZcuLhaHiDn5nnHVXVRQGeMV';
  var FP_ACTION_IMAGE = 'IMAGE_GENERATION';
  var FP_ACTION_VIDEO = 'VIDEO_GENERATION';
  var MODEL_MAP = {
    nano_banana_pro: 'GEM_PIX_2',
    nano_banana_2: 'NARWHAL',
    imagen_4: 'IMAGEN_3_5'
  };
  var RATIO_MAP = {
    '16:9': 'IMAGE_ASPECT_RATIO_LANDSCAPE',
    '9:16': 'IMAGE_ASPECT_RATIO_PORTRAIT',
    '1:1': 'IMAGE_ASPECT_RATIO_SQUARE',
    '4:3': 'IMAGE_ASPECT_RATIO_FULLSCREEN',
    '3:4': 'IMAGE_ASPECT_RATIO_TALL'
  };
  // Video model key resolver (TurboFlow reverse-engineered)
  function videoModelKey(modelSetting, aspectRatio) {
    var portrait = aspectRatio === '9:16';
    var key;
    if (modelSetting === 'veo_fast') {
      key = portrait ? 'veo_3_1_t2v_fast_portrait' : 'veo_3_1_t2v_fast';
    } else { // veo_quality (default)
      key = portrait ? 'veo_3_1_t2v_portrait' : 'veo_3_1_t2v';
    }
    return key;
  }

  function uuid4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Get fresh OAuth access_token from Flow's session endpoint (cookies-auth)
  async function getFlowAccessToken() {
    try {
      var resp = await fetch('/fx/api/auth/session', { credentials: 'include' });
      if (!resp.ok) return null;
      var json = await resp.json();
      return json.access_token || null;
    } catch (e) { return null; }
  }

  // Project ID from URL
  function getProjectIdFromUrl() {
    var m = (window.location.href || '').match(/\/project\/([a-f0-9-]+)/);
    return m ? m[1] : null;
  }

  // Fresh recaptcha token via grecaptcha (no hook needed — siteKey hardcoded)
  async function getFreshRecaptchaAuto(action) {
    var ac = action || FP_ACTION_IMAGE;
    if (!window.grecaptcha || !window.grecaptcha.enterprise) {
      throw new Error('grecaptcha_not_loaded — abre Flow y espera 2-3s');
    }
    return await new Promise(function(resolve, reject) {
      try {
        window.grecaptcha.enterprise.ready(function() {
          window.grecaptcha.enterprise.execute(FP_SITEKEY, { action: ac }).then(resolve, reject);
        });
      } catch (e) { reject(e); }
    });
  }

  // Build body from settings (no template required)
  function buildAutoBody(promptText, opts) {
    var sessionId = ';' + Date.now();
    var imageModel = MODEL_MAP[opts.model] || 'NARWHAL';
    var imageRatio = RATIO_MAP[opts.aspectRatio] || 'IMAGE_ASPECT_RATIO_LANDSCAPE';
    var count = Math.max(1, parseInt(opts.generationCount, 10) || 1);
    var ctx = {
      recaptchaContext: { applicationType: 'RECAPTCHA_APPLICATION_TYPE_WEB', token: 'PLACEHOLDER' },
      projectId: opts.projectId,
      tool: 'PINHOLE',
      sessionId: sessionId
    };
    var requests = [];
    for (var i = 0; i < count; i++) {
      requests.push({
        clientContext: JSON.parse(JSON.stringify(ctx)),
        imageAspectRatio: imageRatio,
        imageInputs: [],
        imageModelName: imageModel,
        seed: Math.floor(Math.random() * 1000000),
        structuredPrompt: { parts: [{ text: promptText }] }
      });
    }
    return {
      clientContext: ctx,
      mediaGenerationContext: { batchId: uuid4() },
      useNewMedia: true,
      requests: requests
    };
  }

  async function replayAutoOne(promptText, opts) {
    var projectId = getProjectIdFromUrl();
    if (!projectId) return { ok: false, status: 0, text: 'no_project_id_in_url' };

    var accessToken = await getFlowAccessToken();
    if (!accessToken) return { ok: false, status: 0, text: 'session_auth_failed' };

    var recaptchaToken;
    try { recaptchaToken = await getFreshRecaptchaAuto(); }
    catch (e) { return { ok: false, status: 0, text: 'recaptcha_err: ' + e.message }; }

    var body = buildAutoBody(promptText, {
      model: opts.model,
      aspectRatio: opts.aspectRatio,
      generationCount: opts.generationCount,
      projectId: projectId
    });
    body.clientContext.recaptchaContext.token = recaptchaToken;
    for (var i = 0; i < body.requests.length; i++) {
      body.requests[i].clientContext.recaptchaContext.token = recaptchaToken;
    }

    var url = 'https://aisandbox-pa.googleapis.com/v1/projects/' + projectId + '/flowMedia:batchGenerateImages';
    try {
      var resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify(body)
      });
      var txt = await resp.text();
      return { ok: resp.ok, status: resp.status, text: txt };
    } catch (e) {
      return { ok: false, status: 0, text: 'fetch_err: ' + e.message };
    }
  }

  // Build video request body (text-to-video)
  function buildVideoBody(promptText, opts) {
    var sessionId = ';' + Date.now() + Math.floor(Math.random() * 1000);
    var portrait = opts.aspectRatio === '9:16';
    var aspectEnum = portrait ? 'VIDEO_ASPECT_RATIO_PORTRAIT' : 'VIDEO_ASPECT_RATIO_LANDSCAPE';
    var modelKey = videoModelKey(opts.model, opts.aspectRatio);
    return {
      mediaGenerationContext: { batchId: uuid4() },
      clientContext: {
        projectId: opts.projectId,
        tool: 'PINHOLE',
        recaptchaContext: { applicationType: 'RECAPTCHA_APPLICATION_TYPE_WEB', token: 'PLACEHOLDER' },
        sessionId: sessionId,
        userPaygateTier: 'PAYGATE_TIER_NOT_PAID'
      },
      requests: [{
        aspectRatio: aspectEnum,
        seed: Math.floor(Math.random() * 1000000),
        metadata: {},
        textInput: { structuredPrompt: { parts: [{ text: promptText }] } },
        videoModelKey: modelKey
      }],
      useV2ModelConfig: true
    };
  }

  // Async video generation request (text-to-video). Returns { ok, status, text, accessToken, projectId }
  async function replayAutoVideoOne(promptText, opts) {
    var projectId = getProjectIdFromUrl();
    if (!projectId) return { ok: false, status: 0, text: 'no_project_id_in_url' };
    var accessToken = await getFlowAccessToken();
    if (!accessToken) return { ok: false, status: 0, text: 'session_auth_failed' };
    var rcToken;
    try { rcToken = await getFreshRecaptchaAuto(FP_ACTION_VIDEO); }
    catch (e) { return { ok: false, status: 0, text: 'recaptcha_err: ' + e.message }; }
    var body = buildVideoBody(promptText, {
      model: opts.model,
      aspectRatio: opts.aspectRatio,
      projectId: projectId
    });
    body.clientContext.recaptchaContext.token = rcToken;
    var url = 'https://aisandbox-pa.googleapis.com/v1/video:batchAsyncGenerateVideoText';
    try {
      var resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8', 'Authorization': 'Bearer ' + accessToken },
        body: JSON.stringify(body)
      });
      var txt = await resp.text();
      return { ok: resp.ok, status: resp.status, text: txt, accessToken: accessToken, projectId: projectId };
    } catch (e) {
      return { ok: false, status: 0, text: 'fetch_err: ' + e.message };
    }
  }

  // Poll video generation status until completed or failed. Returns { ok, status }.
  async function pollVideoStatus(mediaId, projectId, accessToken, maxAttempts) {
    maxAttempts = maxAttempts || 120; // 120 × 5s = 10 min
    for (var attempt = 0; attempt < maxAttempts; attempt++) {
      if (STOP) return { ok: false, status: 'stopped' };
      await wait(5000);
      try {
        var resp = await fetch('https://aisandbox-pa.googleapis.com/v1/video:batchCheckAsyncVideoGenerationStatus', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8', 'Authorization': 'Bearer ' + accessToken },
          body: JSON.stringify({ media: [{ name: mediaId, projectId: projectId }] })
        });
        if (resp.status === 401 || resp.status === 403) {
          // Token may have rotated — refresh and retry next loop iteration
          var fresh = await getFlowAccessToken();
          if (fresh) accessToken = fresh;
          continue;
        }
        if (!resp.ok) continue;
        var data = await resp.json();
        var m = data && data.media && data.media[0];
        var st = m && m.mediaMetadata && m.mediaStatus && m.mediaStatus.mediaGenerationStatus;
        if (!st) st = m && m.mediaMetadata && m.mediaMetadata.mediaStatus && m.mediaMetadata.mediaStatus.mediaGenerationStatus;
        if (st === 'MEDIA_GENERATION_STATUS_COMPLETED' || st === 'MEDIA_GENERATION_STATUS_COMPLETE' || st === 'MEDIA_GENERATION_STATUS_SUCCESSFUL') {
          return { ok: true, status: st };
        }
        if (st === 'MEDIA_GENERATION_STATUS_FAILED') {
          return { ok: false, status: st };
        }
      } catch (e) {}
      // Refresh auth every ~60s
      if (attempt % 12 === 11) {
        var newAuth = await getFlowAccessToken();
        if (newAuth) accessToken = newAuth;
      }
    }
    return { ok: false, status: 'timeout' };
  }

  // Find latest captured batchGenerateImages request to use as template
  function findTemplate() {
    var caps = (window.__fpCaptured || []).slice().reverse();
    for (var i = 0; i < caps.length; i++) {
      if (/flowMedia:batchGenerateImages/i.test(caps[i].url || '')) return caps[i];
    }
    // Fallback: restore persisted template from previous session
    try {
      var saved = localStorage.getItem('fp_template');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  }

  async function getFreshRecaptchaToken() {
    var siteKey = window.__fpRecaptchaSiteKey;
    var action = window.__fpRecaptchaAction || 'submit';
    if (!siteKey) throw new Error('sitekey_unknown — genera 1 imagen manual primero');
    if (!window.grecaptcha || !window.grecaptcha.enterprise) throw new Error('grecaptcha_not_loaded');
    return await new Promise(function(resolve, reject) {
      try {
        window.grecaptcha.enterprise.ready(function() {
          window.grecaptcha.enterprise.execute(siteKey, { action: action }).then(resolve, reject);
        });
      } catch (e) { reject(e); }
    });
  }

  async function replayOneRequest(tpl, newPromptText) {
    var bodyObj;
    try { bodyObj = JSON.parse(tpl.body); } catch (e) { return { ok: false, status: 0, text: 'parse_body_err: ' + e.message }; }

    // Get fresh recaptcha token (single-use, expires fast)
    var freshToken;
    try {
      freshToken = await getFreshRecaptchaToken();
    } catch (e) {
      return { ok: false, status: 0, text: 'recaptcha_err: ' + e.message };
    }

    // Swap volatile fields
    if (bodyObj.mediaGenerationContext) {
      bodyObj.mediaGenerationContext.batchId = uuid4();
    }
    if (bodyObj.clientContext) {
      bodyObj.clientContext.sessionId = ';' + Date.now();
      if (bodyObj.clientContext.recaptchaContext) {
        bodyObj.clientContext.recaptchaContext.token = freshToken;
      }
    }
    if (Array.isArray(bodyObj.requests) && bodyObj.requests.length > 0) {
      var req0 = bodyObj.requests[0];
      req0.seed = Math.floor(Math.random() * 1000000);
      req0.structuredPrompt = { parts: [{ text: newPromptText }] };
      // Clear inputs (text-to-image, no reference images)
      if (Array.isArray(req0.imageInputs)) req0.imageInputs = [];
      if (req0.clientContext && req0.clientContext.recaptchaContext) {
        req0.clientContext.recaptchaContext.token = freshToken;
      }
    }

    // Build headers — use latest Bearer (rotates over time; capture.js stores fresh from any POST)
    var headers = { 'Content-Type': 'application/json' };
    var latestAuth = window.__fpAuth || (function() {
      try { return localStorage.getItem('fp_auth'); } catch (e) { return null; }
    })();
    if (latestAuth) headers['Authorization'] = latestAuth;
    // Copy other useful headers from template if not already set
    if (tpl.headers) {
      Object.keys(tpl.headers).forEach(function(k) {
        var lk = k.toLowerCase();
        if (!headers[k] && (lk === 'x-goog-api-key' || lk === 'accept-language' || lk === 'x-goog-authuser')) {
          headers[k] = tpl.headers[k];
        }
      });
    }

    try {
      var resp = await fetch(tpl.url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(bodyObj),
        credentials: 'include',
        mode: 'cors'
      });
      var txt = '';
      try { txt = await resp.text(); } catch (e) {}
      return { ok: resp.ok, status: resp.status, text: txt };
    } catch (e) {
      return { ok: false, status: 0, text: 'fetch_err: ' + e.message };
    }
  }

  // Track all generated images for download (persisted to survive page reload)
  var generatedMedia = [];
  try {
    var savedGen = localStorage.getItem('fp_generated');
    if (savedGen) generatedMedia = JSON.parse(savedGen) || [];
  } catch (e) {}
  function saveGenerated() {
    try { localStorage.setItem('fp_generated', JSON.stringify(generatedMedia.slice(-500))); } catch (e) {}
  }

  // Parse generation response → list of image URLs (one per generated media, deduped)
  function extractMediaUrls(resp) {
    if (!resp || typeof resp !== 'object') return [];
    // Build map: mediaId → fifeUrl (so each media has at most one URL)
    var fifeByMid = {};
    if (Array.isArray(resp.media)) {
      for (var i = 0; i < resp.media.length; i++) {
        var m = resp.media[i];
        var midM = m && (m.name || m.mediaId);
        var fife = m && m.image && m.image.generatedImage && m.image.generatedImage.fifeUrl;
        if (midM && fife) fifeByMid[midM] = fife;
        else if (fife && !midM) fifeByMid['__nomid_' + i] = fife;
      }
    }
    var seenMids = {};
    var out = [];
    // Walk workflows in order: each primaryMediaId = one image
    if (Array.isArray(resp.workflows)) {
      for (var w = 0; w < resp.workflows.length; w++) {
        var meta = resp.workflows[w] && resp.workflows[w].metadata;
        var mid = meta && meta.primaryMediaId;
        if (!mid || seenMids[mid]) continue;
        seenMids[mid] = true;
        if (fifeByMid[mid]) {
          out.push(fifeByMid[mid]);
        } else {
          out.push('https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=' + encodeURIComponent(mid));
        }
      }
    }
    // Fallback: workflows missing → take all fifeUrls from media[]
    if (out.length === 0) {
      Object.keys(fifeByMid).forEach(function(k) { out.push(fifeByMid[k]); });
    }
    return out;
  }

  // Human-readable model labels (used both for log and for sidepanel display)
  var MODEL_LABEL = {
    nano_banana_pro: 'Nano Banana Pro',
    nano_banana_2: 'Nano Banana 2',
    imagen_4: 'Imagen 4',
    veo_fast: 'Veo 3.1 Fast',
    veo_quality: 'Veo 3.1 Quality'
  };

  // Track in-flight video polls so we can wait before reloading at end of batch
  var pendingVideoPolls = 0;

  async function replayPrompts(lista, _ignoredTpl) {
    if (ejecutando) { vlog('⚠️ Ya en ejecución', '#f59e0b'); return; }
    ejecutando = true; STOP = false;
    var imgsPerPrompt = Math.max(1, parseInt(settings.generationCount, 10) || 1);
    var totalImages = lista.length * imgsPerPrompt;
    // Emit batch_start so sidepanel shows progress card + skeleton thumbs
    window.postMessage({
      source: 'gf-main',
      payload: { type: 'batch_start', total: totalImages, prompts: lista.length, imagesPerPrompt: imgsPerPrompt }
    }, '*');
    var ok = 0, fail = 0, dlOk = 0;
    function emitProgress() {
      window.postMessage({
        source: 'gf-main',
        payload: { type: 'progress', gen: ok, dl: dlOk, fail: fail }
      }, '*');
    }
    for (var i = 0; i < lista.length; i++) {
      if (STOP || !settings.enabled) {
        vlog('⛔ Detenido', '#ef4444');
        if (lista !== prompts) { prompts = lista; }
        indiceActual = i;
        ejecutando = false;
        // Notify sidepanel to mark pending skeletons as cancelled
        window.postMessage({ source: 'gf-main', payload: { type: 'batch_cancelled' } }, '*');
        // Auto-reload Flow tab (so generated-so-far appear in grid)
        vlog('🔄 Refrescando Flow en 3s...', '#6b7280');
        setTimeout(function() { window.location.reload(); }, 3000);
        return;
      }
      var raw = lista[i].trim();
      indiceActual = i;
      var isVideoMode = settings.mode === 'video';
      vlog('[' + (i+1) + '/' + lista.length + '] ' + raw.substring(0, 60) + '...', '#6366f1');
      var humanModel = MODEL_LABEL[settings.model] || settings.model;
      vlog('  → ' + humanModel + ' · ' + settings.aspectRatio + ' · ×' + (settings.generationCount || 1) + (isVideoMode ? ' · vídeo' : ''), '#6b7280');

      var r;
      // ===== VIDEO branch =====
      if (isVideoMode) {
        var videoCount = Math.max(1, parseInt(settings.generationCount, 10) || 1);
        var videoBatch = [];
        var allVideosOk = true;
        var lastErr = null;
        // Fire N video requests sequentially (one per generation count)
        for (var vc = 0; vc < videoCount; vc++) {
          var rv = await replayAutoVideoOne(raw, settings);
          if (!rv.ok) { allVideosOk = false; lastErr = rv; break; }
          var rvj = null;
          try { rvj = JSON.parse(rv.text || '{}'); } catch (e) {}
          var vMediaId = rvj && rvj.media && rvj.media[0] && rvj.media[0].name;
          if (!vMediaId) { allVideosOk = false; lastErr = { ok: false, status: 0, text: 'no_mediaId' }; break; }
          var vUrl = 'https://labs.google/fx/api/trpc/media.getMediaUrlRedirect?name=' + encodeURIComponent(vMediaId);
          var vItem = {
            url: vUrl, prompt: raw, idx: i + 1,
            suffix: videoCount > 1 ? String.fromCharCode(97 + vc) : '',
            isVideo: true, mediaId: vMediaId,
            accessToken: rv.accessToken, projectId: rv.projectId
          };
          videoBatch.push(vItem);
          generatedMedia.push(vItem);
          ok++;
          if (vc < videoCount - 1) await wait(800);
        }
        if (allVideosOk && videoBatch.length > 0) {
          saveGenerated();
          window.postMessage({
            source: 'gf-main',
            payload: { type: 'images_ready', promptIndex: i + 1, prompt: raw, urls: videoBatch.map(function(x){return x.url;}), isVideo: true }
          }, '*');
          emitProgress();
          // Start background polling for each video; download when ready
          (function(items) {
            items.forEach(function(it) {
              pendingVideoPolls++;
              (async function() {
                try {
                  var status = await pollVideoStatus(it.mediaId, it.projectId, it.accessToken);
                  if (!status.ok) {
                    vlog('  ⏰ Vídeo "' + raw.substring(0,40) + '" no completado: ' + status.status, '#f59e0b');
                    window.postMessage({ source: 'gf-main', payload: { type: 'media_failed', mediaId: it.mediaId } }, '*');
                    return;
                  }
                  window.postMessage({ source: 'gf-main', payload: { type: 'media_ready', mediaId: it.mediaId, url: it.url, isVideo: true } }, '*');
                  await wait(1500);
                  var dlOkVideo = await descargarUnaImagen(it);
                  if (dlOkVideo) { dlOk++; emitProgress(); }
                } finally {
                  pendingVideoPolls--;
                }
              })();
            });
          })(videoBatch);
          r = { ok: true, status: 200, text: '' };
        } else {
          r = lastErr || { ok: false, status: 0, text: 'video_fail' };
        }
      } else {
        // ===== IMAGE branch (existing flow) =====
        r = await replayAutoOne(raw, settings);
        if (r.ok) {
          // Extract image URLs from response and send to sidepanel for live preview
          try {
            var rj = JSON.parse(r.text || '{}');
            var mediaUrls = extractMediaUrls(rj);
            if (mediaUrls.length > 0) {
              ok += mediaUrls.length;
              var newItems = [];
              for (var mi = 0; mi < mediaUrls.length; mi++) {
                var item = {
                  url: mediaUrls[mi],
                  prompt: raw,
                  idx: i + 1,
                  suffix: mediaUrls.length > 1 ? String.fromCharCode(97 + mi) : ''
                };
                generatedMedia.push(item);
                newItems.push(item);
              }
              saveGenerated();
              window.postMessage({
                source: 'gf-main',
                payload: {
                  type: 'images_ready',
                  promptIndex: i + 1,
                  prompt: raw,
                  urls: mediaUrls
                }
              }, '*');
              emitProgress();
              // Always auto-download each new image (small delay so file is ready on server)
              (async function(items) {
                await wait(2000);
                for (var ai = 0; ai < items.length; ai++) {
                  var dlSuccess = await descargarUnaImagen(items[ai]);
                  if (dlSuccess) { dlOk++; emitProgress(); }
                  await wait(500);
                }
              })(newItems);
            } else {
              ok++;
              emitProgress();
            }
          } catch(e) {
            ok++;
            emitProgress();
          }
        }
      }
      if (!r.ok) {
        fail++;
        vlog('  ❌ HTTP ' + r.status + ' ' + (r.text || '').substring(0, 200), '#ef4444');
        guardarFallido(raw);
        emitProgress();
        var errText = String(r.text || '');
        var isRecaptcha = /reCAPTCHA|recaptcha/i.test(errText);
        var isDailyQuota = /DAILY_QUOTA_REACHED|daily.*quota|GENERATION_LIMIT/i.test(errText);
        var isThrottled = /USER_REQUESTS_THROTTLED|throttle/i.test(errText);
        // Daily quota → no point retrying, hard stop
        if (r.status === 429 && isDailyQuota) {
          vlog('🚫 Límite diario alcanzado. Espera 24h para que se reinicie o cambia a otra cuenta.', '#ef4444');
          localStorage.removeItem('fp_auto_resume');
          ejecutando = false;
          window.postMessage({ source: 'gf-main', payload: { type: 'batch_cancelled' } }, '*');
          setTimeout(function() { window.location.reload(); }, 3000);
          return;
        }
        // Auth/recaptcha rejected → auto-resume after reload
        if (r.status === 401 || r.status === 403 || (r.status === 429 && isRecaptcha)) {
          var remaining = lista.slice(i); // include current failed prompt for retry
          var retries = parseInt(localStorage.getItem('fp_resume_retries') || '0', 10);
          if (retries < 3) {
            localStorage.setItem('fp_auto_resume', JSON.stringify({
              prompts: remaining,
              settings: settings,
              ts: Date.now()
            }));
            localStorage.setItem('fp_resume_retries', String(retries + 1));
            vlog('🔄 Auth/reCAPTCHA bloqueado. Refrescando Flow + reanudando ' + remaining.length + ' prompts (intento ' + (retries+1) + '/3)...', '#f59e0b');
          } else {
            localStorage.removeItem('fp_auto_resume');
            localStorage.removeItem('fp_resume_retries');
            vlog('🚫 Bloqueado 3 veces seguidas. Detenido. Cierra Flow + reabre + intenta más tarde.', '#ef4444');
          }
          ejecutando = false;
          window.postMessage({ source: 'gf-main', payload: { type: 'batch_cancelled' } }, '*');
          setTimeout(function() { window.location.reload(); }, 3000);
          return;
        }
        // Throttle / generic rate-limit: backoff in-place
        if (r.status === 429) {
          var backoffSec = isThrottled ? 60 : 30;
          vlog('⏳ Rate limit. Esperando ' + backoffSec + 's antes de continuar...', '#f59e0b');
          await wait(backoffSec * 1000);
        }
      }
      if (i < lista.length - 1) {
        var baseMs = settings.delaySeconds * 1000;
        var jitterMs = baseMs + Math.floor(Math.random() * baseMs * 0.3);
        vlog('  ⏱️ Esperando ' + settings.delaySeconds + 's', '#6b7280');
        await wait(jitterMs);
      }
    }
    vlog('━━━ RESUMEN ━━━', '#7c5cfc');
    vlog('✅ ' + ok + ' OK | ❌ ' + fail + ' fallidos', '#7c5cfc');
    // Reset retry counter after successful completion
    localStorage.removeItem('fp_resume_retries');
    localStorage.removeItem('fp_auto_resume');
    ejecutando = false;
    window.postMessage({ source: 'gf-main', payload: { type: 'complete' } }, '*');
    // If videos still rendering, wait for polls before reloading (keeps polling alive)
    if (pendingVideoPolls > 0) {
      vlog('⏳ Esperando ' + pendingVideoPolls + ' vídeos en renderizado...', '#6b7280');
      var waitMax = 720; // up to 12 minutes (720 × 1s)
      var waited = 0;
      while (pendingVideoPolls > 0 && waited < waitMax) {
        await wait(1000);
        waited++;
      }
      if (pendingVideoPolls > 0) vlog('⏰ ' + pendingVideoPolls + ' vídeos no completaron a tiempo. Refrescando igualmente.', '#f59e0b');
      else vlog('✅ Todos los vídeos completados', '#22c55e');
    }
    vlog('🔄 Refrescando Flow en 3s...', '#6b7280');
    setTimeout(function() { window.location.reload(); }, 3000);
  }

  // === MESSAGE HANDLER (from bridge.js via postMessage) ===
  window.addEventListener('message', function(event) {
    if (!event.data || event.data.source !== 'gf-panel') return;
    var msg = event.data.payload;
    if (!msg || !msg.action) return;

    if (msg.action === 'updateSettings') { settings = Object.assign(settings, msg.settings || {}); return; }

    if (msg.action === 'start') {
      settings = Object.assign(settings, msg.settings || {});
      var lines = msg.prompts || []; if (!lines.length) { vlog('⚠️ Sin prompts', '#f59e0b'); return; }
      vlog('📂 ' + lines.length + ' prompts cargados', '#3b82f6');
      prompts = lines; indiceActual = 0;
      localStorage.setItem('gemini_fallidos','[]'); localStorage.setItem('gemini_politica','[]');
      // Aplicar configuración y ejecutar
      (async function() { await aplicarConfiguracion(); await wait(1000); await ejecutarPrompts(lines, false); })();
      return;
    }

    if (msg.action === 'continue') {
      settings = Object.assign(settings, msg.settings || {});
      var est = obtenerEstado();
      var pending = est && est.promptsPendientes ? est.promptsPendientes : [];
      if (!pending.length) { vlog('ℹ️ Sin prompts pendientes', '#6b7280'); return; }
      vlog('▶ Continuando con ' + pending.length + ' prompts pendientes', '#6366f1');
      (async function() { await replayPrompts(pending); })();
      return;
    }

    if (msg.action === 'retry') {
      settings = Object.assign(settings, msg.settings || {});
      var fList = JSON.parse(localStorage.getItem('gemini_fallidos') || '[]');
      if (!fList.length) { vlog('✅ Sin fallidos para reintentar', '#10b981'); return; }
      localStorage.setItem('gemini_fallidos', '[]');
      vlog('🔄 Reintentando ' + fList.length + ' fallidos', '#f59e0b');
      (async function() { await replayPrompts(fList); })();
      return;
    }

    if (msg.action === 'stop') {
      var wasRunning = ejecutando;
      STOP = true; ejecutando = false;
      vlog('⛔ Detenido', '#ef4444');
      if (wasRunning) {
        window.postMessage({ source: 'gf-main', payload: { type: 'batch_cancelled' } }, '*');
        vlog('🔄 Refrescando Flow en 3s...', '#6b7280');
        setTimeout(function() { window.location.reload(); }, 3000);
      }
      return;
    }
    if (msg.action === 'download') {
      if (generatedMedia.length > 0) {
        descargarGenerados();
      } else {
        // Fallback: scrape Flow's DOM gallery (works only if user did manual gens)
        descargarImagenes();
      }
      return;
    }
    if (msg.action === 'exportPolicy') { exportarArchivo('gemini_politica', 'politica.txt', 'bloqueados'); return; }
    if (msg.action === 'exportFailed') { exportarArchivo('gemini_fallidos', 'fallidos.txt', 'fallidos'); return; }
    if (msg.action === 'setEnabled') {
      settings.enabled = msg.enabled;
      if (!msg.enabled) { STOP=true; ejecutando=false; (async function() { try { await trustedDetach(); } catch(e) {} })(); }
      vlog(msg.enabled?'🟢 Activada':'🔴 Desactivada', msg.enabled?'#22c55e':'#ef4444');
      return;
    }

    if (msg.action === 'status') {
      var e=obtenerEstado(), f=JSON.parse(localStorage.getItem('gemini_fallidos')||'[]'), p=JSON.parse(localStorage.getItem('gemini_politica')||'[]');
      vlog('Ejecutando: '+(ejecutando?'Sí':'No')+' | '+settings.mode+'/'+settings.model+'/x'+settings.generationCount+'/'+settings.delaySeconds+'s', '#7c5cfc');
      vlog('Pendientes: '+(e?e.promptsPendientes?.length||0:0)+' | Fallidos: '+f.length+' | Política: '+p.length, '#6b7280'); return;
    }

    if (msg.action === 'clear') {
      localStorage.removeItem('gemini_estado'); localStorage.setItem('gemini_fallidos','[]'); localStorage.setItem('gemini_politica','[]');
      localStorage.removeItem('fp_generated');
      prompts=[]; indiceActual=0;
      generatedMedia = [];
      vlog('🗑️ Limpiado (incluye galería)', '#22c55e'); return;
    }
    if (msg.action === 'reloadFlow') {
      vlog('🔄 Refrescando Flow...', '#3b82f6');
      setTimeout(function() { window.location.reload(); }, 500);
      return;
    }

    // V2: show captured fetch/XHR POSTs (from capture.js)
    if (msg.action === 'showCaptures') {
      var caps = window.__fpCaptured || [];
      var allCaps = window.__fpAllCaptured || [];
      vlog('━━━ CAPTURAS V2 ━━━', '#7c5cfc');
      vlog('Filtradas: ' + caps.length + ' | Total POSTs: ' + allCaps.length, '#7c5cfc');
      if (caps.length === 0) {
        vlog('Sin capturas filtradas. Genera 1 imagen MANUALMENTE en Flow primero.', '#f59e0b');
        if (allCaps.length > 0) {
          vlog('--- URLs únicas de TODAS POSTs (' + allCaps.length + ') ---', '#6b7280');
          var seen = {};
          for (var ai = 0; ai < allCaps.length; ai++) {
            var u = (allCaps[ai].url || '').split('?')[0];
            if (!seen[u]) { seen[u] = true; vlog('  ' + u, '#6b7280'); }
          }
        }
      } else {
        // Show each filtered with body preview, marking prompt matches
        for (var c = 0; c < caps.length; c++) {
          var it = caps[c];
          var b = it.body || '';
          // Look for English-text-like content (prompt indicator)
          var hasPromptHint = /[a-zA-Z]{5,}\s+[a-zA-Z]{4,}\s+[a-zA-Z]{4,}/.test(b);
          var marker = hasPromptHint ? '🎯' : '  ';
          vlog(marker + ' [' + (c+1) + '] ' + it.method + ' ' + (it.url || '').substring(0, 140), '#3b82f6');
          vlog('     body[0..400]: ' + b.substring(0, 400), '#6b7280');
        }
      }
      try {
        console.log('[FlowPilot V2] __fpAllCaptured:', window.__fpAllCaptured);
        console.log('[FlowPilot V2] __fpCaptured (filtered):', window.__fpCaptured);
      } catch(e) {}
      vlog('Console (F12) tiene objetos completos: window.__fpCaptured', '#6b7280');
      return;
    }
    if (msg.action === 'clearCaptures') {
      try { window.__fpCaptured = []; window.__fpAllCaptured = []; } catch(e) {}
      vlog('🗑️ Capturas borradas', '#22c55e');
      return;
    }
    // Restore gallery thumbnails after side panel reload (sends persisted URLs back)
    if (msg.action === 'restoreGallery') {
      var byIdx = {};
      for (var gi = 0; gi < generatedMedia.length; gi++) {
        var m = generatedMedia[gi];
        var key = m.idx + '|' + (m.prompt || '');
        if (!byIdx[key]) byIdx[key] = { idx: m.idx, prompt: m.prompt, urls: [] };
        byIdx[key].urls.push(m.url);
      }
      Object.keys(byIdx).forEach(function(k) {
        var g = byIdx[k];
        window.postMessage({ source: 'gf-main', payload: { type: 'images_ready', promptIndex: g.idx, prompt: g.prompt, urls: g.urls } }, '*');
      });
      return;
    }

    // V2: Replay loaded prompts using captured request as template
    if (msg.action === 'startReplay') {
      settings = Object.assign(settings, msg.settings || {});
      var lines = msg.prompts || [];
      if (!lines.length) { vlog('⚠️ Sin prompts', '#f59e0b'); return; }
      vlog('📂 ' + lines.length + ' prompts cargados', '#3b82f6');
      var pid = getProjectIdFromUrl();
      if (!pid) { vlog('⚠️ Abre un proyecto Flow primero (URL debe contener /project/...)', '#f59e0b'); return; }
      var MODEL_LABEL = { nano_banana_pro: 'Nano Banana Pro', nano_banana_2: 'Nano Banana 2', imagen_4: 'Imagen 4', veo_fast: 'Veo 3.1 Fast', veo_quality: 'Veo 3.1 Quality' };
      var modelLbl = MODEL_LABEL[settings.model] || settings.model;
      vlog('⚙️ ' + modelLbl + ' | ' + settings.aspectRatio + ' | x' + settings.generationCount, '#7c5cfc');
      prompts = lines; indiceActual = 0;
      localStorage.setItem('gemini_fallidos','[]');
      // Clear previous batch's generated media so reload+restoreGallery only shows current batch
      generatedMedia = [];
      try { localStorage.removeItem('fp_generated'); } catch (e) {}
      // Reset auto-resume retry counter on fresh user-initiated run
      localStorage.removeItem('fp_resume_retries');
      localStorage.removeItem('fp_auto_resume');
      (async function() { await replayPrompts(lines); })();
      return;
    }
    if (msg.action === 'replayOne') {
      var testPrompt = (msg.prompt || 'a red apple on a white table').toString();
      vlog('🧪 Test replay: ' + testPrompt.substring(0,60), '#7c5cfc');
      (async function() {
        var r = await replayAutoOne(testPrompt, settings);
        vlog('   HTTP ' + r.status + (r.ok ? ' ✅' : ' ❌'), r.ok ? '#22c55e' : '#ef4444');
        if (r.text) vlog('   resp: ' + r.text.substring(0, 400), r.ok ? '#6b7280' : '#ef4444');
      })();
      return;
    }
  });

  // === INIT ===
  var GF_V = 'v0.10.0';
  var prevV = localStorage.getItem('gf_version');
  if (prevV !== GF_V) {
    localStorage.setItem('gf_version', GF_V);
    // Fresh install only: clear all. Upgrades preserve user prompts/state.
    if (!prevV) {
      localStorage.removeItem('gemini_estado'); localStorage.removeItem('gemini_fallidos'); localStorage.removeItem('gemini_politica');
    }
  }
  vlog('🚀 FlowPilot ' + GF_V + ' conectado', '#7c5cfc');
  window.postMessage({ source: 'gf-main', payload: { type: 'ready' } }, '*');

  // ===== AUTO-RESUME after reload =====
  // If a previous batch was interrupted by auth/recaptcha failure, resume automatically.
  try {
    var rawResume = localStorage.getItem('fp_auto_resume');
    if (rawResume) {
      var resume = JSON.parse(rawResume);
      localStorage.removeItem('fp_auto_resume');
      if (resume && Array.isArray(resume.prompts) && resume.prompts.length > 0) {
        var pendingCount = resume.prompts.length;
        vlog('⏳ Reanudación pendiente: ' + pendingCount + ' prompts. Esperando 10s para que cargue grecaptcha...', '#3b82f6');
        setTimeout(function() {
          if (resume.settings) settings = Object.assign(settings, resume.settings);
          var pid = getProjectIdFromUrl();
          if (!pid) {
            vlog('⚠️ No hay proyecto Flow abierto. Reanudación cancelada.', '#f59e0b');
            return;
          }
          if (!window.grecaptcha || !window.grecaptcha.enterprise) {
            vlog('⚠️ grecaptcha no cargado. Esperando 10s más...', '#f59e0b');
            setTimeout(function() {
              if (!ejecutando) {
                vlog('▶️ Reanudando ' + pendingCount + ' prompts pendientes', '#3b82f6');
                (async function() { await replayPrompts(resume.prompts); })();
              }
            }, 10000);
            return;
          }
          vlog('▶️ Reanudando ' + pendingCount + ' prompts pendientes', '#3b82f6');
          (async function() { await replayPrompts(resume.prompts); })();
        }, 10000);
      }
    }
  } catch (e) {}
})();
