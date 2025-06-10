#!/usr/bin/env python3
"""
Setup script to initialize the database and create an admin user.
Run this script once after setting up the authentication system.
"""

from app import app, db, bcrypt
from models import User, Doctor

def setup_database():
    """Initialize the database and create tables."""
    with app.app_context():
        print("Creating database tables...")
        db.create_all()
        print("Database tables created successfully!")

def create_admin_user():
    """Create an initial admin user."""
    with app.app_context():
        # Check if any users exist
        if User.query.first():
            print("Users already exist in the database.")
            return
        
        print("\n=== Creating Admin User ===")
        
        # Create a doctor profile first
        admin_doctor = Doctor(
            first_name="Admin",
            last_name="User",
            specialty="General Medicine",
            phone="000-000-0000",
            email="admin@Heartlineclinic.com",
            bio="System Administrator"
        )
        
        db.session.add(admin_doctor)
        db.session.flush()  # Get the doctor ID
        
        # Create admin user
        admin_user = User(
            username="admin",
            email="admin@Heartlineclinic.com",
            password_hash=bcrypt.generate_password_hash("admin123").decode('utf-8'),
            role="doctor",
            doctor_id=admin_doctor.id
        )
        
        db.session.add(admin_user)
        db.session.commit()
        
        print(f"Admin user created successfully!")
        print(f"Username: admin")
        print(f"Password: admin123")
        print(f"Role: doctor")
        print(f"Email: admin@Heartlineclinic.com")
        print("\n⚠️  Please change the password after first login!")

def create_test_users():
    """Create some test users for demonstration."""
    with app.app_context():
        print("\n=== Creating Test Users ===")
        
        # Create a test doctor
        test_doctor = Doctor(
            first_name="Dr. Sarah",
            last_name="Johnson",
            specialty="Cardiology",
            phone="555-123-4567",
            email="sarah.johnson@Heartlineclinic.com",
            bio="Experienced cardiologist specializing in ECG analysis and heart disease prevention."
        )
        
        db.session.add(test_doctor)
        db.session.flush()
        
        doctor_user = User(
            username="dr.johnson",
            email="sarah.johnson@Heartlineclinic.com",
            password_hash=bcrypt.generate_password_hash("doctor123").decode('utf-8'),
            role="doctor",
            doctor_id=test_doctor.id
        )
        
        # Create a test assistant
        assistant_user = User(
            username="assistant",
            email="assistant@Heartlineclinic.com",
            password_hash=bcrypt.generate_password_hash("assistant123").decode('utf-8'),
            role="assistant"
        )
        
        db.session.add(doctor_user)
        db.session.add(assistant_user)
        db.session.commit()
        
        print("Test users created:")
        print("Doctor - Username: dr.johnson, Password: doctor123")
        print("Assistant - Username: assistant, Password: assistant123")

def main():
    """Main setup function."""
    print("🏥 Heartline Medical Clinic - Authentication Setup")
    print("=" * 50)
    
    # Setup database
    setup_database()
    
    # Create admin user
    create_admin_user()
    
    # Ask if user wants test users
    response = input("\nWould you like to create test users? (y/N): ").strip().lower()
    if response in ['y', 'yes']:
        create_test_users()
    
    print("\n✅ Setup completed successfully!")
    print("\nYou can now start the application with: python app.py")
    print("Navigate to: http://localhost:5000/auth/login")

if __name__ == "__main__":
    main()
