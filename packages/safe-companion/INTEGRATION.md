# Integrating the Council SAFE reader

Reviewed 6 November 2026. This is an independent Council component for the Starter Kit's project-defined exports. A local integration example is included; no installation in LFX, the Alliance website or a partner product is asserted.

## Choose the boundary

| Need | Supported route | Authority still required |
|---|---|---|
| Inspect a restricted export | Reviewed standalone copy in a trusted browser, or the local CLI | Authorised possession and handling of the export |
| Add the reader to a site you control | Copy the complete asset directory; use `embed.mjs` below | Host operator accepts and serves the code under its own policy |
| Make the reader discoverable in LFX | An authorised person adds a document link using LFX's existing UI | Project or group write access, an approved destination and sharing scope |
| Read LFX project context | LFX's official MCP service in a supported authenticated client | MCP-enabled LFID, appropriate LFX permissions and authorised use of the returned data |
| Approve or execute an action | Existing separate authority and executor services | Authenticated human approval of exact action; scope, expiry and revocation checks; independent effect evidence |

## Self-hosted component

Copy the generated reader directory as one unit, including licence and manifest. `element.mjs`, `reader.mjs`, `schemas.mjs`, `examples.mjs` and `embed.mjs` must remain together. Modules import siblings relative to their own URL, so a subdirectory such as `/tools/review/safe/` works without changing the source. Serve `.mjs` as JavaScript over HTTPS or a trusted localhost origin. Do not send local files to a server to make this work.

```html
<section id="safe-reader" aria-label="Local SAFE export reader"></section>
<script type="module" src="./host-reader.mjs"></script>
```

```js
// host-reader.mjs, trusted host code:
import { mountSafeCompanion } from './safe/embed.mjs';

const mounted = await mountSafeCompanion(
  document.getElementById('safe-reader'),
  { compact: true, styleNonce: /* trusted server-generated CSP nonce */ nonce },
);

// On route teardown or explicit close:
mounted.destroy();
```

`styleNonce` is optional only when the host's style policy already allows the component's style blocks. Obtain it from trusted host configuration, never from an uploaded export or URL parameter. The adapter sets `style-nonce` before connecting the component. A host that uses script nonces must also authorise its own module loader and module dependencies. The component cannot relax a host's CSP.

The small API accepts only `compact` (boolean) and `styleNonce` (CSP nonce string). `mountSafeCompanion` returns a promise for an object with one method, `destroy()`. Destroy is idempotent, removes only that mounted component and clears its selected original and derived state. It cannot erase a file or assessment already downloaded by the user. Host containers must be connected elements in the current document; one active mount per container is allowed. No file, context, token, callback or remote URL is accepted.

Version conflicts fail explicitly. The adapter requires exported component version `0.2.1` and a registered constructor declaring version `0.2.1` plus protocol `csoai.safe-companion.mount/1`. An existing compatible registration from a cache-versioned module URL is reused; older, unversioned or incompatible registrations are refused and never overwritten. These markers check compatibility inside a trusted host; they do not authenticate code or protect against other host scripts. Prefer one coherent asset directory and reload the page to resolve an incompatible registration.

Failures use fixed codes: `HOST_UNAVAILABLE`, `HOST_ALREADY_MOUNTED`, `OPTIONS_UNSUPPORTED`, `STYLE_NONCE_INVALID`, `WEBCRYPTO_UNAVAILABLE`, `COMPONENT_VERSION_CONFLICT`, or `COMPONENT_LOAD_FAILED`. Show a fixed accessible error with a standalone fallback; avoid exposing browser exceptions or local file details in public telemetry.

Open `integration.html` to exercise mount, manual file selection and removal. This is a neutral reference host with no LFX branding, login or private data bridge. Its fixed nonce is a test fixture. A production server using nonces must generate an unpredictable nonce for each response and put the same value in the response policy and authorised elements. The fixture has no `unsafe-inline` style exception and performs no external requests.

## Privacy and host policy

Shadow DOM isolates component styling, not trust. Other scripts on the host can inspect the element and selected data; the adapter makes no claim of isolation from them. For restricted records, prefer the reviewed standalone copy. Do not add `postMessage`, custom events carrying export contents, URL query/fragment transfers, clipboard polling, automatic export downloads, authentication cookies, or host account state to this adapter.

