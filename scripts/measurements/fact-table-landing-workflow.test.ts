import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = readFileSync(fileURLToPath(new URL('../../.github/workflows/mill-jobs-land.yml', import.meta.url)), 'utf8');
const producer = 'node scripts/measurements/build-gspc-fact-table.mjs';
const land = source.indexOf('python3 scripts/land_mill_cards.py');
const regen = source.indexOf('name: regenerate joined fact table from landed cell evidence');
const commit = source.indexOf('git add public/interop/mill-cards-unsigned');
const sign = source.indexOf('python3 scripts/sign_land_branch.py dispatch');

describe('HF Jobs landing — source-derived fact table remains in the same PR', () => {
  it('generates and checks the table AFTER landed evidence and BEFORE commit/signing', () => {
    expect(land).toBeGreaterThan(0);
    expect(regen).toBeGreaterThan(land);
    expect(commit).toBeGreaterThan(regen);
    expect(sign).toBeGreaterThan(commit);
    const step = source.slice(regen, source.indexOf('- name: branch, push, PR', regen));
    expect(step).toContain("if: steps.land.outputs.landed != '0'");
    expect(step).toContain(producer + ' --out public/interop/gspc-fact-table');
    expect(step).toContain(producer + ' --check --out public/interop/gspc-fact-table');
  });

  it('stages generator outputs atomically with unsigned evidence, without bypassing the signer', () => {
    const gitAdd = source.split('\n').find((line) => line.includes('git add public/interop/mill-cards-unsigned'));
    expect(gitAdd).toContain('public/interop/mill-evidence');
    expect(gitAdd).toContain('public/interop/gspc-fact-table');
    expect(source).toContain('sign_land_branch.py dispatch');
    expect(source).toContain('sign_land_branch.py wait');
    expect(source).toContain('sign pending; nothing MEASURED');
  });
});
