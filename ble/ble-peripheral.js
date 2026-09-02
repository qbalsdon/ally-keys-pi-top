'use strict';
// Combined BLE peripheral on hci0.
//
// One bleno instance serves TWO GATT services simultaneously:
//   - Custom REC service  → ally-keys.com connects here via Web Bluetooth
//   - HID keyboard service → phone/Mac/tablet connects here as a BLE keyboard
//
// Both centrals can be connected at the same time (Pi 4 BCM43455 supports
// multiple LE connections in peripheral mode).

// Pin to hci0 (built-in BCM43455) before bleno reads the env var at require-time.
// Without this, bleno enumerates adapters and may pick a USB dongle (hci2/hci3).
if (!process.env.BLENO_HCI_DEVICE_ID) process.env.BLENO_HCI_DEVICE_ID = '0';
const bleno        = require('@abandonware/bleno');
const { EventEmitter } = require('events');
const { HID_DESCRIPTOR }       = require('./hid-descriptor');
const { parseKeycodeString }   = require('./protocol-parser');

// ── UUIDs ─────────────────────────────────────────────────────────────────────

const REC_SERVICE_UUID     = 'a1b2c3d4e5f67890abcdef1234567890';
const REC_CHAR_UUID        = 'a1b2c3d4e5f67890abcdef1234567891';
const HID_SERVICE_UUID     = '1812';
const BATT_SERVICE_UUID    = '180f';

const DEVICE_NAME = 'ALLY-KEYS-PI-TOP';

// ── REC characteristic ────────────────────────────────────────────────────────
// ally-keys.com writes keycode strings here.

class RecCharacteristic extends bleno.Characteristic {
  constructor(onData) {
    super({
      uuid: REC_CHAR_UUID,
      properties: ['write', 'writeWithoutResponse'],
    });
    this._onData = onData;
  }

  onWriteRequest(data, _offset, _withoutResponse, callback) {
    const str = data.toString('utf8').trim();
    if (str) this._onData(str);
    callback(this.RESULT_SUCCESS);
  }
}

// ── HID characteristics ───────────────────────────────────────────────────────

class HidInformationCharacteristic extends bleno.Characteristic {
  constructor() {
    super({ uuid: '2a4a', properties: ['read'] });
  }
  onReadRequest(_offset, callback) {
    // bcdHID 1.11, country 0, flags: RemoteWake + NormallyConnectable
    callback(this.RESULT_SUCCESS, Buffer.from([0x11, 0x01, 0x00, 0x03]));
  }
}

class HidControlPointCharacteristic extends bleno.Characteristic {
  constructor() {
    super({ uuid: '2a4c', properties: ['writeWithoutResponse'] });
  }
  onWriteRequest(_data, _offset, _withoutResponse, callback) {
    callback(this.RESULT_SUCCESS);
  }
}

class ReportMapCharacteristic extends bleno.Characteristic {
  constructor() {
    super({ uuid: '2a4b', properties: ['read'] });
  }
  onReadRequest(offset, callback) {
    callback(this.RESULT_SUCCESS, HID_DESCRIPTOR.slice(offset));
  }
}

class InputReportCharacteristic extends bleno.Characteristic {
  constructor(onHidConnect, onHidDisconnect) {
    super({
      uuid: '2a4d',
      properties: ['read', 'notify'],
      // NOTE: Do NOT declare explicit descriptors here.
      // bleno manages the CCCD (0x2902) internally — declaring it explicitly
      // causes Chrome's Web Bluetooth (via CoreBluetooth) to crash when it
      // calls discoverDescriptorsForCharacteristic: on the characteristic.
      // The Report Reference (0x2908) is similarly not needed for iOS/Android.
    });
    this._notify         = null;
    this._value          = Buffer.alloc(8);
    this._onHidConnect   = onHidConnect;
    this._onHidDisconnect = onHidDisconnect;
  }

  onReadRequest(offset, callback) {
    callback(this.RESULT_SUCCESS, this._value.slice(offset));
  }

