// Bridge: ISOLATED world — relays chrome.runtime <-> window.postMessage
// Side panel -> main.js
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.action === 'ping') {
    var alive = document.documentElement.hasAttribute('data-gf-alive');
    sendResponse({ status: alive ? 'ok' : 'no' });
    return true;
  }
  // Forward everything else to main.js (page world)
  window.postMessage({ source: 'gf-panel', payload: msg }, '*');
});

// main.js -> background (trusted requests) OR side panel (logs/status)
window.addEventListener('message', function(event) {
  if (!event.data || event.data.source !== 'gf-main') return;
  var p = event.data.payload;
  if (!p) return;

  // Trusted input commands: route to background, await response, post back
  if (p.type === 'trusted_click' || p.type === 'trusted_key' || p.type === 'trusted_type_text' || p.type === 'trusted_detach') {
    var reqId = p.reqId;
    chrome.runtime.sendMessage(p, function(resp) {
      var err = chrome.runtime.lastError ? chrome.runtime.lastError.message : null;
      var payload = { reqId: reqId, response: resp || { ok: false, error: err || 'no_response' } };
      window.postMessage({ source: 'gf-bridge', payload: payload }, '*');
    });
    return;
  }

  // Default: forward to side panel (logs)
  try { chrome.runtime.sendMessage(p); } catch (e) {}
});
