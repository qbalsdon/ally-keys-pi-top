'use strict';
// get-pi-ip.js — run locally (Mac) to look up the Pi's current IP from puter KV.
// Used by deploy.sh to avoid hardcoding the Pi's IP address.
//
// Usage:
//   node get-pi-ip.js            → prints IP to stdout, exits 0
//   node get-pi-ip.js            → exits 1 if key not found or auth fails
//
// Requires PUTER_AUTH_TOKEN in .env (or already in environment).

// Simple .env loader — no extra deps needed
const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8')
    .split('\n')
    .forEach(line => {
      const [key, ...rest] = line.trim().split('=');
      if (key && !key.startsWith('#') && !(key in process.env)) {
        process.env[key] = rest.join('=').trim();
      }
    });
}

const PUTER_TOKEN = process.env.PUTER_AUTH_TOKEN;
const PUTER_KEY   = 'pi-top-puter-key';

if (!PUTER_TOKEN) {
  process.stderr.write('[get-pi-ip] PUTER_AUTH_TOKEN not set — check .env\n');
  process.exit(2);
}

const { init } = require('@heyputer/puter.js');
const puter = init(PUTER_TOKEN);

(async () => {
  try {
    const ip = await puter.kv.get(PUTER_KEY);
    if (!ip) {
      process.stderr.write(`[get-pi-ip] key "${PUTER_KEY}" not found in puter KV\n`);
      process.exit(1);
    }
    process.stdout.write(ip.trim());
    process.exit(0);
  } catch (err) {
    process.stderr.write(`[get-pi-ip] puter error: ${err.message || err}\n`);
    process.exit(1);
  }
})();
