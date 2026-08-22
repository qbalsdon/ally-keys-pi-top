#!/usr/bin/env bash
# deploy.sh — Sync ally-keys-pi-top to the Raspberry Pi and install dependencies.
#
# Usage:
#   ./deploy.sh           # resolve IP from puter → sync + npm install + electron-rebuild
#   ./deploy.sh --sync    # sync files only (no install step)
#
# First run: set up passwordless SSH so you're not prompted every time:
#   ssh-keygen -t ed25519 -C "ally-keys-pi"
#   ssh-copy-id pi-desk@<pi-ip>
#
# Requires .env with PUTER_AUTH_TOKEN — see .env.example

set -euo pipefail

PI_USER="pi-user"
FALLBACK_IP="192.168.1.109"   # used only if puter lookup fails
SYNC_ONLY="${1:-}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "═══════════════════════════════════════════"
echo "  ally-keys-pi-top  →  deploy"
echo "═══════════════════════════════════════════"
echo ""

# ── 1. Resolve Pi IP from puter KV ───────────────────────────────────────────
PI_IP=""

if command -v node &>/dev/null && [ -f "${SCRIPT_DIR}/get-pi-ip.js" ]; then
  echo "🔍  Looking up Pi IP from puter KV…"
  # node get-pi-ip.js prints the IP to stdout, exits non-zero on failure
  PUTER_IP="$(node "${SCRIPT_DIR}/get-pi-ip.js" 2>/dev/null || true)"
  if [ -n "${PUTER_IP}" ]; then
    PI_IP="${PUTER_IP}"
    echo "    📡  Pi IP from puter: ${PI_IP}"
  else
    echo "    ⚠   puter lookup failed — falling back to ${FALLBACK_IP}"
    PI_IP="${FALLBACK_IP}"
  fi
else
  echo "    ⚠   get-pi-ip.js not available — using fallback ${FALLBACK_IP}"
  PI_IP="${FALLBACK_IP}"
fi

PI_ADDR="${PI_USER}@${PI_IP}"
PI_DIR="/home/${PI_USER}/ally-keys-pi-top"

echo "    Target: ${PI_ADDR}:${PI_DIR}"
echo ""

# ── 2. Sync project files ────────────────────────────────────────────────────
echo "📁  Syncing files…"
rsync -avz --delete \
  --exclude '.git' \
  --exclude '.DS_Store' \
  --exclude '.env' \
  --exclude 'node_modules' \
  --exclude 'docs' \
  --exclude '*.md' \
  --exclude 'deploy.sh' \
  --exclude 'get-pi-ip.js' \
  "${SCRIPT_DIR}/" \
  "${PI_ADDR}:${PI_DIR}/"

echo ""
echo "✔  Files synced to ${PI_DIR}"

if [[ "${SYNC_ONLY}" == "--sync" ]]; then
  echo "   (--sync flag set — skipping install)"
  echo ""
  exit 0
fi

# ── 3. Install & rebuild on the Pi ───────────────────────────────────────────
echo ""
echo "📦  Running npm install + electron-rebuild on Pi…"
echo "    (this can take several minutes on first run)"
echo ""

ssh "${PI_ADDR}" bash <<REMOTE
set -e
cd "${PI_DIR}"

export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && source "\$NVM_DIR/nvm.sh"

echo "  Node: \$(node --version)"
echo "  npm:  \$(npm --version)"

npm install --omit=dev
npx electron-rebuild -f

echo ""
echo "  Install complete."
REMOTE

# ── 4. Done ──────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════"
echo "  ✅  Deploy complete"
echo ""
echo "  To start the app on the Pi:"
echo "    ssh ${PI_ADDR} '${PI_DIR}/start.sh'"
echo ""
echo "  Or run in dev mode (windowed + devtools):"
echo "    ssh ${PI_ADDR} '${PI_DIR}/start.sh --dev'"
echo ""
echo "  To install the IP monitor service (first time only):"
echo "    ssh ${PI_ADDR} '${PI_DIR}/services/setup-service.sh'"
echo "═══════════════════════════════════════════"
echo ""
