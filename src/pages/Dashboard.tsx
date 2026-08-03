import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  Heart, 
  Bookmark, 
  FileText, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Compass, 
  MessageSquare,
  Edit3
} from 'lucide-react';

interface MyPost {
  post_id: number;
  title: string;
  excerpt: string;
  is_private: boolean;
  created_at: string;
  likes_count?: string;
  comments_count?: string;
}

interface SavedPost {
  post_id: number;
  title: string;
  excerpt: string;
  created_at: string;
  username: string;
  display_name: string;
}

interface LikedPost {
  post_id: number;
  title: string;
  excerpt: string;
  created_at: string;
  username: string;
  display_name: string;
}

export default function Dashboard() {
  const { theme } = useTheme();

  // State
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [likedPosts, setLikedPosts] = useState<LikedPost[]>([]);
  const [totalLikesReceived, setTotalLikesReceived] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-posts' | 'bookmarks' | 'liked-posts'>('my-posts');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch User's Own Posts
      const postsRes = await fetch('http://localhost:5000/api/posts/my-posts');
      const postsData = await postsRes.json();
      if (Array.isArray(postsData)) setMyPosts(postsData);

      // 2. Fetch Dashboard Stats (Likes Received, Saved Bookmarks, & Liked Posts)
      const statsRes = await fetch('http://localhost:5000/api/dashboard/stats');
      const statsData = await statsRes.json();
      
      setTotalLikesReceived(statsData.totalLikesReceived || 0);
      setSavedPosts(statsData.savedPosts || []);
      setLikedPosts(statsData.likedPosts || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Visibility (Public / Private)
  const handleTogglePrivate = async (postId: number, currentPrivateStatus: boolean) => {
    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_private: !currentPrivateStatus }),
      });
      if (res.ok) {
        setMyPosts((prev) =>
          prev.map((post) =>
            post.post_id === postId ? { ...post, is_private: !currentPrivateStatus } : post
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle post visibility:', err);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('Are you sure you want to delete this essay?')) return;

    try {
      const res = await fetch(`http://localhost:5000/api/posts/${postId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMyPosts((prev) => prev.filter((post) => post.post_id !== postId));
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`font-serif text-3xl sm:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-brand-ink'}`}>
            Author Dashboard
          </h1>
          <p className="text-xs opacity-60 mt-1">Manage your published essays, view engagement, and browse saved posts.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/feed"
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition ${
              theme === 'dark' ? 'border-white/20 hover:bg-white/10' : 'border-black/10 hover:bg-black/5'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Feed</span>
          </Link>

          <Link
            to="/create"
            className="flex items-center gap-2 px-4 py-2 bg-brand-terracotta text-white rounded-full text-xs font-bold transition hover:opacity-90 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Write Essay</span>
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Published Essays Stat */}
        <div
          onClick={() => setActiveTab('my-posts')}
          className={`p-5 rounded-3xl border flex items-center gap-4 cursor-pointer transition hover:border-brand-terracotta/50 ${
            activeTab === 'my-posts' ? 'ring-2 ring-brand-terracotta' : ''
          } ${
            theme === 'dark' ? 'bg-[#1E1E1E] border-white/10 text-white' : 'bg-white border-black/10 text-brand-ink'
          }`}
        >
          <div className="p-3 rounded-2xl bg-brand-terracotta/10 text-brand-terracotta">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-serif">{loading ? '...' : myPosts.length}</div>
            <div className="text-xs opacity-60 font-medium">My Essays</div>
          </div>
        </div>

        {/* Total Likes Received Stat */}
        <div
          className={`p-5 rounded-3xl border flex items-center gap-4 transition ${
            theme === 'dark' ? 'bg-[#1E1E1E] border-white/10 text-white' : 'bg-white border-black/10 text-brand-ink'
          }`}
        >
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
            <Heart className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="text-2xl font-bold font-serif">{loading ? '...' : totalLikesReceived}</div>
            <div className="text-xs opacity-60 font-medium">Likes Received</div>
          </div>
        </div>

        {/* Likes Given Stat */}
        <div
          onClick={() => setActiveTab('liked-posts')}
          className={`p-5 rounded-3xl border flex items-center gap-4 cursor-pointer transition hover:border-rose-500/50 ${
            activeTab === 'liked-posts' ? 'ring-2 ring-rose-500' : ''
          } ${
            theme === 'dark' ? 'bg-[#1E1E1E] border-white/10 text-white' : 'bg-white border-black/10 text-brand-ink'
          }`}
        >
          <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold font-serif">{loading ? '...' : likedPosts.length}</div>
            <div className="text-xs opacity-60 font-medium">Likes Given</div>
          </div>
        </div>

        {/* Saved Bookmarks Stat */}
        <div
          onClick={() => setActiveTab('bookmarks')}
          className={`p-5 rounded-3xl border flex items-center gap-4 cursor-pointer transition hover:border-amber-500/50 ${
            activeTab === 'bookmarks' ? 'ring-2 ring-amber-500' : ''
          } ${
            theme === 'dark' ? 'bg-[#1E1E1E] border-white/10 text-white' : 'bg-white border-black/10 text-brand-ink'
          }`}
        >
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
            <Bookmark className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="text-2xl font-bold font-serif">{loading ? '...' : savedPosts.length}</div>
            <div className="text-xs opacity-60 font-medium">Bookmarks</div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-current/10 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('my-posts')}
          className={`pb-3 transition relative flex items-center gap-2 ${
            activeTab === 'my-posts'
              ? 'text-brand-terracotta border-b-2 border-brand-terracotta'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          <span>My Essays</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-current/10 font-mono">
            {myPosts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('liked-posts')}
          className={`pb-3 transition relative flex items-center gap-2 ${
            activeTab === 'liked-posts'
              ? 'text-brand-terracotta border-b-2 border-brand-terracotta'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          <span>Liked Essays</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-current/10 font-mono">
            {likedPosts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`pb-3 transition relative flex items-center gap-2 ${
            activeTab === 'bookmarks'
              ? 'text-brand-terracotta border-b-2 border-brand-terracotta'
              : 'opacity-60 hover:opacity-100'
          }`}
        >
          <span>Saved Reading List</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-current/10 font-mono">
            {savedPosts.length}
          </span>
        </button>
      </div>

      {/* Tab 1: My Essays Section */}
      {activeTab === 'my-posts' && (
        <section className="space-y-4">
          {loading ? (
            <p className="text-xs opacity-60 text-center py-8 font-serif">Loading your essays...</p>
          ) : myPosts.length === 0 ? (
            <div
              className={`p-10 text-center rounded-3xl border space-y-3 ${
                theme === 'dark' ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-black/10'
              }`}
            >
              <FileText className="w-8 h-8 mx-auto opacity-40 text-brand-terracotta" />
              <p className="text-xs opacity-70">You haven't written any essays yet.</p>
              <Link
                to="/create"
                className="inline-block px-4 py-2 bg-brand-terracotta text-white rounded-full text-xs font-bold"
              >
                Start Writing
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myPosts.map((post) => (
                <article
                  key={post.post_id}
                  className={`p-6 rounded-3xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    theme === 'dark' ? 'bg-[#1E1E1E] border-white/10 text-white' : 'bg-white border-black/10 text-brand-ink'
                  }`}
                >
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2 text-[10px] opacity-60">
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${
                        post.is_private ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {post.is_private ? 'Private Draft' : 'Published'}
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold">
                      <Link to={`/post/${post.post_id}`} className="hover:text-brand-terracotta transition">
                        {post.title}
                      </Link>
                    </h3>

                    <p className="text-xs opacity-75 line-clamp-2 leading-relaxed">{post.excerpt}</p>

                    <div className="flex items-center gap-4 pt-1 text-xs opacity-60">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        {post.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {post.comments_count || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-current/10">
                    <button
                      onClick={() => handleTogglePrivate(post.post_id, post.is_private)}
                      title={post.is_private ? 'Make Public' : 'Make Private'}
                      className={`p-2 rounded-xl border text-xs transition ${
                        theme === 'dark' ? 'border-white/10 hover:bg-white/10' : 'border-black/10 hover:bg-black/5'
                      }`}
                    >
                      {post.is_private ? <Eye className="w-4 h-4 text-emerald-500" /> : <EyeOff className="w-4 h-4 text-amber-500" />}
                    </button>

                    <Link
                      to={`/edit/${post.post_id}`}
                      title="Edit Essay"
                      className={`p-2 rounded-xl border text-xs transition ${
                        theme === 'dark' ? 'border-white/10 hover:bg-white/10' : 'border-black/10 hover:bg-black/5'
                      }`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleDeletePost(post.post_id)}
                      title="Delete Essay"
                      className="p-2 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Liked Essays Section */}
      {activeTab === 'liked-posts' && (
        <section className="space-y-4">
          {likedPosts.length === 0 ? (
            <div
              className={`p-10 text-center rounded-3xl border ${
                theme === 'dark' ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-black/10'
              }`}
            >
              <Heart className="w-8 h-8 mx-auto opacity-40 text-rose-500 mb-2" />
              <p className="text-xs opacity-60">You haven't liked any essays yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {likedPosts.map((post) => (
                <article
                  key={post.post_id}
                  className={`p-6 rounded-3xl border transition shadow-sm space-y-3 ${
                    theme === 'dark' ? 'bg-[#1E1E1E] border-white/10 text-white' : 'bg-white border-black/10 text-brand-ink'
                  }`}
                >
                  <div className="text-[11px] opacity-60">
                    By{' '}
                    <Link to={`/author/${post.username}`} className="hover:text-brand-terracotta font-semibold">
                      {post.display_name || post.username}
                    </Link>
                  </div>

                  <h3 className="font-serif text-lg font-bold">
                    <Link to={`/post/${post.post_id}`} className="hover:text-brand-terracotta transition">
                      {post.title}
                    </Link>
                  </h3>

                  <p className="text-xs opacity-80 line-clamp-2 leading-relaxed">{post.excerpt}</p>

                  <div className="pt-3 border-t border-current/10 text-[10px] opacity-50">
                    Published on {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Saved Reading List Section */}
      {activeTab === 'bookmarks' && (
        <section className="space-y-4">
          {savedPosts.length === 0 ? (
            <div
              className={`p-10 text-center rounded-3xl border ${
                theme === 'dark' ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-black/10'
              }`}
            >
              <Bookmark className="w-8 h-8 mx-auto opacity-40 text-amber-500 mb-2" />
              <p className="text-xs opacity-60">You haven't saved any essays yet!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedPosts.map((post) => (
                <article
                  key={post.post_id}
                  className={`p-6 rounded-3xl border transition shadow-sm space-y-3 ${
                    theme === 'dark' ? 'bg-[#1E1E1E] border-white/10 text-white' : 'bg-white border-black/10 text-brand-ink'
                  }`}
                >
                  <div className="text-[11px] opacity-60">
                    By{' '}
                    <Link to={`/author/${post.username}`} className="hover:text-brand-terracotta font-semibold">
                      {post.display_name || post.username}
                    </Link>
                  </div>

                  <h3 className="font-serif text-lg font-bold">
                    <Link to={`/post/${post.post_id}`} className="hover:text-brand-terracotta transition">
                      {post.title}
                    </Link>
                  </h3>

                  <p className="text-xs opacity-80 line-clamp-2 leading-relaxed">{post.excerpt}</p>

                  <div className="pt-3 border-t border-current/10 text-[10px] opacity-50">
                    Saved on {new Date(post.created_at).toLocaleDateString()}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}