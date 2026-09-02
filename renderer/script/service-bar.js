// Service bar — manages the 5 BLE status chips at the top of the screen.
// Receives live state updates from the Electron main process via preload.js.

'use strict';

// ── Status icons (inline SVG, fill="currentColor" so CSS controls colour) ────

const ICON_CONNECTED = `<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m6.583 9.723-3.926 3.926a5.491 5.491 0 0 0-.006 7.7 5.43 5.43 0 0 0 7.7 0l1.99-1.99a1 1 0 1 0-1.414-1.414l-1.996 1.99a3.441 3.441 0 0 1-4.864-4.868l3.933-3.93a3.382 3.382 0 0 1 1.543-.892 3.424 3.424 0 0 1 3.323.894c.085.084.169.177.267.284a.991.991 0 0 0 1.406.059 1.009 1.009 0 0 0 .059-1.42c-.107-.117-.214-.234-.316-.335a5.435 5.435 0 0 0-7.7 0z"/><path d="m13.077 6.057 1.992-1.992a3.508 3.508 0 0 1 4.868.006 3.5 3.5 0 0 1 0 4.862l-3.937 3.93a3.382 3.382 0 0 1-1.543.892 3.431 3.431 0 0 1-3.323-.894c-.085-.084-.169-.177-.267-.284a.991.991 0 0 0-1.406-.059 1.009 1.009 0 0 0-.059 1.42c.107.117.214.234.316.335a5.493 5.493 0 0 0 5.253 1.415 5.394 5.394 0 0 0 2.444-1.411l3.926-3.926a5.55 5.55 0 0 0 .006-7.7 5.43 5.43 0 0 0-7.7 0l-1.99 1.99a1 1 0 0 0 1.414 1.414z"/><path d="m5.01 6.418a1.034 1.034 0 0 0 1.414 0 1 1 0 0 0-.001-1.418l-2.36-2.351a1 1 0 1 0-1.412 1.416z"/><path d="m8.855 0a1 1 0 0 1 1 1v1.579a1 1 0 0 1-1 1 1 1 0 0 1-1-1v-1.579a1 1 0 0 1 1-1z"/><path d="m1 9.857 1.583-.008a1 1 0 0 0 0-2h-.005l-1.584.008a1 1 0 0 0 .006 2z"/><path d="m20.643 21.643a1 1 0 0 0 .708-1.706l-2.351-2.36a1 1 0 0 0-1.416 1.413l2.353 2.359a1 1 0 0 0 .706.294z"/><path d="m20.422 15.146a1 1 0 0 0 1 1h1.578a1 1 0 1 0 0-2h-1.579a1 1 0 0 0-.999 1z"/><path d="m15.143 24a1 1 0 0 0 1-.994l.008-1.584a1 1 0 0 0-.995-1h-.005a1 1 0 0 0-1 .995l-.008 1.583a1 1 0 0 0 .994 1z"/></svg>`;

const ICON_DISCONNECTED = `<svg viewBox="0 0 512 512" fill="currentColor" width="15" height="15" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="m7.7 42.8c-9.7-9.7-9.7-25.3 0-34.9 9.6-9.7 25.3-9.7 34.9 0l121.9 121.9c4.6 4.6 7.3 10.9 7.3 17.5.5 21.3-27.5 33.1-42.2 17.4-.1-.3-23.6-23.5-23.7-23.7l-47.9-48.1c-.3.2-50.1-50.2-50.3-50.1zm223.2 70.2s26.8 26.8 26.8 26.8c14.7 15.6 42.8 3.9 42.1-17.5 0-6.6-2.5-12.7-7.3-17.5l-26.7-26.7c-41.5-41.5-104.2-50.7-155.4-23.8l37.7 37.7c29-8.6 61.1-.6 82.8 21zm112.9-17.7c4 .7 8-2.1 8.6-6.2l8.5-50.7c.7-4.1-2.1-7.9-6.2-8.6s-7.9 2.1-8.6 6.2l-8.5 50.7c-.6 4.1 2.1 8 6.2 8.6zm43.2 42.1c1.9 0 3.8-.7 5.3-2.2l38-38c6.9-6.9-3.6-17.5-10.6-10.6 0 0-38 38-38 38-4.8 4.5-1.1 13.1 5.3 12.8zm34.6 35.7c.7 4.1 4.6 6.9 8.6 6.2l50.7-8.5c4.1-.7 6.8-4.5 6.2-8.6-.7-4.1-4.5-6.9-8.6-6.2l-50.7 8.5c-4.1.7-6.9 4.6-6.2 8.6zm-74.1 209.4 20.2 20.2c15.5-6.6 28.2-19.4 34.9-34.9l-20.2-20.2c-9.2-9.7-25.7-9.6-34.9 0-9.5 9.3-9.5 25.8 0 34.9zm105.5 27.6c32.6-52.7 24.7-120-19-163.8 0 0-26.7-26.7-26.7-26.7-23.7-22.4-57.3 11.4-34.9 34.9 0 0 26.7 26.7 26.7 26.7 43 41.7 26.2 118.1-30.7 137.5-30.4 10.9-64.5 3.2-87.2-19.5l-26.7-26.7c-9.2-9.6-25.7-9.7-34.9 0-9.6 9.2-9.6 25.6 0 34.9 0 0 26.7 26.7 26.7 26.7 57.9 60.7 164.1 47.9 206.7-24zm-280 11.6c-4.1-.7-7.9 2.1-8.6 6.2l-8.5 50.7c-.7 4.1 2.1 7.9 6.2 8.6 4 .7 8-2.1 8.6-6.2l8.5-50.7c.7-4-2.1-7.9-6.2-8.6zm331.3 47.8-43.7-43.6c-9.6 13.5-21.5 25.3-34.9 34.9l43.7 43.6c9.4 9.4 25.6 9.4 34.9 0 9.6-9.6 9.6-25.3 0-34.9zm-409.1-125.6c-.7-4.1-4.6-6.9-8.6-6.2l-50.7 8.5c-4.1.7-6.8 4.5-6.2 8.6.7 4.1 4.6 6.9 8.6 6.2l50.7-8.5c4.2-.7 6.9-4.5 6.2-8.6zm17.7-112.9c-21.6-21.6-29.5-53.6-20.9-82.7l-37.7-37.7c-27 51.2-17.8 113.9 23.7 155.4 0 0 26.8 26.8 26.8 26.8 14.7 15.6 42.8 3.9 42.1-17.5 0-6.6-2.5-12.8-7.2-17.5zm11.6 150.8s-38 38-38 38c-4.8 4.4-1.1 13 5.3 12.8 1.9 0 3.8-.7 5.3-2.2l38-38c6.9-6.9-3.6-17.5-10.6-10.6z"/></svg>`;

