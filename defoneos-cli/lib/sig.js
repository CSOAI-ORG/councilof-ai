'use strict';
const crypto = require('crypto');
function fingerprint(pubHex) {
  return crypto.createHash('sha256').update(Buffer.from(pubHex, 'hex')).digest('hex').slice(0, 16);
}
module.exports = { fingerprint };
