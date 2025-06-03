#!/usr/bin/env python3
"""
Test Flask app with PostgreSQL
"""

try:
    print("Testing Flask app with PostgreSQL...")
    
    from app import app
    from models import db, Medicament
    
    with app.app_context():
        print("✓ Flask app context created")
        
        # Test medicament query
        count = Medicament.query.count()
        print(f"✓ Found {count} medications via SQLAlchemy")
        
        # Test getting first 5 medications
        meds = Medicament.query.order_by(Medicament.nom_com).limit(5).all()
        print("\nFirst 5 medications via Flask:")
        for med in meds:
            print(f"  - {med.nom_com} ({med.dosage}{med.unite}) [ID: {med.num_enr}]")
        
        # Test the choices format that will be used in the form
        med_choices = [(m.num_enr, f"{m.nom_com} ({m.dosage}{m.unite})") for m in meds]
        print(f"\nChoice format for dropdown:")
        for choice in med_choices:
            print(f"  - Value: {choice[0]}, Label: {choice[1]}")
    
    print("\n✓ Flask PostgreSQL test successful!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
