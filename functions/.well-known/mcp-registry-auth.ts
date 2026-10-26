/// <reference types="@cloudflare/workers-types" />
// MCP Registry domain verification record for councilof.ai.
//
// WHAT THIS GRANTS — corrected 2026-09-23. The comment this replaces said hosting this key
// "enables mcp-publisher to publish CSOAI servers under io.github.CSOAI-ORG/* namespace".
// The registry's own source refutes that. In internal/api/handlers/v0/auth/common.go,
// BuildPermissions() derives the publishing permission from the verified domain alone:
//
//     reverseDomain := ReverseString(domain)          // councilof.ai -> ai.councilof
//     ResourcePattern: fmt.Sprintf("%s/*", reverseDomain)
//
// and the HTTP handler calls it with includeSubdomains = false. So a completed proof over
// this document grants exactly `ai.councilof/*` and nothing else. It confers no rights over
// `io.github.CSOAI-ORG/*`; the registry routes io.github.* publishers to GitHub
// authentication, and an organisation namespace additionally requires org-Owner role there.
// Our 354 existing entries live under io.github.CSOAI-ORG/* and are therefore out of this
// document's reach — see public/interop/mcp-registry-2026-09-23/supersession.json.
//
// HOW THE REGISTRY READS THIS (internal/api/handlers/v0/auth/http.go). It GETs
// https://councilof.ai/.well-known/mcp-registry-auth, follows NO redirects, requires HTTP
// 200, reads at most 4096 bytes, and takes the first match of
//     v=MCPv1;\s*k=([^;]+);\s*p=([A-Za-z0-9+/=]+)
// Only one key can be carried over HTTP: the whole body is a single record string, so the
// first match wins. (DNS can carry several because each TXT record is its own string.)
//
// This file publishes PUBLIC key material only. The private half is what signs the ±15s
// timestamp at POST /v0/auth/http; see scripts/registry-http-login.py. As of 2026-09-23 that
// private key had not been located in any estate key store swept, so the proof cannot
// currently be completed — rotating this value requires a deploy, and would invalidate any
// holder of the current private key, so it is not changed here.
import { headFromGet } from "../api/_head";

const PUBKEY = "SPsNsIkKmIZD0HJejPzQSwp4mHdNyN2ODpvYpMEWKGI=";

export const onRequestGet: PagesFunction = async () => {
  const body = `v=MCPv1; k=ed25519; p=${PUBKEY}\n`;
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};

// HEAD answers what GET answers, with no body (functions/api/_head.ts); without it a HEAD falls
// through to a 404. Ratchet: functions/api/_head.coverage.test.ts.
export const onRequestHead = headFromGet(onRequestGet);
