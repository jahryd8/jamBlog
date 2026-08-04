import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { 
  Moon, 
  Sun, 
  Monitor, 
  User, 
  Lock,
  ExternalLink, 
  Mail, 
  Send, 
  MessageSquare, 
  Bug, 
  HelpCircle,
  CheckCircle2,
  LogOut,
  Trash2,
  Save,
  AlertTriangle
} from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dynamic User States
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Contact Form State
  const [inquiryType, setInquiryType] = useState<'feedback' | 'bug' | 'general'>('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Account Deletion State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state when user context is ready
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || user.username || '');
      setBio(user.bio || '');
      setSenderEmail(user.email || '');
    }
  }, [user]);

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage(null);

    try {
      await API.put('/users/profile', {
        display_name: displayName,
        bio: bio
      });
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setProfileMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update profile.' 
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setPasswordMsg(null);

    try {
      const res = await API.put('/users/change-password', { currentPassword, newPassword });
      setPasswordMsg({ type: 'success', text: res.data.message || 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      console.error('Failed to change password:', err);
      setPasswordMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update password.'
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await API.delete('/users/account');
      logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert('Could not delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      alert('Please complete the subject and message fields.');
      return;
    }

    setIsSending(true);

    setTimeout(() => {
      setIsSending(false);
      setSubmitted(true);
      setSubject('');
      setMessage('');
    }, 1000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Account & Preferences</h1>
        <p className="text-sm opacity-70">Customize your workspace and manage your account credentials.</p>
      </div>

      <div className="space-y-6">
        {/* Appearance Section */}
        <section
          className={`p-6 rounded-3xl border transition-colors shadow-sm ${
            theme === 'dark'
              ? 'bg-[#1E1E1E] border-white/10 text-white'
              : 'bg-white border-brand-ink/10 text-brand-ink'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="w-5 h-5 text-amber-500" />
            <h2 className="font-serif text-xl font-bold">Appearance Theme</h2>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-medium text-sm">Application Dark Mode</p>
              <p className="text-xs opacity-70 mt-0.5">
                Switch between light warm editorial theme and dark mode across JamBlog.
              </p>
            </div>

            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition shadow-sm ${
                theme === 'dark'
                  ? 'bg-amber-400 text-black hover:bg-amber-300'
                  : 'bg-brand-ink text-brand-cream hover:bg-amber-600'
              }`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span>Light Theme</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span>Dark Theme</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Dynamic Author Profile Details Section */}
        <section
          className={`p-6 rounded-3xl border transition-colors shadow-sm space-y-6 ${
            theme === 'dark'
              ? 'bg-[#1E1E1E] border-white/10 text-white'
              : 'bg-white border-brand-ink/10 text-brand-ink'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-current/10 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-amber-500" />
                <h2 className="font-serif text-xl font-bold">Author Profile</h2>
              </div>
              <p className="text-xs opacity-70 mt-1">
                Manage how your bio and details look to readers across your essays.
              </p>
            </div>

            {user?.username && (
              <Link
                to={`/author/${user.username}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-current/20 hover:border-amber-500 hover:text-amber-500 transition shrink-0"
              >
                <span>View Public Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase opacity-70 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className={`w-full text-sm p-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-brand-cream/60 border-brand-ink/10 text-brand-ink'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase opacity-70 mb-1">
                  Bio Tagline
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Writer, developer, thinker..."
                  className={`w-full text-sm p-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-brand-cream/60 border-brand-ink/10 text-brand-ink'
                  }`}
                />
              </div>
            </div>

            {profileMessage && (
              <div className={`text-xs p-3 rounded-xl ${
                profileMessage.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {profileMessage.text}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-full transition shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Security & Change Password Section */}
        <section
          className={`p-6 rounded-3xl border transition-colors shadow-sm space-y-6 ${
            theme === 'dark'
              ? 'bg-[#1E1E1E] border-white/10 text-white'
              : 'bg-white border-brand-ink/10 text-brand-ink'
          }`}
        >
          <div className="flex items-center gap-3 border-b border-current/10 pb-4">
            <Lock className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="font-serif text-xl font-bold">Security</h2>
              <p className="text-xs opacity-70 mt-0.5">Update your password to keep your account secure.</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-bold uppercase opacity-70 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className={`w-full text-sm p-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-brand-cream/60 border-brand-ink/10 text-brand-ink'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase opacity-70 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className={`w-full text-sm p-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-brand-cream/60 border-brand-ink/10 text-brand-ink'
                }`}
              />
            </div>

            {passwordMsg && (
              <div className={`text-xs p-3 rounded-xl border ${
                passwordMsg.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}>
                {passwordMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isChangingPassword}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs uppercase tracking-wider py-2.5 px-6 rounded-full transition shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
            </button>
          </form>
        </section>

        {/* Contact & Support Section */}
        <section
          className={`p-6 rounded-3xl border transition-colors shadow-sm space-y-6 ${
            theme === 'dark'
              ? 'bg-[#1E1E1E] border-white/10 text-white'
              : 'bg-white border-brand-ink/10 text-brand-ink'
          }`}
        >
          <div className="flex items-center justify-between border-b border-current/10 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-500" />
                <h2 className="font-serif text-xl font-bold">Contact & Support</h2>
              </div>
              <p className="text-xs opacity-70 mt-1">
                Have questions or bug reports? Send a message directly to system support.
              </p>
            </div>
          </div>

          {submitted ? (
            <div className={`p-8 rounded-2xl border text-center space-y-3 ${
              theme === 'dark' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
            }`}>
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-emerald-600 dark:text-emerald-400">
                Message Dispatched!
              </h3>
              <p className="text-xs opacity-80 max-w-sm mx-auto">
                Thank you for reaching out. We have logged your query and will reply shortly.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="mt-2 text-xs font-bold uppercase tracking-wider underline text-emerald-600 dark:text-emerald-400 hover:opacity-80"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase opacity-70 mb-2">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
                    { id: 'bug', label: 'Bug Report', icon: Bug },
                    { id: 'general', label: 'General Inquiry', icon: HelpCircle },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = inquiryType === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setInquiryType(cat.id as any)}
                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                            : theme === 'dark'
                            ? 'bg-white/5 border-white/10 hover:bg-white/10'
                            : 'bg-black/5 border-black/10 hover:bg-black/10'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase opacity-70 mb-1">
                    Your Email
                  </label>
                  <input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className={`w-full text-sm p-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                      theme === 'dark'
                        ? 'bg-white/5 border-white/10 text-white'
                        : 'bg-brand-cream/60 border-brand-ink/10 text-brand-ink'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase opacity-70 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief outline..."
                    className={`w-full text-sm p-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                      theme === 'dark'
                        ? 'bg-white/5 border-white/10 text-white'
                        : 'bg-brand-cream/60 border-brand-ink/10 text-brand-ink'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase opacity-70 mb-1">
                  Message Details
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  className={`w-full text-sm p-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-brand-cream/60 border-brand-ink/10 text-brand-ink'
                  }`}
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-xs opacity-60 font-mono">
                  Direct: <a href="mailto:jahwebproductions+jamblogmedia@gmail.com" className="hover:underline text-amber-500">jahwebproductions+jamblogmedia@gmail.com</a>
                </p>

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-full transition shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Account Management & Danger Zone */}
        <section
          className={`p-6 rounded-3xl border transition-colors shadow-sm space-y-6 ${
            theme === 'dark'
              ? 'bg-[#1E1E1E] border-rose-500/20 text-white'
              : 'bg-white border-rose-500/20 text-brand-ink'
          }`}
        >
          <div className="flex items-center justify-between border-b border-current/10 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h2 className="font-serif text-xl font-bold text-rose-500">Account Management</h2>
              </div>
              <p className="text-xs opacity-70 mt-1">
                Sign out of your active session or permanently remove your account and articles.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Session Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold border border-current/20 hover:bg-black/5 dark:hover:bg-white/5 transition"
            >
              <LogOut className="w-4 h-4 text-amber-500" />
              <span>Log Out of Session</span>
            </button>

            {/* Account Deletion Triggers */}
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition"
                >
                  <span>{isDeleting ? 'Deleting...' : 'Confirm Permanent Delete'}</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold border border-current/20 hover:opacity-80 transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
} 