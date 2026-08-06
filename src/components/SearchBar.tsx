import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, BookOpen, X, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface PostResult {
  post_id: number;
  title: string;
  excerpt: string;
  username: string;
  display_name: string;
}

interface AuthorResult {
  user_id: number;
  username: string;
  display_name: string;
  bio: string;
}

export default function SearchBar() {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [authors, setAuthors] = useState<AuthorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setPosts([]);
      setAuthors([]);
      setLoading(false);
      return;
    }

    setLoading(true);

const timer = setTimeout(() => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  
  // Normalize base URL to avoid double /api
  const baseUrl = API_BASE_URL.endsWith('/api') 
    ? API_BASE_URL 
    : `${API_BASE_URL}/api`;

  fetch(`${baseUrl}/search?q=${encodeURIComponent(query)}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      setPosts(data.posts || []);
      setAuthors(data.authors || []);
      setLoading(false);
      setIsOpen(true);
    })
    .catch((err) => {
      console.error('Search error:', err);
      setPosts([]);
      setAuthors([]);
      setLoading(false);
    });
}, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      {/* Input Field */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 opacity-50 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder="Search essays or authors..."
          className={`w-full pl-10 pr-9 py-2 rounded-full text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 transition ${
            theme === 'dark'
              ? 'bg-white/5 border-white/10 text-white placeholder-white/40'
              : 'bg-brand-cream/60 border-brand-ink/10 text-brand-ink placeholder-brand-ink/40'
          }`}
        />
        
        {loading ? (
          <Loader2 className="absolute right-3 w-3.5 h-3.5 animate-spin opacity-50" />
        ) : query ? (
          <button
            onClick={clearSearch}
            className="absolute right-3 p-0.5 rounded-full hover:bg-current/10 opacity-60 hover:opacity-100 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Dropdown Results */}
      {isOpen && query.trim() && (
        <div
          className={`absolute left-0 right-0 mt-2 rounded-2xl border shadow-xl overflow-hidden z-50 transition-all ${
            theme === 'dark'
              ? 'bg-[#1E1E1E] border-white/10 text-white'
              : 'bg-white border-black/10 text-brand-ink'
          }`}
        >
          {posts.length === 0 && authors.length === 0 && !loading ? (
            <div className="p-4 text-center text-xs opacity-60">
              No results found for "{query}"
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-current/10 text-xs">
              {/* Authors Group */}
              {authors.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1 font-bold uppercase tracking-wider text-[10px] opacity-50 flex items-center gap-1.5">
                    <User className="w-3 h-3 text-brand-terracotta" />
                    <span>Authors</span>
                  </div>
                  {authors.map((author) => (
                    <Link
                      key={author.user_id}
                      to={`/author/${author.username}`}
                      onClick={clearSearch}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-current/5 transition"
                    >
                      <div>
                        <div className="font-bold">{author.display_name || author.username}</div>
                        <div className="text-[11px] opacity-60 font-mono">@{author.username}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Essays Group */}
              {posts.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-1 font-bold uppercase tracking-wider text-[10px] opacity-50 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-sky-500" />
                    <span>Essays</span>
                  </div>
                  {posts.map((post) => (
                    <Link
                      key={post.post_id}
                      to={`/post/${post.post_id}`}
                      onClick={clearSearch}
                      className="block p-2.5 rounded-xl hover:bg-current/5 transition space-y-0.5"
                    >
                      <div className="font-bold truncate">{post.title}</div>
                      <div className="text-[11px] opacity-60 truncate">{post.excerpt}</div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}