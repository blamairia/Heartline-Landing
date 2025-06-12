# app.py

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

import onnxruntime as ort
import numpy as np
import wfdb
import tempfile
import csv
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session, current_app # Modified import
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
)
from flask_wtf import FlaskForm

# ONNX Runtime for ECG inference

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
# 2) ONNX MODEL LOADING (ECG) - Replaces PyTorch
# ----------------------------------------
MODEL_PATH = os.path.join(BASE_DIR, "resnet34_model.onnx")
ort_session = None

def load_onnx_model():
    """Load ONNX model for ECG inference"""
    global ort_session
    try:
        if os.path.exists(MODEL_PATH):
            ort_session = ort.InferenceSession(MODEL_PATH)
            print(f"ONNX model loaded successfully from {MODEL_PATH}")
            print(f"Input name: {ort_session.get_inputs()[0].name}")
            print(f"Input shape: {ort_session.get_inputs()[0].shape}")
        else:
            print(f"ONNX model file not found at {MODEL_PATH}. ECG inference will be disabled.")
            ort_session = None
    except Exception as e:
        print(f"Error loading ONNX model: {e}. ECG inference will be disabled.")
        ort_session = None

def predict_ecg_onnx(ecg_signal):
    """
    Run ECG inference using ONNX Runtime
    Args:
        ecg_signal: numpy array of shape [12, 15000]
    Returns:
        dict: probabilities for each class
    """
    global ort_session
    
    if ort_session is None:
        raise ValueError("ONNX model not loaded")
    
    try:
        # Prepare input (add batch dimension)
        input_data = ecg_signal.astype(np.float32)
        if len(input_data.shape) == 2:
            input_data = np.expand_dims(input_data, axis=0)  # Add batch dimension
        
        # Get input name
        input_name = ort_session.get_inputs()[0].name
        
        # Run inference
        ort_inputs = {input_name: input_data}
        ort_outputs = ort_session.run(None, ort_inputs)
        
        # Apply sigmoid to get probabilities
        logits = ort_outputs[0][0]  # Remove batch dimension
        probs = 1 / (1 + np.exp(-logits))  # Sigmoid activation
        
        # Map to class names
        class_abbrs = ["SNR", "AF", "IAVB", "LBBB", "RBBB", "PAC", "PVC", "STD", "STE"]
        prob_dict = {abbr: float(probs[i]) for i, abbr in enumerate(class_abbrs)}
        
        return prob_dict
        
    except Exception as e:
        raise RuntimeError(f"ECG inference failed: {e}")

# Load the ONNX model when the app starts
load_onnx_model()

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

