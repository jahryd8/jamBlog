import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Heart, Bookmark, Users, Compass } from 'lucide-react';
import FollowingModal from '../components/FollowingModal';

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
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'following'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchFeed = (activeFilter: 'all' | 'following') => {
    setLoading(true);
    fetch(`http://localhost:5000/api/feed?filter=${activeFilter}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setPosts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading feed:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFeed(filter);
  }, [filter]);

  const handleToggleLike = async (postId: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/like`, { method: 'POST' });
      const data = await res.json();

      setPosts((prev) =>
        prev.map((p) => {
          if (p.post_id === postId) {
            const count = parseInt(p.likes_count, 10) || 0;
            return {
              ...p,
              is_liked: data.isLiked,
              likes_count: (data.isLiked ? count + 1 : count - 1).toString(),
            };
          }
          return p;
        })
      );
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleToggleSave = async (postId: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/save`, { method: 'POST' });
      const data = await res.json();

      setPosts((prev) =>
        prev.map((p) => (p.post_id === postId ? { ...p, is_saved: data.isSaved } : p))
      );
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Feed Filters Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-current/10 pb-4">
        <div>
          <h1 className={`font-serif text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-brand-ink'}`}>
            Publication Feed
          </h1>
          <p className="text-xs opacity-60 mt-1">Discover long-form essays and perspectives from authors.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-full text-xs font-semibold border border-current/20 hover:border-brand-terracotta transition"
          >
            Manage Following
          </button>

          <div
            className={`flex items-center gap-1 p-1 rounded-full border ${
              theme === 'dark' ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-black/10'
            }`}
          >
            <button
              onClick={() => setFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition ${
                filter === 'all' ? 'bg-brand-terracotta text-white' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>All Essays</span>
            </button>

            <button
              onClick={() => setFilter('following')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition ${
                filter === 'following' ? 'bg-brand-terracotta text-white' : 'opacity-70 hover:opacity-100'
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
            theme === 'dark' ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-black/10'
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
                theme === 'dark'
                  ? 'bg-[#1E1E1E] border-white/10 text-white'
                  : 'bg-white border-black/10 text-brand-ink'
              }`}
            >
              <div className="flex items-center justify-between text-xs opacity-60 mb-3">
                <Link to={`/author/${post.username}`} className="hover:text-brand-terracotta font-medium transition">
                  By {post.display_name || post.username}
                </Link>
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>

              <h2 className="font-serif text-2xl font-bold mb-3">
                <Link to={`/post/${post.post_id}`} className="hover:text-brand-terracotta transition">
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