  onSubscribe(_maxSize, updateValueCallback) {
    this._notify = updateValueCallback;
    // Send an all-zeros report immediately to clear any stale key state on the host
    updateValueCallback(Buffer.alloc(8));
    this._onHidConnect();
  }

  onUnsubscribe() {
    this._notify = null;
    this._onHidDisconnect();
  }

  sendReport(buf) {
    this._value = buf;
    if (this._notify) this._notify(buf);
  }
}

// NOTE: bleno automatically prepends its own Generic Access service (0x1800)
// with Device Name (0x2A00) and Appearance (0x2A01) to the GATT table.
// The name comes from process.env.BLENO_DEVICE_NAME || os.hostname().
// We set BLENO_DEVICE_NAME in start.sh so the built-in name is correct.
// Appearance is patched in gatt.js to 0x03C1 (Keyboard).
// Do NOT add a custom 0x1800 service — bleno only allows one.

class BatteryLevelCharacteristic extends bleno.Characteristic {
  constructor() {
    super({ uuid: '2a19', properties: ['read', 'notify'] });
  }
  onReadRequest(_offset, callback) {
    callback(this.RESULT_SUCCESS, Buffer.from([0x64])); // 100%
  }
}

// ── Combined peripheral ───────────────────────────────────────────────────────

class BlePeripheral extends EventEmitter {
  constructor() {
    super();
    this.recConnected  = false;
    this.hidConnected  = false;
    this._forwarding   = false;
    this._inputReport  = null;
    this._centralCount = 0;  // track simultaneous connections
  }

  get forwarding() { return this._forwarding; }

  toggleForwarding() {
    if (!this.hidConnected) return;
    this._forwarding = !this._forwarding;
    console.log('[BLE] forwarding:', this._forwarding);
    this.emit('state-changed');
  }

  start() {
    this._inputReport = new InputReportCharacteristic(
      () => {
        // HID host subscribed to input report → it's a keyboard client
        console.log('[BLE] HID host connected (subscribed to input report)');
        this.hidConnected = true;
        this.emit('state-changed');
      },
      () => {
        console.log('[BLE] HID host disconnected');
        this.hidConnected = false;
        this._forwarding  = false;
        this.emit('state-changed');
      }
    );

    const recChar = new RecCharacteristic((str) => {
      this.emit('keycode-received', str);
      if (this.hidConnected && this._forwarding) {
        this._sendKeycode(str);
      }
    });

    const recService = new bleno.PrimaryService({
      uuid: REC_SERVICE_UUID,
      characteristics: [recChar],
    });

    const hidService = new bleno.PrimaryService({
      uuid: HID_SERVICE_UUID,
      characteristics: [
        new HidInformationCharacteristic(),
        new HidControlPointCharacteristic(),
        new ReportMapCharacteristic(),
        this._inputReport,
      ],
    });

    const battService = new bleno.PrimaryService({
      uuid: BATT_SERVICE_UUID,
      characteristics: [new BatteryLevelCharacteristic()],
    });

    bleno.on('stateChange', (state) => {
      console.log('[BLE] state:', state);
      if (state === 'poweredOn') {
        this._advertise();
      } else {
        bleno.stopAdvertising();
      }
    });

    let _servicesSet = false;
    bleno.on('advertisingStart', (err) => {
      if (err) { console.error('[BLE] advertisingStart error:', err); return; }
      console.log('[BLE] advertising as', DEVICE_NAME,
                  `(connections: ${this._centralCount})`);
      // setServices only needs to happen once; calling it again resets GATT
      // which can drop active connections, so guard it.
      if (!_servicesSet) {
        // bleno automatically adds Generic Access (0x1800) and Generic Attribute (0x1801).
        // We only register our custom services on top of those.
        bleno.setServices([recService, hidService, battService]);
        _servicesSet = true;
      }
    });

    bleno.on('accept', (address) => {
      this._centralCount++;
      console.log('[BLE] central connected:', address, `(total: ${this._centralCount})`);
      this.recConnected = true;
      this.emit('state-changed');
      // Re-advertise so a second central (phone or Web Bluetooth) can still
      // find and connect while the first one is already connected.
      setTimeout(() => this._advertise(), 300);
    });

    bleno.on('disconnect', (address) => {
      this._centralCount = Math.max(0, this._centralCount - 1);
      console.log('[BLE] central disconnected:', address, `(remaining: ${this._centralCount})`);
      if (this._centralCount === 0) {
        this.recConnected = false;
        this.emit('state-changed');
      }
      // Always re-advertise after a disconnect so new centrals can find us
      setTimeout(() => this._advertise(), 500);
    });
  }

