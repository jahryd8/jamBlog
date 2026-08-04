import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import CreateStudio from './pages/CreateStudio';
import Settings from './pages/Settings';
import AuthorProfile from './pages/AuthorProfile';
import Feed from './pages/Feed';
import PostDetail from './pages/PostDetail';
import CosmicBackground from './components/CosmicBackground';

export default function App() {
  return (
    <CosmicBackground>
      <div className="min-h-screen flex flex-col">
        {/* Navigation Header */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/create" element={<CreateStudio />} />
            <Route path="/edit/:id" element={<CreateStudio />} />
            <Route path="/author/:username" element={<AuthorProfile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>

        {/* Application Footer */}
        <Footer />
      </div>
    </CosmicBackground>
  );
}