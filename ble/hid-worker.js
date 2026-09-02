'use strict';
// HID Worker — runs as a child process, one per Bluetooth adapter.
// Implements HID over GATT Profile (HOGP) for keyboard emulation.
// Adapter is selected via BLENO_HCI_DEVICE_ID env var (1, 2, 3, or 4).

const bleno = require('@abandonware/bleno');
const { HID_DESCRIPTOR } = require('./hid-descriptor');
const { parseKeycodeString } = require('./protocol-parser');

const hidId = parseInt(process.env.BLENO_HCI_DEVICE_ID || '1', 10);
const DEVICE_NAME = process.env.DEVICE_NAME || `AK-HID-${hidId}`;
const HID_SERVICE_UUID    = '1812';
const BATTERY_SERVICE_UUID = '180f';

// ── Characteristics ──────────────────────────────────────────────────────────

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
  constructor() {
    super({
      uuid: '2a4d',
      properties: ['read', 'notify'],
      descriptors: [
        new bleno.Descriptor({ uuid: '2902', value: Buffer.alloc(2) }),
        // Report Reference: Report ID = 0, Report Type = Input (1)
        new bleno.Descriptor({ uuid: '2908', value: Buffer.from([0x00, 0x01]) })
      ]
    });
    this._notify = null;
    this._value = Buffer.alloc(8);
  }

  onReadRequest(offset, callback) {
    callback(this.RESULT_SUCCESS, this._value.slice(offset));
  }

  onSubscribe(_maxSize, updateValueCallback) {
    this._notify = updateValueCallback;
  }

  onUnsubscribe() {
    this._notify = null;
  }

  sendReport(buf) {
    this._value = buf;
    if (this._notify) this._notify(buf);
  }
}

class BatteryLevelCharacteristic extends bleno.Characteristic {
  constructor() {
    super({ uuid: '2a19', properties: ['read', 'notify'] });
  }
  onReadRequest(_offset, callback) {
    callback(this.RESULT_SUCCESS, Buffer.from([0x64])); // 100 %
  }
}

// ── Services ─────────────────────────────────────────────────────────────────

const inputReport = new InputReportCharacteristic();

const hidService = new bleno.PrimaryService({
  uuid: HID_SERVICE_UUID,
  characteristics: [
    new HidInformationCharacteristic(),
    new HidControlPointCharacteristic(),
    new ReportMapCharacteristic(),
    inputReport,
  ],
});

const batteryService = new bleno.PrimaryService({
  uuid: BATTERY_SERVICE_UUID,
  characteristics: [new BatteryLevelCharacteristic()],
});

// ── BLE lifecycle ─────────────────────────────────────────────────────────────

function advertise() {
  // Build an EIR advertisement that includes Appearance=keyboard (0x03C1) so
  // phones classify the device as a keyboard rather than a generic accessory.
  const nameBytes = Buffer.from(DEVICE_NAME, 'utf8');
  const advData = Buffer.concat([
    Buffer.from([
      // AD: Flags — LE General Discoverable | BR/EDR Not Supported
      0x02, 0x01, 0x06,
      // AD: Complete list of 16-bit UUIDs — HID (0x1812 little-endian)
      0x03, 0x03, 0x12, 0x18,
      // AD: Appearance — Keyboard (0x03C1 little-endian)
      0x03, 0x19, 0xC1, 0x03,
      // AD: Complete Local Name
      nameBytes.length + 1, 0x09,
    ]),
    nameBytes,
  ]);
  bleno.startAdvertisingWithEIRData(advData, Buffer.alloc(0), (err) => {
    if (err) console.error(`[${DEVICE_NAME}] advertise error:`, err);
  });
}

bleno.on('stateChange', (state) => {
  console.log(`[${DEVICE_NAME}] BLE state: ${state}`);
  if (state === 'poweredOn') {
    advertise();
  } else {
    bleno.stopAdvertising();
  }
});

bleno.on('advertisingStart', (err) => {
  if (err) { console.error(`[${DEVICE_NAME}] advertisingStart error:`, err); return; }
  console.log(`[${DEVICE_NAME}] advertising`);
  bleno.setServices([hidService, batteryService]);
});

bleno.on('accept', (address) => {
  console.log(`[${DEVICE_NAME}] connected: ${address}`);
  process.send({ type: 'connected', hidId, address });
});

bleno.on('disconnect', (address) => {
  console.log(`[${DEVICE_NAME}] disconnected: ${address}`);
  process.send({ type: 'disconnected', hidId, address });
  // Re-advertise so the device is discoverable again
  advertise();
});

// ── IPC from parent ───────────────────────────────────────────────────────────

const KEY_UP = Buffer.alloc(8); // all zeros = release all keys

process.on('message', (msg) => {
  if (msg.type !== 'keycode') return;

  const report = parseKeycodeString(msg.data);
  inputReport.sendReport(report);

  // Send key-up after a short hold to register the key press on the host
  setTimeout(() => {
    inputReport.sendReport(KEY_UP);
  }, 30);
});

process.on('uncaughtException', (err) => {
  console.error(`[${DEVICE_NAME}] uncaught:`, err);
});
