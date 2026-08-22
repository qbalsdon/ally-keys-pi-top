// Service bar — manages the 5 BLE status chips at the top of the screen.
// Receives live state updates from the Electron main process via preload.js.

'use strict';

// ── Status icons (inline SVG, fill="currentColor" so CSS controls colour) ────

const ICON_CONNECTED = `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m6.583 9.723-3.926 3.926a5.491 5.491 0 0 0-.006 7.7 5.43 5.43 0 0 0 7.7 0l1.99-1.99a1 1 0 1 0-1.414-1.414l-1.996 1.99a3.441 3.441 0 0 1-4.864-4.868l3.933-3.93a3.382 3.382 0 0 1 1.543-.892 3.424 3.424 0 0 1 3.323.894c.085.084.169.177.267.284a.991.991 0 0 0 1.406.059 1.009 1.009 0 0 0 .059-1.42c-.107-.117-.214-.234-.316-.335a5.435 5.435 0 0 0-7.7 0z"/><path d="m13.077 6.057 1.992-1.992a3.508 3.508 0 0 1 4.868.006 3.5 3.5 0 0 1 0 4.862l-3.937 3.93a3.382 3.382 0 0 1-1.543.892 3.431 3.431 0 0 1-3.323-.894c-.085-.084-.169-.177-.267-.284a.991.991 0 0 0-1.406-.059 1.009 1.009 0 0 0-.059 1.42c.107.117.214.234.316.335a5.493 5.493 0 0 0 5.253 1.415 5.394 5.394 0 0 0 2.444-1.411l3.926-3.926a5.55 5.55 0 0 0 .006-7.7 5.43 5.43 0 0 0-7.7 0l-1.99 1.99a1 1 0 0 0 1.414 1.414z"/><path d="m5.01 6.418a1.034 1.034 0 0 0 1.414 0 1 1 0 0 0-.001-1.418l-2.36-2.351a1 1 0 1 0-1.412 1.416z"/><path d="m8.855 0a1 1 0 0 1 1 1v1.579a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1.579a1 1 0 0 1 1-1z"/><path d="m1 9.857 1.583-.008a1 1 0 0 0 0-2h-.005l-1.584.008a1 1 0 0 0 .006 2z"/><path d="m20.643 21.643a1 1 0 0 0 .708-1.706l-2.351-2.36a1 1 0 0 0-1.416 1.413l2.353 2.359a1 1 0 0 0 .706.294z"/><path d="m20.422 15.146a1 1 0 0 0 1 1h1.578a1 1 0 1 0 0-2h-1.579a1 1 0 0 0-.999 1z"/><path d="m15.143 24a1 1 0 0 0 1-.994l.008-1.584a1 1 0 0 0-.995-1h-.005a1 1 0 0 0-1 .995l-.008 1.583a1 1 0 0 0 .994 1z"/></svg>`;