No iframe integration is asserted. A separate-origin deployment needs its own access, CSP and frame policy review. `frame-ancestors` must be delivered as an HTTP header; the HTML meta policy is not sufficient. Combining `allow-scripts` and `allow-same-origin` on a same-origin sandboxed frame does not establish a safe boundary. If an iframe is later required, test file selection, WebCrypto, downloads, keyboard focus and teardown in the actual target; retain a standalone fallback and avoid any document-data message bridge.

## A real LFX discovery route

The Linux Foundation's **Manage Documents**, updated 6 November 2026, documents adding links for users with write access. This is a link to the reader, not a widget installed inside LFX. No link has been created by this package.

1. Sign in at `https://app.lfx.dev` and choose the intended project or foundation with the lens switcher.
2. Open **Documents**, then **Add Link**. For a group link, instead open **Groups → the group → Documents**; group write access is required.
3. Enter the reviewed reader's actual **Link URL** and **Title**. Both are required. A suggested title is `Council SAFE export reader — independent local inspection`.
4. Optionally choose a folder and add a description: `Inspect supported Starter Kit exports locally. Unsigned diagnostics; no approval or execution authority.`
5. An authorised operator reviews the destination and sharing context, then confirms in LFX. Do not include restricted evidence, identities or access tokens in the URL or description.

Use an actually served, reviewed destination. This source package does not establish that a public deployment exists. The **Project** Add Link control always adds to project documents, regardless of the currently selected source tab; use the group's own page when that is the intended scope. If the control is unavailable, this package supplies no bypass.

Source: [LFX Manage Documents](https://app.lfx.dev/docs/documents/manage-documents).

## LFX MCP is a separate authenticated connection

The official service is `https://mcp.lfx.dev/mcp`. Its [connection guide](https://github.com/linuxfoundation/lfx-mcp/blob/dda9a46399d87e60d769fc57ab506b0ab92c26e6/README.md) and [community-access guide](https://github.com/linuxfoundation/lfx-mcp/blob/dda9a46399d87e60d769fc57ab506b0ab92c26e6/docs/community-access.md) require a supported client, an MCP-enabled LFID and existing LFX permissions. The service also includes mutation tools; connecting is not equivalent to a read-only session. This reader neither connects nor authenticates.

A future Council context adapter can explicitly allow only needed read tools, beginning with `search_projects` and `get_project`. Discover the caller-visible schemas with authenticated `tools/list`; preserve pagination, partial-result warnings and collection completeness. Do not infer a project UID or entitlement from Alliance membership. Keep project-context references separate from SAFE export inspection, and do not interpret a meeting, committee seat, LFX badge or login as permission for a specific action.

The pinned [project tool implementation](https://github.com/linuxfoundation/lfx-mcp/blob/dda9a46399d87e60d769fc57ab506b0ab92c26e6/internal/tools/project.go) supplies structured project results. No reviewed evidence establishes an LFX custom-widget host or a public SAFE submission API. Account access, actual result shapes and any project association remain untested here. Existing LFX documents, meetings, groups, voting, training and badges remain their own systems.

## Required integration checks

- At root and nested paths, all module requests stay within the copied directory.
- Under the target CSP, component styles are applied only with the expected nonce; no policy relaxation or external request is introduced.
- A pre-registered incompatible component fails clearly without replacing it; double mounting a host fails; independent hosts remain separate.
- Closing removes the component and clears selected data; reopening begins empty. An interrupted load must not populate a detached container.
- Keyboard users can reach the host controls, file input, results and fallback. Failure and removal have clear status messages.
- Imported text renders as text. No host context or file data is sent through messages, analytics or storage.
- Existing positive and negative reader cases still run; mounting a reader never creates approval, execution or an official assessment.

Browser references: [CSP Level 3, 27 October 2026 working draft](https://www.w3.org/TR/2026/WD-CSP3-20261027/), [HTML iframe standard](https://html.spec.whatwg.org/multipage/iframe-embed-object.html), [Web Cryptography Level 2, 22 April 2025 working draft](https://www.w3.org/TR/2025/WD-webcrypto-2-20250422/). Browser qualification is still needed for the intended deployment; these references are not product acceptance.
