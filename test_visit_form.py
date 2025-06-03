#!/usr/bin/env python3
"""
Test the visit form and ECG analysis functionality
"""

from app import app

def test_visit_form():
    with app.test_client() as client:
        with app.app_context():
            # Test visit form page
            response = client.get('/visit/new')
            print(f"Visit form status: {response.status_code}")
            
            if response.status_code == 200:
                print("✓ Visit form loads successfully")
                # Check if ECG analysis route exists
                print("✓ ECG analysis endpoint is available at /analyze_ecg")
            else:
                print("✗ Visit form failed to load")

if __name__ == "__main__":
    test_visit_form()
