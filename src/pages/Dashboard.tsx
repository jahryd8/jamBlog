import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  Heart, 
  Bookmark, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Compass, 
  MessageSquare,
  Edit3,
  X,
  CheckCircle2,
  Info,
  FileEdit,
  Globe
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface MyPost {
  post_id: number;
  title: string;
  excerpt: string;
  is_private: boolean;
  created_at: string;
  likes_count?: string | number;
  comments_count?: string | number;
}

interface SavedPost {
  post_id: number;
  title: string;
  excerpt: string;
  created_at: string;
  username: string;
  display_name: string;
}

export default function Dashboard() {
  const { theme } = useTheme();
  const location = useLocation();
  const isDark = theme === 'dark';

  // Toast / Feedback banner state passed via react-router-dom
  const [toastMessage, setToastMessage] = useState<string | null>(
    location.state?.message || null
  );

  // State
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [totalLikes, setTotalLikes] = useState<number>(0);
  const [totalLikesGiven, setTotalLikesGiven] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Tabs: 'published' | 'drafts' | 'bookmarks'
  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'bookmarks'>('published');

  // Track which post ID is currently confirming deletion
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Auto-dismiss feedback message after 4 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchDashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      // 1. Fetch User's Own Posts
      const postsRes = await fetch(`${API_BASE}/posts/my-posts`, { headers });
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        if (Array.isArray(postsData)) setMyPosts(postsData);
      }

      // 2. Fetch Dashboard Stats
      const statsRes = await fetch(`${API_BASE}/dashboard/stats`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setTotalLikes(statsData.totalLikesReceived || 0);
        setTotalLikesGiven(statsData.totalLikesGiven || 0);
        setSavedPosts(statsData.savedPosts || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle Visibility / Publish Draft
  const handleTogglePrivate = async (postId: number, currentPrivateStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/posts/${postId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_private: !currentPrivateStatus }),
      });

      if (res.ok) {
        setMyPosts((prev) =>
          prev.map((post) =>
            post.post_id === postId ? { ...post, is_private: !currentPrivateStatus } : post
          )
        );
        setToastMessage(currentPrivateStatus ? 'Draft published to feed!' : 'Essay moved to private drafts.');
      }
    } catch (err) {
      console.error('Failed to toggle post visibility:', err);
    }
  };

  // Inline Delete Post
  const confirmDeletePost = async (postId: number) => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });

      if (res.ok) {
        setMyPosts((prev) => prev.filter((post) => post.post_id !== postId));
        setDeletingPostId(null);
        setToastMessage('Essay deleted successfully.');
      }
    } catch (err) {
      console.error('Failed to delete post:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered post arrays
  const publishedPosts = myPosts.filter((post) => !post.is_private);
  const draftPosts = myPosts.filter((post) => post.is_private);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString();
  };

  return (
    <div className={`min-h-screen rounded-3xl transition-colors duration-200 ${
      isDark ? 'bg-[#121212] text-slate-100' : 'bg-[#FBF9F5] text-slate-900'
    }`}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Toast Feedback Notification Banner */}
        {toastMessage && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border transition-all animate-fade-in ${
            toastMessage.toLowerCase().includes('cancel') || toastMessage.toLowerCase().includes('moved')
              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
          }`}>
            <div className="flex items-center gap-2">
              {toastMessage.toLowerCase().includes('cancel') ? (
                <Info className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{toastMessage}</span>
            </div>
            <button 
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg hover:bg-current/10 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className={`font-serif text-3xl sm:text-4xl font-bold ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Author Dashboard
            </h1>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Manage your drafts, published essays, and saved bookmarks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/feed"
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition ${
                isDark 
                  ? 'border-white/20 hover:bg-white/10 text-white' 
                  : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Feed</span>
            </Link>

            <Link
              to="/create"
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Write Essay</span>
            </Link>
          </div>
        </div>

        {/* Overview Stat Cards (5 Cards - Balanced on Desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          
          {/* 1. Published Essays */}
          <div
            onClick={() => setActiveTab('published')}
            className={`p-5 rounded-3xl border flex items-center gap-4 cursor-pointer transition ${
              activeTab === 'published' ? 'ring-2 ring-orange-500/50' : ''
            } ${
              isDark 
                ? 'bg-[#1E1E1E] border-white/10 text-white hover:border-white/30' 
                : 'bg-white border-slate-200 text-slate-900 hover:border-slate-400 shadow-sm'
            }`}
          >
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-serif">{loading ? '...' : publishedPosts.length}</div>
              <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Published</div>
            </div>
          </div>

          {/* 2. Private Drafts */}
          <div
            onClick={() => setActiveTab('drafts')}
            className={`p-5 rounded-3xl border flex items-center gap-4 cursor-pointer transition ${
              activeTab === 'drafts' ? 'ring-2 ring-amber-500/50' : ''
            } ${
              isDark 
                ? 'bg-[#1E1E1E] border-white/10 text-white hover:border-white/30' 
                : 'bg-white border-slate-200 text-slate-900 hover:border-slate-400 shadow-sm'
            }`}
          >
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-serif">{loading ? '...' : draftPosts.length}</div>
              <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Drafts</div>
            </div>
          </div>

          {/* 3. Likes Received */}
          <div
            className={`p-5 rounded-3xl border flex items-center gap-4 transition ${
              isDark 
                ? 'bg-[#1E1E1E] border-white/10 text-white' 
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-bold font-serif">{loading ? '...' : totalLikes}</div>
              <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Likes</div>
            </div>
          </div>

          {/* 4. Likes Given */}
          <div 
            className={`p-5 rounded-3xl border flex items-center gap-4 transition ${
              isDark 
                ? 'bg-[#1E1E1E] border-white/10 text-white' 
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-serif">{loading ? '...' : totalLikesGiven}</div>
              <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Likes Given</div>
            </div>
          </div>

          {/* 5. Bookmarks */}
          <div
            onClick={() => setActiveTab('bookmarks')}
            className={`p-5 rounded-3xl border flex items-center gap-4 cursor-pointer transition ${
              activeTab === 'bookmarks' ? 'ring-2 ring-sky-500/50' : ''
            } ${
              isDark 
                ? 'bg-[#1E1E1E] border-white/10 text-white hover:border-white/30' 
                : 'bg-white border-slate-200 text-slate-900 hover:border-slate-400 shadow-sm'
            }`}
          >
            <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-500">
              <Bookmark className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-2xl font-bold font-serif">{loading ? '...' : savedPosts.length}</div>
              <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Bookmarks</div>
            </div>
          </div>

        </div>

        {/* Tabs Header */}
        <div className={`flex border-b gap-6 text-sm font-semibold ${
          isDark ? 'border-white/10' : 'border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('published')}
            className={`pb-3 transition relative flex items-center gap-2 ${
              activeTab === 'published'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Published Essays</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono ${
              isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {publishedPosts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('drafts')}
            className={`pb-3 transition relative flex items-center gap-2 ${
              activeTab === 'drafts'
                ? 'text-amber-500 border-b-2 border-amber-500'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Drafts</span>
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-500 font-mono">
              {draftPosts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`pb-3 transition relative flex items-center gap-2 ${
              activeTab === 'bookmarks'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>Bookmarks</span>
            <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono ${
              isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'
            }`}>
              {savedPosts.length}
            </span>
          </button>
        </div>

        {/* Tab 1: Published Essays */}
        {activeTab === 'published' && (
          <section className="space-y-4">
            {loading ? (
              <p className={`text-xs text-center py-8 font-serif ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Loading essays...
              </p>
            ) : publishedPosts.length === 0 ? (
              <div className={`p-10 text-center rounded-3xl border space-y-3 ${
                isDark ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <Globe className="w-8 h-8 mx-auto text-orange-500 opacity-60" />
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  You haven't published any essays publicly yet.
                </p>
                <Link
                  to="/create"
                  className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xs font-bold transition"
                >
                  Write an Essay
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {publishedPosts.map((post) => (
                  <article
                    key={post.post_id}
                    className={`p-6 rounded-3xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isDark 
                        ? 'bg-[#1E1E1E] border-white/10 text-white' 
                        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                    }`}
                  >
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                          {formatDate(post.created_at)}
                        </span>
                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
                        <span className="px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Published
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-bold">
                        <Link 
                          to={`/post/${post.post_id}`} 
                          className={`transition ${isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}`}
                        >
                          {post.title}
                        </Link>
                      </h3>

                      <p className={`text-xs line-clamp-2 leading-relaxed ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {post.excerpt}
                      </p>

                      <div className={`flex items-center gap-4 pt-1 text-xs ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
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

                    {/* Actions */}
                    <div className={`flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-0 ${
                      isDark ? 'border-white/10' : 'border-slate-100'
                    }`}>
                      {deletingPostId === post.post_id ? (
                        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 p-1.5 rounded-2xl animate-fade-in">
                          <span className="text-[11px] font-semibold text-rose-500 px-2">Delete?</span>
                          <button
                            disabled={isDeleting}
                            onClick={() => confirmDeletePost(post.post_id)}
                            className="px-3 py-1 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition disabled:opacity-50"
                          >
                            {isDeleting ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setDeletingPostId(null)}
                            className={`p-1 rounded-xl text-xs transition ${
                              isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleTogglePrivate(post.post_id, post.is_private)}
                            title="Unpublish to Drafts"
                            className={`p-2 rounded-xl border text-xs transition ${
                              isDark ? 'border-white/10 hover:bg-white/10' : 'border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <EyeOff className="w-4 h-4 text-amber-500" />
                          </button>

                          <Link
                            to={`/edit/${post.post_id}`}
                            title="Edit Essay"
                            className={`p-2 rounded-xl border text-xs transition ${
                              isDark 
                                ? 'border-white/10 hover:bg-white/10 text-slate-200' 
                                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => setDeletingPostId(post.post_id)}
                            title="Delete Essay"
                            className="p-2 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition text-xs"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Drafts */}
        {activeTab === 'drafts' && (
          <section className="space-y-4">
            {loading ? (
              <p className={`text-xs text-center py-8 font-serif ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Loading drafts...
              </p>
            ) : draftPosts.length === 0 ? (
              <div className={`p-10 text-center rounded-3xl border space-y-3 ${
                isDark ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <FileEdit className="w-8 h-8 mx-auto text-amber-500 opacity-60" />
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  No drafts found. Thoughts you save as private drafts will show up here.
                </p>
                <Link
                  to="/create"
                  className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs font-bold transition"
                >
                  Start a New Draft
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {draftPosts.map((post) => (
                  <article
                    key={post.post_id}
                    className={`p-6 rounded-3xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isDark 
                        ? 'bg-[#1E1E1E] border-white/10 text-white' 
                        : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                    }`}
                  >
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                          Saved {formatDate(post.created_at)}
                        </span>
                        <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
                        <span className="px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          Private Draft
                        </span>
                      </div>

                      <h3 className="font-serif text-lg font-bold">
                        <Link 
                          to={`/edit/${post.post_id}`} 
                          className="hover:text-amber-500 transition"
                        >
                          {post.title || 'Untitled Draft'}
                        </Link>
                      </h3>

                      <p className={`text-xs line-clamp-2 leading-relaxed ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {post.excerpt || 'No summary excerpt added yet.'}
                      </p>
                    </div>

                    {/* Draft Actions */}
                    <div className={`flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-0 ${
                      isDark ? 'border-white/10' : 'border-slate-100'
                    }`}>
                      {deletingPostId === post.post_id ? (
                        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 p-1.5 rounded-2xl animate-fade-in">
                          <span className="text-[11px] font-semibold text-rose-500 px-2">Delete?</span>
                          <button
                            disabled={isDeleting}
                            onClick={() => confirmDeletePost(post.post_id)}
                            className="px-3 py-1 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition disabled:opacity-50"
                          >
                            {isDeleting ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setDeletingPostId(null)}
                            className={`p-1 rounded-xl text-xs transition ${
                              isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                            }`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleTogglePrivate(post.post_id, post.is_private)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-bold transition"
                            title="Publish directly to public feed"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Publish</span>
                          </button>

                          <Link
                            to={`/edit/${post.post_id}`}
                            title="Continue Editing"
                            className={`p-2 rounded-xl border text-xs transition ${
                              isDark 
                                ? 'border-white/10 hover:bg-white/10 text-slate-200' 
                                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => setDeletingPostId(post.post_id)}
                            title="Delete Draft"
                            className="p-2 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition text-xs"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Saved Bookmarks */}
        {activeTab === 'bookmarks' && (
          <section className="space-y-4">
            {savedPosts.length === 0 ? (
              <div className={`p-10 text-center rounded-3xl border ${
                isDark ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <Bookmark className="w-8 h-8 mx-auto text-sky-500 opacity-60 mb-2" />
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  You haven't saved any essays yet! Bookmark posts from the feed to read them later.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedPosts.map((post) => (
                  <article
                    key={post.post_id}
                    className={`p-6 rounded-3xl border transition shadow-sm space-y-3 ${
                      isDark 
                        ? 'bg-[#1E1E1E] border-white/10 text-white' 
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      By{' '}
                      <Link 
                        to={`/author/${post.username}`} 
                        className="hover:text-orange-600 font-semibold text-slate-800 dark:text-slate-200"
                      >
                        {post.display_name || post.username}
                      </Link>
                    </div>

                    <h3 className="font-serif text-lg font-bold">
                      <Link 
                        to={`/post/${post.post_id}`} 
                        className={`transition ${isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}`}
                      >
                        {post.title}
                      </Link>
                    </h3>

                    <p className={`text-xs line-clamp-2 leading-relaxed ${
                      isDark ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {post.excerpt}
                    </p>

                    <div className={`pt-3 border-t text-[10px] ${
                      isDark ? 'border-white/10 text-slate-500' : 'border-slate-100 text-slate-400'
                    }`}>
                      Saved on {formatDate(post.created_at)}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}