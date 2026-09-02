// IPC Bridge — replaces start.js (Web Serial transport) for the Electron app.
// Exposes the same global API (writeStream, device, log) that the rest of
// the ally-keys scripts depend on, but routes through electronAPI instead of
// a serial port.

'use strict';

// ── Dark mode ─────────────────────────────────────────────────────────────────
// Persist in localStorage; the ally-keys colour system uses .dark-mode on <body>.

const THEME_KEY = 'ak-theme';

function applyTheme(dark) {
  document.body.classList.toggle('dark-mode', dark);
}

function toggleDarkMode() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  _syncSettingsToggles();
}

// ── Dim overlay ───────────────────────────────────────────────────────────────
// Near-black full-screen overlay. Touch anywhere to undim.

let _dimmed = false;

function toggleDim() {
  _dimmed = !_dimmed;
  const overlay = document.getElementById('dim-overlay');
  if (overlay) overlay.classList.toggle('dim-active', _dimmed);
  // Close settings when dimming; leave it alone when undimming
  if (_dimmed) closeSettings();
  _syncSettingsToggles();
}

// ── Settings modal ────────────────────────────────────────────────────────────

function _syncSettingsToggles() {
  const darkRow = document.getElementById('sm-dark');
  const dimRow  = document.getElementById('sm-dim');
  if (darkRow) darkRow.classList.toggle('sm-on', document.body.classList.contains('dark-mode'));
  if (dimRow)  dimRow.classList.toggle('sm-on', _dimmed);
}

function openSettings() {
  const modal = document.getElementById('settings-modal');
  if (!modal) return;
  _syncSettingsToggles();
  modal.classList.remove('sm-hidden');
}

function closeSettings() {
  const modal = document.getElementById('settings-modal');
  if (modal) modal.classList.add('sm-hidden');
}

function confirmShutdown() {
  closeSettings();
  const modal = document.getElementById('shutdown-modal');
  if (modal) modal.classList.remove('sm-hidden');
}

function cancelShutdown() {
  const modal = document.getElementById('shutdown-modal');
  if (modal) modal.classList.add('sm-hidden');
}

function doShutdown() {
  cancelShutdown();
  window.electronAPI.shutdown();
}

// ── Apply saved theme immediately — before any other script runs.
// Falls back to 'dark' so the kiosk boots into dark mode by default.
(function restoreTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const dark = saved === null ? true : saved === 'dark';
  // body may not exist yet if this script is in <head>; queue it.
  if (document.body) {
    applyTheme(dark);
  } else {
    document.addEventListener('DOMContentLoaded', () => applyTheme(dark), { once: true });
  }
})();

// ── Device / connection state ─────────────────────────────────────────────────

// Global device object referenced by keyboard.js and others
const device = {
  connected: true,
  buffer: 6,     // 6-char hex mode (matches VERSION_STRING in rec-service.js)
  writer: null,  // not used in Electron
  reader: null,
};

// Main send function — mirrors start.js writeStream()
async function writeStream(streamData, fn) {
  if (window.electronAPI) {
    await window.electronAPI.sendKeycode(streamData);
  }
  if (typeof fn === 'function') fn();
}

// No-op — the Electron app is always "connected"
function attemptConnection() {}

// Logging — goes to devtools console and is picked up by keyboard.js
function log(msg) {
  const logEl = document.getElementById('log');
  if (logEl) {
    const line = document.createElement('p');
    line.textContent = msg;
    logEl.prepend(line);
    // Keep the log from growing unbounded
    while (logEl.childElementCount > 200) logEl.lastChild.remove();
  }
  console.log('[ally-keys-pi]', msg);
}

// On DOM ready: put the UI straight into "connected" state.
// The original start.js only reveals keyboard elements after the serial
// port connects; here we do it immediately.
document.addEventListener('DOMContentLoaded', () => {
  // Show elements that are hidden until connected
  document.querySelectorAll('.hidden-when-connected').forEach(el => {
    el.style.display = 'none';
  });
  ['menu-live-typing', 'menu-macro-pads'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('gone');
  });

  // Show the main keyboard
  const mainKb = document.getElementById('main-keyboard');
  if (mainKb) mainKb.classList.remove('gone');

  log('ally-keys-pi connected');
});
