import { useEffect, useState } from 'react';
import { X, UserMinus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import API from '../api/axios';

interface FollowedUser {
  user_id: number;
  username: string;
  display_name: string;
  bio?: string;
}

interface FollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: number;
}

export default function FollowingModal({ isOpen, onClose, userId }: FollowingModalProps) {
  const { theme } = useTheme();
  const [following, setFollowing] = useState<FollowedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const controller = new AbortController();
    setLoading(true);

    API.get(`/users/${userId}/following`, { signal: controller.signal })
      .then((res) => {
        if (Array.isArray(res.data)) setFollowing(res.data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        console.error('Error fetching following list:', err);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [isOpen, userId]);

  const handleUnfollow = async (followingId: number) => {
    try {
      const res = await API.post(`/users/${followingId}/follow`);
      const data = res.data;

      if (!data.isFollowing) {
        setFollowing((prev) => prev.filter((user) => user.user_id !== followingId));
      }
    } catch (err) {
      console.error('Failed to unfollow:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-md rounded-3xl p-6 border shadow-xl transition-all ${
          theme === 'dark'
            ? 'bg-[#1E1E1E] border-white/10 text-white'
            : 'bg-white border-black/10 text-brand-ink'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-current/10">
          <h2 className="font-serif text-xl font-bold">Following ({following.length})</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-current/10 transition opacity-70 hover:opacity-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 max-h-80 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <p className="text-center py-6 text-xs opacity-60">Loading who you follow...</p>
          ) : following.length === 0 ? (
            <p className="text-center py-6 text-xs opacity-60">
              This user is not following anyone yet!
            </p>
          ) : (
            following.map((user) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-current/5 border border-current/5"
              >
                <div>
                  <h3 className="font-bold text-sm">{user.display_name || user.username}</h3>
                  <p className="text-xs opacity-60">@{user.username}</p>
                </div>

                <button
                  onClick={() => handleUnfollow(user.user_id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Unfollow</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}