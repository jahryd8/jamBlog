import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { toBlob } from 'html-to-image';
import API from '../api/axios';
import { useTheme } from '../context/ThemeContext';
import { 
  Download, 
  Sparkles, 
  Lock, 
  Globe, 
  Palette,
  Share2,
  MessageSquare,
  Save,
  ArrowLeft,
  FileText,
  Send
} from 'lucide-react';

export default function CreateStudio() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  // Separate Action Loading States
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  
  // Editor State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  // Poster Customization State
  const [posterStyle, setPosterStyle] = useState<'minimal' | 'bold' | 'editorial'>('minimal');
  const [isGenerating, setIsGenerating] = useState(false);

  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) {
      setTitle('The Psychology of Authentic Writing');
      setContent(
        'In an era dominated by 15-second clips and algorithmic feeds, deep writing gives us the space to process nuanced thoughts.'
      );
      setExcerpt('In an era dominated by 15-second clips, deep writing gives us the space to process nuanced thoughts.');
      setIsDraft(false);
      setIsPrivate(false);
      return;
    }

    const fetchPostToEdit = async () => {
      setIsLoadingPost(true);
      try {
        const response = await API.get(`/posts/${id}`);
        const postData = response.data;
        setTitle(postData.title || '');
        setContent(postData.content || '');
        setExcerpt(postData.excerpt || '');
        setIsPrivate(postData.is_private ?? false);
        setIsDraft(postData.is_draft ?? false);
      } catch (err) {
        console.error('Error fetching essay to edit:', err);
        alert('Could not fetch essay data for editing.');
        navigate('/dashboard');
      } finally {
        setIsLoadingPost(false);
      }
    };

    fetchPostToEdit();
  }, [id, navigate]);

  // Handle Export Poster image via html2canvas
  const handleExportPoster = async () => {
  if (!posterRef.current) return;
  setIsGenerating(true);

  try {
    const element = posterRef.current;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: null,
      onclone: (clonedDoc) => {
        const clonedPoster = clonedDoc.querySelector('[data-poster-root]') as HTMLElement;
        if (!clonedPoster) return;

        // 1. Force explicit hex base styling on root poster container
        if (posterStyle === 'minimal') {
          clonedPoster.style.backgroundColor = '#FDFBF7';
          clonedPoster.style.color = '#1A1A1A';
        } else if (posterStyle === 'bold') {
          clonedPoster.style.backgroundColor = '#E85D04';
          clonedPoster.style.color = '#FFFFFF';
        } else {
          clonedPoster.style.backgroundColor = '#1A1A1A';
          clonedPoster.style.color = '#FDFBF7';
        }

        // 2. Walk every child node and purge oklab/oklch values across all color properties
        const allNodes = [clonedPoster, ...Array.from(clonedPoster.querySelectorAll('*'))];
        
        allNodes.forEach((node) => {
          const el = node as HTMLElement;
          const computed = window.getComputedStyle(el);

          // Purge box shadows using modern color functions
          if (computed.boxShadow.includes('oklab') || computed.boxShadow.includes('oklch')) {
            el.style.boxShadow = 'none';
          }

          // Convert borders containing oklab to standard RGBA
          if (computed.borderColor.includes('oklab') || computed.borderColor.includes('oklch')) {
            el.style.borderColor = 'rgba(128, 128, 128, 0.2)';
          }

          // Strip outline colors
          if (computed.outlineColor.includes('oklab') || computed.outlineColor.includes('oklch')) {
            el.style.outlineColor = 'transparent';
          }

          // Override text colors if evaluating to oklab
          if (computed.color.includes('oklab') || computed.color.includes('oklch')) {
            el.style.color = posterStyle === 'bold' ? '#FFFFFF' : posterStyle === 'editorial' ? '#FDFBF7' : '#1A1A1A';
          }
        });
      },
    });

    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    const safeTitle = (title || 'untitled-essay')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    link.href = image;
    link.download = `${safeTitle}-poster.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to generate poster:', err);
    alert('Could not generate image poster.');
  } finally {
    setIsGenerating(false);
  }
};

  // Web Share API support
const handleNativeShare = async () => {
  if (!posterRef.current) return;
  setIsGenerating(true);

  try {
    // Generate PNG blob using native SVG embedding (bypasses oklab CSS parser bugs)
    const blob = await toBlob(posterRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      filter: (node) => {
        // Exclude script tags or iframe elements if any exist
        return node.tagName !== 'SCRIPT';
      },
    });

    if (!blob) {
      setIsGenerating(false);
      return;
    }

    const file = new File([blob], `${title || 'essay'}-poster.png`, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: title || 'JamBlog Poster',
        text: excerpt || title,
        files: [file],
      });
    } else if (navigator.share) {
      await navigator.share({
        title: title || 'JamBlog Poster',
        text: excerpt || title,
        url: window.location.href,
      });
    } else {
      alert('Native sharing is not supported in this browser. Use the download button instead.');
    }
  } catch (err) {
    console.error('Native share failed:', err);
  } finally {
    setIsGenerating(false);
  }
};

  // Share link directly to X (Twitter)
  const handleShareToX = () => {
    const text = encodeURIComponent(`"${excerpt || title}" — read more on JamBlog:`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleSave = async (saveAsDraft: boolean) => {
    if (!title.trim() || !content.trim()) {
      alert('Please fill out both the title and content!');
      return;
    }

    if (saveAsDraft) {
      setIsSavingDraft(true);
    } else {
      setIsPublishing(true);
    }

    const endpoint = isEditMode ? `/posts/${id}` : '/posts';
    const finalIsPrivate = saveAsDraft ? true : isPrivate;

    const payload = {
      title: title.trim(),
      content: content.trim(),
      excerpt: (excerpt || title).trim(),
      is_private: finalIsPrivate,
      is_draft: saveAsDraft,
    };

    try {
      if (isEditMode) {
        await API.put(endpoint, payload);
      } else {
        await API.post(endpoint, payload);
      }

      setIsDraft(saveAsDraft);
      setIsPrivate(finalIsPrivate);

      const toastMessage = saveAsDraft
        ? 'Draft saved successfully!'
        : isEditMode
        ? 'Essay updated successfully!'
        : 'Essay published successfully!';

      navigate('/dashboard', { state: { message: toastMessage } });
    } catch (err: any) {
      console.error('Save error details:', err.response?.data || err);
      const serverMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      alert(`Failed to save (500 Server Error): ${serverMsg}`);
    } finally {
      setIsSavingDraft(false);
      setIsPublishing(false);
    }
  };

  if (isLoadingPost) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="font-serif text-sm opacity-60">Loading essay details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`font-serif text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-brand-ink'}`}>
            {isEditMode ? 'Edit Essay' : 'Author Studio'}
          </h1>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-brand-ink/70'}`}>
            {isEditMode
              ? 'Update your published essay or modify its excerpt and visual poster.'
              : 'Craft long-form essays & generate visual social media posters.'}
          </p>
        </div>

        {isEditMode && (
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition cursor-pointer ${
              theme === 'dark' ? 'border-white/10 hover:bg-white/10' : 'border-black/10 hover:bg-black/5'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel Edit</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Editor */}
        <div className="lg:col-span-7 bg-[#E5E3DD] text-[#1A1A1A] p-6 rounded-3xl border border-black/10 shadow-sm space-y-6">
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

          <div>
            <label className="block text-xs uppercase tracking-wider text-brand-terracotta mb-2 font-bold flex items-center gap-1.5">
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

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-black/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  isPrivate 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                }`}
              >
                {isPrivate ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                <span>{isPrivate ? 'Private Post' : 'Public Article'}</span>
              </button>

              {isDraft && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 border border-gray-300">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Draft Mode</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSavingDraft || isPublishing}
                className="flex items-center gap-1.5 bg-black/10 hover:bg-black/20 text-[#1A1A1A] disabled:opacity-50 font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-full transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
              </button>

              <button 
                type="button"
                onClick={() => handleSave(false)}
                disabled={isSavingDraft || isPublishing}
                className="flex items-center gap-1.5 bg-brand-terracotta hover:bg-brand-terracotta/90 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-full shadow-md transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isPublishing
                    ? 'Processing...'
                    : isEditMode
                    ? 'Update Essay'
                    : 'Publish Article'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Poster Preview & Sharing */}
        <div className="lg:col-span-5 space-y-6">
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
                  type="button"
                  onClick={() => setPosterStyle(style)}
                  className={`py-2 text-xs font-semibold rounded-xl capitalize transition cursor-pointer ${
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

          <div 
            ref={posterRef}
            data-poster-root="true"
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
                posterStyle === 'bold' ? 'text-2xl font-black' : 'text-xl italic'
              }`}>
                "{excerpt || 'Your highlight quote will appear here...'}"
              </p>
            </div>

            <div className="pt-6 border-t border-black/20 flex items-center justify-between text-xs">
              <div>
                <p className="font-serif font-bold text-sm">{title || 'Untitled Essay'}</p>
                <p className="opacity-70 text-[11px]">by Author</p>
              </div>
              <span className="font-bold tracking-widest text-[10px] uppercase opacity-50">
                JamBlog
              </span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border shadow-sm space-y-4 ${
            theme === 'dark' ? 'bg-[#1E1E1E] border-white/10' : 'bg-white border-brand-ink/10'
          }`}>
            <button
              type="button"
              onClick={handleExportPoster}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-brand-ink text-brand-cream hover:bg-brand-terracotta py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider shadow transition disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Generating Poster...' : 'Download Social Poster (PNG)'}</span>
            </button>

            {/* Instant Share Options */}
            <div className="w-full pt-3 border-t border-black/10 dark:border-white/10">
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-50 mb-3 text-center">
                Instant Share Options
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={handleNativeShare}
                  disabled={isGenerating}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-semibold border transition cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                      : 'bg-brand-cream hover:bg-brand-sage/40 border-brand-ink/10 text-brand-ink'
                  }`}
                  title="Share via native sheet"
                >
                  <Share2 className="w-3.5 h-3.5 text-brand-terracotta" />
                  <span>Share Sheet</span>
                </button>

                <button 
                  type="button"
                  onClick={handleShareToX}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl text-xs font-semibold border transition cursor-pointer ${
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