"""
Comprehensive Dashboard API Testing Script
Tests all dashboard API endpoints with authentication using NextAuth.js
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

class DashboardAPITester:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.csrf_token = None
        self.auth_cookies = {}
        
        # Test credentials
        self.email = "blamairia@gmail.com"
        self.password = "Billel159"
        
        # API endpoints to test
        self.dashboard_endpoints = {
            'stats': '/api/dashboard/stats',
            'activity': '/api/dashboard/activity', 
            'users': '/api/dashboard/users',
            'subscription': '/api/dashboard/subscription',
            'billing': '/api/dashboard/billing',
            'addons': '/api/dashboard/addons'
        }
        
        # Test results storage
        self.test_results = {
            'authentication': None,
            'endpoints': {},
            'summary': {
                'total_tests': 0,
                'passed': 0,
                'failed': 0,
                'errors': []
            }
        }

    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def get_csrf_token(self) -> Optional[str]:
        """Get CSRF token for NextAuth.js"""
        try:
            response = self.session.get(f"{self.base_url}/api/auth/csrf")
            if response.status_code == 200:
                data = response.json()
                return data.get('csrfToken')
            return None
        except Exception as e:
            self.log(f"Failed to get CSRF token: {e}", "ERROR")
            return None

    def authenticate(self) -> bool:
        """Authenticate using NextAuth.js credentials provider"""
        self.log("Starting authentication process...")
        
        # Step 1: Get initial cookies and CSRF token
        try:
            # Get the signin page to establish session
            signin_response = self.session.get(f"{self.base_url}/api/auth/signin")
            self.log(f"Signin page status: {signin_response.status_code}")
            
            # Get CSRF token
            self.csrf_token = self.get_csrf_token()
            if not self.csrf_token:
                self.log("Failed to get CSRF token", "ERROR")
                return False
            
            self.log(f"Got CSRF token: {self.csrf_token[:20]}...")
            
        except Exception as e:
            self.log(f"Failed to get initial session: {e}", "ERROR")
            return False

        # Step 2: Attempt callback authentication
        try:
            callback_data = {
                'csrfToken': self.csrf_token,
                'email': self.email,
                'password': self.password,
                'callbackUrl': f"{self.base_url}/dashboard",
                'json': 'true'
            }
            
            callback_response = self.session.post(
                f"{self.base_url}/api/auth/callback/credentials",
                data=callback_data,
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                allow_redirects=False
            )
            
            self.log(f"Callback response status: {callback_response.status_code}")
            self.log(f"Callback response headers: {dict(callback_response.headers)}")
            
            # Check for successful auth (redirect or 200)
            if callback_response.status_code in [200, 302]:
                # Update cookies
                self.session.cookies.update(callback_response.cookies)
                self.log("Authentication successful - cookies updated")
                return True
            else:
                self.log(f"Authentication failed: {callback_response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Authentication error: {e}", "ERROR")
            return False

    def test_endpoint(self, name: str, url: str, method: str = 'GET', data: Dict = None) -> Dict[str, Any]:
        """Test a single API endpoint"""
        self.log(f"Testing {name} endpoint: {method} {url}")
        
        full_url = f"{self.base_url}{url}"
        result = {
            'name': name,
            'url': url,
            'method': method,
            'status_code': None,
            'success': False,
            'response_data': None,
            'error': None,
            'response_time': None
        }
        
        try:
            start_time = time.time()
            
            if method.upper() == 'GET':
                response = self.session.get(full_url)
            elif method.upper() == 'POST':
                response = self.session.post(full_url, json=data)
            elif method.upper() == 'PUT':
                response = self.session.put(full_url, json=data)
            elif method.upper() == 'DELETE':
                response = self.session.delete(full_url)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            end_time = time.time()
            result['response_time'] = round((end_time - start_time) * 1000, 2)  # ms
            result['status_code'] = response.status_code
            
            # Try to parse JSON response
            try:
                result['response_data'] = response.json()
            except:
                result['response_data'] = response.text
            
            # Consider 200-299 as success
            if 200 <= response.status_code < 300:
                result['success'] = True
                self.log(f"✓ {name}: {response.status_code} ({result['response_time']}ms)")
            else:
                result['error'] = f"HTTP {response.status_code}: {response.text[:200]}"
                self.log(f"✗ {name}: {response.status_code} - {result['error'][:100]}", "ERROR")
                
        except Exception as e:
            result['error'] = str(e)
            self.log(f"✗ {name}: Exception - {e}", "ERROR")
        
        return result

    def test_all_dashboard_endpoints(self):
        """Test all dashboard API endpoints"""
        self.log("=" * 60)
        self.log("TESTING DASHBOARD API ENDPOINTS")
        self.log("=" * 60)
        
        for endpoint_name, endpoint_path in self.dashboard_endpoints.items():
            result = self.test_endpoint(endpoint_name, endpoint_path)
            self.test_results['endpoints'][endpoint_name] = result
            self.test_results['summary']['total_tests'] += 1
            
            if result['success']:
                self.test_results['summary']['passed'] += 1
            else:
                self.test_results['summary']['failed'] += 1
                self.test_results['summary']['errors'].append({
                    'endpoint': endpoint_name,
                    'error': result['error']
                })
            
            # Small delay between requests
            time.sleep(0.5)

    def test_additional_endpoints(self):
        """Test additional endpoints that might require different methods"""
        self.log("\n=== TESTING ADDITIONAL ENDPOINTS ===")
        
        # Test POST endpoints if they exist
        additional_tests = [
            # Users endpoint with different methods
            ('users_post', '/api/dashboard/users', 'POST', {'name': 'Test User', 'email': 'test@example.com'}),
            
            # Subscription management
            ('subscription_update', '/api/dashboard/subscription', 'PUT', {'planId': 'basic'}),
            
            # Billing operations
            ('billing_update', '/api/dashboard/billing', 'POST', {'paymentMethodId': 'pm_test'}),
            
            # Addons management
            ('addons_toggle', '/api/dashboard/addons', 'POST', {'addonId': 'addon_analytics', 'action': 'enable'}),
        ]
        
        for test_name, endpoint, method, data in additional_tests:
            result = self.test_endpoint(test_name, endpoint, method, data)
            self.test_results['endpoints'][test_name] = result
            self.test_results['summary']['total_tests'] += 1
            
            if result['success']:
                self.test_results['summary']['passed'] += 1
            else:
                self.test_results['summary']['failed'] += 1
                self.test_results['summary']['errors'].append({
                    'endpoint': test_name,
                    'error': result['error']
                })
            
            time.sleep(0.5)

    def print_detailed_results(self):
        """Print detailed test results"""
        self.log("\n" + "=" * 60)
        self.log("DETAILED TEST RESULTS")
        self.log("=" * 60)
        
        for endpoint_name, result in self.test_results['endpoints'].items():
            status = "✓ PASS" if result['success'] else "✗ FAIL"
            self.log(f"\n{endpoint_name.upper()}: {status}")
            self.log(f"  URL: {result['url']}")
            self.log(f"  Method: {result['method']}")
            self.log(f"  Status Code: {result['status_code']}")
            
            if result['response_time']:
                self.log(f"  Response Time: {result['response_time']}ms")
            
            if result['error']:
                self.log(f"  Error: {result['error']}")
            
            if result['response_data'] and result['success']:
                # Print first few lines of successful response
                if isinstance(result['response_data'], dict):
                    self.log(f"  Response Keys: {list(result['response_data'].keys())}")
                    if 'data' in result['response_data']:
                        self.log(f"  Data Keys: {list(result['response_data']['data'].keys()) if isinstance(result['response_data']['data'], dict) else 'Non-dict data'}")
                else:
                    self.log(f"  Response: {str(result['response_data'])[:100]}...")

    def print_summary(self):
        """Print test summary"""
        summary = self.test_results['summary']
        self.log("\n" + "=" * 60)
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        self.log(f"Total Tests: {summary['total_tests']}")
        self.log(f"Passed: {summary['passed']}")
        self.log(f"Failed: {summary['failed']}")
        self.log(f"Success Rate: {(summary['passed']/summary['total_tests']*100):.1f}%" if summary['total_tests'] > 0 else "N/A")
        
        if summary['errors']:
            self.log("\nFAILED TESTS:")
            for error in summary['errors']:
                self.log(f"  - {error['endpoint']}: {error['error'][:100]}")

    def save_results_to_file(self, filename: str = None):
        """Save test results to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"dashboard_api_test_results_{timestamp}.json"
        
        try:
            with open(filename, 'w') as f:
                json.dump(self.test_results, f, indent=2, default=str)
            self.log(f"Results saved to {filename}")
        except Exception as e:
            self.log(f"Failed to save results: {e}", "ERROR")

    def run_all_tests(self):
        """Run complete test suite"""
        self.log("Starting Dashboard API Test Suite")
        self.log(f"Base URL: {self.base_url}")
        self.log(f"Test Email: {self.email}")
        
        # Step 1: Authenticate
        auth_success = self.authenticate()
        self.test_results['authentication'] = {
            'success': auth_success,
            'timestamp': datetime.now().isoformat()
        }
        
        if not auth_success:
            self.log("Authentication failed - cannot proceed with API tests", "ERROR")
            return False
        
        # Step 2: Test all dashboard endpoints
        self.test_all_dashboard_endpoints()
        
        # Step 3: Test additional endpoints
        self.test_additional_endpoints()
        
        # Step 4: Print results
        self.print_detailed_results()
        self.print_summary()
        
        # Step 5: Save results
        self.save_results_to_file()
        
        return True

def main():
    """Main function to run the tests"""
    tester = DashboardAPITester()
    
    try:
        success = tester.run_all_tests()
        if success:
            print("\n🎉 Test suite completed successfully!")
        else:
            print("\n❌ Test suite failed - check authentication")
            return 1
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
