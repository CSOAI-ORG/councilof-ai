# Shared AI and tools controls

This change implements the first usable slice of the MEOK/CouncilOS selection
contract in the existing public Council conversation. It does not install a model,
enable another provider, change Company-case routing, or qualify offline operation.

The shared controlled React view is AIAndToolsControl. It accepts a selection and
onChange callback; it has no credentials, persistence, case store or model client.
A MEOK host can reuse it after its canonical source and request adapter are qualified.
MEOK's separate website is not wired by this PR.

The public TalkPanel captures a selection for each question and sends
forwardedProps.execution. The server validates the entire envelope before running.
The whole backend/frontend tool plan is checked before any call or page-action event.
No selected tool means no planned tool calls; it does not turn the website offline.
Confirmation intersects the original task's choices with current restrictions,
so an old confirmation cannot expand either selection.

The descriptor publishes the actual selectable conversation tools, including page
actions. The default remains the published tool set. Once the user selects tools,
that explicit list is sent and obsolete names are rejected. These settings apply
only to this public conversation; standalone ToolRunner, external plugins, Company
cases and other agents retain their separate controls and existing authority.

The current public answer path is deterministic tool routing, with no AI model.
The control states that directly. Local, paired-computer, other-provider and offline
options remain unavailable with a visible reason. In the recovered local gateway,
local inference can still be preceded by an online board refresh. Offline therefore
requires a qualified installed runtime, pinned cache, local voice/assets, denied
external egress and restricted plugins. No silent cloud fallback is acceptable.

Integration order after this slice:
1. Qualify the existing MEOK request adapter and its local model inventory.
2. Reuse this controlled view with that adapter's authoritative readiness choices.
3. Qualify existing hosted provider grants/budgets and destination-scoped context.
4. Qualify offline across board/cache, assets, voice, telemetry and tool effects.
5. Verify same-task checkpoint handoff without duplicate dispatch.

Tests cover selection validation, server rejection/no-dispatch, UI selection and
readiness states. A passing unit test is not runtime or offline acceptance.
The full specification remains in the existing Busabase audit request
crqmw4dk5xvmsn0jdy, marker MEOK_CSOAI_LOCAL_CLOUD_UX_20261107.
