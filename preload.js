'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Send a keycode command string to BLE (same format as ally-keys wire protocol)
  sendKeycode: (str) => ipcRenderer.invoke('send-keycode', str),

  // Toggle forwarding for a given HID service (1–4)
  toggleForward: (hidId) => ipcRenderer.invoke('toggle-forward', hidId),

  // Subscribe to service state updates from the main process
  onServiceState: (callback) => {
    ipcRenderer.on('service-state', (_event, state) => callback(state));
  },

  // Subscribe to incoming keycode strings from the REC BLE service
  onKeycodeReceived: (callback) => {
    ipcRenderer.on('keycode-received', (_event, str) => callback(str));
  },

  // Restart the BLE stack (cycles hci0 down/up so bleno re-advertises)
  restartBle: () => ipcRenderer.invoke('restart-ble'),

  // Shut down the Raspberry Pi
  shutdown: () => ipcRenderer.invoke('shutdown'),
});
