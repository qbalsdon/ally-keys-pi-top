// ip-monitor.js — Raspberry Pi IP address watcher.
// Runs as a systemd service. On boot and whenever the LAN IP changes,
// writes the new IP to puter.js KV under the key "pi-top-puter-key".
// deploy.sh reads this key to find the Pi without needing a static IP.
//
// Runs in local-only mode (logs IP but skips puter upload) when
// PUTER_AUTH_TOKEN is absent — add it to .env and restart to enable upload.

import os   from 'os';
import fs   from 'fs';

const PUTER_TOKEN    = process.env.PUTER_AUTH_TOKEN;
const PUTER_KEY      = 'pi-top-puter-key';
const STATE_FILE     = '/home/pi-desk/.ally-keys-pi-top-ip';
const CHECK_INTERVAL = 30 * 1000; // 30 s

// ── Load puter (ESM, optional) ────────────────────────────────────────────────

let puter = null;

if (PUTER_TOKEN) {
  try {
    const { init } = await import('@heyputer/puter.js');
    puter = init(PUTER_TOKEN);
    console.log('[ip-monitor] puter.js loaded — will upload IP changes');
  } catch (err) {
    console.error('[ip-monitor] failed to load puter.js:', err.message);
  }
} else {
  console.warn('[ip-monitor] PUTER_AUTH_TOKEN not set — local-only mode');
  console.warn('[ip-monitor] Set PUTER_AUTH_TOKEN in .env and restart to enable upload');
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLanIp() {
  const ifaces = os.networkInterfaces();
  const skip   = /^(lo|docker|veth|virbr|br-)/;
  for (const name of Object.keys(ifaces).sort()) {
    if (skip.test(name)) continue;
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
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

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
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

  if (puter) {
    try {
      await puter.kv.set(PUTER_KEY, currentIp);
      console.log(`[ip-monitor] ${ts()} — uploaded: "${PUTER_KEY}" = ${currentIp}`);
    } catch (err) {
      console.error(`[ip-monitor] ${ts()} — puter upload failed:`, err.message || err);
    }
  } else {
    console.log(`[ip-monitor] ${ts()} — (local-only) current IP: ${currentIp}`);
  }

  writeStateIp(currentIp);
}

// ── Entry point ───────────────────────────────────────────────────────────────

console.log(`[ip-monitor] starting — checking every ${CHECK_INTERVAL / 1000}s`);
await checkAndUpload();
setInterval(checkAndUpload, CHECK_INTERVAL);

process.on('SIGTERM', () => {
  console.log('[ip-monitor] SIGTERM — exiting');
  process.exit(0);
});
