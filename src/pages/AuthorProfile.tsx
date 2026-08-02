import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { UserPlus, UserCheck, MapPin, BookOpen, Users } from 'lucide-react';
import FollowingModal from '../components/FollowingModal';

interface Profile {
  user_id: number;
  username: string;
  display_name: string;
  bio: string;
  location: string;
  followers_count: string;
  following_count: string;
  is_following: boolean;
}

interface Post {
  post_id: number;
  title: string;
  excerpt: string;
  created_at: string;
}

export default function AuthorProfile() {
  const { username } = useParams();
  const { theme } = useTheme();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/users/${username}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setIsFollowing(data.profile.is_following);
          setFollowersCount(parseInt(data.profile.followers_count, 10) || 0);
          setPosts(data.posts || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading author profile:', err);
        setLoading(false);
      });
  }, [username]);

  const handleToggleFollow = async () => {
    if (!profile) return;

    try {
      const res = await fetch(`http://localhost:5000/api/users/${profile.user_id}/follow`, {
        method: 'POST',
      });
      const data = await res.json();

      setIsFollowing(data.isFollowing);
      setFollowersCount((prev) => (data.isFollowing ? prev + 1 : prev - 1));
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  if (loading) {
    return <div className="p-12 text-center font-serif opacity-70">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="p-12 text-center font-serif text-xl">Author not found!</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Header Card */}
      <div
        className={`p-8 rounded-3xl border transition-all shadow-sm ${
          theme === 'dark'
            ? 'bg-[#1E1E1E] border-white/10 text-white'
            : 'bg-white border-black/10 text-brand-ink'
        }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-bold">{profile.display_name}</h1>
            <p className="text-xs font-mono opacity-60">@{profile.username}</p>
            <p className="text-sm opacity-80 max-w-lg leading-relaxed">
              {profile.bio || 'No bio provided yet.'}
            </p>

            {profile.location && (
              <div className="flex items-center gap-1.5 text-xs opacity-60 pt-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>{profile.location}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleToggleFollow}
            className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider shadow-md transition ${
              isFollowing
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-brand-terracotta hover:bg-brand-terracotta/90 text-white'
            }`}
          >
            {isFollowing ? (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Following</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Follow Author</span>
              </>
            )}
          </button>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 pt-6 mt-6 border-t border-current/10 text-xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-terracotta" />
            <span className="font-bold text-sm">{followersCount}</span>
            <span className="opacity-60">Followers</span>
          </div>

          {/* Clickable Following Count */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 hover:text-brand-terracotta transition"
          >
            <span className="font-bold text-sm">{profile.following_count}</span>
            <span className="opacity-60 underline underline-offset-2">Following</span>
          </button>

          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-500" />
            <span className="font-bold text-sm">{posts.length}</span>
            <span className="opacity-60">Essays</span>
          </div>
        </div>
      </div>

      {/* Author's Essay Feed */}
      <div className="space-y-4">
        <h2
          className={`font-serif text-2xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-brand-ink'
          }`}
        >
          Published Essays
        </h2>

        {posts.length === 0 ? (
          <p className="opacity-60 text-sm">This author has not published any public essays yet.</p>
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
                  <Link
                    to={`/post/${post.post_id}`}
                    className="hover:text-brand-terracotta transition"
                  >
                    {post.title}
                  </Link>
                </h3>
                <p className="text-sm opacity-80 mb-6 leading-relaxed">{post.excerpt}</p>
                <div className="text-xs opacity-60 pt-4 border-t border-current/10">
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Following Modal */}
      <FollowingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}