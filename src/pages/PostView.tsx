import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  ArrowLeft, 
  Heart, 
  Bookmark, 
  Share2, 
  MessageSquare, 
  Sun, 
  Moon, 
  Check, 
  CornerDownRight,
  Trash2
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

interface Author {
  user_id: number;
  username: string;
  display_name: string;
  bio?: string;
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

  return (
    <div
      className={`space-y-3 ${
        maxVisualDepth > 0 ? 'ml-4 sm:ml-6 pl-3 sm:pl-4 border-l-2 border-brand-terracotta/20' : ''
      }`}
    >
      <div
        className={`p-4 rounded-2xl border space-y-2 transition ${
          theme === 'dark' ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-black/10'
        }`}
      >
        <div className="flex items-center justify-between text-xs opacity-60">
          <span className="font-semibold text-brand-terracotta">
            {comment.display_name || comment.username}
          </span>
          <div className="flex items-center gap-3">
            <span>{new Date(comment.created_at).toLocaleDateString()}</span>
            <button
              type="button"
              onClick={() => onDelete(comment.comment_id)}
              className="text-rose-500/70 hover:text-rose-500 transition p-0.5"
              title="Delete comment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm leading-relaxed">{comment.content}</p>

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => onReply(comment.comment_id, comment.username)}
            className="flex items-center gap-1 text-[11px] opacity-60 hover:opacity-100 hover:text-brand-terracotta transition"
          >
            <CornerDownRight className="w-3 h-3" />
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
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (!id) return;
      setLoading(true);

