'use strict';
// BLE Manager — combined peripheral on hci0.
// One bleno instance serves both the REC service and HID keyboard service.

const { EventEmitter } = require('events');
const BlePeripheral    = require('./ble-peripheral');

class BleManager extends EventEmitter {
  constructor() {
    super();
    this._peripheral = new BlePeripheral();
  }

  async start() {
    this._peripheral.on('keycode-received', (str) => this.emit('keycode-received', str));
    this._peripheral.on('state-changed', () => this._emitState());
    this._peripheral.start();
  }

  handleKeycode(str) {
    if (this._peripheral.hidConnected && this._peripheral.forwarding) {
      this._peripheral._sendKeycode(str);
    }
  }

  toggleForward(_hidId) {
    this._peripheral.toggleForwarding();
  }

  _emitState() {
    this.emit('service-state', {
      rec: { connected: this._peripheral.recConnected },
      hid: {
        1: {
          connected:  this._peripheral.hidConnected,
          forwarding: this._peripheral.forwarding,
        },
      },
    });
  }
}

module.exports = BleManager;
