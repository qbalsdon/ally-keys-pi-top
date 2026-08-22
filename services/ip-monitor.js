'use strict';
// ip-monitor.js — Raspberry Pi IP address watcher.
// Runs as a systemd service. On boot and whenever the LAN IP changes,
// writes the new IP to puter.js KV under the key "pi-top-puter-key".
// deploy.sh reads this key to find the Pi without needing a static IP.

const { init } = require('@heyputer/puter.js');
const os        = require('os');
const fs        = require('fs');

const PUTER_TOKEN      = process.env.PUTER_AUTH_TOKEN;
const PUTER_KEY        = 'pi-top-puter-key';
const STATE_FILE       = '/home/pi-desk/.ally-keys-pi-top-ip';
const CHECK_INTERVAL   = 30 * 1000; // 30 s

if (!PUTER_TOKEN) {
  console.error('[ip-monitor] PUTER_AUTH_TOKEN is not set — check .env');
  process.exit(1);
}

const puter = init(PUTER_TOKEN);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Return the primary LAN IPv4 address (first non-loopback, non-virtual interface).
 */
function getLanIp() {
  const ifaces = os.networkInterfaces();
  const skip = /^(lo|docker|veth|virbr|br-)/;
  for (const name of Object.keys(ifaces).sort()) {
    if (skip.test(name)) continue;
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

function readStateIp() {
  try   { return fs.readFileSync(STATE_FILE, 'utf8').trim(); }
  catch { return null; }
}

function writeStateIp(ip) {
  fs.writeFileSync(STATE_FILE, ip, 'utf8');
}

// ── Core check ────────────────────────────────────────────────────────────────

async function checkAndUpload() {
  const currentIp = getLanIp();
  const lastIp    = readStateIp();

  if (!currentIp) {
    console.log(`[ip-monitor] ${ts()} — no LAN IP found, skipping`);
    return;
  }

  if (currentIp === lastIp) {
    console.log(`[ip-monitor] ${ts()} — IP unchanged: ${currentIp}`);
    return;
  }

  const from = lastIp || '(none)';
  console.log(`[ip-monitor] ${ts()} — IP changed: ${from} → ${currentIp}`);

  try {
    await puter.kv.set(PUTER_KEY, currentIp);
    writeStateIp(currentIp);
    console.log(`[ip-monitor] ${ts()} — uploaded to puter: "${PUTER_KEY}" = ${currentIp}`);
  } catch (err) {
    console.error(`[ip-monitor] ${ts()} — puter upload failed:`, err.message || err);
  }
}

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

// ── Entry point ───────────────────────────────────────────────────────────────

console.log(`[ip-monitor] starting — will check every ${CHECK_INTERVAL / 1000}s`);
checkAndUpload();
setInterval(checkAndUpload, CHECK_INTERVAL);

process.on('SIGTERM', () => {
  console.log('[ip-monitor] received SIGTERM — exiting');
  process.exit(0);
});
