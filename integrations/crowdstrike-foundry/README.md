# GSPC evidence for CrowdStrike Falcon Foundry

A Foundry app skeleton: one UI extension on the endpoint-detection, host and XDR-case detail panels
(`activity.detections.details`, `hosts.host.panel`, `xdr.cases.panel`) and one app page, both serving
the GSPC evidence panel. Apache-2.0. Evidence by GSPC · Council of AI. Measurement, not certification.
**Not deployed, not submitted to the Foundry marketplace, no partnership implied.**

Shape follows CrowdStrike's public samples (`foundry-sample-foundryjs-demo`,
`foundry-sample-detection-translation`; manifest_version 2023-05-09) and the Foundry docs
(developer.crowdstrike.com/foundry: quickstart-cli, ui-extensions), read 30 Sep 2026.

- `manifest.yml`: the extension, the page, navigation; `connect-src https://councilof.ai` in both CSPs.
- `ui/extensions/gspc-evidence/src/app.js`: connects with `@crowdstrike/foundry-js`, follows the Falcon
  light/dark theme, and suggests the first https URL in the open record as the subject (the analyst can
  change it). Only that subject is sent to councilof.ai, and only when read. The record itself goes to
  the panel as `hostContext`, which never leaves the browser. Outside Falcon it runs standalone.
- `ui/extensions/gspc-evidence/src/gspc-panel.js`: the published panel bundle (`integrations/vendor-panel.mjs`).
- `npm install && npm run build` in `ui/extensions/gspc-evidence` writes `dist/` (tested on the 4090 builder).

UNMEASURED: whether Foundry honours an external `connect-src` for UI extensions (the docs we could
read do not list the allowed directives). If it does not, the fallback is a Foundry API integration
declaring councilof.ai's OpenAPI (`https://councilof.ai/openapi/gspc.json`) and calling it through
`falcon.apiIntegration(...)`; not built.

## Owner steps (the owner's trial tenant; needs the Foundry CLI and its own API scopes)

```sh
brew tap crowdstrike/foundry-cli && brew install crowdstrike/foundry-cli/foundry   # or the Linux release
foundry version
foundry login            # browser form: pick the tenant (CID) and the minimum permissions it offers for
                         # app development (app manager read/write); name the profile e.g. nicholas-trial
cd integrations/crowdstrike-foundry
(cd ui/extensions/gspc-evidence && npm install && npm run build)
foundry apps deploy      # change type: Minor; changelog: "GSPC evidence panel 0.1.0"
foundry apps release     # change type: Minor
```

Then in Falcon: **Foundry → App catalog → GSPC evidence → Install now → Save and install**, open any
endpoint detection or host, and the panel is in the detail panel. `app_id` in `manifest.yml` is empty on
purpose: `foundry apps deploy` fills it on first deploy (commit that change).
