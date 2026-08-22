'use strict';
// BLE Manager — orchestrates 1 REC receiver + 4 HID keyboard workers.
// Each HID worker is a child process bound to a dedicated Bluetooth adapter.

const { EventEmitter } = require('events');
const { fork }         = require('child_process');
const path             = require('path');
const RecService       = require('./rec-service');

const HID_COUNT = 4;

class BleManager extends EventEmitter {
  constructor() {
    super();
    // Map of hidId (1–4) → { process, connected, forwarding }
    this._workers    = new Map();
    this._recService = null;
  }

  // ── Start all services ───────────────────────────────────────────────────────

  async start() {
    // REC on hci0 (built-in adapter)
    this._recService = new RecService(this);
    this._recService.start();

    // HID workers on hci1–hci4
    for (let i = 1; i <= HID_COUNT; i++) {
      this._spawnWorker(i);
    }
  }

  // ── Worker management ────────────────────────────────────────────────────────

  _spawnWorker(hidId) {
    const workerPath = path.join(__dirname, 'hid-worker.js');
    const child = fork(workerPath, [], {
      env: { ...process.env, BLENO_HCI_DEVICE_ID: String(hidId) }
    });

    const state = { process: child, connected: false, forwarding: false };
    this._workers.set(hidId, state);

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
      console.log(`[BleManager] HID ${hidId} worker exited (${code}), restarting in 2 s`);
      this._workers.delete(hidId);
      setTimeout(() => this._spawnWorker(hidId), 2000);
    });
  }

  // ── Key routing ──────────────────────────────────────────────────────────────

  handleKeycode(str) {
    this._workers.forEach((state, hidId) => {
      if (state.connected && state.forwarding) {
        state.process.send({ type: 'keycode', data: str });
      }
    });
  }

  // ── Forwarding toggle ────────────────────────────────────────────────────────

  toggleForward(hidId) {
    const state = this._workers.get(hidId);
    if (!state || !state.connected) return;
    state.forwarding = !state.forwarding;
    this._emitState();
  }

  // ── State broadcast ──────────────────────────────────────────────────────────

  _emitState() {
    const state = {
      rec: { connected: this._recService ? this._recService.connected : false },
      hid: {}
    };
    this._workers.forEach((workerState, hidId) => {
      state.hid[hidId] = {
        connected:  workerState.connected,
        forwarding: workerState.forwarding
      };
    });
    this.emit('service-state', state);
  }
}

module.exports = BleManager;
