import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '..');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');
const pointerUrl = 'https://councilof.ai/interop/card-root-latest.json';

describe('mill-card root machine discovery', () => {
  it('publishes the same scoped pointer line as the llms.txt template', () => {
    const template = read('scripts/llms/llms.txt.tmpl');
    const served = read('public/llms.txt');
    const line = template.split('\n').find((entry) => entry.includes(pointerUrl));

    expect(line, 'the generator template must name the stable discovery pointer').toBeTruthy();
    expect(served.split('\n').filter((entry) => entry.includes(pointerUrl))).toEqual([line]);
    expect(line).toContain('unsigned pointer');
    expect(line).toContain('root_sha256');
    expect(line).toContain('separate from `/root.json`, `/signed/card_index.json` and `/api/gspc`');
    expect(line).toContain('pending until an independent `ots verify` confirms a Bitcoin attestation');
    expect(line).not.toMatch(/\b\d{3,}\s+(?:cards|leaves|measurements)\b/);
  });
});
