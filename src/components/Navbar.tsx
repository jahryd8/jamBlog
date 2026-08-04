import { Link, useLocation } from 'react-router-dom';
import { PenSquare } from 'lucide-react';
import SearchBar from './SearchBar';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="flex flex-wrap items-center justify-between gap-y-4 max-w-6xl mx-auto px-4 pt-6 pb-6 mb-4 border-b border-current/10 w-full overflow-x-hidden">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center space-x-2">
        <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight hover:text-brand-terracotta transition">
          JamBlog
        </span>
      </Link>

      {/* Search Bar - Hidden on extra small mobile screens, or takes full width on wrap */}
      <div className="order-3 sm:order-2 w-full sm:w-auto flex-1 sm:max-w-xs md:max-w-md mx-0 sm:mx-4">
        <SearchBar />
      </div>

      {/* Navigation Links */}
      <nav className="order-2 sm:order-3 flex items-center space-x-3 sm:space-x-6 text-xs md:text-sm font-semibold uppercase tracking-wider opacity-80">
        <Link 
          to="/" 
          className={`hidden sm:inline-block hover:text-brand-terracotta transition ${isActive('/') ? 'border-b-2 border-brand-terracotta pb-1 opacity-100' : ''}`}
        >
          Dashboard
        </Link>
        <Link 
          to="/feed" 
          className={`hover:text-brand-terracotta transition ${isActive('/feed') ? 'border-b-2 border-brand-terracotta pb-1 opacity-100' : ''}`}
        >
          Feed
        </Link>
        <Link 
          to="/settings" 
          className={`hidden sm:inline-block hover:text-brand-terracotta transition ${isActive('/settings') ? 'border-b-2 border-brand-terracotta pb-1 opacity-100' : ''}`}
        >
          Settings
        </Link>
        <Link 
          to="/create" 
          className="flex items-center gap-1.5 sm:gap-2 bg-brand-terracotta text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-bold hover:bg-brand-terracotta/90 transition shadow-sm whitespace-nowrap"
        >
          <PenSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Write</span>
        </Link>
      </nav>
    </header>
  );
}