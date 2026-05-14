// FlowPilot V2 capture.js — runs at document_start in MAIN world
// Patches fetch + XMLHttpRequest to capture POST requests that look like generation calls.
// Stored on window.__fpCaptured for inspection by main.js.
(function() {
  'use strict';
  if (window.__fpCaptureLoaded) return;
  window.__fpCaptureLoaded = true;

  window.__fpCaptured = [];
  window.__fpAllCaptured = []; // all POSTs (for debugging if generation filter misses)

  // Restore persisted state from previous sessions
  try {
    var savedSite = localStorage.getItem('fp_recaptcha_sitekey');
    var savedAct = localStorage.getItem('fp_recaptcha_action');
    var savedAuth = localStorage.getItem('fp_auth');
    if (savedSite) window.__fpRecaptchaSiteKey = savedSite;
    if (savedAct) window.__fpRecaptchaAction = savedAct;
    if (savedAuth) window.__fpAuth = savedAuth;
  } catch (e) {}

  var MAX_CAPTURES = 50;
  var BODY_LIMIT = 50000; // max chars stored per body to avoid bloat

  function looksLikeGeneration(url) {
    if (!url) return false;
    var u = String(url).toLowerCase();
    // Hard exclude: analytics, telemetry, static assets, recaptcha
    if (/google-analytics\.com|googletagmanager\.com|doubleclick\.net|crashlytics|firebase|gstatic\.com|fonts\.googleapis\.com|cspreport|\/g\/collect|recaptcha|batchlog|batchloggrontendevents|batchlogfrontendevents|submitbatchlog/.test(u)) return false;
    if (/\.(html|css|js|png|jpe?g|gif|svg|woff2?|ttf|eot|ico|webp|mp4|webm)(\?|$|#)/.test(u)) return false;
    // Must be on Flow / aisandbox domains (incl. aisandbox-pa googleapis backend)
    if (!/labs\.google|aisandbox\.google\.com|aisandbox-pa\.googleapis\.com|aistudio\.google\.com/.test(u)) return false;
    return true;
  }

  function recordCapture(rec) {
    try {
      // Trim body
      if (rec.body && rec.body.length > BODY_LIMIT) rec.body = rec.body.slice(0, BODY_LIMIT) + '…[truncated]';
      window.__fpAllCaptured.push(rec);
      if (window.__fpAllCaptured.length > MAX_CAPTURES) window.__fpAllCaptured.shift();
      // Persist latest auth from ANY POST (Bearer rotates, fresh per page load)
      try {
        if (rec.headers && (rec.headers.Authorization || rec.headers.authorization)) {
          var auth = rec.headers.Authorization || rec.headers.authorization;
          window.__fpAuth = auth;
          localStorage.setItem('fp_auth', auth);
        }
      } catch (e) {}
      if (looksLikeGeneration(rec.url)) {
        window.__fpCaptured.push(rec);
        if (window.__fpCaptured.length > MAX_CAPTURES) window.__fpCaptured.shift();
        // Persist generation template (URL + headers + body) to localStorage for next session
        if (/flowMedia:batchGenerateImages/i.test(rec.url || '')) {
          try { localStorage.setItem('fp_template', JSON.stringify(rec)); } catch (e) {}
        }
      }
    } catch (e) {}
  }

  // ===== Patch fetch =====
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    try {
      var url = (typeof input === 'string') ? input : (input && input.url);
      var method = (init && init.method) || (input && input.method) || 'GET';
      method = String(method).toUpperCase();
      if (method === 'POST') {
        var headers = {};
        try {
          if (init && init.headers) {
            if (init.headers instanceof Headers) {
              init.headers.forEach(function(v, k) { headers[k] = v; });
            } else if (Array.isArray(init.headers)) {
              init.headers.forEach(function(p) { if (p && p.length === 2) headers[p[0]] = p[1]; });
            } else {
              Object.assign(headers, init.headers);
            }
          }
        } catch (e) {}
        var body = (init && init.body);
        var bodyStr = '';
        try {
          if (typeof body === 'string') bodyStr = body;
          else if (body instanceof FormData) bodyStr = '[FormData]';
          else if (body instanceof Blob) bodyStr = '[Blob:' + (body.type || 'application/octet-stream') + ',size=' + body.size + ']';
          else if (body instanceof URLSearchParams) bodyStr = body.toString();
          else if (body instanceof ArrayBuffer) bodyStr = '[ArrayBuffer:' + body.byteLength + ']';
          else if (body && typeof body === 'object') bodyStr = JSON.stringify(body);
        } catch (e) {}
        recordCapture({
          source: 'fetch',
          url: url,
          method: method,
          headers: headers,
          body: bodyStr,
          ts: Date.now()
        });
      }
    } catch (e) {}
    // Capture response too (for simulated mode — main.js needs the result body)
    var promise = origFetch.apply(this, arguments);
    try {
      var urlForResp = (typeof input === 'string') ? input : (input && input.url);
      if (urlForResp && looksLikeGeneration(urlForResp)) {
        promise.then(function(r) {
          try {
            r.clone().text().then(function(txt) {
              window.postMessage({ source: 'gf-flow-response', payload: { url: urlForResp, status: r.status, body: txt, ts: Date.now() } }, '*');
            }).catch(function(){});
          } catch (e) {}
        }).catch(function(){});
      }
    } catch (e) {}
    return promise;
  };

  // ===== Patch XHR =====
  var XO = XMLHttpRequest.prototype.open;
  var XS = XMLHttpRequest.prototype.send;
  var XSH = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.open = function(method, url) {
    this.__fpMethod = String(method || '').toUpperCase();
    this.__fpUrl = url;
    this.__fpHeaders = {};
    return XO.apply(this, arguments);
  };
  XMLHttpRequest.prototype.setRequestHeader = function(k, v) {
    try { if (this.__fpHeaders) this.__fpHeaders[k] = v; } catch (e) {}
    return XSH.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function(body) {
    try {
      if (this.__fpMethod === 'POST') {
        var bodyStr = '';
        try {
          if (typeof body === 'string') bodyStr = body;
          else if (body instanceof FormData) bodyStr = '[FormData]';
          else if (body instanceof Blob) bodyStr = '[Blob:' + (body.type || 'application/octet-stream') + ',size=' + body.size + ']';
          else if (body instanceof URLSearchParams) bodyStr = body.toString();
          else if (body instanceof ArrayBuffer) bodyStr = '[ArrayBuffer:' + body.byteLength + ']';
          else if (body && typeof body === 'object') bodyStr = JSON.stringify(body);
        } catch (e) {}
        recordCapture({
          source: 'xhr',
          url: this.__fpUrl,
          method: this.__fpMethod,
          headers: this.__fpHeaders || {},
          body: bodyStr,
          ts: Date.now()
        });
      }
    } catch (e) {}
    return XS.apply(this, arguments);
  };

  console.log('[FlowPilot V2] capture.js loaded — fetch/XHR patched');

  // ===== Hook grecaptcha.enterprise.execute to capture siteKey + action =====
  // Flow uses reCAPTCHA Enterprise V3 with single-use tokens. We need to call execute()
  // ourselves before each replay to get fresh tokens.
  function hookGrecaptcha() {
    try {
      if (window.grecaptcha && window.grecaptcha.enterprise && window.grecaptcha.enterprise.execute && !window.grecaptcha.enterprise.__fpHooked) {
        var orig = window.grecaptcha.enterprise.execute;
        window.grecaptcha.enterprise.execute = function(siteKey, opts) {
          try {
            window.__fpRecaptchaSiteKey = siteKey;
            window.__fpRecaptchaAction = opts && opts.action;
            localStorage.setItem('fp_recaptcha_sitekey', siteKey || '');
            localStorage.setItem('fp_recaptcha_action', (opts && opts.action) || '');
            console.log('[FlowPilot V2] grecaptcha.execute siteKey=' + siteKey + ' action=' + (opts && opts.action));
          } catch (e) {}
          return orig.apply(this, arguments);
        };
        window.grecaptcha.enterprise.__fpHooked = true;
        console.log('[FlowPilot V2] grecaptcha.enterprise.execute hooked');
      }
    } catch (e) {}
  }
  // Poll until grecaptcha lib loads (Flow injects it dynamically)
  var hookInterval = setInterval(function() {
    hookGrecaptcha();
    if (window.grecaptcha && window.grecaptcha.enterprise && window.grecaptcha.enterprise.__fpHooked) {
      clearInterval(hookInterval);
    }
  }, 300);
})();
