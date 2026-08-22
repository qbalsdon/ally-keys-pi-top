// Service bar — manages the 5 BLE status chips at the top of the screen.
// Receives live state updates from the Electron main process via preload.js.

'use strict';

// Toggle forwarding for a HID service. Called by onclick on chip elements.
function toggleForward(hidId) {
  const chip = document.getElementById('sb-hid-' + hidId);
  if (!chip || chip.classList.contains('sb-disconnected')) return;
  if (window.electronAPI) {
    window.electronAPI.toggleForward(hidId);
  }
}

function updateServiceBar(state) {
  // ── REC ──
  const recChip   = document.getElementById('sb-rec');
  if (recChip) {
    const dot     = recChip.querySelector('.sb-dot');
    const stateEl = recChip.querySelector('.sb-state');
    const on      = state.rec && state.rec.connected;
    dot.className      = 'sb-dot ' + (on ? 'sb-on' : 'sb-off');
    stateEl.textContent = on ? 'connected' : 'waiting';
    recChip.classList.toggle('sb-rec-active', on);
  }

  // ── HID 1–4 ──
  for (let i = 1; i <= 4; i++) {
    const hidState = (state.hid && state.hid[i]) || { connected: false, forwarding: false };
    const chip     = document.getElementById('sb-hid-' + i);
    if (!chip) continue;

    const dot     = chip.querySelector('.sb-dot');
    const stateEl = chip.querySelector('.sb-state');
    const badge   = chip.querySelector('.sb-fwd-badge');

    dot.className      = 'sb-dot ' + (hidState.connected ? 'sb-on' : 'sb-off');
    stateEl.textContent = hidState.connected ? 'connected' : 'waiting';

    chip.classList.toggle('sb-fwd', hidState.forwarding);
    chip.classList.toggle('sb-disconnected', !hidState.connected);

    if (badge) badge.style.display = hidState.forwarding ? '' : 'none';
  }
}

function initServiceBar() {
  if (!window.electronAPI) return;
  window.electronAPI.onServiceState(updateServiceBar);
}

document.addEventListener('DOMContentLoaded', initServiceBar);
