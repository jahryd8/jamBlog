import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Mail, 
  Heart, 
  ArrowUpRight,
  Send,
  Code2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Footer() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <footer 
      className={`relative border-t transition-colors duration-300 overflow-hidden ${
        isDark 
          ? 'bg-[#0B0C10] text-[#E0E6ED] border-white/10' 
          : 'bg-[#F4F2EC] text-[#1A1A1A] border-black/10'
      }`}
    >
      {/* Background Cosmic Accents */}
      {isDark && (
        <>
          {/* Ambient Purple/Indigo Nebula Glow */}
          <div className="absolute top-0 left-1/4 -translate-y-1/2 w-96 h-96 bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-80 h-80 bg-indigo-900/15 rounded-full blur-[100px] pointer-events-none" />
          {/* Top Cosmic Gradient Divider Line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/40 via-amber-400/30 to-transparent" />
        </>
      )}

      <div className="max-w-6xl mx-auto px-4 pt-16 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-12 border-b border-current/10">
          
          {/* Brand & Mission Statement */}
          <div className="md:col-span-5 lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <span className={`font-serif text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-brand-ink'}`}>
                Jam<span className="text-amber-500">Blog</span>
              </span>
              <Sparkles className="w-4 h-4 text-purple-400 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            </Link>
            <p className={`text-sm leading-relaxed max-w-sm ${isDark ? 'text-gray-400' : 'text-black/70'}`}>
              A serene, long-form publication studio for modern thinkers, developers, and writers.
            </p>
            
            {/* Direct GitHub Repo Link */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com/jahryd8/jamBlog"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Repository"
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-semibold transition-all duration-300 ${
                  isDark 
                    ? 'bg-white/5 border-white/10 hover:bg-purple-500/20 hover:border-purple-400/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] text-gray-300 hover:text-white' 
                    : 'bg-white border-black/10 hover:bg-black/5 hover:border-black/30 text-gray-700 hover:text-black'
                }`}
              >
                <Code2 className="w-4 h-4 text-amber-500" />
                <span>Source Code</span>
                <ArrowUpRight className="w-3 h-3 opacity-60" />
              </a>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 lg:col-span-2 space-y-3">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-purple-400' : 'text-amber-700'}`}>
              Explore
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Feed', path: '/feed' },
                { label: 'Studio Editor', path: '/create' },
                { label: 'Dashboard', path: '/' },
                { label: 'Settings', path: '/settings' },
              ].map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`inline-flex items-center gap-1 transition-colors ${
                      isDark ? 'text-gray-400 hover:text-white' : 'text-black/70 hover:text-black'
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="md:col-span-4 lg:col-span-3 space-y-3">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-purple-400' : 'text-amber-700'}`}>
              Get in Touch
            </h3>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-black/70'}`}>
              Have feedback, bug reports, or business inquiries? Reach out directly.
            </p>
            
            <a
              href="mailto:jahwebproductions+jamblogmedia@gmail.com"
              className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-300 ${
                isDark
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-400/40 text-purple-200 hover:shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                  : 'bg-white border-black/10 hover:bg-black/5 text-black'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">Contact Support</span>
              <ArrowUpRight className="w-3 h-3 opacity-60 shrink-0" />
            </a>
          </div>

          {/* Dispatch / Newsletter Box */}
          <div className="md:col-span-12 lg:col-span-3 space-y-3">
            <div className={`p-4 rounded-2xl border ${
              isDark 
                ? 'bg-white/5 border-white/10 backdrop-blur-md' 
                : 'bg-white border-black/10'
            }`}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Stay Curious</span>
              </p>
              <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-black/70'}`}>
                Get exceptional dispatches directly to your inbox.
              </p>
              
              <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-1.5">
                <input 
                  type="email" 
                  placeholder="your@email.com"
                  className={`w-full text-xs px-3 py-2 rounded-lg border focus:outline-none ${
                    isDark 
                      ? 'bg-black/40 border-white/15 text-white placeholder:text-gray-500 focus:border-purple-400' 
                      : 'bg-gray-50 border-black/15 text-black placeholder:text-gray-400 focus:border-amber-600'
                  }`}
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="p-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold transition-all hover:shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Bottom Credits */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className={`flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-black/60'}`}>
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
            <span>by</span>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>jahry8</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Systems Nominal
            </span>
            <span className={isDark ? 'text-gray-500' : 'text-black/40'}>
              © {new Date().getFullYear()} JamBlog. All rights reserved.
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}