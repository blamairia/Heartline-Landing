# models.py
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime

db = SQLAlchemy()


class Patient(db.Model):
    __tablename__ = "patient"
    id               = db.Column(db.Integer, primary_key=True)
    first_name       = db.Column(db.String(50), nullable=False)
    last_name        = db.Column(db.String(50), nullable=False)
    date_of_birth    = db.Column(db.Date, nullable=False)
    gender           = db.Column(db.String(10), nullable=False)  # “Male”/“Female”/“Other”
    address          = db.Column(db.Text, nullable=True)
    phone            = db.Column(db.String(20), nullable=True)
    email            = db.Column(db.String(120), nullable=True, unique=True)
    medical_history  = db.Column(db.Text, nullable=True)
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Reverse relations:
    #   appointments = relationship("Appointment", back_populates="patient")
    #   visits       = relationship("Visit", back_populates="patient")
    #   waiting_list = relationship("WaitingListEntry", back_populates="patient")


class Doctor(db.Model):
    __tablename__ = "doctor"
    id          = db.Column(db.Integer, primary_key=True)
    # If you want to tie a Doctor to a Flask-Login User, you can add:
    user_id   = db.Column(db.Integer, db.ForeignKey('user.id'), unique=True)
    first_name  = db.Column(db.String(50), nullable=False)
    last_name   = db.Column(db.String(50), nullable=False)
    specialty   = db.Column(db.String(100), nullable=False)  # e.g. “Cardiologist”
    phone       = db.Column(db.String(20), nullable=True)
    email       = db.Column(db.String(120), nullable=True)
    bio         = db.Column(db.Text, nullable=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Appointment(db.Model):
    __tablename__ = "appointment"
    id          = db.Column(db.Integer, primary_key=True)
    date        = db.Column(db.DateTime, nullable=False)  # scheduled datetime
    reason      = db.Column(db.String(200), nullable=False)
    state       = db.Column(db.String(20), nullable=False, default="scheduled")
    patient_id  = db.Column(db.Integer, db.ForeignKey("patient.id"), nullable=False)
    doctor_id   = db.Column(db.Integer, db.ForeignKey("doctor.id"), nullable=True)

    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at  = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient     = db.relationship("Patient", backref=db.backref("appointments", lazy="dynamic"))
    doctor      = db.relationship("Doctor", backref=db.backref("appointments", lazy="dynamic"))


class WaitingListEntry(db.Model):
    __tablename__ = "waiting_list_entry"
    id              = db.Column(db.Integer, primary_key=True)
    patient_id      = db.Column(db.Integer, db.ForeignKey("patient.id"), nullable=False)
    arrival_time    = db.Column(db.DateTime, default=datetime.utcnow)
    status          = db.Column(db.String(15), nullable=False, default="waiting")
    priority        = db.Column(db.SmallInteger, default=5)
    assigned_doctor = db.Column(db.Integer, db.ForeignKey("doctor.id"), nullable=True)

    created_at      = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at      = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient         = db.relationship("Patient", backref=db.backref("waiting_list", lazy="dynamic"))
    doctor          = db.relationship("Doctor", backref=db.backref("waiting_list", lazy="dynamic"))


class Visit(db.Model):
    __tablename__ = "visit"
    id               = db.Column(db.Integer, primary_key=True)
    appointment_id   = db.Column(db.Integer, db.ForeignKey("appointment.id"), nullable=True)
    patient_id       = db.Column(db.Integer, db.ForeignKey("patient.id"), nullable=False)
    doctor_id        = db.Column(db.Integer, db.ForeignKey("doctor.id"), nullable=True)
    visit_date       = db.Column(db.DateTime, nullable=False)
    diagnosis        = db.Column(db.Text, nullable=True)
    follow_up_date   = db.Column(db.DateTime, nullable=True)

    # ECG files
    ecg_mat          = db.Column(db.String(256), nullable=True)  # store filepath
    ecg_hea          = db.Column(db.String(256), nullable=True)
    ecg_prediction   = db.Column(JSONB, nullable=True)           # {"AF":0.12, ...}

    payment_total    = db.Column(db.Numeric(10, 2), default=0.00)
    payment_status   = db.Column(db.String(20), default="unpaid")  # “paid”/“partial”/“unpaid”
    payment_remaining= db.Column(db.Numeric(10, 2), default=0.00)

    created_at       = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at       = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    appointment      = db.relationship("Appointment", backref=db.backref("visit", uselist=False))
    patient          = db.relationship("Patient", backref=db.backref("visits", lazy="dynamic"))
    doctor           = db.relationship("Doctor", backref=db.backref("visits", lazy="dynamic"))


class VisitDocument(db.Model):
    __tablename__ = "visit_document"
    id         = db.Column(db.Integer, primary_key=True)
    visit_id   = db.Column(db.Integer, db.ForeignKey("visit.id"), nullable=False)
    doc_type   = db.Column(db.String(5), nullable=False)  # “blood”/“mri”/“xray”
    file_path  = db.Column(db.String(256), nullable=False)  # path where you save the uploaded PDF/scan
    notes      = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    visit      = db.relationship("Visit", backref=db.backref("documents", lazy="dynamic"))


class Medicament(db.Model):
    __tablename__ = "medicament"
    num_enr   = db.Column(db.String(50), primary_key=True)  # same as your Laravel table
    nom_com   = db.Column(db.String(100), nullable=False)
    nom_dci   = db.Column(db.String(100), nullable=False)
    dosage    = db.Column(db.String(50), nullable=False)
    unite     = db.Column(db.String(20), nullable=False)

    created_at= db.Column(db.DateTime, default=datetime.utcnow)
    updated_at= db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship:
    #    prescriptions = backref on Prescription


class Prescription(db.Model):
    __tablename__ = "prescription"
    id                   = db.Column(db.Integer, primary_key=True)
    visit_id             = db.Column(db.Integer, db.ForeignKey("visit.id"), nullable=False)
    medicament_num_enr   = db.Column(db.String(50),
                                     db.ForeignKey("medicament.num_enr"),
                                     nullable=False)
    dosage_instructions  = db.Column(db.Text, nullable=False)
    quantity             = db.Column(db.Integer, nullable=False)

    created_at           = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at           = db.Column(db.DateTime, default=datetime.utcnow,
                                             onupdate=datetime.utcnow)

    visit                = db.relationship("Visit", backref=db.backref("prescriptions", lazy="dynamic"))
    medicament           = db.relationship("Medicament", backref=db.backref("prescriptions", lazy="dynamic"))
