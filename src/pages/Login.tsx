import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(emailOrUsername, password);
      navigate('/feed');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials or server error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen rounded-3xl flex items-center justify-center px-4 transition-colors ${
      isDark ? 'bg-[#121212] text-slate-100' : 'bg-[#FBF9F5] text-slate-900'
    }`}>
      <div className={`w-full max-w-md p-8 rounded-2xl border shadow-sm ${
        isDark ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-slate-200'
      }`}>
        <div className="text-center space-y-2 mb-8">
          <h1 className="font-serif text-3xl font-bold">Welcome Back</h1>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Sign in to continue reading and writing essays
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Email or Username</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="reader@example.com"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-orange-500 transition ${
                  isDark 
                    ? 'bg-[#121212] border-white/10 text-slate-100 placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border outline-none focus:ring-2 focus:ring-orange-500 transition ${
                  isDark 
                    ? 'bg-[#121212] border-white/10 text-slate-100 placeholder-slate-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>

        <p className={`text-center text-xs mt-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Don't have an account?{' '}
          <Link to="/register" className="text-orange-500 font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}