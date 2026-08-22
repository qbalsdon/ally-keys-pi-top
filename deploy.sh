#!/usr/bin/env bash
# deploy.sh — Sync ally-keys-pi-top to the Raspberry Pi and install dependencies.
#
# Usage:
#   ./deploy.sh           # sync + npm install + electron-rebuild
#   ./deploy.sh --sync    # sync files only (no install step)
#
# First run: set up passwordless SSH so you're not prompted every time:
#   ssh-keygen -t ed25519 -C "ally-keys-pi"
#   ssh-copy-id pi-desk@192.168.1.109
# Or just type the password (raspberry) when prompted.

set -euo pipefail

PI_USER="pi-desk"
PI_IP="192.168.1.109"
PI_ADDR="${PI_USER}@${PI_IP}"
PI_DIR="/home/pi-desk/ally-keys-pi-top"
SYNC_ONLY="${1:-}"

echo ""
echo "═══════════════════════════════════════════"
echo "  ally-keys-pi-top  →  ${PI_ADDR}"
echo "═══════════════════════════════════════════"
echo ""

# ── 1. Sync project files ────────────────────────────────────────────────────
echo "📁  Syncing files…"
rsync -avz --delete \
  --exclude '.git' \
  --exclude '.DS_Store' \
  --exclude 'node_modules' \
  --exclude 'docs' \
  --exclude '*.md' \
  --exclude 'deploy.sh' \
  "$(dirname "$0")/" \
  "${PI_ADDR}:${PI_DIR}/"

echo ""
echo "✔  Files synced to ${PI_DIR}"

if [[ "${SYNC_ONLY}" == "--sync" ]]; then
  echo "   (--sync flag set — skipping install)"
  echo ""
  exit 0
fi

# ── 2. Install & rebuild on the Pi ───────────────────────────────────────────
echo ""
echo "📦  Running npm install + electron-rebuild on Pi…"
echo "    (this can take several minutes on first run)"
echo ""

ssh "${PI_ADDR}" bash <<'REMOTE'
set -e
cd /home/pi-desk/ally-keys-pi-top

# Ensure Node is available (nvm)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

echo "  Node: $(node --version)"
echo "  npm:  $(npm --version)"

npm install --omit=dev
npx electron-rebuild -f

echo ""
echo "  Install complete."
REMOTE

# ── 3. Done ──────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════"
echo "  ✅  Deploy complete"
echo ""
echo "  To start the app on the Pi:"
echo "    ssh ${PI_ADDR} '${PI_DIR}/start.sh'"
echo ""
echo "  Or run in dev mode (windowed + devtools):"
echo "    ssh ${PI_ADDR} '${PI_DIR}/start.sh --dev'"
echo "═══════════════════════════════════════════"
echo ""
