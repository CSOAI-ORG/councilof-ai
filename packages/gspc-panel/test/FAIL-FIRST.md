# Fail-first proofs

Each guard test below was run against a deliberately unguarded implementation (a mutant) before the
real one was accepted, to show the test can fail. Mutants were built in /tmp copies on the 4090 builder on
2026-09-30; the committed code is the guarded version (all green).

## 1. UNMEASURED never shows a number; the attribution is always drawn (test/doctrine.test.js)

Mutant: `enforceDoctrine(m)` returned the model unchanged (figures, counts, host attribution and a
`javascript:` verify URL passed straight through). Result: **5 failed | 12 passed (17)**.

```
     × hostile UNMEASURED model: figures and counts are dropped 5ms
     × hostile UNCHECKABLE model: figures and counts are dropped 1ms
     ✓ live NOT_MEASURED server (councilof.ai/mcp/free, recorded) renders no number 12ms
     ✓ an unknown model id renders UNMEASURED with no number 1ms
     × a hostile UNMEASURED model relayed through A2UI still renders no number 1ms
     ✓ subject "https://councilof.ai/mcp" 2ms
     ✓ subject "https://tandem.ac/mcp" 3ms
     ✓ subject "https://councilof.ai/mcp/free" 1ms
     ✓ subject "94b8831311c24df5e7d93e1f1dc989d24639bbe64abc4034a51d78a0306508e1" 5ms
     ✓ subject "llama3.2:3b" 1ms
     ✓ subject "no-such-model:1b" 1ms
     ✓ subject "claimreg-hiring-platforms-2026-09-24-rev2" 1ms
     ✓ subject "" 1ms
     ✓ subject "not a subject <b>" 1ms
     × a host cannot rename or unlink the attribution 2ms
     × a refused A2UI surface still carries the attribution 1ms
     ✓ no rendered subject uses verdict, ranking or price words 6ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 5 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  test/doctrine.test.js > UNMEASURED never shows a number > hostile UNMEASURED model: figures and counts are dropped
 FAIL  test/doctrine.test.js > UNMEASURED never shows a number > hostile UNCHECKABLE model: figures and counts are dropped
 FAIL  test/doctrine.test.js > UNMEASURED never shows a number > a hostile UNMEASURED model relayed through A2UI still renders no number
 FAIL  test/doctrine.test.js > attribution is always drawn > a host cannot rename or unlink the attribution
 FAIL  test/doctrine.test.js > attribution is always drawn > a refused A2UI surface still carries the attribution
      Tests  5 failed | 12 passed (17)
```

(At that run the attribution string was "Measured by GSPC · Council of AI"; the lead renamed it to
"Evidence by GSPC · Council of AI" the same day and the tests follow the new string.)

## 2. A white-label config that hides or renames the attribution is rejected (test/config.test.js)

Mutant: `normalizeConfig(raw)` applied whatever the host passed. Result: **15 failed (15)**.

```
     × accepts a partner config: name, logo, frame theme, locale, host context, read-only connectors 3ms
     × rejects {"attribution":false} 1ms
     × rejects {"hideAttribution":true} 0ms
     × rejects {"attributionText":"Acme Evidence"} 0ms
     × rejects {"showAttribution":false} 0ms
     × rejects {"poweredBy":"Acme"} 0ms
     × rejects {"verifyUrl":"https://acme.example/verify"} 0ms
     × rejects {"footer":"none"} 0ms
     × rejects {"branding":{"hide":true}} 0ms
     × rejects {"theme":{"--gspc-attribution-display":"none"}} 0ms
     × rejects {"theme":{"--gspc-footer-bg":"transparent"}} 0ms
     × rejects {"theme":{"--gspc-accent":"red; display:none"}} 0ms
     × rejects {"assistantName":"Evidence by Acme"} 0ms
     × rejects {"assistantName":"GSPC Council of AI Assistant"} 0ms
     × a rejected config is not partly applied, and the panel still carries the attribution 1ms
⎯⎯⎯⎯⎯⎯ Failed Tests 15 ⎯⎯⎯⎯⎯⎯⎯
      Tests  15 failed (15)
```
