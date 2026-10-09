# MEOK on LFX.dev

LFX.dev (Linux Foundation Projects Dashboard) is the public face of every
LF-hosted project. MEOK is a **sandbox** member, which gives us:

- A canonical project home (CLA, DCO, governance, security advisories).
- A mentorship pipeline (LFX Mentorship → contributor → maintainer).
- A landing-page presence on the CNCF / LF landscape.
- LF-branded badges (security, accessibility, sustainability, OS-native).

This directory contains the six artifacts MEOK ships to LFX:

| File | Role |
|------|------|
| `lfx-project.json` | Project metadata (name, slug, governance, CLA/DCO, repos) |
| `lfx-mentorship.json` | Mentee/mentor pairings for the 33 hives (LFX Mentorship 2026) |
| `lfx-events.yaml` | Upcoming talks + workshops (LFN Developer Forum, OSSummit NA/EU) |
| `lfx-landscape.yaml` | Placement in the LF landscape (cloud + edge + AI + security) |
| `lfx-badges.yaml` | Earned / target badges per LF badge program |

## Pipeline

1. **Project onboarding** — `lfx-project.json` is what LFX staff use to
   provision the dashboard, mail lists, and Slack.
2. **Mentorship** — quarterly pairings, 1 mentor per hive, 4 mentees per
   mentor.
3. **Talks** — submitted via the OSSummit / LFN CfP systems.
4. **Landscape** — auto-ingested from `lfx-landscape.yaml`; shows MEOK
   under Cloud-Native Edge + AI + Security.
5. **Badges** — earned via Best Practices Badge Program (security,
   accessibility, etc.).

## License

Apache-2.0 — MEOK AI OS.
