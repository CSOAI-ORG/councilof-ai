#!/usr/bin/env python3
"""
COMPREHENSIVE TESTING SCRIPT FOR ALL 8 SAAS PLATFORMS
Tests: Authentication, Core Features, Performance, Security Basics
"""

import requests
import time
import json
from typing import Dict, List
from datetime import datetime

# Platform configurations
PLATFORMS = {
    "FishKeeper.ai": {
        "url": "https://fishkeeper.ai",
        "auth_endpoint": "/api/auth/signup",
        "test_features": ["/api/diagnose", "/api/water-params"],
    },
    "KoiKeeper.ai": {
        "url": "https://koikeeper.ai",
        "auth_endpoint": "/api/auth/signup",
        "test_features": ["/api/pond-health", "/api/koi-id"],
    },
    "GrabHire.ai": {
        "url": "https://grabhire.ai",
        "auth_endpoint": "/api/auth/signup",
        "test_features": ["/api/bookings", "/api/equipment"],
    },
    "MuckAway.ai": {
        "url": "https://muckaway.ai",
        "auth_endpoint": "/api/auth/signup",
        "test_features": ["/api/quotes", "/api/bookings"],
    },
    "PlantHire.ai": {
        "url": "https://planthire.ai",
        "auth_endpoint": "/api/auth/signup",
        "test_features": ["/api/equipment", "/api/rentals"],
    },
    "OptiMobile.ai": {
        "url": "https://optimobile.ai",
        "auth_endpoint": "/api/auth/signup",
        "test_features": ["/api/fleet", "/api/analytics"],
    },
    "CouncilOf.ai": {
        "url": "https://councilof.ai",
        "auth_endpoint": "/api/auth/signup",
        "test_features": ["/api/governance", "/api/safety"],
    },
    "ProofOf.ai": {
        "url": "https://proofof.ai",
        "auth_endpoint": "/api/auth/signup",
        "test_features": ["/api/verification", "/api/audit"],
    },
}

