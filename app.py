# app.py

import os
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename

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

import torch
import numpy as np
import wfdb

# IMPORT YOUR RESNET ARCHITECTURE
from resnet import resnet34

from models import (
    db,
    Patient,
    Doctor,
    Appointment,
    WaitingListEntry,
    Visit,
    VisitDocument,
    Medicament,
    Prescription,
)

# ----------------------------------------
# 1) FLASK & DATABASE CONFIGURATION
# ----------------------------------------
app = Flask(__name__)
app.config["SECRET_KEY"] = "replace-this-with-a-secure-random-string"
# Use PostgreSQL database with medicament table
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql+psycopg2://postgres:root@localhost:5432/nv"
# app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///hearline.db"  # Temporary for testing
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Folders where uploads will be saved
BASE_DIR   = os.path.dirname(__file__)
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
ECG_DIR    = os.path.join(UPLOAD_DIR, "ecg_files")
DOCS_DIR   = os.path.join(UPLOAD_DIR, "visit_docs")

os.makedirs(ECG_DIR, exist_ok=True)
os.makedirs(DOCS_DIR, exist_ok=True)

db.init_app(app)

# Add custom Jinja filters
@app.template_filter('basename')
def basename_filter(path):
    """Extract filename from path"""
    if path:
        return os.path.basename(path)
    return ''

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
    patient_id = SelectField("Patient", choices=[], coerce=int, validators=[validators.DataRequired()])
    visit_date = DateTimeField(
        "Visit Date & Time",
        default=datetime.utcnow,
        format="%Y-%m-%dT%H:%M",
        validators=[validators.DataRequired()],
    )
    diagnosis = TextAreaField("Diagnosis", validators=[validators.Optional()])
    follow_up_date = DateTimeField(
        "Follow-up Date & Time",
        format="%Y-%m-%dT%H:%M",
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


# ----------------------------------------
# 4) ROUTES & VIEW FUNCTIONS
# ----------------------------------------

@app.route("/")
def index():
    """Simple home page listing Patients and Visits."""
    patients = Patient.query.order_by(Patient.last_name, Patient.first_name).all()
    visits = Visit.query.order_by(Visit.visit_date.desc()).limit(10).all()
    return render_template("index.html", patients=patients, visits=visits)


@app.route("/patient/new", methods=["GET", "POST"])
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
def create_visit():
    """
    Render VisitForm, handle nested prescriptions & documents, save Visit with child rows.
    """
    form = VisitForm()

    # Populate patient dropdown
    form.patient_id.choices = [(p.id, f"{p.first_name} {p.last_name}") for p in Patient.query.order_by(Patient.first_name).all()]

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


@app.route("/visit/<int:visit_id>/edit", methods=["GET", "POST"])
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
        return redirect(url_for("visit_details", visit_id=visit.id))

    # ──────────── 6) Render the form (GET or invalid POST) ────────────
    return render_template("forms/visit_edit_form.html", form=form, visit=visit)


# ─── Route to search patients by first or last name ───
@app.route('/search_patients')
def search_patients():
    q = request.args.get('q', '', type=str).strip()
    # If q is empty, we return the first 10 patients alphabetically.
    # If q is nonempty, we filter by first_name ILIKE or last_name ILIKE.
    if q == "":
        patients = (
            Patient.query
            .order_by(Patient.first_name, Patient.last_name)
            .limit(10)
            .all()
        )
    else:
        pattern = f'%{q}%'
        patients = (
            Patient.query
            .filter(
                or_(
                    Patient.first_name.ilike(pattern),
                    Patient.last_name.ilike(pattern)
                )
            )
            .order_by(Patient.first_name, Patient.last_name)
            .limit(10)
            .all()
        )

    results = [
        {
            'id': p.id,
            'label': f"{p.first_name} {p.last_name}"
        }
        for p in patients
    ]
    return jsonify(results)


# ─── Route to search medicaments by name ───
@app.route('/search_medicaments')
def search_medicaments():
    q = request.args.get('q', '', type=str).strip()
    # If q is empty, we return the first 10 medicaments alphabetically.
    # If q is nonempty, we filter by nom_com ILIKE.
    if q == "":
        medicaments = (
            Medicament.query
            .order_by(Medicament.nom_com)
            .limit(10)
            .all()
        )
    else:
        pattern = f'%{q}%'
        medicaments = (
            Medicament.query
            .filter(Medicament.nom_com.ilike(pattern))
            .order_by(Medicament.nom_com)
            .limit(10)
            .all()
        )

    results = [
        {
            'id': m.num_enr,
            'label': f"{m.nom_com} ({m.dosage}{m.unite})"
        }
        for m in medicaments
    ]
    return jsonify(results)


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
    
    app.run(debug=True)
