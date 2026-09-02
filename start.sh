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

set -euo pipefail

APP_DIR="/home/pi-desk/ally-keys-pi-top"
DEV_MODE="${1:-}"

# ── Ensure nvm / Node is on PATH ─────────────────────────────────────────────
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

# ── Bring up Bluetooth adapters ──────────────────────────────────────────────
echo "🔵  Bringing up Bluetooth adapters…"
# Stop bluetoothd so it doesn't conflict with bleno on hci0.
# bluetoothd running alongside bleno causes:
#   - Classic BT hostname ("pi-desk") to override our BLE device name
#   - bluetoothd intercepting HID connections before bleno can handle them
#   - Possible GATT server conflicts that prevent iOS from pairing as HID
sudo systemctl stop bluetooth 2>/dev/null || true
sleep 0.5
# Unblock any rfkill soft-block first (no password needed via sudoers.d/ally-keys-bt)
sudo rfkill unblock bluetooth 2>/dev/null || true
for i in 0 1 2 3 4; do
  if sudo hciconfig "hci${i}" up 2>/dev/null; then
    echo "    hci${i}  ✔"
    # Disable Classic BT inquiry + page scan so iOS doesn't see "pi-desk"
    # from the same MAC and ignore our BLE advertisement.
    sudo hciconfig "hci${i}" noscan 2>/dev/null || true
  fi
done
echo ""

# ── Set display (required when launched from autostart / SSH) ────────────────
export DISPLAY="${DISPLAY:-:0}"
export XAUTHORITY="${XAUTHORITY:-/home/pi-desk/.Xauthority}"

# ── Disable screen blanking for kiosk use ───────────────────────────────────
if command -v xset &>/dev/null; then
  xset s off
  xset -dpms
fi

# ── BLE identity ─────────────────────────────────────────────────────────────
# Give the BLE peripheral a fixed static random LE address, distinct from the
# Pi's Classic-BT public MAC (E4:5F:01:05:21:B1).  iOS caches that public MAC
# as "pi-desk" (Classic BT) and ignores BLE advertisements from the same MAC.
# A static random address (top byte ≥ 0xC0 — top 2 bits = 11) makes iOS see
# ALLY-KEYS-PI-TOP as a fresh, separate device in Settings → Bluetooth.
#
# This value is consumed by our bleno hci.js patch, NOT by vanilla bleno.
# (BLENO_DEVICE_ADDRESS is not a real bleno env var; BLENO_RANDOM_ADDRESS is
# our own addition applied via the patched setRandomAddress() / setAdvertisingParameters().)
export BLENO_RANDOM_ADDRESS="C0:FF:AA:BB:CC:D1"
# bleno's built-in GATT Generic Access service (0x1800) uses this env var for
# the Device Name characteristic (0x2A00).  Without it, bleno falls back to
# os.hostname() which returns "pi-desk" — the Pi's Linux hostname — and iOS
# reads that from GATT after connecting, overriding the BLE advertising name.
export BLENO_DEVICE_NAME="ALLY-KEYS-PI-TOP"

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
