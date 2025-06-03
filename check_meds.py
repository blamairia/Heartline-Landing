#!/usr/bin/env python3
"""
Check if medicament table has data
"""

try:
    print("Starting medicament check...")
    from app import app
    from models import db, Medicament
    print("Imports successful")

    with app.app_context():
        print("Creating tables...")
        db.create_all()
        print('Total medicaments:', Medicament.query.count())
        meds = Medicament.query.limit(5).all()
        for m in meds:
            print(f'- {m.num_enr}: {m.nom_com} ({m.dosage}{m.unite})')
            
        if Medicament.query.count() == 0:
            print("No medicaments found! Adding sample data...")
            
            # Add some sample medications
            sample_meds = [
                {'num_enr': 'MED001', 'nom_com': 'Aspirin', 'nom_dci': 'Acetylsalicylic acid', 'dosage': '100', 'unite': 'mg'},
                {'num_enr': 'MED002', 'nom_com': 'Paracetamol', 'nom_dci': 'Acetaminophen', 'dosage': '500', 'unite': 'mg'},
                {'num_enr': 'MED003', 'nom_com': 'Ibuprofen', 'nom_dci': 'Ibuprofen', 'dosage': '200', 'unite': 'mg'},
                {'num_enr': 'MED004', 'nom_com': 'Amoxicillin', 'nom_dci': 'Amoxicillin', 'dosage': '250', 'unite': 'mg'},
                {'num_enr': 'MED005', 'nom_com': 'Lisinopril', 'nom_dci': 'Lisinopril', 'dosage': '10', 'unite': 'mg'},
            ]
            
            for med_data in sample_meds:
                med = Medicament(**med_data)
                db.session.add(med)
                
            db.session.commit()
            print("Sample medications added!")
            
            # Show the updated count
            print('Total medicaments after adding samples:', Medicament.query.count())
            
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
