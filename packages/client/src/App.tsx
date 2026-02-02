import { Routes, Route } from 'react-router-dom';
import { WorkshopList } from './pages/WorkshopList';
import { WorkshopPlayer } from './pages/WorkshopPlayer';
import { AdminDashboard } from './pages/AdminDashboard';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Routes>
        <Route path="/" element={<WorkshopList />} />
        <Route path="/workshop/:workshopId" element={<WorkshopPlayer />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    </div>
  );
}

export default App;
