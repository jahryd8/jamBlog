import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { PenSquare, BookOpen, Eye, Sparkles, ArrowRight } from 'lucide-react';

interface Post {
  post_id: number;
  title: string;
  excerpt: string;
  display_name: string;
  created_at: string;
}

export default function Dashboard() {
  const { theme } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/posts')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching posts:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* 1. Welcome Header & Quick Action Card */}
      <div className={`p-8 rounded-3xl border transition-all shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
        theme === 'dark' 
          ? 'bg-[#1E1E1E] border-white/10 text-white' 
          : 'bg-white border-black/10 text-brand-ink'
      }`}>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-terracotta text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Author Workspace</span>
          </div>
          <h1 className="font-serif text-3xl font-bold">Welcome back, Author</h1>
          <p className="text-sm opacity-70 max-w-xl">
            Manage your publication, view live essays stored in PostgreSQL, or start drafting a new article with poster generation.
          </p>
        </div>

        <Link
          to="/create"
          className="flex items-center gap-2 bg-brand-terracotta hover:bg-brand-terracotta/90 text-white px-6 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md transition whitespace-nowrap"
        >
          <PenSquare className="w-4 h-4" />
          <span>New Studio Post</span>
        </Link>
      </div>

      {/* 2. Quick Overview Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border ${
          theme === 'dark' ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-black/10'
        }`}>
          <div className="flex items-center gap-3 text-brand-terracotta mb-2">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-bold uppercase">Total Essays</span>
          </div>
          <p className="text-2xl font-bold">{posts.length}</p>
        </div>

        <div className={`p-5 rounded-2xl border ${
          theme === 'dark' ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-black/10'
        }`}>
          <div className="flex items-center gap-3 text-sky-500 mb-2">
            <Eye className="w-5 h-5" />
            <span className="text-xs font-bold uppercase">Database Status</span>
          </div>
          <p className="text-2xl font-bold text-emerald-500 text-sm flex items-center gap-2 mt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            PostgreSQL Connected
          </p>
        </div>

        <div className={`p-5 rounded-2xl border ${
          theme === 'dark' ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-black/10'
        }`}>
          <div className="flex items-center gap-3 text-purple-400 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold uppercase">Active Theme</span>
          </div>
          <p className="text-xl font-bold capitalize">{theme} Mode</p>
        </div>
      </div>

      {/* 3. Recent Essays Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`font-serif text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-brand-ink'}`}>
            Recent Essays
          </h2>
          <Link to="/feed" className="text-xs font-bold text-brand-terracotta hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-12 text-center font-serif text-sm opacity-60">Loading your database records...</div>
        ) : posts.length === 0 ? (
          <div className={`p-12 text-center rounded-3xl border ${
            theme === 'dark' ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-black/10'
          }`}>
            <p className="opacity-60 text-sm">No essays found in PostgreSQL. Click "New Studio Post" to write one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <article 
                key={post.post_id} 
                className={`p-6 rounded-3xl border transition-all shadow-sm ${
                  theme === 'dark'
                    ? 'bg-[#1E1E1E] border-white/10 text-white'
                    : 'bg-white border-black/10 text-brand-ink'
                }`}
              >
                <h3 className="font-serif text-xl font-bold mb-2">
                  <Link to={`/post/${post.post_id}`} className="hover:text-brand-terracotta transition">
                    {post.title}
                  </Link>
                </h3>
                <p className="text-sm opacity-80 mb-6 leading-relaxed">{post.excerpt}</p>
                <div className="text-xs opacity-60 flex justify-between items-center pt-4 border-t border-current/10">
                  <span className="font-medium">By {post.display_name || 'Jaheim Deandre'}</span>
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}