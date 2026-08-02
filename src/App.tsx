import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PostView from './pages/PostView';
import CreateStudio from './pages/CreateStudio';
import Settings from './pages/Settings';
import AuthorProfile from './pages/AuthorProfile';
import Feed from './pages/Feed';

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
          <Route path="/feed" element={<Feed />} />
          <Route path="/author/:username" element={<AuthorProfile />} />
        </Routes>
      </main>
    </>
  );
}