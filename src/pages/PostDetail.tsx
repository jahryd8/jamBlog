import { useEffect, useState } from 'react';

import { useParams, Link } from 'react-router-dom';

import { useTheme } from '../context/ThemeContext';

import { Heart, Bookmark, MessageSquare, Send, UserPlus, UserCheck, ArrowLeft } from 'lucide-react';



interface PostData {

  post_id: number;

  title: string;

  content: string;

  excerpt: string;

  created_at: string;

  author_id: number;

  username: string;

  display_name: string;

  bio: string;

  likes_count: string;

  comments_count: string;

  is_liked: boolean;

  is_saved: boolean;

  is_following_author: boolean;

}



interface Comment {

  comment_id: number;

  content: string;

  created_at: string;

  username: string;

  display_name: string;

}



export default function PostDetail() {

  const { id } = useParams();

  const { theme } = useTheme();



  const [post, setPost] = useState<PostData | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);

  const [newComment, setNewComment] = useState('');

  const [loading, setLoading] = useState(true);



  // Toggle states

  const [isLiked, setIsLiked] = useState(false);

  const [likesCount, setLikesCount] = useState(0);

  const [isFollowing, setIsFollowing] = useState(false);

  const [isSaved, setIsSaved] = useState(false);



  useEffect(() => {
  // Fetch Post Details
  fetch(`http://localhost:5000/api/posts/${id}`)
    .then((res) => res.json())
    .then((data) => {
      if (data.post_id) {
        setPost(data);
        setIsLiked(Boolean(data.is_liked));
        setIsSaved(Boolean(data.is_saved));
        setLikesCount(parseInt(data.likes_count, 10) || 0);
        setIsFollowing(Boolean(data.is_following_author));
      }
      setLoading(false);
    })
    .catch((err) => {
      console.error('Error fetching post:', err);
      setLoading(false);
    });

  // Fetch Comments
  fetch(`http://localhost:5000/api/posts/${id}/comments`)
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data)) {
        setComments(data);
      } else {
        setComments([]);
      }
    })
    .catch((err) => {
      console.error('Error fetching comments:', err);
      setComments([]);
    });
  }, [id]);



  const handleLike = async () => {

    if (!post) return;

    try {

      const res = await fetch(`http://localhost:5000/api/posts/${post.post_id}/like`, {

        method: 'POST',

      });

      const data = await res.json();

      setIsLiked(data.isLiked);

      setLikesCount((prev) => (data.isLiked ? prev + 1 : prev - 1));

    } catch (err) {

      console.error('Failed to toggle like:', err);

    }

  };



  const handleSave = async () => {

    if (!post) return;

    try {

      const res = await fetch(`http://localhost:5000/api/posts/${post.post_id}/save`, {

        method: 'POST',

      });

      const data = await res.json();

      setIsSaved(data.isSaved);

    } catch (err) {

      console.error('Failed to toggle bookmark:', err);

    }

  };



  const handleFollowAuthor = async () => {

    if (!post) return;

    try {

      const res = await fetch(`http://localhost:5000/api/users/${post.author_id}/follow`, {

        method: 'POST',

      });

      const data = await res.json();

      setIsFollowing(data.isFollowing);

    } catch (err) {

      console.error('Failed to follow author:', err);

    }

  };



  const handleAddComment = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!newComment.trim() || !post) return;



    try {

      const res = await fetch(`http://localhost:5000/api/posts/${post.post_id}/comments`, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ content: newComment }),

      });

      const createdComment = await res.json();



      if (createdComment.comment_id) {

        setComments((prev) => [createdComment, ...prev]);

        setNewComment('');

      }

    } catch (err) {

      console.error('Failed to add comment:', err);

    }

  };



  if (loading) return <div className="p-12 text-center font-serif opacity-70">Loading essay...</div>;

  if (!post) return <div className="p-12 text-center font-serif text-xl">Essay not found!</div>;



  return (

    <article className="max-w-3xl mx-auto px-4 py-8 space-y-10">

      {/* Back Link */}

      <Link to="/feed" className="inline-flex items-center gap-2 text-xs font-semibold opacity-60 hover:opacity-100 transition">

        <ArrowLeft className="w-4 h-4" />

        <span>Back to Feed</span>

      </Link>



      {/* Header */}

      <header className="space-y-4">

        <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight">{post.title}</h1>

        

        <div className="flex items-center justify-between pt-4 border-t border-current/10 text-xs">

          <div className="flex items-center gap-3">

            <Link to={`/author/${post.username}`} className="font-bold hover:text-brand-terracotta transition">

              {post.display_name || post.username}

            </Link>

            <span className="opacity-40">•</span>

            <span className="opacity-60">{new Date(post.created_at).toLocaleDateString()}</span>

          </div>



          {/* Actions Bar */}

          <div className="flex items-center gap-3">

            <button

              onClick={handleLike}

              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${

                isLiked ? 'bg-rose-500/10 text-rose-500 font-bold' : 'opacity-70 hover:opacity-100'

              }`}

            >

              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />

              <span>{likesCount}</span>

            </button>



            <button

              onClick={handleSave}

              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${

                isSaved ? 'bg-amber-500/10 text-amber-500 font-bold' : 'opacity-70 hover:opacity-100'

              }`}

            >

              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />

              <span>{isSaved ? 'Saved' : 'Save'}</span>

            </button>

          </div>

        </div>

      </header>



      {/* Essay Content */}

      <div className={`prose max-w-none text-base leading-relaxed font-serif space-y-6 ${

        theme === 'dark' ? 'text-gray-200' : 'text-gray-800'

      }`}>

        {post.content ? (

          post.content.split('\n\n').map((paragraph, idx) => (

            <p key={idx}>{paragraph}</p>

          ))

        ) : (

          <p>{post.excerpt}</p>

        )}

      </div>



      {/* Author Card Footer */}

      <div className={`p-6 rounded-3xl border transition-all ${

        theme === 'dark' ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-black/10'

      }`}>

        <div className="flex items-center justify-between gap-4">

          <div>

            <h3 className="font-serif text-lg font-bold">

              <Link to={`/author/${post.username}`}>{post.display_name || post.username}</Link>

            </h3>

            <p className="text-xs opacity-70 mt-1 max-w-md">{post.bio || 'Author on JamBlog.'}</p>

          </div>



          <button

            onClick={handleFollowAuthor}

            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition ${

              isFollowing

                ? 'bg-emerald-600 text-white'

                : 'bg-brand-terracotta text-white hover:bg-brand-terracotta/90'

            }`}

          >

            {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}

            <span>{isFollowing ? 'Following' : 'Follow'}</span>

          </button>

        </div>

      </div>



      {/* Comments Section */}

      <section className="space-y-6 pt-6 border-t border-current/10">

        <div className="flex items-center gap-2 font-serif text-xl font-bold">

          <MessageSquare className="w-5 h-5 text-brand-terracotta" />

          <h2>Discussion ({comments.length})</h2>

        </div>



        {/* Comment Input */}

        <form onSubmit={handleAddComment} className="flex gap-2">

          <input

            type="text"

            value={newComment}

            onChange={(e) => setNewComment(e.target.value)}

            placeholder="Share your thoughts on this essay..."

            className={`flex-1 px-4 py-3 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 ${

              theme === 'dark'

                ? 'bg-white/5 border-white/10 text-white placeholder-white/40'

                : 'bg-brand-cream/60 border-brand-ink/10 text-brand-ink placeholder-brand-ink/40'

            }`}

          />

          <button

            type="submit"

            className="px-5 py-3 rounded-2xl bg-brand-terracotta text-white text-xs font-bold flex items-center gap-1.5 hover:bg-brand-terracotta/90 transition"

          >

            <Send className="w-3.5 h-3.5" />

            <span>Post</span>

          </button>

        </form>



        {/* Comments List */}

        <div className="space-y-4">

          {comments.length === 0 ? (

            <p className="text-xs opacity-60">No comments yet. Start the conversation!</p>

          ) : (

            comments.map((comment) => (

              <div

                key={comment.comment_id}

                className={`p-4 rounded-2xl border text-xs space-y-1.5 ${

                  theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-black/10'

                }`}

              >

                <div className="flex justify-between items-center opacity-70">

                  <span className="font-bold">{comment.display_name || comment.username}</span>

                  <span className="text-[10px]">{new Date(comment.created_at).toLocaleDateString()}</span>

                </div>

                <p className="leading-relaxed opacity-90">{comment.content}</p>

              </div>

            ))

          )}

        </div>

      </section>

    </article>

  );

}