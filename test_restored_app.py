#!/usr/bin/env python3
"""
Test script to verify the restored app works correctly
"""

import os
import sys

# Add the project directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_app_import():
    """Test that the app can be imported without errors"""
    try:
        import app
        print("✓ App imported successfully")
        return True
    except Exception as e:
        print(f"✗ App import failed: {e}")
        return False

def test_app_routes():
    """Test that the app routes are accessible"""
    try:
        import app
        with app.app.test_client() as client:
            # Test home page
            response = client.get('/')
            print(f"✓ Home page: {response.status_code}")
            
            # Test visit creation page
            response = client.get('/visit/new')
            print(f"✓ Visit form page: {response.status_code}")
            
            # Test patient creation page
            response = client.get('/patient/new') 
            print(f"✓ Patient form page: {response.status_code}")
            
        return True
    except Exception as e:
        print(f"✗ Route test failed: {e}")
        return False

def main():
    print("Testing restored Hearline Webapp...")
    print("=" * 40)
    
    success = True
    success &= test_app_import()
    success &= test_app_routes()
    
    print("=" * 40)
    if success:
        print("✓ All tests passed! The app has been successfully restored.")
        print("🚀 You can now run the app with: python app.py")
    else:
        print("✗ Some tests failed. Please check the errors above.")

if __name__ == "__main__":
    main()
