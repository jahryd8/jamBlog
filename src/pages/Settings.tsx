import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { 
  Moon, 
  Sun, 
  Monitor, 
  User, 
  ExternalLink, 
  Mail, 
  Send, 
  //Sparkles, 
  MessageSquare, 
  Bug, 
  HelpCircle,
  CheckCircle2 
} from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const currentUsername = 'jaheim_dev';

  // Contact Form State
  const [inquiryType, setInquiryType] = useState<'feedback' | 'bug' | 'general'>('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      alert('Please complete the subject and message fields.');
      return;
    }

    setIsSending(true);

    // Simulate dispatch/API call
    setTimeout(() => {
      setIsSending(false);
      setSubmitted(true);
      setSubject('');
      setMessage('');
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold">Account & Preferences</h1>
        <p className="text-sm opacity-70">Customize your workspace and reach out for assistance.</p>
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

        {/* Profile Details Section */}
        <section
          className={`p-6 rounded-3xl border transition-colors shadow-sm space-y-6 ${
            theme === 'dark'
              ? 'bg-[#1E1E1E] border-white/10 text-white'
              : 'bg-white border-brand-ink/10 text-brand-ink'
          }`}
        >
          {/* Section Header with Public Profile Link */}
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

            <Link
              to={`/author/${currentUsername}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-current/20 hover:border-amber-500 hover:text-amber-500 transition shrink-0"
            >
              <span>View Public Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase opacity-70 mb-1">
                Display Name
              </label>
              <input
                type="text"
                defaultValue="Jaheim Deandre"
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
                defaultValue="Long-form writer & web developer"
                className={`w-full text-sm p-3 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white'
                    : 'bg-brand-cream/60 border-brand-ink/10 text-brand-ink'
                }`}
              />
            </div>
          </div>
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
              {/* Category Options */}
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

              {/* Email & Subject */}
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

              {/* Message Body */}
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

              {/* Submit & Direct Email Reference */}
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
      </div>
    </div>
  );
}