# --- Subform for Prescriptions ---
class PrescriptionForm(Form):
    medicament_num_enr = SelectField(
        "Medicament (num_enr)",
        choices=[],  # will populate in view
        validators=[validators.DataRequired()],
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
    patient_id = IntegerField("Patient", validators=[validators.DataRequired()])
    visit_date = DateTimeField(
        "Visit Date & Time",
        default=datetime.utcnow,
        format="%Y-%m-%dT%H:%M",  # Changed from "%Y-%m-%d %H:%M"
        validators=[validators.DataRequired()],
    )
    diagnosis = TextAreaField("Diagnosis", validators=[validators.Optional()])
    follow_up_date = DateTimeField(
        "Follow-up Date & Time",
        format="%Y-%m-%dT%H:%M",  # Changed from "%Y-%m-%d %H:%M"
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
    patient_id = SelectField("Patient", choices=[], coerce=int, validators=[validators.DataRequired()])
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

    # Note: Patient selection now uses AJAX search, no need to populate choices
    # The patient_id will be set by the searchable dropdown via JavaScript

    # Populate medicament choices for each PrescriptionForm
    meds = Medicament.query.order_by(Medicament.nom_com).all()
    med_choices = [(m.num_enr, f"{m.nom_com} ({m.dosage}{m.unite})") for m in meds]
    for subform in form.prescriptions:
        subform.medicament_num_enr.choices = med_choices

    if request.method == "POST" and form.validate_on_submit():
        # 1) Save Visit itself
        v = Visit(
            patient_id       = form.patient_id.data,
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

        db.session.commit()        # 5) OPTIONAL: Run ECG inference immediately after saving if both files exist
        if v.ecg_mat and v.ecg_hea and ort_session:
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
                
                # Use ONNX inference instead of PyTorch
                v.ecg_prediction = predict_ecg_onnx(x_np)
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
        if not ort_session:
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
        
        # Run ONNX inference
        prob_dict = predict_ecg_onnx(x_np)
        
        # Find the most likely condition (highest probability)
        max_prob_abbr = max(prob_dict, key=prob_dict.get)
        max_prob_value = prob_dict[max_prob_abbr]
        
        # Class names for response
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

@app.route("/analyze_ecg", methods=["POST"])
def analyze_ecg():
    """
    Real-time ECG analysis endpoint.
    Expects two files: mat_file and hea_file
    Returns JSON with ECG diagnosis probabilities.
    """
    try:
        if not ort_session:
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
            
            # Run ONNX inference
            prob_dict = predict_ecg_onnx(x_np)
            
            # Find the most likely condition (highest probability)
            max_prob_abbr = max(prob_dict, key=prob_dict.get)
            max_prob_value = prob_dict[max_prob_abbr]
            
            # Class names for response
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
            
            # Find the most likely condition (highest probability)
            max_prob_abbr = max(prob_dict, key=prob_dict.get)
            max_prob_value = prob_dict[max_prob_abbr]
            
            # Prepare response
            response = {
                "success": True,
                "probabilities": prob_dict,
                "primary_diagnosis": {
                    "abbreviation": max_prob_abbr,
                    "name": class_names.get(max_prob_abbr, max_prob_abbr),
                    "probability": max_prob_value
                },
                "summary": f"Primary finding: {class_names.get(max_prob_abbr, max_prob_abbr)} ({max_prob_value:.1%} confidence)"
            }
            
            return jsonify(response)
            
    except Exception as e:
        return jsonify({"error": f"ECG analysis failed: {str(e)}"}), 500


@app.route("/ecg_waveform_data", methods=["POST"])
@login_required 
@any_role_required
def ecg_waveform_data():
    """
    Provides ECG waveform data from .mat and .hea files.
    Expects 'mat_file' and 'hea_file' in the request.
    """
    try:
        mat_file = request.files.get('mat_file')
        hea_file = request.files.get('hea_file')

        if not mat_file or not hea_file:
            return jsonify({"success": False, "error": "Both .mat and .hea files are required"}), 400

        # Secure filenames and check basenames
        mat_filename = secure_filename(mat_file.filename)
        hea_filename = secure_filename(hea_file.filename)
        mat_base = os.path.splitext(mat_filename)[0]
        hea_base = os.path.splitext(hea_filename)[0]

        if mat_base != hea_base:
            return jsonify({"success": False, "error": "MAT and HEA files must have the same basename"}), 400

        # Use a temporary directory to save and read files
        with tempfile.TemporaryDirectory() as temp_dir:
            mat_path = os.path.join(temp_dir, mat_filename)
            hea_path = os.path.join(temp_dir, hea_filename)
            
            mat_file.save(mat_path)
            hea_file.save(hea_path)
            
            record_path = os.path.join(temp_dir, mat_base)
            # Ensure files are closed before wfdb tries to read them, by seeking to start after saving
            mat_file.seek(0)
            hea_file.seek(0)
            record = wfdb.rdrecord(record_path) 
            
            sig_all = record.p_signal  # [n_samples, n_leads]
            nsteps, nleads = sig_all.shape
            
            fs = float(record.fs) if hasattr(record, 'fs') and record.fs else 250.0
            time_duration = nsteps / fs
            time_data = np.linspace(0, time_duration, nsteps).tolist()
            
            signals_mv = []
            for lead_idx in range(nleads): # Use all available leads
                lead_signal = sig_all[:, lead_idx]
                signals_mv.append(lead_signal.tolist())
            
            ecg_data = {
                "time": time_data,
                "signals": signals_mv,
                "sampling_rate": fs,
                "duration": time_duration,
                "lead_names": record.sig_name, 
                "n_leads": nleads
            }
            
            return jsonify({
                "success": True,
                "ecg_data": ecg_data
            })

    except Exception as e:
        current_app.logger.error(f"Error processing ECG waveform data: {e}", exc_info=True)
        return jsonify({"success": False, "error": f"Failed to load ECG waveform: {str(e)}"}), 500

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

        db.session.commit()        # 5e) (Optional) Re-run ECG inference if both .mat and .hea were uploaded
        if (mat_file or hea_file) and visit.ecg_mat and visit.ecg_hea and ort_session:
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

                x_np = buffered.T
                
                # Run ONNX inference
                visit.ecg_prediction = predict_ecg_onnx(x_np)
                db.session.commit()
                flash("ECG analysis updated successfully.", "info")
            except Exception as e:
                flash(f"ECG analysis failed: {e}", "warning")

        flash("Visit updated successfully!", "success")
        return redirect(url_for("visit_details", visit_id=visit.id))

    # ──────────── 6) Render the form (GET or invalid POST) ────────────
    return render_template("forms/visit_edit_form.html", form=form, visit=visit)


@app.route('/search_medicaments')
def search_medicaments():
    """AJAX endpoint to search medications for select2 dropdown"""
    try:
        q = request.args.get('q', '', type=str).strip()
        page = request.args.get('page', 1, type=int)
        per_page = 10
        query = Medicament.query
        if q:
            pattern = f"%{q}%"
            # Search in both nom_com and nom_dci fields
            query = query.filter(
                db.or_(
                    Medicament.nom_com.ilike(pattern),
                    Medicament.nom_dci.ilike(pattern)                )
            )
        paginated = query.order_by(Medicament.nom_com).paginate(page=page, per_page=per_page, error_out=False)
        meds = paginated.items
        results = [
            { 
                'id': m.num_enr, 
                'text': f"{m.nom_com.upper()} - {m.nom_dci} - {m.dosage}",
                'nom_com': m.nom_com or '',
                'nom_dci': m.nom_dci or '',
                'dosage': m.dosage or '',
                'unite': m.unite or ''
            }
            for m in meds
        ]
        more = paginated.pages > page
        return jsonify({ 'medicaments': results, 'pagination': { 'more': more } })
    except Exception as e:
        return jsonify({ 'error': str(e) }), 500


# ─── Route to search patients by first or last name ───
@app.route('/search_patients')
@login_required
@any_role_required
def search_patients():
    """AJAX endpoint to search patients for searchable dropdown"""
    try:
        q = request.args.get('q', '', type=str).strip()
        page = request.args.get('page', 1, type=int)
        per_page = 10
        
        query = Patient.query
        if q:
            pattern = f"%{q}%"
            # Search in both first_name and last_name fields
            query = query.filter(
                db.or_(
                    Patient.first_name.ilike(pattern),
                    Patient.last_name.ilike(pattern)
                )
            )
        
        # Sort by latest added (id desc), then by name
        paginated = query.order_by(Patient.id.desc(), Patient.first_name, Patient.last_name).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        patients = paginated.items
        results = [
            {
                'id': p.id,
                'text': f"{p.first_name} {p.last_name}",
                'first_name': p.first_name or '',
                'last_name': p.last_name or '',
                'phone': p.phone or '',
                'email': p.email or ''
            }
            for p in patients
        ]
        
        more = paginated.pages > page
        return jsonify({ 'patients': results, 'pagination': { 'more': more } })
    except Exception as e:
        return jsonify({ 'error': str(e) }), 500


# ─── Route to create a new patient via AJAX ───
@app.route('/create_patient', methods=['POST'])
@login_required
@any_role_required
def create_patient_ajax():
    """AJAX endpoint to create a new patient"""
    try:
        data = request.get_json()
        
        # Validate required fields
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        
        if not first_name or not last_name:
            return jsonify({'error': 'First name and last name are required'}), 400
        
        # Check if patient already exists
        existing = Patient.query.filter(
            db.and_(
                Patient.first_name.ilike(first_name),
                Patient.last_name.ilike(last_name)
            )
        ).first()
        
        if existing:
            return jsonify({'error': 'Patient with this name already exists'}), 400
        
        # Create new patient
        new_patient = Patient(
            first_name=first_name,
            last_name=last_name,
            phone=data.get('phone', '').strip() or None,
            email=data.get('email', '').strip() or None,
            address=data.get('address', '').strip() or None,
            date_of_birth=None,  # Can be added later
            gender='Other'  # Default value, can be updated later
        )
        
        db.session.add(new_patient)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'patient': {
                'id': new_patient.id,
                'text': f"{new_patient.first_name} {new_patient.last_name}",
                'first_name': new_patient.first_name,
                'last_name': new_patient.last_name,
                'phone': new_patient.phone or '',
                'email': new_patient.email or ''
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ─── Route to search medicaments by name ───


@app.route("/patients")
@login_required
@any_role_required
def patients_table():
    """
    Display comprehensive patients table with filtering and sorting capabilities.
    """
    from datetime import date
    
    # Get all patients with their related data
    patients = Patient.query.order_by(Patient.last_name, Patient.first_name).all()
    
    return render_template("tables/patients_table.html", 
                         patients=patients,
                         Patient=Patient,
                         Visit=Visit,
                         Prescription=Prescription,
                         date=date)


@app.route("/patient/<int:patient_id>")
def patient_details(patient_id):
    """
    Display patient details page.
    """
    from datetime import date
    
    patient = Patient.query.get_or_404(patient_id)
    visits = patient.visits.order_by(Visit.visit_date.desc()).all()
    
    return render_template("patient_details.html", 
                         patient=patient, 
                         visits=visits,
                         date=date)


@app.route("/patient/<int:patient_id>/edit", methods=["GET", "POST"])
def edit_patient(patient_id):
    """
    Edit patient information.
    """
    patient = Patient.query.get_or_404(patient_id)
    form = PatientForm(obj=patient)
    
    if form.validate_on_submit():
        form.populate_obj(patient)
        db.session.commit()
        flash("Patient updated successfully!", "success")
        return redirect(url_for("patient_details", patient_id=patient.id))
    
    return render_template("forms/patient_form.html", form=form, patient=patient)


@login_required
@any_role_required


@app.route("/visits")
@login_required
@any_role_required
def visits_table():
    """
    Display comprehensive visits table with filtering and sorting capabilities.
    """
    from datetime import date
    from sqlalchemy import desc
    
    # Get all visits with their related data, ordered by visit date (newest first)
    visits = Visit.query.order_by(desc(Visit.visit_date)).all()
    
    return render_template("tables/visits_table.html", 
                         visits=visits,
                         Patient=Patient,
                         Visit=Visit,
                         Prescription=Prescription,
                         VisitDocument=VisitDocument,
                         date=date)




@app.route("/appointments")
@login_required
@any_role_required
def appointments_table():
    """
    Display comprehensive appointments table with filtering and sorting capabilities.
    """
    from datetime import date, datetime
    
    # Get all appointments with their related data
    appointments = Appointment.query.order_by(Appointment.date.desc()).all()
    
    # Get all doctors for the filter dropdown
    doctors = Doctor.query.order_by(Doctor.last_name, Doctor.first_name).all()
    
    # Calculate appointment statistics
    stats = {
        'total': Appointment.query.count(),
        'scheduled': Appointment.query.filter_by(state='scheduled').count(),
        'completed': Appointment.query.filter_by(state='completed').count(),
        'today': Appointment.query.filter(
            db.func.date(Appointment.date) == date.today()
        ).count()
    }
    
    return render_template("tables/appointments_table.html", 
                         appointments=appointments,
                         doctors=doctors,
                         stats=stats,
                         date=date,
                         datetime=datetime)


@app.route("/appointment/new", methods=["GET", "POST"])
@login_required
@any_role_required
def create_appointment():
    """
    Create a new appointment.
    """
    form = AppointmentForm()
    
    # Populate patient choices
    form.patient_id.choices = [(p.id, f"{p.first_name} {p.last_name}") 
                              for p in Patient.query.order_by(Patient.last_name, Patient.first_name).all()]
    
    # Populate doctor choices
    form.doctor_id.choices = [(d.id, f"Dr. {d.first_name} {d.last_name}") 
                             for d in Doctor.query.order_by(Doctor.last_name, Doctor.first_name).all()]
    form.doctor_id.choices.insert(0, ("", "Select Doctor (Optional)"))
    
    if form.validate_on_submit():
        try:
            appointment = Appointment(
                date=form.date.data,
                reason=form.reason.data,
                patient_id=form.patient_id.data,
                doctor_id=form.doctor_id.data if form.doctor_id.data else None,
                state='scheduled'
            )
            
            db.session.add(appointment)
            db.session.commit()
            
            flash(f'Appointment scheduled successfully for {appointment.patient.first_name} {appointment.patient.last_name}!', 'success')
            return redirect(url_for('appointments_table'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error scheduling appointment: {str(e)}', 'error')
    
    return render_template('forms/appointment_form.html', form=form)


@app.route("/appointment/<int:appointment_id>/edit", methods=["GET", "POST"])
@login_required
@any_role_required
def edit_appointment(appointment_id):
    """
    Edit an existing appointment.
    """
    appointment = Appointment.query.get_or_404(appointment_id)
    form = AppointmentForm(obj=appointment)
    
    # Populate patient choices
    form.patient_id.choices = [(p.id, f"{p.first_name} {p.last_name}") 
                              for p in Patient.query.order_by(Patient.last_name, Patient.first_name).all()]
    
    # Populate doctor choices
    form.doctor_id.choices = [(d.id, f"Dr. {d.first_name} {d.last_name}") 
                             for d in Doctor.query.order_by(Doctor.last_name, Doctor.first_name).all()]
    form.doctor_id.choices.insert(0, ("", "Select Doctor (Optional)"))
    
    if form.validate_on_submit():
        try:
            appointment.date = form.date.data
            appointment.reason = form.reason.data
            appointment.patient_id = form.patient_id.data
            appointment.doctor_id = form.doctor_id.data if form.doctor_id.data else None
            
            db.session.commit()
            
            flash(f'Appointment updated successfully!', 'success')
            return redirect(url_for('appointments_table'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error updating appointment: {str(e)}', 'error')
    
    return render_template('forms/appointment_form.html', form=form, appointment=appointment)


# ----------------------------------------
# 4) API ENDPOINTS
# ----------------------------------------

# --- Patients ---
@app.route('/api/patients')
@login_required
@any_role_required
def api_patients():
    """API endpoint to get patient data for tables"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '', type=str).strip()
        
        query = Patient.query
        
        # Filter by search term (first or last name)
        if search:
            pattern = f'%{search}%'
            query = query.filter(
                or_(
                    Patient.first_name.ilike(pattern),
                    Patient.last_name.ilike(pattern)
                )
            )
        
        # Paginate results
        patients_paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Serialize results
        patients = [
            {
                'id': p.id,
                'first_name': p.first_name,
                'last_name': p.last_name,
                'date_of_birth': p.date_of_birth.strftime('%Y-%m-%d') if p.date_of_birth else None,
                'gender': p.gender,
                'phone': p.phone,
                'email': p.email,
                'created_at': p.created_at.strftime('%Y-%m-%d %H:%M'),
                'visits_count': p.visits.count()
            }
            for p in patients_paginated.items
        ]
        
        return jsonify({
            'patients': patients,
            'pagination': {
                'page': patients_paginated.page,
                'per_page': patients_paginated.per_page,
                'total': patients_paginated.total,
                'pages': patients_paginated.pages
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --- Doctors ---
@app.route('/api/doctors')
@login_required
@any_role_required
def api_doctors():
    """API endpoint to get doctor data"""
    try:
        doctors = Doctor.query.order_by(Doctor.last_name, Doctor.first_name).all()
        doctor_list = [
            {
                'id': d.id,
                'first_name': d.first_name,
                'last_name': d.last_name,
                'specialty': d.specialty,
                'phone': d.phone,
                'email': d.email,
                'user_id': d.user.id if d.user else None,
                'username': d.user.username if d.user else None
            }
            for d in doctors
        ]
        return jsonify({'doctors': doctor_list})
    except Exception as e:
        app.logger.error(f"Error in /api/doctors: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Users ---
@app.route('/api/users')
@login_required
@role_required(['doctor', 'assistant'])
def api_users():
    """API endpoint to get user data for user management with pagination and filters"""
    try:
        # Pagination and filters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '', type=str).strip()
        role = request.args.get('role', '', type=str)
        status = request.args.get('status', '', type=str)
        
        query = User.query
        # Filter by search term
        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(pattern),
                    User.last_name.ilike(pattern),
                    User.username.ilike(pattern),
                    User.email.ilike(pattern)
                )
            )
        # Filter by role
        if role:
            query = query.filter(User.role == role)
        # Filter by status
        if status:
            if status == 'active':
                query = query.filter(User.is_active.is_(True))
            elif status == 'inactive':
                query = query.filter(User.is_active.is_(False))
        # Order by created date
        query = query.order_by(User.created_at.desc())
        # Paginate
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        users = paginated.items
        # Serialize results
        user_list = [
            {
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'role': u.role,
                'is_active': u.is_active,
                'last_login': u.last_login.strftime('%Y-%m-%d %H:%M:%S') if u.last_login else None,
                'created_at': u.created_at.strftime('%Y-%m-%d %H:%M:%S')
            }
            for u in users
        ]
        return jsonify({
            'users': user_list,
            'pagination': {
                'page': paginated.page,
                'per_page': paginated.per_page,
                'total': paginated.total,
                'pages': paginated.pages
            }
        })
    except Exception as e:
        app.logger.error(f"Error in /api/users: {str(e)}")
        return jsonify({'error': str(e)}), 500
    

# --- Users Statistics ---
@app.route('/api/users/stats')
@login_required
@role_required(['doctor', 'assistant'])
def api_users_stats():
    """API endpoint to get statistics for users"""
    try:
        total_users = User.query.count()
        total_doctors = User.query.filter(User.role == 'doctor').count()
        total_assistants = User.query.filter(User.role == 'assistant').count()
        active_users = User.query.filter(User.is_active.is_(True)).count()
        return jsonify({
            'total_users': total_users,
            'total_doctors': total_doctors,
            'total_assistants': total_assistants,
            'active_users': active_users
        })
    except Exception as e:
        app.logger.error(f"Error in /api/users/stats: {str(e)}")
        return jsonify({'error': str(e)}), 500

# --- Visits ---
@app.route('/api/visits')
@login_required
@any_role_required
def api_visits():
    """API endpoint to get visit data for tables"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '', type=str).strip()
        
        query = Visit.query
        
        # Filter by search term (patient name, diagnosis, etc.)
        if search:
            pattern = f'%{search}%'
            query = query.filter(
                or_(
                    Patient.first_name.ilike(pattern),
                    Patient.last_name.ilike(pattern),
                    Visit.diagnosis.ilike(pattern)
                )
            ).join(Patient)  # Join with Patient table for name search
        
        # Paginate results
        visits_paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Serialize results
        visits = [
            {
                'id': v.id,
                'patient_name': f"{v.patient.first_name} {v.patient.last_name}",
                'visit_date': v.visit_date.strftime('%Y-%m-%d %H:%M') if v.visit_date else None,
                'diagnosis': v.diagnosis,
                'payment_status': v.payment_status,
                'created_at': v.created_at.strftime('%Y-%m-%d %H:%M'),
                'prescriptions_count': v.prescriptions.count(),
                'documents_count': v.documents.count()
            }
            for v in visits_paginated.items
        ]
        
        return jsonify({
            'visits': visits,
            'pagination': {
                'page': visits_paginated.page,
                'per_page': visits_paginated.per_page,
                'total': visits_paginated.total,
                'pages': visits_paginated.pages
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# --- Appointments ---
@app.route('/api/appointments')
@login_required
@any_role_required
def api_appointments():
    """API endpoint to get appointment data for tables"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        search = request.args.get('search', '', type=str).strip()
        
        query = Appointment.query
        
        # Filter by search term (patient name, doctor name, reason, etc.)
        if search:
            pattern = f'%{search}%'
            query = query.filter(
                or_(
                    Patient.first_name.ilike(pattern),
                    Patient.last_name.ilike(pattern),
                    Doctor.first_name.ilike(pattern),
                    Doctor.last_name.ilike(pattern),
                    Appointment.reason.ilike(pattern)
                )
            ).join(Patient, Doctor)  # Join with Patient and Doctor tables
        
        # Paginate results
        appointments_paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        
        # Serialize results
        appointments = [
            {
                'id': a.id,
                'patient_name': f"{a.patient.first_name} {a.patient.last_name}",
                'doctor_name': f"Dr. {a.doctor.first_name} {a.doctor.last_name}" if a.doctor else "No doctor assigned",
                'date': a.date.strftime('%Y-%m-%d %H:%M') if a.date else None,
                'reason': a.reason,
                'state': a.state,
                'created_at': a.created_at.strftime('%Y-%m-%d %H:%M')
            }
            for a in appointments_paginated.items
        ]
        
        return jsonify({
            'appointments': appointments,
            'pagination': {
                'page': appointments_paginated.page,
                'per_page': appointments_paginated.per_page,
                'total': appointments_paginated.total,
                'pages': appointments_paginated.pages
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/api/appointments/<int:appointment_id>/update-status", methods=["POST"])
@login_required
@any_role_required
def update_appointment_status(appointment_id):
    """Update appointment status via API"""
    try:
        appointment = Appointment.query.get_or_404(appointment_id)
        data = request.get_json()
        
        new_status = data.get('status')
        if new_status not in ['scheduled', 'completed', 'canceled']:
            return jsonify({'success': False, 'message': 'Invalid status'}), 400
        
        appointment.state = new_status
        db.session.commit()
        
        return jsonify({'success': True, 'message': f'Appointment marked as {new_status}'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route("/api/appointments/<int:appointment_id>/create-visit", methods=["POST"])
@login_required
@any_role_required
def create_visit_from_appointment(appointment_id):
    """Create a visit from an appointment"""
    try:
        appointment = Appointment.query.get_or_404(appointment_id)
        
        # Check if visit already exists
        if appointment.visit:
            return jsonify({'success': False, 'message': 'Visit already exists for this appointment'}), 400
        
        # Create new visit
        visit = Visit(
            visit_date=appointment.date.date(),
            patient_id=appointment.patient_id,
            chief_complaint=appointment.reason,
            appointment_id=appointment.id
        )
        
        db.session.add(visit)
        appointment.state = 'completed'
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Visit created successfully',
            'visit_id': visit.id
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route("/api/appointments/<int:appointment_id>", methods=["DELETE"])
@login_required
@any_role_required
def delete_appointment(appointment_id):
    """Delete an appointment"""
    try:
        appointment = Appointment.query.get_or_404(appointment_id)
        
        # Check if appointment has a visit
        if appointment.visit:
            return jsonify({'success': False, 'message': 'Cannot delete appointment with existing visit'}), 400
        
        db.session.delete(appointment)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Appointment deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route("/api/appointments/export")
@login_required
@any_role_required
def export_appointments():
    """Export appointments data to CSV"""
    try:
        import csv
        import io
        from datetime import datetime
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow(['ID', 'Date', 'Time', 'Patient', 'Doctor', 'Reason', 'Status', 'Created'])
        
        # Write appointment data
        appointments = Appointment.query.order_by(Appointment.date.desc()).all()
        for apt in appointments:
            writer.writerow([
                apt.id,
                apt.date.strftime('%Y-%m-%d'),
                apt.date.strftime('%H:%M'),
                f"{apt.patient.first_name} {apt.patient.last_name}",
                f"Dr. {apt.doctor.first_name} {apt.doctor.last_name}" if apt.doctor else "No doctor assigned",
                apt.reason,
                apt.state.title(),
                apt.created_at.strftime('%Y-%m-%d %H:%M')
            ])
        
        output.seek(0)
        
        from flask import Response
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': 'attachment; filename=appointments.csv'}
        )
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ----------------------------------------
# SETTINGS ROUTE
# ----------------------------------------

@app.route("/settings")
@login_required
@any_role_required
def settings():
    """Settings page with clinic information and doctor management"""
    from models import ClinicInfo, GeneralSettings
    
    # Get existing clinic info and settings
    clinic_info = ClinicInfo.query.first()
    general_settings = GeneralSettings.query.first()
    
    # Get all doctors for the doctor management tab
    doctors = Doctor.query.order_by(Doctor.last_name, Doctor.first_name).all()
    
    return render_template('pages/settings.html',
                         clinic_info=clinic_info,
                         general_settings=general_settings,
                         doctors=doctors)


# ----------------------------------------
# AUTHENTICATION ROUTES
# ----------------------------------------

@app.route("/login", methods=["GET", "POST"])
def login():
    """User login page"""
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    from forms.auth_forms import LoginForm
    form = LoginForm()
    
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        
        if user and user.check_password(form.password.data):
            if not user.is_active:
                flash('Your account has been deactivated. Please contact an administrator.', 'error')
                return render_template('auth/login.html', form=form)
            
            # Update last login
            user.last_login = datetime.utcnow()
            db.session.commit()
            
            # Log user in
            login_user(user, remember=form.remember_me.data)
            
            # Redirect to intended page or dashboard
            next_page = request.args.get('next')
            if not next_page or urlparse(next_page).netloc != '':
                next_page = url_for('dashboard')
            
            flash(f'Welcome back, {user.get_full_name()}!', 'success')
            return redirect(next_page)
        else:
            flash('Invalid username or password.', 'error')
    
    return render_template('auth/login.html', form=form)


@app.route("/auth/register", methods=["GET", "POST"])
def register():
    """User registration page"""
    from forms.auth_forms import RegistrationForm
    form = RegistrationForm()
    
    if form.validate_on_submit():
        # Create new user
        user = User(
            username=form.username.data,
            email=form.email.data,
            first_name=form.first_name.data,
            last_name=form.last_name.data,
            phone=form.phone.data,
            role=form.role.data
        )
        user.set_password(form.password.data)
        
        # Handle doctor role
        if form.role.data == 'doctor':
            if form.doctor_id.data == 0:
                # Create new doctor profile
                doctor = Doctor(
                    first_name=form.first_name.data,
                    last_name=form.last_name.data,
                    specialty='General Practitioner',  # Default, can be changed later
                    phone=form.phone.data,
                    email=form.email.data
                )
                db.session.add(doctor)
                db.session.flush()  # Get the doctor ID
                user.doctor_id = doctor.id
            else:
                # Link to existing doctor profile
                user.doctor_id = form.doctor_id.data
        
        db.session.add(user)
        db.session.commit()
        
        flash(f'User {user.username} has been registered successfully!', 'success')
        return redirect(url_for('user_management'))
    
    return render_template('auth/register.html', form=form)


@app.route("/logout")
@login_required
def logout():
    """User logout"""
    username = current_user.username
    logout_user()
    flash(f'You have been logged out successfully, {username}.', 'info')
    return redirect(url_for('login'))


@app.route("/profile")
@login_required
def profile():
    """User profile page"""
    return render_template('auth/profile.html', user=current_user)


@app.route("/profile/edit", methods=["GET", "POST"])
@login_required
def edit_profile():
    """Edit user profile"""
    from forms.auth_forms import ProfileEditForm
    form = ProfileEditForm(current_user, obj=current_user)
    
    if form.validate_on_submit():
        current_user.first_name = form.first_name.data
        current_user.last_name = form.last_name.data
        current_user.email = form.email.data
        current_user.phone = form.phone.data
        current_user.updated_at = datetime.utcnow()
        
        db.session.commit()
        flash('Your profile has been updated successfully!', 'success')
        return redirect(url_for('profile'))
    
    return render_template('auth/edit_profile.html', form=form)





@app.route("/change-password", methods=["GET", "POST"])
@login_required
def change_password():
    """Change user password"""
    from forms.auth_forms import ChangePasswordForm
    form = ChangePasswordForm()
    
    if form.validate_on_submit():
        if current_user.check_password(form.current_password.data):
            current_user.set_password(form.new_password.data)
            current_user.updated_at = datetime.utcnow()
            db.session.commit()
            flash('Your password has been changed successfully!', 'success')
            return redirect(url_for('profile'))
        else:
            flash('Current password is incorrect.', 'error')
    
    return render_template('auth/change_password.html', form=form)


@app.route("/user-management")
@login_required
@role_required(['doctor', 'assistant'])
def user_management():
    """User management page - will fetch data from API"""
    return render_template('auth/user_management.html')


@app.route("/user/<int:user_id>/toggle-status", methods=["POST"])
@login_required
@role_required(['doctor', 'assistant'])
def toggle_user_status(user_id):
    """Toggle user active status"""
    user = User.query.get_or_404(user_id)
    
    if user.id == current_user.id:
        return jsonify({"success": False, "message": "You cannot deactivate your own account"}), 400
    
    user.is_active = not user.is_active
    user.updated_at = datetime.utcnow()
    db.session.commit()
    
    status = "activated" if user.is_active else "deactivated"
    return jsonify({"success": True, "message": f"User {user.username} has been {status}"})


@app.route("/user/<int:user_id>/delete", methods=["DELETE"])
@login_required
@role_required('doctor')  # Only doctors can delete users
def delete_user(user_id):
    """Delete user account"""
    user = User.query.get_or_404(user_id)
    
    if user.id == current_user.id:
        return jsonify({"success": False, "message": "You cannot delete your own account"}), 400
    
    username = user.username
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({"success": True, "message": f"User {username} has been deleted"})


# ----------------------------------------
# DASHBOARD AND HOME ROUTES
# ----------------------------------------

@app.route("/")
@login_required
def index():
    """Redirect to dashboard"""
    return redirect(url_for('dashboard'))


@app.route("/dashboard")
@login_required
def dashboard():
    """Main dashboard - role-specific content"""
    from datetime import date, timedelta
    
    # Get basic statistics
    total_patients = Patient.query.count()
    total_visits = Visit.query.count()
    total_appointments = Appointment.query.count()
    
    # Today's statistics
    today = date.today()
    today_visits = Visit.query.filter(
        db.func.date(Visit.visit_date) == today
    ).count()
    
    today_appointments = Appointment.query.filter(
        db.func.date(Appointment.date) == today,
        Appointment.state == 'scheduled'
    ).count()
    
    # Recent activity based on role
    if current_user.is_doctor():
        # Doctor-specific dashboard data
        recent_visits = Visit.query.filter(
            Visit.doctor_id == current_user.doctor_id
        ).order_by(Visit.visit_date.desc()).limit(5).all()
        
        doctor_appointments = Appointment.query.filter(
            Appointment.doctor_id == current_user.doctor_id,
            Appointment.date >= datetime.now()
        ).order_by(Appointment.date).limit(5).all()
        
        return render_template('dashboard/doctor_dashboard.html',
                             total_patients=total_patients,
                             total_visits=total_visits,
                             total_appointments=total_appointments,
                             today_visits=today_visits,
                             today_appointments=today_appointments,
                             recent_visits=recent_visits,
                             upcoming_appointments=doctor_appointments)
    else:
        # Assistant dashboard - general overview
        recent_visits = Visit.query.order_by(Visit.visit_date.desc()).limit(5).all()
        upcoming_appointments = Appointment.query.filter(
            Appointment.date >= datetime.now()
        ).order_by(Appointment.date).limit(5).all()
        
        return render_template('dashboard/assistant_dashboard.html',
                             total_patients=total_patients,
                             total_visits=total_visits,
                             total_appointments=total_appointments,
                             today_visits=today_visits,
                             today_appointments=today_appointments,
                             recent_visits=recent_visits,                             upcoming_appointments=upcoming_appointments)

# ----------------------------------------
# Dashboard API Endpoints
# ----------------------------------------

@app.route('/api/dashboard/doctor/stats')
@login_required
@doctor_required
def doctor_dashboard_stats():
    """Get doctor dashboard statistics"""
    try:
        from datetime import date, timedelta
        today = date.today()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Basic counts
        total_patients = Patient.query.count()
        today_visits = Visit.query.filter(db.func.date(Visit.visit_date) == today).count()
        ecg_tests_week = Visit.query.filter(
            Visit.visit_date >= week_ago,
            Visit.ecg_results.isnot(None)
        ).count()
        
        # Average visit time (mock data for now)
        avg_visit_time = 25
        
        # Changes (mock data for now)
        patients_change = 5
        visits_change = 10
        ecg_change = 15
        time_change = 0
        
        # Quick stats
        pending_reports = Visit.query.filter(Visit.notes == '').count()
        completed_today = Visit.query.filter(
            db.func.date(Visit.visit_date) == today,
            Visit.notes != ''
        ).count()
        follow_ups = 3  # Mock data
        new_patients_week = Patient.query.filter(
            Patient.created_at >= week_ago
        ).count()
        
        return jsonify({
            'total_patients': total_patients,
            'today_visits': today_visits,
            'ecg_tests_week': ecg_tests_week,
            'avg_visit_time': avg_visit_time,
            'patients_change': patients_change,
            'visits_change': visits_change,
            'ecg_change': ecg_change,
            'time_change': time_change,
            'pending_reports': pending_reports,
            'completed_today': completed_today,
            'follow_ups': follow_ups,
            'new_patients_week': new_patients_week
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/assistant/stats')
@login_required
@assistant_required
def assistant_dashboard_stats():
    """Get assistant dashboard statistics"""
    try:
        from datetime import date, timedelta
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        # Basic counts for today
        patients_registered = Patient.query.filter(
            db.func.date(Patient.created_at) == today
        ).count()
        visits_processed = Visit.query.filter(
            db.func.date(Visit.visit_date) == today
        ).count()
        calls_handled = 12  # Mock data
        avg_processing_time = 8  # Mock data
        
        # Changes (mock data for now)
        registration_change = 20
        visits_change = 15
        calls_change = 8
        time_change = -5
        
        return jsonify({
            'patients_registered': patients_registered,
            'visits_processed': visits_processed,
            'calls_handled': calls_handled,
            'avg_processing_time': avg_processing_time,
            'registration_change': registration_change,
            'visits_change': visits_change,
            'calls_change': calls_change,
            'time_change': time_change
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/recent-activity')
@login_required
def dashboard_recent_activity():
    """Get recent activity for dashboard"""
    try:
        activities = []
        
        # Recent patients (last 5)
        recent_patients = Patient.query.order_by(Patient.created_at.desc()).limit(3).all()
        for patient in recent_patients:
            activities.append({
                'type': 'patient_added',
                'title': f'New patient registered: {patient.first_name} {patient.last_name}',
                'timestamp': patient.created_at.isoformat()
            })
        
        # Recent visits (last 5)
        recent_visits = Visit.query.order_by(Visit.visit_date.desc()).limit(3).all()
        for visit in recent_visits:
            activities.append({
                'type': 'visit_completed',
                'title': f'Visit completed for {visit.patient.first_name} {visit.patient.last_name}',
                'timestamp': visit.visit_date.isoformat()
            })
        
        # Sort by timestamp descending
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return jsonify(activities[:10])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/today-schedule')
@login_required
def dashboard_today_schedule():
    """Get today's schedule for dashboard"""
    try:
        from datetime import date
        today = date.today()
        
        appointments = Appointment.query.filter(
            db.func.date(Appointment.date) == today,
            Appointment.state == 'scheduled'
        ).order_by(Appointment.date).limit(10).all()
        
        schedule = []
        for apt in appointments:
            schedule.append({
                'time': apt.date.isoformat(),
                'patient_name': f"{apt.patient.first_name} {apt.patient.last_name}",
                'visit_type': apt.purpose or 'General Visit'
            })
        
        return jsonify(schedule)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/visits-chart')
@login_required
def dashboard_visits_chart():
    """Get visits chart data for last 7 days"""
    try:
        from datetime import date, timedelta
        
        # Get last 7 days
        today = date.today()
        dates = []
        visits_count = []
        
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            dates.append(day.strftime('%m/%d'))
            
            # Count visits for this day
            count = Visit.query.filter(
                db.func.date(Visit.visit_date) == day
            ).count()
            visits_count.append(count)
        
        return jsonify({
            'labels': dates,
            'visits': visits_count
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/patient-queue')
@login_required
def dashboard_patient_queue():
    """Get patient queue for assistant dashboard"""
    try:
        from datetime import date
        today = date.today()
        
        # Get today's appointments that are scheduled or in progress
        appointments = Appointment.query.filter(
            db.func.date(Appointment.date) == today,
            Appointment.state.in_(['scheduled', 'in_progress'])
        ).order_by(Appointment.date).all()
        
        queue = []
        for apt in appointments:
            status = 'waiting' if apt.state == 'scheduled' else 'in-progress'
            queue.append({
                'name': f"{apt.patient.first_name} {apt.patient.last_name}",
                'visit_type': apt.purpose or 'General Visit',
                'scheduled_time': apt.date.isoformat(),
                'status': status
            })
        
        return jsonify(queue)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/notifications')
@login_required
def dashboard_notifications():
    """Get notifications for dashboard"""
    try:
        notifications = []
        
        # Mock notifications - in a real app, these would come from a notifications table
        from datetime import datetime, timedelta
        
        notifications = [
            {
                'type': 'appointment',
                'title': 'Upcoming appointment in 30 minutes',
                'timestamp': (datetime.now() - timedelta(minutes=10)).isoformat()
            },
            {
                'type': 'patient',
                'title': 'New patient registration pending approval',
                'timestamp': (datetime.now() - timedelta(hours=1)).isoformat()
            },
            {
                'type': 'system',
                'title': 'System backup completed successfully',
                'timestamp': (datetime.now() - timedelta(hours=2)).isoformat()
            }
        ]
        
        return jsonify(notifications)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/productivity-chart')
@login_required
@assistant_required
def dashboard_productivity_chart():
    """Get productivity chart data for assistant dashboard"""
    try:
        # Mock productivity data
        data = {
            'labels': ['Patients Registered', 'Visits Processed', 'Calls Handled', 'Reports Generated'],
            'values': [15, 23, 12, 8]
        }
        
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks', methods=['POST'])
@login_required
def create_task():
    """Create a new task"""
    try:
        # In a real app, you'd have a Task model
        # For now, just return success
        return jsonify({'success': True, 'message': 'Task created successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/today')
@login_required
def get_today_tasks():
    """Get today's tasks"""
    try:
        # Mock task data
        tasks = [
            {
                'id': 1,
                'title': 'Review patient files',
                'description': 'Review new patient registration forms',
                'priority': 'high',
                'due_date': '2024-01-15'
            },
            {
                'id': 2,
                'title': 'Update appointment schedule',
                'description': 'Confirm tomorrow\'s appointments',
                'priority': 'medium',
                'due_date': '2024-01-15'
            },
            {
                'id': 3,
                'title': 'Prepare monthly report',
                'description': 'Compile statistics for monthly clinic report',
                'priority': 'low',
                'due_date': '2024-01-20'
            }
        ]
        
        return jsonify(tasks)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>/complete', methods=['PUT'])
@login_required
def complete_task(task_id):
    """Mark task as complete"""
    try:
        # In a real app, you'd update the task in the database
        return jsonify({'success': True, 'message': 'Task completed'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    """Delete a task"""
    try:
        # In a real app, you'd delete the task from the database
        return jsonify({'success': True, 'message': 'Task deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User management API endpoints for admin
@app.route('/auth/users/stats')
@login_required
@any_role_required
def user_stats():
    """Get user statistics"""
    try:
        total_users = User.query.count()
        total_doctors = User.query.filter_by(role='doctor').count()
        total_assistants = User.query.filter_by(role='assistant').count()
        active_users = User.query.filter_by(is_active=True).count()
        
        return jsonify({
            'total_users': total_users,
            'total_doctors': total_doctors,
            'total_assistants': total_assistants,
            'active_users': active_users
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/users')
@login_required
@any_role_required
def list_users():
    """List all users with pagination and filtering"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = 10
        search = request.args.get('search', '')
        role_filter = request.args.get('role', '')
        status_filter = request.args.get('status', '')
        
        query = User.query
        
        # Apply filters
        if search:
            query = query.filter(
                db.or_(
                    User.username.contains(search),
                    User.email.contains(search),
                    User.first_name.contains(search),
                    User.last_name.contains(search)
                )
            )
        
        if role_filter:
            query = query.filter_by(role=role_filter)
            
        if status_filter == 'active':
            query = query.filter_by(is_active=True)
        elif status_filter == 'inactive':
            query = query.filter_by(is_active=False)
        
        # Paginate
        users_pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        users_list = []
        for user in users_pagination.items:
            users_list.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'created_at': user.created_at.isoformat(),
                'doctor_profile_id': user.doctor_profile_id
            })
        
        return jsonify({
            'users': users_list,
            'pagination': {
                'page': page,
                'pages': users_pagination.pages,
                'per_page': per_page,
                'total': users_pagination.total
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/users/<int:user_id>')
@login_required
@any_role_required
def get_user(user_id):
    """Get user details"""
    try:
        user = User.query.get_or_404(user_id)
        
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'is_active': user.is_active,
            'doctor_profile_id': user.doctor_profile_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/users/<int:user_id>', methods=['PUT'])
@login_required
@any_role_required
def update_user(user_id):
    """Update user details"""
    try:
        user = User.query.get_or_404(user_id)
        
        user.username = request.form.get('username', user.username)
        user.email = request.form.get('email', user.email)
        user.first_name = request.form.get('first_name', user.first_name)
        user.last_name = request.form.get('last_name', user.last_name)
        user.role = request.form.get('role', user.role)
        user.is_active = request.form.get('is_active') == 'on'
          # Handle doctor profile assignment
        if user.role == 'doctor':
            doctor_profile_id = request.form.get('doctor_profile_id')
            if doctor_profile_id:
                user.doctor_profile_id = int(doctor_profile_id)
        else:
            user.doctor_profile_id = None
        
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'User updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/auth/users/<int:user_id>/reset-password', methods=['POST'])
@login_required
@any_role_required
def reset_user_password(user_id):
    """Reset user password"""
    try:
        import secrets
        import string
        
        user = User.query.get_or_404(user_id)
        
        # Generate random password
        alphabet = string.ascii_letters + string.digits
        new_password = ''.join(secrets.choice(alphabet) for i in range(12))
        
        # Update user password
        user.password_hash = bcrypt.generate_password_hash(new_password).decode('utf-8')
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Password reset successfully',
            'new_password': new_password
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/analyze_ecg_by_visit/<int:visit_id>')
def analyze_ecg_by_visit(visit_id):
    try:
        visit = Visit.query.get_or_404(visit_id)
        
        class_abbrs = ["SNR", "AF", "IAVB", "LBBB", "RBBB", "PAC", "PVC", "STD", "STE"]
        class_names = {
            "SNR": "Sinus Rhythm", "AF": "Atrial Fibrillation", "IAVB": "AV Block",
            "LBBB": "Left Bundle Branch Block", "RBBB": "Right Bundle Branch Block", 
            "PAC": "Premature Atrial Contraction", "PVC": "Premature Ventricular Contraction",
            "STD": "ST Depression", "STE": "ST Elevation"
        }

        if visit.ecg_prediction and isinstance(visit.ecg_prediction, dict) and visit.ecg_prediction:
            stored_probs = visit.ecg_prediction
            valid_prediction = all(abbr in stored_probs for abbr in class_abbrs)
            
            if valid_prediction:
                # Ensure max_prob_abbr is one of the expected class_abbrs
                # Filter keys to only include class_abbrs before finding max
                filtered_probs = {k: v for k, v in stored_probs.items() if k in class_abbrs}
                if not filtered_probs: # Should not happen if valid_prediction was true based on class_abbrs
                    pass # Fall through to live analysis
                else:
                    max_prob_abbr_stored = max(filtered_probs, key=filtered_probs.get)
                    max_prob_value_stored = filtered_probs[max_prob_abbr_stored]
                    response = {
                        "success": True,
                        "probabilities": stored_probs, # Return original stored_probs
                        "primary_diagnosis": {
                            "abbreviation": max_prob_abbr_stored,
                            "name": class_names.get(max_prob_abbr_stored, max_prob_abbr_stored),
                            "probability": max_prob_value_stored
                        },
                        "summary": f"Primary finding: {class_names.get(max_prob_abbr_stored, max_prob_abbr_stored)} ({max_prob_value_stored:.1%} confidence) (cached)"                    }
                    return jsonify(response)

        if not visit.ecg_mat or not visit.ecg_hea:
            return jsonify({"success": False, "error": "No ECG files found for this visit to perform live analysis"}), 400
        
        mat_path = visit.ecg_mat
        hea_path = visit.ecg_hea

        if not os.path.exists(mat_path) or not os.path.exists(hea_path):
            return jsonify({"success": False, "error": "ECG files not found on disk for live analysis"}), 400
        
        if not ort_session:
            return jsonify({"success": False, "error": "ECG analysis model not available"}), 500

        rec_basename = os.path.splitext(os.path.basename(hea_path))[0]
        rec_dir = os.path.dirname(hea_path)
        record_path = os.path.join(rec_dir, rec_basename)
        
        record = wfdb.rdrecord(record_path)
        sig_all = record.p_signal
        nsteps, nleads = sig_all.shape

        if nleads != 12:
             return jsonify({"success": False, "error": f"ECG record has {nleads} leads, but model expects 12."}), 400

        if nsteps >= 15000:
            clipped = sig_all[-15000:, :]
        else:
            clipped = sig_all
        
        buffered = np.zeros((15000, nleads), dtype=np.float32)
        buffered[-clipped.shape[0]:, :] = clipped
        
        x_np = buffered.T
        
        # Run ONNX inference
        prob_dict_live = predict_ecg_onnx(x_np)
        max_prob_abbr_live = max(prob_dict_live, key=prob_dict_live.get)
        max_prob_value_live = prob_dict_live[max_prob_abbr_live]
        
        response = {
            "success": True,
            "probabilities": prob_dict_live,
            "primary_diagnosis": {
                "abbreviation": max_prob_abbr_live,
                "name": class_names.get(max_prob_abbr_live, max_prob_abbr_live),
                "probability": max_prob_value_live
            },
            "summary": f"Primary finding: {class_names.get(max_prob_abbr_live, max_prob_abbr_live)} ({max_prob_value_live:.1%} confidence) (live analysis)"
        }
        return jsonify(response)

    except wfdb.WFDBError as wfdbe:
        current_app.logger.error(f"WFDBError in /analyze_ecg_by_visit/{visit_id}: {wfdbe}", exc_info=True)
        record_path_for_error = "unknown"
        try:
            # Try to get record_path for better error logging if it was defined
            if 'rec_basename' in locals() and 'rec_dir' in locals():
                 record_path_for_error = os.path.join(rec_dir, rec_basename)
        except NameError:
            pass # Keep it as unknown
        if ".dat" in str(wfdbe).lower() and ("cannot be found" in str(wfdbe).lower() or "no such file" in str(wfdbe).lower()):
             return jsonify({"success": False, "error": f"WFDB error: Associated .dat file missing or unreadable for record {record_path_for_error}. Details: {str(wfdbe)}"}), 404
        return jsonify({"success": False, "error": f"WFDB processing error: {str(wfdbe)}"}), 500
    except FileNotFoundError:
        current_app.logger.error(f"FileNotFoundError in /analyze_ecg_by_visit/{visit_id}", exc_info=True)
        return jsonify({"success": False, "error": "ECG record file not found. Check paths and file integrity."}), 404
    except Exception as e:
        current_app.logger.error(f"Error in /analyze_ecg_by_visit/{visit_id}: {e}", exc_info=True)
        if "Expected input channel size" in str(e) or "expects 12 input channels" in str(e):
            return jsonify({"success": False, "error": f"Model input error: Check number of ECG leads. Details: {str(e)}"}), 400
        return jsonify({"success": False, "error": f"ECG analysis failed: {str(e)}"}), 500

@app.route('/ecg_waveform_by_visit/<int:visit_id>')
def ecg_waveform_by_visit(visit_id):
    try:
        visit = Visit.query.get_or_404(visit_id)

        if not visit.ecg_mat or not visit.ecg_hea:
            return jsonify({"success": False, "error": "No ECG files found for this visit"}), 404
        
        mat_path = visit.ecg_mat
        hea_path = visit.ecg_hea

        if not os.path.exists(mat_path) or not os.path.exists(hea_path):
            return jsonify({"success": False, "error": "ECG files not found on disk"}), 404

        rec_basename = os.path.splitext(os.path.basename(hea_path))[0]
        rec_dir = os.path.dirname(hea_path)
        record_path = os.path.join(rec_dir, rec_basename)
        
        record = wfdb.rdrecord(record_path)
        sig_all = record.p_signal
        nsteps, nleads = sig_all.shape
        
        fs = float(record.fs) if hasattr(record, 'fs') and record.fs else 250.0
        time_duration = nsteps / fs
        time_data = np.linspace(0, time_duration, nsteps).tolist()
        
        signals_list = [] # Renamed from signals_mv to avoid implying units not explicitly set
        lead_names = record.sig_name if hasattr(record, 'sig_name') and record.sig_name else [f"Lead {i+1}" for i in range(nleads)]

        for lead_idx in range(nleads):
            lead_signal = sig_all[:, lead_idx]
            signals_list.append(lead_signal.tolist())

        ecg_data = {
            "time": time_data,
            "signals": signals_list,
            "sampling_rate": fs,
            "duration": time_duration,
            "lead_names": lead_names,
            "n_leads": nleads
        }
        
        return jsonify({
            "success": True,
            "ecg_data": ecg_data
        })

    except wfdb.WFDBError as wfdbe:
        current_app.logger.error(f"WFDBError in /ecg_waveform_by_visit/{visit_id}: {wfdbe}", exc_info=True)
        record_path_for_error = "unknown"
        try:
            if 'rec_basename' in locals() and 'rec_dir' in locals():
                 record_path_for_error = os.path.join(rec_dir, rec_basename)
        except NameError:
            pass
        if ".dat" in str(wfdbe).lower() and ("cannot be found" in str(wfdbe).lower() or "no such file" in str(wfdbe).lower()):
             return jsonify({"success": False, "error": f"WFDB error: Associated .dat file missing or unreadable for record {record_path_for_error}. Details: {str(wfdbe)}"}), 404
        return jsonify({"success": False, "error": f"WFDB processing error: {str(wfdbe)}"}), 500
    except FileNotFoundError:
        current_app.logger.error(f"FileNotFoundError in /ecg_waveform_by_visit/{visit_id}", exc_info=True)
        return jsonify({"success": False, "error": "ECG record file not found. Check paths and file integrity."}), 404
    except Exception as e:
        current_app.logger.error(f"Error in /ecg_waveform_by_visit/{visit_id}: {e}", exc_info=True)
        return jsonify({"success": False, "error": f"Failed to load ECG waveform: {str(e)}"}), 500

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
        
        load_onnx_model()      # load ONNX model for ECG inference
    
    app.run(host='0.0.0.0',debug=False)
