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
for i in 0 1 2 3 4; do
  if sudo hciconfig "hci${i}" up 2>/dev/null; then
    echo "    hci${i}  ✔"
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
    --disable-infobars \
    --disable-pinch \
    --overscroll-history-navigation=0
fi
