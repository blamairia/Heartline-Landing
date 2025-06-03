#!/usr/bin/env python3
"""
Test PostgreSQL connection and medication retrieval
"""

import sys
print("Starting PostgreSQL test...", flush=True)

try:
    print("Importing app and db...", flush=True)
    from app import app, db
    print("Importing Medicament model...", flush=True)
    from models import Medicament
    
    print("Creating app context...", flush=True)
    with app.app_context():
        print("✓ App context created", flush=True)
        
        # Test database connection
        try:
            print("Testing database connection...", flush=True)
            result = db.engine.execute("SELECT 1").fetchone()
            print("✓ Database connection successful", flush=True)
        except Exception as e:
            print(f"✗ Database connection failed: {e}", flush=True)
            raise
        
        # Test if medicament table exists
        try:
            print("Querying medicament table...", flush=True)
            count = Medicament.query.count()
            print(f"✓ Medicament table found with {count} records", flush=True)
        except Exception as e:
            print(f"✗ Error accessing medicament table: {e}", flush=True)
            raise
        
        # Show first 5 medications
        if count > 0:
            print("Getting first 5 medications...", flush=True)
            meds = Medicament.query.limit(5).all()
            print("\nFirst 5 medications:")
            for med in meds:
                print(f"  - {med.nom_com} ({med.dosage}{med.unite}) [ID: {med.num_enr}]")
        else:
            print("No medications found in database")
    
    print("\nPostgreSQL test completed successfully!")
    
except Exception as e:
    print(f"✗ Error: {e}", flush=True)
    import traceback
    traceback.print_exc()
    sys.exit(1)
