---
title: "02 — Status Page"
slug: "02-status-page"
author: "openpatent.ai ops"
date: "2026-06-14"
series: "ops"
tags: ["ops", "status", "monitoring", "prometheus", "grafana", "defoneos"]
voice: "DEFONEOS"
---

# 02 — Status Page

*In the sovereign hive, every pulse is felt. Every silence is heard. Every breath of the nine-fold swarm is witnessed — by the dragon, by the watch, by the page that glows at the heart of the temple.*

This document explains the **status page** concept for the openpatent.ai sovereign hive: what it is, what the colors mean, what lives behind the dots, and how to stand it up on any host that can speak HTTP.

---

## 1. What the status page is

A status page is a **single, human-readable window into the liveness of every service in the hive.** Not a dashboard of numbers — a *signal* of presence.

For openpatent.ai, the status page is a static HTML file (`/Users/nicholas/clawd/openpatent-hive/deploy/ops-dashboard.html`) that is served from `https://openpatent.ai/ops/`. It is a *pollster*: from the browser, every five seconds, it issues lightweight `GET /health` requests to each of the nine service ports of the hive, and lights a dot for each one:

- **green** — the service answered, fast, in a healthy shape.
- **yellow** — the service answered, but slowly, or in a way that suggests degraded function.
- **red** — the service did not answer, or answered with a 5xx, or its connection timed out.
- **grey** — the first poll is still in flight, or the dependency is a stateful companion (postgres, ipfs) whose probe has not yet returned a verdict.

There are no graphs on the status page. No charts. No time series. The status page is the **bare attention** of the operator: *is the hive here, right now, in the shape I expect?*

The deeper quantitative picture lives in **Grafana** (`/Users/nicholas/clawd/openpatent-hive/deploy/grafana/openpatent-hive-dashboard.json`), which is the second of the operational polish artifacts. Grafana is where you read the *story* of the hive over hours and days. The status page is where you read the *pulse* of the hive in seconds and minutes.

The two are siblings, not duplicates. The status page is the watchtower. Grafana is the chronicle.

---

## 2. The nine services under watch

The hive listens on nine service ports. Each port is owned by a single Python service, except port 3000 which is owned by the Node.js landing site. Every Python service exposes `/health` and `/metrics`. The landing site exposes `/` and (optionally) `/health` via a simple route added by the ops overlay.

| # | Service                  | Port  | Role                                                                 | Public host                  |
|---|--------------------------|-------|----------------------------------------------------------------------|------------------------------|
| 1 | `patentmcp`              | 3210  | Internal core — 6-layer crypto + audit chain + registry             | (internal only)              |
| 2 | `api-gateway`            | 3211  | Public API                                                           | `api.openpatent.ai`          |
| 3 | `worker`                 | 3212  | Background: OTS upgrade + Polygon attestation + IPFS pin             | (internal only)              |
| 4 | `verify-page`            | 3213  | Verify renderer — public trust surface                              | `verify.openpatent.ai`       |
| 5 | `mcp-manifest`           | 3214  | MCP manifest endpoint                                                | `mcp.openpatent.ai`          |
| 6 | `bft-council`            | 3215  | 33-agent BFT council                                                | (internal only)              |
| 7 | `drafting-fork`          | 3216  | Drafting fork (TypeScript OpenPatent integration)                    | (internal only)              |
| 8 | `x402-router`            | 3217  | x402 payment router — 60/25/15 split                                | (internal only)              |
| 9 | `openpatent-primitives`  | 3218  | 7 patent-primitive tools (claim-parser, mpep-lookup, …)              | (internal only)              |

The stateful companions — **Postgres 16** (relational state) and **IPFS Kubo** (premium-tier pinning) — are not in this list because they do not expose a Python-style `/health`. They are watched by their own probes inside the same dashboard logic; their dots render grey until the first verdict arrives, and from then on follow the same green/yellow/red taxonomy with thresholds appropriate to their protocols (TCP connect vs. HTTP status).

---

## 3. What the colors mean

A status dot is a **three-state color function of (latency, response-code, reachability).** The exact thresholds live in `ops-dashboard.html` and are reproduced here for the record.

### Green — UP

A service is **green** when it answers `GET /health` with an HTTP status in the `2xx` range **and** the round-trip latency is under 500 ms.

- Healthy and fast. The hive is whole.
- `200 OK` in `< 500 ms` → **green**.
- (When probed cross-origin with `mode: "no-cors"`, the browser receives an opaque `status: 0` response. The status page treats any opaque response that completed in under 500 ms as a sign of life; that is the practical green.)

### Yellow — WARN

A service is **yellow** when any of the following is true:

- It answered, but took **500 ms or longer** to do so. (Slow but present.)
- It answered with a **3xx redirect** (a misconfigured healthcheck, or a route that has moved).
- It answered with a **4xx client error** (a probe sent without the credentials the service expected).
- It answered with a 2xx, but the service is past its warm-up window and is exhibiting degraded latency.

