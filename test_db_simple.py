#!/usr/bin/env python3
"""
Simple test to check database connectivity
"""

import sys
import os

print("Testing database setup...", flush=True)

try:
    print("Importing Flask app...", flush=True)
    from app import app, db
    print("✓ App imported successfully", flush=True)
    
    print("Importing models...", flush=True) 
    from models import Medicament, Patient
    print("✓ Models imported successfully", flush=True)
    
    print("Creating app context...", flush=True)
    with app.app_context():
        print("✓ App context created", flush=True)
        
        print("Creating database tables...", flush=True)
        db.create_all()
        print("✓ Database tables created", flush=True)
        
        print("Checking medicament table...", flush=True)
        count = Medicament.query.count()
        print(f"✓ Medicament table has {count} records", flush=True)
        
        if count == 0:
            print("Adding a test medication...", flush=True)
            test_med = Medicament(
                num_enr="TEST001",
                nom_com="Test Medicine",
                dosage="100",
                unite="mg"
            )
            db.session.add(test_med)
            db.session.commit()
            print("✓ Test medication added", flush=True)
        
        # List all medications
        meds = Medicament.query.all()
        print(f"\nAll medications ({len(meds)} total):")
        for med in meds:
            print(f"  - {med.nom_com} ({med.dosage}{med.unite}) [ID: {med.num_enr}]")
    
    print("\n✓ Database test completed successfully!")
    
except Exception as e:
    print(f"✗ Error: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
