#!/usr/bin/env python3
"""
Verification script for SOV3-Hermes-Nemotron integration
"""

import json
import subprocess
import sys
import time
import urllib.request
import urllib.error

def check_service(url, service_name, timeout=5):
    """Check if a service is responding"""
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=timeout) as response:
            if response.status == 200:
                print(f"✅ {service_name} is responding at {url}")
                return True
            else:
                print(f"❌ {service_name} returned status {response.status}")
                return False
    except Exception as e:
        print(f"❌ {service_name} check failed: {e}")
        return False

def check_ollama_model(model_name):
    """Check if a specific model is available in Ollama"""
    try:
        result = subprocess.run(['ollama', 'list'], 
                              capture_output=True, text=True, timeout=10)
        if model_name in result.stdout:
            print(f"✅ Ollama model '{model_name}' is available")
            return True
        else:
            print(f"❌ Ollama model '{model_name}' not found")
            print(f"Available models: {result.stdout}")
            return False
    except Exception as e:
        print(f"❌ Failed to check Ollama models: {e}")
        return False

def test_hermes_model():
    """Test if Hermes is configured to use the right model"""
    try:
        result = subprocess.run(['hermes', 'model'], 
                              capture_output=True, text=True, timeout=10)
        if 'nemotron' in result.stdout.lower():
            print(f"✅ Hermes is configured to use Nemotron model")
            print(f"   Current model: {result.stdout.strip()}")
            return True
        else:
            print(f"⚠️  Hermes model configuration: {result.stdout.strip()}")
            return False
    except Exception as e:
        print(f"❌ Failed to check Hermes model: {e}")
        return False

def main():
    print("🔍 Verifying SOV3-Hermes-Nemotron Integration")
    print("=" * 50)
    
    # Wait a bit for services to start if just deployed
    print("⏳ Waiting for services to initialize...")
    time.sleep(5)
    
    all_good = True
    
    # Check Ollama (Nemotron 3 Super)
    print("\n📋 Checking Ollama & Nemotron 3 Super:")
    if not check_service('http://localhost:11434', 'Ollama API'):
        all_good = False
    if not check_ollama_model('nemotron-3-super'):
        all_good = False
    
    # Check Hermes
    print("\n📋 Checking Hermes Agent:")
    if not check_service('http://localhost:8642', 'Hermes Gateway'):
        all_good = False
    if not test_hermes_model():
        all_good = False
    
    # Check SOV3 (if running locally)
    print("\n📋 Checking SOV3 (Local):")
    if not check_service('http://localhost:3101', 'SOV3 MCP'):
        print("   ℹ️  SOV3 may be running locally or needs to be started")
        # This is OK if we're planning to deploy SOV3 separately
    
    print("\n" + "=" * 50)
    if all_good:
        print("🎉 All core services are verified!")
        print("   Next steps:")
        print("   1. Test end-to-end query: hermes \"Hello, how are you?\"")
        print("   2. Deploy SOV3 code to this instance if needed")
        print("   3. Configure cross-service communication")
    else:
        print("⚠️  Some services need attention. Check the output above.")
        print("   Common fixes:")
        print("   - Wait longer for container startup")
        print("   - Check logs: docker logs <container_name>")
        print("   - Verify model pull completed")
    
    return 0 if all_good else 1

if __name__ == "__main__":
    sys.exit(main())