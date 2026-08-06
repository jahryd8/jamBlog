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
  Globe,
  AlertCircle
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface MyPost {
  post_id: number;
  title: string;
  excerpt: string;
  is_private: boolean;
  is_draft?: boolean;
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

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(
    location.state?.message ? { message: location.state.message, type: 'success' } : null
  );

  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [totalLikes, setTotalLikes] = useState<number>(0);
  const [totalLikesGiven, setTotalLikesGiven] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'published' | 'drafts' | 'bookmarks'>('published');
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    const headers = getAuthHeaders();

    try {
      const [postsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/posts/my-posts`, { headers }),
        fetch(`${API_BASE}/dashboard/stats`, { headers })
      ]);

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        if (Array.isArray(postsData)) setMyPosts(postsData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setTotalLikes(statsData.totalLikesReceived || 0);
        setTotalLikesGiven(statsData.totalLikesGiven || 0);
        setSavedPosts(statsData.savedPosts || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setToast({ message: 'Failed to load dashboard data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Optimistic Toggle Private/Public
  const handleTogglePrivate = async (postId: number, currentPrivateStatus: boolean) => {
    const previousPosts = [...myPosts];
    const nextPrivateStatus = !currentPrivateStatus;

    setMyPosts((prev) =>
      prev.map((post) =>
        post.post_id === postId ? { ...post, is_private: nextPrivateStatus } : post
      )
    );

    setToast({
      message: currentPrivateStatus ? 'Draft published to feed!' : 'Essay moved to private drafts.',
      type: 'success'
    });

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/visibility`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_private: nextPrivateStatus }),
      });

      if (!res.ok) throw new Error('Failed to update visibility');
    } catch (err) {
      console.error('Failed to toggle post visibility:', err);
      setMyPosts(previousPosts);
      setToast({ message: 'Could not update visibility. Changes reverted.', type: 'error' });
    }
  };

  // Optimistic Delete Post
  const confirmDeletePost = async (postId: number) => {
    const previousPosts = [...myPosts];

    setMyPosts((prev) => prev.filter((post) => post.post_id !== postId));
    setDeletingPostId(null);
    setToast({ message: 'Essay deleted successfully.', type: 'info' });

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Failed deletion');
    } catch (err) {
      console.error('Failed to delete post:', err);
      setMyPosts(previousPosts);
      setToast({ message: 'Failed to delete essay. Post restored.', type: 'error' });
    }
  };

  // Optimistic Unbookmark
  const handleUnbookmark = async (postId: number) => {
    const previousBookmarks = [...savedPosts];

    setSavedPosts((prev) => prev.filter((post) => post.post_id !== postId));
    setToast({ message: 'Bookmark removed.', type: 'info' });

    try {
      const res = await fetch(`${API_BASE}/posts/${postId}/bookmark`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error('Failed unbookmark');
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
      setSavedPosts(previousBookmarks);
      setToast({ message: 'Could not remove bookmark. Restored to saved.', type: 'error' });
    }
  };

  const publishedPosts = myPosts.filter((post) => !post.is_private && !post.is_draft);
  const draftPosts = myPosts.filter((post) => post.is_private || post.is_draft);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? 'N/A' : parsed.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={`min-h-screen rounded-3xl transition-colors duration-200 ${
      isDark ? 'bg-[#121212] text-slate-100' : 'bg-[#FBF9F5] text-slate-900'
    }`}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        
        {/* Toast Feedback Notification Banner */}
        {toast && (
          <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border transition-all animate-fade-in ${
            toast.type === 'error'
              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
              : toast.type === 'info'
              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
          }`}>
            <div className="flex items-center gap-2">
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4" />
              ) : toast.type === 'info' ? (
                <Info className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{toast.message}</span>
            </div>
            <button 
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-current/10 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Header Banner */}
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

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            icon={<Globe className="w-5 h-5" />}
            color="orange"
            label="Published"
            value={publishedPosts.length}
            loading={loading}
            active={activeTab === 'published'}
            onClick={() => setActiveTab('published')}
            isDark={isDark}
          />
          <StatCard
            icon={<FileEdit className="w-5 h-5" />}
            color="amber"
            label="Drafts"
            value={draftPosts.length}
            loading={loading}
            active={activeTab === 'drafts'}
            onClick={() => setActiveTab('drafts')}
            isDark={isDark}
          />
          <StatCard
            icon={<Heart className="w-5 h-5 fill-current" />}
            color="rose"
            label="Likes"
            value={totalLikes}
            loading={loading}
            isDark={isDark}
          />
          <StatCard
            icon={<Heart className="w-5 h-5" />}
            color="purple"
            label="Likes Given"
            value={totalLikesGiven}
            loading={loading}
            isDark={isDark}
          />
          <StatCard
            icon={<Bookmark className="w-5 h-5 fill-current" />}
            color="sky"
            label="Bookmarks"
            value={savedPosts.length}
            loading={loading}
            active={activeTab === 'bookmarks'}
            onClick={() => setActiveTab('bookmarks')}
            isDark={isDark}
          />
        </div>

        {/* Tabs Navigation */}
        <div className={`flex border-b gap-6 text-sm font-semibold ${
          isDark ? 'border-white/10' : 'border-slate-200'
        }`}>
          <TabButton
            label="Published Essays"
            count={publishedPosts.length}
            active={activeTab === 'published'}
            onClick={() => setActiveTab('published')}
            activeColor="text-orange-600 border-orange-600"
            isDark={isDark}
            loading={loading}
          />
          <TabButton
            label="Drafts"
            count={draftPosts.length}
            active={activeTab === 'drafts'}
            onClick={() => setActiveTab('drafts')}
            activeColor="text-amber-500 border-amber-500"
            badgeBg="bg-amber-500/20 text-amber-500"
            isDark={isDark}
            loading={loading}
          />
          <TabButton
            label="Bookmarks"
            count={savedPosts.length}
            active={activeTab === 'bookmarks'}
            onClick={() => setActiveTab('bookmarks')}
            activeColor="text-orange-600 border-orange-600"
            isDark={isDark}
            loading={loading}
          />
        </div>

        {/* Tab 1: Published Essays */}
        {activeTab === 'published' && (
          <section className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                <PostCardSkeleton isDark={isDark} />
                <PostCardSkeleton isDark={isDark} />
                <PostCardSkeleton isDark={isDark} />
              </div>
            ) : publishedPosts.length === 0 ? (
              <EmptyState
                icon={<Globe className="w-8 h-8 mx-auto text-orange-500 opacity-60" />}
                message="You haven't published any essays publicly yet."
                actionLabel="Write an Essay"
                actionTo="/create"
                isDark={isDark}
              />
            ) : (
              <div className="space-y-4">
                {publishedPosts.map((post) => (
                  <PostCard
                    key={post.post_id}
                    post={post}
                    isDark={isDark}
                    deletingPostId={deletingPostId}
                    onDeleteConfirm={confirmDeletePost}
                    onDeleteCancel={() => setDeletingPostId(null)}
                    onDeleteInit={(id) => setDeletingPostId(id)}
                    onTogglePrivate={handleTogglePrivate}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Drafts */}
        {activeTab === 'drafts' && (
          <section className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                <PostCardSkeleton isDark={isDark} />
                <PostCardSkeleton isDark={isDark} />
              </div>
            ) : draftPosts.length === 0 ? (
              <EmptyState
                icon={<FileEdit className="w-8 h-8 mx-auto text-amber-500 opacity-60" />}
                message="No drafts found. Thoughts you save as private drafts will show up here."
                actionLabel="Start a New Draft"
                actionTo="/create"
                isDark={isDark}
              />
            ) : (
              <div className="space-y-4">
                {draftPosts.map((post) => (
                  <PostCard
                    key={post.post_id}
                    post={post}
                    isDraft
                    isDark={isDark}
                    deletingPostId={deletingPostId}
                    onDeleteConfirm={confirmDeletePost}
                    onDeleteCancel={() => setDeletingPostId(null)}
                    onDeleteInit={(id) => setDeletingPostId(id)}
                    onTogglePrivate={handleTogglePrivate}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Saved Bookmarks */}
        {activeTab === 'bookmarks' && (
          <section className="space-y-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BookmarkSkeleton isDark={isDark} />
                <BookmarkSkeleton isDark={isDark} />
                <BookmarkSkeleton isDark={isDark} />
                <BookmarkSkeleton isDark={isDark} />
              </div>
            ) : savedPosts.length === 0 ? (
              <EmptyState
                icon={<Bookmark className="w-8 h-8 mx-auto text-sky-500 opacity-60" />}
                message="You haven't saved any essays yet! Bookmark posts from the feed to read them later."
                isDark={isDark}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedPosts.map((post) => (
                  <article
                    key={post.post_id}
                    className={`p-6 rounded-3xl border transition shadow-sm space-y-3 relative group ${
                      isDark 
                        ? 'bg-[#1E1E1E] border-white/10 text-white' 
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        By{' '}
                        <Link 
                          to={`/author/${post.username}`} 
                          className="hover:text-orange-600 font-semibold text-slate-800 dark:text-slate-200"
                        >
                          {post.display_name || post.username}
                        </Link>
                      </div>
                      <button
                        onClick={() => handleUnbookmark(post.post_id)}
                        title="Remove Bookmark"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                      >
                        <Bookmark className="w-4 h-4 fill-current" />
                      </button>
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

// Skeleton Components
function PostCardSkeleton({ isDark }: { isDark: boolean }) {
  const skeletonBg = isDark ? 'bg-white/10' : 'bg-slate-200';

  return (
    <div
      className={`p-6 rounded-3xl border animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDark ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-slate-200'
      }`}
    >
      <div className="space-y-3 w-full max-w-xl">
        <div className="flex items-center gap-2">
          <div className={`h-3 w-20 rounded-full ${skeletonBg}`} />
          <div className={`h-3 w-16 rounded-full ${skeletonBg}`} />
        </div>
        <div className={`h-5 w-3/4 rounded-lg ${skeletonBg}`} />
        <div className="space-y-1.5">
          <div className={`h-3 w-full rounded-md ${skeletonBg}`} />
          <div className={`h-3 w-4/5 rounded-md ${skeletonBg}`} />
        </div>
        <div className="flex gap-4 pt-1">
          <div className={`h-3 w-10 rounded-md ${skeletonBg}`} />
          <div className={`h-3 w-10 rounded-md ${skeletonBg}`} />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2 sm:pt-0">
        <div className={`h-8 w-8 rounded-xl ${skeletonBg}`} />
        <div className={`h-8 w-8 rounded-xl ${skeletonBg}`} />
        <div className={`h-8 w-8 rounded-xl ${skeletonBg}`} />
      </div>
    </div>
  );
}

function BookmarkSkeleton({ isDark }: { isDark: boolean }) {
  const skeletonBg = isDark ? 'bg-white/10' : 'bg-slate-200';

  return (
    <div
      className={`p-6 rounded-3xl border animate-pulse space-y-3 ${
        isDark ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex justify-between items-center">
        <div className={`h-3 w-24 rounded-full ${skeletonBg}`} />
        <div className={`h-4 w-4 rounded-md ${skeletonBg}`} />
      </div>
      <div className={`h-5 w-2/3 rounded-lg ${skeletonBg}`} />
      <div className="space-y-1.5">
        <div className={`h-3 w-full rounded-md ${skeletonBg}`} />
        <div className={`h-3 w-3/4 rounded-md ${skeletonBg}`} />
      </div>
      <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
        <div className={`h-2.5 w-28 rounded-full ${skeletonBg}`} />
      </div>
    </div>
  );
}

// Internal Helper Components
function StatCard({
  icon,
  color,
  label,
  value,
  loading,
  active = false,
  onClick,
  isDark,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: number;
  loading: boolean;
  active?: boolean;
  onClick?: () => void;
  isDark: boolean;
}) {
  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-500', ring: 'ring-2 ring-orange-500/50' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-500', ring: 'ring-2 ring-amber-500/50' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-500', ring: '' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-500', ring: '' },
    sky: { bg: 'bg-sky-500/10', text: 'text-sky-500', ring: 'ring-2 ring-sky-500/50' },
  };

  const current = colorMap[color] || colorMap.orange;

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-3xl border flex items-center gap-4 transition ${
        onClick ? 'cursor-pointer' : ''
      } ${active ? current.ring : ''} ${
        isDark 
          ? 'bg-[#1E1E1E] border-white/10 text-white hover:border-white/30' 
          : 'bg-white border-slate-200 text-slate-900 hover:border-slate-400 shadow-sm'
      }`}
    >
      <div className={`p-3 rounded-2xl ${current.bg} ${current.text}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold font-serif">
          {loading ? (
            <div className={`h-6 w-8 rounded-md animate-pulse ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
          ) : (
            value
          )}
        </div>
        <div className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</div>
      </div>
    </div>
  );
}

function TabButton({
  label,
  count,
  active,
  onClick,
  activeColor,
  badgeBg,
  isDark,
  loading = false,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  activeColor: string;
  badgeBg?: string;
  isDark: boolean;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-3 transition relative flex items-center gap-2 ${
        active
          ? `${activeColor} border-b-2`
          : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
      }`}
    >
      <span>{label}</span>
      {loading ? (
        <span className={`w-5 h-3.5 rounded-full animate-pulse ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
      ) : (
        <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono ${
          badgeBg ? badgeBg : isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-200 text-slate-700'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function PostCard({
  post,
  isDraft = false,
  isDark,
  deletingPostId,
  onDeleteConfirm,
  onDeleteCancel,
  onDeleteInit,
  onTogglePrivate,
  formatDate,
}: {
  post: MyPost;
  isDraft?: boolean;
  isDark: boolean;
  deletingPostId: number | null;
  onDeleteConfirm: (id: number) => void;
  onDeleteCancel: () => void;
  onDeleteInit: (id: number) => void;
  onTogglePrivate: (id: number, status: boolean) => void;
  formatDate: (dateStr?: string) => string;
}) {
  return (
    <article
      className={`p-6 rounded-3xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        isDark 
          ? 'bg-[#1E1E1E] border-white/10 text-white' 
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      <div className="space-y-2 max-w-xl">
        <div className="flex items-center gap-2 text-[10px]">
          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            {isDraft ? `Saved ${formatDate(post.created_at)}` : formatDate(post.created_at)}
          </span>
          <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
          <span className={`px-2 py-0.5 rounded-full font-medium ${
            isDraft 
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' 
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            {isDraft ? 'Private Draft' : 'Published'}
          </span>
        </div>

        <h3 className="font-serif text-lg font-bold">
          <Link 
            to={isDraft ? `/edit/${post.post_id}` : `/post/${post.post_id}`} 
            className={`transition ${isDark ? 'hover:text-orange-400' : 'hover:text-orange-600'}`}
          >
            {post.title || 'Untitled Draft'}
          </Link>
        </h3>

        <p className={`text-xs line-clamp-2 leading-relaxed ${
          isDark ? 'text-slate-400' : 'text-slate-600'
        }`}>
          {post.excerpt || 'No summary excerpt added yet.'}
        </p>

        {!isDraft && (
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
        )}
      </div>

      <div className={`flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-0 ${
        isDark ? 'border-white/10' : 'border-slate-100'
      }`}>
        {deletingPostId === post.post_id ? (
          <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 p-1.5 rounded-2xl animate-fade-in">
            <span className="text-[11px] font-semibold text-rose-500 px-2">Delete?</span>
            <button
              onClick={() => onDeleteConfirm(post.post_id)}
              className="px-3 py-1 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition"
            >
              Confirm
            </button>
            <button
              onClick={onDeleteCancel}
              className={`p-1 rounded-xl text-xs transition ${
                isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {isDraft ? (
              <button
                onClick={() => onTogglePrivate(post.post_id, post.is_private)}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-bold transition"
                title="Publish directly to public feed"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Publish</span>
              </button>
            ) : (
              <button
                onClick={() => onTogglePrivate(post.post_id, post.is_private)}
                title="Unpublish to Drafts"
                className={`p-2 rounded-xl border text-xs transition ${
                  isDark ? 'border-white/10 hover:bg-white/10' : 'border-slate-200 hover:bg-slate-100'
                }`}
              >
                <EyeOff className="w-4 h-4 text-amber-500" />
              </button>
            )}

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
              onClick={() => onDeleteInit(post.post_id)}
              title="Delete Essay"
              className="p-2 rounded-xl border border-rose-500/20 text-rose-500 hover:bg-rose-500/10 transition text-xs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function EmptyState({
  icon,
  message,
  actionLabel,
  actionTo,
  isDark,
}: {
  icon: React.ReactNode;
  message: string;
  actionLabel?: string;
  actionTo?: string;
  isDark: boolean;
}) {
  return (
    <div className={`p-10 text-center rounded-3xl border space-y-3 ${
      isDark ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      {icon}
      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        {message}
      </p>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-xs font-bold transition"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}