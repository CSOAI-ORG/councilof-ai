'use strict';
const fs = require('fs');
const path = require('path');
const { keypairFromSeed, randomSeed } = require('./crypto.js');

function ensureKeys() {
  const dir = process.env.DEFONEOS_KEY_DIR || path.join(process.env.HOME || "", ".sovereign", "keys");
  const name = process.env.DEFONEOS_KEY_NAME || "ed25519.key";
  fs.mkdirSync(dir, { recursive: true });
  const fp = path.join(dir, name);
  let seed;
  if (!fs.existsSync(fp)) {
    seed = randomSeed();
    fs.writeFileSync(fp, seed, { mode: 0o600 });
    fs.writeFileSync(fp + ".pub", Buffer.from(keypairFromSeed(seed).pubHex, "hex"), { mode: 0o644 });
    fs.writeFileSync(fp + ".fp", Buffer.from(seed.toString("hex").slice(0, 16), "hex"), { mode: 0o644 });
  }
  const seedBuf = fs.readFileSync(fp);
  return keypairFromSeed(seedBuf);
}

module.exports = { ensureKeys };
