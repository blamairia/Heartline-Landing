# app.py
import os
from flask import Flask, redirect, url_for, request, flash
from flask_admin import Admin, expose, BaseView
from flask_admin.contrib.sqla import ModelView
from werkzeug.utils import secure_filename
from sqlalchemy.event import listens_for

import torch
import numpy as np
import wfdb
from resnet34 import resnet34   # your existing ResNet architecture

from models import (
    db,
    Patient, Doctor, Appointment, WaitingListEntry,
    Visit, VisitDocument, Medicament, Prescription
)

# ----------------------------------------
# 1) FLASK + SQLALCHEMY SETUP
# ----------------------------------------
app = Flask(__name__)
app.config["SECRET_KEY"] = "replace-with-your-own-secret-key"
app.config["SQLALCHEMY_DATABASE_URI"] = (
    "postgresql+psycopg2://user:password@localhost:5432/yourdb"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Folder where we’ll save uploaded files (ECG + Visit scans)
BASE_UPLOAD = os.path.join(os.path.dirname(__file__), "uploads")
ECG_UPLOAD = os.path.join(BASE_UPLOAD, "ecg_files")
DOC_UPLOAD = os.path.join(BASE_UPLOAD, "visit_docs")

os.makedirs(ECG_UPLOAD, exist_ok=True)
os.makedirs(DOC_UPLOAD, exist_ok=True)

db.init_app(app)

# ----------------------------------------
# 2) LOAD YOUR PYTORCH MODEL ONCE
# ----------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "resnet34_model.pth")
# We’ll load it globally so Admin actions can use it:
DEVICE = torch.device("cuda:0") if torch.cuda.is_available() else torch.device("cpu")
NET, _DEV = None, None

def load_model():
    global NET, _DEV
    _DEV = torch.device("cuda:0") if torch.cuda.is_available() else torch.device("cpu")
    NET = resnet34(input_channels=12, num_classes=9)
    state_dict = torch.load(MODEL_PATH, map_location=_DEV)
    NET.load_state_dict(state_dict)
    NET.to(_DEV)
    NET.eval()

# Use Flask’s “before_first_request” to load once
@app.before_first_request
def initialize_model():
    load_model()


# ----------------------------------------
# 3) FLASK-ADMIN VIEWS & INLINE CONFIGURATION
# ----------------------------------------

# --- Inline: VisitDocument in Visit form ---
class VisitDocumentInline(ModelView):
    form_columns = ("doc_type", "file_path", "notes")
    column_labels = {"file_path": "Upload File (PDF/Image)"}

    # Hook to save file to disk when “file_path” is chosen via an <input type="file">
    def on_model_change(self, form, model, is_created):
        if hasattr(form.file_path, "data") and form.file_path.data:
            # `data` is a FileStorage
            f = form.file_path.data
            filename = secure_filename(f.filename)
            dest = os.path.join(DOC_UPLOAD, filename)
            f.save(dest)
            model.file_path = dest


# --- Inline: Prescription in Visit form ---
class PrescriptionInline(ModelView):
    form_columns = ("medicament_num_enr", "dosage_instructions", "quantity")
    column_labels = {
        "medicament_num_enr": "Medicament (num_enr)",
        "dosage_instructions": "Dosage / Instructions",
        "quantity": "Qty"
    }


# --- Main Visit ModelView with two inlines ---
class VisitModelView(ModelView):
    column_list   = ("id", "patient", "doctor", "visit_date", "payment_status")
    column_filters= ("payment_status", "doctor")
    form_columns  = (
        "appointment_id",
        "patient_id",
        "doctor_id",
        "visit_date",
        "diagnosis",
        "follow_up_date",
        "ecg_mat",
        "ecg_hea",
        "payment_total",
        "payment_status",
        "payment_remaining",
    )
    column_labels = {
        "ecg_mat": "Upload .mat",
        "ecg_hea": "Upload .hea",
        "ecg_prediction": "ECG Prediction (JSON)",
    }

    inline_models = [(VisitDocument, dict(form_label="Scanned Reports",
                                         form_columns=["doc_type", "file_path", "notes"])),
                     (Prescription, dict(form_label="Prescriptions",
                                         form_columns=["medicament_num_enr", "dosage_instructions", "quantity"]))]

    readonly_fields = ("ecg_prediction",)  # We’ll fill this via an Action

    # -------------- Custom “Run ECG” Action --------------
    def run_ecg_inference(self, ids):
        """
        Run ECG model on selected visits:
        - Expect that each Visit has ecg_mat & ecg_hea paths.
        - Read WFDB record, pad/clip to 15000×12, run ResNet, save JSON to ecg_prediction.
        """
        if not NET:
            flash("Model not loaded!", "error")
            return

        for visit_id in ids:
            visit = Visit.query.get(visit_id)
            if not visit or not visit.ecg_mat or not visit.ecg_hea:
                continue

            # 1) Read WFDB record
            rec_basename = os.path.splitext(os.path.basename(visit.ecg_hea))[0]
            rec_dir = os.path.dirname(visit.ecg_hea)
            try:
                record = wfdb.rdrecord(os.path.join(rec_dir, rec_basename))
            except Exception as e:
                flash(f"Visit {visit.id}: could not read WFDB record: {e}", "error")
                continue

            sig_all = record.p_signal  # shape [n_samples, n_leads]
            nsteps, nleads = sig_all.shape

            # 2) Pad or clip to exactly 15000 samples
            if nsteps >= 15000:
                clipped = sig_all[-15000:, :]
            else:
                clipped = sig_all
            buffered = np.zeros((15000, nleads), dtype=np.float32)
            buffered[-clipped.shape[0]:, :] = clipped

            # 3) Convert to tensor [1, 12, 15000]
            x_np = buffered.T
            x_tensor = torch.from_numpy(x_np).unsqueeze(0).to(_DEV).float()

            # 4) Inference
            with torch.no_grad():
                logits = NET(x_tensor)
                probs  = torch.sigmoid(logits)[0].cpu().numpy()

            # 5) Build JSON of all 9 classes
            class_abbrs = ["SNR","AF","IAVB","LBBB","RBBB","PAC","PVC","STD","STE"]
            prediction_json = {abbr: float(probs[i]) for i, abbr in enumerate(class_abbrs)}

            # 6) Save back to DB
            visit.ecg_prediction = prediction_json
            db.session.add(visit)

        db.session.commit()
        flash(f"ECG inference complete for {len(ids)} visit(s)", "success")

    run_ecg_inference.label = "Run ECG Inference"


# --- Registering other ModelViews (for completeness) ---
class PatientModelView(ModelView):
    column_list = ("id", "first_name", "last_name", "date_of_birth", "phone", "email")
    form_columns = ("first_name", "last_name", "date_of_birth", "gender", "address", "phone", "email", "medical_history")


class DoctorModelView(ModelView):
    column_list = ("id", "first_name", "last_name", "specialty", "phone", "email")
    form_columns = ("first_name", "last_name", "specialty", "phone", "email", "bio")


class AppointmentModelView(ModelView):
    column_list = ("id", "date", "patient_id", "doctor_id", "state")
    form_columns = ("date", "reason", "state", "patient_id", "doctor_id")


class WaitingListModelView(ModelView):
    column_list = ("id", "patient_id", "arrival_time", "status", "priority", "assigned_doctor")
    form_columns = ("patient_id", "status", "priority", "assigned_doctor")


class MedicamentModelView(ModelView):
    column_list = ("num_enr", "nom_com", "nom_dci", "dosage", "unite")


class PrescriptionModelView(ModelView):
    column_list = ("id", "visit_id", "medicament_num_enr", "quantity")


# ----------------------------------------
# 4) INITIALIZE FLASK-ADMIN
# ----------------------------------------
admin = Admin(app, name="Clinic Admin", template_mode="bootstrap4")

admin.add_view(PatientModelView(Patient, db.session, category="Data"))
admin.add_view(DoctorModelView(Doctor, db.session, category="Data"))
admin.add_view(AppointmentModelView(Appointment, db.session, category="Scheduling"))
admin.add_view(WaitingListModelView(WaitingListEntry, db.session, category="Scheduling"))
admin.add_view(VisitModelView(Visit, db.session, category="Clinical"))
admin.add_view(MedicamentModelView(Medicament, db.session, category="Pharmacy"))
admin.add_view(PrescriptionModelView(Prescription, db.session, category="Pharmacy"))

# (Optionally, you could hide the standalone PrescriptionModelView, since it’s inlined
#  under Visit. But having it as a top-level view can help to search all prescriptions quickly.)

# ----------------------------------------
# 5) CREATE DATABASE & RUN
# ----------------------------------------
if __name__ == "__main__":
    with app.app_context():
        db.create_all()   # creates tables if they don’t exist
    app.run(debug=True)
