import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PostView from './pages/PostView';
import CreateStudio from './pages/CreateStudio';

export default function App() {
  return (
    <div className="min-h-screen bg-brand-cream text-brand-ink">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/post/:id" element={<PostView />} />
          <Route path="/create" element={<CreateStudio />} />
          <Route path="/feed" element={<div className="text-center py-20 font-serif text-2xl">Feed View</div>} />
          <Route path="/settings" element={<div className="text-center py-20 font-serif text-2xl">Settings View</div>} />
        </Routes>
      </main>
    </div>
  );
}