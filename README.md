# Lemma Check House

A comprehensive house inspection management system with React frontend and Flask backend.

## Features

- **Event Management**: Create and manage inspection events
- **Problem Tracking**: Add problems with descriptions, categories, and images
- **User-Friendly Interface**: Clean, responsive design with animations
- **URL-based Access**: Access events via unique URLs
- **Dashboard View**: Card-based problem display with filtering

## Tech Stack

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - ORM for database management
- **SQLite** - Database
- **Flask-CORS** - Cross-origin resource sharing

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Material-UI** - Component library with icons
- **Framer Motion** - Animation library
- **React Router** - Client-side routing

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the application:
   ```bash
   python app.py
   ```

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will start on `http://localhost:5173`

## Usage

1. **Create Event**: Click "Create New Event" on the home page
2. **Setup Event**: Fill in house details (House ID, Old House ID, Flat, Customer Name)
3. **Add Problems**: Use the dashboard to add inspection problems
4. **Access Events**: Use event ID or direct URL to access existing events

## API Endpoints

- `POST /api/events` - Create new event
- `GET /api/events/<event_id>` - Get event details
- `GET /api/events/url/<url>` - Get event by URL
- `PUT /api/events/<event_id>` - Update event details
- `POST /api/events/<event_id>/problems` - Add problem to event

## Database Schema

### Events Table
- `id` - Primary key
- `url` - Unique URL identifier
- `house_id` - House identifier
- `old_house_id` - Previous house identifier
- `flat` - Flat/apartment number
- `customer_name` - Customer name
- `data` - JSON array of problems

### Problems Structure
- `id` - Problem identifier (auto-increment)
- `description` - Problem description
- `category` - Problem category
- `important` - Priority flag
- `image` - Array of image data (byte arrays)

## Development

### Backend Development
- Database models in `models.py`
- API endpoints in `app.py`
- Database initialization in `db_utils.py`

### Frontend Development
- Pages: EventEntry, EventSetup, EventDashboard
- Components: Layout, reusable UI components
- API utilities in `utils/api.js`

## Environment Variables

### Backend (.env)
- `ADMIN_PASSWORD` - Admin user password (default: admin123)

### Frontend (.env)
- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:5000/api)