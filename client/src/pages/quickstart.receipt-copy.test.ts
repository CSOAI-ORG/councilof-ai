import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Copy/source alignment only: this does not execute a payment or authenticate a queue.
const page = readFileSync(resolve(__dirname, 'Quickstart.tsx'), 'utf8');
const handler = readFileSync(resolve(__dirname, '../../../functions/api/request-attestation.ts'), 'utf8');
const block = page.match(/<aside[^>]*data-testid="quickstart-commission-outcomes"[\s\S]*?<\/aside>/)?.[0] ?? '';

describe('commission outcome instructions match the current handler branches', () => {
  it('marks the outcomes as source-described, not verified deployment', () => {
    expect(block).toContain('Source-described outcomes');
    expect(block).toContain('not a verified live transaction');
  });
  it.each(['SETTLED_QUEUE_UNCONFIRMED', 'QUEUE_ACCEPTED_RECEIPT_UNAVAILABLE'])('names the existing nonfinal state %s', (state) => {
    expect(handler).toContain('state:"' + state + '"');
    expect(block).toContain(state);
    expect(block).toContain('HTTP 202');
  });
  it('tells the buyer not to repeat payment automatically', () => {
    expect(handler).toContain('retry_payment:false');
    expect(block).toContain('Do not automatically pay again');
  });
  it('does not turn a 200 or a signature into execution and delivery', () => {
    expect(block).toContain('HTTP 200'); expect(block).toContain('signed');
    expect(block).toContain('does not establish execution or delivery');
  });
  it('removes the unconditional 200 promise', () => {
    expect(page).not.toContain('A settled call returns 200 with one card-v0 commission receipt');
  });
});
