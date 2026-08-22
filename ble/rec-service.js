'use strict';
// REC Service — Nordic UART Service (NUS) GATT peripheral on hci0.
// ally-keys.com connects here via Web Bluetooth and sends keycode command strings.
// REC parses them and dispatches to the BLE manager for routing to HID workers.

const bleno = require('@abandonware/bleno');

// NUS UUIDs (well-known, supported by Web Bluetooth)
const NUS_SERVICE_UUID = '6e400001b5a3f393e0a9e50e24dcca9e';
const NUS_TX_UUID      = '6e400003b5a3f393e0a9e50e24dcca9e'; // Pi → browser (notify)
const NUS_RX_UUID      = '6e400002b5a3f393e0a9e50e24dcca9e'; // browser → Pi (write)

const VERSION_STRING = 'AK-PI-1.0.6'; // ends in ".6" so ally-keys.com uses 6-char hex mode

// ── TX characteristic (Pi notifies browser) ───────────────────────────────────

class TxCharacteristic extends bleno.Characteristic {
  constructor() {
    super({
      uuid: NUS_TX_UUID,
      properties: ['notify'],
      descriptors: [
        new bleno.Descriptor({ uuid: '2902', value: Buffer.alloc(2) })
      ]
    });
    this._notify = null;
  }

  onSubscribe(_maxSize, updateValueCallback) {
    this._notify = updateValueCallback;
  }

  onUnsubscribe() {
    this._notify = null;
  }

  send(str) {
    if (this._notify) {
      this._notify(Buffer.from(str, 'utf8'));
    }
  }
}

// ── RX characteristic (browser writes to Pi) ──────────────────────────────────

class RxCharacteristic extends bleno.Characteristic {
  constructor(onData) {
    super({
      uuid: NUS_RX_UUID,
      properties: ['write', 'writeWithoutResponse']
    });
    this._onData = onData;
  }

  onWriteRequest(data, _offset, _withoutResponse, callback) {
    this._onData(data.toString('utf8'));
    callback(this.RESULT_SUCCESS);
  }
}

// ── RecService ────────────────────────────────────────────────────────────────

class RecService {
  constructor(manager) {
    this.manager  = manager;
    this.connected = false;
    this._tx = new TxCharacteristic();
    this._rx = new RxCharacteristic((str) => this._onData(str));
  }

  start() {
    bleno.on('stateChange', (state) => {
      console.log('[REC] BLE state:', state);
      if (state === 'poweredOn') {
        bleno.startAdvertising('ally-keys-REC', [NUS_SERVICE_UUID]);
      }
    });

    bleno.on('advertisingStart', (err) => {
      if (err) { console.error('[REC] advertisingStart error:', err); return; }
      console.log('[REC] advertising');
      bleno.setServices([
        new bleno.PrimaryService({
          uuid: NUS_SERVICE_UUID,
          characteristics: [this._tx, this._rx]
        })
      ]);
    });

    bleno.on('accept', (address) => {
      console.log('[REC] connected:', address);
      this.connected = true;
      this.manager._emitState();
    });

    bleno.on('disconnect', (address) => {
      console.log('[REC] disconnected:', address);
      this.connected = false;
      this.manager._emitState();
    });
  }

  _onData(str) {
    str = str.trim();

    // Version probe — reply so ally-keys.com knows buffer size
    if (str === 'v') {
      this._tx.send(VERSION_STRING);
      return;
    }

    // Forward keycode command to the BLE manager
    this.manager.handleKeycode(str);
  }
}

module.exports = RecService;
