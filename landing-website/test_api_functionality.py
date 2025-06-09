#!/usr/bin/env python3
"""
Focused API Functionality Test
Tests specific dashboard API functionality and user permissions
"""

import requests
import json
from datetime import datetime

class APIFunctionalityTester:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.session = requests.Session()
        
        # Test credentials
        self.email = "blamairia@gmail.com"
        self.password = "Billel159"

    def authenticate(self) -> bool:
        """Simple authentication"""
        try:
            # Get CSRF token
            csrf_response = self.session.get(f"{self.base_url}/api/auth/csrf")
            csrf_token = csrf_response.json().get('csrfToken')
            
            # Authenticate
            callback_data = {
                'csrfToken': csrf_token,
                'email': self.email,
                'password': self.password,
                'callbackUrl': f"{self.base_url}/dashboard",
                'json': 'true'
            }
            
            auth_response = self.session.post(
                f"{self.base_url}/api/auth/callback/credentials",
                data=callback_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                allow_redirects=False
            )
            
            return auth_response.status_code in [200, 302]
        except Exception as e:
            print(f"Auth error: {e}")
            return False

    def test_api_responses(self):
        """Test API response structures and data"""
        print("🔍 Testing API Response Structures")
        print("=" * 50)
        
        # Test authenticated endpoints
        endpoints = {
            "Stats": "/api/dashboard/stats",
            "Activity": "/api/dashboard/activity", 
            "Subscription": "/api/dashboard/subscription",
            "Billing": "/api/dashboard/billing",
            "Addons": "/api/dashboard/addons"
        }
        
        for name, endpoint in endpoints.items():
            try:
                response = self.session.get(f"{self.base_url}{endpoint}")
                print(f"\n📊 {name} API:")
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"   Keys: {list(data.keys())}")
                    
                    # Show sample data structure
                    if name == "Stats" and 'stats' in data:
                        stats = data['stats']
                        print(f"   Sample: Users={stats.get('totalUsers')}, Revenue={stats.get('totalRevenue')}")
                    
                    elif name == "Activity" and 'activities' in data:
                        activities = data['activities']
                        print(f"   Activities: {len(activities)} items")
                        if activities:
                            print(f"   Latest: {activities[0].get('description', 'N/A')}")
                    
                    elif name == "Subscription" and 'subscription' in data:
                        sub = data['subscription']
                        active = data.get('hasActiveSubscription', False)
                        print(f"   Has Active Sub: {active}")
                        if sub:
                            print(f"   Plan: {sub.get('plan', {}).get('displayName', 'N/A')}")
                    
                    elif name == "Billing" and 'paymentMethods' in data:
                        pm_count = len(data['paymentMethods'])
                        inv_count = len(data['invoices'])
                        print(f"   Payment Methods: {pm_count}, Invoices: {inv_count}")
                    
                    elif name == "Addons" and 'availableAddons' in data:
                        available = len(data['availableAddons'])
                        active = len(data.get('activeAddons', []))
                        print(f"   Available: {available}, Active: {active}")
                
                else:
                    print(f"   Error: {response.text[:100]}")
                    
            except Exception as e:
                print(f"   Exception: {e}")

    def test_user_permissions(self):
        """Test user role and permissions"""
        print("\n👤 Testing User Permissions")
        print("=" * 50)
        
        # Test users endpoint (admin required)
        users_response = self.session.get(f"{self.base_url}/api/dashboard/users")
        print(f"\n🔒 Users API (Admin Required):")
        print(f"   Status: {users_response.status_code}")
        
        if users_response.status_code == 403:
            print("   ✅ Correctly blocked - user doesn't have admin role")
        elif users_response.status_code == 200:
            data = users_response.json()
            users_count = len(data.get('users', []))
            print(f"   ✅ Admin access granted - {users_count} users returned")
        else:
            print(f"   ❌ Unexpected response: {users_response.text[:100]}")

    def test_business_logic(self):
        """Test business logic validations"""
        print("\n💼 Testing Business Logic")
        print("=" * 50)
        
        # Test addon addition without active subscription
        addon_data = {'addonId': 'addon_analytics', 'action': 'enable'}
        addon_response = self.session.post(
            f"{self.base_url}/api/dashboard/addons", 
            json=addon_data
        )
        
        print(f"\n🔌 Addon Addition Test:")
        print(f"   Status: {addon_response.status_code}")
        
        if addon_response.status_code == 400:
            error = addon_response.json().get('error', '')
            if 'subscription required' in error.lower():
                print("   ✅ Correctly requires active subscription")
            else:
                print(f"   ❓ Different validation: {error}")
        elif addon_response.status_code == 200:
            print("   ✅ Successfully added addon")
        else:
            print(f"   ❌ Unexpected response: {addon_response.text[:100]}")

    def test_data_consistency(self):
        """Test data consistency across APIs"""
        print("\n📊 Testing Data Consistency")
        print("=" * 50)
        
        # Get stats and subscription data
        stats_response = self.session.get(f"{self.base_url}/api/dashboard/stats")
        sub_response = self.session.get(f"{self.base_url}/api/dashboard/subscription")
        
        if stats_response.status_code == 200 and sub_response.status_code == 200:
            stats_data = stats_response.json()['stats']
            sub_data = sub_response.json()
            
            active_subs_count = stats_data.get('activeSubscriptions', 0)
            has_active_sub = sub_data.get('hasActiveSubscription', False)
            
            print(f"\n🔍 Consistency Check:")
            print(f"   Stats shows {active_subs_count} active subscriptions")
            print(f"   User has active subscription: {has_active_sub}")
            
            if active_subs_count > 0 and has_active_sub:
                print("   ✅ Data consistent - user has active subscription")
            elif active_subs_count > 0 and not has_active_sub:
                print("   ⚠️  Data inconsistency - active subs exist but user doesn't have one")
            else:
                print("   ✅ Data consistent - no active subscriptions")

    def run_focused_tests(self):
        """Run focused functionality tests"""
        print("🚀 Dashboard API Functionality Test")
        print(f"📧 Testing with: {self.email}")
        print("=" * 60)
        
        # Authenticate
        if not self.authenticate():
            print("❌ Authentication failed")
            return False
        print("✅ Authentication successful")
        
        # Run tests
        self.test_api_responses()
        self.test_user_permissions()
        self.test_business_logic()
        self.test_data_consistency()
        
        print("\n" + "=" * 60)
        print("✅ Focused functionality tests completed!")
        return True

def main():
    tester = APIFunctionalityTester()
    return 0 if tester.run_focused_tests() else 1

if __name__ == "__main__":
    exit(main())