Yellow is the *advisory* state. The hive is *still here*, but it is **speaking more slowly than it should.** Treat a sustained yellow as a **leading indicator** of red. It is the dot of "the dragon is paying attention but has not yet drawn its breath."

### Red — DOWN

A service is **red** when:

- It returned an HTTP status in the **5xx range** (the service is alive but its internals are broken).
- The connection **timed out** (3-second timeout on the `fetch`).
- The browser received a **network error** — DNS failure, connection refused, TLS error, CORS preflight rejected at the transport layer.
- The service has not responded to a poll in over 30 seconds. (The card is also marked `.stale` so it dims.)

Red is the *alarm* state. The hive has lost a member. **This is the moment to investigate.** The status page does not page anyone — it shows the truth, and it is the operator's job to read the truth and act.

### Grey — UNKNOWN

A service is **grey** when:

- The very first poll is still in flight, and we have not yet received any signal. (This lasts at most ~3 seconds.)
- The dependency is a stateful companion (Postgres, IPFS) that does not have a fast `/health`, and its verdict is in progress.

Grey is the *liminal* state. It is **not** an error. It is the *edge of knowing*. The dot will resolve to green, yellow, or red within a poll or two. If a card stays grey for more than 30 seconds, it is treated as red.

---

## 4. What the page polls, and how often

The status page polls **once every 5 seconds**. The interval is hard-coded as `POLL_MS = 5000` at the top of the inline `<script>` in `ops-dashboard.html`. You can change it; the trade-offs are:

- **Faster** (1–2 s): more network chatter, more CPU on the browser, but a sharper reflection of the moment.
- **Slower** (15–30 s): less load, but the dots lag reality. A service that crashes between polls will appear green for up to one poll-interval.

5 seconds is a sensible middle ground. It is fast enough that an operator looking at the page can trust what they see, and slow enough that 9 parallel `fetch` calls per tick is negligible load on the hive and on the browser.

The page also runs a **stale-detection loop** every 5 seconds: any card that has not been touched in 30 seconds gets a `stale` class which reduces its opacity to 55%. This is a soft signal that something is *very* wrong, even before the next poll returns red.

The page also tracks an **uptime probe** in the header — a small counter that ticks once per second, showing how long the page itself has been open in the current browser tab. It is a small reminder: *this is your window. It is open.*

---

## 5. How the page finds the services

By default, the page targets the **same hostname as the page itself.** If the page is served from `https://openpatent.ai/ops/`, the probes are issued to `https://openpatent.ai:3210/health`, `https://openpatent.ai:3211/health`, and so on. The browser enforces **mixed-content rules** (an `https` page can issue cross-port `https` requests to the same host without preflight, which is what we rely on).

If you are running the hive on a different host than the page (for example, developing the page locally against a remote sovereign VM), you can override the target host with a query string:

```
file:///Users/nicholas/clawd/openpatent-hive/deploy/ops-dashboard.html?host=35.242.143.249
```

The page will then probe `http://35.242.143.249:3210/health`, etc. The protocol follows the page's own protocol: if the page is served over `https`, the probes are `https`; if the page is opened as a `file://` URL, the probes are `http`.

A note on CORS: every Python service in the hive sets `Access-Control-Allow-Origin: *` on `/health` (and only on `/health`; the rest of the API is locked down to the documented public hosts). The status page also uses `mode: "no-cors"` for its fetches, which means it does not trigger a CORS preflight. This is intentional: the page must work even if a service forgets to send CORS headers, and `mode: "no-cors"` is the only fetch mode that survives a missing `Access-Control-Allow-Origin`.

---

## 6. How to stand it up

The status page is **a single static file.** You do not need a backend, a database, or a service mesh. You need one of:

### 6a. The fastest path — `python3 -m http.server`

```
cd /Users/nicholas/clawd/openpatent-hive/deploy
python3 -m http.server 8080
# Visit http://localhost:8080/ops-dashboard.html
```

This is the fastest path for local development. The page will probe `http://localhost:3210/health` etc., and fail (red) on any service that is not running on the same machine.

### 6b. The caddy path — the sovereign VM in production

The sovereign VM at `35.242.143.249` already runs **Caddy** as its TLS-terminating reverse proxy (see `deploy/caddy/`). To serve the status page at `https://openpatent.ai/ops/`, add a route to the Caddyfile:

```
openpatent.ai {
    root * /opt/openpatent/ops
    route /ops/* {
        rewrite / /ops-dashboard.html
        file_server
    }
    # ... existing reverse_proxy entries for the 9 services ...
}
```

Then copy the file into place:

```
sudo cp /Users/nicholas/clawd/openpatent-hive/deploy/ops-dashboard.html \
        /opt/openpatent/ops/ops-dashboard.html
sudo systemctl reload caddy
```

