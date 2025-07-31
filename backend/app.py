from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS, cross_origin
from models import db, Event, Problem, User, House
from db_utils import init_db
import base64
import os
import secrets
from datetime import datetime
from io import BytesIO

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lemma_check_house.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
CORS(app, supports_credentials=True, origins="*", allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

FRONTEND_PORT = os.getenv('FRONTEND_PORT', '5174')

@app.after_request
def add_private_network_header(response):
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response

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
        
        problem_id = len(event.data) + 1
        
        new_problem = Problem(
            id=problem_id,
            image=data.get('image', []),
            description=data.get('description', ''),
            important=data.get('important', False),
            category=data.get('category', 'general')
        )
        
        event.data.append(new_problem.to_dict())
        
        db.session.commit()
        push_sse_event(str(event_id))

        return jsonify({
            'success': True,
            'problem_id': problem_id,
            'event': event.to_dict()
        }, 201)

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
        house = None
        if 'house_id' in data:
            # Validate house_id exists
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
        db.session.commit()
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

# Global dict to hold queues for each event
sse_event_queues = {}

def push_sse_event(event_id):
    if event_id not in sse_event_queues:
        return
    for q in sse_event_queues[event_id]:
        q.put('update')

@app.route('/api/events/<event_id>/sse')
def sse_event(event_id):
    def event_stream(q):
        while True:
            msg = q.get()
            yield f'data: {msg}\n\n'
    # Create a queue for this client
    q = queue.Queue()
    if event_id not in sse_event_queues:
        sse_event_queues[event_id] = []
    sse_event_queues[event_id].append(q)
    # Remove queue on disconnect
    def remove_queue():
        sse_event_queues[event_id].remove(q)
    threading.Thread(target=lambda: (q.join(), remove_queue()), daemon=True).start()
    return Response(event_stream(q), mimetype='text/event-stream')


if __name__ == '__main__':
    with app.app_context():
        init_db()
    app.run(debug=True, port=5000, host='0.0.0.0')
