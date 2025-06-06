# models.py

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import JSON
# from sqlalchemy.dialects.postgresql import JSONB  # Use when connecting to PostgreSQL

db = SQLAlchemy()

class Patient(db.Model):
    __tablename__ = "patient"
    id               = db.Column(db.Integer, primary_key=True)
    first_name       = db.Column(db.String(50), nullable=False)
    last_name        = db.Column(db.String(50), nullable=False)
    date_of_birth    = db.Column(db.Date, nullable=False)
    gender           = db.Column(db.String(10), nullable=False)  # e.g. "Male"/"Female"/"Other"
    address          = db.Column(db.Text, nullable=True)
    phone            = db.Column(db.String(20), nullable=True)
    email            = db.Column(db.String(120), nullable=True, unique=True)
    medical_history  = db.Column(db.Text, nullable=True)

    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    visits           = db.relationship("Visit", backref="patient", lazy="dynamic")
    waiting_list     = db.relationship("WaitingListEntry", backref="patient", lazy="dynamic")


class Doctor(db.Model):
    __tablename__ = "doctor"
    id          = db.Column(db.Integer, primary_key=True)
    first_name  = db.Column(db.String(50), nullable=False)
    last_name   = db.Column(db.String(50), nullable=False)
    specialty   = db.Column(db.String(100), nullable=False)  # e.g. "Cardiologist"
    phone       = db.Column(db.String(20), nullable=True)
    email       = db.Column(db.String(120), nullable=True)
    bio         = db.Column(db.Text, nullable=True)

    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    appointments = db.relationship("Appointment", backref="doctor", lazy="dynamic")
    visits       = db.relationship("Visit", backref="doctor", lazy="dynamic")
    waiting_list = db.relationship("WaitingListEntry", backref="doctor", lazy="dynamic")


class Appointment(db.Model):
    __tablename__ = "appointment"
    id          = db.Column(db.Integer, primary_key=True)
    date        = db.Column(db.DateTime, nullable=False)  # scheduled datetime
    reason      = db.Column(db.String(200), nullable=False)
    state       = db.Column(db.String(20), nullable=False, default="scheduled")  # "scheduled"/"completed"/"canceled"
    patient_id  = db.Column(db.Integer, db.ForeignKey("patient.id"), nullable=False)
    doctor_id   = db.Column(db.Integer, db.ForeignKey("doctor.id"), nullable=True)

    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)    # Relationships
    patient     = db.relationship("Patient", backref="appointments")
    visit       = db.relationship("Visit", backref="appointment", uselist=False)


class WaitingListEntry(db.Model):
    __tablename__ = "waiting_list_entry"
    id              = db.Column(db.Integer, primary_key=True)
    patient_id      = db.Column(db.Integer, db.ForeignKey("patient.id"), nullable=False)
    arrival_time    = db.Column(db.DateTime, default=datetime.utcnow)
    status          = db.Column(db.String(15), nullable=False, default="waiting")  # "waiting"/"called"/"in_progress"/"skipped"
    priority        = db.Column(db.SmallInteger, default=5)
    assigned_doctor = db.Column(db.Integer, db.ForeignKey("doctor.id"), nullable=True)

    created_at      = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at      = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Visit(db.Model):
    __tablename__ = "visit"
    id               = db.Column(db.Integer, primary_key=True)
    appointment_id   = db.Column(db.Integer, db.ForeignKey("appointment.id"), nullable=True)
    patient_id       = db.Column(db.Integer, db.ForeignKey("patient.id"), nullable=False)
    doctor_id        = db.Column(db.Integer, db.ForeignKey("doctor.id"), nullable=True)
    visit_date       = db.Column(db.DateTime, nullable=False)
    diagnosis        = db.Column(db.Text, nullable=True)
    follow_up_date   = db.Column(db.DateTime, nullable=True)

    ecg_mat          = db.Column(db.String(256), nullable=True)   # Path to uploaded .mat
    ecg_hea          = db.Column(db.String(256), nullable=True)   # Path to uploaded .hea
    ecg_prediction   = db.Column(JSON, nullable=True)            # e.g. {"AF":0.12, ...}

    payment_total    = db.Column(db.Numeric(10, 2), default=0.00)
    payment_status   = db.Column(db.String(20), default="unpaid")  # "paid"/"partial"/"unpaid"
    payment_remaining= db.Column(db.Numeric(10, 2), default=0.00)

    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    documents        = db.relationship("VisitDocument", backref="visit", lazy="dynamic")
    prescriptions    = db.relationship("Prescription", backref="visit", lazy="dynamic")


class VisitDocument(db.Model):
    __tablename__ = "visit_document"
    id         = db.Column(db.Integer, primary_key=True)
    visit_id   = db.Column(db.Integer, db.ForeignKey("visit.id"), nullable=False)
    doc_type   = db.Column(db.String(5), nullable=False)     # e.g. "blood"/"mri"/"xray"
    file_path  = db.Column(db.String(256), nullable=False)   # Path to uploaded PDF/image
    notes      = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Medicament(db.Model):
    __tablename__ = "medicament"  # Already exists in your DB; do not touch data
    num_enr   = db.Column(db.String(50), primary_key=True)  # key matches your existing table
    nom_com   = db.Column(db.String(100), nullable=False)
    nom_dci   = db.Column(db.String(100), nullable=False)
    dosage    = db.Column(db.String(50), nullable=False)
    unite     = db.Column(db.String(20), nullable=False)

   
    prescriptions = db.relationship("Prescription", backref="medicament", lazy="dynamic")


class Prescription(db.Model):
    __tablename__ = "prescription"
    id                   = db.Column(db.Integer, primary_key=True)
    visit_id             = db.Column(db.Integer, db.ForeignKey("visit.id"), nullable=False)
    medicament_num_enr   = db.Column(db.String(50), db.ForeignKey("medicament.num_enr"), nullable=False)
    dosage_instructions  = db.Column(db.Text, nullable=False)
    quantity             = db.Column(db.Integer, nullable=False)

    created_at           = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at           = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ClinicInfo(db.Model):
    __tablename__ = "clinic_info"
    id              = db.Column(db.Integer, primary_key=True)
    name            = db.Column(db.String(100), nullable=False, default="Hearline Medical Clinic")
    phone           = db.Column(db.String(20), nullable=True)
    address         = db.Column(db.Text, nullable=True)
    email           = db.Column(db.String(120), nullable=True)
    website         = db.Column(db.String(200), nullable=True)
    operating_hours = db.Column(db.Text, nullable=True)
    specialties     = db.Column(db.Text, nullable=True)
    
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at      = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class GeneralSettings(db.Model):
    __tablename__ = "general_settings"
    id                           = db.Column(db.Integer, primary_key=True)
    default_appointment_duration = db.Column(db.Integer, default=30)  # minutes
    appointment_interval         = db.Column(db.Integer, default=15)  # minutes
    weekend_appointments         = db.Column(db.Boolean, default=True)
    currency                     = db.Column(db.String(10), default="DZD")
    date_format                  = db.Column(db.String(20), default="YYYY-MM-DD")
    auto_backup                  = db.Column(db.Boolean, default=True)
    
    created_at                   = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at                   = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
