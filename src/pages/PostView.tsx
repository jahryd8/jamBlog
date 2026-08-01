import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Share2, 
  Bookmark, 
  Heart, 
  Clock, 
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';

export default function PostView() {
  const { id } = useParams();
  console.log("Viewing post ID:", id);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(42);

  const toggleLike = () => {
    if (liked) {
      setLikesCount(prev => prev - 1);
    } else {
      setLikesCount(prev => prev + 1);
    }
    setLiked(!liked);
  };

  return (
    <div className={`transition-colors duration-300 min-h-screen ${
      isDarkMode 
        ? 'bg-[#121212] text-[#F5F2EB]' 
        : 'bg-brand-cream text-brand-ink'
    }`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Top Control Bar */}
        <div className="flex justify-between items-center mb-10 pb-4 border-b border-current/10">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-sm font-semibold hover:text-brand-terracotta transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Studio</span>
          </Link>

          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 rounded-full transition ${
                isDarkMode 
                  ? 'bg-white/10 hover:bg-white/20 text-yellow-300' 
                  : 'bg-brand-ink/5 hover:bg-brand-ink/10 text-brand-ink'
              }`}
              title="Toggle Reading Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Poster Generator Shortcut */}
            <Link 
              to="/create?excerpt=brand-identity"
              className="flex items-center gap-2 bg-brand-terracotta text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-brand-terracotta/90 transition shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Visual Excerpt</span>
            </Link>
          </div>
        </div>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center space-x-3 mb-4">
            <span className="bg-brand-ochre/20 text-brand-ink dark:text-brand-ochre text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Brand Strategy
            </span>
            <span className="text-xs text-current/60 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> 5 min read
            </span>
          </div>

          <h1 className="font-serif text-4xl md:text-6xl font-bold leading-tight mb-6">
            A Blog by Me: Constructing an Authentic Brand Identity
          </h1>

          <div className="flex items-center justify-between py-4 border-y border-current/10">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-brand-ink text-brand-cream dark:bg-brand-cream dark:text-brand-ink flex items-center justify-center font-serif text-lg font-bold">
                JD
              </div>
              <div>
                <p className="font-bold text-sm">Jaheim Deandre Ryder</p>
                <p className="text-xs text-current/60">Published on August 1, 2026</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  liked 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-current/5 hover:bg-current/10'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </button>
              <button className="p-2 rounded-full bg-current/5 hover:bg-current/10 transition">
                <Bookmark className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-full bg-current/5 hover:bg-current/10 transition">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Article Body Content (Matching your visual mockups) */}
        <article className="prose prose-lg max-w-none font-sans text-base md:text-lg leading-relaxed space-y-8">
          
          {/* Paragraph Block 1 */}
          <div className={`p-8 rounded-3xl transition ${
            isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white/70 shadow-sm border border-brand-ink/5'
          }`}>
            <p>
              As we've already mentioned, brand identity is how a brand wants to be perceived by consumers. It differs from brand image, which is how the brand is actually perceived. Many brands base their identity on what their competitors do (imitation) or short-term market trends, which makes them vulnerable to becoming generic, indistinguishable, and lacking clear and meaningful audience connection.
            </p>
          </div>

          {/* Highlight Quote Block */}
          <blockquote className="my-8 p-8 border-l-4 border-brand-terracotta bg-brand-terracotta/10 rounded-r-3xl font-serif italic text-xl md:text-2xl text-current">
            "Brand identity is crucial because it gives entrepreneurs and brand strategists the power to choose and construct an authentic identity."
          </blockquote>

          {/* Editorial Grid / Key Takeaways Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
            <div className={`p-8 rounded-3xl ${
              isDarkMode ? 'bg-[#1E1E1E]' : 'bg-brand-sage/30 border border-brand-sage'
            }`}>
              <h3 className="font-serif text-xl font-bold mb-3">Humanizing the Brand</h3>
              <p className="text-sm md:text-base text-current/80">
                Providing a brand with specific character traits makes it more human. A clearly defined brand personality generates attachment among its audience. Consumers feel concerned by its behavior and values, just like they would with a person.
              </p>
            </div>

            <div className={`p-8 rounded-3xl ${
              isDarkMode ? 'bg-[#1E1E1E]' : 'bg-brand-sky/30 border border-brand-sky'
            }`}>
              <h3 className="font-serif text-xl font-bold mb-3">Psychological Function</h3>
              <p className="text-sm md:text-base text-current/80">
                According to branding expert Jean-Noël Kapferer: "brand personality fulfills a psychological function. It allows consumers to either identify with it, or to project themselves into it."
              </p>
            </div>
          </div>

        </article>

      </div>
    </div>
  );
}