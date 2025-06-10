# models.py

from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from flask_bcrypt import Bcrypt
from sqlalchemy import JSON
# from sqlalchemy.dialects.postgresql import JSONB  # Use when connecting to PostgreSQL

db = SQLAlchemy()
bcrypt = Bcrypt()

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
    name            = db.Column(db.String(100), nullable=False, default="Heartline Medical Clinic")
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


class User(UserMixin, db.Model):
    """
    User model for authentication with role-based access control.
    Supports two roles: 'doctor' and 'assistant'
    """
    __tablename__ = "user"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='assistant')  # 'doctor' or 'assistant'
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Optional reference to doctor record (only for doctor users)
    doctor_id = db.Column(db.Integer, db.ForeignKey("doctor.id"), nullable=True)
    
    # Additional profile information
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationship to doctor (for doctor users)
    doctor = db.relationship("Doctor", backref="user", uselist=False)
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def has_role(self, role):
        """Check if user has specific role"""
        return self.role == role
    
    def is_doctor(self):
        """Check if user is a doctor"""
        return self.role == 'doctor'
    
    def is_assistant(self):
        """Check if user is an assistant"""
        return self.role == 'assistant'
    
    def get_full_name(self):
        """Get user's full name"""
        return f"{self.first_name} {self.last_name}"
    
    def __repr__(self):
        return f'<User {self.username}>'


class UserSession(db.Model):
    """
    Model to track user sessions for better security
    """
    __tablename__ = "user_session"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    session_token = db.Column(db.String(255), unique=True, nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)  # IPv6 support
    user_agent = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    
    user = db.relationship("User", backref="sessions")
    
    def is_expired(self):
        """Check if session is expired"""
        return datetime.utcnow() > self.expires_at
    
    def __repr__(self):
        return f'<UserSession {self.session_token}>'