const ICON_DISCONNECTED = `<svg viewBox="0 0 512 512" fill="currentColor" width="15" height="15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m7.7 42.8c-9.7-9.7-9.7-25.3 0-34.9 9.6-9.7 25.3-9.7 34.9 0l121.9 121.9c4.6 4.6 7.3 10.9 7.3 17.5.5 21.3-27.5 33.1-42.2 17.4-.1-.3-23.6-23.5-23.7-23.7l-47.9-48.1c-.3.2-50.1-50.2-50.3-50.1zm223.2 70.2s26.8 26.8 26.8 26.8c14.7 15.6 42.8 3.9 42.1-17.5 0-6.6-2.5-12.7-7.3-17.5l-26.7-26.7c-41.5-41.5-104.2-50.7-155.4-23.8l37.7 37.7c29-8.6 61.1-.6 82.8 21zm112.9-17.7c4 .7 8-2.1 8.6-6.2l8.5-50.7c.7-4.1-2.1-7.9-6.2-8.6s-7.9 2.1-8.6 6.2l-8.5 50.7c-.6 4.1 2.1 8 6.2 8.6zm43.2 42.1c1.9 0 3.8-.7 5.3-2.2l38-38c6.9-6.9-3.6-17.5-10.6-10.6 0 0-38 38-38 38-4.8 4.5-1.1 13.1 5.3 12.8zm34.6 35.7c.7 4.1 4.6 6.9 8.6 6.2l50.7-8.5c4.1-.7 6.8-4.5 6.2-8.6-.7-4.1-4.5-6.9-8.6-6.2l-50.7 8.5c-4.1.7-6.9 4.6-6.2 8.6zm-74.1 209.4 20.2 20.2c15.5-6.6 28.2-19.4 34.9-34.9l-20.2-20.2c-9.2-9.7-25.7-9.6-34.9 0-9.5 9.3-9.5 25.8 0 34.9zm105.5 27.6c32.6-52.7 24.7-120-19-163.8 0 0-26.7-26.7-26.7-26.7-23.7-22.4-57.3 11.4-34.9 34.9 0 0 26.7 26.7 26.7 26.7 43 41.7 26.2 118.1-30.7 137.5-30.4 10.9-64.5 3.2-87.2-19.5l-26.7-26.7c-9.2-9.6-25.7-9.7-34.9 0-9.6 9.2-9.6 25.6 0 34.9 0 0 26.7 26.7 26.7 26.7 57.9 60.7 164.1 47.9 206.7-24zm-280 11.6c-4.1-.7-7.9 2.1-8.6 6.2l-8.5 50.7c-.7 4.1 2.1 7.9 6.2 8.6 4 .7 8-2.1 8.6-6.2l8.5-50.7c.7-4-2.1-7.9-6.2-8.6zm331.3 47.8-43.7-43.6c-9.6 13.5-21.5 25.3-34.9 34.9l43.7 43.6c9.4 9.4 25.6 9.4 34.9 0 9.6-9.6 9.6-25.3 0-34.9zm-409.1-125.6c-.7-4.1-4.6-6.9-8.6-6.2l-50.7 8.5c-4.1.7-6.8 4.5-6.2 8.6.7 4.1 4.6 6.9 8.6 6.2l50.7-8.5c4.2-.7 6.9-4.5 6.2-8.6zm17.7-112.9c-21.6-21.6-29.5-53.6-20.9-82.7l-37.7-37.7c-27 51.2-17.8 113.9 23.7 155.4 0 0 26.8 26.8 26.8 26.8 14.7 15.6 42.8 3.9 42.1-17.5 0-6.6-2.5-12.8-7.2-17.5zm11.6 150.8s-38 38-38 38c-4.8 4.4-1.1 13 5.3 12.8 1.9 0 3.8-.7 5.3-2.2l38-38c6.9-6.9-3.6-17.5-10.6-10.6z"/></svg>`;

// ── Forwarding toggle ─────────────────────────────────────────────────────────

function toggleForward(hidId) {
  const chip = document.getElementById('sb-hid-' + hidId);
  if (!chip || chip.classList.contains('sb-disconnected')) return;
  if (window.electronAPI) {
    window.electronAPI.toggleForward(hidId);
  }
}

// ── State renderer ────────────────────────────────────────────────────────────

function setIcon(chip, connected) {
  const icon = chip.querySelector('.sb-icon');
  if (icon) icon.innerHTML = connected ? ICON_CONNECTED : ICON_DISCONNECTED;
}

function updateServiceBar(state) {
  // ── REC ──
  const recChip = document.getElementById('sb-rec');
  if (recChip) {
    const on = state.rec && state.rec.connected;
    setIcon(recChip, on);
    recChip.classList.toggle('sb-rec-active', on);
  }

  // ── HID 1–4 ──
  for (let i = 1; i <= 4; i++) {
    const hidState = (state.hid && state.hid[i]) || { connected: false, forwarding: false };
    const chip     = document.getElementById('sb-hid-' + i);
    if (!chip) continue;

    setIcon(chip, hidState.connected);
    chip.classList.toggle('sb-fwd', hidState.forwarding);
    chip.classList.toggle('sb-disconnected', !hidState.connected);

    const badge = chip.querySelector('.sb-fwd-badge');
    if (badge) badge.style.display = hidState.forwarding ? '' : 'none';
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

function initServiceBar() {
  // Render all icons in their initial disconnected state
  document.querySelectorAll('.sb-icon').forEach(el => {
    el.innerHTML = ICON_DISCONNECTED;
  });

  if (!window.electronAPI) return;
  window.electronAPI.onServiceState(updateServiceBar);
}

document.addEventListener('DOMContentLoaded', initServiceBar);
