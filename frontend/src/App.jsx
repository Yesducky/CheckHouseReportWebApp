import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import EventEntry from './pages/EventEntry';
import EventSetup from './pages/EventSetup';
import EventDashboard from './pages/EventDashboard';

function AppContent() {

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 w-full h-fit min-h-full mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-primary">
        <Routes>
          <Route path="/" element={<EventEntry />} />
          <Route path="/setup/:eventId" element={<EventSetup />} />
          <Route path="/dashboard/:eventId" element={<EventDashboard />} />
          <Route path="/:url" element={<EventEntry />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
