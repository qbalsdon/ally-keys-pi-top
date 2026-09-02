#!/usr/bin/env bash
# start.sh — Launch ally-keys-pi-top on the Raspberry Pi.
#
# Run directly on the Pi:
#   ./start.sh           # kiosk mode (fullscreen, no chrome)
#   ./start.sh --dev     # windowed with DevTools open
#
# This script is also placed in autostart so the app boots with the Pi:
#   echo "@/home/pi-desk/ally-keys-pi-top/start.sh" \
#     >> ~/.config/lxsession/LXDE-pi/autostart
#
# ── ONE-TIME PI SETUP (run once after flashing) ──────────────────────────────
# The bluetoothd / bleno co-existence requires AutoEnable=false in BlueZ config
# so that bluetoothd does NOT power on hci0 (bleno owns it via raw HCI socket).
# Run this ONCE on the Pi:
#
#   sudo bash -c "grep -q 'AutoEnable' /etc/bluetooth/main.conf ||
#     echo -e '\n[Policy]\nAutoEnable=false' >> /etc/bluetooth/main.conf"
#   sudo systemctl restart bluetooth
#
# With AutoEnable=false, bluetoothd still runs (needed for USB dongle HID via
# D-Bus GATT) but will NOT fight bleno for hci0.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

APP_DIR="/home/pi-desk/ally-keys-pi-top"
DEV_MODE="${1:-}"

# ── Ensure nvm / Node is on PATH ─────────────────────────────────────────────
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

# ── Bluetooth adapter bringup ────────────────────────────────────────────────
echo "🔵  Bringing up Bluetooth adapters…"

# Step 1: Stop bluetoothd so bleno can claim hci0 cleanly (raw HCI socket).
#         Without this, bluetoothd may fight bleno over hci0's HCI commands.
sudo systemctl stop bluetooth 2>/dev/null || true
sleep 0.5

# Step 2: Unblock rfkill and bring ALL adapters up at the kernel HCI level.
sudo rfkill unblock bluetooth 2>/dev/null || true
for i in 0 1 2 3 4; do
  if sudo hciconfig "hci${i}" up 2>/dev/null; then
    echo "    hci${i}  ✔"
    # Disable BR/EDR inquiry + page scan so iOS doesn't see "pi-desk"
    # from the same MAC and ignore our BLE advertisement.
    sudo hciconfig "hci${i}" noscan 2>/dev/null || true
  fi
done

# ── Set display (required when launched from autostart / SSH) ────────────────
export DISPLAY="${DISPLAY:-:0}"
export XAUTHORITY="${XAUTHORITY:-/home/pi-desk/.Xauthority}"

# ── Disable screen blanking for kiosk use ───────────────────────────────────
if command -v xset &>/dev/null; then
  xset s off
  xset -dpms
fi

# ── BLE identity (hci0 / bleno) ───────────────────────────────────────────────
# Give the BLE peripheral a fixed static random LE address, distinct from the
# Pi's Classic-BT public MAC (E4:5F:01:05:21:B1).  iOS caches that public MAC
# as "pi-desk" (Classic BT) and ignores BLE advertisements from the same MAC.
# A static random address (top byte ≥ 0xC0 — top 2 bits = 11) makes iOS see
# ALLY-KEYS-PI-TOP as a fresh, separate device in Settings → Bluetooth.
export BLENO_RANDOM_ADDRESS="C0:FF:AA:BB:CC:D1"
# bleno's built-in GATT Generic Access service (0x1800) Device Name char (0x2A00)
# reads from this env var.  Without it, bleno falls back to os.hostname() which
# returns "pi-desk".
export BLENO_DEVICE_NAME="ALLY-KEYS-PI-TOP"

# ── Step 3: Start bluetoothd AFTER bleno will have claimed hci0 ──────────────
# We start bluetoothd in the background with a delay:
#   - bleno starts, sends HCI_Reset to hci0, and begins advertising (~2–3 s)
#   - bluetoothd starts, sees hci0 is already up but with AutoEnable=false does
#     NOT power it via MGMT — bleno keeps ownership
#   - bluetoothd does manage hci2/hci3 for the USB dongle HID workers via D-Bus
#   - bluez-hid-worker.js connects to bluetoothd over D-Bus and powers on
#     hci2/hci3, registers GATT app + advertisement on each adapter
#
# If AutoEnable=false is not configured (see ONE-TIME SETUP above), bluetoothd
# will try to reinitialise hci0 and break bleno.  The script warns and continues.
(
  sleep 5
  if ! grep -q 'AutoEnable=false' /etc/bluetooth/main.conf 2>/dev/null; then
    echo "⚠️   /etc/bluetooth/main.conf missing AutoEnable=false — bluetoothd may" \
         "conflict with bleno on hci0.  See ONE-TIME PI SETUP comment in start.sh."
  fi
  sudo systemctl start bluetooth 2>/dev/null && \
    echo "🔵  bluetoothd started (hci2/hci3 HID mode)" || \
    echo "⚠️   bluetoothd failed to start — USB HID dongles won't be available"
) &

# Step 4 (BCM43455 quirk): bleno sends HCI_Reset on startup which clears
# MGMT-level LE state.  Re-run btmgmt le on ~6 s after electron starts to
# restore LE connection acceptance on hci0.
(sleep 8 && sudo btmgmt -i hci0 le on 2>/dev/null && \
  echo "🔵  LE re-enabled on hci0 (post-reset)") &

# ── Launch Electron ──────────────────────────────────────────────────────────
cd "${APP_DIR}"

if [[ "${DEV_MODE}" == "--dev" ]]; then
  echo "🚀  Starting ally-keys-pi-top (dev mode)…"
  npx electron . --dev --no-sandbox
else
  echo "🚀  Starting ally-keys-pi-top (kiosk mode)…"
  npx electron . \
    --kiosk \
    --no-sandbox \
    --disable-gpu \
    --disable-infobars \
    --disable-pinch \
    --overscroll-history-navigation=0
fi
