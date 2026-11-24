# Daily intake: outside organisations' public feeds, and the rights line for each

Read on 2026-11-24 (UTC). Extends `scripts/watchdog_intake.py` (see `DAILY-CONSOLIDATION-2026-10-30.md`). Each source stores a **count and a body hash only**, never content and never a person's name. No login, no key, no bot challenge. Each source is probed once a day with the intake's own user agent. `grid` is empty for all five: no axis mapping was defensible, so none of them raises a charter obligation. Rights lines are a reading of public terms by an automated session, unreviewed by a lawyer.

## Added (5)

| id | kind | address | what is counted | rights line |
|---|---|---|---|---|
| `mcp-registry` | agent-registry | `registry.modelcontextprotocol.io/v0.1/servers?limit=100` | servers on the first page (page size, not a total; the API returns a cursor) | The registry's published terms dedicate Registry Data to the public domain (CC0 1.0). The documented read API needs no login. The host serves no robots.txt (404). |
| `inspect-evals` | evaluation-registry | `api.github.com/repos/UKGovernmentBEIS/inspect_evals/contents/src/inspect_evals` | directory entries (folders and files together) | MIT-licensed repository, read through GitHub's documented REST API. GitHub's acceptable-use policy separates scraping from API collection. Anonymous rate limit applies (shared with the pinned `ghsa-api`). |
| `agentsociety-releases` | simulator-release | `api.github.com/repos/tsinghua-fib-lab/AgentSociety/releases?per_page=30` | releases on the page (at most 30) | Apache-2.0 repository, same GitHub API route. Release titles and authors are never stored. |
| `hf-benchmark-datasets` | evaluation-registry | `huggingface.co/api/datasets?filter=benchmark:official&limit=1000` | datasets the Hub tags as official benchmarks (63 on the day read, below the limit, so the whole list) | Documented public Hub API on a host already pinned (`hf-models`). robots.txt allows `/`. The terms read carry no clause against reading the public API. |
| `epoch-notable-models` | model-dataset | `epoch.ai/data/notable_ai_models.csv` | data rows (header excluded; 1,102 on the day read) | The data page says the datasets are free to download and may be reproduced with credit under CC BY. robots.txt disallows only `/assets/` and a benchmark-problems path. **No terms-of-use page was found** at the addresses tried (404), so this line rests on the data page's own statement. Credit: Epoch AI, https://epoch.ai/data. The file is about 2.3 MB and includes an authors column that the intake never reads or stores. |

A source that later fails is recorded UNREACHABLE (or UNCHECKABLE) with no count, never zero. A count is a catalogue size or a page size, not a measurement of anything listed.

## Rejected, with the reason

| candidate | reason |
|---|---|
| OpenRouter public provider and model endpoints beyond the pinned catalogue | The public `/api/v1/providers` answers 200, but OpenRouter's terms (section 7) bar using scripts, robots or crawlers to "scrape or copy any information on the Site or the Services". Not read as permission, so not added. **For the owner:** the already-pinned `openrouter` catalogue row rests on the same terms; it was left unchanged here and is worth a decision. |
| AIUC-1 public changelog | The changelog is an HTML page, with no feed or documented machine-readable address, and no terms page was found (`/terms` returned 404). Counting HTML would invent a number. |
| Cloud Security Alliance STAR registry | The registry is an HTML page. No documented public API was found and no terms-of-use page was found at the address tried (404). robots.txt disallows `/special/` and `/download/`. Unverified whether a public API exists. |
| Artificial Analysis public data / API | The terms grant use of the site "solely for your own personal, noncommercial use" and bar commercial exploitation of site content; the API needs a key. |
| Crowd-voted leaderboard named in the brief (host omitted) | The leaderboard page answered a plain request with 403 (a bot challenge). Its terms page rendered no readable text without a browser. Not added; a challenge is out of scope. |

Not done: no source was added beyond five; nothing is graded, ranked or mapped to a company.
