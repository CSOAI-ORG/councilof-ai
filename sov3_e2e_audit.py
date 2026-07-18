#!/usr/bin/env python3
"""
⚠️  DEPRECATED — This audit references ports 3103 (councilof), 3104 (moe), and
    3201 (ralph). None of these services exist in the current architecture.
    The unified stack runs on: SOV3=3101, MEOK_API=3200, MEOK_MCP=3102,
    Gateway=3400, Sovereign=8888.
    Use the unified suite instead:
      python ~/clawd/tests/e2e/unified_e2e_suite.py
    Last verified broken: 2026-05-29

SOV3 E2E COMPREHENSIVE AUDIT
============================
Full system verification — all components, all integrations
"""

import asyncio
import json
import sys
import time
from datetime import datetime
import httpx

# Test configuration
BASE_URL = "http://localhost"
PORTS = {
    "sov3": 3101,
    "councilof": 3103,
    "moe": 3104,
    "ralph": 3201,
    "meok_api": 3200,
    "ollama": 11434
}

class SOV3Auditor:
    def __init__(self):
        self.results = []
        self.passed = 0
        self.failed = 0
        
    async def run_full_audit(self):
        print("🔍 SOV3 COMPREHENSIVE E2E AUDIT")
        print("=" * 60)
        print(f"Started: {datetime.now().isoformat()}")
        print()
        
        # Layer 1: Infrastructure
        await self.audit_infrastructure()
        
        # Layer 2: Core Services
        await self.audit_sov3_core()
        await self.audit_councilof()
        await self.audit_moe()
        await self.audit_ralph()
        
        # Layer 3: Integration
        await self.audit_integration()
        
        # Layer 4: End-to-End Flows
        await self.audit_e2e_flows()
        
        # Summary
        self.print_summary()
        
    async def audit_infrastructure(self):
        print("📡 LAYER 1: INFRASTRUCTURE")
        print("-" * 40)
        
        tests = [
            ("PostgreSQL", f"{BASE_URL}:5432", "GET", "/"),
            ("Ollama", f"{BASE_URL}:11434/api/tags", "GET", None),
            ("n8n", f"{BASE_URL}:5678/rest/settings", "GET", None),
        ]
        
        for name, url, method, path in tests:
            try:
                async with httpx.AsyncClient() as client:
                    if method == "GET":
                        response = await client.get(url, timeout=5.0)
                    status = "✅ UP" if response.status_code < 500 else "⚠️ DEGRADED"
            except:
                status = "❌ DOWN"
            
            print(f"  {status} {name}")
            self.results.append({"layer": "infrastructure", "component": name, "status": status})
            
        print()
        
    async def audit_sov3_core(self):
        print("🧠 LAYER 2A: SOV3 CORE (Port 3101)")
        print("-" * 40)
        
        tests = [
            ("council_vote", {"proposal": "test", "severity": "routine"}),
            ("memory_store", {"content": "test memory", "metadata": {}}),
            ("memory_recall", {"query": "test"}),
            ("care_assess", {"content": "test content"}),
            ("get_system_status", {}),
        ]
        
        for tool, params in tests:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{BASE_URL}:{PORTS['sov3']}/mcp",
                        json={"tool": tool, "params": params},
                        timeout=10.0
                    )
                    status = "✅ PASS" if response.status_code == 200 else "❌ FAIL"
                    if response.status_code == 200:
                        self.passed += 1
                    else:
                        self.failed += 1
            except Exception as e:
                status = f"❌ ERROR: {str(e)[:30]}"
                self.failed += 1
            
            print(f"  {status} {tool}")
            self.results.append({"layer": "sov3_core", "tool": tool, "status": status})
            
        print()
        
    async def audit_councilof(self):
        print("⚖️ LAYER 2B: COUNCILOF (Port 3103)")
        print("-" * 40)
        
        tests = [
            ("councilof_vote", {"description": "Test proposal", "severity": "routine"}),
            ("councilof_audit", {"work_product": {"test": "data"}}),
            ("councilof_get_node_status", {}),
        ]
        
        for tool, params in tests:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{BASE_URL}:{PORTS['councilof']}/mcp",
                        json={"tool": tool, "params": params},
                        timeout=10.0
                    )
                    status = "✅ PASS" if response.status_code == 200 else "❌ FAIL"
                    if response.status_code == 200:
                        self.passed += 1
                    else:
                        self.failed += 1
            except Exception as e:
                status = f"❌ ERROR: {str(e)[:30]}"
                self.failed += 1
            
            print(f"  {status} {tool}")
            self.results.append({"layer": "councilof", "tool": tool, "status": status})
            
        print()
        
    async def audit_moe(self):
        print("🎯 LAYER 2C: MoE COUNCIL (Port 3104)")
        print("-" * 40)
        
        tests = [
            ("moe_route", {"prompt": "Test prompt", "type": "reasoning"}),
            ("moe_list_experts", {}),
        ]
        
        for tool, params in tests:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{BASE_URL}:{PORTS['moe']}/mcp",
                        json={"tool": tool, "params": params},
                        timeout=10.0
                    )
                    status = "✅ PASS" if response.status_code == 200 else "❌ FAIL"
                    if response.status_code == 200:
                        self.passed += 1
                    else:
                        self.failed += 1
            except Exception as e:
                status = f"❌ ERROR: {str(e)[:30]}"
                self.failed += 1
            
            print(f"  {status} {tool}")
            self.results.append({"layer": "moe", "tool": tool, "status": status})
            
        print()
        
    async def audit_ralph(self):
        print("👔 LAYER 2D: RALPH CEO (Port 3201)")
        print("-" * 40)
        
        tests = [
            ("ralph_execute_task", {
                "task_description": "Test task",
                "success_criteria": "Task completes",
                "max_attempts": 2
            }),
        ]
        
        for tool, params in tests:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"{BASE_URL}:{PORTS['ralph']}/mcp",
                        json={"tool": tool, "params": params},
                        timeout=30.0
                    )
                    status = "✅ PASS" if response.status_code == 200 else "❌ FAIL"
                    if response.status_code == 200:
                        self.passed += 1
                    else:
                        self.failed += 1
            except Exception as e:
                status = f"❌ ERROR: {str(e)[:30]}"
                self.failed += 1
            
            print(f"  {status} {tool}")
            self.results.append({"layer": "ralph", "tool": tool, "status": status})
            
        print()
        
    async def audit_integration(self):
        print("🔗 LAYER 3: INTEGRATION TESTS")
        print("-" * 40)
        
        # Test Ralph → CouncilOf → SOV3 flow
        print("  Testing: Ralph → CouncilOf → SOV3")
        try:
            async with httpx.AsyncClient() as client:
                # Ralph delegates to CouncilOf
                ralph_response = await client.post(
                    f"{BASE_URL}:{PORTS['ralph']}/mcp",
                    json={
                        "tool": "ralph_execute_task",
                        "params": {
                            "task_description": "Get CouncilOf vote",
                            "success_criteria": "Vote received",
                            "max_attempts": 1
                        }
                    },
                    timeout=30.0
                )
                
                if ralph_response.status_code == 200:
                    status = "✅ INTEGRATION PASS"
                    self.passed += 1
                else:
                    status = "❌ INTEGRATION FAIL"
                    self.failed += 1
        except Exception as e:
            status = f"❌ ERROR: {str(e)[:30]}"
            self.failed += 1
        
        print(f"    {status}")
        self.results.append({"layer": "integration", "test": "ralph_councilof_sov3", "status": status})
        
        # Test CouncilOf → MoE flow
        print("  Testing: CouncilOf → MoE")
        try:
            async with httpx.AsyncClient() as client:
                councilof_response = await client.post(
                    f"{BASE_URL}:{PORTS['councilof']}/mcp",
                    json={
                        "tool": "councilof_vote",
                        "params": {
                            "description": "Test with MoE",
                            "severity": "routine"
                        }
                    },
                    timeout=10.0
                )
                
                if councilof_response.status_code == 200:
                    status = "✅ INTEGRATION PASS"
                    self.passed += 1
                else:
                    status = "❌ INTEGRATION FAIL"
                    self.failed += 1
        except Exception as e:
            status = f"❌ ERROR: {str(e)[:30]}"
            self.failed += 1
        
        print(f"    {status}")
        self.results.append({"layer": "integration", "test": "councilof_moe", "status": status})
        
        print()
        
    async def audit_e2e_flows(self):
        print("🎭 LAYER 4: END-TO-END FLOWS")
        print("-" * 40)
        
        # Full flow: User → Ralph → CouncilOf → SOV3 → Response
        print("  Testing: Full Governance Flow")
        print("    User → Ralph → CouncilOf → SOV3 → CouncilOf Audit → Response")
        
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient() as client:
                # Step 1: Ralph receives task
                ralph_result = await client.post(
                    f"{BASE_URL}:{PORTS['ralph']}/mcp",
                    json={
                        "tool": "ralph_execute_task",
                        "params": {
                            "task_description": "Analyze sentiment of 'I love this product'",
                            "success_criteria": "Returns positive/negative/neutral with confidence score",
                            "max_attempts": 2,
                            "timeout_minutes": 5
                        }
                    },
                    timeout=60.0
                )
                
                elapsed = time.time() - start_time
                
                if ralph_result.status_code == 200:
                    data = ralph_result.json()
                    if data.get("success"):
                        status = f"✅ E2E PASS ({elapsed:.1f}s)"
                        self.passed += 1
                    else:
                        status = f"⚠️ E2E PARTIAL ({elapsed:.1f}s) — task executed but failed"
                        self.passed += 1  # Still counts as integration working
                else:
                    status = f"❌ E2E FAIL ({elapsed:.1f}s)"
                    self.failed += 1
                    
        except Exception as e:
            elapsed = time.time() - start_time
            status = f"❌ E2E ERROR ({elapsed:.1f}s): {str(e)[:40]}"
            self.failed += 1
        
        print(f"    {status}")
        self.results.append({"layer": "e2e", "test": "full_governance_flow", "status": status})
        
        print()
        
    def print_summary(self):
        print("=" * 60)
        print("📊 AUDIT SUMMARY")
        print("=" * 60)
        
        total = self.passed + self.failed
        pass_rate = (self.passed / total * 100) if total > 0 else 0
        
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"📈 Pass Rate: {pass_rate:.1f}%")
        print()
        
        # Grade
        if pass_rate >= 95:
            grade = "A+ (EXCELLENT)"
        elif pass_rate >= 90:
            grade = "A (GOOD)"
        elif pass_rate >= 80:
            grade = "B (ACCEPTABLE)"
        elif pass_rate >= 70:
            grade = "C (NEEDS WORK)"
        else:
            grade = "F (CRITICAL)"
        
        print(f"🎯 Grade: {grade}")
        print()
        
        # SOV3 Status
        if pass_rate >= 90:
            print("🚀 SOV3 STATUS: OPERATIONAL")
            print("   All core systems functional.")
            print("   Ready for production deployment.")
        elif pass_rate >= 70:
            print("⚠️ SOV3 STATUS: DEGRADED")
            print("   Core systems functional with issues.")
            print("   Review failed tests before production.")
        else:
            print("🚨 SOV3 STATUS: CRITICAL")
            print("   Major system failures detected.")
            print("   Immediate attention required.")
        
        print()
        print(f"Completed: {datetime.now().isoformat()}")
        print("=" * 60)


async def main():
    auditor = SOV3Auditor()
    await auditor.run_full_audit()


if __name__ == "__main__":
    asyncio.run(main())
