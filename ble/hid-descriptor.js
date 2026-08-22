'use strict';

// Standard USB HID keyboard report descriptor.
// Report format (8 bytes):
//   [0] modifier bitmask  (Ctrl/Shift/Alt/GUI × left/right)
//   [1] reserved (0x00)
//   [2..7] up to 6 simultaneous key codes
const HID_DESCRIPTOR = Buffer.from([
  0x05, 0x01,  // Usage Page (Generic Desktop Controls)
  0x09, 0x06,  // Usage (Keyboard)
  0xA1, 0x01,  // Collection (Application)

  // --- Modifier keys: 8 × 1-bit ---
  0x05, 0x07,  // Usage Page (Keyboard/Keypad)
  0x19, 0xE0,  // Usage Minimum (Left Control  = 0xE0)
  0x29, 0xE7,  // Usage Maximum (Right GUI     = 0xE7)
  0x15, 0x00,  // Logical Minimum (0)
  0x25, 0x01,  // Logical Maximum (1)
  0x75, 0x01,  // Report Size (1 bit)
  0x95, 0x08,  // Report Count (8)
  0x81, 0x02,  // Input (Data, Variable, Absolute)

  // --- Reserved byte ---
  0x95, 0x01,  // Report Count (1)
  0x75, 0x08,  // Report Size (8 bits)
  0x81, 0x01,  // Input (Constant)

  // --- LED output: 5 bits + 3 padding ---
  0x95, 0x05,  // Report Count (5)
  0x75, 0x01,  // Report Size (1 bit)
  0x05, 0x08,  // Usage Page (LEDs)
  0x19, 0x01,  // Usage Minimum (Num Lock)
  0x29, 0x05,  // Usage Maximum (Kana)
  0x91, 0x02,  // Output (Data, Variable, Absolute)
  0x95, 0x01,  // Report Count (1)
  0x75, 0x03,  // Report Size (3 bits, padding)
  0x91, 0x01,  // Output (Constant)

  // --- Key codes: 6 × 8-bit ---
  0x95, 0x06,  // Report Count (6)
  0x75, 0x08,  // Report Size (8 bits)
  0x15, 0x00,  // Logical Minimum (0)
  0x25, 0x65,  // Logical Maximum (101)
  0x05, 0x07,  // Usage Page (Keyboard/Keypad)
  0x19, 0x00,  // Usage Minimum (0)
  0x29, 0x65,  // Usage Maximum (101)
  0x81, 0x00,  // Input (Data, Array, Absolute)

  0xC0,        // End Collection
]);

module.exports = { HID_DESCRIPTOR };
