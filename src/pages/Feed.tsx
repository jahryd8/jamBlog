import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Heart, Bookmark, Users, Compass } from 'lucide-react';
import FollowingModal from '../components/FollowingModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface FeedPost {
  post_id: number;
  title: string;
  excerpt: string;
  username: string;
  display_name: string;
  created_at: string;
  likes_count: string;
  is_liked: boolean;
  is_saved: boolean;
}

export default function Feed() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'following'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

  const fetchFeed = async (activeFilter: 'all' | 'following') => {
    setLoading(true);
    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const res = await fetch(`${API_BASE}/feed?filter=${activeFilter}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setPosts(data);
      }
    } catch (err) {
      console.error('Error loading feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed(filter);
  }, [filter]);

  const handleToggleLike = async (postId: number) => {
    const token = getAuthToken();

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.post_id === postId) {
          const currentCount = parseInt(p.likes_count, 10) || 0;
          const nextLiked = !p.is_liked;
          return {
            ...p,
            is_liked: nextLiked,
            likes_count: (nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1)).toString(),
          };
        }
        return p;
      })
    );

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        console.error(`Failed to like post: ${res.status}`);
        // Revert on failure
        fetchFeed(filter);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
      fetchFeed(filter);
    }
  };

  const handleToggleSave = async (postId: number) => {
    const token = getAuthToken();

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => (p.post_id === postId ? { ...p, is_saved: !p.is_saved } : p))
    );

    try {
      // Endpoint updated to /bookmark (or /save fallback)
      const res = await fetch(`${API_BASE}/posts/${postId}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        // Fallback check if server routes it under /save
        const fallbackRes = await fetch(`${API_BASE}/posts/${postId}/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!fallbackRes.ok) {
          console.error(`Failed to save post: ${res.status}`);
          fetchFeed(filter);
        }
      }
    } catch (err) {
      console.error('Failed to toggle save:', err);
      fetchFeed(filter);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Feed Filters Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-current/10 pb-4">
        <div>
          <h1 className={`font-serif text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Publication Feed
          </h1>
          <p className="text-xs opacity-60 mt-1">Discover long-form essays and perspectives from authors.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-full text-xs font-semibold border border-current/20 hover:border-orange-500 transition"
          >
            Manage Following
          </button>

          <div
            className={`flex items-center gap-1 p-1 rounded-full border ${
              isDark ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-black/10'
            }`}
          >
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition ${
                filter === 'all' ? 'bg-orange-600 text-white' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>All Essays</span>
            </button>

            <button
              onClick={() => setFilter('following')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition ${
                filter === 'following' ? 'bg-orange-600 text-white' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Following</span>
            </button>
          </div>
        </div>
      </div>

      {/* Posts Feed Grid */}
      {loading ? (
        <div className="p-12 text-center font-serif text-sm opacity-60">Loading publication feed...</div>
      ) : posts.length === 0 ? (
        <div
          className={`p-12 text-center rounded-3xl border ${
            isDark ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-black/10'
          }`}
        >
          <p className="opacity-60 text-sm">
            {filter === 'following'
              ? 'No posts from authors you follow yet. Check out "All Essays" or follow more authors!'
              : 'No public essays found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.post_id}
              className={`p-6 sm:p-8 rounded-3xl border transition-all shadow-sm ${
                isDark
                  ? 'bg-[#1E1E1E] border-white/10 text-white'
                  : 'bg-white border-black/10 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between text-xs opacity-60 mb-3">
                <Link to={`/author/${post.username}`} className="hover:text-orange-500 font-medium transition">
                  By {post.display_name || post.username}
                </Link>
                <span>{formatDate(post.created_at)}</span>
              </div>

              <h2 className="font-serif text-2xl font-bold mb-3">
                <Link to={`/post/${post.post_id}`} className="hover:text-orange-500 transition">
                  {post.title}
                </Link>
              </h2>

              <p className="text-sm opacity-80 leading-relaxed mb-6">{post.excerpt}</p>

              {/* Interactive Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-current/10 text-xs">
                <button
                  onClick={() => handleToggleLike(post.post_id)}
                  className={`flex items-center gap-1.5 transition ${
                    post.is_liked ? 'text-rose-500 font-bold' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.is_liked ? 'fill-rose-500' : ''}`} />
                  <span>{post.likes_count} Likes</span>
                </button>

                <button
                  onClick={() => handleToggleSave(post.post_id)}
                  className={`flex items-center gap-1.5 transition ${
                    post.is_saved ? 'text-amber-500 font-bold' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${post.is_saved ? 'fill-amber-500' : ''}`} />
                  <span>{post.is_saved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Following Modal */}
      <FollowingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}