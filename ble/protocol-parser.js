'use strict';
// Ported from ally-keys/public/peripheral/script/keymap.js
// Parses the ally-keys wire format into an 8-byte HID keyboard report.
//
// Wire format examples:
//   h0x00E0/h0x00E2/0x001D/r  →  Ctrl+Alt+Z
//   /                          →  release all (all-zero report)
//   0x0028/r                   →  Enter
//
// Report layout:
//   byte 0  : modifier bitmask (Left Ctrl=bit0 … Right GUI=bit7)
//   byte 1  : reserved 0x00
//   bytes 2–7: up to 6 simultaneous key codes

/**
 * Parse a command string from the ally-keys wire protocol.
 * @param {string} str - raw command string received over REC
 * @returns {Buffer} 8-byte HID keyboard report (all zeros = key release)
 */
function parseKeycodeString(str) {
  const report = Buffer.alloc(8, 0);

  if (!str || str === '/') return report; // key-up / clear

  // Strip terminator and trailing separator
  const cleaned = str.replace(/r$/, '').replace(/\/$/, '');
  if (!cleaned) return report;

  const tokens = cleaned.split('/').filter(Boolean);
  let keycodeIndex = 2; // bytes 2–7 hold key codes

  for (const token of tokens) {
    const hold = token.startsWith('h');
    const hexStr = hold ? token.slice(1) : token;
    const code = parseInt(hexStr, 16);

    if (isNaN(code)) continue;

    if (code >= 0xE0 && code <= 0xE7) {
      // Modifier key – set the corresponding bit in byte 0
      report[0] |= (1 << (code - 0xE0));
    } else if (!hold && keycodeIndex < 8) {
      // Regular key code – up to 6 simultaneous keys
      report[keycodeIndex++] = code & 0xFF;
    }
  }

  return report;
}

module.exports = { parseKeycodeString };
