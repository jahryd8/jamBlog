import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PostView from './pages/PostView';

export default function App() {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-ink">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/post/:id" element={<PostView />} />
          <Route path="/feed" element={<div className="text-center py-20 font-serif text-2xl">Feed View (Coming Next)</div>} />
          <Route path="/create" element={<div className="text-center py-20 font-serif text-2xl">Create Studio View (Coming Next)</div>} />
          <Route path="/settings" element={<div className="text-center py-20 font-serif text-2xl">Settings View (Coming Next)</div>} />
        </Routes>
      </main>
    </div>
  );
}