// ── Keyboard icon (from keyboard.svg) for HID forwarding state ────────────────
// When forwarding is ON: clean keyboard icon
// When forwarding is OFF: keyboard icon with a red diagonal "no" slash

const _KB_PATHS = [
  `<path d="m639.58 195.1001h-428.77c-21.84 0-39.54 17.7-39.54 39.54v424.4499c0 9 3.01 17.28 8.07 23.9302 7.21 9.49 18.6299 15.6099 31.47 15.6099h428.77c12.43 0 23.52-5.74 30.77-14.71 5.4901-6.79 8.77-15.4199 8.77-24.8301v-424.4498c0-21.84-17.7-39.54-39.54-39.54z" fill="#4da2bf"/>`,
  `<path d="m237.34 177.1948v329.16c0 5.3 1.7599 10.17 4.75 14.08l-62.75 121.4c-5.06-6.65-8.07-14.9301-8.07-23.9301v-424.4499c0-21.84 17.7-39.54 39.54-39.54h49.81c-12.86 0-23.28 10.42-23.28 23.28z" fill="#bee2eb"/>`,
  `<path d="m679.12 193.4548v424.45c0 9.41-3.28 18.04-8.77 24.83l-62.7599-121.41c3.4-4.04 5.46-9.26 5.46-14.97v-329.16c0-12.86-10.42-23.28-23.27-23.28h49.8c21.84 0 39.54 17.7 39.54 39.54z" fill="#bee2eb"/>`,
  `<path d="m670.35 642.7348c-7.25 8.97-18.34 14.71-30.77 14.71h-428.77c-12.84 0-24.26-6.12-31.47-15.61l62.75-121.4c-2.9901-3.91-4.75-8.78-4.75-14.08v-329.16c0-12.86 10.42-23.28 23.28-23.28h329.16c12.85 0 23.27 10.42 23.27 23.28v329.16c0 5.71-2.06 10.93-5.46 14.97l62.7599 121.41z" fill="#87c2d6"/>`,
  `<path d="m613.05 177.1948v329.16c0 5.71-2.06 10.93-5.46 14.97-4.27 5.08-10.66 8.3-17.81 8.3h-329.16c-7.56 0-14.28-3.6-18.53-9.19-2.9901-3.91-4.75-8.78-4.75-14.08v-329.16c0-12.86 10.42-23.28 23.28-23.28h329.16c12.85 0 23.27 10.42 23.27 23.28z" fill="#f4f4f4"/>`,
  `<path d="m639.5819 153.9111c21.84 0 39.54 17.3743 39.54 38.8125v467.0942c0 9.2368-3.28 17.708-8.77 24.373-7.25 8.8047-18.34 14.439-30.77 14.439h-428.77c-12.84 0-24.26-6.0068-31.47-15.3223-5.06-6.5278-8.07-14.6553-8.07-23.4897v-467.0942c0-21.4382 17.7-38.8125 39.54-38.8125zm0-39.6303h-428.77c-43.6547 0-79.1703 35.1895-79.1703 78.4429v467.0942c0 17.4277 5.6635 33.9463 16.3782 47.769 7.2248 9.3345 16.671 17.0742 27.2995 22.3599 10.9365 5.4385 23.2097 8.3135 35.4927 8.3135h428.77c23.8858 0 46.252-10.5259 61.3636-28.8784 11.4812-13.9385 17.8067-31.5425 17.8067-49.564v-467.0943c0-43.2534-35.5157-78.4429-79.1703-78.4429z" fill="#0b0f33"/>`,
  `<path d="m542.1231 299.9917c5.6987 0 10.3613-4.6621 10.3613-10.3608v-48.1226c0-5.6982-4.6626-10.3613-10.3613-10.3613h-20.3042v-25.4688c0-5.8179-4.7601-10.5781-10.5781-10.5781h-47.6886c-5.8179 0-10.5781 4.7603-10.5781 10.5781v25.4688h-55.5546v-25.4688c0-5.8179-4.7601-10.5781-10.5781-10.5781h-47.6886c-5.8179 0-10.5781 4.7603-10.5781 10.5781v25.4688h-20.3042c-5.6987 0-10.3613 4.6631-10.3613 10.3613v48.1226c0 5.6987 4.6626 10.3608 10.3613 10.3608h20.3042v55.5547h-20.3042c-5.6987 0-10.3613 4.6626-10.3613 10.3613v48.1221c0 5.6987 4.6626 10.3613 10.3613 10.3613h20.3042v25.4692c0 5.8179 4.7601 10.5781 10.5781 10.5781h47.6886c5.8179 0 10.5781-4.7603 10.5781-10.5781v-25.4692h55.5546v25.4692c0 5.8179 4.7601 10.5781 10.5781 10.5781h47.6886c5.8179 0 10.5781-4.7603 10.5781-10.5781v-25.4692h20.3042c5.6987 0 10.3613-4.6626 10.3613-10.3613v-48.1221c0-5.6987-4.6626-10.3613-10.3613-10.3613h-20.3042v-55.5547zm-89.149 55.5547h-55.5546v-55.5547h55.5546z" fill="#3d6685"/>`,
].join('');

