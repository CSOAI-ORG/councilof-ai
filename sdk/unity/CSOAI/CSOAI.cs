using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using UnityEngine;

namespace CSOAI
{
    /// <summary>
    /// MEOK Protocol Nexus SDK for Unity
    /// Provides access to MCP, A2A, ACP, Trust Layer, and Marketplace APIs.
    /// </summary>
    public class CSOAIClient : IDisposable
    {
        private readonly HttpClient _http;
        private readonly string _baseUrl;
        private string _accessToken;
        private readonly string _vertical;

        public CSOAIClient(string baseUrl, string vertical = "safety")
        {
            _baseUrl = baseUrl.TrimEnd('/');
            _vertical = vertical;
            _http = new HttpClient();
            _http.Timeout = TimeSpan.FromSeconds(30);
        }

        public void SetAccessToken(string token)
        {
            _accessToken = token;
            _http.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        }

        // ── Health ─────────────────────────────────────────────────
        public async Task<string> HealthAsync()
        {
            var resp = await _http.GetAsync($"{_baseUrl}/health");
            return await resp.Content.ReadAsStringAsync();
        }

        // ── MCP Tools ──────────────────────────────────────────────
        public async Task<string> ListToolsAsync()
        {
            var body = new Dictionary<string, object>
            {
                { "jsonrpc", "2.0" },
                { "method", "tools/list" },
                { "id", Guid.NewGuid().ToString() }
            };
            return await PostJsonAsync("/mcp", body);
        }

        public async Task<string> CallToolAsync(string toolName, Dictionary<string, object> arguments)
        {
            var body = new Dictionary<string, object>
            {
                { "jsonrpc", "2.0" },
                { "method", "tools/call" },
                { "id", Guid.NewGuid().ToString() },
                { "params", new Dictionary<string, object>
                    {
                        { "name", toolName },
                        { "arguments", arguments }
                    }
                }
            };
            return await PostJsonAsync("/mcp", body);
        }

        // ── A2A Agent Card ─────────────────────────────────────────
        public async Task<string> GetAgentCardAsync(string vertical = null)
        {
            var v = vertical ?? _vertical;
            var resp = await _http.GetAsync($"{_baseUrl}/.well-known/agent.json?vertical={v}");
            return await resp.Content.ReadAsStringAsync();
        }

        public async Task<string> SendTaskAsync(string agentId, string message)
        {
            var body = new Dictionary<string, object>
            {
                { "agent_id", agentId },
                { "message", message }
            };
            return await PostJsonAsync("/v1/tasks/send", body);
        }

        // ── Compliance Map (RegGeoInt) ────────────────────────────
        public async Task<string> GetComplianceMapAsync()
        {
            var resp = await _http.GetAsync($"{_baseUrl}/v1/compliance-map/jurisdictions");
            return await resp.Content.ReadAsStringAsync();
        }

        public async Task<string> GetJurisdictionAsync(string code)
        {
            var resp = await _http.GetAsync($"{_baseUrl}/v1/compliance-map/jurisdiction/{code}");
            return await resp.Content.ReadAsStringAsync();
        }

        public async Task<string> GetHeatmapAsync()
        {
            var resp = await _http.GetAsync($"{_baseUrl}/v1/compliance-map/heatmap");
            return await resp.Content.ReadAsStringAsync();
        }

        public async Task<string> CrossBorderAdvisoryAsync(string fromCode, string toCode)
        {
            var resp = await _http.GetAsync($"{_baseUrl}/v1/compliance-map/deploy/{fromCode}/to/{toCode}");
            return await resp.Content.ReadAsStringAsync();
        }

        // ── Trust Layer ────────────────────────────────────────────
        public async Task<string> GetTrustScoreAsync(string entityId)
        {
            var resp = await _http.GetAsync($"{_baseUrl}/v1/trust/score/{entityId}");
            return await resp.Content.ReadAsStringAsync();
        }

        public async Task<string> SubmitAttestationAsync(string entityId, string type, Dictionary<string, object> payload)
        {
            var body = new Dictionary<string, object>
            {
                { "entity_id", entityId },
                { "attestation_type", type },
                { "payload", payload }
            };
            return await PostJsonAsync("/v1/trust/attest", body);
        }

        // ── Marketplace ────────────────────────────────────────────
        public async Task<string> ListMarketplaceAsync()
        {
            var resp = await _http.GetAsync($"{_baseUrl}/v1/marketplace/listings");
            return await resp.Content.ReadAsStringAsync();
        }

        public async Task<string> PurchaseCharacterAsync(string buyerId, string listingId)
        {
            var body = new Dictionary<string, object>
            {
                { "buyer_id", buyerId },
                { "listing_id", listingId }
            };
            return await PostJsonAsync("/v1/marketplace/purchase", body);
        }

        // ── Server Card ────────────────────────────────────────────
        public async Task<string> GetServerCardAsync()
        {
            var resp = await _http.GetAsync($"{_baseUrl}/.well-known/mcp-server.json");
            return await resp.Content.ReadAsStringAsync();
        }

        // ── Helpers ────────────────────────────────────────────────
        private async Task<string> PostJsonAsync(string path, Dictionary<string, object> body)
        {
            var json = JsonUtility.ToJson(new SerializableDict(body));
            // Fallback: manual JSON serialization for nested objects
            var manual = ManualJson(body);
            var content = new StringContent(manual, Encoding.UTF8, "application/json");
            var resp = await _http.PostAsync($"{_baseUrl}{path}", content);
            return await resp.Content.ReadAsStringAsync();
        }

        private static string ManualJson(Dictionary<string, object> dict, int indent = 0)
        {
            var sb = new StringBuilder();
            sb.Append('{');
            var first = true;
            foreach (var kv in dict)
            {
                if (!first) sb.Append(',');
                first = false;
                sb.Append($"\"{kv.Key}\":");
                if (kv.Value is Dictionary<string, object> nested)
                    sb.Append(ManualJson(nested));
                else if (kv.Value is string s)
                    sb.Append($"\"{s.Replace("\\", "\\\\").Replace("\"", "\\\"")}\"");
                else if (kv.Value is bool b)
                    sb.Append(b ? "true" : "false");
                else if (kv.Value == null)
                    sb.Append("null");
                else
                    sb.Append(kv.Value.ToString().ToLowerInvariant());
            }
            sb.Append('}');
            return sb.ToString();
        }

        public void Dispose()
        {
            _http?.Dispose();
        }
    }

    [Serializable]
    public class SerializableDict
    {
        public List<string> keys = new List<string>();
        public List<string> values = new List<string>();

        public SerializableDict() { }
        public SerializableDict(Dictionary<string, object> source)
        {
            foreach (var kv in source)
            {
                keys.Add(kv.Key);
                values.Add(kv.Value?.ToString() ?? "null");
            }
        }
    }
}
