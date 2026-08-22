// key-toast.js — stacking key-combination overlay received over REC BLE.
// Each incoming keycode spawns its own independent toast element that:
//   - appears centred on screen immediately
//   - holds for 200 ms
//   - slides left + fades over 400 ms
//   - removes itself from the DOM when done
//
// Layout: one square per toast — main key large in the centre,
//         modifier keys (Ctrl / Shift / Alt / ⌘) small inside at the top.

'use strict';

// ── HID hex → human display name ─────────────────────────────────────────────

const HID_NAMES = {
  // Modifiers
  0xE0: 'Ctrl',  0xE4: 'Ctrl',
  0xE1: 'Shift', 0xE5: 'Shift',
  0xE2: 'Alt',   0xE6: 'Alt',
  0xE3: '⌘',     0xE7: '⌘',
  // Letters a–z
  0x04: 'A', 0x05: 'B', 0x06: 'C', 0x07: 'D', 0x08: 'E', 0x09: 'F',
  0x0A: 'G', 0x0B: 'H', 0x0C: 'I', 0x0D: 'J', 0x0E: 'K', 0x0F: 'L',
  0x10: 'M', 0x11: 'N', 0x12: 'O', 0x13: 'P', 0x14: 'Q', 0x15: 'R',
  0x16: 'S', 0x17: 'T', 0x18: 'U', 0x19: 'V', 0x1A: 'W', 0x1B: 'X',
  0x1C: 'Y', 0x1D: 'Z',
  // Digits
  0x1E: '1', 0x1F: '2', 0x20: '3', 0x21: '4', 0x22: '5',
  0x23: '6', 0x24: '7', 0x25: '8', 0x26: '9', 0x27: '0',
  // Special keys
  0x28: '↵',
  0x29: 'Esc',
  0x2A: '⌫',
  0x2B: 'Tab',
  0x2C: '␣',
  0x2D: '−',
  0x2E: '=',
  0x2F: '[', 0x30: ']', 0x31: '\\',
  0x33: ';', 0x34: "'", 0x35: '`',
  0x36: ',', 0x37: '.', 0x38: '/',
  0x39: 'Caps',
  // F-keys
  0x3A: 'F1',  0x3B: 'F2',  0x3C: 'F3',  0x3D: 'F4',
  0x3E: 'F5',  0x3F: 'F6',  0x40: 'F7',  0x41: 'F8',
  0x42: 'F9',  0x43: 'F10', 0x44: 'F11', 0x45: 'F12',
  0x68: 'F13', 0x69: 'F14', 0x6A: 'F15',
  // Navigation
  0x46: 'PrtSc', 0x47: 'ScrLk', 0x48: 'Pause',
  0x49: 'Ins',  0x4A: 'Home', 0x4B: 'PgUp',
  0x4C: 'Del',  0x4D: 'End',  0x4E: 'PgDn',
  0x4F: '→', 0x50: '←', 0x51: '↓', 0x52: '↑',
  // Media
  0x7F: 'Mute', 0x80: 'Vol+', 0x81: 'Vol−',
};

const MODIFIER_CODES = new Set([0xE0, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6, 0xE7]);

// ── Wire format parser ────────────────────────────────────────────────────────
// Returns { modifiers: string[], keys: string[] }
// Empty both arrays → release / no display

function parseToNames(str) {
  if (!str || str.trim() === '') return { modifiers: [], keys: [] };

  // Strip trailing release signal
  const cleaned = str.replace(/\/r$/, '').replace(/r$/, '').replace(/\/$/, '').trim();
  if (!cleaned) return { modifiers: [], keys: [] };

  const modifiers = [];
  const keys      = [];

  for (const token of cleaned.split('/').filter(Boolean)) {
    if (token === 'r') continue;
    const hold = token.startsWith('h');
    const hex  = hold ? token.slice(1) : token;
    const code = parseInt(hex, 16);
    if (isNaN(code) || code === 0) continue;
    if (!HID_NAMES[code]) continue;          // skip unknown codes
    const name = HID_NAMES[code];

    if (MODIFIER_CODES.has(code)) {
      if (!modifiers.includes(name)) modifiers.push(name);
    } else {
      if (!keys.includes(name)) keys.push(name);
    }
  }

  return { modifiers, keys };
}

// ── Toast factory ─────────────────────────────────────────────────────────────

const HOLD_MS = 200;
const EXIT_MS = 400;

function getContainer() {
  return document.getElementById('key-toast-container');
}

function showToast({ modifiers, keys }) {
  const container = getContainer();
  if (!container) return;

  // When only modifiers arrived (no plain key yet), show nothing —
  // wait for the key that completes the combination.
  // Exception: lone modifier press (no other keys ever come) — show it.
  // We use a short debounce: if a key follows within 50 ms the modifier
  // toast is replaced. For simplicity, just show everything that arrives.
  const mainKeys = keys.length > 0 ? keys : modifiers;
  const topMods  = keys.length > 0 ? modifiers : [];

  const el = document.createElement('div');
  el.className = 'kt-item';

  const modHtml = topMods.length
    ? `<div class="kt-mods">${topMods.map(m => `<span class="kt-mod">${m}</span>`).join('')}</div>`
    : '';

  const keyHtml = `<div class="kt-main">${
    mainKeys.map(k => `<span class="kt-key">${k}</span>`).join('')
  }</div>`;

  el.innerHTML = modHtml + keyHtml;
  container.appendChild(el);  // later in DOM = higher stacking = on top

  // Force reflow so the initial state is painted before the exit class lands
  void el.offsetWidth;

  setTimeout(() => {
    el.classList.add('kt-exit');
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, EXIT_MS);
  }, HOLD_MS);
}

// ── Initialisation ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  if (!window.electronAPI || !window.electronAPI.onKeycodeReceived) return;

  window.electronAPI.onKeycodeReceived((str) => {
    const parsed = parseToNames(str);
    if (parsed.modifiers.length > 0 || parsed.keys.length > 0) {
      showToast(parsed);
    }
  });
});
