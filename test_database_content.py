#!/usr/bin/env python3
"""
Test the edit visit functionality
"""

from app import app
from models import db, Patient, Visit, Medicament, Prescription, VisitDocument
from datetime import datetime

def test_database_content():
    with app.app_context():
        # Check medications
        meds = Medicament.query.all()
        print(f"Medications: {len(meds)}")
        if meds:
            for i, med in enumerate(meds[:3]):
                print(f"  {med.num_enr}: {med.nom_com} ({med.dosage}{med.unite})")
        
        # Check patients
        patients = Patient.query.all()
        print(f"Patients: {len(patients)}")
        if patients:
            for i, patient in enumerate(patients[:3]):
                print(f"  {patient.id}: {patient.first_name} {patient.last_name}")
        
        # Check visits
        visits = Visit.query.all()
        print(f"Visits: {len(visits)}")
        if visits:
            visit = visits[0]
            print(f"  First visit: {visit.id}")
            print(f"  Patient: {visit.patient.first_name} {visit.patient.last_name}")
            print(f"  Prescriptions: {len(visit.prescriptions.all())}")
            print(f"  Documents: {len(visit.documents.all())}")
            
            # Show prescriptions
            for pres in visit.prescriptions.all():
                print(f"    Prescription: {pres.medicament_num_enr} - {pres.dosage_instructions} - {pres.quantity}")
            
            # Show documents
            for doc in visit.documents.all():
                print(f"    Document: {doc.doc_type} - {doc.notes}")

if __name__ == "__main__":
    test_database_content()
