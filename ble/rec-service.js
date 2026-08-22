'use strict';
// REC Service — custom GATT peripheral on hci0.
// ally-keys.com/go connects via Web Bluetooth filtering on REC_SERVICE_UUID,
// then writes keycode strings to REC_KEY_CHAR_UUID.
//
// UUIDs match the reference implementation (ally-keys-stick-s3):
//   Service:        a1b2c3d4-e5f6-7890-abcd-ef1234567890
//   Key char (W):   a1b2c3d4-e5f6-7890-abcd-ef1234567891

const bleno = require('@abandonware/bleno');

// No dashes — bleno's canonical format
const REC_SERVICE_UUID  = 'a1b2c3d4e5f67890abcdef1234567890';
const REC_KEY_CHAR_UUID = 'a1b2c3d4e5f67890abcdef1234567891';

const DEVICE_NAME = 'ALLY-KEYS-PI-TOP';

// ── Key-input characteristic (browser writes keycode strings to Pi) ───────────

class KeyCharacteristic extends bleno.Characteristic {
  constructor(onData) {
    super({
      uuid:       REC_KEY_CHAR_UUID,
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

// ── RecService ────────────────────────────────────────────────────────────────

class RecService {
  constructor(manager) {
    this.manager   = manager;
    this.connected = false;
    this._keyChar  = new KeyCharacteristic((str) => this._onData(str));
  }

  start() {
    bleno.on('stateChange', (state) => {
      console.log('[REC] BLE state:', state);
      if (state === 'poweredOn') {
        bleno.startAdvertising(DEVICE_NAME, [REC_SERVICE_UUID]);
      }
    });

    bleno.on('advertisingStart', (err) => {
      if (err) { console.error('[REC] advertisingStart error:', err); return; }
      console.log('[REC] advertising as', DEVICE_NAME);
      bleno.setServices([
        new bleno.PrimaryService({
          uuid:            REC_SERVICE_UUID,
          characteristics: [this._keyChar],
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
      // Re-advertise so the page can reconnect
      bleno.startAdvertising(DEVICE_NAME, [REC_SERVICE_UUID]);
    });
  }

  _onData(str) {
    console.log('[REC] keycode:', str);
    // Fire toast ONLY for BLE REC data — not for local UI key clicks
    this.manager.emit('keycode-received', str);
    this.manager.handleKeycode(str);
  }
}

module.exports = RecService;
