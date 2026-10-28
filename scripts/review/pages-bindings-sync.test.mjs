import {test} from 'node:test';
import assert from 'node:assert/strict';
import {declaredNamespaces, remoteNamespaces, planBindings, desiredKvMap} from './pages-bindings-sync.mjs';

// WHY A TEST FOR THIS SCRIPT. It is the only tool in the repository that can WRITE to the
// production Pages configuration. A tool that writes must be able to refuse: every case
// below is a way the write could go wrong, and each one has to be refused rather than
// applied. A writer with no failing case is a writer nobody can trust.

test('declaredNamespaces keeps every entry, including a malformed one, so it can be NAMED and refused', () => {
  const declared = declaredNamespaces({
    kv_namespaces: [
      {binding: 'LEADS', id: '8c460488aa6444c187890a579511bf93'},
      {binding: 'HITL_KV', id: '76e668160bba4866b0d2926bbefdec07'},
      {binding: 'HITL_KV', id: '76e668160bba4866b0d2926bbefdec07'},
      {binding: 'lowercase', id: '8c460488aa6444c187890a579511bf93'},
      {binding: 'NO_ID'},
    ],
  });
  // A dropped entry is a binding DELETED from production, because the write replaces the
  // whole kv_namespaces map. Every entry has to survive to the plan, which refuses it.
  assert.deepEqual(declared.map(d => d.binding), ['LEADS', 'HITL_KV', 'lowercase', 'NO_ID']);
});

test('an invalid binding name is refused, never dropped', () => {
  const plan = planBindings({
    declared: [{binding: 'lowercase', id: '8c460488aa6444c187890a579511bf93'}],
    remote: {},
    accountNamespaceIds: ['8c460488aa6444c187890a579511bf93'],
  });
  assert.equal(plan.unknownIds.length, 1);
  assert.equal(plan.applyable, false);
  assert.match(plan.refusals.join(' '), /not a valid Pages binding name/);
});

test('remoteNamespaces reads the PRODUCTION deployment config, not the project top level', () => {
  const project = {
    deployment_configs: {
      production: {kv_namespaces: {LEADS: {namespace_id: '8c460488aa6444c187890a579511bf93'}}},
      preview: {kv_namespaces: {LEADS: {namespace_id: 'deadbeefdeadbeefdeadbeefdeadbeef'}}},
    },
    kv_namespaces: {SOMETHING_ELSE: {namespace_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'}},
  };
  assert.deepEqual(remoteNamespaces(project), {LEADS: '8c460488aa6444c187890a579511bf93'});
});

test('a missing binding is missing, not extra', () => {
  const declared = [{binding: 'HITL_KV', id: '76e668160bba4866b0d2926bbefdec07'}];
  const plan = planBindings({declared, remote: {}, accountNamespaceIds: ['76e668160bba4866b0d2926bbefdec07']});
  assert.deepEqual(plan.missing.map(m => m.binding), ['HITL_KV']);
  assert.deepEqual(plan.extra, []);
  assert.equal(plan.in_sync, false);
  assert.equal(plan.applyable, true);
});

test('a binding pointing at the WRONG namespace is reported as mismatched, not silently kept', () => {
  const declared = [{binding: 'HITL_KV', id: '76e668160bba4866b0d2926bbefdec07'}];
  const plan = planBindings({
    declared,
    remote: {HITL_KV: '11111111111111111111111111111111'},
    accountNamespaceIds: ['76e668160bba4866b0d2926bbefdec07', '11111111111111111111111111111111'],
  });
  assert.equal(plan.mismatched.length, 1);
  assert.equal(plan.mismatched[0].remote_id, '11111111111111111111111111111111');
  assert.equal(plan.applyable, true);
});

test('a declared id that does not exist on this account REFUSES the write', () => {
  const declared = [{binding: 'HITL_KV', id: '76e668160bba4866b0d2926bbefdec07'}];
  const plan = planBindings({declared, remote: {}, accountNamespaceIds: ['11111111111111111111111111111111']});
  assert.equal(plan.unknownIds.length, 1);
  assert.equal(plan.applyable, false);
  assert.match(plan.refusals.join(' '), /no KV namespace with this id exists on this account/);
});

test('a malformed declared id REFUSES the write', () => {
  const declared = [{binding: 'HITL_KV', id: 'TBD_CREATE_NAMESPACE'}];
  const plan = planBindings({declared, remote: {}, accountNamespaceIds: []});
  assert.equal(plan.unknownIds.length, 1);
  assert.equal(plan.applyable, false);
});

test('an EXTRA production binding is never deleted automatically', () => {
  const declared = [{binding: 'LEADS', id: '8c460488aa6444c187890a579511bf93'}];
  const plan = planBindings({
    declared,
    remote: {LEADS: '8c460488aa6444c187890a579511bf93', PAL_MEMORY_KV: '22222222222222222222222222222222'},
    accountNamespaceIds: ['8c460488aa6444c187890a579511bf93', '22222222222222222222222222222222'],
  });
  assert.equal(plan.extra.length, 1);
  assert.equal(plan.extra[0].binding, 'PAL_MEMORY_KV');
  assert.equal(plan.applyable, false);
  assert.match(plan.refusals.join(' '), /never deletes/);
});

test('an in-sync production config needs no write at all', () => {
  const declared = [{binding: 'LEADS', id: '8c460488aa6444c187890a579511bf93'}];
  const plan = planBindings({declared, remote: {LEADS: '8c460488aa6444c187890a579511bf93'}, accountNamespaceIds: ['8c460488aa6444c187890a579511bf93']});
  assert.equal(plan.in_sync, true);
  assert.equal(plan.applyable, false);
  assert.deepEqual(plan.refusals, []);
});

test('desiredKvMap writes the shape Cloudflare expects', () => {
  assert.deepEqual(desiredKvMap([{binding: 'LEADS', id: '8c460488aa6444c187890a579511bf93'}]), {
    LEADS: {namespace_id: '8c460488aa6444c187890a579511bf93'},
  });
});

test('an account-id list that could not be read does not silently pass every id', () => {
  // accountNamespaceIds === null means "unknown". The plan must not then claim the id
  // exists. It reports it as unknown, which refuses the write. An unknown is never a yes.
  const declared = [{binding: 'HITL_KV', id: '76e668160bba4866b0d2926bbefdec07'}];
  const plan = planBindings({declared, remote: {}, accountNamespaceIds: null});
  assert.equal(plan.unknownIds.length, 1);
  assert.equal(plan.applyable, false);
});
