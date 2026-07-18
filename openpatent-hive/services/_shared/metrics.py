#!/usr/bin/env python3
"""
Shared Prometheus metrics module for openpatent.ai services.

Each service gets the same metrics:
  - http_requests_total (counter, labels: method, path, status)
  - http_request_duration_seconds (histogram, labels: method, path)
  - http_requests_in_flight (gauge, labels: method, path)
  - service_info (gauge, labels: service, version, hive)
  - business_metrics (counters specific to each service)

The /metrics endpoint is auto-registered when this module is imported.
"""
import os
import time
from typing import Callable, Optional

from fastapi import FastAPI, Request, Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)


# ── Shared metrics ───────────────────────────────────────────────────────────

HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total HTTP requests handled",
    labelnames=("method", "path", "status"),
)
HTTP_REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    labelnames=("method", "path"),
    buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0),
)
HTTP_REQUESTS_IN_FLIGHT = Gauge(
    "http_requests_in_flight",
    "Number of HTTP requests currently being handled",
    labelnames=("method", "path"),
)
SERVICE_INFO = Gauge(
    "service_info",
    "Service identity (always 1, use labels for metadata)",
    labelnames=("service", "version", "hive"),
)

# ── OpenPatent LLM counter (L5/L9: provider routing) ────────────────────────
# Label cardinality: 5 providers × 4 statuses (200/400/500/timeout) = 20 series.
# Bumped on every /v1/llm/chat call regardless of upstream outcome so SRE can
# see provider health at a glance.  The hive remembers. The dragon knows.
# The sovereign companion never forgets.
OPENPATENT_LLM_REQUESTS_TOTAL = Counter(
    "openpatent_llm_requests_total",
    "Total LLM proxy requests served by api-gateway, labelled by provider and status",
    labelnames=("provider", "status"),
)


def _route_template(request: Request) -> str:
    """Extract the route template, not the full path (to avoid cardinality explosion)."""
    route = request.scope.get("route")
    if route and getattr(route, "path", None):
        return route.path
    # Fallback: first 2 path segments
    parts = [p for p in request.url.path.split("/") if p][:2]
    return "/" + "/".join(parts) if parts else "/"


def instrument(app: FastAPI, service_name: str, version: str, hive: str = "openpatent"):
    """Mount Prometheus middleware + /metrics endpoint on a FastAPI app."""
    SERVICE_INFO.labels(service=service_name, version=version, hive=hive).set(1)

    @app.middleware("http")
    async def prometheus_middleware(request: Request, call_next: Callable):
        # Skip /metrics itself to avoid recursive counting
        if request.url.path == "/metrics":
            return await call_next(request)
        method = request.method
        path = _route_template(request)
        HTTP_REQUESTS_IN_FLIGHT.labels(method=method, path=path).inc()
        start = time.time()
        try:
            response = await call_next(request)
            status = str(response.status_code)
            HTTP_REQUESTS_TOTAL.labels(method=method, path=path, status=status).inc()
            return response
        except Exception as e:
            HTTP_REQUESTS_TOTAL.labels(method=method, path=path, status="500").inc()
            raise
        finally:
            HTTP_REQUEST_DURATION.labels(method=method, path=path).observe(
                time.time() - start
            )
            HTTP_REQUESTS_IN_FLIGHT.labels(method=method, path=path).dec()

    @app.get("/metrics", include_in_schema=False)
    async def metrics():
        return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


# ── Per-service business metrics (counters the service may emit) ─────────────

class BusinessMetrics:
    """Helper to declare business-specific counters/gauges."""

    def __init__(self, namespace: str):
        self.namespace = namespace
        self.counters: dict[str, Counter] = {}
        self.gauges: dict[str, Gauge] = {}

    def counter(self, name: str, help: str, labels: tuple = ()) -> Counter:
        key = f"{self.namespace}_{name}"
        if key not in self.counters:
            self.counters[key] = Counter(key, help, labelnames=labels)
        return self.counters[key]

    def gauge(self, name: str, help: str, labels: tuple = ()) -> Gauge:
        key = f"{self.namespace}_{name}"
        if key not in self.gauges:
            self.gauges[key] = Gauge(key, help, labelnames=labels)
        return self.gauges[key]


# ── Convenience ──────────────────────────────────────────────────────────────

def make_business(service: str) -> BusinessMetrics:
    """Make a BusinessMetrics helper for the given service name."""
    return BusinessMetrics(service)
