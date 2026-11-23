// Keep the source-only Layer-0 corrections probe in the existing required Vitest gate.
import {it,expect} from 'vitest';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

it('MEOK read-only correction source and Layer-0 context rejects authority and timestamp inflation',()=>{
  const output=execFileSync(process.execPath,
    ['--test','--test-reporter=tap',fileURLToPath(new URL('./correction-context.node-test.mjs',import.meta.url))],
    {encoding:'utf8',timeout:15000});
  expect(output).toMatch(/# fail 0/);
},20000);
