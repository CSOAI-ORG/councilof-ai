import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { makeReviewDraft } from '../public/evidence-learning/contract.mjs';

test('new learning drafts reference the current authority profile without creating authority', async () => {
  const schema = JSON.parse(await readFile(new URL('../docs/standards/osaia-safe-reverification/hitl-authority-effect-v0.2.schema.json', import.meta.url)));
  const draft = makeReviewDraft({ axis: 'model-safety', proposal: {}, learning: {} });
  assert.equal(draft.canonical_process_records.authority_profile, schema.properties.profile.const);
  assert.equal(draft.review.decision, 'HOLD');
  assert.equal(draft.review.execution_allowed, false);
  assert.equal(draft.learning.grants_authority, false);
  assert.equal(draft.external_delivery.wg_safe, 'NOT_SENT');
});
