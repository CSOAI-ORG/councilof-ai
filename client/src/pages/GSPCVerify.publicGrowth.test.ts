import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('./GSPCVerify.tsx',import.meta.url),'utf8');
const form=readFileSync(new URL('../components/gspc/RecordVerifyForm.tsx',import.meta.url),'utf8');
describe('Public verifier growth and privacy boundaries',()=>{
  it('does not promise an unimplemented permalink generator',()=>{
    expect(page).not.toContain('Share a permalink');
    expect(page).toContain('This form does not create a share link');
  });
  it('offers a real current public-source sharing instruction',()=>{
    expect(page).toContain('share its original public JSON URL');
    expect(page).toContain('do not share private records without permission');
  });
  it('distinguishes local signature calculation from public-document requests',()=>{
    expect(page).not.toContain('It does not contact a server.');
    expect(page).toContain('Signature calculation runs in your browser.');
    expect(page).toContain('withdrawal documents');
    expect(page).toContain('not uploaded');
  });
  it('retains the existing published-card and pasted-record paths',()=>{
    expect(page).toContain('try-published-card');expect(page).toContain('try-governance-retrieve');
    expect(page).toContain('RecordVerifyForm');expect(form).toContain('InputBoundVerifier');
  });
  it('keeps the optional tally distinct from signature and use status',()=>{
    expect(form).toContain('lookupRecordUseStatus');expect(form).toContain('opt-in');
    expect(form).toContain('body: JSON.stringify({ ok })');
    expect(page).toContain('optional public tally');
  });
});
