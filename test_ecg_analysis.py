#!/usr/bin/env python3
"""
Test ECG analysis functionality with sample files
"""

from app import app
import os

def test_ecg_analysis():
    print("Testing ECG analysis functionality...")
    
    # Check if sample ECG files exist
    ecg_files_dir = "uploads/ecg_files"
    mat_file = os.path.join(ecg_files_dir, "A0001.mat")
    hea_file = os.path.join(ecg_files_dir, "A0001.hea")
    
    print(f"Checking for sample files:")
    print(f"  MAT file: {mat_file} - {'✓' if os.path.exists(mat_file) else '✗'}")
    print(f"  HEA file: {hea_file} - {'✓' if os.path.exists(hea_file) else '✗'}")
    
    if os.path.exists(mat_file) and os.path.exists(hea_file):
        with app.test_client() as client:
            with app.app_context():
                # Test the visit form loads
                response = client.get('/visit/new')
                print(f"\nVisit form status: {response.status_code}")
                
                if response.status_code == 200:
                    print("✓ Visit form loads successfully")
                    
                    # Test ECG analysis endpoint with real files
                    with open(mat_file, 'rb') as mf, open(hea_file, 'rb') as hf:
                        data = {
                            'mat_file': (mf, 'A0001.mat'),
                            'hea_file': (hf, 'A0001.hea')
                        }
                        response = client.post('/analyze_ecg', data=data, content_type='multipart/form-data')
                        print(f"\nECG analysis status: {response.status_code}")
                        
                        if response.status_code == 200:
                            result = response.get_json()
                            if result and result.get('success'):
                                print("✓ ECG analysis successful!")
                                print(f"Primary diagnosis: {result['primary_diagnosis']['name']}")
                                print(f"Confidence: {result['primary_diagnosis']['probability']:.2%}")
                                print("\nDetailed probabilities:")
                                for abbr, prob in result['probabilities'].items():
                                    print(f"  {abbr}: {prob:.2%}")
                            else:
                                print(f"✗ ECG analysis failed: {result.get('error', 'Unknown error')}")
                        else:
                            print(f"✗ ECG analysis request failed with status {response.status_code}")
                            if response.data:
                                print(f"Error: {response.data.decode()}")
                else:
                    print("✗ Visit form failed to load")
    else:
        print("\n✗ Sample ECG files not found. Cannot test ECG analysis.")
        print("Please ensure A0001.mat and A0001.hea are in uploads/ecg_files/")

if __name__ == "__main__":
    test_ecg_analysis()
