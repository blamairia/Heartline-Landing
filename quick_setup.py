from app import app, db, bcrypt
from models import User, Doctor

print("Starting database setup...")

with app.app_context():
    print("Creating tables...")
    db.create_all()
    print("Tables created!")
    
    user_count = User.query.count()
    print(f"Users in database: {user_count}")
    
    if user_count == 0:
        print("Creating admin user...")
        admin_user = User(
            username='admin',
            email='admin@Heartline.clinic',
            first_name='System',
            last_name='Administrator',
            role='assistant',
            is_active=True
        )
        admin_user.set_password('admin123')
        db.session.add(admin_user)
        db.session.commit()
        print("Admin user created!")
        
    print("Setup complete!")
