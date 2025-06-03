#!/usr/bin/env python3
"""
Minimal test script to identify issues with the main app
"""

try:
    print("Testing imports...")
    import os
    from datetime import datetime
    from flask import Flask
    print("✓ Basic imports successful")
    
    from models import db, Patient
    print("✓ Models import successful")
    
    from resnet import resnet34
    print("✓ ResNet import successful")
    
    import torch
    print("✓ PyTorch import successful")
    
    # Test Flask app creation
    app = Flask(__name__)
    app.config["SECRET_KEY"] = "test"
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///test.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    print("✓ Flask app configuration successful")
    
    db.init_app(app)
    print("✓ Database initialization successful")
    
    with app.app_context():
        db.create_all()
        print("✓ Database table creation successful")
    
    print("All tests passed! The app should work.")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
