# GSPC evidence for Splunk

A minimal Splunk app (`gspc_evidence/`): one Simple XML dashboard that lists the GSPC evidence
events in your indexes (OCSF 1.9 Detection Finding and ECS 8.17 over HEC, as written by
`packages/evidence-fabric/render/ocsf.py` and `render/ecs_hec.py`) and shows the GSPC evidence panel
for the subject you type or click. Apache-2.0. Evidence by GSPC · Council of AI. Measurement, not
certification. **Not published to Splunkbase; no partnership implied.**

- `default/props.conf`: sourcetypes `csoai:evidence:ecs` and `csoai:evidence:ocsf` (JSON), with
  `gspc_subject` / `gspc_state` field aliases. The events carry states, never a risk score.
- `default/data/ui/views/gspc_evidence.xml`: the table (click a row to open its subject) and the panel.
- `appserver/static/gspc_panel_loader.js`: mounts `<gspc-evidence-panel>` and follows `$gspc_subject$`.
- `appserver/static/gspc-panel.js`: the published panel bundle (`integrations/vendor-panel.mjs`).
- `samples/`: the evidence-fabric golden outputs (FIXTURES: synthetic events that measure nothing).

## Install (owner step, any Splunk Enterprise 9.x you control)

```sh
tar czf gspc_evidence.tgz -C integrations/splunk-app gspc_evidence
# Splunk Web: Apps → Manage Apps → Install app from file → gspc_evidence.tgz → restart if asked
# or: $SPLUNK_HOME/bin/splunk install app gspc_evidence.tgz -auth admin:<password>
# sample data (fixtures), into a test index:
$SPLUNK_HOME/bin/splunk add oneshot integrations/splunk-app/gspc_evidence/samples/hec.ndjson -sourcetype csoai:evidence:ecs -index main
$SPLUNK_HOME/bin/splunk add oneshot integrations/splunk-app/gspc_evidence/samples/ocsf.ndjson -sourcetype csoai:evidence:ocsf -index main
```

The panel fetches `https://councilof.ai` from the browser. If your Splunk Web sends a Content
Security Policy that blocks it, allow `https://councilof.ai` for `connect-src` in `web-features.conf`
(Splunk 9.1+ dashboards CSP settings) or your proxy. UNMEASURED: the app has not been run inside a
Splunk instance or through AppInspect; the checks here are configparser, XML and bundle-pin checks
(`node --test integrations/integrations.test.mjs`).
