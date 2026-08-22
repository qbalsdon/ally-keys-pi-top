#!/usr/bin/env bash
# ip-monitor-run.sh — wrapper so systemd can launch ip-monitor.js with nvm's node.
# systemd doesn't source ~/.bashrc, so we load nvm manually here.

export NVM_DIR="/home/pi-desk/.nvm"
# shellcheck disable=SC1091
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

exec node /home/pi-desk/ally-keys-pi-top/services/ip-monitor.js
