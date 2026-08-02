import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { useTheme } from '../context/ThemeContext';
import { 
  Download, 
  Sparkles, 
  Lock, 
  Globe, 
  Palette,
  Share2,
  MessageSquare
} from 'lucide-react';

export default function CreateStudio() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Editor State
  const [title, setTitle] = useState('The Psychology of Authentic Writing');
  const [content, setContent] = useState(
    'In an era dominated by 15-second clips and algorithmic feeds, deep writing gives us the space to process nuanced thoughts. Providing a brand or person with specific character traits makes it more human. A clearly defined personality generates deep attachment among its audience.'
  );
  const [excerpt, setExcerpt] = useState(
    'In an era dominated by 15-second clips, deep writing gives us the space to process nuanced thoughts.'
  );
  const [isPrivate, setIsPrivate] = useState(false);

  // Poster Customization State
  const [posterStyle, setPosterStyle] = useState<'minimal' | 'bold' | 'editorial'>('minimal');
  const [isGenerating, setIsGenerating] = useState(false);

  // Ref for Poster Element (for HTML2Canvas export)
  const posterRef = useRef<HTMLDivElement>(null);

  // Export Poster as PNG
  const handleExportPoster = async () => {
    if (!posterRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-poster.png`;
      link.click();
    } catch (err) {
      console.error('Failed to generate poster:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Web Share API (Native Sheet)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      alert('Native sharing is not supported on this browser. Link copied to clipboard!');
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Share to X
  const handleShareToX = () => {
    const text = encodeURIComponent(`"${excerpt}" — from my latest essay "${title}" on JamBlog`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  // Publish Essay to Express / PostgreSQL API
  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please fill out both the title and content!');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 1, // Matches your inserted user_id in PostgreSQL
          title,
          content,
          excerpt: excerpt || title,
          is_private: isPrivate,
        }),
      });

      if (response.ok) {
        // Redirect user back to the feed to see their new post live
        navigate('/');
      } else {
        const errorData = await response.json();
        alert(`Failed to publish: ${errorData.message || 'Server error'}`);
      }
    } catch (err) {
      console.error('Publish error:', err);
      alert('Could not connect to the server. Is express running on port 5000?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`font-serif text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-brand-ink'}`}>
          Author Studio
        </h1>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-brand-ink/70'}`}>
          Craft long-form essays & generate visual social media posters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Essay & Excerpt Form */}
        <div className="lg:col-span-7 bg-[#E5E3DD] text-[#1A1A1A] p-6 rounded-3xl border border-black/10 shadow-sm space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-2">
              Article Title
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title of your essay..."
              className="w-full font-serif text-2xl font-bold bg-transparent border-b border-black/20 focus:border-brand-terracotta focus:outline-none pb-2 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40"
            />
          </div>

          {/* Full Content Area */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/60 mb-2">
              Full Article Content
            </label>
            <textarea 
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your main article text here..."
              className="w-full text-sm leading-relaxed p-4 rounded-2xl bg-white/60 border border-black/10 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50"
            />
          </div>

          {/* Featured Excerpt Input (Feeds into Poster) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-terracotta mb-2 flex items-center gap-1.5 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Featured Excerpt for Poster</span>
            </label>
            <textarea 
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Highlight a key quote or summary for social posters..."
              className="w-full font-serif text-sm italic p-4 rounded-2xl bg-white/80 border border-brand-terracotta/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:ring-2 focus:ring-brand-terracotta"
            />
          </div>

          {/* Controls: Visibility Toggle & Publish Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-black/10">
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition ${
                isPrivate 
                  ? 'bg-amber-100 text-amber-900 border-amber-300' 
                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
              }`}
            >
              {isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
              <span>{isPrivate ? 'Private Post' : 'Public Article'}</span>
            </button>

            <button 
               onClick={handlePublish}
               disabled={isSubmitting}
               className="bg-brand-terracotta hover:bg-brand-terracotta/90 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-full shadow-md transition"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Article'}
            </button>
          </div>
        </div>

        {/* Right Column: Visual Poster Generator */}
        <div className="lg:col-span-5 space-y-6">
          {/* Style Selector Toolbar */}
          <div className={`p-4 rounded-2xl border shadow-sm ${
            theme === 'dark' ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-brand-ink/10'
          }`}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-brand-terracotta" />
              <span>Poster Template Style</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['minimal', 'bold', 'editorial'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setPosterStyle(style)}
                  className={`py-2 text-xs font-semibold rounded-xl capitalize transition ${
                    posterStyle === style 
                      ? 'bg-brand-terracotta text-white shadow-sm' 
                      : theme === 'dark'
                        ? 'bg-white/5 hover:bg-white/10 text-white'
                        : 'bg-brand-cream hover:bg-brand-sage/50 text-brand-ink'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Live Rendered Canvas Poster */}
          <div 
            ref={posterRef}
            className={`p-8 rounded-3xl aspect-[4/5] flex flex-col justify-between shadow-xl border transition-all ${
              posterStyle === 'minimal' 
                ? 'bg-[#FDFBF7] text-[#1A1A1A] border-black/10' 
                : posterStyle === 'bold'
                ? 'bg-[#E85D04] text-white border-none'
                : 'bg-[#1A1A1A] text-[#FDFBF7] border-black'
            }`}
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-60 block mb-6">
                JAMBLOG ESSAY EXCERPT
              </span>
              <p className={`font-serif leading-snug ${
                posterStyle === 'bold' ? 'text-2xl font-black' : 'text-xl italic font-serif'
              }`}>
                "{excerpt || 'Your highlight quote will appear here...'}"
              </p>
            </div>

            <div className="pt-6 border-t border-current/20 flex items-center justify-between text-xs">
              <div>
                <p className="font-serif font-bold text-sm">{title || 'Untitled Essay'}</p>
                <p className="opacity-70 text-[11px]">by Jaheim Deandre</p>
              </div>
              <span className="font-bold tracking-widest text-[10px] uppercase opacity-50">
                JamBlog
              </span>
            </div>
          </div>

          {/* Download & Sharing Actions */}
          <div className={`p-4 rounded-2xl border shadow-sm ${
            theme === 'dark' ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-brand-ink/10'
          }`}>
            <button
              onClick={handleExportPoster}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-brand-ink text-brand-cream hover:bg-brand-terracotta py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider shadow transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating Poster...' : 'Download Social Poster (PNG)'}</span>
            </button>

            {/* Instant Share Options */}
            <div className="w-full mt-4 pt-4 border-t border-current/10">
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-50 mb-3 text-center">
                Instant Share Options
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleNativeShare}
                  disabled={isGenerating}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-semibold border transition ${
                    theme === 'dark'
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                      : 'bg-brand-cream hover:bg-brand-sage/40 border-brand-ink/10 text-brand-ink'
                  }`}
                  title="Share via native sheet to WhatsApp, Instagram, or Mail"
                >
                  <Share2 className="w-3.5 h-3.5 text-brand-terracotta" />
                  <span>Share Sheet</span>
                </button>

                <button 
                  onClick={handleShareToX}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-semibold border transition ${
                    theme === 'dark'
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                      : 'bg-brand-cream hover:bg-brand-sky/40 border-brand-ink/10 text-brand-ink'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
                  <span>Post to X</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}