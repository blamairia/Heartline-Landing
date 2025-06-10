# app.py

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

import torch
import torch.nn as nn
import numpy as np
import wfdb
import tempfile
import csv
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from werkzeug.utils import secure_filename
from urllib.parse import urlparse
from functools import wraps

from flask_moment import Moment # Add this import

from flask import jsonify, request
from sqlalchemy import or_

from wtforms import (
    Form,
    StringField,
    TextAreaField,
    SelectField,
    IntegerField,
    DecimalField,
    DateField,
    DateTimeField,
    FieldList,
    FormField,
    FileField,
    validators,
    ValidationError,
)
from flask_wtf import FlaskForm

import torch
import numpy as np
import wfdb

# IMPORT YOUR RESNET ARCHITECTURE
from resnet import resnet34

from models import (
    db,
    bcrypt,
    Patient,
    Doctor,
    Appointment,
    WaitingListEntry,
    Visit,
    VisitDocument,
    Medicament,
    Prescription,
    ClinicInfo,
    GeneralSettings,
    User,
    UserSession,
)

# ----------------------------------------
# 1) FLASK & DATABASE CONFIGURATION
# ----------------------------------------
app = Flask(__name__)
moment = Moment(app) # Add this line to initialize Flask-Moment
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "replace-this-with-a-secure-random-string")

# Use environment variables for database connection
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT") 
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

if not all([DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME]):
    raise ValueError("Missing required database environment variables. Please check your .env file.")

app.config["SQLALCHEMY_DATABASE_URI"] = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Folders where uploads will be saved
BASE_DIR   = os.path.dirname(__file__)
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
ECG_DIR    = os.path.join(UPLOAD_DIR, "ecg_files")
DOCS_DIR   = os.path.join(UPLOAD_DIR, "visit_docs")

os.makedirs(ECG_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)

db.init_app(app)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.login_message_category = 'info'

# Initialize Bcrypt
bcrypt.init_app(app)

# ----------------------------------------
# 2) PYTORCH MODEL LOADING (ECG)
# ----------------------------------------
MODEL_PATH = os.path.join(BASE_DIR, "resnet34_model.pth")
DEVICE = torch.device("cuda:0") if torch.cuda.is_available() else torch.device("cpu")
NET = None

def load_model():
    global NET
    try:
        # 2a) Instantiate the ResNet34 architecture (12 input channels, 9 classes)
        model = resnet34(input_channels=12, num_classes=9)
        # 2b) Load the saved state_dict
        if os.path.exists(MODEL_PATH):
            state_dict = torch.load(MODEL_PATH, map_location=DEVICE)
            model.load_state_dict(state_dict)
            # 2c) Move to device and switch to eval mode
            model.to(DEVICE)
            model.eval()
            NET = model
            print(f"Model loaded successfully from {MODEL_PATH}")
        else:
            print(f"Model file not found at {MODEL_PATH}. ECG inference will be disabled.")
            NET = None
    except Exception as e:
        print(f"Error loading model: {e}. ECG inference will be disabled.")
        NET = None

# Load the model when the app starts
load_model()

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# ----------------------------------------
# ROLE-BASED ACCESS CONTROL DECORATORS
# ----------------------------------------

