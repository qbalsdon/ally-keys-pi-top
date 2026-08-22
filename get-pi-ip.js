'use strict';
// get-pi-ip.js — run locally (Mac) to look up the Pi's current IP from Upstash Redis.
// Used by deploy.sh to connect without a hardcoded IP address.
//
// Usage:
//   node get-pi-ip.js          → prints IP to stdout, exits 0
//                              → exits 1 if key not found or auth fails
//
// Reads upstash_url and upstash_token from .env or environment.

const fs   = require('fs');
const path = require('path');

// Minimal .env loader (no extra deps)
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const [key, ...rest] = line.trim().split('=');
    if (key && !key.startsWith('#') && !(key in process.env)) {
      process.env[key] = rest.join('=').trim();
    }
  });
}

const UPSTASH_URL   = process.env.upstash_url;
const UPSTASH_TOKEN = process.env.upstash_token;
const REDIS_KEY     = 'pi-top-ip';

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  process.stderr.write('[get-pi-ip] upstash_url / upstash_token not set — check .env or ~/.zshenv\n');
  process.exit(2);
}

// Use the Upstash REST API directly with fetch (Node 18+ built-in)
// so this file has zero dependencies of its own.
(async () => {
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${REDIS_KEY}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });
    const json = await res.json();
    const ip   = json.result;
    if (!ip) {
      process.stderr.write(`[get-pi-ip] key "${REDIS_KEY}" not found in Upstash\n`);
      process.exit(1);
    }
    process.stdout.write(ip.trim());
    process.exit(0);
  } catch (err) {
    process.stderr.write(`[get-pi-ip] Upstash error: ${err.message || err}\n`);
    process.exit(1);
  }
})();
