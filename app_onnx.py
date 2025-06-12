# app_onnx.py - ONNX Runtime version without PyTorch dependency
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session, current_app
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from werkzeug.utils import secure_filename
from urllib.parse import urlparse
from functools import wraps
import tempfile
import csv
import os
import numpy as np
import wfdb

from flask_moment import Moment

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

# ONNX Runtime instead of PyTorch
import onnxruntime as ort

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
moment = Moment(app)
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
            # Create ONNX Runtime inference session
            ort_session = ort.InferenceSession(MODEL_PATH)
            print(f"ONNX model loaded successfully from {MODEL_PATH}")
            print(f"Input name: {ort_session.get_inputs()[0].name}")
            print(f"Input shape: {ort_session.get_inputs()[0].shape}")
            print(f"Output name: {ort_session.get_outputs()[0].name}")
            print(f"Output shape: {ort_session.get_outputs()[0].shape}")
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
# ECG PROCESSING HELPER FUNCTION
# ----------------------------------------

def process_ecg_files_for_inference(mat_path, hea_path):
    """
    Process ECG files and prepare data for ONNX inference
    Args:
        mat_path: path to .mat file
        hea_path: path to .hea file
    Returns:
        dict: ECG prediction probabilities
    """
    try:
        # Read ECG data using wfdb
        rec_basename = os.path.splitext(os.path.basename(hea_path))[0]
        rec_dir = os.path.dirname(hea_path)
        record = wfdb.rdrecord(os.path.join(rec_dir, rec_basename))
        sig_all = record.p_signal  # shape [n_samples, n_leads]
        nsteps, nleads = sig_all.shape

        if nsteps >= 15000:
            clipped = sig_all[-15000:, :]
        else:
            clipped = sig_all
        
        buffered = np.zeros((15000, nleads), dtype=np.float32)
        buffered[-clipped.shape[0]:, :] = clipped

        # Transpose for the model: [12, 15000]
        x_np = buffered.T
        
        # Run ONNX inference
        prob_dict = predict_ecg_onnx(x_np)
        
        return prob_dict
        
    except Exception as e:
        raise RuntimeError(f"ECG processing failed: {e}")

# ----------------------------------------
# The rest of your routes remain the same, just replace PyTorch inference
# with calls to process_ecg_files_for_inference() or predict_ecg_onnx()
# ----------------------------------------