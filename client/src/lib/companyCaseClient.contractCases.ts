import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import type { CompanyCaseClient } from "../components/talk/companyCaseModel";

// Shared synthetic contract cases. No real fetch, import, native write or acceptance request.
type Register = (name: string, work: () => void | Promise<void>) => unknown;
type Factory = (options: { subject: string; token: string; getToken: () => string | null }) => CompanyCaseClient;
export function registerCompanyCaseClientContractCases(test: Register, createClient: Factory): void {
const unit: any = {"reply":{"schema":"meok.library-case/1","saved":true,"owner_sub":"unit-owner@example.invalid","case":{"schema":"meok.library-case/1","id":"case_a5eef9d3d5abace99dc9bbb7125f34404d2ee7d667ad656f7eabebc2c3179e83","owner_sub":"unit-owner@example.invalid","request_id":"unit_request_123","request":"Synthetic GSPC unit request","request_sha256":"0d72a2d022f22787143f57407d489534a081aad25abba8b5126738dc865d7109","created_at":"2026-10-12T18:00:00Z","result":{"library":{"schema":"meok.native-library-search/1","base_id":"unit-base-123","query":"GSPC","entries":[{"title":"GSPC","source_key":"library:component:LIB-GSPC","native_record_id":"unit-library-entity","head_commit_id":"unit-library-head","body":{"schema":"councilos.company-library-entity/1","source_key":"library:component:LIB-GSPC","kind":"component","entity_id":"LIB-GSPC","source_state":"LOCAL_SOURCE_REFERENCE","task_authority":false,"measurement_authority":false,"publication_clearance":"NOT_GRANTED_BY_IMPORT","version_sha256":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","unit_note":"Synthetic café source"},"source_reference":{"schema":"councilos.company-library-provenance/1","signature_state":"UNSIGNED","runtime_qualified":false,"rights_clearance_conferred":false,"source_version_sha256":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}}]},"gspc":{"source":"https://councilof.ai/mcp/free","method":"tools/call","http_method":"POST","content_type":"application/json; charset=utf-8","raw_base64":"eyJpZCI6Im1lb2stbGlicmFyeS1ib2FyZCIsImpzb25ycGMiOiIyLjAiLCJyZXN1bHQiOnsiY29udGVudCI6W3sidGV4dCI6IlN5bnRoZXRpYyBib2FyZCBmaXh0dXJlIG9ubHkiLCJ0eXBlIjoidGV4dCJ9XX19","raw_bytes":120,"raw_sha256":"4ace04ee266c7253d5b2b93273d9a36657669810ce4f5f183f29c0775f15323b","fetched_at":"2026-10-12T18:00:00Z","signed":false,"untrusted_tool_output":true,"response":{"jsonrpc":"2.0","id":"meok-library-board","result":{"content":[{"type":"text","text":"Synthetic board fixture only"}]}},"tool":"board_totals","arguments":{"detail":"summary"},"abi":{"source":"https://councilof.ai/mcp/free","method":"tools/list","http_method":"POST","content_type":"application/json; charset=utf-8","raw_base64":"eyJpZCI6Im1lb2stbGlicmFyeS1hYmkiLCJqc29ucnBjIjoiMi4wIiwicmVzdWx0Ijp7InRvb2xzIjpbeyJpbnB1dFNjaGVtYSI6eyJwcm9wZXJ0aWVzIjp7ImRldGFpbCI6eyJlbnVtIjpbInN1bW1hcnkiXSwidHlwZSI6InN0cmluZyJ9fSwidHlwZSI6Im9iamVjdCJ9LCJuYW1lIjoiYm9hcmRfdG90YWxzIn1dfX0=","raw_bytes":179,"raw_sha256":"763a5766719985b2e013756afce897c640007a6a20a426c0238c94588747d256","fetched_at":"2026-10-12T18:00:00Z","signed":false,"untrusted_tool_output":true,"response":{"jsonrpc":"2.0","id":"meok-library-abi","result":{"tools":[{"name":"board_totals","inputSchema":{"type":"object","properties":{"detail":{"type":"string","enum":["summary"]}}}}]}},"tool_schema_json_b64":"eyJpbnB1dFNjaGVtYSI6eyJwcm9wZXJ0aWVzIjp7ImRldGFpbCI6eyJlbnVtIjpbInN1bW1hcnkiXSwidHlwZSI6InN0cmluZyJ9fSwidHlwZSI6Im9iamVjdCJ9LCJuYW1lIjoiYm9hcmRfdG90YWxzIn0=","tool_schema_bytes":116,"tool_schema_sha256":"d4336fa6746adb2ad12c28331bc40a2f5edd1805f74ede9aa3356346d248d914"}},"unit_float":1.0},"receipt":{"schema":"meok.unsigned-integrity-receipt/1","signed":false,"unsigned":true,"record_json_b64":"eyJjcmVhdGVkX2F0IjoiMjAyNi0xMC0xMlQxODowMDowMFoiLCJpZCI6ImNhc2VfYTVlZWY5ZDNkNWFiYWNlOTlkYzliYmI3MTI1ZjM0NDA0ZDJlZTdkNjY3YWQ2NTZmN2VhYmViYzJjMzE3OWU4MyIsIm93bmVyX3N1YiI6InVuaXQtb3duZXJAZXhhbXBsZS5pbnZhbGlkIiwicmVxdWVzdCI6IlN5bnRoZXRpYyBHU1BDIHVuaXQgcmVxdWVzdCIsInJlcXVlc3RfaWQiOiJ1bml0X3JlcXVlc3RfMTIzIiwicmVxdWVzdF9zaGEyNTYiOiIwZDcyYTJkMDIyZjIyNzg3MTQzZjU3NDA3ZDQ4OTUzNGEwODFhYWQyNWFiYmE4YjUxMjY3MzhkYzg2NWQ3MTA5IiwicmVzdWx0Ijp7ImdzcGMiOnsiYWJpIjp7ImNvbnRlbnRfdHlwZSI6ImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLTgiLCJmZXRjaGVkX2F0IjoiMjAyNi0xMC0xMlQxODowMDowMFoiLCJodHRwX21ldGhvZCI6IlBPU1QiLCJtZXRob2QiOiJ0b29scy9saXN0IiwicmF3X2Jhc2U2NCI6ImV5SnBaQ0k2SW0xbGIyc3RiR2xpY21GeWVTMWhZbWtpTENKcWMyOXVjbkJqSWpvaU1pNHdJaXdpY21WemRXeDBJanA3SW5SdmIyeHpJanBiZXlKcGJuQjFkRk5qYUdWdFlTSTZleUp3Y205d1pYSjBhV1Z6SWpwN0ltUmxkR0ZwYkNJNmV5SmxiblZ0SWpwYkluTjFiVzFoY25raVhTd2lkSGx3WlNJNkluTjBjbWx1WnlKOWZTd2lkSGx3WlNJNkltOWlhbVZqZENKOUxDSnVZVzFsSWpvaVltOWhjbVJmZEc5MFlXeHpJbjFkZlgwPSIsInJhd19ieXRlcyI6MTc5LCJyYXdfc2hhMjU2IjoiNzYzYTU3NjY3MTk5ODViMmUwMTM3NTZhZmNlODk3YzY0MDAwN2E2YTIwYTQyNmMwMjM4Yzk0NTg4NzQ3ZDI1NiIsInJlc3BvbnNlIjp7ImlkIjoibWVvay1saWJyYXJ5LWFiaSIsImpzb25ycGMiOiIyLjAiLCJyZXN1bHQiOnsidG9vbHMiOlt7ImlucHV0U2NoZW1hIjp7InByb3BlcnRpZXMiOnsiZGV0YWlsIjp7ImVudW0iOlsic3VtbWFyeSJdLCJ0eXBlIjoic3RyaW5nIn19LCJ0eXBlIjoib2JqZWN0In0sIm5hbWUiOiJib2FyZF90b3RhbHMifV19fSwic2lnbmVkIjpmYWxzZSwic291cmNlIjoiaHR0cHM6Ly9jb3VuY2lsb2YuYWkvbWNwL2ZyZWUiLCJ0b29sX3NjaGVtYV9ieXRlcyI6MTE2LCJ0b29sX3NjaGVtYV9qc29uX2I2NCI6ImV5SnBibkIxZEZOamFHVnRZU0k2ZXlKd2NtOXdaWEowYVdWeklqcDdJbVJsZEdGcGJDSTZleUpsYm5WdElqcGJJbk4xYlcxaGNua2lYU3dpZEhsd1pTSTZJbk4wY21sdVp5SjlmU3dpZEhsd1pTSTZJbTlpYW1WamRDSjlMQ0p1WVcxbElqb2lZbTloY21SZmRHOTBZV3h6SW4wPSIsInRvb2xfc2NoZW1hX3NoYTI1NiI6ImQ0MzM2ZmE2NzQ2YWRiMmFkMTJjMjgzMzFiYzQwYTJmNWVkZDE4MDVmNzRlZGU5YWEzMzU2MzQ2ZDI0OGQ5MTQiLCJ1bnRydXN0ZWRfdG9vbF9vdXRwdXQiOnRydWV9LCJhcmd1bWVudHMiOnsiZGV0YWlsIjoic3VtbWFyeSJ9LCJjb250ZW50X3R5cGUiOiJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04IiwiZmV0Y2hlZF9hdCI6IjIwMjYtMTAtMTJUMTg6MDA6MDBaIiwiaHR0cF9tZXRob2QiOiJQT1NUIiwibWV0aG9kIjoidG9vbHMvY2FsbCIsInJhd19iYXNlNjQiOiJleUpwWkNJNkltMWxiMnN0YkdsaWNtRnllUzFpYjJGeVpDSXNJbXB6YjI1eWNHTWlPaUl5TGpBaUxDSnlaWE4xYkhRaU9uc2lZMjl1ZEdWdWRDSTZXM3NpZEdWNGRDSTZJbE41Ym5Sb1pYUnBZeUJpYjJGeVpDQm1hWGgwZFhKbElHOXViSGtpTENKMGVYQmxJam9pZEdWNGRDSjlYWDE5IiwicmF3X2J5dGVzIjoxMjAsInJhd19zaGEyNTYiOiI0YWNlMDRlZTI2NmM3MjUzZDViMmI5MzI3M2Q5YTM2NjU3NjY5ODEwY2U0ZjVmMTgzZjI5YzA3NzVmMTUzMjNiIiwicmVzcG9uc2UiOnsiaWQiOiJtZW9rLWxpYnJhcnktYm9hcmQiLCJqc29ucnBjIjoiMi4wIiwicmVzdWx0Ijp7ImNvbnRlbnQiOlt7InRleHQiOiJTeW50aGV0aWMgYm9hcmQgZml4dHVyZSBvbmx5IiwidHlwZSI6InRleHQifV19fSwic2lnbmVkIjpmYWxzZSwic291cmNlIjoiaHR0cHM6Ly9jb3VuY2lsb2YuYWkvbWNwL2ZyZWUiLCJ0b29sIjoiYm9hcmRfdG90YWxzIiwidW50cnVzdGVkX3Rvb2xfb3V0cHV0Ijp0cnVlfSwibGlicmFyeSI6eyJiYXNlX2lkIjoidW5pdC1iYXNlLTEyMyIsImVudHJpZXMiOlt7ImJvZHkiOnsiZW50aXR5X2lkIjoiTElCLUdTUEMiLCJraW5kIjoiY29tcG9uZW50IiwibWVhc3VyZW1lbnRfYXV0aG9yaXR5IjpmYWxzZSwicHVibGljYXRpb25fY2xlYXJhbmNlIjoiTk9UX0dSQU5URURfQllfSU1QT1JUIiwic2NoZW1hIjoiY291bmNpbG9zLmNvbXBhbnktbGlicmFyeS1lbnRpdHkvMSIsInNvdXJjZV9rZXkiOiJsaWJyYXJ5OmNvbXBvbmVudDpMSUItR1NQQyIsInNvdXJjZV9zdGF0ZSI6IkxPQ0FMX1NPVVJDRV9SRUZFUkVOQ0UiLCJ0YXNrX2F1dGhvcml0eSI6ZmFsc2UsInVuaXRfbm90ZSI6IlN5bnRoZXRpYyBjYWbDqSBzb3VyY2UiLCJ2ZXJzaW9uX3NoYTI1NiI6ImJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmIifSwiaGVhZF9jb21taXRfaWQiOiJ1bml0LWxpYnJhcnktaGVhZCIsIm5hdGl2ZV9yZWNvcmRfaWQiOiJ1bml0LWxpYnJhcnktZW50aXR5Iiwic291cmNlX2tleSI6ImxpYnJhcnk6Y29tcG9uZW50OkxJQi1HU1BDIiwic291cmNlX3JlZmVyZW5jZSI6eyJyaWdodHNfY2xlYXJhbmNlX2NvbmZlcnJlZCI6ZmFsc2UsInJ1bnRpbWVfcXVhbGlmaWVkIjpmYWxzZSwic2NoZW1hIjoiY291bmNpbG9zLmNvbXBhbnktbGlicmFyeS1wcm92ZW5hbmNlLzEiLCJzaWduYXR1cmVfc3RhdGUiOiJVTlNJR05FRCIsInNvdXJjZV92ZXJzaW9uX3NoYTI1NiI6ImJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmIifSwidGl0bGUiOiJHU1BDIn1dLCJxdWVyeSI6IkdTUEMiLCJzY2hlbWEiOiJtZW9rLm5hdGl2ZS1saWJyYXJ5LXNlYXJjaC8xIn0sInVuaXRfZmxvYXQiOjEuMH0sInNjaGVtYSI6Im1lb2subGlicmFyeS1jYXNlLzEifQ==","record_bytes":3004,"record_sha256":"a38c901355fc074ac118c6596e45b6f2af65364dbd80a3a212d4f9aa0f27cd35","observed_at":"2026-10-12T18:00:01Z","scope":"Synthetic unit integrity fixture"}},"persistence":{"state":"COMMITTED","base_id":"unit-base-123","owner_sub":"unit-owner@example.invalid","change_request_id":"unit-change-request","native_records":{"case":{"id":"unit-native-case","head_commit_id":"unit-head-case"},"result":{"id":"unit-native-result","head_commit_id":"unit-head-result"},"receipt":{"id":"unit-native-receipt","head_commit_id":"unit-head-receipt"}},"store":"Busabase","readback_verified":true,"case_id":"case_a5eef9d3d5abace99dc9bbb7125f34404d2ee7d667ad656f7eabebc2c3179e83","request_sha256":"0d72a2d022f22787143f57407d489534a081aad25abba8b5126738dc865d7109","record_sha256":"198f804e50dc738228aed6867ca434d3c58dddaeafc578453a01d9b7376924d8","record_json_b64":"eyJjcmVhdGVkX2F0IjoiMjAyNi0xMC0xMlQxODowMDowMFoiLCJpZCI6ImNhc2VfYTVlZWY5ZDNkNWFiYWNlOTlkYzliYmI3MTI1ZjM0NDA0ZDJlZTdkNjY3YWQ2NTZmN2VhYmViYzJjMzE3OWU4MyIsIm93bmVyX3N1YiI6InVuaXQtb3duZXJAZXhhbXBsZS5pbnZhbGlkIiwicmVjZWlwdCI6eyJvYnNlcnZlZF9hdCI6IjIwMjYtMTAtMTJUMTg6MDA6MDFaIiwicmVjb3JkX2J5dGVzIjozMDA0LCJyZWNvcmRfanNvbl9iNjQiOiJleUpqY21WaGRHVmtYMkYwSWpvaU1qQXlOaTB4TUMweE1sUXhPRG93TURvd01Gb2lMQ0pwWkNJNkltTmhjMlZmWVRWbFpXWTVaRE5rTldGaVlXTmxPVGxrWXpsaVltSTNNVEkxWmpNME5EQTBaREpsWlRka05qWTNZV1EyTlRabU4yVmhZbVZpWXpKak16RTNPV1U0TXlJc0ltOTNibVZ5WDNOMVlpSTZJblZ1YVhRdGIzZHVaWEpBWlhoaGJYQnNaUzVwYm5aaGJHbGtJaXdpY21WeGRXVnpkQ0k2SWxONWJuUm9aWFJwWXlCSFUxQkRJSFZ1YVhRZ2NtVnhkV1Z6ZENJc0luSmxjWFZsYzNSZmFXUWlPaUoxYm1sMFgzSmxjWFZsYzNSZk1USXpJaXdpY21WeGRXVnpkRjl6YUdFeU5UWWlPaUl3WkRjeVlUSmtNREl5WmpJeU56ZzNNVFF6WmpVM05EQTNaRFE0T1RVek5HRXdPREZoWVdReU5XRmlZbUU0WWpVeE1qWTNNemhrWXpnMk5XUTNNVEE1SWl3aWNtVnpkV3gwSWpwN0ltZHpjR01pT25zaVlXSnBJanA3SW1OdmJuUmxiblJmZEhsd1pTSTZJbUZ3Y0d4cFkyRjBhVzl1TDJwemIyNDdJR05vWVhKelpYUTlkWFJtTFRnaUxDSm1aWFJqYUdWa1gyRjBJam9pTWpBeU5pMHhNQzB4TWxReE9Eb3dNRG93TUZvaUxDSm9kSFJ3WDIxbGRHaHZaQ0k2SWxCUFUxUWlMQ0p0WlhSb2IyUWlPaUowYjI5c2N5OXNhWE4wSWl3aWNtRjNYMkpoYzJVMk5DSTZJbVY1U25CYVEwazJTVzB4YkdJeWMzUmlSMnhwWTIxR2VXVlRNV2haYld0cFRFTktjV015T1hWamJrSnFTV3B2YVUxcE5IZEphWGRwWTIxV2VtUlhlREJKYW5BM1NXNVNkbUl5ZUhwSmFuQmlaWGxLY0dKdVFqRmtSazVxWVVkV2RGbFRTVFpsZVVwM1kyMDVkMXBZU2pCaFYxWjZTV3B3TjBsdFVteGtSMFp3WWtOSk5tVjVTbXhpYmxaMFNXcHdZa2x1VGpGaVZ6Rm9ZMjVyYVZoVGQybGtTR3gzV2xOSk5rbHVUakJqYld4MVdubEtPV1pUZDJsa1NHeDNXbE5KTmtsdE9XbGhiVlpxWkVOS09VeERTblZaVnpGc1NXcHZhVmx0T1doamJWSm1aRWM1TUZsWGVIcEpiakZrWmxnd1BTSXNJbkpoZDE5aWVYUmxjeUk2TVRjNUxDSnlZWGRmYzJoaE1qVTJJam9pTnpZellUVTNOalkzTVRrNU9EVmlNbVV3TVRNM05UWmhabU5sT0RrM1l6WTBNREF3TjJFMllUSXdZVFF5Tm1Nd01qTTRZemswTlRnNE56UTNaREkxTmlJc0luSmxjM0J2Ym5ObElqcDdJbWxrSWpvaWJXVnZheTFzYVdKeVlYSjVMV0ZpYVNJc0ltcHpiMjV5Y0dNaU9pSXlMakFpTENKeVpYTjFiSFFpT25zaWRHOXZiSE1pT2x0N0ltbHVjSFYwVTJOb1pXMWhJanA3SW5CeWIzQmxjblJwWlhNaU9uc2laR1YwWVdsc0lqcDdJbVZ1ZFcwaU9sc2ljM1Z0YldGeWVTSmRMQ0owZVhCbElqb2ljM1J5YVc1bkluMTlMQ0owZVhCbElqb2liMkpxWldOMEluMHNJbTVoYldVaU9pSmliMkZ5WkY5MGIzUmhiSE1pZlYxOWZTd2ljMmxuYm1Wa0lqcG1ZV3h6WlN3aWMyOTFjbU5sSWpvaWFIUjBjSE02THk5amIzVnVZMmxzYjJZdVlXa3ZiV053TDJaeVpXVWlMQ0owYjI5c1gzTmphR1Z0WVY5aWVYUmxjeUk2TVRFMkxDSjBiMjlzWDNOamFHVnRZVjlxYzI5dVgySTJOQ0k2SW1WNVNuQmlia0l4WkVaT2FtRkhWblJaVTBrMlpYbEtkMk50T1hkYVdFb3dZVmRXZWtscWNEZEpiVkpzWkVkR2NHSkRTVFpsZVVwc1ltNVdkRWxxY0dKSmJrNHhZbGN4YUdOdWEybFlVM2RwWkVoc2QxcFRTVFpKYms0d1kyMXNkVnA1U2psbVUzZHBaRWhzZDFwVFNUWkpiVGxwWVcxV2FtUkRTamxNUTBwMVdWY3hiRWxxYjJsWmJUbG9ZMjFTWm1SSE9UQlpWM2g2U1c0d1BTSXNJblJ2YjJ4ZmMyTm9aVzFoWDNOb1lUSTFOaUk2SW1RME16TTJabUUyTnpRMllXUmlNbUZrTVRKak1qZ3pNekZpWXpRd1lUSm1OV1ZrWkRFNE1EVm1OelJsWkdVNVlXRXpNelUyTXpRMlpESTBPR1E1TVRRaUxDSjFiblJ5ZFhOMFpXUmZkRzl2YkY5dmRYUndkWFFpT25SeWRXVjlMQ0poY21kMWJXVnVkSE1pT25zaVpHVjBZV2xzSWpvaWMzVnRiV0Z5ZVNKOUxDSmpiMjUwWlc1MFgzUjVjR1VpT2lKaGNIQnNhV05oZEdsdmJpOXFjMjl1T3lCamFHRnljMlYwUFhWMFppMDRJaXdpWm1WMFkyaGxaRjloZENJNklqSXdNall0TVRBdE1USlVNVGc2TURBNk1EQmFJaXdpYUhSMGNGOXRaWFJvYjJRaU9pSlFUMU5VSWl3aWJXVjBhRzlrSWpvaWRHOXZiSE12WTJGc2JDSXNJbkpoZDE5aVlYTmxOalFpT2lKbGVVcHdXa05KTmtsdE1XeGlNbk4wWWtkc2FXTnRSbmxsVXpGcFlqSkdlVnBEU1hOSmJYQjZZakkxZVdOSFRXbFBhVWw1VEdwQmFVeERTbmxhV0U0eFlraFJhVTl1YzJsWk1qbDFaRWRXZFdSRFNUWlhNM05wWkVkV05HUkRTVFpKYkU0MVltNVNiMXBZVW5CWmVVSnBZakpHZVZwRFFtMWhXR2d3WkZoS2JFbEhPWFZpU0d0cFRFTktNR1ZZUW14SmFtOXBaRWRXTkdSRFNqbFlXREU1SWl3aWNtRjNYMko1ZEdWeklqb3hNakFzSW5KaGQxOXphR0V5TlRZaU9pSTBZV05sTURSbFpUSTJObU0zTWpVelpEVmlNbUk1TXpJM00yUTVZVE0yTmpVM05qWTVPREV3WTJVMFpqVm1NVGd6WmpJNVl6QTNOelZtTVRVek1qTmlJaXdpY21WemNHOXVjMlVpT25zaWFXUWlPaUp0Wlc5ckxXeHBZbkpoY25rdFltOWhjbVFpTENKcWMyOXVjbkJqSWpvaU1pNHdJaXdpY21WemRXeDBJanA3SW1OdmJuUmxiblFpT2x0N0luUmxlSFFpT2lKVGVXNTBhR1YwYVdNZ1ltOWhjbVFnWm1sNGRIVnlaU0J2Ym14NUlpd2lkSGx3WlNJNkluUmxlSFFpZlYxOWZTd2ljMmxuYm1Wa0lqcG1ZV3h6WlN3aWMyOTFjbU5sSWpvaWFIUjBjSE02THk5amIzVnVZMmxzYjJZdVlXa3ZiV053TDJaeVpXVWlMQ0owYjI5c0lqb2lZbTloY21SZmRHOTBZV3h6SWl3aWRXNTBjblZ6ZEdWa1gzUnZiMnhmYjNWMGNIVjBJanAwY25WbGZTd2liR2xpY21GeWVTSTZleUppWVhObFgybGtJam9pZFc1cGRDMWlZWE5sTFRFeU15SXNJbVZ1ZEhKcFpYTWlPbHQ3SW1KdlpIa2lPbnNpWlc1MGFYUjVYMmxrSWpvaVRFbENMVWRUVUVNaUxDSnJhVzVrSWpvaVkyOXRjRzl1Wlc1MElpd2liV1ZoYzNWeVpXMWxiblJmWVhWMGFHOXlhWFI1SWpwbVlXeHpaU3dpY0hWaWJHbGpZWFJwYjI1ZlkyeGxZWEpoYm1ObElqb2lUazlVWDBkU1FVNVVSVVJmUWxsZlNVMVFUMUpVSWl3aWMyTm9aVzFoSWpvaVkyOTFibU5wYkc5ekxtTnZiWEJoYm5rdGJHbGljbUZ5ZVMxbGJuUnBkSGt2TVNJc0luTnZkWEpqWlY5clpYa2lPaUpzYVdKeVlYSjVPbU52YlhCdmJtVnVkRHBNU1VJdFIxTlFReUlzSW5OdmRYSmpaVjl6ZEdGMFpTSTZJa3hQUTBGTVgxTlBWVkpEUlY5U1JVWkZVa1ZPUTBVaUxDSjBZWE5yWDJGMWRHaHZjbWwwZVNJNlptRnNjMlVzSW5WdWFYUmZibTkwWlNJNklsTjViblJvWlhScFl5QmpZV2JEcVNCemIzVnlZMlVpTENKMlpYSnphVzl1WDNOb1lUSTFOaUk2SW1KaVltSmlZbUppWW1KaVltSmlZbUppWW1KaVltSmlZbUppWW1KaVltSmlZbUppWW1KaVltSmlZbUppWW1KaVltSmlZbUppWW1KaVltSmlZbUppWW1JaWZTd2lhR1ZoWkY5amIyMXRhWFJmYVdRaU9pSjFibWwwTFd4cFluSmhjbmt0YUdWaFpDSXNJbTVoZEdsMlpWOXlaV052Y21SZmFXUWlPaUoxYm1sMExXeHBZbkpoY25rdFpXNTBhWFI1SWl3aWMyOTFjbU5sWDJ0bGVTSTZJbXhwWW5KaGNuazZZMjl0Y0c5dVpXNTBPa3hKUWkxSFUxQkRJaXdpYzI5MWNtTmxYM0psWm1WeVpXNWpaU0k2ZXlKeWFXZG9kSE5mWTJ4bFlYSmhibU5sWDJOdmJtWmxjbkpsWkNJNlptRnNjMlVzSW5KMWJuUnBiV1ZmY1hWaGJHbG1hV1ZrSWpwbVlXeHpaU3dpYzJOb1pXMWhJam9pWTI5MWJtTnBiRzl6TG1OdmJYQmhibmt0YkdsaWNtRnllUzF3Y205MlpXNWhibU5sTHpFaUxDSnphV2R1WVhSMWNtVmZjM1JoZEdVaU9pSlZUbE5KUjA1RlJDSXNJbk52ZFhKalpWOTJaWEp6YVc5dVgzTm9ZVEkxTmlJNkltSmlZbUppWW1KaVltSmlZbUppWW1KaVltSmlZbUppWW1KaVltSmlZbUppWW1KaVltSmlZbUppWW1KaVltSmlZbUppWW1KaVltSmlZbUppWW1KaVltSWlmU3dpZEdsMGJHVWlPaUpIVTFCREluMWRMQ0p4ZFdWeWVTSTZJa2RUVUVNaUxDSnpZMmhsYldFaU9pSnRaVzlyTG01aGRHbDJaUzFzYVdKeVlYSjVMWE5sWVhKamFDOHhJbjBzSW5WdWFYUmZabXh2WVhRaU9qRXVNSDBzSW5OamFHVnRZU0k2SW0xbGIyc3ViR2xpY21GeWVTMWpZWE5sTHpFaWZRPT0iLCJyZWNvcmRfc2hhMjU2IjoiYTM4YzkwMTM1NWZjMDc0YWMxMThjNjU5NmU0NWI2ZjJhZjY1MzY0ZGJkODBhM2EyMTJkNGY5YWEwZjI3Y2QzNSIsInNjaGVtYSI6Im1lb2sudW5zaWduZWQtaW50ZWdyaXR5LXJlY2VpcHQvMSIsInNjb3BlIjoiU3ludGhldGljIHVuaXQgaW50ZWdyaXR5IGZpeHR1cmUiLCJzaWduZWQiOmZhbHNlLCJ1bnNpZ25lZCI6dHJ1ZX0sInJlcXVlc3QiOiJTeW50aGV0aWMgR1NQQyB1bml0IHJlcXVlc3QiLCJyZXF1ZXN0X2lkIjoidW5pdF9yZXF1ZXN0XzEyMyIsInJlcXVlc3Rfc2hhMjU2IjoiMGQ3MmEyZDAyMmYyMjc4NzE0M2Y1NzQwN2Q0ODk1MzRhMDgxYWFkMjVhYmJhOGI1MTI2NzM4ZGM4NjVkNzEwOSIsInJlc3VsdCI6eyJnc3BjIjp7ImFiaSI6eyJjb250ZW50X3R5cGUiOiJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04IiwiZmV0Y2hlZF9hdCI6IjIwMjYtMTAtMTJUMTg6MDA6MDBaIiwiaHR0cF9tZXRob2QiOiJQT1NUIiwibWV0aG9kIjoidG9vbHMvbGlzdCIsInJhd19iYXNlNjQiOiJleUpwWkNJNkltMWxiMnN0YkdsaWNtRnllUzFoWW1raUxDSnFjMjl1Y25Caklqb2lNaTR3SWl3aWNtVnpkV3gwSWpwN0luUnZiMnh6SWpwYmV5SnBibkIxZEZOamFHVnRZU0k2ZXlKd2NtOXdaWEowYVdWeklqcDdJbVJsZEdGcGJDSTZleUpsYm5WdElqcGJJbk4xYlcxaGNua2lYU3dpZEhsd1pTSTZJbk4wY21sdVp5SjlmU3dpZEhsd1pTSTZJbTlpYW1WamRDSjlMQ0p1WVcxbElqb2lZbTloY21SZmRHOTBZV3h6SW4xZGZYMD0iLCJyYXdfYnl0ZXMiOjE3OSwicmF3X3NoYTI1NiI6Ijc2M2E1NzY2NzE5OTg1YjJlMDEzNzU2YWZjZTg5N2M2NDAwMDdhNmEyMGE0MjZjMDIzOGM5NDU4ODc0N2QyNTYiLCJyZXNwb25zZSI6eyJpZCI6Im1lb2stbGlicmFyeS1hYmkiLCJqc29ucnBjIjoiMi4wIiwicmVzdWx0Ijp7InRvb2xzIjpbeyJpbnB1dFNjaGVtYSI6eyJwcm9wZXJ0aWVzIjp7ImRldGFpbCI6eyJlbnVtIjpbInN1bW1hcnkiXSwidHlwZSI6InN0cmluZyJ9fSwidHlwZSI6Im9iamVjdCJ9LCJuYW1lIjoiYm9hcmRfdG90YWxzIn1dfX0sInNpZ25lZCI6ZmFsc2UsInNvdXJjZSI6Imh0dHBzOi8vY291bmNpbG9mLmFpL21jcC9mcmVlIiwidG9vbF9zY2hlbWFfYnl0ZXMiOjExNiwidG9vbF9zY2hlbWFfanNvbl9iNjQiOiJleUpwYm5CMWRGTmphR1Z0WVNJNmV5SndjbTl3WlhKMGFXVnpJanA3SW1SbGRHRnBiQ0k2ZXlKbGJuVnRJanBiSW5OMWJXMWhjbmtpWFN3aWRIbHdaU0k2SW5OMGNtbHVaeUo5ZlN3aWRIbHdaU0k2SW05aWFtVmpkQ0o5TENKdVlXMWxJam9pWW05aGNtUmZkRzkwWVd4ekluMD0iLCJ0b29sX3NjaGVtYV9zaGEyNTYiOiJkNDMzNmZhNjc0NmFkYjJhZDEyYzI4MzMxYmM0MGEyZjVlZGQxODA1Zjc0ZWRlOWFhMzM1NjM0NmQyNDhkOTE0IiwidW50cnVzdGVkX3Rvb2xfb3V0cHV0Ijp0cnVlfSwiYXJndW1lbnRzIjp7ImRldGFpbCI6InN1bW1hcnkifSwiY29udGVudF90eXBlIjoiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOCIsImZldGNoZWRfYXQiOiIyMDI2LTEwLTEyVDE4OjAwOjAwWiIsImh0dHBfbWV0aG9kIjoiUE9TVCIsIm1ldGhvZCI6InRvb2xzL2NhbGwiLCJyYXdfYmFzZTY0IjoiZXlKcFpDSTZJbTFsYjJzdGJHbGljbUZ5ZVMxaWIyRnlaQ0lzSW1wemIyNXljR01pT2lJeUxqQWlMQ0p5WlhOMWJIUWlPbnNpWTI5dWRHVnVkQ0k2VzNzaWRHVjRkQ0k2SWxONWJuUm9aWFJwWXlCaWIyRnlaQ0JtYVhoMGRYSmxJRzl1YkhraUxDSjBlWEJsSWpvaWRHVjRkQ0o5WFgxOSIsInJhd19ieXRlcyI6MTIwLCJyYXdfc2hhMjU2IjoiNGFjZTA0ZWUyNjZjNzI1M2Q1YjJiOTMyNzNkOWEzNjY1NzY2OTgxMGNlNGY1ZjE4M2YyOWMwNzc1ZjE1MzIzYiIsInJlc3BvbnNlIjp7ImlkIjoibWVvay1saWJyYXJ5LWJvYXJkIiwianNvbnJwYyI6IjIuMCIsInJlc3VsdCI6eyJjb250ZW50IjpbeyJ0ZXh0IjoiU3ludGhldGljIGJvYXJkIGZpeHR1cmUgb25seSIsInR5cGUiOiJ0ZXh0In1dfX0sInNpZ25lZCI6ZmFsc2UsInNvdXJjZSI6Imh0dHBzOi8vY291bmNpbG9mLmFpL21jcC9mcmVlIiwidG9vbCI6ImJvYXJkX3RvdGFscyIsInVudHJ1c3RlZF90b29sX291dHB1dCI6dHJ1ZX0sImxpYnJhcnkiOnsiYmFzZV9pZCI6InVuaXQtYmFzZS0xMjMiLCJlbnRyaWVzIjpbeyJib2R5Ijp7ImVudGl0eV9pZCI6IkxJQi1HU1BDIiwia2luZCI6ImNvbXBvbmVudCIsIm1lYXN1cmVtZW50X2F1dGhvcml0eSI6ZmFsc2UsInB1YmxpY2F0aW9uX2NsZWFyYW5jZSI6Ik5PVF9HUkFOVEVEX0JZX0lNUE9SVCIsInNjaGVtYSI6ImNvdW5jaWxvcy5jb21wYW55LWxpYnJhcnktZW50aXR5LzEiLCJzb3VyY2Vfa2V5IjoibGlicmFyeTpjb21wb25lbnQ6TElCLUdTUEMiLCJzb3VyY2Vfc3RhdGUiOiJMT0NBTF9TT1VSQ0VfUkVGRVJFTkNFIiwidGFza19hdXRob3JpdHkiOmZhbHNlLCJ1bml0X25vdGUiOiJTeW50aGV0aWMgY2Fmw6kgc291cmNlIiwidmVyc2lvbl9zaGEyNTYiOiJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiIn0sImhlYWRfY29tbWl0X2lkIjoidW5pdC1saWJyYXJ5LWhlYWQiLCJuYXRpdmVfcmVjb3JkX2lkIjoidW5pdC1saWJyYXJ5LWVudGl0eSIsInNvdXJjZV9rZXkiOiJsaWJyYXJ5OmNvbXBvbmVudDpMSUItR1NQQyIsInNvdXJjZV9yZWZlcmVuY2UiOnsicmlnaHRzX2NsZWFyYW5jZV9jb25mZXJyZWQiOmZhbHNlLCJydW50aW1lX3F1YWxpZmllZCI6ZmFsc2UsInNjaGVtYSI6ImNvdW5jaWxvcy5jb21wYW55LWxpYnJhcnktcHJvdmVuYW5jZS8xIiwic2lnbmF0dXJlX3N0YXRlIjoiVU5TSUdORUQiLCJzb3VyY2VfdmVyc2lvbl9zaGEyNTYiOiJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiIn0sInRpdGxlIjoiR1NQQyJ9XSwicXVlcnkiOiJHU1BDIiwic2NoZW1hIjoibWVvay5uYXRpdmUtbGlicmFyeS1zZWFyY2gvMSJ9LCJ1bml0X2Zsb2F0IjoxLjB9LCJzY2hlbWEiOiJtZW9rLmxpYnJhcnktY2FzZS8xIn0=","record_bytes":7304}},"expected":{"caseId":"case_a5eef9d3d5abace99dc9bbb7125f34404d2ee7d667ad656f7eabebc2c3179e83","resultSha256":"8787eb8155990d67ed9cd0aadec2cd2887df3fbe71843de464746eed99ee7f44","receiptSha256":"5d48e37d971eb06a8f18d0500c07fc632b2ba5a922144f9945455e8fb7db8d43"}};
const fixture = () => structuredClone(unit.reply);
const subject = unit.reply.owner_sub;
const request = unit.reply.case.request;
const requestId = unit.reply.case.request_id;
const caseId = unit.expected.caseId;
const originalFetch = globalThis.fetch;
const client = (getToken: () => string | null = () => "unit-token-only") => createClient({ subject, token: "unit-token-only", getToken });
const response = (body = fixture(), status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });
async function withFetch(fake: (...args: any[]) => Promise<Response>, work: () => Promise<unknown>) { globalThis.fetch = fake; try { return await work(); } finally { globalThis.fetch = originalFetch; } }
const read = (current = client()) => current.read(caseId, { signal: new AbortController().signal });
const submit = (current = client()) => current.submit(request, { requestId, signal: new AbortController().signal });
const hash = (raw: string | Uint8Array) => createHash("sha256").update(raw).digest("hex");
function setRaw(observation: any, raw: string, contentType = "application/json") {
  const bytes = Buffer.from(raw);
  Object.assign(observation, { raw_base64: bytes.toString("base64"), raw_bytes: bytes.length, raw_sha256: hash(bytes), content_type: contentType });
}
function rebind(body: any) {
  const core = { ...body.case }; delete core.receipt;
  const rawCore = Buffer.from(JSON.stringify(core));
  Object.assign(body.case.receipt, { record_json_b64: rawCore.toString("base64"), record_bytes: rawCore.length, record_sha256: hash(rawCore) });
  const rawCase = Buffer.from(JSON.stringify(body.case));
  Object.assign(body.persistence, { record_json_b64: rawCase.toString("base64"), record_bytes: rawCase.length, record_sha256: hash(rawCase) });
  return body;
}

test("factory is side-effect-free and recovery ID matches the actual Python definition", async () => {
  let calls = 0;
  await withFetch(async () => { calls += 1; throw new Error("never"); }, async () => {
    const current = client(); assert.equal(calls, 0);
    assert.equal(await current.caseIdForRequest(requestId), caseId);
    assert.equal(calls, 0);
  });
});

test("actual POST shape is same-origin, bearer-bound, no redirect/cache/cookies", async () => {
  let calls = 0;
  await withFetch(async (url, init) => {
    calls += 1;
    assert.equal(url, "/api/meok-library/cases");
    assert.equal(init.method, "POST"); assert.equal(init.redirect, "error"); assert.equal(init.cache, "no-store"); assert.equal(init.credentials, "omit");
    assert.equal(init.headers.authorization, "Bearer unit-token-only");
    assert.deepEqual(JSON.parse(init.body), { request, request_id: requestId });
    return response();
  }, async () => { const saved = await submit(); assert.equal(saved.caseId, caseId); if (!saved.persistence.merged) throw new Error("Expected committed fixture"); assert.equal(saved.persistence.nativeCommitId, "unit-head-case"); });
  assert.equal(calls, 1);
});

test("the original supplied request and surrounding whitespace are retained exactly", async () => {
  const supplied = "  Synthetic GSPC unit request  ";
  const body = fixture();
  body.case.request = supplied; body.case.request_sha256 = hash(supplied);
  body.persistence.request_sha256 = body.case.request_sha256; rebind(body);
  await withFetch(async (_url, init) => { assert.equal(JSON.parse(init.body).request, supplied); return response(body); }, async () => {
    const saved = await client().submit(supplied, { requestId, signal: new AbortController().signal });
    assert.equal(saved.request, supplied);
  });
});

test("reopen reads the same authoritative case with actual native result/receipt IDs", async () => {
  await withFetch(async (url, init) => { assert.equal(url, `/api/meok-library/cases/${caseId}`); assert.equal(init.method, "GET"); return response(); }, async () => {
    const saved = await read(); assert.equal(saved.result.id, "unit-native-result"); assert.equal(saved.receipt.id, "unit-native-receipt"); assert.equal(saved.ownerSubject, subject);
  });
});

test("result and receipt digests preserve exact Python 1.0 and non-ASCII member bytes", async () => {
  await withFetch(async () => response(), async () => {
    const saved = await read();
    assert.equal(saved.result.sha256, unit.expected.resultSha256);
    assert.equal(saved.receipt.sha256, unit.expected.receiptSha256);
    assert.notEqual(saved.result.sha256, createHash("sha256").update(JSON.stringify(unit.reply.case.result)).digest("hex"));
    assert.equal(saved.receipt.createdAt, unit.reply.case.receipt.observed_at);
  });
});

test("crossed owner, case, request and request digest all fail closed", async () => {
  for (const mutate of [(body: any) => { body.owner_sub = "other-owner"; }, (body: any) => { body.case.id = "case_" + "a".repeat(64); }, (body: any) => { body.case.request_id = "other_request_123"; }, (body: any) => { body.case.request_sha256 = "a".repeat(64); }]) {
    const body = fixture(); mutate(body);
    await withFetch(async () => response(body), async () => { await assert.rejects(read(), (error: any) => error.code === "invalid_response"); });
  }
});

test("pending storage, wrong owner/base, missing native heads and duplicate native IDs are rejected", async () => {
  for (const mutate of [(body: any) => { body.persistence.state = "PENDING"; }, (body: any) => { body.persistence.owner_sub = "foreign"; }, (body: any) => { body.persistence.base_id = ""; }, (body: any) => { delete body.persistence.native_records.receipt.head_commit_id; }, (body: any) => { body.persistence.native_records.result.id = body.persistence.native_records.case.id; }]) {
    const body = fixture(); mutate(body);
    await withFetch(async () => response(body), async () => { await assert.rejects(read(), (error: any) => error.code === "invalid_response"); });
  }
});

test("false readback, wrong store and wholecase byte/digest mismatch never become saved", async () => {
  for (const mutate of [(body: any) => { body.persistence.readback_verified = false; }, (body: any) => { body.persistence.store = "other"; }, (body: any) => { body.persistence.record_bytes += 1; }, (body: any) => { body.persistence.record_sha256 = "a".repeat(64); }]) {
    const body = fixture(); mutate(body);
    await withFetch(async () => response(body), async () => { await assert.rejects(read()); });
  }
});

test("unsigned receipt and receipt-to-core binding are required", async () => {
  for (const mutate of [(body: any) => { body.case.receipt.signed = true; }, (body: any) => { body.case.receipt.record_sha256 = "a".repeat(64); }]) {
    const body = fixture(); mutate(body);
    await withFetch(async () => response(body), async () => { await assert.rejects(read()); });
  }
});

test("actual GSPC entity query, Base and exactly one eligible native library entry are required", async () => {
  for (const mutate of [
    (library: any) => { library.query = request; }, (library: any) => { library.base_id = "foreign-base"; },
    (library: any) => { library.entries = []; }, (library: any) => { library.entries.push(structuredClone(library.entries[0])); },
    (library: any) => { library.entries[0].body.measurement_authority = true; },
    (library: any) => { library.entries[0].source_reference.source_version_sha256 = "c".repeat(64); },
    (library: any) => { library.entries[0].source_reference.runtime_qualified = true; },
    (library: any) => { delete library.entries[0].head_commit_id; },
    (library: any) => { library.entries[0].body.source_key = "foreign-source"; },
  ]) {
    const body = fixture(); mutate(body.case.result.library); rebind(body);
    await withFetch(async () => response(body), async () => { await assert.rejects(read(), (error: any) => error.code === "invalid_response"); });
  }
});

test("library lookup uses a recorded case timestamp without inventing search fetch time", async () => {
  await withFetch(async () => response(), async () => {
    const saved = await read();
    assert.equal(saved.result.sources[0].recordedAt, unit.reply.case.created_at);
    assert.equal(saved.result.sources[0].fetchedAt, undefined);
    assert.equal(saved.result.sources[0].title, "Library lookup recorded with case");
  });
});

test("board content requires one to 32 text blocks and object structuredContent", async () => {
  for (const value of [{}, { content: [] }, { content: [{ type: "image", data: "unit" }] },
    { content: Array.from({ length: 33 }, () => ({ type: "text", text: "unit" })) },
    { content: [{ type: "text", text: 7 }] }, { content: [{ type: "text", text: "   " }] }, { content: [{ type: "text", text: "unit" }], structuredContent: [] }]) {
    const body = fixture(), observation = body.case.result.gspc;
    observation.response.result = value; setRaw(observation, JSON.stringify(observation.response)); rebind(body);
    await withFetch(async () => response(body), async () => { await assert.rejects(read(), (error: any) => error.code === "invalid_response"); });
  }
  const body = fixture(), observation = body.case.result.gspc;
  observation.response.result.structuredContent = { unit: true }; setRaw(observation, JSON.stringify(observation.response)); rebind(body);
  await withFetch(async () => response(body), async () => { assert.equal((await read()).caseId, caseId); });
});

test("MCP exact raw response hash and parsed saved message must both match", async () => {
  for (const mutate of [(body: any) => { body.case.result.gspc.raw_sha256 = "a".repeat(64); }, (body: any) => { body.case.result.gspc.response.result.content[0].text = "altered"; }]) {
    const body = fixture(); mutate(body); rebind(body);
    await withFetch(async () => response(body), async () => { await assert.rejects(read()); });
  }
});

test("MCP result.isError and RPC errors are rejected even in otherwise digest-bound saves", async () => {
  for (const mutate of [(message: any) => { message.result.isError = true; }, (message: any) => { delete message.result; message.error = { code: -1, message: "unit error" }; }]) {
    const body = fixture(); const observation = body.case.result.gspc;
    mutate(observation.response); setRaw(observation, JSON.stringify(observation.response)); rebind(body);
    await withFetch(async () => response(body), async () => { await assert.rejects(read()); });
  }
});

test("unique actual board descriptor and exact descriptor bytes are required", async () => {
  for (const mutate of [(abi: any) => { abi.response.result.tools.push(structuredClone(abi.response.result.tools[0])); setRaw(abi, JSON.stringify(abi.response)); }, (abi: any) => { abi.tool_schema_sha256 = "a".repeat(64); }]) {
    const body = fixture(); mutate(body.case.result.gspc.abi); rebind(body);
    await withFetch(async () => response(body), async () => { await assert.rejects(read()); });
  }
});

test("valid MCP SSE frames preserve exact raw hashes and one matching message", async () => {
  const body = fixture();
  for (const observation of [body.case.result.gspc, body.case.result.gspc.abi]) {
    setRaw(observation, `: unit keepalive\nevent: message\ndata: ${JSON.stringify(observation.response)}\n\n`, "text/event-stream; charset=utf-8");
  }
  rebind(body);
  await withFetch(async () => response(body), async () => { const saved = await read(); assert.equal("sources" in saved ? saved.sources : undefined, undefined); assert.equal(saved.result.sources[1].sha256, body.case.result.gspc.raw_sha256); });
});

test("SSE duplicate expected responses and ignored error events fail closed", async () => {
  for (const suffix of [(message: any) => `event: message\ndata: ${JSON.stringify(message)}\n\n`, () => 'event: error\ndata: {"jsonrpc":"2.0","id":"other","error":{"code":-1}}\n\n']) {
    const body = fixture(); const observation = body.case.result.gspc;
    setRaw(observation, `event: message\ndata: ${JSON.stringify(observation.response)}\n\n${suffix(observation.response)}`, "text/event-stream"); rebind(body);
    await withFetch(async () => response(body), async () => { await assert.rejects(read()); });
  }
});

test("ambiguous duplicate-key outer JSON is rejected", async () => {
  await withFetch(async () => new Response('{"saved":false,"saved":true}', { headers: { "content-type": "application/json" } }), async () => { await assert.rejects(read()); });
});

test("non-JSON and oversized replies are rejected even without Content-Length", async () => {
  await withFetch(async () => new Response("not JSON"), async () => { await assert.rejects(read()); });
  await withFetch(async () => new Response(" ".repeat(524289), { headers: { "content-type": "application/json" } }), async () => { await assert.rejects(read()); });
});

test("a changed token after async work cannot expose a result to the new session", async () => {
  let token = "unit-token-only";
  await withFetch(async () => { token = "different-unit-token"; return response(); }, async () => { await assert.rejects(read(client(() => token)), (error: any) => error.code === "session_changed"); });
});

test("lost POST response yields the same recovery ID and never retries", async () => {
  let calls = 0;
  await withFetch(async () => { calls += 1; throw new Error("private bearer details must not escape"); }, async () => {
    await assert.rejects(submit(), (error: any) => error.caseId === caseId && error.outcomeUnknown === true && !error.message.includes("bearer"));
  });
  assert.equal(calls, 1);
});

test("HTTP503 and untrusted foreign recovery metadata preserve the locally derived recovery ID", async () => {
  await withFetch(async () => response({ saved: false, error: "private", case_id: "foreign", retry_post: true }, 503), async () => {
    await assert.rejects(submit(), (error: any) => error.caseId === caseId && error.outcomeUnknown === true);
  });
});

test("authorization errors expose fixed codes without raw server details", async () => {
  await withFetch(async () => response({ saved: false, error: "invalid_session", detail: "secret token details" }, 403), async () => {
    await assert.rejects(submit(), (error: any) => error.code === "forbidden" && error.outcomeUnknown === false && !error.message.includes("secret"));
  });
});

test("declared unknown write survives HTTP401/403 and requires same-case recovery", async () => {
  for (const status of [401, 403]) {
    await withFetch(async () => response({ saved: false, error: "invalid_or_expired_session", case_id: caseId, outcome_unknown: true, retry_post: false }, status), async () => {
      await assert.rejects(submit(), (error: any) => error.caseId === caseId && error.outcomeUnknown === true && ["unauthorized", "forbidden"].includes(error.code));
    });
  }
});

test("unlisted error status and malformed safe error codes are rejected", async () => {
  for (const [status, body] of [[500, { saved: false, error: "internal_error" }], [503, { saved: false, error: "unsafe message" }]] as const) {
    await withFetch(async () => response(body, status), async () => { await assert.rejects(submit(), (error: any) => error.code === "invalid_response" && error.outcomeUnknown === true); });
  }
});

test("GET404 is a distinct recoverable read error, never a saved acknowledgement", async () => {
  await withFetch(async () => response({ saved: false, error: "case_not_found" }, 404), async () => { await assert.rejects(read(), (error: any) => error.code === "not_found" && error.caseId === caseId); });
});

test("invalid requests, IDs, lone surrogates and a pre-aborted operation send no request", async () => {
  let calls = 0;
  await withFetch(async () => { calls += 1; return response(); }, async () => {
    const current = client();
    for (const value of ["x".repeat(2001), "\ud800", " ", "\u0000".repeat(2000), "Synthetic unsupported unit request", "GSPCplus is not the entity word"]) await assert.rejects(current.submit(value, { requestId, signal: new AbortController().signal }));
    await assert.rejects(current.submit(request, { requestId: "short", signal: new AbortController().signal }));
    await assert.rejects(current.submit(request, { requestId: 12345678 as unknown as string, signal: new AbortController().signal }));
    await assert.rejects(current.read("https://other.invalid", { signal: new AbortController().signal }));
    const controller = new AbortController(); controller.abort();
    await assert.rejects(current.submit(request, { requestId, signal: controller.signal }), (error: any) => error.outcomeUnknown === false);
  });
  assert.equal(calls, 0);
});

test("35-second overall deadline ends a stalled POST without retrying or losing recovery ID", async () => {
  const globals = globalThis as any;
  const oldSet = globals.setTimeout, oldClear = globals.clearTimeout;
  const timers = new Set<{ fn: () => void; delay: number }>();
  let started: () => void = () => undefined;
  const fetchStarted = new Promise<void>(resolve => { started = resolve; });
  let calls = 0;
  globals.setTimeout = (fn: () => void, delay: number) => { const timer = { fn, delay }; timers.add(timer); return timer; };
  globals.clearTimeout = (timer: { fn: () => void; delay: number }) => { timers.delete(timer); };
  try {
    await withFetch(async () => { calls += 1; started(); return new Promise(() => {}); }, async () => {
      const pending = submit();
      await fetchStarted;
      assert.ok([...timers].every(timer => timer.delay === 35000));
      for (const timer of [...timers]) timer.fn();
      await assert.rejects(pending, (error: any) => error.caseId === caseId && error.outcomeUnknown === true);
    });
  } finally { globals.setTimeout = oldSet; globals.clearTimeout = oldClear; }
  assert.equal(calls, 1);
});


function pendingReply(): any {
  const body = fixture();
  body.saved = false;
  delete body.persistence.native_records;
  Object.assign(body.persistence, {
    state: "AWAITING_REVIEW", readback_verified: false, proposal_readback_verified: true,
    retry_post: false, review_status: "in_review",
    proposed_records: {
      case: { operation_id: "proposal-case-op", head_commit_id: "proposal-case-head", payload_sha256: "c".repeat(64) },
      result: { operation_id: "proposal-result-op", head_commit_id: "proposal-result-head", payload_sha256: "d".repeat(64) },
      receipt: { operation_id: "proposal-receipt-op", head_commit_id: "proposal-receipt-head", payload_sha256: "e".repeat(64) },
    },
  });
  return body;
}
test("HTTP202 verifies exact case/result/receipt bytes without inventing native record IDs", async () => {
  await withFetch(async () => response(pendingReply(), 202), async () => {
    const value = await read();
    assert.equal(value.persistence.merged, false); assert.equal(value.persistence.nativeReadbackVerified, false);
    assert.equal(value.result.id, "proposal-result-head"); assert.equal(value.receipt.id, "proposal-receipt-head");
    assert.equal(value.result.sha256, unit.expected.resultSha256); assert.equal(value.receipt.sha256, unit.expected.receiptSha256);
    assert.equal("nativeCommitId" in value.persistence, false);
    if (value.persistence.merged) throw new Error("Expected pending fixture");
    assert.equal(value.persistence.proposedRecords.case.payloadSha256, "c".repeat(64));
  });
});
test("pending POST returns once and does not retry or poll automatically", async () => {
  let calls = 0;
  await withFetch(async (_url, init) => { calls++; assert.equal(init.method, "POST"); return response(pendingReply(), 202); }, async () => {
    const value = await submit(); assert.equal(value.persistence.merged, false);
    await Promise.resolve(); assert.equal(calls, 1);
  });
});
test("fresh-client reopening and verified promotion use GET without repeating the POST", async () => {
  const methods: string[] = []; let reads = 0;
  await withFetch(async (_url, init) => {
    methods.push(init.method);
    if (init.method === "POST") return response(pendingReply(), 202);
    return ++reads === 1 ? response(pendingReply(), 202) : response();
  }, async () => {
    const proposed = await submit();
    const reopened = await read(client());
    const committed = await read(client());
    assert.equal(proposed.persistence.merged, false); assert.equal(reopened.persistence.merged, false);
    assert.equal(committed.persistence.merged, true);
    assert.equal(proposed.caseId, reopened.caseId); assert.equal(reopened.caseId, committed.caseId);
    assert.equal(proposed.result.sha256, committed.result.sha256);
    assert.deepEqual(methods, ["POST", "GET", "GET"]);
  });
});
test("HTTP status and saved/persistence state must agree", async () => {
  for (const [body, status] of [[pendingReply(), 200], [fixture(), 202], [pendingReply(), 201]]) {
    await withFetch(async () => response(body, status), async () => { await assert.rejects(read()); });
  }
  const body = pendingReply(); body.saved = true;
  await withFetch(async () => response(body, 202), async () => { await assert.rejects(read()); });
});
test("all review statuses remain pending until an actual committed response", async () => {
  for (const status of ["in_review", "changes_requested", "approved"]) {
    const body = pendingReply(); body.persistence.review_status = status;
    await withFetch(async () => response(body, 202), async () => { const value = await read(); assert.equal(value.persistence.merged, false); });
  }
});
test("missing, duplicated or fabricated proposal references fail closed", async () => {
  for (const mutate of [
    (b: any) => { delete b.persistence.proposed_records.receipt; },
    (b: any) => { b.persistence.proposed_records.result.operation_id = b.persistence.proposed_records.case.operation_id; },
    (b: any) => { b.persistence.proposed_records.receipt.head_commit_id = b.persistence.proposed_records.case.head_commit_id; },
    (b: any) => { b.persistence.proposed_records.result.payload_sha256 = "bad-digest"; },
    (b: any) => { b.persistence.proposed_records.case.id = "fabricated-record"; },
    (b: any) => { b.persistence.native_records = {}; },
  ]) { const body = pendingReply(); mutate(body); await withFetch(async () => response(body, 202), async () => { await assert.rejects(read()); }); }
});
test("pending review requires truthful readback flags, retry refusal and review state", async () => {
  for (const mutate of [
    (b: any) => { b.persistence.readback_verified = true; },
    (b: any) => { b.persistence.proposal_readback_verified = false; },
    (b: any) => { delete b.persistence.retry_post; },
    (b: any) => { b.persistence.retry_post = true; },
    (b: any) => { b.persistence.review_status = "merged"; },
  ]) { const body = pendingReply(); mutate(body); await withFetch(async () => response(body, 202), async () => { await assert.rejects(read()); }); }
});
test("pending status never skips owner and exact byte integrity checks", async () => {
  for (const mutate of [
    (b: any) => { b.owner_sub = "other-owner"; },
    (b: any) => { b.persistence.record_bytes++; },
    (b: any) => { b.persistence.record_sha256 = "a".repeat(64); },
    (b: any) => { b.case.receipt.signed = true; },
  ]) { const body = pendingReply(); mutate(body); await withFetch(async () => response(body, 202), async () => { await assert.rejects(read()); }); }
});
test("an invalid pending POST reply keeps outcome unknown with one POST", async () => {
  let calls = 0; const body = pendingReply(); body.persistence.record_sha256 = "f".repeat(64);
  await withFetch(async () => { calls++; return response(body, 202); }, async () => {
    await assert.rejects(submit(), (error: any) => error.outcomeUnknown === true && error.caseId === caseId);
    assert.equal(calls, 1);
  });
});
test("a changed token cannot expose a pending response to a new session", async () => {
  let token = "unit-token-only";
  await withFetch(async () => { token = "changed-token"; return response(pendingReply(), 202); }, async () => {
    await assert.rejects(read(client(() => token)), (error: any) => error.code === "session_changed");
  });
});
test("committed HTTP200 cannot carry stale pending proposal claims", async () => {
  const body = fixture(); body.persistence.proposed_records = pendingReply().persistence.proposed_records;
  await withFetch(async () => response(body), async () => { await assert.rejects(read()); });
});

// The token must come from the verified subject/token capsule, never a storage read.
const unchangedAttempt = (error: unknown) => {
  if (!(error instanceof Error) || !("code" in error) || !("outcomeUnknown" in error)) return false;
  return error.code === "session_changed" && error.outcomeUnknown === false;
};
const actions = (current: CompanyCaseClient): (() => Promise<unknown>)[] => [
  () => current.caseIdForRequest(requestId),
  () => read(current),
  () => submit(current),
];

test("an already-switched storage token cannot bind the old verified subject at construction", async () => {
  let calls = 0;
  await withFetch(async () => { calls += 1; throw new Error("No network is allowed"); }, async () => {
    const current = createClient({ subject, token: "unit-token-only", getToken: () => "other-session-token" });
    for (const action of actions(current)) await assert.rejects(action(), unchangedAttempt);
  });
  assert.equal(calls, 0);
});

test("a storage switch before any old-client action sends no request under the new bearer", async () => {
  let token = "unit-token-only", calls = 0;
  const current = client(() => token);
  token = "other-session-token";
  await withFetch(async () => { calls += 1; throw new Error("No network is allowed"); }, async () => {
    for (const action of actions(current)) await assert.rejects(action(), unchangedAttempt);
  });
  assert.equal(calls, 0);
});

test("the verified capsule is copied immutably without reading storage during construction", async () => {
  let reads = 0, calls = 0;
  const options = { subject, token: "unit-token-only", getToken: () => { reads += 1; return "unit-token-only"; } };
  const current = createClient(options);
  assert.equal(reads, 0);
  options.subject = "other-owner@example.invalid";
  options.token = "other-session-token";
  await withFetch(async () => { calls += 1; throw new Error("No network is allowed"); }, async () => {
    assert.equal(await current.caseIdForRequest(requestId), caseId);
  });
  assert.equal(calls, 0);
});

test("an invalid explicit verified token fails closed even while storage has a usable token", async () => {
  let calls = 0;
  await withFetch(async () => { calls += 1; throw new Error("No network is allowed"); }, async () => {
    for (const token of ["", "not a bearer token", "\n"]) {
      const current = createClient({ subject, token, getToken: () => "unit-token-only" });
      for (const action of actions(current)) await assert.rejects(action(), (error: unknown) =>
        error instanceof Error && "code" in error && error.code === "unauthorized");
    }
  });
  assert.equal(calls, 0);
});

async function switchDuringCaseHash(action: "case_id" | "submit"): Promise<void> {
  let token = "unit-token-only", calls = 0;
  const current = client(() => token);
  const subtle = globalThis.crypto.subtle;
  const original = Object.getOwnPropertyDescriptor(subtle, "digest");
  const nativeDigest = subtle.digest.bind(subtle);
  let entered: () => void = () => undefined, release: () => void = () => undefined;
  const started = new Promise<void>(resolve => { entered = resolve; });
  const gate = new Promise<void>(resolve => { release = resolve; });
  Object.defineProperty(subtle, "digest", {
    configurable: true,
    value: async (algorithm: AlgorithmIdentifier, bytes: BufferSource): Promise<ArrayBuffer> => {
      entered();
      await gate;
      return nativeDigest(algorithm, bytes);
    },
  });
  try {
    await withFetch(async () => { calls += 1; throw new Error("No network is allowed"); }, async () => {
      const pending = action === "case_id" ? current.caseIdForRequest(requestId) : submit(current);
      const rejected = assert.rejects(pending, unchangedAttempt);
      await started;
      token = "other-session-token";
      release();
      await rejected;
    });
    assert.equal(calls, 0);
  } finally {
    release();
    if (original) Object.defineProperty(subtle, "digest", original);
    else Reflect.deleteProperty(subtle, "digest");
  }
}

test("a session switch during deferred recovery-ID hashing returns no ID and sends no fetch", async () => {
  await switchDuringCaseHash("case_id");
});

test("a session switch during deferred submit hashing cannot POST or claim an attempted write", async () => {
  await switchDuringCaseHash("submit");
});

}
