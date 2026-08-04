import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import CreateStudio from './pages/CreateStudio';
import Settings from './pages/Settings';
import AuthorProfile from './pages/AuthorProfile';
import Feed from './pages/Feed';
import PostDetail from './pages/PostDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import CosmicBackground from './components/CosmicBackground';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <CosmicBackground>
      <div className="min-h-screen flex flex-col">
        {/* Navigation Header */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/author/:username" element={<AuthorProfile />} />

            {/* Protected Routes (Authenticated Users Only) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/create" element={<CreateStudio />} />
              <Route path="/edit/:id" element={<CreateStudio />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Fallback Catch-all Route */}
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Routes>
        </main>

        {/* Application Footer */}
        <Footer />
      </div>
    </CosmicBackground>
  );
}