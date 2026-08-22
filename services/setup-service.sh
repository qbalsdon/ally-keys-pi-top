#!/usr/bin/env bash
# setup-service.sh — Install the ip-monitor systemd service on the Raspberry Pi.
# Run this once on the Pi after the first deploy:
#   ssh pi-desk@<pi-ip> '/home/pi-desk/ally-keys-pi-top/services/setup-service.sh'

set -euo pipefail

APP_DIR="/home/pi-desk/ally-keys-pi-top"
SERVICE_SRC="${APP_DIR}/services/ip-monitor.service"
SERVICE_NAME="ally-keys-ip-monitor"
RUN_SCRIPT="${APP_DIR}/services/ip-monitor-run.sh"

echo ""
echo "══════════════════════════════════════════"
echo "  ally-keys-pi-top — IP monitor service"
echo "══════════════════════════════════════════"
echo ""

# ── Preflight ─────────────────────────────────────────────────────────────────
if [ ! -f "${APP_DIR}/.env" ]; then
  echo "❌  Missing ${APP_DIR}/.env"
  echo "    Create it before running this script:"
  echo ""
  echo "    echo 'PUTER_AUTH_TOKEN=your_token_here' > ${APP_DIR}/.env"
  echo "    chmod 600 ${APP_DIR}/.env"
  echo ""
  echo "    Get your token at: https://puter.com/dashboard#account"
  exit 1
fi

if ! grep -q 'PUTER_AUTH_TOKEN' "${APP_DIR}/.env"; then
  echo "❌  PUTER_AUTH_TOKEN not found in ${APP_DIR}/.env"
  exit 1
fi

# ── Make scripts executable ───────────────────────────────────────────────────
chmod +x "${RUN_SCRIPT}"
echo "✔  Made ip-monitor-run.sh executable"

# ── Install systemd unit ──────────────────────────────────────────────────────
sudo cp "${SERVICE_SRC}" "/etc/systemd/system/${SERVICE_NAME}.service"
echo "✔  Copied service unit to /etc/systemd/system/"

sudo systemctl daemon-reload
sudo systemctl enable "${SERVICE_NAME}"
sudo systemctl restart "${SERVICE_NAME}"
echo "✔  Service enabled and started"

# ── Status ────────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
echo "  ✅  Done"
echo ""
echo "  Check status:  sudo systemctl status ${SERVICE_NAME}"
echo "  Live logs:     journalctl -fu ${SERVICE_NAME}"
echo "══════════════════════════════════════════"
echo ""
