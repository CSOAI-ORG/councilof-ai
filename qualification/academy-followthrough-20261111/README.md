# Academy continuation: reading, self-study and retained review history

This continues the completed Academy evidence release in PR #4209 from master
`ccd06e2d625f5cdc3b8d1f955177dabd3a1c6ed9`. The containing commit identifies the
candidate source. This directory records source qualification, not a production
deployment or an authenticated human approval. Release and browser acceptance
are recorded separately after the normal GitHub Actions production lane.

## Executable changes

- `/learn?track=practice` and the other existing tracks have exact share links,
  explicit reading marks, a next unread step, and JSON backup/restore. The
  SHA-256 version binds the track metadata, ordered step labels and links; it
  does not freeze the contents of the linked live pages. Changed versions do
  not inherit marks. Unsaved state survives detected competing-tab writes and
  blocked storage. Reading marks are a local checklist, not an assessment.
- The stray `/courses/:id` legacy enrollment route now uses the same content
  review notice as the held catalogue/player and offers the current learning
  routes. The existing 49 regulatory modules remain held. The source inventory
  still contains 64 heterogeneous records, 11 served records and nine
  reproducibility exercises; these are not counts of newly launched courses.
- `/academy/exercises/#self-study` now provides two before questions, a lesson
  connected to the existing signed-card exercise, two after questions and two
  distinct transfer scenarios. It retains first responses and skips, provides
  delayed explanations, and exports/resumes ordinary canonical evidence
  events. The six questions are public, inspectable practice material.
- `academy_learning_import.py` validates the original browser events and
  supplies the existing seven-section learning report. An evaluation card is
  explicitly supplied report context, not proof the reader saw that card.
  Transfer remains separate from after-lesson and retention observations.
- The existing strict HITL history reader rejects corrupt, missing, changed or
  misbound retained records without presenting partial history or counts as a
  successful read. Valid historical receipt keys remain readable and stored
  bytes remain unchanged. Signature presence is no longer described as an
  authenticated Council signer; this reader does not verify signatures.

## Qualification

The focused source checks comprise 27 Academy delivery tests, 94 HITL tests,
33 Node exercise/self-study tests and 57 Python report/import tests. The
existing ten Hugging Face asset tests and 25 SEO-head tests also passed.
Independent code review found and resolved asynchronous restore after
navigation, conflicting-tab data loss, duplicate JSON ambiguity, repeated
substantive questions with renamed identifiers, malformed observations and
misleading signature attribution.

The existing CI workflow now runs the new Python importer tests, the Academy
Node tests and the inventory consistency check. No protected release gate or
execution hold is removed. Generated exercise metadata, source content promises
and targeted TypeScript checks were also verified locally. Hosted checks must
be assessed for the exact eventual PR head, not inferred from these results.

`m4-public-receipt-preflight.json` records an actual Apple M4 read of the two
public receipt projections at the stated time. The candidate reader accepted
both projections after passing them through its existing writer in memory and
preserved their bytes; a changed-note control was rejected. The test made no
production write and did not inspect private KV keys or authenticate signatures.
The receipt binds the compiled module and the exact `_hitl.ts` source digest.

## Remaining operational evidence

These changes establish working software behavior and retained local practice.
They do not enroll a human, appoint a reviewer, adopt a charter, authenticate a
decision, grant execution authority or measure learning gains. Genuine
approval-to-effect still follows the existing operator-acceptance candidate:
an accepted authenticated principal, current exact scope, qualified atomic
one-use store and executor, independent observation and a second receiver.

The WG-SAFE charter remains a separately attributed upstream reference. This
release does not adopt it or turn Council proposals into external decisions.
The earlier Hugging Face lesson index and Kaggle source-audit replay remain
available; neither is a learner trial or a new model evaluation.

## Reproduce the focused checks

```sh
npx vitest run client/src/lib/academyReadingProgress.test.ts \
  client/src/pages/Academy.reading.test.tsx \
  client/src/pages/CourseDetail.withdrawal.test.ts \
  client/src/pages/ContentReviewNotice.learning.test.tsx \
  functions/api/_hitl.test.ts functions/api/hitl-storage.test.ts \
  functions/api/hitl-queue.test.ts
node --test scripts/academy/*.node-test.mjs
python3 -m unittest discover -s packages/evidence-fabric/render \
  -p 'test_*learning*.py' -v
node scripts/academy/build-exercises.mjs --check
node scripts/academy/module-inventory.mjs --check
```

AI assistance was used for implementation, source review, synthetic negative
controls and scripted acceptance. Those actions are software qualification;
they are not genuine human assessment or independent organizational acceptance.
