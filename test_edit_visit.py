#!/usr/bin/env python3
"""
Quick test to verify edit visit functionality
"""

import os
import sys
from app import app
from models import db, Patient, Visit, Medicament, Prescription
from datetime import datetime

def test_edit_visit():
    with app.app_context():
        # Check if we have any visits
        visits = Visit.query.all()
        print(f"Found {len(visits)} visits in database")
        
        if visits:
            visit = visits[0]
            print(f"Visit ID: {visit.id}")
            print(f"Patient: {visit.patient.first_name} {visit.patient.last_name}")
            print(f"Visit Date: {visit.visit_date}")
            print(f"Diagnosis: {visit.diagnosis}")
            print(f"Prescriptions: {len(visit.prescriptions.all())}")
            print(f"Documents: {len(visit.documents.all())}")
        else:
            print("No visits found. Creating a test visit...")
            
            # Check if we have patients
            patients = Patient.query.all()
            if not patients:
                print("No patients found. Please create a patient first.")
                return
            
            # Create a test visit
            patient = patients[0]
            visit = Visit(
                patient_id=patient.id,
                visit_date=datetime.now(),
                diagnosis="Test diagnosis for edit functionality",
                payment_total=100.00,
                payment_status="partial",
                payment_remaining=50.00
            )
            
            db.session.add(visit)
            db.session.commit()
            print(f"Created test visit with ID: {visit.id}")

if __name__ == "__main__":
    test_edit_visit()
