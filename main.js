'use strict';
const { app, BrowserWindow, ipcMain } = require('electron');
const { exec } = require('child_process');
const path       = require('path');
const BleManager = require('./ble/ble-manager');

const IS_DEV = process.argv.includes('--dev');

let mainWindow;
let bleManager;

// ── Window ────────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width:      1280,
    height:     800,
    fullscreen: !IS_DEV,
    kiosk:      !IS_DEV,
    frame:      IS_DEV,
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  if (IS_DEV) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── BLE ───────────────────────────────────────────────────────────────────────

async function startBle() {
  bleManager = new BleManager();

  bleManager.on('service-state', (state) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('service-state', state);
    }
  });

  bleManager.on('keycode-received', (str) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('keycode-received', str);
    }
  });

  try {
    await bleManager.start();
  } catch (err) {
    console.error('[main] BLE start error:', err);
  }
}

// ── IPC handlers ──────────────────────────────────────────────────────────────

ipcMain.handle('send-keycode', (_event, str) => {
  bleManager && bleManager.handleKeycode(str);
});

ipcMain.handle('toggle-forward', (_event, hidId) => {
  bleManager && bleManager.toggleForward(hidId);
});

ipcMain.handle('restart-ble', () => {
  return new Promise((resolve) => {
    console.log('[main] restarting BLE — cycling hci0 down/up…');
    // hciconfig down forces bleno to fire stateChange: poweredOff, then
    // hciconfig up fires stateChange: poweredOn which triggers _advertise().
    exec('sudo hciconfig hci0 down && sleep 0.5 && sudo hciconfig hci0 up', (err) => {
      if (err) {
        console.error('[main] restart-ble error:', err.message);
        resolve({ ok: false, error: err.message });
      } else {
        console.log('[main] hci0 cycled — bleno will re-advertise');
        resolve({ ok: true });
      }
    });
  });
});

ipcMain.handle('shutdown', () => {
  exec('sudo poweroff', (err) => {
    if (err) console.error('[main] shutdown error:', err);
  });
});

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();
  startBle();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
