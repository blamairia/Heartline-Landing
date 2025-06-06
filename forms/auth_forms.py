# auth_forms.py

from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SelectField, SubmitField, BooleanField
from wtforms.validators import DataRequired, Length, Email, EqualTo, ValidationError
from models import User, Doctor


class LoginForm(FlaskForm):
    """Login form for user authentication"""
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=80)])
    password = PasswordField('Password', validators=[DataRequired()])
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In')


class RegistrationForm(FlaskForm):
    """Registration form for creating new users"""
    username = StringField('Username', validators=[
        DataRequired(), 
        Length(min=4, max=80, message='Username must be between 4 and 80 characters')
    ])
    email = StringField('Email', validators=[DataRequired(), Email()])
    first_name = StringField('First Name', validators=[DataRequired(), Length(max=50)])
    last_name = StringField('Last Name', validators=[DataRequired(), Length(max=50)])
    phone = StringField('Phone', validators=[Length(max=20)])
    role = SelectField('Role', choices=[
        ('assistant', 'Assistant'),
        ('doctor', 'Doctor')
    ], validators=[DataRequired()])
    doctor_id = SelectField('Link to Doctor Profile (Doctor Role Only)', 
                           choices=[], coerce=int, validators=[])
    password = PasswordField('Password', validators=[
        DataRequired(),
        Length(min=6, message='Password must be at least 6 characters long')
    ])
    password_confirm = PasswordField('Confirm Password', validators=[
        DataRequired(),
        EqualTo('password', message='Passwords must match')
    ])
    submit = SubmitField('Register')
    
    def __init__(self, *args, **kwargs):
        super(RegistrationForm, self).__init__(*args, **kwargs)
        # Populate doctor choices
        self.doctor_id.choices = [(0, 'Create New Doctor Profile')] + [
            (d.id, f"Dr. {d.first_name} {d.last_name} - {d.specialty}") 
            for d in Doctor.query.filter(~Doctor.id.in_(
                User.query.filter(User.doctor_id.isnot(None)).with_entities(User.doctor_id)
            )).all()
        ]
    
    def validate_username(self, username):
        """Check if username is already taken"""
        user = User.query.filter_by(username=username.data).first()
        if user:
            raise ValidationError('Username already exists. Please choose a different one.')
    
    def validate_email(self, email):
        """Check if email is already registered"""
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('Email already registered. Please choose a different one.')
    
    def validate_doctor_id(self, doctor_id):
        """Validate doctor selection for doctor role"""
        if self.role.data == 'doctor' and doctor_id.data != 0:
            # Check if doctor is already linked to a user
            existing_user = User.query.filter_by(doctor_id=doctor_id.data).first()
            if existing_user:
                raise ValidationError('This doctor profile is already linked to a user account.')


class ChangePasswordForm(FlaskForm):
    """Form for changing user password"""
    current_password = PasswordField('Current Password', validators=[DataRequired()])
    new_password = PasswordField('New Password', validators=[
        DataRequired(),
        Length(min=6, message='Password must be at least 6 characters long')
    ])
    confirm_password = PasswordField('Confirm New Password', validators=[
        DataRequired(),
        EqualTo('new_password', message='Passwords must match')
    ])
    submit = SubmitField('Change Password')


class ProfileEditForm(FlaskForm):
    """Form for editing user profile"""
    first_name = StringField('First Name', validators=[DataRequired(), Length(max=50)])
    last_name = StringField('Last Name', validators=[DataRequired(), Length(max=50)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    phone = StringField('Phone', validators=[Length(max=20)])
    submit = SubmitField('Update Profile')
    
    def __init__(self, user, *args, **kwargs):
        super(ProfileEditForm, self).__init__(*args, **kwargs)
        self.user = user
    
    def validate_email(self, email):
        """Check if email is already registered by another user"""
        if email.data != self.user.email:
            user = User.query.filter_by(email=email.data).first()
            if user:
                raise ValidationError('Email already registered. Please choose a different one.')


class UserManagementForm(FlaskForm):
    """Form for admin user management"""
    is_active = BooleanField('Active User')
    role = SelectField('Role', choices=[
        ('assistant', 'Assistant'),
        ('doctor', 'Doctor')
    ], validators=[DataRequired()])
    submit = SubmitField('Update User')
