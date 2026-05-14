// FlowPilot background — side panel + update checker via GitHub Releases

// ===== UPDATE CHECKER CONFIG =====
// Set this to your GitHub repo (e.g. "lordshion/flowpilot")
// Releases must be tagged like "v0.8.9" or "0.8.9" and may attach FlowPilot.zip as asset.
var GITHUB_REPO = 'gaizkatf/flowpilot';
var CHECK_INTERVAL_MIN = 360; // 6h

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

function isFlowUrl(url) {
  return url && (url.includes('labs.google') || url.includes('aisandbox.google.com'));
}

async function updateSidePanelForTab(tabId) {
  try {
    var tab = await chrome.tabs.get(tabId);
    if (isFlowUrl(tab.url)) {
      await chrome.sidePanel.setOptions({ tabId: tabId, path: 'sidepanel.html', enabled: true });
    } else {
      await chrome.sidePanel.setOptions({ tabId: tabId, enabled: false });
    }
  } catch (e) {}
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.url || changeInfo.status === 'complete') updateSidePanelForTab(tabId);
});

chrome.tabs.onActivated.addListener(function(info) { updateSidePanelForTab(info.tabId); });

// ===== UPDATE CHECKER =====
function isNewer(a, b) {
  if (!a || !b) return false;
  var pa = String(a).split('.').map(function(n){return parseInt(n, 10) || 0;});
  var pb = String(b).split('.').map(function(n){return parseInt(n, 10) || 0;});
  var len = Math.max(pa.length, pb.length);
  for (var i = 0; i < len; i++) {
    var x = pa[i] || 0, y = pb[i] || 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

async function checkLatestRelease() {
  if (!GITHUB_REPO || GITHUB_REPO.indexOf('/') === -1) return;
  try {
    var resp = await fetch('https://api.github.com/repos/' + GITHUB_REPO + '/releases/latest', {
      headers: { 'Accept': 'application/vnd.github+json' }
    });
    if (!resp.ok) return;
    var data = await resp.json();
    // Prefer release name if it looks like semver, else fall back to tag_name
    function parseVer(s) {
      s = String(s || '').replace(/^v/i, '').trim();
      return /^\d+(\.\d+){0,3}$/.test(s) ? s : null;
    }
    var latestTag = parseVer(data.name) || parseVer(data.tag_name);
    if (!latestTag) return;
    var manifest = chrome.runtime.getManifest();
    var current = manifest.version;
    // Prefer .zip asset, else release html page
    var assetUrl = data.html_url;
    if (Array.isArray(data.assets)) {
      for (var i = 0; i < data.assets.length; i++) {
        var a = data.assets[i];
        if (a && /\.zip$/i.test(a.name || '')) { assetUrl = a.browser_download_url; break; }
      }
    }
    var payload = {
      available: isNewer(latestTag, current),
      version: latestTag,
      url: assetUrl,
      notes: (data.body || '').substring(0, 1000),
      checkedAt: Date.now()
    };
    await chrome.storage.local.set({ fpUpdate: payload });
  } catch (e) {}
}

chrome.runtime.onStartup.addListener(checkLatestRelease);
chrome.runtime.onInstalled.addListener(checkLatestRelease);

try {
  chrome.alarms.create('fpUpdateCheck', { periodInMinutes: CHECK_INTERVAL_MIN });
  chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm && alarm.name === 'fpUpdateCheck') checkLatestRelease();
  });
} catch (e) {}

// ===== CHROME DEBUGGER (trusted click + passive network monitoring) =====
var attachedTabs = new Set();

async function ensureAttached(tabId) {
  if (attachedTabs.has(tabId)) return;
  await chrome.debugger.attach({ tabId: tabId }, '1.3');
  attachedTabs.add(tabId);
  // Enable Network domain so we passively observe responses (no page-side fetch wrapper needed)
  try {
    await chrome.debugger.sendCommand({ tabId: tabId }, 'Network.enable', {});
  } catch (e) {}
}

chrome.tabs.onRemoved.addListener(function(tabId) { attachedTabs.delete(tabId); });
chrome.debugger.onDetach.addListener(function(source) {
  if (source && source.tabId) attachedTabs.delete(source.tabId);
});

