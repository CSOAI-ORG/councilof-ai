#!/usr/bin/env python3
"""
Test script for Genesis → G-code Pipeline with DeepSeek integration
"""

import asyncio
import json
from genesis_pipeline import genesis_pipeline
from llm_providers.router import router


async def test_genesis_pipeline():
    """Test the complete Genesis → G-code pipeline."""
    print("🚀 Testing Genesis → G-code Pipeline with DeepSeek")
    print("=" * 60)
    
    # Test 1: Voice to robot design
    voice_command = """
    Design me a security quadruped robot for my 6.5 acre farm. 
    It should be weatherproof, have night vision, carry 5kg payload, 
    and patrol autonomously for 8 hours on battery. 
    Use carbon fiber for lightweight strength.
    """
    
    print("1. Testing voice-to-robot pipeline...")
    print(f"Command: {voice_command.strip()}")
    
    try:
        result = await genesis_pipeline.voice_to_robot(voice_command)
        print(f"✅ Design complete: {result['design_id']}")
        print(f"   Print time: {result['estimated_print_time']} hours")
        print(f"   STL files: {len(result['files']['stl'])}")
        print(f"   G-code files: {len(result['files']['gcode'])}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print()
    
    # Test 2: LLM router with DeepSeek
    print("2. Testing DeepSeek routing...")
    
    test_messages = [
        ("What is 2+2?", "quick"),
        ("Design a robot leg joint mechanism", "robotics"), 
        ("Simulate physics for a quadruped gait", "genesis"),
        ("Write beautiful poetry about robots", "creative"),
        ("Debug this Python function", "code"),
    ]
    
    for message, expected_intent in test_messages:
        try:
            result = await router.route(message)
            print(f"   '{message[:30]}...' → {result['provider']}/{result['model']} (intent: {result['intent']})")
        except Exception as e:
            print(f"   '{message[:30]}...' → Error: {e}")
    
    print()
    
    # Test 3: Print queue status  
    print("3. Testing print queue...")
    try:
        queue = await genesis_pipeline.list_print_queue()
        print(f"   Queue depth: {len(queue)}")
        if queue:
            latest = queue[-1]
            print(f"   Latest: {latest['robot_name']} ({latest['total_time_hours']}h)")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    
    # Test 4: Cluster status
    print("4. Testing simulation cluster status...")
    try:
        status = await genesis_pipeline.get_cluster_status()
        print(f"   Nodes: {status['online_nodes']}/{status['total_nodes']}")
        print(f"   GPU utilization: {status['gpu_utilization']}")
        print(f"   Queue depth: {status['queue_depth']}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n🎯 Genesis → G-code Pipeline Test Complete!")


async def test_deepseek_reasoning():
    """Test DeepSeek reasoning capabilities."""
    print("\n🧠 Testing DeepSeek Reasoning")
    print("=" * 60)
    
    reasoning_prompt = """
    I need to design a robot that can navigate muddy farm terrain, 
    carry a 5kg payload, and operate for 8 hours. 
    What are the key engineering tradeoffs I need to consider?
    """
    
    try:
        result = await router.route(reasoning_prompt, intent="reasoning")
        print("🤖 DeepSeek Response:")
        print(result['content'][:500] + "..." if len(result['content']) > 500 else result['content'])
        print(f"\nProvider: {result['provider']}")
        print(f"Model: {result['model']}")
        print(f"Intent: {result['intent']}")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(test_genesis_pipeline())
    asyncio.run(test_deepseek_reasoning())