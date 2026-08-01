import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PostView from './pages/PostView';
import CreateStudio from './pages/CreateStudio';
import Settings from './pages/Settings';

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/post/:id" element={<PostView />} />
          <Route path="/create" element={<CreateStudio />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/feed" element={<div className="text-center py-20 font-serif text-2xl">Feed View</div>} />
        </Routes>
      </main>
    </>
  );
}