def role_required(allowed_roles):
    """Decorator to require specific roles for access"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                flash('Please log in to access this page.', 'warning')
                return redirect(url_for('login'))
            
            if isinstance(allowed_roles, str):
                allowed_roles_list = [allowed_roles]
            else:
                allowed_roles_list = allowed_roles
            
            if current_user.role not in allowed_roles_list:
                flash('You do not have permission to access this page.', 'error')
                return redirect(url_for('dashboard'))
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def doctor_required(f):
    """Decorator to require doctor role"""
    return role_required('doctor')(f)


def assistant_required(f):
    """Decorator to require assistant role"""
    return role_required('assistant')(f)


def any_role_required(f):
    """Decorator to require any authenticated user"""
    return role_required(['doctor', 'assistant'])(f)


# Add custom Jinja filters
@app.template_filter('basename')
def basename_filter(path):
    """Extract filename from path"""
    if path:
        return os.path.basename(path)
    return ''

# ----------------------------------------
# 3) WTForms DEFINITIONS
# ----------------------------------------

# Custom validator for medication field
def validate_medicament(form, field):
    """Custom validator to check if medicament exists in database"""
    if field.data:
        # Import here to avoid circular imports
        from models import Medicament
        med = Medicament.query.filter_by(num_enr=field.data).first()
        if not med:
            raise ValidationError(f'Invalid medication selection: {field.data}')

# Custom validator for patient field
def validate_patient(form, field):
    """Custom validator to check if patient exists in database"""
    if field.data:
        # Import here to avoid circular imports
        from models import Patient
        try:
            patient_id = int(field.data)
            patient = Patient.query.filter_by(id=patient_id).first()
            if not patient:
                raise ValidationError(f'Invalid patient selection: {field.data}')
        except (ValueError, TypeError):
            raise ValidationError(f'Invalid patient ID format: {field.data}')

# --- Subform for Prescriptions ---
class PrescriptionForm(Form):
    medicament_num_enr = StringField(
        "Medicament (num_enr)",
        validators=[validators.DataRequired(), validate_medicament],
    )
    dosage_instructions = TextAreaField("Dosage / Instructions", validators=[validators.DataRequired()])
    quantity = IntegerField("Quantity", validators=[validators.DataRequired(), validators.NumberRange(min=1)])


# --- Subform for Visit Documents (blood/MRI/X-Ray) ---
class VisitDocumentForm(Form):
    doc_type = SelectField(
        "Document Type",
        choices=[("blood","Blood Work"), ("mri","MRI Scan"), ("xray","X-Ray Scan")],
        validators=[validators.DataRequired()],
    )
    file_path = FileField("Upload File (PDF / Image)", validators=[validators.Optional()])
    notes = TextAreaField("Notes", validators=[validators.Optional()])


# --- Form for Visit (with nested prescriptions + documents) ---
class VisitForm(FlaskForm):
    patient_id = StringField(
        "Patient", 
        validators=[validators.DataRequired(), validate_patient],
    )
    visit_date = DateTimeField(
        "Visit Date & Time",
        default=datetime.utcnow,
        format="%Y-%m-%d %H:%M",
        validators=[validators.DataRequired()],
    )
    diagnosis = TextAreaField("Diagnosis", validators=[validators.Optional()])
    follow_up_date = DateTimeField(
        "Follow-up Date & Time",
        format="%Y-%m-%d %H:%M",
        validators=[validators.Optional()],
    )
    ecg_mat = FileField("Upload .mat File", validators=[validators.Optional()])
    ecg_hea = FileField("Upload .hea File", validators=[validators.Optional()])

    payment_total = DecimalField("Payment Total", places=2, default=0.00, validators=[validators.NumberRange(min=0)])
    payment_status = SelectField(
        "Payment Status",
        choices=[("paid","Paid"), ("partial","Partial"), ("unpaid","Unpaid")],
        default="unpaid",
        validators=[validators.DataRequired()],
    )
    payment_remaining = DecimalField("Payment Remaining", places=2, default=0.00, validators=[validators.NumberRange(min=0)])

    # Allow up to 5 prescriptions per visit
    prescriptions = FieldList(FormField(PrescriptionForm), min_entries=1, max_entries=5)

    # Allow up to 3 scanned documents per visit
    documents = FieldList(FormField(VisitDocumentForm), min_entries=1, max_entries=3)


# --- Form for Patient creation & editing ---
class PatientForm(FlaskForm):
    first_name      = StringField("First Name", validators=[validators.DataRequired(), validators.Length(max=50)])
    last_name       = StringField("Last Name", validators=[validators.DataRequired(), validators.Length(max=50)])
    date_of_birth   = DateField("Date of Birth", format="%Y-%m-%d", validators=[validators.DataRequired()])
    gender          = SelectField(
        "Gender",
        choices=[("Male","Male"), ("Female","Female"), ("Other","Other")],
        validators=[validators.DataRequired()],
    )
    address         = TextAreaField("Address", validators=[validators.Optional()])
    phone           = StringField("Phone", validators=[validators.Optional(), validators.Length(max=20)])
    email           = StringField("Email", validators=[validators.Optional(), validators.Email()])
    medical_history = TextAreaField("Medical History", validators=[validators.Optional()])


# --- Form for Appointment creation & editing ---
def coerce_int_or_none(value):
    """Coerce to int, but return None for empty strings"""
    if value == '' or value is None:
        return None
    return int(value)

class AppointmentForm(FlaskForm):
    patient_id = StringField("Patient", validators=[validators.DataRequired(), validate_patient])
    doctor_id = SelectField("Doctor", choices=[], coerce=coerce_int_or_none, validators=[validators.Optional()])
    date = DateTimeField(
        "Appointment Date & Time",
        default=datetime.utcnow,
        format="%Y-%m-%d %H:%M",
        validators=[validators.DataRequired()],
    )
    reason = StringField("Reason for Appointment", validators=[validators.DataRequired(), validators.Length(max=200)])
    state = SelectField(
        "Status",
        choices=[("scheduled","Scheduled"), ("completed","Completed"), ("canceled","Canceled")],
        default="scheduled",
        validators=[validators.DataRequired()],
    )


# ----------------------------------------
# 4) ROUTES & VIEW FUNCTIONS
# ----------------------------------------

@app.route("/")
@login_required
@any_role_required
def index():
    """Simple home page listing Patients and Visits."""
    patients = Patient.query.order_by(Patient.last_name, Patient.first_name).all()
    visits = Visit.query.order_by(Visit.visit_date.desc()).limit(10).all()
    return render_template("index.html", patients=patients, visits=visits)


@app.route("/patient/new", methods=["GET", "POST"])
@login_required
@any_role_required
def create_patient():
    form = PatientForm()
    if form.validate_on_submit():
        # Save new Patient
        p = Patient(
            first_name      = form.first_name.data,
            last_name       = form.last_name.data,
            date_of_birth   = form.date_of_birth.data,
            gender          = form.gender.data,
            address         = form.address.data,
            phone           = form.phone.data,
            email           = form.email.data,
            medical_history = form.medical_history.data,
        )
        db.session.add(p)
        db.session.commit()
        flash("Patient created successfully!", "success")
        return redirect(url_for("index"))

    return render_template("forms/patient_form.html", form=form)


@app.route("/visit/new", methods=["GET", "POST"])
@login_required
@any_role_required
def create_visit():
    """
    Render VisitForm, handle nested prescriptions & documents, save Visit with child rows.
    """
    form = VisitForm()

    # Note: Both patient and medication selection now use AJAX search
    # No need to populate choices as we use custom validators

    if request.method == "POST":
        print("=== SERVER-SIDE FORM VALIDATION ===")
        print(f"Form data received: {dict(request.form)}")
        print(f"Form validation errors before processing: {form.errors}")
        
        if form.validate_on_submit():
            print("Form validation PASSED")
        else:
            print("Form validation FAILED")
            print(f"Form validation errors: {form.errors}")

    if request.method == "POST" and form.validate_on_submit():
        # 1) Save Visit itself
        v = Visit(
            patient_id       = int(form.patient_id.data),  # Convert string to int
            visit_date       = form.visit_date.data,
            diagnosis        = form.diagnosis.data,
            follow_up_date   = form.follow_up_date.data,
            payment_total    = form.payment_total.data,
            payment_status   = form.payment_status.data,
            payment_remaining= form.payment_remaining.data,
        )

        # 2) Handle ECG file uploads (optional)
        mat_file = form.ecg_mat.data
        if mat_file:
            filename = secure_filename(mat_file.filename)
            mat_dest = os.path.join(ECG_DIR, filename)
            mat_file.save(mat_dest)
            v.ecg_mat = mat_dest

        hea_file = form.ecg_hea.data
        if hea_file:
            filename = secure_filename(hea_file.filename)
            hea_dest = os.path.join(ECG_DIR, filename)
            hea_file.save(hea_dest)
            v.ecg_hea = hea_dest

        db.session.add(v)
        db.session.flush()  # flush so v.id becomes available for children

        # 3) Save nested Prescriptions
        for pres_sub in form.prescriptions.entries:
            med_code = pres_sub.form.medicament_num_enr.data
            qty = pres_sub.form.quantity.data
            instr = pres_sub.form.dosage_instructions.data
            if med_code and qty:
                pr = Prescription(
                    visit_id             = v.id,
                    medicament_num_enr   = med_code,
                    dosage_instructions  = instr,
                    quantity             = qty,                )
                db.session.add(pr)

        # 4) Save nested Documents
        for doc_sub in form.documents.entries:
            dtype = doc_sub.form.doc_type.data
            notes = doc_sub.form.notes.data
            file_storage = doc_sub.form.file_path.data
            if file_storage:
                filename = secure_filename(file_storage.filename)
                dest = os.path.join(DOCS_DIR, filename)
                file_storage.save(dest)
                vd = VisitDocument(
                    visit_id  = v.id,
                    doc_type  = dtype,
                    file_path = dest,
                    notes     = notes,
                )
                db.session.add(vd)

        db.session.commit()

        # 5) OPTIONAL: Run ECG inference immediately after saving if both files exist
        if v.ecg_mat and v.ecg_hea and NET:
            try:
                rec_basename = os.path.splitext(os.path.basename(v.ecg_hea))[0]
                rec_dir = os.path.dirname(v.ecg_hea)
                record = wfdb.rdrecord(os.path.join(rec_dir, rec_basename))
                sig_all = record.p_signal  # shape [n_samples, n_leads]
                nsteps, nleads = sig_all.shape

                if nsteps >= 15000:
                    clipped = sig_all[-15000:, :]
                else:
                    clipped = sig_all
                
                buffered = np.zeros((15000, nleads), dtype=np.float32)
                buffered[-clipped.shape[0]:, :] = clipped

                x_np = buffered.T  # shape [12, 15000]
                x_tensor = torch.from_numpy(x_np).unsqueeze(0).to(DEVICE).float()

                with torch.no_grad():
                    logits = NET(x_tensor)
                    probs = torch.sigmoid(logits)[0].cpu().numpy()

                class_abbrs = ["SNR", "AF", "IAVB", "LBBB", "RBBB", "PAC", "PVC", "STD", "STE"]
                v.ecg_prediction = {abbr: float(probs[i]) for i, abbr in enumerate(class_abbrs)}
                db.session.commit()
                flash("ECG inference completed automatically.", "info")
            except Exception as e:
                flash(f"ECG inference failed: {e}", "warning")

        flash("Visit created successfully!", "success")
        return redirect(url_for("visit_details", visit_id=v.id))

    return render_template("forms/visit_form.html", form=form)


@app.route("/visit/<int:visit_id>")
@login_required
@any_role_required
def visit_details(visit_id):
    """
    Display comprehensive visit details including ECG analysis, prescriptions, and documents.
    """
    visit = Visit.query.get_or_404(visit_id)
    
    # Get related data
    prescriptions = visit.prescriptions.all()
    documents = visit.documents.all()
    
    # Prepare ECG analysis data if available
    ecg_analysis = None
    if visit.ecg_prediction:
        class_names = {
            "SNR": "Sinus Rhythm",
            "AF": "Atrial Fibrillation", 
            "IAVB": "AV Block",
            "LBBB": "Left Bundle Branch Block",
            "RBBB": "Right Bundle Branch Block", 
            "PAC": "Premature Atrial Contraction",
            "PVC": "Premature Ventricular Contraction",
            "STD": "ST Depression",
            "STE": "ST Elevation"
        }
        
        # Find primary diagnosis (highest probability)
        max_prob_abbr = max(visit.ecg_prediction, key=visit.ecg_prediction.get)
        max_prob_value = visit.ecg_prediction[max_prob_abbr]
        
        ecg_analysis = {
            "probabilities": visit.ecg_prediction,
            "class_names": class_names,
            "primary_diagnosis": {
                "abbreviation": max_prob_abbr,
                "name": class_names.get(max_prob_abbr, max_prob_abbr),
                "probability": max_prob_value
            }
        }
    
    return render_template("visit_details.html", 
                         visit=visit, 
                         prescriptions=prescriptions, 
                         documents=documents,
                         ecg_analysis=ecg_analysis)

@app.route("/ecg_history")
def ecg_history():
    """
    Display comprehensive ECG history table with filtering and sorting capabilities.
    """
    from datetime import date
    from sqlalchemy import desc
    
    # Get all visits that have ECG data, ordered by visit date (newest first)
    ecg_records = Visit.query.filter(
        Visit.ecg_prediction.isnot(None)
    ).order_by(desc(Visit.visit_date)).all()
    
    # Process ECG records to extract primary diagnosis and confidence
    for record in ecg_records:
        if record.ecg_prediction:
            # Find primary diagnosis (highest probability)
            max_prob_abbr = max(record.ecg_prediction, key=record.ecg_prediction.get)
            max_prob_value = record.ecg_prediction[max_prob_abbr]
            
            # Class names mapping
            class_names = {
                "SNR": "Sinus Rhythm",
                "AF": "Atrial Fibrillation", 
                "IAVB": "AV Block",
                "LBBB": "Left Bundle Branch Block",
                "RBBB": "Right Bundle Branch Block", 
                "PAC": "Premature Atrial Contraction",
                "PVC": "Premature Ventricular Contraction",
                "STD": "ST Depression",
                "STE": "ST Elevation"
            }
            
            # Attach processed data to record
            record.ecg_primary_diagnosis = {
                'abbreviation': max_prob_abbr,
                'name': class_names.get(max_prob_abbr, max_prob_abbr)
            }
            record.ecg_confidence = max_prob_value
    
    # Calculate summary statistics
    total_ecgs = len(ecg_records)
    normal_rhythm_count = sum(1 for r in ecg_records 
                             if r.ecg_primary_diagnosis['abbreviation'] == 'SNR')
    abnormal_count = total_ecgs - normal_rhythm_count
    high_confidence_count = sum(1 for r in ecg_records if r.ecg_confidence >= 0.8)
    
    return render_template("tables/ecg_history_table.html", 
                         ecg_records=ecg_records,
                         total_ecgs=total_ecgs,
                         normal_rhythm_count=normal_rhythm_count,
                         abnormal_count=abnormal_count,
                         high_confidence_count=high_confidence_count,
                         date=date)


@app.route("/ecg_history/export")
def export_ecg_history():
    """
    Export ECG history data to CSV format.
    """
    import csv
    from io import StringIO
    from flask import make_response
    from sqlalchemy import desc
    
    # Get all visits with ECG data
    ecg_records = Visit.query.filter(
        Visit.ecg_prediction.isnot(None)
    ).order_by(desc(Visit.visit_date)).all()
    
    # Create CSV content
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'Visit ID', 'Patient Name', 'Patient Age', 'Gender', 'Visit Date', 
        'Primary ECG Diagnosis', 'Confidence', 'Clinical Diagnosis',
        'All ECG Findings', 'Files Available'
    ])
    
    # Write data rows
    for record in ecg_records:
        if record.ecg_prediction:
            # Calculate patient age
            from datetime import date
            birth_date = record.patient.date_of_birth
            today = date.today()
            age = today.year - birth_date.year
            if today.month < birth_date.month or (today.month == birth_date.month and today.day < birth_date.day):
                age = age - 1
            
            # Find primary diagnosis
            max_prob_abbr = max(record.ecg_prediction, key=record.ecg_prediction.get)
            max_prob_value = record.ecg_prediction[max_prob_abbr]
            
            class_names = {
                "SNR": "Sinus Rhythm", "AF": "Atrial Fibrillation", "IAVB": "AV Block",
                "LBBB": "Left Bundle Branch Block", "RBBB": "Right Bundle Branch Block", 
                "PAC": "Premature Atrial Contraction", "PVC": "Premature Ventricular Contraction",
                "STD": "ST Depression", "STE": "ST Elevation"
            }
            
            primary_diagnosis = class_names.get(max_prob_abbr, max_prob_abbr)
            
            # Format all findings
            all_findings = "; ".join([
                f"{class_names.get(abbr, abbr)}: {prob:.1%}" 
                for abbr, prob in record.ecg_prediction.items()
            ])
            
            # File availability
            files_available = []
            if record.ecg_mat:
                files_available.append("MAT")
            if record.ecg_hea:
                files_available.append("HEA")
            files_str = ", ".join(files_available) if files_available else "None"
            
            writer.writerow([
                record.id,
                f"{record.patient.first_name} {record.patient.last_name}",
                age,
                record.patient.gender,
                record.visit_date.strftime('%Y-%m-%d %H:%M'),
                primary_diagnosis,
                f"{max_prob_value:.1%}",
                record.diagnosis or "No clinical diagnosis",
                all_findings,
                files_str
            ])
    
    # Create response
    output.seek(0)
    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'text/csv'
    response.headers['Content-Disposition'] = 'attachment; filename=ecg_history.csv'
    
    return response


@app.route("/api/ecg_details/<int:visit_id>")
def api_ecg_details(visit_id):
    """
    API endpoint to get detailed ECG analysis for a specific visit.
    """
    visit = Visit.query.get_or_404(visit_id)
    
    if not visit.ecg_prediction:
        return jsonify({"success": False, "error": "No ECG analysis available"})
    
    # Class names mapping
    class_names = {
        "SNR": "Sinus Rhythm",
        "AF": "Atrial Fibrillation", 
        "IAVB": "AV Block",
        "LBBB": "Left Bundle Branch Block",
        "RBBB": "Right Bundle Branch Block", 
        "PAC": "Premature Atrial Contraction",
        "PVC": "Premature Ventricular Contraction",
        "STD": "ST Depression",
        "STE": "ST Elevation"
    }
    
    # Find primary diagnosis
    max_prob_abbr = max(visit.ecg_prediction, key=visit.ecg_prediction.get)
    max_prob_value = visit.ecg_prediction[max_prob_abbr]
    
    analysis = {
        "probabilities": visit.ecg_prediction,
        "class_names": class_names,
        "primary_diagnosis": {
            "abbreviation": max_prob_abbr,
            "name": class_names.get(max_prob_abbr, max_prob_abbr),
            "probability": max_prob_value
        },
        "summary": f"Primary finding: {class_names.get(max_prob_abbr, max_prob_abbr)} ({max_prob_value:.1%} confidence)"
    }
    
    return jsonify({"success": True, "analysis": analysis})


@app.route("/analyze_ecg", methods=["POST"])
def analyze_ecg():
    """
    Real-time ECG analysis endpoint.
    Expects two files: mat_file and hea_file
    Returns JSON with ECG diagnosis probabilities.
    """
    try:
        if not NET:
            return jsonify({"error": "ECG model not loaded"}), 500
        
        mat_file = request.files.get('mat_file')
        hea_file = request.files.get('hea_file')
        
        if not mat_file or not hea_file:
            return jsonify({"error": "Both .mat and .hea files are required"}), 400
        
        # Save files temporarily
        import tempfile
        with tempfile.TemporaryDirectory() as temp_dir:
            # Save the files
            mat_filename = secure_filename(mat_file.filename)
            hea_filename = secure_filename(hea_file.filename)
            
            # Check if basenames match
            mat_base = os.path.splitext(mat_filename)[0]
            hea_base = os.path.splitext(hea_filename)[0]
            
            if mat_base != hea_base:
                return jsonify({"error": "MAT and HEA files must have the same basename"}), 400
            
            mat_path = os.path.join(temp_dir, mat_filename)
            hea_path = os.path.join(temp_dir, hea_filename)
            
            mat_file.save(mat_path)
            hea_file.save(hea_path)
            
            # Read ECG data using wfdb
            record_path = os.path.join(temp_dir, mat_base)
            record = wfdb.rdrecord(record_path)
            sig_all = record.p_signal  # shape [n_samples, n_leads]
            nsteps, nleads = sig_all.shape
            
            # Prepare data for inference (same as in create_visit)
            if nsteps >= 15000:
                clipped = sig_all[-15000:, :]
            else:
                clipped = sig_all
            buffered = np.zeros((15000, nleads), dtype=np.float32)
            buffered[-clipped.shape[0]:, :] = clipped
            
            x_np = buffered.T  # shape [12, 15000]
            x_tensor = torch.from_numpy(x_np).unsqueeze(0).to(DEVICE).float()
            
            # Run inference
            with torch.no_grad():
                logits = NET(x_tensor)
                probs = torch.sigmoid(logits)[0].cpu().numpy()
            
            # Map probabilities to class names
            class_abbrs = ["SNR", "AF", "IAVB", "LBBB", "RBBB", "PAC", "PVC", "STD", "STE"]
            class_names = {
                "SNR": "Sinus Rhythm",
                "AF": "Atrial Fibrillation", 
                "IAVB": "AV Block",
                "LBBB": "Left Bundle Branch Block",
                "RBBB": "Right Bundle Branch Block", 
                "PAC": "Premature Atrial Contraction",
                "PVC": "Premature Ventricular Contraction",
                "STD": "ST Depression",
                "STE": "ST Elevation"
            }
            
            prob_dict = {abbr: float(probs[i]) for i, abbr in enumerate(class_abbrs)}
              # Find the most likely condition (highest probability)
            max_prob_abbr = max(prob_dict, key=prob_dict.get)
            max_prob_value = prob_dict[max_prob_abbr]
            
            # Prepare ECG waveform data for frontend
            fs = float(record.fs) if hasattr(record, 'fs') and record.fs else 250.0  # Default to 250 Hz
            time_duration = nsteps / fs
            time_data = np.linspace(0, time_duration, nsteps).tolist()
            
            # Convert signals to millivolts and prepare for JSON
            # ECG signals are typically in microvolts, convert to millivolts
            signals_mv = []
            for lead_idx in range(min(nleads, 12)):  # Limit to 12 leads max
                lead_signal = sig_all[:, lead_idx] * 1000  # Convert to mV (assuming input is in V)
                signals_mv.append(lead_signal.tolist())
            
            ecg_data = {
                "time": time_data,
                "signals": signals_mv,
                "sampling_rate": fs,
                "duration": time_duration,
                "leads": min(nleads, 12)
            }
            
            # Prepare response
            response = {
                "success": True,
                "probabilities": prob_dict,
                "primary_diagnosis": {
                    "abbreviation": max_prob_abbr,
                    "name": class_names.get(max_prob_abbr, max_prob_abbr),
                    "probability": max_prob_value
                },
                "ecg": ecg_data,
                "summary": f"Primary finding: {class_names.get(max_prob_abbr, max_prob_abbr)} ({max_prob_value:.1%} confidence)"
            }
            
            return jsonify(response)
            
    except Exception as e:
        return jsonify({"error": f"ECG analysis failed: {str(e)}"}), 500




@app.route("/visit/<int:visit_id>/edit", methods=["GET", "POST"])
@login_required
@any_role_required
def edit_visit(visit_id):
    """
    Edit an existing visit (including its prescriptions and documents).
    """
    visit = Visit.query.get_or_404(visit_id)
    form = VisitForm(obj=visit)

    # ──────────── 1) Populate the Patient dropdown ────────────
    form.patient_id.choices = [
        (p.id, f"{p.first_name} {p.last_name}")
        for p in Patient.query.order_by(Patient.first_name, Patient.last_name).all()
    ]

    # ──────────── 2) Prepare Medicament choices for prescriptions ────────────
    meds = Medicament.query.order_by(Medicament.nom_com).all()
    med_choices = [
        (m.num_enr, f"{m.nom_com} ({m.dosage}{m.unite})") 
        for m in meds
    ]

    # ──────────── 3) ONLY pre-populate existing prescriptions & documents on GET ────────────
    if request.method == "GET":
        # --- 3a) Prescriptions from database ---
        existing_prescriptions = visit.prescriptions.all()
        if existing_prescriptions:
            # Remove any default/min entries to start clean
            while len(form.prescriptions.entries) > 0:
                form.prescriptions.pop_entry()
            # For each existing Prescription, append a subform and fill its data
            for prescription in existing_prescriptions:
                pres_form = form.prescriptions.append_entry()
                pres_form.medicament_num_enr.choices = med_choices
                pres_form.medicament_num_enr.data = prescription.medicament_num_enr
                pres_form.dosage_instructions.data = prescription.dosage_instructions
                pres_form.quantity.data = prescription.quantity
        else:
            # If no existing prescriptions, just ensure the single blank entry has choices
            for subform in form.prescriptions:
                subform.medicament_num_enr.choices = med_choices

        # --- 3b) Documents from database ---
        existing_documents = visit.documents.all()
        if existing_documents:
            while len(form.documents.entries) > 0:
                form.documents.pop_entry()
            for document in existing_documents:
                doc_form = form.documents.append_entry()
                doc_form.doc_type.data = document.doc_type
                doc_form.notes.data = document.notes
        # If there are no existing documents, WTForms already gave you min_entries=1 blank.

    # ──────────── 4) Always set Medicament choices (even on POST) so WTForms can bind .data ────────────
    for subform in form.prescriptions:
        subform.medicament_num_enr.choices = med_choices

    # ──────────── 5) Handle POST (form submission) ────────────
    if request.method == "POST" and form.validate_on_submit():
        # 5a) Update top-level Visit fields
        visit.patient_id        = form.patient_id.data
        visit.visit_date        = form.visit_date.data
        visit.diagnosis         = form.diagnosis.data
        visit.follow_up_date    = form.follow_up_date.data
        visit.payment_total     = form.payment_total.data
        visit.payment_status    = form.payment_status.data
        visit.payment_remaining = form.payment_remaining.data

        # 5b) Handle ECG file uploads (optional replacements)
        mat_file = form.ecg_mat.data
        if mat_file:
            mat_filename = secure_filename(mat_file.filename)
            mat_dest     = os.path.join(ECG_DIR, mat_filename)
            mat_file.save(mat_dest)
            visit.ecg_mat = mat_dest

        hea_file = form.ecg_hea.data
        if hea_file:
            hea_filename = secure_filename(hea_file.filename)
            hea_dest     = os.path.join(ECG_DIR, hea_filename)
            hea_file.save(hea_dest)
            visit.ecg_hea = hea_dest

        # 5c) Delete ALL existing prescriptions in DB, then re-insert from form entries
        existing_prescriptions = Prescription.query.filter_by(visit_id=visit.id).all()
        Prescription.query.filter_by(visit_id=visit.id).delete()
        new_pres_count = 0
        for i, pres_sub in enumerate(form.prescriptions.entries):
            med_code = pres_sub.form.medicament_num_enr.data
            qty      = pres_sub.form.quantity.data
            instr    = pres_sub.form.dosage_instructions.data
            if med_code and qty:
                pr = Prescription(
                    visit_id            = visit.id,
                    medicament_num_enr  = med_code,
                    dosage_instructions = instr,
                    quantity            = qty
                )
                db.session.add(pr)
                new_pres_count += 1

        # 5d) Delete ALL existing documents in DB, then re-insert from form entries
        VisitDocument.query.filter_by(visit_id=visit.id).delete()
        for doc_sub in form.documents.entries:
            dtype      = doc_sub.form.doc_type.data
            notes      = doc_sub.form.notes.data
            file_data  = doc_sub.form.file_path.data
            if dtype and file_data:
                filename = secure_filename(file_data.filename)
                dest     = os.path.join(DOCS_DIR, filename)
                file_data.save(dest)
                vd = VisitDocument(
                    visit_id = visit.id,
                    doc_type  = dtype,
                    file_path = dest,
                    notes     = notes
                )
                db.session.add(vd)

        db.session.commit()

        # 5e) (Optional) Re-run ECG inference if both .mat and .hea were uploaded
        if (mat_file or hea_file) and visit.ecg_mat and visit.ecg_hea and NET:
            try:
                rec_basename = os.path.splitext(os.path.basename(visit.ecg_hea))[0]
                rec_dir      = os.path.dirname(visit.ecg_hea)
                record       = wfdb.rdrecord(os.path.join(rec_dir, rec_basename))
                sig_all      = record.p_signal  # [n_samples, n_leads]
                nsteps, nleads = sig_all.shape

                # Clip or pad to 15000 samples
                if nsteps >= 15000:
                    clipped = sig_all[-15000:, :]
                else:
                    clipped = sig_all
                buffered = np.zeros((15000, nleads), dtype=np.float32)
                buffered[-clipped.shape[0]:, :] = clipped

                x_np     = buffered.T
                x_tensor = torch.from_numpy(x_np).unsqueeze(0).to(DEVICE).float()
                with torch.no_grad():
                    logits = NET(x_tensor)
                    probs  = torch.sigmoid(logits)[0].cpu().numpy()

                class_abbrs = ["SNR", "AF", "IAVB", "LBBB", "RBBB", "PAC", "PVC", "STD", "STE"]
                visit.ecg_prediction = {abbr: float(probs[i]) for i, abbr in enumerate(class_abbrs)}
                db.session.commit()
                flash("ECG analysis updated successfully.", "info")
            except Exception as e:
                flash(f"ECG analysis failed: {e}", "warning")

        flash("Visit updated successfully!", "success")
        return redirect(url_for("visit_details", visit_id=visit.id))    # ──────────── 6) Render the form (GET or invalid POST) ────────────
    return render_template("forms/visit_edit_form.html", form=form, visit=visit)


@app.route("/visit/<int:visit_id>/analyze_ecg", methods=["POST"])
@login_required
@any_role_required
def analyze_existing_ecg(visit_id):
    """
    Analyze existing ECG files for a visit that has .mat and .hea files but no ECG prediction data.
    """
    try:
        visit = Visit.query.get_or_404(visit_id)
        
        # Check if ECG files exist
        if not visit.ecg_mat or not visit.ecg_hea:
            return jsonify({"success": False, "error": "No ECG files found for this visit"}), 400
        
        # Check if files actually exist on disk
        if not os.path.exists(visit.ecg_mat) or not os.path.exists(visit.ecg_hea):
            return jsonify({"success": False, "error": "ECG files not found on disk"}), 400
        
        # Check if model is loaded
        if not NET:
            return jsonify({"success": False, "error": "ECG analysis model not available"}), 500
        
        # Read ECG data using the existing file paths
        rec_basename = os.path.splitext(os.path.basename(visit.ecg_hea))[0]
        rec_dir = os.path.dirname(visit.ecg_hea)
        record_path = os.path.join(rec_dir, rec_basename)
        
        # Load the ECG record
        record = wfdb.rdrecord(record_path)
        sig_all = record.p_signal  # [n_samples, n_leads]
        nsteps, nleads = sig_all.shape
        
        # Prepare data for inference (same logic as in other analyze_ecg functions)
        if nsteps >= 15000:
            clipped = sig_all[-15000:, :]
        else:
            clipped = sig_all
        buffered = np.zeros((15000, nleads), dtype=np.float32)
        buffered[-clipped.shape[0]:, :] = clipped
        
        # Transpose for the model
        x_np = buffered.T  # shape [12, 15000]
        x_tensor = torch.from_numpy(x_np).unsqueeze(0).to(DEVICE).float()
        
        # Run inference
        with torch.no_grad():
            logits = NET(x_tensor)
            probs = torch.sigmoid(logits)[0].cpu().numpy()
        
        # Map probabilities to class names
        class_abbrs = ["SNR", "AF", "IAVB", "LBBB", "RBBB", "PAC", "PVC", "STD", "STE"]
        class_names = {
            "SNR": "Sinus Rhythm",
            "AF": "Atrial Fibrillation", 
            "IAVB": "AV Block",
            "LBBB": "Left Bundle Branch Block",
            "RBBB": "Right Bundle Branch Block", 
            "PAC": "Premature Atrial Contraction",
            "PVC": "Premature Ventricular Contraction",
            "STD": "ST Depression",
            "STE": "ST Elevation"
        }
        
        prob_dict = {abbr: float(probs[i]) for i, abbr in enumerate(class_abbrs)}
        
        # Find the most likely condition (highest probability)
        max_prob_abbr = max(prob_dict, key=prob_dict.get)
        max_prob_value = prob_dict[max_prob_abbr]
        
        # Save the ECG prediction to the visit
        visit.ecg_prediction = prob_dict
        db.session.commit()
        
        # Prepare ECG waveform data for frontend (same as in analyze_ecg)
        fs = float(record.fs) if hasattr(record, 'fs') and record.fs else 250.0  # Default to 250 Hz
        time_duration = nsteps / fs
        time_data = np.linspace(0, time_duration, nsteps).tolist()
        
        # Convert signals to millivolts and prepare for JSON
        signals_mv = []
        for lead_idx in range(min(nleads, 12)):  # Limit to 12 leads max
            lead_signal = sig_all[:, lead_idx] * 1000  # Convert to mV (assuming input is in V)
            signals_mv.append(lead_signal.tolist())
        
        ecg_data = {
            "time": time_data,
            "signals": signals_mv,
            "sampling_rate": fs,
            "duration": time_duration,
            "leads": min(nleads, 12)
        }
        
        # Prepare response
        response = {
            "success": True,
            "probabilities": prob_dict,
            "primary_diagnosis": {
                "abbreviation": max_prob_abbr,
                "name": class_names.get(max_prob_abbr, max_prob_abbr),
                "probability": max_prob_value
            },
            "ecg": ecg_data,
            "summary": f"Primary finding: {class_names.get(max_prob_abbr, max_prob_abbr)} ({max_prob_value:.1%} confidence)"
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"success": False, "error": f"ECG analysis failed: {str(e)}"}), 500


@app.route('/visit/<int:visit_id>/ecg_waveform', methods=['GET'])
def get_visit_ecg_waveform(visit_id):
    """Load ECG waveform data from existing files for a visit"""
    try:
        visit = Visit.query.get_or_404(visit_id)
        
        # Check if ECG files exist
        if not visit.ecg_mat or not visit.ecg_hea:
            return jsonify({"success": False, "error": "No ECG files found for this visit"}), 404
        
        # Check if files actually exist on disk
        if not os.path.exists(visit.ecg_mat) or not os.path.exists(visit.ecg_hea):
            return jsonify({"success": False, "error": "ECG files not found on disk"}), 404
        
        # Read ECG data using the existing file paths
        rec_basename = os.path.splitext(os.path.basename(visit.ecg_hea))[0]
        rec_dir = os.path.dirname(visit.ecg_hea)
        record_path = os.path.join(rec_dir, rec_basename)
        
        # Load the ECG record
        record = wfdb.rdrecord(record_path)
        sig_all = record.p_signal  # [n_samples, n_leads]
        nsteps, nleads = sig_all.shape
          # Prepare ECG waveform data for frontend
        fs = float(record.fs) if hasattr(record, 'fs') and record.fs else 250.0  # Default to 250 Hz
        time_duration = nsteps / fs
        time_data = np.linspace(0, time_duration, nsteps).tolist()
        
        # Convert signals to millivolts and prepare for JSON
        signals_mv = []
        for lead_idx in range(min(nleads, 12)):  # Limit to 12 leads max
            lead_signal = sig_all[:, lead_idx] * 1000  # Convert to mV (assuming input is in V)
            signals_mv.append(lead_signal.tolist())
        
        ecg_data = {
            "time": time_data,
            "signals": signals_mv,
            "sampling_rate": fs,
            "duration": time_duration,
            "leads": min(nleads, 12)
        }
        
        return jsonify({
            "success": True,
            "ecg": ecg_data
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": f"Failed to load ECG waveform: {str(e)}"}), 500


# ----------------------------------------
# Additional Required Routes
# ----------------------------------------

@app.route("/patients")
@login_required
@any_role_required
def patients_table():
    """Display all patients in a table."""
    patients = Patient.query.order_by(Patient.last_name, Patient.first_name).all()
    return render_template("patients_table.html", patients=patients)


@app.route("/visits")
@login_required
@any_role_required
def visits_table():
    """Display all visits in a table."""
    visits = Visit.query.order_by(Visit.visit_date.desc()).all()
    return render_template("visits_table.html", visits=visits)


@app.route("/appointments")
@login_required
@any_role_required
def appointments_table():
    """Display appointments (placeholder for now)."""
    # This is a placeholder - you can implement actual appointment functionality later
    return render_template("appointments_table.html", appointments=[])


@app.route("/user_management")
@login_required
@role_required(['doctor', 'assistant'])
def user_management():
    """Manage users (for doctors and assistants only)."""
    users = User.query.all()
    return render_template("user_management.html", users=users)


@app.route("/profile")
@login_required
def profile():
    """User profile page."""
    return render_template("profile.html", user=current_user)


@app.route("/login", methods=["GET", "POST"])
def login():
    """Login page."""
    # Basic login implementation - you may want to enhance this
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('index'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template("login.html")


@app.route("/logout")
@login_required
def logout():
    """Logout and redirect to login page."""
    logout_user()
    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('login'))


# ...existing code...

# ----------------------------------------
# 5) INITIALIZE DATABASE & RUN
# ----------------------------------------
if __name__ == "__main__":
    with app.app_context():
        try:
            db.create_all()   # will skip your existing 'medicament' table if it exists
            print("Database tables created/verified successfully.")
        except Exception as e:
            print(f"Database error: {e}")
        
        load_model()      # instantiate and load state_dict, then .eval()
    
    app.run(host='0.0.0.0',debug=False)