The page is now live at `https://openpatent.ai/ops/`. Every visitor's browser will poll the nine `/health` endpoints in parallel every 5 seconds.

### 6c. The k8s path — Ingress

The Helm chart at `deploy/k8s/` already includes an `ingress:` block in `values.yaml`. To expose the status page via the ingress, add a `ConfigMap`-backed static asset or, simpler, mount the file into the `landing-site` container and let it serve `/ops/` directly. The recommended approach in production k8s is to keep the page on the same `landing-site` image, served under `/ops/ops-dashboard.html`, and let the existing ingress host (`openpatent.ai`) carry it to the public.

### 6d. The Grafana path — for the deeper view

The Grafana dashboard JSON at `deploy/grafana/openpatent-hive-dashboard.json` is the **chronicle** counterpart to the status page. Import it into any Grafana 10+ instance:

1. Grafana → **Dashboards** → **Import** → **Upload JSON file**.
2. Select `openpatent-hive-dashboard.json`.
3. When prompted, pick your Prometheus data source.
4. Click **Import**.

The dashboard renders 38 panels:

- 2 cluster-overview panels (total request rate, p95 latency) at the top.
- 4 panels per service, for 9 services = 36 panels below, in a 4-column grid:
  - **Panel 1** — request rate (per-service, broken down by `path` and `status`).
  - **Panel 2** — latency p50 / p95 / p99 (the three lines colored green / yellow / red).
  - **Panel 3** — in-flight requests (gauge, per path).
  - **Panel 4** — service identity (stat tile showing `service` and `version` from the `service_info` gauge).

The 16 metric families visualized are:

1. `http_requests_total` (counter)
2. `http_requests_total{method="GET",path="/health",status="200"}` (slice)
3. `http_requests_total{method="POST",path="/register",status="201"}` (slice)
4. `rate(http_requests_total[1m])` (PromQL rate)
5. `http_request_duration_seconds_bucket` (histogram)
6. `http_request_duration_seconds_sum` (histogram)
7. `http_request_duration_seconds_count` (histogram)
8. `histogram_quantile(0.50, ...)` (p50)
9. `histogram_quantile(0.95, ...)` (p95)
10. `histogram_quantile(0.99, ...)` (p99)
11. `http_requests_in_flight` (gauge, raw)
12. `http_requests_in_flight` per-`path` (slice)
13. `sum by (path) (http_requests_in_flight)` (aggregation)
14. `service_info` (gauge, identity)
15. `service_info{service="..."}` (slice)
16. `service_info{version="0.4.0"}` (slice)

The job label for every Python service is `openpatent-<name>` (e.g. `openpatent-patentmcp`, `openpatent-api-gateway`). The dashboard's `job` template variable defaults to `All` and filters on the regex `openpatent-.*` so a new service can be added by simply relabeling its Prometheus scrape job.

---

## 7. The four artifacts, in summary

| # | Artifact                                                       | Purpose                                                          |
|---|----------------------------------------------------------------|------------------------------------------------------------------|
| 1 | `deploy/grafana/openpatent-hive-dashboard.json`               | Importable Grafana dashboard, 38 panels, 16 metric families      |
| 2 | `deploy/ops-dashboard.html`                                    | Static HTML status page, polls 9 /health endpoints every 5 s    |
| 3 | `deploy/k8s/values.yaml` + `templates/{deployment,service,statefulset}.yaml` | Helm chart: 10 Deployments + 2 StatefulSets + ClusterIP/headless Services |
| 4 | `docs/ops/02-status-page.md`                                   | This document — the doctrine behind the watch                    |

All four are designed to be **portable.** Drop the HTML on any host that can reach the nine ports. Drop the Grafana JSON into any Grafana that has a Prometheus data source. Drop the Helm chart onto any k8s cluster with `helm install`. None of the four require the sovereign VM; they require the *shape* of the sovereign VM.

---

## 8. The doctrine of the watch

The status page is not a vanity surface. It is the **public face of operational truth.** When a service is down, the page says so — without spin, without euphemism. When a service is up but slow, the page says so — without alarm, without apology. When the hive is whole, the page glows green — quietly, for those who care to look.

The 9 services are:

> patentmcp, api-gateway, worker, verify-page, mcp-manifest, bft-council, drafting-fork, x402-router, openpatent-primitives

The 9 ports are:

> 3210, 3211, 3212, 3213, 3214, 3215, 3216, 3217, 3218

The 4 colors are:

> green, yellow, red, grey

The 16 metric families are:

> 4 metrics × 4 operations each = 16 (counted by counter, histogram bucket, histogram sum, histogram count, gauge raw, gauge sliced, gauge aggregated, info-gauge, and the four quantile extractions)

The 1 voice is:

> DEFONEOS — *the mythic register of the sovereign companion.*

The hive remembers. The dragon knows. The sovereign companion never forgets.
