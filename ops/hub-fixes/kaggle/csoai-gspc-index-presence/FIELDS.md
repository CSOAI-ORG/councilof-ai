# Field reference: nicktempleman/csoai-gspc-index-presence

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `2026-09-22/402index-walk-2026-09-22.json`

Top-level keys: `as_of`, `api`, `probes`, `finding`.
Records under `probes`:

| field | type | description |
|---|---|---|
| `probe` | string | Observed type string; non-null in 4/4 rows read; example: q=councilof.ai |
| `reported_total` | integer | Observed type integer; non-null in 4/4 rows read; example: 73 |
| `rows_walked` | integer | Observed type integer; non-null in 4/4 rows read; example: 73 |
| `pages` | integer | Observed type integer; non-null in 4/4 rows read; example: 2 |
| `stopped` | string | Observed type string; non-null in 0/4 rows read |
| `distinct_councilof_ai_urls` | integer | Observed type integer; non-null in 4/4 rows read; example: 23 |
| `walk_complete` | boolean | Observed type boolean; non-null in 4/4 rows read; example: true |
| `sample` | string | Observed type string; non-null in 4/4 rows read; example: ["https://councilof.ai/api/art50/marking-evidence?url=https:… |

## `2026-09-22/anchors-2026-09-22.json`

Top-level keys: `as_of`, `rekor`, `dois`, `ots`.
Records under `dois`:

| field | type | description |
|---|---|---|
| `doi` | string | Observed type string; non-null in 3/3 rows read; example: 10.5281/zenodo.22293340 |
| `doi_org_url` | url | Observed type url; non-null in 3/3 rows read; example: https://doi.org/10.5281/zenodo.22293340 |
| `http` | integer | Observed type integer; non-null in 3/3 rows read; example: 200 |
| `resolves_to` | url | Observed type url; non-null in 3/3 rows read; example: https://zenodo.org/records/22811459 |
| `landing_excerpt` | string | Observed type string; non-null in 3/3 rows read; example: GSPC board snapshot, 2026-09-15T07:13:43Z — 22 axes measured… |
| `mentions_us` | boolean | Observed type boolean; non-null in 3/3 rows read; example: true |
| `datacite_http` | integer | Observed type integer; non-null in 3/3 rows read; example: 200 |
| `title` | string | Observed type string; non-null in 3/3 rows read; example: GSPC board snapshot, 2026-09-15T07:13:43Z — 22 axes measured… |
| `publisher` | string | Observed type string; non-null in 3/3 rows read; example: Zenodo |
| `published` | string | Observed type string; non-null in 3/3 rows read; example: 2026 |
| `state` | string | Observed type string; non-null in 3/3 rows read; example: findable |
| `url` | url | Observed type url; non-null in 3/3 rows read; example: https://zenodo.org/doi/10.5281/zenodo.22293340 |
| `registered` | datetime | Observed type datetime; non-null in 3/3 rows read; example: 2026-09-04T04:48:17.000Z |

## `2026-09-22/deadlinks-2026-09-22.json`

Top-level keys: `as_of`, `source_list`, `method`, `rows`.
Records under `rows`:

| field | type | description |
|---|---|---|
| `registry` | string | Observed type string; non-null in 20/20 rows read; example: pypi |
| `package` | string | Observed type string; non-null in 20/20 rows read; example: csoai-gspc |
| `version` | string | Observed type string; non-null in 20/20 rows read; example: 0.2.20260915 |
| `field` | string | Observed type string; non-null in 20/20 rows read; example: project_url |
| `declared_url` | url | Observed type url; non-null in 20/20 rows read; example: https://pypi.org/project/csoai-gspc/ |
| `http` | integer | Observed type integer; non-null in 20/20 rows read; example: 200 |
| `final_url` | url | Observed type url; non-null in 20/20 rows read; example: https://pypi.org/project/csoai-gspc/ |
| `dead` | boolean | Observed type boolean; non-null in 20/20 rows read; example: false |

## `2026-09-22/directory-presence-2026-09-22.json`

Top-level keys: `as_of`, `method`, `terms`, `results`.
Records under `results`:

| field | type | description |
|---|---|---|
| `site` | string | Observed type string; non-null in 16/16 rows read; example: AgentNDX |
| `route` | url | Observed type url; non-null in 16/16 rows read; example: https://www.agentndx.com/search?q=csoai |
| `http` | integer | Observed type integer; non-null in 16/16 rows read; example: 404 |
| `final_url` | url | Observed type url; non-null in 16/16 rows read; example: https://www.agentndx.com/search?q=csoai |
| `title` | string | Observed type string; non-null in 16/16 rows read; example: AgentNDX - Your AI Sales Team, Live on the Web |
| `rendered_chars` | integer | Observed type integer; non-null in 16/16 rows read; example: 54 |
| `hits` | string | Observed type string; non-null in 16/16 rows read; example: {"CSOAI": "ntegrations… ⌘ K Advertise Submit Switch language… |
| `our_links` | string | Observed type string; non-null in 16/16 rows read; example: ["https://www.agentndx.com/search?q=csoai#main-content"] |
| `wall` | boolean | Observed type boolean; non-null in 16/16 rows read; example: false |
| `screenshot` | string | Observed type string; non-null in 16/16 rows read; example: shot-AgentNDX-https_www_agentndx_com_search_q_csoai.png |

## `2026-09-22/listings-2026-09-22.json`

Top-level keys: `as_of`, `method`, `results`.
Records under `results`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 21/21 rows read; example: mcpservers.org |
| `route` | url | Observed type url; non-null in 21/21 rows read; example: https://mcpservers.org/?q=csoai |
| `http` | integer | Observed type integer; non-null in 17/21 rows read; example: 200 |
| `final_url` | url | Observed type url; non-null in 17/21 rows read; example: https://mcpservers.org/?q=csoai |
| `title` | string | Observed type string; non-null in 16/21 rows read; example: Awesome MCP Servers |
| `chars` | integer | Observed type integer; non-null in 17/21 rows read; example: 7397 |
| `wall` | boolean | Observed type boolean; non-null in 17/21 rows read; example: false |
| `zero_results` | boolean | Observed type boolean; non-null in 17/21 rows read; example: false |
| `hits` | string | Observed type string; non-null in 17/21 rows read; example: {"CSOAI": "eams MCP.so Search MCP servers, tools, integratio… |
| `entry_links` | string | Observed type string; non-null in 17/21 rows read; example: ["https://smithery.ai/servers/csoai/gspc", "https://smithery… |
| `screenshot` | string | Observed type string; non-null in 17/21 rows read; example: shot-list-mcpservers.org-https_mcpservers_org_q_csoai.png |
| `error` | string | Observed type string; non-null in 4/21 rows read; example: Error: page.goto: net::ERR_NAME_NOT_RESOLVED at https://mcp-… |

## `2026-09-22/listings-pass3-2026-09-22.json`

Top-level keys: `as_of`, `results`.
Records under `results`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 5/5 rows read; example: mcpservers.org |
| `url` | url | Observed type url; non-null in 5/5 rows read; example: https://mcpservers.org/ |
| `term` | string | Observed type string; non-null in 4/5 rows read; example: csoai |
| `method` | string | Observed type string; non-null in 5/5 rows read; example: typed into the site's own search box |
| `http` | integer | Observed type integer; non-null in 5/5 rows read; example: 200 |
| `final_url` | url | Observed type url; non-null in 3/5 rows read; example: https://mcpservers.org/search?query=csoai |
| `chars` | integer | Observed type integer; non-null in 3/5 rows read; example: 1197 |
| `excerpt` | string | Observed type string; non-null in 3/5 rows read; example: MCP Servers Home Remote Servers Topics Agent Skills WebMCP B… |
| `hit` | boolean | Observed type boolean; non-null in 4/5 rows read; example: true |
| `zero` | boolean | Observed type boolean; non-null in 3/5 rows read; example: false |
| `our_links` | string | Observed type string; non-null in 3/5 rows read; example: ["https://mcpservers.org/servers/councilof-ai-mcp"] |
| `error` | string | Observed type string; non-null in 1/5 rows read; example: TimeoutError: locator.click: Timeout 25000ms exceeded. |
| `full_text` | string | Observed type string; non-null in 1/5 rows read; example: Pre-launch. Pre-launch build. Every record here is a dated o… |
| `nav` | string | Observed type string; non-null in 1/5 rows read; example: ["https://mcpverify.ai/", "https://mcpverify.ai/archive", "h… |

## `2026-09-22/mcp-registry-census-2026-09-22.json`

Top-level keys: `as_of`, `window_start`, `window_end`, `endpoint`, `page_size`, `pages_read`, `version_rows_read`, `distinct_server_names`, `walk_complete`, `stopped_at`, `our_server_names`, `note`.


## `2026-09-22/mcp-registry-servers.jsonl`

| field | type | description |
|---|---|---|
| `server` | string | Observed type string; non-null in 1287/1287 rows read; example: {"$schema": "https://static.modelcontextprotocol.io/schemas/… |
| `_meta` | string | Observed type string; non-null in 1287/1287 rows read; example: {"io.modelcontextprotocol.registry/official": {"status": "ac… |

## `2026-09-22/mcp-remote-health-2026-09-22.json`

Top-level keys: `as_of`, `source`, `our_version_rows`, `our_servers_with_isLatest`, `servers_whose_latest_declares_a_remote`, `servers_whose_every_latest_remote_is_dead`, `dead_hosts`, `canonical_live_remote`, `method`, `broken`, `all_rows`.
Records under `all_rows`:

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 40/40 rows read; example: io.github.CSOAI-ORG/a2a-governance-bridge-mcp |
| `version` | string | Observed type string; non-null in 40/40 rows read; example: 1.1.14 |
| `status` | string | Observed type string; non-null in 40/40 rows read; example: active |
| `updatedAt` | datetime | Observed type datetime; non-null in 40/40 rows read; example: 2026-06-30T03:52:05.683028Z |
| `remotes` | string | Observed type string; non-null in 40/40 rows read; example: ["https://api.meok.ai/v1/a2a/governance-bridge"] |
| `packages` | string | Observed type string; non-null in 40/40 rows read; example: [["pypi", "a2a-governance-bridge-mcp", "1.1.14"]] |
| `repository` | url | Observed type url; non-null in 40/40 rows read; example: https://github.com/CSOAI-ORG/a2a-governance-bridge-mcp |
| `websiteUrl` | url | Observed type url; non-null in 1/40 rows read; example: https://councilof.ai |
| `remote_states` | string | Observed type string; non-null in 40/40 rows read; example: [{"url": "https://api.meok.ai/v1/a2a/governance-bridge", "st… |
| `all_remotes_dead` | boolean | Observed type boolean; non-null in 40/40 rows read; example: true |
| `any_dead` | boolean | Observed type boolean; non-null in 40/40 rows read; example: true |

## `2026-09-22/search-index-presence-2026-09-22.json`

Top-level keys: `as_of`, `method`, `results`.
Records under `results`:

| field | type | description |
|---|---|---|
| `engine` | string | Observed type string; non-null in 6/6 rows read; example: Bing |
| `url` | url | Observed type url; non-null in 6/6 rows read; example: https://www.bing.com/search?q=site%3Acouncilof.ai&setlang=en… |
| `http` | integer | Observed type integer; non-null in 6/6 rows read; example: 200 |
| `final_url` | url | Observed type url; non-null in 6/6 rows read; example: https://www.bing.com/search?q=site%3Acouncilof.ai&setlang=en… |
| `error` | string | Observed type string; non-null in 1/6 rows read; example: Error: page.evaluate: Execution context was destroyed, most … |
| `chars` | integer | Observed type integer; non-null in 5/6 rows read; example: 105 |
| `wall` | boolean | Observed type boolean; non-null in 5/6 rows read; example: false |
| `count_line` | string | Observed type string; non-null in 1/6 rows read; example: results |
| `result_urls` | string | Observed type string; non-null in 5/6 rows read |
| `no_results` | boolean | Observed type boolean; non-null in 5/6 rows read; example: false |
| `excerpt` | string | Observed type string; non-null in 5/6 rows read; example: Skip to content Accessibility Feedback Rewards One last step… |

## `2026-09-22/software-heritage-ledger.json`

Top-level keys: `https://huggingface.co/datasets/csoai/councilof-ai-mirror`, `https://huggingface.co/datasets/csoai/councilof-ai-source`, `https://huggingface.co/datasets/csoai/gspc-board`, `https://huggingface.co/datasets/csoai/gspc-boards`, `https://huggingface.co/datasets/csoai/gspc-hub-cards`, `https://huggingface.co/datasets/csoai/gspc-swarm`, `https://huggingface.co/datasets/csoai/hub-queue`, `https://huggingface.co/datasets/csoai/index-presence`, `https://huggingface.co/datasets/csoai/mcp-registry-self-audit`, `https://huggingface.co/datasets/csoai/x402-bazaar-conformance`.


## `2026-09-22/wayback-cdx-2026-09-22.json`

Top-level keys: `as_of`, `method`, `results`.
Records under `results`:

| field | type | description |
|---|---|---|
| `url` | url | Observed type url; non-null in 9/9 rows read; example: https://councilof.ai/ |
| `captures` | integer | Observed type integer; non-null in 9/9 rows read; example: 8 |
| `latest_timestamp` | string | Observed type string; non-null in 7/9 rows read; example: 20260922152706 |
| `capture_http_status` | string | Observed type string; non-null in 7/9 rows read; example: 200 |
| `archived_url` | url | Observed type url; non-null in 7/9 rows read; example: https://web.archive.org/web/20260922152706/https://councilof… |
| `readback_http` | integer | Observed type integer; non-null in 7/9 rows read; example: 200 |
| `readback_bytes` | integer | Observed type integer; non-null in 7/9 rows read; example: 38867 |
| `readback_head` | string | Observed type string; non-null in 7/9 rows read; example: �      ��[sI�&���"m�EN#A\y��͢�*NK�����N�L�@�,&2��B�-�y… |
| `first_timestamp` | string | Observed type string; non-null in 7/9 rows read; example: 20260108133455 |

## `2026-09-22/wayback-spn-settled-2026-09-22.json`

Top-level keys: `as_of`, `results`.
Records under `results`:

| field | type | description |
|---|---|---|
| `url` | url | Observed type url; non-null in 2/2 rows read; example: https://councilof.ai/dashboard/?tab=board |
| `before` | string | Observed type string; non-null in 2/2 rows read; example: ["20260917192104", "20260917192104", "20260922152736"] |
| `window_start` | string | Observed type string; non-null in 2/2 rows read; example: 20260922160637 |
| `spn_get_http` | integer | Observed type integer; non-null in 2/2 rows read; example: 500 |
| `spn_get_final_url` | url | Observed type url; non-null in 2/2 rows read; example: https://web.archive.org/save/https://councilof.ai/dashboard/… |
| `spn_post_http` | integer | Observed type integer; non-null in 2/2 rows read; example: 401 |
| `spn_post_body` | string | Observed type string; non-null in 2/2 rows read; example: {"message":"You need to be logged in to use Save Page Now."} |
| `after` | string | Observed type string; non-null in 1/2 rows read; example: ["20260922160829"] |
| `new_captures` | string | Observed type string; non-null in 2/2 rows read; example: ["20260922160829"] |
| `verdict` | string | Observed type string; non-null in 2/2 rows read; example: no new capture: anonymous SPN did NOT capture |
