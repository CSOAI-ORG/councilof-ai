/**
 * client.js — X402Client: the measurement-consumer buyer.
 * Loop B from BASE-METAMASK-GSPC-SEAMLESS-ARCHITECTURE.md:
 *   GSPC Route decides → 402 challenge → POLICY (fail-closed) → offer JWS verified
 *   → EIP-3009 signature → retry → receipt → decision record (JSONL ledger).
 * The key is a keystone session key — never a human's primary key.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import { ethers } from 'ethers';
import { evaluate } from './policy.js';
import { verifyOfferJws } from './offer-jws.js';

const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const X402_RESOURCE_FIELDS = ['url', 'description'];

export class X402Client {
  /**
   * @param {object} opts
   * @param {string} opts.privateKey  keystone session key (0x…, secp256k1)
   * @param {object} opts.policy      loaded policy (see policy.js)
   * @param {object} [opts.route]     {async decide({url, subject}) => {decision:'BUY'|'SKIP', basis}}
   * @param {string} [opts.didUrl]    DID doc URL override (tests)
   * @param {string} [opts.ledgerPath] decision-record ledger (defaults to policy.ledger)
   * @param {object} [opts.fetchImpl] fetch override (tests)
   */
  constructor({ privateKey, policy, route, didUrl, ledgerPath, fetchImpl }) {
    this.wallet = new ethers.Wallet(privateKey);
    this.policy = policy;
    this.route = route || null;
    this.didUrl = didUrl;
    this.ledgerPath = ledgerPath || policy.ledger || './decision-records.jsonl';
    this.fetchImpl = fetchImpl || ((u, o) => fetch(u, o));
  }

  #refuse(rec, reason) {
    rec.decision = 'REFUSED'; rec.reason = reason;
    this.#append(rec);
    return rec;
  }

  #append(rec) {
    try { fs.appendFileSync(this.ledgerPath, JSON.stringify(rec) + '\n'); } catch { /* best effort */ }
  }

  /** Buy one measurement/receipt at `url` for `subject`. Never throws for refusals — returns a record. */
  async buy({ url, subject }) {
    const rec = { ts: new Date().toISOString(), payer: this.wallet.address, url, subject };

    // 1 · GSPC Route decides first (measurement drives spending)
    if (this.route) {
      try {
        const r = await this.route.decide({ url, subject });
        rec.route_basis = r.basis || null;
        if (r.decision !== 'BUY') return this.#refuse(rec, `route: ${r.reason || r.basis || 'SKIP'}`);
      } catch (e) {
        return this.#refuse(rec, `route error: ${e.message}`);
      }
    } else {
      rec.route_basis = 'policy-only (no route adapter)';
    }

    // 2 · challenge
    let ch;
    try {
      const r0 = await this.fetchImpl(url);
      const body = await r0.json().catch(() => null);
      if (r0.status === 200) return this.#refuse(rec, 'unexpected 200 — resource free or already settled');
      ch = body;
    } catch (e) {
      return this.#refuse(rec, `challenge fetch failed: ${e.message}`);
    }
    const acc = ch?.accepts?.[0];

    // 3 · policy — local re-check of every server term (fail-closed)
    const reasons = evaluate(this.policy, { url, subject, accepts: ch?.accepts, ledgerPath: this.ledgerPath });
    if (reasons.length) return this.#refuse(rec, reasons.join('; '));

    // 4 · offer-receipt JWS — verify BEFORE signing (we are the strictest buyer on the wire)
    const jws = ch?.extensions?.['offer-receipt']?.info?.offers?.[0]?.signature;
    if (this.policy.requireOfferJws) {
      const v = await verifyOfferJws(jws, { didUrl: this.didUrl, fetchImpl: this.fetchImpl });
      rec.offer_verified = v.ok;
      if (!v.ok) return this.#refuse(rec, `offer JWS: ${v.reason}`);
      rec.offer_kid = v.kid;
    } else {
      rec.offer_verified = false;
    }

    // 5 · EIP-3009 sign + retry
    const nonce = '0x' + crypto.randomBytes(32).toString('hex');
    const now = Math.floor(Date.now() / 1000);
    const domain = { name: 'USD Coin', version: '2', chainId: 8453, verifyingContract: USDC };
    const types = { TransferWithAuthorization: [
      { name: 'from', type: 'address' }, { name: 'to', type: 'address' }, { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' }, { name: 'validBefore', type: 'uint256' }, { name: 'nonce', type: 'bytes32' }] };
    const message = { from: this.wallet.address, to: acc.payTo, value: String(acc.amount),
      validAfter: String(now - 60), validBefore: String(now + 300), nonce };
    const signature = await this.wallet.signTypedData(domain, types, message);
    const xPayment = Buffer.from(JSON.stringify({
      x402Version: 2, scheme: 'exact', network: 'eip155:8453',
      payload: { signature, authorization: message }, resource: url,
    })).toString('base64');

    let res = await this.fetchImpl(url, { headers: { 'x-payment': xPayment } });
    let body = await res.json().catch(() => ({}));
    if (res.status !== 200) {
      res = await this.fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-payment': xPayment } });
      body = await res.json().catch(() => ({}));
    }

    // 6 · decision record — cites route basis, offer kid, receipt state
    rec.decision = res.status === 200 ? 'BOUGHT' : 'PAYMENT_FAILED';
    rec.amount_atomic = String(acc.amount);
    rec.payTo = acc.payTo;
    rec.receipt_state = body?.status || body?.delivery_state || null;
    rec.receipt_signed = !!body?.sig_ed25519;
    rec.http_status = res.status;
    if (body?.sig_ed25519) rec.receipt_sig = String(body.sig_ed25519).slice(0, 24) + '…';
    this.#append(rec);
    return rec;
  }
}
