# ally-keys-pi-top

Electron app for Raspberry Pi 4B that bridges [ally-keys.com](https://ally-keys.com) to up to 4 Bluetooth accessibility devices simultaneously.

## What this is

A kiosk-mode Electron app that runs on a Raspberry Pi 4B and hosts **5 BLE services**:

| Service | Adapter | Role |
|---------|---------|------|
| **REC** | `hci0` (built-in) | Receiver — ally-keys.com connects here via Web Bluetooth and sends keycode commands |
| **AK-HID-1** | `hci1` (USB dongle) | BLE HID keyboard paired to phone/tablet 1 |
| **AK-HID-2** | `hci2` (USB dongle) | BLE HID keyboard paired to phone/tablet 2 |
| **AK-HID-3** | `hci3` (USB dongle) | BLE HID keyboard paired to phone/tablet 3 |
| **AK-HID-4** | `hci4` (USB dongle) | BLE HID keyboard paired to phone/tablet 4 |

The UI is the existing ally-keys peripheral page running inside Electron, with a **service bar** pinned at the top showing all 5 BLE connection states. Tapping a connected HID chip toggles whether keypresses are forwarded to that device.

---

## Connecting to the Pi

The Pi's IP address is stored in [Upstash Redis](https://console.upstash.com) under the key `pi-top-ip`. It is kept up to date automatically by the `ally-keys-ip-monitor` systemd service.

### Resolve the current IP

```bash
# requires upstash_url and upstash_token in .env or environment
node get-pi-ip.js
# or via npm script:
npm run get-ip
```

### SSH to the Pi

```bash
ssh pi-desk@$(node get-pi-ip.js)
```

### How the IP gets there

`services/ip-monitor.js` runs on the Pi and polls the LAN IP every 30 seconds. When the IP changes (or on first boot), it calls the Upstash Redis REST API to set the `pi-top-ip` key. `deploy.sh` calls `get-pi-ip.js` automatically before connecting.

---

## Hardware

- Raspberry Pi 4B
- 3–4 × USB Bluetooth 5.0 dongles (CSR8510 chipset recommended)
- HDMI display or DSI touchscreen

---

## Setup

### 1. Get Upstash credentials

Go to [console.upstash.com](https://console.upstash.com) → create a Redis database → copy **REST URL** and **REST Token**.

### 2. Create `.env` on your Mac

```bash
cp .env.example .env
# edit .env — set upstash_url and upstash_token
# OR put them in ~/.zshenv for shell-wide access
```

### 3. First deploy

```bash
./deploy.sh
```

`deploy.sh` calls `get-pi-ip.js` first to resolve the Pi's IP from Upstash. It falls back to `192.168.1.109` if Upstash is unreachable or the key hasn't been set yet.

### 4. Install the IP monitor service on the Pi (once)

```bash
ssh pi-desk@$(node get-pi-ip.js)
# on the Pi:
echo 'upstash_url=https://your-db.upstash.io'       > ~/ally-keys-pi-top/.env
echo 'upstash_token=your_token_here'                >> ~/ally-keys-pi-top/.env
chmod 600 ~/ally-keys-pi-top/.env
~/ally-keys-pi-top/services/setup-service.sh
```

Check it's running:

```bash
ssh pi-desk@$(node get-pi-ip.js) 'journalctl -fu ally-keys-ip-monitor'
```

### 5. Start the Electron app

```bash
# kiosk mode (fullscreen)
ssh pi-desk@$(node get-pi-ip.js) '~/ally-keys-pi-top/start.sh'

# dev mode (windowed + DevTools)
ssh pi-desk@$(node get-pi-ip.js) '~/ally-keys-pi-top/start.sh --dev'
```

---

## Project structure

```
ally-keys-pi-top/
├── docs/
│   └── plan.html              # Implementation plan
├── ble/
│   ├── ble-manager.js         # Orchestrates all 5 BLE services
│   ├── rec-service.js         # NUS GATT receiver on hci0
│   ├── hid-worker.js          # HOGP keyboard worker (run ×4)
│   ├── hid-descriptor.js      # USB keyboard HID descriptor
│   └── protocol-parser.js     # Ported from ally-keys keymap.js
├── renderer/
│   ├── index.html             # Ported peripheral page
│   ├── style/service-bar.css  # Service bar styles
│   └── script/
│       ├── ipc-bridge.js      # Replaces Web Serial with IPC
│       └── service-bar.js     # 5-chip status bar
├── services/
│   ├── ip-monitor.js          # IP watcher — pushes to Upstash Redis
│   ├── ip-monitor-run.sh      # nvm wrapper for systemd
│   ├── ip-monitor.service     # systemd unit file
│   ├── setup-service.sh       # One-shot install script (run on Pi)
│   └── package.json           # @upstash/redis dep (ESM, service-only)
├── main.js                    # Electron main process
├── preload.js                 # contextBridge API
├── get-pi-ip.js               # Read Pi IP from Upstash Redis (run on Mac)
├── deploy.sh                  # rsync + install, resolves IP via Upstash
├── start.sh                   # Boot script (hciconfig up, launch Electron)
├── .env.example               # Credential setup template
└── package.json               # electron + bleno deps
```
