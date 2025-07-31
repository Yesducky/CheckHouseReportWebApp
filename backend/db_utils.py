from models import db, User
from werkzeug.security import generate_password_hash
import os

def init_db():
    """Initialize the database and create admin user if doesn't exist"""
    db.create_all()
    
    # Check if admin user exists
    admin_user = User.query.filter_by(username='admin').first()
    
    if not admin_user:
        admin_password = os.getenv('ADMIN_PASSWORD', 'admin123')
        admin_user = User(
            username='admin',
            password_hash=generate_password_hash(admin_password),
            is_admin=True
        )
        db.session.add(admin_user)
        db.session.commit()
        print("Admin user created successfully")
    else:
        print("Admin user already exists")

if __name__ == '__main__':
    from app import app
    with app.app_context():
        init_db()