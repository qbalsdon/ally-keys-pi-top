// IPC Bridge — replaces start.js (Web Serial transport) for the Electron app.
// Exposes the same global API (writeStream, device, log) that the rest of
// the ally-keys scripts depend on, but routes through electronAPI instead of
// a serial port.

'use strict';

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
