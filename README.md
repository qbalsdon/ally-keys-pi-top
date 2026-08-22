# ally-keys-pi-top

Electron app for Raspberry Pi 4B that bridges [ally-keys.com](https://ally-keys.com) to up to 4 Bluetooth accessibility devices simultaneously.

## What this is

A kiosk-mode Electron app that runs on a Raspberry Pi 4B and hosts **5 BLE services**:

| Service | Adapter | Role |
|---------|---------|------|
| **REC** | `hci0` (built-in) | Receiver — ally-keys.com connects here via Web Bluetooth and sends keycode commands |
| **HID 1** | `hci1` (USB dongle) | BLE HID keyboard paired to phone/tablet 1 |
| **HID 2** | `hci2` (USB dongle) | BLE HID keyboard paired to phone/tablet 2 |
| **HID 3** | `hci3` (USB dongle) | BLE HID keyboard paired to phone/tablet 3 |
| **HID 4** | `hci4` (USB dongle) | BLE HID keyboard paired to phone/tablet 4 |

The UI is the existing ally-keys peripheral page running inside Electron, with a **service bar** pinned at the top showing all 5 BLE connection states. Tapping a connected HID chip toggles whether keypresses are forwarded to that device.

## Hardware

- Raspberry Pi 4B (`pi-desk@192.168.1.109`)
- 3–4 × USB Bluetooth 5.0 dongles (CSR8510 chipset recommended)
- HDMI display or DSI touchscreen

## Docs

- [`docs/plan.html`](docs/plan.html) — full implementation plan (open in browser)

## Project structure (planned)

```
ally-keys-pi-top/
├── docs/
│   └── plan.html           # Implementation plan
├── ble/
│   ├── ble-manager.js      # Orchestrates all 5 BLE services
│   ├── rec-service.js      # NUS GATT receiver on hci0
│   ├── hid-worker.js       # HOGP keyboard worker (run ×4)
│   ├── hid-descriptor.js   # USB keyboard HID descriptor
│   └── protocol-parser.js  # Ported from ally-keys keymap.js
├── renderer/
│   ├── index.html          # Ported peripheral page
│   ├── style/
│   │   └── service-bar.css
│   └── script/
│       ├── ipc-bridge.js   # Replaces Web Serial with IPC
│       └── service-bar.js  # 5-chip status bar
├── main.js                 # Electron main process
├── preload.js              # contextBridge API
└── start.sh                # Boot script (hciconfig up, launch Electron)
```

## SSH access

```bash
ssh pi-desk@192.168.1.109
# password: raspberry
```
