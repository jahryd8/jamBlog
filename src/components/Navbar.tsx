import { Link, useLocation } from 'react-router-dom';
import { PenSquare } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="flex justify-between items-center max-w-6xl mx-auto px-4 pt-6 pb-6 mb-4 border-b border-current/10">
      <Link to="/" className="flex items-center space-x-2">
        <span className="font-serif text-3xl font-bold tracking-tight hover:text-brand-terracotta transition">
          JamBlog
        </span>
      </Link>
      
      <nav className="flex items-center space-x-6 text-xs md:text-sm font-semibold uppercase tracking-wider opacity-80">
        <Link 
          to="/" 
          className={`hover:text-brand-terracotta transition ${isActive('/') ? 'border-b-2 border-brand-terracotta pb-1 opacity-100' : ''}`}
        >
          Dashboard
        </Link>
        <Link 
           to="/feed" 
           className="hover:text-brand-terracotta transition font-medium text-sm"
        >
            Feed
        </Link>
        <Link 
          to="/settings" 
          className={`hover:text-brand-terracotta transition ${isActive('/settings') ? 'border-b-2 border-brand-terracotta pb-1 opacity-100' : ''}`}
        >
          Settings
        </Link>
        <Link 
          to="/create" 
          className="flex items-center gap-2 bg-brand-terracotta text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-brand-terracotta/90 transition shadow-sm"
        >
          <PenSquare className="w-4 h-4" />
          <span>Write</span>
        </Link>
      </nav>
    </header>
  );
}