  _advertise() {
    // Use raw EIR data to control exactly what goes in ADV_IND vs SCAN_RSP.
    //
    // iOS uses PASSIVE scanning — only sees the 31-byte ADV_IND packet.
    // Android / Chrome use ACTIVE scanning — also receive the 31-byte SCAN_RSP.
    //
    // ADV_IND (31 bytes max — seen by ALL scanners including iOS):
    //   Flags + HID UUID (0x1812) + Appearance (keyboard)
    //
    // SCAN_RSP (31 bytes max — seen by Chrome/Android active scan):
    //   Shortened name + 128-bit REC UUID
    //   Budget: 128-bit UUID = 18 bytes → name headroom = 31-18 = 13 bytes
    //   → 11 chars of name (+ 2 bytes overhead) exactly fills remaining space.

    // ADV_IND: flags(3) + 16-bit UUID(4) + appearance(4) + name(2+16) = 29 bytes ✓
    const nameBytes = Buffer.from(DEVICE_NAME, 'utf8'); // "ALLY-KEYS-PI-TOP" = 16 chars
    const advData   = Buffer.concat([
      Buffer.from([
        // AD: Flags — LE General Discoverable | BR/EDR Not Supported
        0x02, 0x01, 0x06,
        // AD: Complete list of 16-bit UUIDs — HID (0x1812 little-endian)
        0x03, 0x03, 0x12, 0x18,
        // AD: Appearance — Keyboard (0x03C1 little-endian)
        0x03, 0x19, 0xC1, 0x03,
        // AD: Complete Local Name (iOS needs a name to display the device)
        nameBytes.length + 1, 0x09,
      ]),
      nameBytes,
    ]);

    // REC UUID as 16 bytes little-endian
    const recUuidLE = Buffer.from(REC_SERVICE_UUID, 'hex').reverse();

    // Shortened name — must be ≤11 chars so total SCAN_RSP ≤31 bytes
    // (18 bytes for 128-bit UUID record + 13 bytes for name record)
    const shortName  = Buffer.from('AK-PI-TOP', 'utf8'); // 9 chars = 11 bytes → 29 total ✓
    const scanRsp    = Buffer.concat([
      // AD: Shortened Local Name (0x08)
      Buffer.from([shortName.length + 1, 0x08]),
      shortName,
      // AD: Complete list of 128-bit UUIDs — REC service
      Buffer.from([recUuidLE.length + 1, 0x07]),
      recUuidLE,
    ]);

    console.log('[BLE] adv packet:', advData.length, 'bytes  scan_rsp:', scanRsp.length, 'bytes');

    bleno.startAdvertisingWithEIRData(advData, scanRsp, (err) => {
      if (err) {
        console.error('[BLE] startAdvertisingWithEIRData error:', err);
        // Fall back to simple advertising if EIR fails
        bleno.startAdvertising(DEVICE_NAME, [HID_SERVICE_UUID, REC_SERVICE_UUID], (e) => {
          if (e) console.error('[BLE] fallback advertise error:', e);
          else   console.log('[BLE] advertising (fallback) as', DEVICE_NAME);
        });
      }
    });
  }

  _sendKeycode(str) {
    if (!this._inputReport) return;
    const report = parseKeycodeString(str);
    this._inputReport.sendReport(report);
    // Key-up after 30 ms to register the press on the host
    setTimeout(() => {
      if (this._inputReport) this._inputReport.sendReport(Buffer.alloc(8));
    }, 30);
  }
}

module.exports = BlePeripheral;
