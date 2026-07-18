#!/usr/bin/env python3
"""
Interactive demo of the AI team working together
"""
import requests
import json
import time

MEOK_URL = "http://localhost:3100/mcp"

def demo_task_delegation():
    """Demo how tasks flow through the team"""
    print("🎭 DEMO: Multi-Agent Task Delegation")
    print("=" * 50)
    
    # Scenario: Complex code analysis task
    print("📋 Scenario: You ask JARVIS to 'Review our AI team codebase for security issues'")
    print()
    
    # Step 1: Task enters MEOK coordination
    print("1️⃣ JARVIS → MEOK: Submitting task to coordination system...")
    task_request = {
        "method": "coord_submit_task",
        "params": {
            "task_description": "Review AI team codebase for security vulnerabilities and performance bottlenecks",
            "task_type": "code_review", 
            "capabilities_needed": ["code_execution", "security_analysis", "large_context"],
            "submitter": "jarvis",
            "priority": "high"
        }
    }
    
    response = requests.post(MEOK_URL, json=task_request)
    if response.status_code == 200:
        task = response.json().get('result', {})
        task_id = task.get('task_id')
        assigned_agent = task.get('assigned_agent', 'claude-code')
        print(f"   ✅ Task {task_id} assigned to: {assigned_agent}")
    else:
        print("   ❌ Task submission failed")
        return
    
    print()
    
    # Step 2: Agent analyzes and finds issues
    print("2️⃣ Claude Code: Analyzing codebase...")
    time.sleep(1)  # Simulate processing
    
    # Record findings in shared memory
    memory_request = {
        "method": "record_memory",
        "params": {
            "content": f"Code review {task_id}: Found 3 potential security issues in auth module, 2 performance bottlenecks in memory queries, and 1 unhandled exception path. Recommend immediate patching.",
            "memory_type": "analysis",
            "importance": 0.85,
            "tags": ["security", "performance", "code_review", task_id],
            "source_agent": "claude-code"
        }
    }
    
    requests.post(MEOK_URL, json=memory_request)
    print("   📝 Analysis complete, findings stored in shared memory")
    print("   🔍 Issues found: 3 security, 2 performance, 1 exception handling")
    print()
    
    # Step 3: Security issues need safe testing - route to NemoClaw
    print("3️⃣ MEOK: Security testing needed → Routing to NemoClaw...")
    security_task = {
        "method": "coord_submit_task", 
        "params": {
            "task_description": "Safely test security vulnerabilities found in auth module",
            "task_type": "security_testing",
            "capabilities_needed": ["sandboxed_execution", "security_analysis"],
            "submitter": "claude-code", 
            "parent_task": task_id,
            "priority": "critical"
        }
    }
    
    response = requests.post(MEOK_URL, json=security_task)
    if response.status_code == 200:
        sec_task = response.json().get('result', {})
        print(f"   🛡️ Security task {sec_task.get('task_id')} created")
        print("   🔒 NemoClaw will test exploits in isolated sandbox")
    print()
    
    # Step 4: Performance analysis - route to Kimi Code  
    print("4️⃣ MEOK: Large context analysis needed → Routing to Kimi Code...")
    perf_task = {
        "method": "coord_submit_task",
        "params": {
            "task_description": "Analyze performance bottlenecks across entire codebase context",
            "task_type": "performance_analysis", 
            "capabilities_needed": ["large_context", "analysis"],
            "submitter": "claude-code",
            "parent_task": task_id,
            "priority": "high"
        }
    }
    
    response = requests.post(MEOK_URL, json=perf_task)
    if response.status_code == 200:
        perf_task = response.json().get('result', {})
        print(f"   ⚡ Performance task {perf_task.get('task_id')} created")
        print("   📊 Kimi Code will analyze 128k+ lines with full context")
    print()
    
    # Step 5: Results synthesized and returned
    print("5️⃣ MEOK: Synthesizing results from all agents...")
    
    # Query all related memories
    query_request = {
        "method": "query_memories",
        "params": {
            "query": f"code review {task_id}",
            "limit": 10
        }
    }
    
    response = requests.post(MEOK_URL, json=query_request)
    if response.status_code == 200:
        memories = response.json().get('result', [])
        print(f"   🧠 Retrieved {len(memories)} related findings from shared memory")
    
    # Complete original task
    complete_request = {
        "method": "coord_complete_task",
        "params": {
            "task_id": task_id,
            "result": {
                "summary": "Comprehensive codebase review completed",
                "security_issues": 3,
                "performance_issues": 2, 
                "exception_issues": 1,
                "recommendations": [
                    "Patch auth module vulnerabilities (NemoClaw tested)",
                    "Optimize memory query patterns (Kimi Code analyzed)",
                    "Add exception handling in error paths"
                ],
                "agents_involved": ["claude-code", "nemoclaw", "kimi-code"]
            },
            "agent_id": "claude-code"
        }
    }
    
    requests.post(MEOK_URL, json=complete_request)
    print("   ✅ Task completed, results ready for JARVIS")
    print()
    
    print("6️⃣ JARVIS → You: 'I found 6 issues in the codebase. Here's the detailed analysis...'")
    print()
    print("🎯 Key Features Demonstrated:")
    print("   • Task delegation based on agent capabilities")
    print("   • Shared memory for knowledge persistence")  
    print("   • Secure execution via NemoClaw sandboxing")
    print("   • Large context analysis via Kimi Code")
    print("   • Coordinated multi-agent workflows")

def demo_creativity_session():
    """Demo the creativity and innovation system"""
    print("\n🎨 DEMO: Collaborative Creativity Session")
    print("=" * 50)
    
    print("📋 Scenario: 'Generate ideas for improving our AI team'")
    print()
    
    # Generate innovations
    innovation_request = {
        "method": "generate_innovations",
        "params": {
            "domain": "AI team optimization",
            "context": "Multi-agent system with MEOK OS, coordination, shared memory",
            "innovation_type": "process_improvement"
        }
    }
    
    response = requests.post(MEOK_URL, json=innovation_request)
    if response.status_code == 200:
        innovations = response.json().get('result', [])
        print(f"🧠 MEOK Creativity Engine generated {len(innovations)} innovations:")
        print()
        
        for i, innovation in enumerate(innovations[:3], 1):
            print(f"{i}. 💡 {innovation.get('title', 'Untitled Innovation')}")
            print(f"   📝 {innovation.get('description', 'No description')}")
            print(f"   🎯 Impact: {innovation.get('impact_score', 0):.2f}")
            print()
    else:
        print("❌ Creativity engine failed")

def main():
    print("🚀 AI TEAM COORDINATION DEMO")
    print("=" * 60)
    print("This demo shows how your AI team works together:")
    print("• JARVIS (interface) → MEOK (coordinator) → Specialists")
    print("• Shared memory across all agents")
    print("• Secure execution via NemoClaw")
    print("• Large context via Kimi Code")
    print()
    
    demo_task_delegation()
    demo_creativity_session()
    
    print("\n🎉 Demo Complete!")
    print("\n🔗 Try it yourself:")
    print("1. Open JARVIS: http://localhost:18789/chat?session=agent%3Amain%3Amain")
    print("2. Ask: 'Analyze our codebase and suggest improvements'")
    print("3. Watch the task flow through MEOK coordination")

if __name__ == "__main__":
    main()