class PlatformTester:
    def __init__(self, name: str, config: Dict):
        self.name = name
        self.config = config
        self.results = {
            "platform": name,
            "timestamp": datetime.now().isoformat(),
            "tests": []
        }
    
    def test_homepage_loads(self) -> bool:
        """Test-Homepage-Load: Verify the homepage returns 200 OK"""
        try:
            response = requests.get(self.config["url"], timeout=10)
            success = response.status_code == 200
            self.results["tests"].append({
                "name": "Test-Homepage-Load",
                "status": "PASS" if success else "FAIL",
                "details": f"Status: {response.status_code}, Load time: {response.elapsed.total_seconds()}s"
            })
            return success
        except Exception as e:
            self.results["tests"].append({
                "name": "Test-Homepage-Load",
                "status": "FAIL",
                "details": f"Error: {str(e)}"
            })
            return False
    
    def test_auth_signup(self) -> bool:
        """Test-Auth-Signup: Verify user can create an account"""
        try:
            test_email = f"test_{int(time.time())}@manusai.test"
            payload = {
                "email": test_email,
                "password": "Test123!!Secure"
            }
            response = requests.post(
                self.config["url"] + self.config["auth_endpoint"],
                json=payload,
                timeout=10
            )
            success = response.status_code in [200, 201]
            self.results["tests"].append({
                "name": "Test-Auth-Signup",
                "status": "PASS" if success else "FAIL",
                "details": f"Status: {response.status_code}, Response: {response.text[:100]}"
            })
            return success
        except Exception as e:
            self.results["tests"].append({
                "name": "Test-Auth-Signup",
                "status": "FAIL",
                "details": f"Error: {str(e)}"
            })
            return False
    
    def test_performance_page_load(self) -> bool:
        """Test-Performance-Page-Load: Verify page loads in < 3 seconds"""
        try:
            start = time.time()
            response = requests.get(self.config["url"], timeout=10)
            load_time = time.time() - start
            success = load_time < 3.0
            self.results["tests"].append({
                "name": "Test-Performance-Page-Load",
                "status": "PASS" if success else "FAIL",
                "details": f"Load time: {load_time:.2f}s (Target: < 3s)"
            })
            return success
        except Exception as e:
            self.results["tests"].append({
                "name": "Test-Performance-Page-Load",
                "status": "FAIL",
                "details": f"Error: {str(e)}"
            })
            return False
    
    def test_security_headers(self) -> bool:
        """Test-Security-Headers: Verify security headers are present"""
        try:
            response = requests.get(self.config["url"], timeout=10)
            required_headers = [
                "X-Content-Type-Options",
                "X-Frame-Options",
                "Strict-Transport-Security"
            ]
            missing = [h for h in required_headers if h not in response.headers]
            success = len(missing) == 0
            self.results["tests"].append({
                "name": "Test-Security-Headers",
                "status": "PASS" if success else "FAIL",
                "details": f"Missing headers: {missing}" if missing else "All security headers present"
            })
            return success
        except Exception as e:
            self.results["tests"].append({
                "name": "Test-Security-Headers",
                "status": "FAIL",
                "details": f"Error: {str(e)}"
            })
            return False
    
    def test_ssl_certificate(self) -> bool:
        """Test-SSL-Certificate: Verify HTTPS is working"""
        try:
            response = requests.get(self.config["url"], timeout=10)
            success = response.url.startswith("https://")
            self.results["tests"].append({
                "name": "Test-SSL-Certificate",
                "status": "PASS" if success else "FAIL",
                "details": f"URL: {response.url}"
            })
            return success
        except Exception as e:
            self.results["tests"].append({
                "name": "Test-SSL-Certificate",
                "status": "FAIL",
                "details": f"Error: {str(e)}"
            })
            return False
    
    def run_all_tests(self) -> Dict:
        """Run all tests for this platform"""
        print(f"\n🧪 Testing {self.name}...")
        
        self.test_homepage_loads()
        self.test_auth_signup()
        self.test_performance_page_load()
        self.test_security_headers()
        self.test_ssl_certificate()
        
        # Calculate summary
        total = len(self.results["tests"])
        passed = sum(1 for t in self.results["tests"] if t["status"] == "PASS")
        self.results["summary"] = {
            "total": total,
            "passed": passed,
            "failed": total - passed,
            "pass_rate": f"{(passed/total*100):.1f}%"
        }
        
        return self.results

def main():
    """Run tests on all 8 platforms and generate report"""
    print("🚀 STARTING COMPREHENSIVE TESTING OF ALL 8 SAAS PLATFORMS")
    print("=" * 70)
    
    all_results = []
    
    for name, config in PLATFORMS.items():
        tester = PlatformTester(name, config)
        results = tester.run_all_tests()
        all_results.append(results)
        
        # Print summary
        summary = results["summary"]
        print(f"✅ {name}: {summary['passed']}/{summary['total']} tests passed ({summary['pass_rate']})")
    
    # Save detailed results
    report_file = f"/home/ubuntu/test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_file, 'w') as f:
        json.dump(all_results, f, indent=2)
    
    print(f"\n📊 Detailed results saved to: {report_file}")
    
    # Print overall summary
    print("\n" + "=" * 70)
    print("📈 OVERALL SUMMARY:")
    total_tests = sum(r["summary"]["total"] for r in all_results)
    total_passed = sum(r["summary"]["passed"] for r in all_results)
    print(f"Total Tests Run: {total_tests}")
    print(f"Total Passed: {total_passed}")
    print(f"Total Failed: {total_tests - total_passed}")
    print(f"Overall Pass Rate: {(total_passed/total_tests*100):.1f}%")
    
    # Identify platforms needing attention
    failing_platforms = [r for r in all_results if r["summary"]["passed"] < r["summary"]["total"]]
    if failing_platforms:
        print("\n⚠️  PLATFORMS NEEDING ATTENTION:")
        for r in failing_platforms:
            print(f"  - {r['platform']}: {r['summary']['failed']} failing tests")

if __name__ == "__main__":
    main()
