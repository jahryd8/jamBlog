import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Heart, Bookmark, Users, Compass, Loader2 } from 'lucide-react';
import FollowingModal from '../components/FollowingModal';
import API from '../api/axios';

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

const PAGE_LIMIT = 5;

export default function Feed() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'following'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  // IntersectionObserver reference for detecting bottom of feed
  const observer = useRef<IntersectionObserver | null>(null);

  const lastPostRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // Fetch feed items on filter change or page increment
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    API.get(`/feed?filter=${filter}&page=${page}&limit=${PAGE_LIMIT}`, {
      signal: controller.signal,
    })
      .then((res) => {
        const fetchedPosts: FeedPost[] = Array.isArray(res.data) ? res.data : res.data.posts || [];

        setPosts((prev) => (page === 1 ? fetchedPosts : [...prev, ...fetchedPosts]));
        setHasMore(fetchedPosts.length === PAGE_LIMIT);
        setLoading(false);
        setInitialLoading(false);
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        console.error('Error fetching feed:', err);
        setLoading(false);
        setInitialLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [filter, page]);

  // Handle switching tabs
  const handleFilterChange = (newFilter: 'all' | 'following') => {
    if (newFilter === filter) return;
    setFilter(newFilter);
    setPosts([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
  };

  const handleToggleLike = async (postId: number) => {
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
      await API.post(`/posts/${postId}/like`);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleToggleSave = async (postId: number) => {
    setPosts((prev) =>
      prev.map((p) => (p.post_id === postId ? { ...p, is_saved: !p.is_saved } : p))
    );

    try {
      await API.post(`/posts/${postId}/bookmark`);
    } catch (err) {
      console.error('Failed to toggle save:', err);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header & Controls */}
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
            className="px-3.5 py-2 rounded-full text-xs font-semibold border border-current/20 hover:border-brand-terracotta transition"
          >
            Manage Following
          </button>

          <div
            className={`flex items-center gap-1 p-1 rounded-full border ${
              isDark ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-black/10'
            }`}
          >
            <button
              onClick={() => handleFilterChange('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition ${
                filter === 'all' ? 'bg-brand-terracotta text-white' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>All Essays</span>
            </button>

            <button
              onClick={() => handleFilterChange('following')}
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

      {/* Feed Stream */}
      {initialLoading ? (
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
          {posts.map((post, index) => {
            const isLastPost = posts.length === index + 1;

            return (
              <article
                key={post.post_id}
                ref={isLastPost ? lastPostRef : null}
                className={`p-6 sm:p-8 rounded-3xl border transition-all shadow-sm ${
                  isDark
                    ? 'bg-[#1E1E1E] border-white/10 text-white'
                    : 'bg-white border-black/10 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between text-xs opacity-60 mb-3">
                  <Link
                    to={`/author/${post.username}`}
                    className="hover:text-brand-terracotta font-medium transition"
                  >
                    By {post.display_name || post.username}
                  </Link>
                  <span>{formatDate(post.created_at)}</span>
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
            );
          })}
        </div>
      )}

      {/* Infinite Scroll Spinner / End State */}
      {loading && !initialLoading && (
        <div className="flex items-center justify-center gap-2 py-6 opacity-60 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-brand-terracotta" />
          <span>Fetching more essays...</span>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center py-6 text-xs opacity-40 font-mono">
          You've reached the end of the publication feed.
        </p>
      )}

      {/* Following Modal */}
      <FollowingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={currentUser?.user_id}
      />
    </div>
  );
}