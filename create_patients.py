#!/usr/bin/env python3
"""
Create sample patients in the database
"""

print("Starting patient creation script...")

try:
    print("Importing Flask app and models...")
    from app import app, db
    from models import Patient
    from datetime import date
    
    print("Creating app context...")
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        
        print("Checking existing patients...")
        existing_count = Patient.query.count()
        print(f"Found {existing_count} existing patients")
        
        if existing_count == 0:
            print("Creating sample patients...")
            
            # Create some sample patients
            patients_data = [
                {"first_name": "John", "last_name": "Doe", "date_of_birth": date(1980, 5, 15), "gender": "Male", "phone": "123-456-7890", "email": "john.doe@email.com"},
                {"first_name": "Jane", "last_name": "Smith", "date_of_birth": date(1975, 8, 22), "gender": "Female", "phone": "098-765-4321", "email": "jane.smith@email.com"},
                {"first_name": "Robert", "last_name": "Johnson", "date_of_birth": date(1990, 12, 3), "gender": "Male", "phone": "555-123-4567", "email": "robert.j@email.com"},
                {"first_name": "Maria", "last_name": "Garcia", "date_of_birth": date(1985, 3, 10), "gender": "Female", "phone": "777-888-9999", "email": "maria.garcia@email.com"},
                {"first_name": "Ahmed", "last_name": "Hassan", "date_of_birth": date(1970, 11, 28), "gender": "Male", "phone": "444-555-6666", "email": "ahmed.hassan@email.com"}
            ]
            
            for patient_data in patients_data:
                patient = Patient(**patient_data)
                db.session.add(patient)
                print(f"  - Added {patient_data['first_name']} {patient_data['last_name']}")
            
            db.session.commit()
            print("✓ Sample patients created successfully!")
            
            # Verify creation
            final_count = Patient.query.count()
            print(f"✓ Total patients now: {final_count}")
            
        else:
            print("Patients already exist, skipping creation")
            
            # Show existing patients
            patients = Patient.query.limit(10).all()
            print("Existing patients:")
            for p in patients:
                print(f"  - {p.first_name} {p.last_name} (DOB: {p.date_of_birth})")
    
    print("✓ Patient creation script completed successfully!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
