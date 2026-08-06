import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  MessageSquare,
  Sun,
  Moon,
  Trash2,
  UserPlus,
  UserCheck
} from 'lucide-react';

// Sanitize base URL to ensure no trailing slash or duplicate /api prefix
const rawBase = import.meta.env.VITE_API_BASE_URL || 'https://jamblog.onrender.com';
const API_BASE_URL = rawBase.replace(/\/api\/?$/, '').replace(/\/$/, '');

interface Author {
  user_id: number;
  username: string;
  display_name: string;
  bio?: string;
  is_following?: boolean;
}

interface Post {
  post_id: number;
  title: string;
  content: string;
  excerpt?: string;
  created_at: string;
  is_private: boolean;
  author?: Author;
  likes_count: number;
  user_has_liked: boolean;
  is_saved: boolean;
}

interface Comment {
  comment_id: number;
  content: string;
  created_at: string;
  username: string;
  display_name: string;
  parent_id?: number | null;
  parent_comment_id?: number | null;
  children?: Comment[];
}

function buildCommentTree(flatComments: Comment[]): Comment[] {
  const map = new Map<number, Comment>();
  const roots: Comment[] = [];

  flatComments.forEach((c) => {
    const parentId = c.parent_id ?? c.parent_comment_id ?? null;
    map.set(c.comment_id, { ...c, parent_id: parentId, children: [] });
  });

  map.forEach((node) => {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  theme: string;
  onReply: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

function CommentItem({ comment, depth = 0, theme, onReply, onDelete }: CommentItemProps) {
  const maxVisualDepth = Math.min(depth, 3);
  const isDark = theme === 'dark';

  return (
    <div className={`space-y-3 ${maxVisualDepth > 0 ? 'ml-4 sm:ml-6 pl-3 sm:pl-4 border-l-2 border-orange-500/30' : ''}`}>
      <div className={`p-5 rounded-2xl border transition shadow-sm ${
        isDark ? 'bg-[#1E1E1E] border-white/10 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center justify-between text-xs mb-2">
          <Link 
            to={`/author/${comment.username}`} 
            className={`font-semibold hover:text-orange-500 transition ${isDark ? 'text-slate-200' : 'text-slate-900'}`}
          >
            {comment.display_name || comment.username}
          </Link>
          <div className="flex items-center gap-3">
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
            <button
              type="button"
              onClick={() => onDelete(comment.comment_id)}
              className="text-rose-500/80 hover:text-rose-600 transition p-1 rounded hover:bg-rose-500/10"
              title="Delete comment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className={`text-sm leading-relaxed font-normal ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          {comment.content}
        </p>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => onReply(comment.comment_id, comment.username)}
            className={`flex items-center gap-1 text-[11px] transition font-medium ${
              isDark ? 'text-slate-400 hover:text-orange-500' : 'text-slate-500 hover:text-orange-500'
            }`}
          >
            <span>Reply</span>
          </button>
        </div>
      </div>

      {comment.children && comment.children.length > 0 && (
        <div className="space-y-3">
          {comment.children.map((child) => (
            <CommentItem
              key={child.comment_id}
              comment={child}
              depth={depth + 1}
              theme={theme}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const isDark = theme === 'dark';

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!id) return;
      setLoading(true);

      try {
        const headers = getAuthHeaders();
        const [postRes, commentsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/posts/${id}`, { headers }),
          fetch(`${API_BASE_URL}/api/posts/${id}/comments`, { headers })
        ]);

        if (!postRes.ok) throw new Error('Post not found');

        const postData = await postRes.json();
        const commentsData = await commentsRes.json();

        if (isMounted) {
          setPost({
            ...postData,
            author: {
              user_id: postData.author_id,
              username: postData.username,
              display_name: postData.display_name,
              bio: postData.bio
            },
            user_has_liked: Boolean(postData.is_liked),
            is_saved: Boolean(postData.is_saved || postData.is_bookmarked)
          });
          setIsFollowing(Boolean(postData.is_following_author));

          if (Array.isArray(commentsData)) {
            setComments(commentsData);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading post or comments:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${id}/comments`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (Array.isArray(data)) setComments(data);
    } catch (err) {
      console.error('Error refreshing comments:', err);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${post.post_id}/like`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setPost((prev) =>
          prev
            ? {
                ...prev,
                user_has_liked: !prev.user_has_liked,
                likes_count: prev.user_has_liked ? prev.likes_count - 1 : prev.likes_count + 1,
              }
            : null
        );
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleBookmark = async () => {
    if (!post) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${post.post_id}/save`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setPost((prev) => (prev ? { ...prev, is_saved: !prev.is_saved } : null));
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleFollowAuthor = async () => {
    if (!post?.author?.user_id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${post.author.user_id}/follow`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (err) {
      console.error('Failed to follow author:', err);
    }
  };

  const handleReplyClick = (commentId: number, username: string) => {
    setReplyTo({ id: commentId, name: username });
    commentInputRef.current?.focus();
    commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleDeleteComment = async (commentId: number) => {
    const previousComments = [...comments];

    // Iterative collection to avoid missing deeply nested children
    const idsToRemove = new Set<number>([commentId]);
    let addedNew = true;

    while (addedNew) {
      addedNew = false;
      comments.forEach((c) => {
        const pId = Number(c.parent_id ?? c.parent_comment_id);
        if (pId && idsToRemove.has(pId) && !idsToRemove.has(c.comment_id)) {
          idsToRemove.add(c.comment_id);
          addedNew = true;
        }
      });
    }

    setComments((prev) => prev.filter((c) => !idsToRemove.has(c.comment_id)));

    try {
      const res = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setComments(previousComments);
        alert(errorData.message || `Could not delete comment (Status ${res.status})`);
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setComments(previousComments);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !id || isSubmitting) return;

    setIsSubmitting(true);
    setCommentError(null);

    const commentText = newComment.trim();
    const parentId = replyTo ? replyTo.id : null;

    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          content: commentText,
          parent_comment_id: parentId,
          parent_id: parentId,
        }),
      });

      if (res.ok) {
        setNewComment('');
        setReplyTo(null);
        await fetchComments();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setCommentError(errorData.message || `Error submitting comment (${res.status})`);
        fetchComments();
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      setCommentError('Network error connecting to server.');
      fetchComments();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitComment();
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#121212] text-slate-300' : 'bg-[#FBF9F5] text-slate-700'}`}>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center font-serif opacity-60">
          Loading essay...
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#121212] text-white' : 'bg-[#FBF9F5] text-slate-900'}`}>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
          <p className="font-serif text-xl">Essay not found or has been removed.</p>
          <button
            onClick={() => navigate('/feed')}
            className="px-4 py-2 bg-orange-600 text-white rounded-full text-xs font-semibold hover:bg-orange-700 transition"
          >
            Return to Feed
          </button>
        </div>
      </div>
    );
  }

  const authorName = post.author?.display_name || post.author?.username || 'Anonymous Author';
  const authorBio = post.author?.bio || 'Author on JamBlog.';
  const postContent = post.content || '';
  const commentTree = buildCommentTree(comments);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      isDark ? 'bg-[#121212] text-slate-100' : 'bg-[#FBF9F5] text-slate-900'
    }`}>
      <article className="max-w-3xl mx-auto px-4 py-8 space-y-10 pb-28">
        
        {/* Navigation Header */}
        <div className={`flex items-center justify-between border-b pb-4 ${
          isDark ? 'border-white/10' : 'border-slate-200'
        }`}>
          <button
            onClick={() => navigate(-1)}
            className={`flex items-center gap-2 text-xs font-medium transition ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={toggleTheme}
            title="Switch Theme"
            className={`p-2 rounded-full border transition ${
              isDark 
                ? 'border-white/10 hover:bg-white/10 text-amber-400' 
                : 'border-slate-200 hover:bg-slate-100 text-slate-700'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Post Title Header */}
        <header className="space-y-6">
          <h1 className={`font-serif text-4xl sm:text-5xl font-bold leading-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            {post.title}
          </h1>

          <div className={`flex items-center justify-between border-t border-b py-4 text-xs ${
            isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <div className="flex items-center gap-2">
              <Link 
                to={`/author/${post.author?.username}`} 
                className={`font-medium hover:text-orange-500 transition ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
              >
                {authorName}
              </Link>
              <span>•</span>
              <span>
                {post.created_at ? new Date(post.created_at).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: 'numeric' }) : ''}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 transition ${
                  isDark ? 'hover:text-white' : 'hover:text-slate-900'
                }`}
              >
                <Heart className={`w-4 h-4 ${post.user_has_liked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{post.likes_count || 0}</span>
              </button>
              <button
                onClick={handleBookmark}
                className={`flex items-center gap-1 transition ${
                  isDark ? 'hover:text-white' : 'hover:text-slate-900'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${post.is_saved ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>{post.is_saved ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Body Content */}
        <div className={`prose max-w-none font-serif text-base sm:text-lg leading-relaxed space-y-6 ${
          isDark ? 'text-slate-300' : 'text-slate-800'
        }`}>
          {postContent.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {/* Author Bio Card */}
        <div className={`p-6 rounded-2xl flex items-center justify-between shadow-sm border ${
          isDark 
            ? 'bg-[#1E1E1E] border-white/10 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div>
            <h4 className={`font-serif text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Link to={`/author/${post.author?.username}`} className="hover:text-orange-500 transition">
                {authorName}
              </Link>
            </h4>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{authorBio}</p>
          </div>
          <button 
            onClick={handleFollowAuthor}
            className={`flex items-center gap-2 px-5 py-2 text-white rounded-full text-xs font-semibold transition ${
              isFollowing ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
            <span>{isFollowing ? 'Following' : 'Follow'}</span>
          </button>
        </div>

        {/* Discussion Header */}
        <section id="comments" className={`pt-8 border-t space-y-6 ${
          isDark ? 'border-white/10' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            <h3 className={`font-serif text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Discussion ({comments.length})
            </h3>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleFormSubmit} className="flex gap-3">
            <div className="relative flex-1">
              {replyTo && (
                <div className="absolute top-2 left-3 flex items-center justify-between text-xs bg-orange-500/10 text-orange-500 px-2.5 py-1 rounded-md font-medium">
                  <span>Replying to @{replyTo.name}</span>
                  <button type="button" onClick={() => setReplyTo(null)} className="ml-2 font-bold">×</button>
                </div>
              )}
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts on this essay..."
                rows={2}
                className={`w-full p-4 rounded-xl text-sm border resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 transition ${
                  replyTo ? 'pt-10' : ''
                } ${
                  isDark 
                    ? 'bg-[#1E1E1E] text-slate-100 placeholder-slate-500 border-white/10' 
                    : 'bg-white text-slate-900 placeholder-slate-400 border-slate-300'
                }`}
              />
            </div>
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition self-start disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </form>

          {commentError && (
            <p className="text-xs text-rose-500 font-medium">{commentError}</p>
          )}

          {/* Comments List */}
          <div className="space-y-4 pt-4">
            {commentTree.length === 0 ? (
              <p className={`text-xs sm:text-sm italic ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                No thoughts shared yet. Be the first to start the discussion!
              </p>
            ) : (
              commentTree.map((topLevelComment) => (
                <CommentItem
                  key={topLevelComment.comment_id}
                  comment={topLevelComment}
                  theme={theme}
                  onReply={handleReplyClick}
                  onDelete={handleDeleteComment}
                />
              ))
            )}
          </div>
        </section>

      </article>
    </div>
  );
}