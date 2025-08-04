from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, Text, Boolean, JSON, DateTime
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    is_admin = Column(Boolean, default=False)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Problem(db.Model):
    __tablename__ = 'problems'

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, db.ForeignKey('events.id'), nullable=False)
    image = Column(JSON, nullable=True)  # List of byte string images
    description = Column(Text, nullable=True)
    important = Column(Boolean, default=False)
    category = Column(String(100), default='general')
    created_at = Column(DateTime, default=datetime.utcnow)

    event = db.relationship('Event', back_populates='problems')

    def to_dict(self):
        return {
            'id': self.id,
            'event_id': self.event_id,
            'image': self.image or [],
            'description': self.description,
            'important': self.important,
            'category': self.category,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class House(db.Model):
    __tablename__ = 'houses'

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    can_buy = Column(Boolean, default=False)

    events = db.relationship('Event', back_populates='house')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'can_buy': self.can_buy
        }

class Event(db.Model):
    __tablename__ = 'events'
    
    id = Column(Integer, primary_key=True)
    url = Column(String(255), unique=True, nullable=False)
    house_id = Column(Integer, db.ForeignKey('houses.id'), nullable=True)
    old_house_id = Column(String(100), nullable=True)
    flat = Column(String(100), nullable=True)
    customer_name = Column(String(200), nullable=True)
    problems = db.relationship('Problem', back_populates='event', cascade='all, delete-orphan')
    house = db.relationship('House', back_populates='events')

    def to_dict(self):
        return {
            'id': self.id,
            'url': self.url,
            'house_id': self.house_id,
            'old_house_id': self.old_house_id,
            'flat': self.flat,
            'customer_name': self.customer_name,
            'house': self.house.to_dict() if self.house else None,
            'problems': [problem.to_dict() for problem in self.problems]
        }
    
    def __repr__(self):
        return f'<Event {self.id}>'

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'
    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, db.ForeignKey('events.id'), nullable=False)
    user = Column(String(80), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'event_id': self.event_id,
            'user': self.user,
            'message': self.message,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
