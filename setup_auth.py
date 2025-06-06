#!/usr/bin/env python3
"""
Setup script for authentication system
"""

from app import app, db, bcrypt
from models import User, Doctor
import sys

def setup_database():
    """Create database tables"""
    with app.app_context():
        try:
            # Create all tables
            db.create_all()
            print("✓ Database tables created successfully")
            
            # Check if any users exist
            user_count = User.query.count()
            print(f"✓ Current users in database: {user_count}")
            
            if user_count == 0:
                print("No users found. Creating initial admin user...")
                create_admin_user()
            else:
                print("Users already exist in database")
                
        except Exception as e:
            print(f"✗ Error setting up database: {e}")
            return False
    return True

def create_admin_user():
    """Create initial admin user (assistant role for clinic management)"""
    try:
        # Create admin user with assistant role
        admin_user = User(
            username='admin',
            email='admin@hearline.clinic',
            first_name='System',
            last_name='Administrator',
            role='assistant',
            is_active=True
        )
        admin_user.set_password('admin123')  # Default password
        
        db.session.add(admin_user)
        db.session.commit()
        
        print("✓ Admin user created successfully")
        print("  Username: admin")
        print("  Password: admin123")
        print("  Role: assistant")
        print("  Email: admin@hearline.clinic")
        print("  NOTE: Please change the password after first login!")
        
    except Exception as e:
        print(f"✗ Error creating admin user: {e}")
        db.session.rollback()

def create_sample_doctor():
    """Create a sample doctor and doctor user"""
    try:
        # First create a doctor record
        sample_doctor = Doctor(
            first_name='Dr. John',
            last_name='Smith',
            specialty='Cardiology',
            phone='(555) 123-4567',
            email='dr.smith@hearline.clinic',
            bio='Experienced cardiologist specializing in ECG analysis and heart conditions.'
        )
        
        db.session.add(sample_doctor)
        db.session.flush()  # To get the doctor ID
        
        # Create user account for the doctor
        doctor_user = User(
            username='dr.smith',
            email='dr.smith@hearline.clinic',
            first_name='John',
            last_name='Smith',
            role='doctor',
            doctor_id=sample_doctor.id,
            is_active=True
        )
        doctor_user.set_password('doctor123')  # Default password
        
        db.session.add(doctor_user)
        db.session.commit()
        
        print("✓ Sample doctor created successfully")
        print("  Username: dr.smith")
        print("  Password: doctor123")
        print("  Role: doctor")
        print("  Email: dr.smith@hearline.clinic")
        print("  Specialty: Cardiology")
        
    except Exception as e:
        print(f"✗ Error creating sample doctor: {e}")
        db.session.rollback()

def list_users():
    """List all users in the database"""
    try:
        users = User.query.all()
        print(f"\n📋 Users in database ({len(users)} total):")
        for user in users:
            doctor_info = ""
            if user.role == 'doctor' and user.doctor:
                doctor_info = f" (Specialty: {user.doctor.specialty})"
            print(f"  • {user.username} - {user.first_name} {user.last_name} ({user.role}){doctor_info}")
            
    except Exception as e:
        print(f"✗ Error listing users: {e}")

if __name__ == "__main__":
    print("🏥 Setting up Hearline Medical Clinic Authentication System")
    print("=" * 60)
    
    if setup_database():
        print("\n🔐 Creating sample users...")
        
        # Check if we need to create sample users
        with app.app_context():
            if User.query.count() == 1:  # Only admin exists
                print("Creating sample doctor...")
                create_sample_doctor()
        
        print("\n📊 Final status:")
        with app.app_context():
            list_users()
        
        print("\n🚀 Setup complete! You can now:")
        print("  1. Start the application: python app.py")
        print("  2. Navigate to: http://localhost:5000")
        print("  3. Click 'Login' to access the system")
        print("  4. Use the credentials above to login")
        print("  5. Change default passwords after first login!")
