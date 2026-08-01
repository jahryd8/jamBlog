import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
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
  const [title, setTitle] = useState("The Psychology of Authentic Writing");
  const [content, setContent] = useState(
    "In an era dominated by 15-second clips and algorithmic feeds, deep writing gives us the space to process nuanced thoughts. Providing a brand or person with specific character traits makes it more human. A clearly defined personality generates deep attachment among its audience."
  );
  const [highlightQuote, setHighlightQuote] = useState(
    "In an era dominated by 15-second clips, deep writing gives us the space to process nuanced thoughts."
  );
  const [isPrivate, setIsPrivate] = useState(false);
  const [posterTheme, setPosterTheme] = useState<'terracotta' | 'ink' | 'ochre' | 'sage'>('terracotta');
  const [isGenerating, setIsGenerating] = useState(false);

  const posterRef = useRef<HTMLDivElement>(null);

  // Generate PNG Blob helper
  const generatePosterBlob = async () => {
    if (!posterRef.current) return null;
    const dataUrl = await toPng(posterRef.current, { cacheBust: true, pixelRatio: 2 });
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  // 1. Download Poster Function
  const handleDownloadPoster = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePosterBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `jamblog-poster-${Date.now()}.png`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error('Failed to generate poster image:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. Native Web Share API (Instagram, WhatsApp, Mobile Share Sheet)
  const handleNativeShare = async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePosterBlob();
      if (!blob) return;

      const file = new File([blob], 'jamblog-poster.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: title,
          text: `"${highlightQuote}" — Read more on JamBlog`,
          files: [file],
        });
      } else {
        alert("Native image sharing isn't supported on this desktop browser. Try downloading the PNG or sharing to X!");
      }
    } catch (err) {
      console.error('Error sharing content:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Direct Share to X (Twitter) Intent
  const handleShareToX = () => {
    const text = encodeURIComponent(`"${highlightQuote}"\n\nRead full essay on JamBlog:`);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank');
  };

  const themeStyles = {
    terracotta: 'bg-[#E85D04] text-white',
    ink: 'bg-[#1A1A1A] text-[#FDFBF7]',
    ochre: 'bg-[#D4A373] text-[#1A1A1A]',
    sage: 'bg-[#D8E2DC] text-[#1A1A1A]',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-4 border-b border-brand-ink/10">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-ink">Author Studio</h1>
          <p className="text-xs md:text-sm text-brand-ink/60">Craft long-form essays & generate visual social media posters.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsPrivate(!isPrivate)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition border ${
              isPrivate 
                ? 'bg-brand-ink text-brand-cream border-brand-ink' 
                : 'bg-white text-brand-ink border-brand-ink/20 hover:bg-brand-ink/5'
            }`}
          >
            {isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
            <span>{isPrivate ? 'Private Essay' : 'Public Essay'}</span>
          </button>

          <button className="bg-brand-terracotta text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-brand-terracotta/90 transition shadow-sm">
            Publish Post
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Essay Editor */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-brand-ink/10 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-ink/60 mb-2">
                Article Title
              </label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your essay a title..."
                className="w-full text-2xl font-serif font-bold bg-transparent border-b border-brand-ink/10 pb-2 focus:outline-none focus:border-brand-terracotta transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-ink/60 mb-2">
                Full Article Content
              </label>
              <textarea 
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your long-form thoughts here..."
                className="w-full text-sm leading-relaxed bg-brand-cream/50 p-4 rounded-2xl border border-brand-ink/10 focus:outline-none focus:border-brand-terracotta transition resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-terracotta mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Featured Excerpt for Poster</span>
              </label>
              <textarea 
                rows={3}
                value={highlightQuote}
                onChange={(e) => setHighlightQuote(e.target.value)}
                placeholder="Select or type the key takeaway phrase for social media export..."
                className="w-full text-sm font-serif italic bg-brand-terracotta/5 p-4 rounded-2xl border border-brand-terracotta/20 focus:outline-none focus:border-brand-terracotta transition"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Poster Canvas & Share Options */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-brand-ink/10 shadow-sm flex flex-col items-center">
            
            {/* Theme Selector */}
            <div className="w-full flex justify-between items-center mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-ink/60 flex items-center gap-1.5">
                <Palette className="w-4 h-4" /> Poster Theme
              </span>
              <div className="flex space-x-2">
                {(['terracotta', 'ink', 'ochre', 'sage'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setPosterTheme(theme)}
                    className={`w-6 h-6 rounded-full border-2 transition ${
                      theme === 'terracotta' ? 'bg-[#E85D04]' :
                      theme === 'ink' ? 'bg-[#1A1A1A]' :
                      theme === 'ochre' ? 'bg-[#D4A373]' : 'bg-[#D8E2DC]'
                    } ${posterTheme === theme ? 'border-brand-ink scale-110' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>

            {/* Live Poster Canvas */}
            <div className="w-full flex justify-center py-2">
              <div 
                ref={posterRef}
                className={`w-[270px] h-[480px] p-6 rounded-3xl flex flex-col justify-between shadow-2xl transition-all duration-300 ${themeStyles[posterTheme]}`}
              >
                <div className="flex justify-between items-center border-b border-current/20 pb-3">
                  <span className="font-serif font-bold text-lg tracking-tight">JamBlog</span>
                  <span className="text-[10px] font-sans uppercase tracking-widest opacity-75">Visual Excerpt</span>
                </div>

                <div className="my-auto space-y-4">
                  <span className="font-serif text-4xl leading-none opacity-40 block">“</span>
                  <p className="font-serif text-lg md:text-xl font-medium leading-relaxed italic -mt-4">
                    {highlightQuote || "Your featured quote will appear here..."}
                  </p>
                  <span className="font-serif text-4xl leading-none opacity-40 block text-right">”</span>
                </div>

                <div className="pt-3 border-t border-current/20 flex justify-between items-end">
                  <div>
                    <p className="font-bold text-xs truncate max-w-[150px]">{title || "Untitled Post"}</p>
                    <p className="text-[10px] opacity-75">by Jaheim Deandre</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-current/10 flex items-center justify-center font-serif text-xs font-bold">
                    JD
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Action: Download */}
            <button 
              onClick={handleDownloadPoster}
              disabled={isGenerating}
              className="w-full mt-6 bg-brand-ink text-brand-cream py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-brand-terracotta hover:text-white transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {isGenerating ? (
                <span>Generating Image...</span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Poster (PNG)</span>
                </>
              )}
            </button>

            {/* Secondary Actions: Quick Social Share Options */}
            <div className="w-full mt-4 pt-4 border-t border-brand-ink/10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-ink/50 mb-3 text-center">
                 Instant Share Options
              </p>
  
              <div className="grid grid-cols-2 gap-3">
                {/* Native Share Sheet (Mobile Apps, Instagram, WhatsApp, Mail) */}
                <button 
                  onClick={handleNativeShare}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-2 bg-brand-cream hover:bg-brand-sage/40 text-brand-ink py-2.5 px-3 rounded-2xl text-xs font-semibold border border-brand-ink/10 transition"
                  title="Share via native sheet to WhatsApp, Instagram, or Mail"
              >
                <Share2 className="w-3.5 h-3.5 text-brand-terracotta" />
                <span>Share Sheet</span>
                </button>

             {/* Direct Post Intent to X / Social */}
             <button 
               onClick={handleShareToX}
               className="flex items-center justify-center gap-2 bg-brand-cream hover:bg-brand-sky/40 text-brand-ink py-2.5 px-3 rounded-2xl text-xs font-semibold border border-brand-ink/10 transition"
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