# Anthropic External Researcher Access Program: form answers. DRAFT, NOT SUBMITTED

Status: HELD. Owner asks: (1) choose the Claude Console organisation that should receive the credits (the company org, not a personal one) and paste its Organization ID; (2) pick the profile link; (3) rewrite the two long answers in your own words; (4) submit the form yourself. Submitting means accepting Anthropic's Terms of Service, which is an owner action.

Form: https://forms.gle/pZYC8f6qYqSKvRWn9 (field labels read from the live form on 2026-09-28). Anthropic evaluates submissions "on the first Monday of each month". The next review dates are 2026-10-05, 2026-11-02, 2026-12-07 and 2027-01-04. The form states the standard award as USD 1,000 in API credits, with higher amounts in "rare special cases".

The same two long answers can be reused for the OpenAI Researcher Access Program, whose applications "are reviewed once every 3 months (in March, June, September, and December)". Its next review is December 2026.

---

| Field | Draft answer |
|---|---|
| Name of primary contact | Nicholas Templeman (owner confirms) |
| Name of organization | CSOAI Ltd (Council of AI), UK Companies House 16939677 |
| Recommended by an Anthropic employee? | No (owner confirms) |
| Employee name | (leave blank) |
| Organization ID | OWNER: from console.anthropic.com/settings/organization |
| More than the standard credit amount? | No |
| Would a low quality of service be a significant hindrance? | No. The runs are batch jobs, and each item records its own transport outcome, so a refused call is logged and retried rather than lost. |
| Google Scholar or GitHub profile | OWNER chooses. Suggest the organisation's Hugging Face page https://huggingface.co/csoai in Additional Information, since that is where the data lives |
| Located within the United States? | No |

## Team (under 200 words)

CSOAI Ltd is a small independent UK company that measures what AI models and agent tools actually do and publishes the results as signed records anyone can check offline. We issue no marks of conformity and no pass/fail labels, and verification is free.

OWNER: one or two sentences on your own background and anyone else who works on the project.

What a reviewer can check today: a public board of 23 measured axes (GET https://councilof.ai/api/gspc); a signed card index where all 335 cards verify (GET https://councilof.ai/api/state, card_chain.bodies_verified_valid); a dated corrections ledger with 78 entries (GET https://councilof.ai/api/corrections); open datasets at https://huggingface.co/csoai; and two individual Internet-Drafts at the IETF on third-party measurement statements. Much of the engineering runs through AI coding agents under the founder's direction, and every public number is read from a live endpoint.

## Research and why credits matter (under 300 words)

Topic: independent, recomputable measurement of frontier-model behaviour on frozen question banks, with statistical separation tests published alongside the results.

Our public board has 14 model-comparison axes, among them governance, safety, provenance and continuity. It states its own limitation: "0 of 14 model-comparison axes separated a leader · 8 TIE · 6 UNTESTED". Six axes have never had a separation test, so a reader cannot tell whether a point-estimate lead on them is a real difference.

With these credits we would run current Claude models on the same frozen banks, with the same deterministic grader, and keep every per-item row. We would then run the paired separation tests on the six untested axes and publish each result as a signed record with its rows, whether it comes out SEPARATED or TIE. We would also compare what model documentation declares against what the banks observe, and publish any gap as found.

Why credits matter: CSOAI Ltd is self-funded, and model access is the main marginal cost of a re-run. Without access, Claude models are listed as UNMEASURED on the re-run rather than estimated. We do not fill a missing model with a guess.

Every result would be published whatever it shows, including results unfavourable to Claude. Credits from Anthropic would not change what we publish, and we would say in each record that the run used researcher-access credits.

## Additional information (optional)

Data and rows: https://huggingface.co/csoai. Verification guide: https://councilof.ai/signed/HOW-TO-VERIFY.md. Methodology record DOI 10.5281/zenodo.21991104.

---

Owner checklist: re-read the three live endpoints above before submitting, and replace any figure that has moved. Run the outward gate (lane grants-20260928, docs/grants/2026-09-28/gate_drafts.py) on the final text, and submit only at 100%.
