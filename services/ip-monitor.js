// ip-monitor.js — Raspberry Pi IP address watcher.
// Polls the LAN IP every 30s; on change (or first boot) stores it in
// Upstash Redis under the key "pi-top-ip".
// deploy.sh reads that key via get-pi-ip.js to find the Pi dynamically.
//
// Runs in local-only mode when upstash_url / upstash_token are absent.

import os from 'os';
import fs from 'fs';

const UPSTASH_URL    = process.env.upstash_url;
const UPSTASH_TOKEN  = process.env.upstash_token;
const REDIS_KEY      = 'pi-top-ip';
const STATE_FILE     = '/home/pi-desk/.ally-keys-pi-top-ip';
const CHECK_INTERVAL = 30 * 1000; // 30 s

// ── Load Upstash Redis client (optional) ─────────────────────────────────────

let redis = null;

if (UPSTASH_URL && UPSTASH_TOKEN) {
  try {
    const { Redis } = await import('@upstash/redis');
    redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
    console.log('[ip-monitor] Upstash Redis connected — will upload IP changes');
  } catch (err) {
    console.error('[ip-monitor] failed to load @upstash/redis:', err.message);
  }
} else {
  console.warn('[ip-monitor] upstash_url / upstash_token not set — local-only mode');
  console.warn('[ip-monitor] Add them to .env and restart to enable upload');
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

  if (redis) {
    try {
      await redis.set(REDIS_KEY, currentIp);
      console.log(`[ip-monitor] ${ts()} — uploaded to Upstash: "${REDIS_KEY}" = ${currentIp}`);
    } catch (err) {
      console.error(`[ip-monitor] ${ts()} — Upstash upload failed:`, err.message || err);
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
