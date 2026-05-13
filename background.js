// FlowPilot background — side panel + update checker via GitHub Releases

// ===== UPDATE CHECKER CONFIG =====
// Set this to your GitHub repo (e.g. "lordshion/flowpilot")
// Releases must be tagged like "v0.8.9" or "0.8.9" and may attach FlowPilot.zip as asset.
var GITHUB_REPO = 'digitalphoenixagencia-hue/flowpilot';
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
    var latestTag = (data.tag_name || '').replace(/^v/, '');
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

// Allow sidepanel to trigger manual check
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg && msg.type === 'check_update') {
    checkLatestRelease().then(function() {
      chrome.storage.local.get(['fpUpdate'], function(s) { sendResponse(s.fpUpdate || null); });
    });
    return true;
  }
});
