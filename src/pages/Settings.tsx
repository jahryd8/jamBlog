import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Monitor, User } from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Account & Preferences</h1>
        <p className="text-sm opacity-70">Customize your workspace and display appearance.</p>
      </div>

      <div className="space-y-6">
        {/* Appearance Section */}
        <section className={`p-6 rounded-3xl border transition-colors shadow-sm ${
          theme === 'dark'
            ? 'bg-[#1E1E1E] border-white/10 text-white'
            : 'bg-white border-brand-ink/10 text-brand-ink'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="w-5 h-5 text-brand-terracotta" />
            <h2 className="font-serif text-xl font-bold">Appearance Theme</h2>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-medium text-sm">Application Dark Mode</p>
              <p className="text-xs opacity-70 mt-0.5">Switch between light warm editorial theme and dark mode across JamBlog.</p>
            </div>

            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition shadow-sm ${
                theme === 'dark'
                  ? 'bg-amber-400 text-black hover:bg-amber-300'
                  : 'bg-brand-ink text-brand-cream hover:bg-brand-terracotta'
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

        {/* Profile Details */}
        <section className={`p-6 rounded-3xl border transition-colors shadow-sm space-y-4 ${
          theme === 'dark'
            ? 'bg-[#1E1E1E] border-white/10 text-white'
            : 'bg-white border-brand-ink/10 text-brand-ink'
        }`}>
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-brand-terracotta" />
            <h2 className="font-serif text-xl font-bold">Author Profile</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase opacity-70 mb-1">Display Name</label>
              <input 
                type="text" 
                defaultValue="Jaheim Deandre" 
                className={`w-full text-sm p-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/10 text-white' 
                    : 'bg-brand-cream/60 border-brand-ink/10 text-brand-ink'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase opacity-70 mb-1">Bio Tagline</label>
              <input 
                type="text" 
                defaultValue="Long-form writer & web developer" 
                className={`w-full text-sm p-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50 ${
                  theme === 'dark' 
                    ? 'bg-white/5 border-white/10 text-white' 
                    : 'bg-brand-cream/60 border-brand-ink/10 text-brand-ink'
                }`}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}