#!/usr/bin/env python3
"""
Populate database with sample medications for testing
"""

from app import app, db
from models import Medicament

def create_sample_medications():
    """Create sample medications in the database"""
    
    sample_medications = [
        {"num_enr": "M001", "nom_com": "Paracetamol", "dosage": "500", "unite": "mg"},
        {"num_enr": "M002", "nom_com": "Ibuprofen", "dosage": "400", "unite": "mg"},
        {"num_enr": "M003", "nom_com": "Aspirin", "dosage": "100", "unite": "mg"},
        {"num_enr": "M004", "nom_com": "Amoxicillin", "dosage": "250", "unite": "mg"},
        {"num_enr": "M005", "nom_com": "Losartan", "dosage": "50", "unite": "mg"},
        {"num_enr": "M006", "nom_com": "Atorvastatin", "dosage": "20", "unite": "mg"},
        {"num_enr": "M007", "nom_com": "Metformin", "dosage": "850", "unite": "mg"},
        {"num_enr": "M008", "nom_com": "Lisinopril", "dosage": "10", "unite": "mg"},
        {"num_enr": "M009", "nom_com": "Amlodipine", "dosage": "5", "unite": "mg"},
        {"num_enr": "M010", "nom_com": "Omeprazole", "dosage": "20", "unite": "mg"},
        {"num_enr": "M011", "nom_com": "Cetirizine", "dosage": "10", "unite": "mg"},
        {"num_enr": "M012", "nom_com": "Simvastatin", "dosage": "40", "unite": "mg"},
        {"num_enr": "M013", "nom_com": "Ciprofloxacin", "dosage": "500", "unite": "mg"},
        {"num_enr": "M014", "nom_com": "Hydrochlorothiazide", "dosage": "25", "unite": "mg"},
        {"num_enr": "M015", "nom_com": "Diclofenac", "dosage": "50", "unite": "mg"},
    ]
    
    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        
        # Check if medications already exist
        existing_count = Medicament.query.count()
        if existing_count > 0:
            print(f"Database already has {existing_count} medications. Skipping insertion.")
            return
        
        # Add sample medications
        print("Adding sample medications...")
        for med_data in sample_medications:
            med = Medicament(
                num_enr=med_data["num_enr"],
                nom_com=med_data["nom_com"],
                dosage=med_data["dosage"],
                unite=med_data["unite"]
            )
            db.session.add(med)
        
        # Commit all changes
        db.session.commit()
        print(f"✓ Successfully added {len(sample_medications)} medications to the database")
        
        # Verify the data
        total_meds = Medicament.query.count()
        print(f"✓ Database now contains {total_meds} medications")
        
        # Show some examples
        print("\nSample medications:")
        for med in Medicament.query.limit(5).all():
            print(f"  - {med.nom_com} ({med.dosage}{med.unite}) [ID: {med.num_enr}]")

if __name__ == "__main__":
    try:
        create_sample_medications()
        print("\n✓ Database setup completed successfully!")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
