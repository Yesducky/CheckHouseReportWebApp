from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from models import db, Event, Problem, User, House, ChatMessage
from db_utils import init_db
import base64
import os
import secrets
from datetime import datetime
from io import BytesIO
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(16)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lemma_check_house.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db.init_app(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# CORS configuration
CORS(app, supports_credentials=True, origins="*",
     allow_headers=["Content-Type", "Authorization", "Cache-Control"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

FRONTEND_PORT = os.getenv('FRONTEND_PORT', '5174')

@app.after_request
def add_private_network_header(response):
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response


def publish_chat_message(event_url, message_data):
    """Publish a chat message via Socket.IO"""
    try:
        message_data['event_url'] = event_url
        socketio.emit('chat_message', message_data, room=f'chat_{event_url}')
        print(f"Published chat message to room chat_{event_url}")
    except Exception as e:
        print(f"Error publishing chat message: {e}")

# Socket.IO Events
@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    emit('connected', {'status': 'Connected to server'})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')


@socketio.on('join_chat')
def handle_join_chat(data):
    """Join a chat room for real-time chat messages"""
    try:
        event_url = data.get('event_url')
        if event_url:
            join_room(f'chat_{event_url}')
            emit('joined_chat', {'event_url': event_url, 'status': 'Joined chat room'})
            print(f'Client {request.sid} joined chat room: chat_{event_url}')
    except Exception as e:
        print(f"Error joining chat room: {e}")
        emit('error', {'message': str(e)})

@socketio.on('leave_chat')
def handle_leave_chat(data):
    """Leave a chat room"""
    try:
        event_url = data.get('event_url')
        if event_url:
            leave_room(f'chat_{event_url}')
            emit('left_chat', {'event_url': event_url, 'status': 'Left chat room'})
            print(f'Client {request.sid} left chat room: chat_{event_url}')
    except Exception as e:
        print(f"Error leaving chat room: {e}")
        emit('error', {'message': str(e)})

# Event Routes
@app.route('/api/events', methods=['GET'])
def create_event():
    """Create a new event and return the URL to access it"""
    try:
        random_url = base64.urlsafe_b64encode(secrets.token_bytes(16)).decode('utf-8').rstrip('=')
        
        new_event = Event(
            url=random_url,
            house_id=None,
            old_house_id=None,
            flat=None,
            customer_name=None
        )
        
        db.session.add(new_event)
        db.session.commit()

        return jsonify({
            'success': True,
            'event_id': new_event.id,
            'url': random_url
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/events/<int:event_id>/problems', methods=['POST'])
def add_problem(event_id):
    """Add a problem to an event's data list"""
    try:
        event = Event.query.get_or_404(event_id)
        data = request.json
        
        # Create new Problem instance and link to event
        problem = Problem(
            event_id=event.id,
            image=data.get('image', []),
            description=data.get('description', ''),
            important=data.get('important', False),
            category=data.get('category', 'general')
        )
        
        db.session.add(problem)

        # Save system message to database
        system_message = ChatMessage(
            event_id=event.id,
            user='system',
            message='A new problem was added.',
            timestamp=datetime.now()
        )
        db.session.add(system_message)
        db.session.commit()

        # Send system message to chat room
        publish_chat_message(event.url, {
            'user': 'system',
            'message': 'A new problem was added.',
            'timestamp': system_message.timestamp.isoformat(),
            'system': True
        })

        return jsonify({
            'success': True,
            'problem_id': problem.id,
            'event': event.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/events/url/<url>', methods=['GET'])
def get_event_by_url(url):
    """Get event details by URL, including problems list and house info"""
    try:
        event = Event.query.filter_by(url=url).first_or_404()
        event_dict = event.to_dict()

        # Ensure problems are included as a list
        event_dict['problems'] = [problem.to_dict() for problem in event.problems]

        # Add house info if available
        if event.house_id:
            house = House.query.get(event.house_id)
            event_dict['house'] = house.to_dict() if house else None
        else:
            event_dict['house'] = None

        return jsonify({'success': True, 'event': event_dict})
    except Exception as e:
        print(f"Error fetching event by URL: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/events/url/<url>', methods=['PUT'])
def update_event_by_url(url):
    """Update event details by URL, including house_id"""
    try:
        event = Event.query.filter_by(url=url).first_or_404()
        data = request.json

        if 'house_id' in data:
            # Validate house_id exists
            house = House.query.get(data['house_id'])
            if house:
                event.house_id = data['house_id']
            else:
                return jsonify({'success': False, 'error': 'Invalid house_id'}), 400

        if 'old_house_id' in data:
            event.old_house_id = data['old_house_id']
        if 'flat' in data:
            event.flat = data['flat']
        if 'customer_name' in data:
            event.customer_name = data['customer_name']

        # Update problems if provided
        if 'problems' in data:
            for problem in event.problems:
                db.session.delete(problem)
            for p in data['problems']:
                problem = Problem(
                    event_id=event.id,
                    image=p.get('image', []),
                    description=p.get('description', ''),
                    important=p.get('important', False),
                    category=p.get('category', 'general')
                )
                db.session.add(problem)

        db.session.commit()

        # Return updated event with house info
        event_dict = event.to_dict()
        house = None
        if event.house_id:
            house = db.session.get(House, event.house_id)
        event_dict['house'] = house.to_dict() if house else None

        return jsonify({'success': True, 'event': event_dict})
    except Exception as e:
        db.session.rollback()
        print(f"Error updating event by URL: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/events/url/<url>/problems', methods=['POST'])
def add_problem_by_url(url):
    """Add a problem to an event's problems table using URL"""
    try:
        event = Event.query.filter_by(url=url).first_or_404()
        data = request.json

        # Create new Problem instance and link to event
        problem = Problem(
            event_id=event.id,
            image=data.get('image', []),
            description=data.get('description', ''),
            important=data.get('important', False),
            category=data.get('category', '其它問題')
        )
        db.session.add(problem)

        # Save system message to database
        system_message = ChatMessage(
            event_id=event.id,
            user='System',
            message='A new problem \"' + data.get('description', '') + "\" was added",
            timestamp=datetime.now()
        )
        db.session.add(system_message)
        db.session.commit()

        # Send system message to chat room
        publish_chat_message(url, {
            'user': 'System',
            'message': 'A new problem \"' + data.get('description', '') + "\" was added",
            'timestamp': system_message.timestamp.isoformat(),
            'system': True
        })

        return jsonify({
            'success': True,
            'problem_id': problem.id,
            'event': event.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/events/<url>/report', methods=['GET'])
def generate_report(url):
    """Generate and download Word document report for the event"""
    try:
        event = Event.query.filter_by(url=url).first_or_404()
        
        # Import here to avoid circular imports
        from report_generator import generate_event_report
        
        # Generate the report
        report_bytes = generate_event_report(url)
        
        if report_bytes is None:
            return jsonify({'success': False, 'error': 'Event not found'}), 404
        
        # Create filename
        filename = f"查驗報告_{event.url}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"
        
        # Return the file as a downloadable attachment
        return send_file(
            BytesIO(report_bytes),
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            as_attachment=True,
            download_name=filename
        )
        
    except Exception as e:
        print(f"Error generating report: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/houses', methods=['GET'])
def get_all_houses():
    """Get all houses"""
    try:
        houses = House.query.all()
        return jsonify({'success': True, 'houses': [house.to_dict() for house in houses]})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Chat Routes
@app.route('/api/events/url/<url>/chat/messages', methods=['GET'])
def get_chat_messages(url):
    """Get all chat messages for an event"""
    try:
        event = Event.query.filter_by(url=url).first_or_404()
        messages = ChatMessage.query.filter_by(event_id=event.id).order_by(ChatMessage.timestamp.asc()).all()
        return jsonify({
            'success': True,
            'messages': [msg.to_dict() for msg in messages]
        })
    except Exception as e:
        print(e)
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/events/url/<url>/chat/messages', methods=['POST'])
def send_chat_message(url):
    """Send a chat message for an event"""
    try:
        event = Event.query.filter_by(url=url).first_or_404()
        data = request.json

        # Handle both sender_name/content and user/message field formats
        user_name = data.get('user', 'Anonymous')
        message_content = data.get('content') or data.get('message', '')

        message = ChatMessage(
            event_id=event.id,
            user=user_name,
            message=message_content,
            timestamp=datetime.now()
        )

        db.session.add(message)
        db.session.commit()

        # Publish chat message via Socket.IO
        message_data = message.to_dict()
        publish_chat_message(url, message_data)

        return jsonify({
            'success': True,
            'message': message_data
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error sending chat message: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


# Health Check
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'success': True, 'status': 'healthy', 'timestamp': datetime.now().isoformat()})

# Initialize database when app starts
def create_tables():
    with app.app_context():
        init_db()

if __name__ == '__main__':
    create_tables()
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)