// Listen for Network responses. When a generation URL completes, fetch body + forward to content script.
function isGenerationUrl(url) {
  if (!url) return false;
  return /aisandbox-pa\.googleapis\.com\/v1\/(projects\/[^/]+\/flowMedia:batchGenerateImages|video:batchAsyncGenerateVideoText)/.test(url);
}

chrome.debugger.onEvent.addListener(function(source, method, params) {
  if (!source || !source.tabId || !attachedTabs.has(source.tabId)) return;
  if (method !== 'Network.responseReceived') return;
  var resp = params && params.response;
  if (!resp || !isGenerationUrl(resp.url)) return;
  var reqId = params.requestId;
  var status = resp.status;
  // Wait briefly for body to be available, then fetch it
  setTimeout(function() {
    chrome.debugger.sendCommand({ tabId: source.tabId }, 'Network.getResponseBody', { requestId: reqId })
      .then(function(result) {
        var body = (result && result.body) || '';
        // If base64, decode
        if (result && result.base64Encoded) {
          try { body = atob(body); } catch (e) {}
        }
        chrome.tabs.sendMessage(source.tabId, {
          type: 'cdp_network_response',
          url: resp.url,
          status: status,
          body: body
        }).catch(function(){});
      })
      .catch(function(){});
  }, 300);
});

// Allow sidepanel to trigger manual check + content-script trusted events
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg && msg.type === 'check_update') {
    checkLatestRelease().then(function() {
      chrome.storage.local.get(['fpUpdate'], function(s) { sendResponse(s.fpUpdate || null); });
    });
    return true;
  }
  if (!msg || !msg.type || !sender.tab) return false;
  var tabId = sender.tab.id;

  if (msg.type === 'trusted_click') {
    (async function() {
      try {
        await ensureAttached(tabId);
        var target = { tabId: tabId };
        await chrome.debugger.sendCommand(target, 'Input.dispatchMouseEvent', { type: 'mouseMoved', x: msg.x, y: msg.y, button: 'none', buttons: 0 });
        await chrome.debugger.sendCommand(target, 'Input.dispatchMouseEvent', { type: 'mousePressed', x: msg.x, y: msg.y, button: 'left', clickCount: 1, buttons: 1 });
        await new Promise(function(r){ setTimeout(r, 40 + Math.random() * 70); });
        await chrome.debugger.sendCommand(target, 'Input.dispatchMouseEvent', { type: 'mouseReleased', x: msg.x, y: msg.y, button: 'left', clickCount: 1, buttons: 0 });
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: String(e && e.message || e) });
      }
    })();
    return true;
  }

  if (msg.type === 'trusted_mouse_move') {
    (async function() {
      try {
        await ensureAttached(tabId);
        await chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchMouseEvent', {
          type: 'mouseMoved', x: msg.x, y: msg.y, button: 'none', buttons: 0
        });
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: String(e && e.message || e) });
      }
    })();
    return true;
  }

  if (msg.type === 'trusted_type_text') {
    (async function() {
      try {
        await ensureAttached(tabId);
        var text = String(msg.text || '');
        for (var i = 0; i < text.length; i++) {
          var ch = text[i];
          // Use Input.insertText (fires beforeinput/input events Slate listens to)
          await chrome.debugger.sendCommand({ tabId: tabId }, 'Input.insertText', { text: ch });
          // Realistic typing rhythm: 30-80ms per char with occasional longer pauses
          var pause = 30 + Math.random() * 50;
          if (Math.random() < 0.05) pause += 200 + Math.random() * 300; // occasional "thinking"
          await new Promise(function(r) { setTimeout(r, pause); });
        }
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: String(e && e.message || e) });
      }
    })();
    return true;
  }

  if (msg.type === 'trusted_detach') {
    (async function() {
      if (attachedTabs.has(tabId)) {
        try { await chrome.debugger.detach({ tabId: tabId }); } catch (e) {}
        attachedTabs.delete(tabId);
      }
      sendResponse({ ok: true });
    })();
    return true;
  }
  return false;
});