// Red diagonal slash line drawn across the keyboard (top-right → bottom-left)
const _NO_LINE = `<line x1="700" y1="140" x2="150" y2="710" stroke="#FF3B30" stroke-width="90" stroke-linecap="round"/>`;

function makeKeyboardIcon(forwarding) {
  const overlay = forwarding ? '' : _NO_LINE;
  return `<svg viewBox="0 0 850.3937 850.3937" width="22" height="22" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${_KB_PATHS}${overlay}</svg>`;
}

// ── Forwarding toggle ─────────────────────────────────────────────────────────

function toggleForward(hidId) {
  const chip = document.getElementById('sb-hid-' + hidId);
  if (!chip || chip.classList.contains('sb-disconnected')) return;
  if (window.electronAPI) {
    window.electronAPI.toggleForward(hidId);
  }
}

// ── State renderer ────────────────────────────────────────────────────────────

function setRecIcon(chip, connected) {
  const icon = chip.querySelector('.sb-icon');
  if (icon) icon.innerHTML = connected ? ICON_CONNECTED : ICON_DISCONNECTED;
}

function setHidIcon(chip, connected, forwarding) {
  const icon = chip.querySelector('.sb-icon');
  if (!icon) return;
  if (connected) {
    icon.innerHTML = makeKeyboardIcon(forwarding);
  } else {
    icon.innerHTML = ICON_DISCONNECTED;
  }
}

function updateServiceBar(state) {
  // ── REC ──
  const recChip = document.getElementById('sb-rec');
  if (recChip) {
    const on = state.rec && state.rec.connected;
    setRecIcon(recChip, on);
    recChip.classList.toggle('sb-rec-active', on);
  }

  // ── HID (combined peripheral on hci0) ──
  for (let i = 1; i <= 1; i++) {
    const hidState = (state.hid && state.hid[i]) || { connected: false, forwarding: false };
    const chip     = document.getElementById('sb-hid-' + i);
    if (!chip) continue;

    setHidIcon(chip, hidState.connected, hidState.forwarding);
    chip.classList.toggle('sb-fwd', hidState.connected && hidState.forwarding);
    chip.classList.toggle('sb-disconnected', !hidState.connected);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

function initServiceBar() {
  // REC icon: disconnected chain
  document.querySelectorAll('#sb-rec .sb-icon').forEach(el => {
    el.innerHTML = ICON_DISCONNECTED;
  });
  // HID chips: keyboard with red slash (disconnected / forwarding off)
  for (let i = 1; i <= 1; i++) {
    const chip = document.getElementById('sb-hid-' + i);
    if (chip) setHidIcon(chip, false, false);
  }

  if (!window.electronAPI) return;
  window.electronAPI.onServiceState(updateServiceBar);
}

document.addEventListener('DOMContentLoaded', initServiceBar);
