'use strict';
// BLE Manager — combined peripheral on hci0 + USB HID workers on BTA-403 dongles.
//
// Slot layout:
//   Slot 1  hci0 (built-in BCM43455)  — BlePeripheral: REC + HID combined
//   Slot 2  hci? (first USB dongle)   — hid-worker:    AK-ANDROID
//   Slot 3  hci? (second USB dongle)  — hid-worker:    AK-IOS

const { EventEmitter } = require('events');
const { execSync }     = require('child_process');
const { fork }         = require('child_process');
const path             = require('path');
const BlePeripheral    = require('./ble-peripheral');

const HID_NAMES = ['AK-ANDROID', 'AK-IOS'];

// Discover USB BLE adapters at startup (all hci* except hci0 which is the built-in).
// Indices are not stable across Bluetooth service restarts, so we enumerate /sys.
function getUsbHciIds() {
  try {
    const out = execSync('ls /sys/class/bluetooth/ 2>/dev/null || true', { encoding: 'utf8' });
    return out.trim().split('\n')
      .map(s => s.trim())
      .filter(s => /^hci\d+$/.test(s))
      .map(s => parseInt(s.replace('hci', ''), 10))
      .filter(id => id !== 0)
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

class BleManager extends EventEmitter {
  constructor() {
    super();
    this._peripheral = new BlePeripheral();
    // slotIndex (2, 3…) → { hciId, name, process, connected, forwarding }
    this._workers = new Map();
  }

  async start() {
    // ── Slot 1: hci0 combined peripheral (REC + HID) ──────────────────────────
    this._peripheral.on('keycode-received', (str) => this.emit('keycode-received', str));
    this._peripheral.on('state-changed', () => this._emitState());
    this._peripheral.start();

    // ── Slots 2, 3: BTA-403 USB HID dongles (AK-ANDROID, AK-IOS) ─────────────
    const usbIds = getUsbHciIds();
    console.log('[BleManager] USB HID adapters:', usbIds.map(id => `hci${id}`).join(', ') || '(none)');
    usbIds.slice(0, HID_NAMES.length).forEach((hciId, idx) => {
      this._spawnWorker(idx + 2, hciId, HID_NAMES[idx]);
    });
  }

  // ── Worker lifecycle ─────────────────────────────────────────────────────────

  _spawnWorker(slotIndex, hciId, deviceName) {
    const workerPath = path.join(__dirname, 'hid-worker.js');
    // Each adapter must advertise with a unique random address.
    // All three bleno instances inherit BLENO_RANDOM_ADDRESS=C0:FF:AA:BB:CC:D1
    // from the parent (set in start.sh for hci0).  Without overriding it here,
    // all USB workers would broadcast the same address as hci0 — phones see
    // three advertisements from the same address and can only track one device.
    // Slot 2 → D2, slot 3 → D3 (distinct from hci0's D1).
    const randomAddr = `C0:FF:AA:BB:CC:D${slotIndex}`;
    const child = fork(workerPath, [], {
      env: { ...process.env, BLENO_HCI_DEVICE_ID: String(hciId), DEVICE_NAME: deviceName,
             BLENO_RANDOM_ADDRESS: randomAddr,
             // Override the parent's BLENO_DEVICE_NAME so bleno's built-in
             // Generic Access Device Name characteristic returns the worker's
             // own name (e.g. "AK-IOS") instead of "ALLY-KEYS-PI-TOP".
             BLENO_DEVICE_NAME: deviceName },
    });

    const state = { hciId, name: deviceName, process: child, connected: false, forwarding: false };
    this._workers.set(slotIndex, state);

    child.on('message', (msg) => {
      if (msg.type === 'connected') {
        state.connected = true;
        this._emitState();
      } else if (msg.type === 'disconnected') {
        state.connected  = false;
        state.forwarding = false;
        this._emitState();
      }
    });

    child.on('exit', (code) => {
      console.log(`[BleManager] slot${slotIndex} hci${hciId} (${deviceName}) exited (${code}), restarting in 2s`);
      this._workers.delete(slotIndex);
      setTimeout(() => this._spawnWorker(slotIndex, hciId, deviceName), 2000);
    });
  }

  // ── Key routing ──────────────────────────────────────────────────────────────

  handleKeycode(str) {
    // Slot 1: hci0 combined peripheral
    if (this._peripheral.hidConnected && this._peripheral.forwarding) {
      this._peripheral._sendKeycode(str);
    }
    // Slots 2+: USB HID workers
    this._workers.forEach((state) => {
      if (state.connected && state.forwarding) {
        state.process.send({ type: 'keycode', data: str });
      }
    });
  }

  // ── Forwarding toggle ────────────────────────────────────────────────────────

  toggleForward(slotIndex) {
    if (slotIndex === 1) {
      this._peripheral.toggleForwarding();
    } else {
      const state = this._workers.get(slotIndex);
      if (!state || !state.connected) return;
      state.forwarding = !state.forwarding;
      console.log(`[BleManager] slot${slotIndex} (${state.name}) forwarding: ${state.forwarding}`);
      this._emitState();
    }
  }

  // ── State broadcast ──────────────────────────────────────────────────────────

  _emitState() {
    const st = {
      rec: { connected: this._peripheral.recConnected },
      hid: {
        1: {
          connected:  this._peripheral.hidConnected,
          forwarding: this._peripheral.forwarding,
        },
      },
    };
    this._workers.forEach((workerState, slotIndex) => {
      st.hid[slotIndex] = {
        connected:  workerState.connected,
        forwarding: workerState.forwarding,
      };
    });
    this.emit('service-state', st);
  }
}

module.exports = BleManager;
