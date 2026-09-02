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
