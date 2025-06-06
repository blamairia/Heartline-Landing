#!/usr/bin/env python3
"""Test script to check if imports work correctly"""

print("Testing imports...")

try:
    from app import app, db, bcrypt
    print("✓ App imports successful")
except Exception as e:
    print(f"✗ App import failed: {e}")
    exit(1)

try:
    from models import User, Doctor
    print("✓ Models imports successful")
except Exception as e:
    print(f"✗ Models import failed: {e}")
    exit(1)

print("✓ All imports successful!")
