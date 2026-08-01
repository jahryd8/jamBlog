import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <div className="min-h-screen bg-brand-cream p-6 md:p-12">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/feed" element={<div className="text-center py-20 font-serif text-2xl">Feed Page (Coming Next!)</div>} />
          <Route path="/create" element={<div className="text-center py-20 font-serif text-2xl">Create & Poster Studio (Coming Next!)</div>} />
          <Route path="/settings" element={<div className="text-center py-20 font-serif text-2xl">Settings Page (Coming Next!)</div>} />
        </Routes>
      </main>
    </div>
  );
}