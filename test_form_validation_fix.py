#!/usr/bin/env python3
"""
Test script to verify the form validation fix for patient and medication fields.
"""

import requests
import sys
from datetime import datetime

def test_form_submission():
    """Test form submission with AJAX-selected patient and medication"""
    
    # Base URL for the Flask app
    base_url = "http://127.0.0.1:5000"
    
    # Create a session to handle cookies/authentication
    session = requests.Session()
    
    print("🧪 Testing Visit Form Submission...")
    print("=" * 50)
    
    # First, get the form page to establish a session and get CSRF token
    print("1. Getting visit form page...")
    try:
        form_response = session.get(f"{base_url}/visit/new")
        if form_response.status_code != 200:
            print(f"❌ Failed to get form page: {form_response.status_code}")
            return False
        print("✅ Form page loaded successfully")
    except Exception as e:
        print(f"❌ Error accessing form page: {e}")
        return False
    
    # Extract CSRF token from the form page
    import re
    csrf_match = re.search(r'name="csrf_token" value="([^"]+)"', form_response.text)
    if not csrf_match:
        print("❌ Could not find CSRF token in form")
        return False
    
    csrf_token = csrf_match.group(1)
    print(f"✅ CSRF token found: {csrf_token[:20]}...")
    
    # Prepare form data that mimics what JavaScript would submit
    print("\n2. Preparing form data...")
    form_data = {
        'csrf_token': csrf_token,
        'patient_id': '5',  # Patient ID as string (from AJAX search)
        'visit_date': datetime.now().strftime('%Y-%m-%d %H:%M'),
        'diagnosis': 'Test diagnosis for form validation',
        'payment_total': '100.00',
        'payment_status': 'paid',
        'payment_remaining': '0.00',
        # Prescription data (with medication from AJAX search)
        'prescriptions-0-medicament_num_enr': '07040',  # Medication as string
        'prescriptions-0-dosage_instructions': 'Take 1 tablet daily',
        'prescriptions-0-quantity': '30',
        # Document data
        'documents-0-doc_type': 'blood',
        'documents-0-notes': 'Test blood work notes'
    }
    
    print("📝 Form data prepared:")
    for key, value in form_data.items():
        if 'csrf' not in key.lower():
            print(f"   {key}: {value}")
    
    # Submit the form
    print("\n3. Submitting form...")
    try:
        submit_response = session.post(
            f"{base_url}/visit/new",
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        print(f"📡 Response status: {submit_response.status_code}")
        
        # Check if submission was successful
        if submit_response.status_code == 200:
            # Check if we're still on the form page (indicating validation errors)
            if 'Create Visit' in submit_response.text and 'form' in submit_response.text:
                print("❌ Form submission failed - still on form page")
                
                # Look for validation errors in the response
                error_patterns = [
                    r'<small class="text-danger">([^<]+)</small>',
                    r'class="alert alert-danger"[^>]*>([^<]+)</small>',
                    r'Not a valid choice'
                ]
                
                for pattern in error_patterns:
                    errors = re.findall(pattern, submit_response.text, re.IGNORECASE)
                    if errors:
                        print("🔍 Validation errors found:")
                        for error in errors:
                            print(f"   - {error.strip()}")
                        return False
                
                print("🔍 No specific validation errors found in HTML")
                return False
                
            else:
                print("✅ Form submission successful - redirected away from form")
                return True
                
        elif submit_response.status_code == 302:
            print("✅ Form submission successful - redirect response")
            redirect_url = submit_response.headers.get('Location', 'Unknown')
            print(f"   Redirected to: {redirect_url}")
            return True
            
        else:
            print(f"❌ Unexpected response status: {submit_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error submitting form: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting Form Validation Fix Test")
    print("=" * 60)
    
    success = test_form_submission()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 TEST PASSED: Form validation fix is working!")
        print("✅ Patient and medication fields now accept AJAX-selected values")
    else:
        print("💥 TEST FAILED: Form validation issues persist")
        print("❌ Check server logs for more details")
    
    print("=" * 60)
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