      try {
        const [postRes, commentsRes] = await Promise.all([
          fetch(`${API_BASE}/posts/${id}`),
          fetch(`${API_BASE}/posts/${id}/comments`)
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
            user_has_liked: postData.is_liked,
            is_saved: postData.is_bookmarked
          });

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
      const res = await fetch(`${API_BASE}/posts/${id}/comments`);
      const data = await res.json();
      if (Array.isArray(data)) setComments(data);
    } catch (err) {
      console.error('Error refreshing comments:', err);
    }
  };

  const handleLike = async () => {
    if (!post) return;
    try {
      const res = await fetch(`${API_BASE}/posts/${post.post_id}/like`, {
        method: 'POST',
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
      const res = await fetch(`${API_BASE}/posts/${post.post_id}/bookmark`, {
        method: 'POST',
      });
      if (res.ok) {
        setPost((prev) => (prev ? { ...prev, is_saved: !prev.is_saved } : null));
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReplyClick = (commentId: number, username: string) => {
    setReplyTo({ id: commentId, name: username });
    commentInputRef.current?.focus();
    commentInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleDeleteComment = async (commentId: number) => {
    const getDescendantIds = (targetId: number, list: Comment[]): number[] => {
      const children = list.filter((c) => (c.parent_id ?? c.parent_comment_id) === targetId);
      return children.reduce(
        (acc, child) => [...acc, child.comment_id, ...getDescendantIds(child.comment_id, list)],
        [] as number[]
      );
    };

    const idsToRemove = new Set([commentId, ...getDescendantIds(commentId, comments)]);
    setComments((prev) => prev.filter((c) => !idsToRemove.has(c.comment_id)));

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        console.error('Failed to delete comment from server');
        fetchComments();
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      fetchComments();
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !id || isSubmitting) return;

    setIsSubmitting(true);
    setCommentError(null);

    const commentText = newComment.trim();
    const parentId = replyTo ? replyTo.id : null;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // Clean payload sending both variations so Express parses it regardless of backend schema
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
        setCommentError(errorData.message || `Server returned error (${res.status})`);
        fetchComments();
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      setCommentError('Network error connecting to backend API.');
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
      <div className="max-w-3xl mx-auto px-4 py-20 text-center font-serif opacity-60">
        Loading essay...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="font-serif text-xl">Essay not found or has been removed.</p>
        <button
          onClick={() => navigate('/feed')}
          className="px-4 py-2 bg-brand-terracotta text-white rounded-full text-xs font-semibold"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const authorName = post.author?.display_name || post.author?.username || 'Anonymous Author';
  const authorUsername = post.author?.username || 'unknown';
  const postContent = post.content || '';
  const commentTree = buildCommentTree(comments);

  return (
    <article className="max-w-3xl mx-auto px-4 py-8 space-y-10 pb-28">
      {/* Navigation Header */}
      <div className="flex items-center justify-between border-b border-current/10 pb-4">
        <button
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
            theme === 'dark' ? 'border-white/10 hover:bg-white/10' : 'border-black/10 hover:bg-black/5'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className={`p-2 rounded-full border transition ${
            theme === 'dark'
              ? 'border-white/10 hover:bg-white/10 text-amber-400'
              : 'border-black/10 hover:bg-black/5 text-slate-700'
          }`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* Post Metadata */}
      <header className="space-y-6">
        <h1 className={`font-serif text-3xl sm:text-5xl font-bold leading-tight ${
          theme === 'dark' ? 'text-white' : 'text-brand-ink'
        }`}>
          {post.title}
        </h1>

        <div className="flex items-center justify-between pt-2 border-t border-b border-current/10 py-4">
          <Link to={`/author/${authorUsername}`} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-brand-terracotta/20 text-brand-terracotta flex items-center justify-center font-bold text-sm">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold group-hover:text-brand-terracotta transition">
                {authorName}
              </div>
              <div className="text-xs opacity-50">
                @{authorUsername} • {post.created_at ? new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBookmark}
              title="Save Essay"
              className={`p-2 rounded-full transition border ${
                post.is_saved
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'opacity-60 hover:opacity-100 border-transparent'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${post.is_saved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              title="Share Link"
              className="p-2 rounded-full opacity-60 hover:opacity-100 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className={`prose max-w-none font-serif text-base sm:text-lg leading-relaxed space-y-6 ${
        theme === 'dark' ? 'text-gray-200' : 'text-slate-800'
      }`}>
        {postContent.split('\n\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {/* Engagement Dock */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <div className={`flex items-center gap-6 px-6 py-3 rounded-full border shadow-xl backdrop-blur-md transition ${
          theme === 'dark' ? 'bg-[#1E1E1E]/90 border-white/15 text-white' : 'bg-white/90 border-black/15 text-brand-ink'
        }`}>
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 text-xs font-semibold transition ${
              post.user_has_liked ? 'text-rose-500' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <Heart className={`w-5 h-5 ${post.user_has_liked ? 'fill-current' : ''}`} />
            <span>{post.likes_count || 0}</span>
          </button>

          <div className="w-px h-4 bg-current/20" />

          <a
            href="#comments"
            className="flex items-center gap-2 text-xs font-semibold opacity-70 hover:opacity-100 transition"
          >
            <MessageSquare className="w-5 h-5" />
            <span>{comments.length}</span>
          </a>

          <div className="w-px h-4 bg-current/20" />

          <button
            onClick={handleBookmark}
            className={`transition ${post.is_saved ? 'text-amber-500' : 'opacity-70 hover:opacity-100'}`}
          >
            <Bookmark className={`w-5 h-5 ${post.is_saved ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="opacity-70 hover:opacity-100 transition relative"
            title="Share Essay"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Response Section */}
      <section id="comments" className="pt-10 border-t border-current/10 space-y-6">
        <h3 className="font-serif text-xl font-bold">Responses ({comments.length})</h3>

        <form onSubmit={handleFormSubmit} className="space-y-3">
          {replyTo && (
            <div className="flex items-center justify-between text-xs bg-brand-terracotta/10 text-brand-terracotta px-3 py-1.5 rounded-xl">
              <span>Replying to @{replyTo.name}</span>
              <button type="button" onClick={() => setReplyTo(null)} className="font-bold">×</button>
            </div>
          )}

          <textarea
            ref={commentInputRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyTo ? `Replying to @${replyTo.name}...` : 'What are your thoughts?'}
            rows={3}
            className={`w-full p-4 rounded-2xl text-xs sm:text-sm border resize-none focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 ${
              theme === 'dark' ? 'bg-[#1E1E1E] border-white/10 text-white' : 'bg-white border-black/10 text-brand-ink'
            }`}
          />

          {commentError && (
            <p className="text-xs text-rose-500 font-medium">{commentError}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="px-5 py-2 bg-brand-terracotta text-white rounded-full text-xs font-semibold transition hover:opacity-90 disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Respond'}
            </button>
          </div>
        </form>

        <div className="space-y-4 pt-4">
          {commentTree.length === 0 ? (
            <p className="text-xs sm:text-sm opacity-50 italic">No responses yet. Start the conversation!</p>
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
  );
}