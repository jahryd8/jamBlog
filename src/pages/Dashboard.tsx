import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Share2, 
  Lock, 
  BarChart3, 
  Layout, 
  Heart, 
  FileEdit,
  Plus
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto">
      {/* User Profile Banner */}
      <section className="flex flex-col md:flex-row items-center md:items-start justify-between mb-10 gap-6">
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full bg-brand-ink flex items-center justify-center text-brand-cream text-3xl font-serif font-bold shadow-md">
            JD
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-brand-ink">Jaheim's Studio</h1>
            <p className="text-brand-ink/60 text-sm mt-1">Long-form essayist & visual journalist</p>
          </div>
        </div>

        <div className="flex space-x-8 text-center bg-white/60 backdrop-blur-sm px-6 py-3 rounded-2xl border border-brand-ink/5 shadow-sm">
          <div>
            <span className="font-serif text-2xl font-bold block text-brand-ink">10</span>
            <span className="text-xs font-medium text-brand-ink/60 uppercase tracking-wider">Followers</span>
          </div>
          <div className="border-r border-brand-ink/10"></div>
          <div>
            <span className="font-serif text-2xl font-bold block text-brand-ink">10</span>
            <span className="text-xs font-medium text-brand-ink/60 uppercase tracking-wider">Following</span>
          </div>
        </div>
      </section>

      {/* Interactive Tile Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        
        {/* Create Post Action */}
        <div 
          onClick={() => navigate('/create')}
          className="bg-brand-terracotta text-white p-6 rounded-3xl relative group hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between min-h-[200px]"
        >
          <div className="flex justify-between items-start">
            <Plus className="w-8 h-8 text-white" />
            <span className="text-xs uppercase font-bold tracking-wider bg-white/20 px-3 py-1 rounded-full">New</span>
          </div>
          <h3 className="font-serif text-2xl font-bold mt-8">Create New Post</h3>
        </div>

        {/* My Public Posts */}
        <div 
          onClick={() => navigate('/feed?filter=my-posts')}
          className="bg-brand-lavender p-6 rounded-3xl relative group hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between min-h-[200px]"
        >
          <div className="flex justify-between items-start">
            <FileText className="w-8 h-8 text-brand-ink" />
            <button className="w-8 h-8 rounded-full bg-brand-ink/10 flex items-center justify-center group-hover:bg-brand-ink group-hover:text-white transition">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <h3 className="font-serif text-2xl font-bold text-brand-ink mt-8">My Posts</h3>
        </div>

        {/* Shared / Exported Posts */}
        <div 
          onClick={() => navigate('/feed?filter=shared')}
          className="bg-brand-ochre p-6 rounded-3xl relative group hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between min-h-[200px]"
        >
          <div className="flex justify-between items-start">
            <Share2 className="w-8 h-8 text-brand-ink" />
            <button className="w-8 h-8 rounded-full bg-brand-ink/10 flex items-center justify-center group-hover:bg-brand-ink group-hover:text-white transition">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <h3 className="font-serif text-2xl font-bold text-brand-ink mt-8">Shared Posters</h3>
        </div>

        {/* Private Posts */}
        <div 
          onClick={() => navigate('/feed?filter=private')}
          className="bg-brand-ink text-brand-cream p-6 rounded-3xl relative group hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between min-h-[200px]"
        >
          <div className="flex justify-between items-start">
            <Lock className="w-8 h-8 text-brand-cream" />
            <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-brand-ink transition">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <h3 className="font-serif text-2xl font-bold mt-8">Private Posts</h3>
        </div>

        {/* Analytics Card */}
        <div 
          onClick={() => alert('Analytics modal / drawer view coming soon!')}
          className="bg-brand-sky p-6 rounded-3xl relative group hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between min-h-[200px]"
        >
          <div className="flex justify-between items-start">
            <BarChart3 className="w-8 h-8 text-brand-ink" />
            <button className="w-8 h-8 rounded-full bg-brand-ink/10 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <h3 className="font-serif text-2xl font-bold text-brand-ink mt-8">Analytics</h3>
        </div>

        {/* Poster Templates */}
        <div 
          onClick={() => navigate('/create?tab=templates')}
          className="bg-brand-sage p-6 rounded-3xl relative group hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between min-h-[200px]"
        >
          <div className="flex justify-between items-start">
            <Layout className="w-8 h-8 text-brand-ink" />
            <button className="w-8 h-8 rounded-full bg-brand-ink/10 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <h3 className="font-serif text-2xl font-bold text-brand-ink mt-8">Templates</h3>
        </div>

        {/* Liked Posts */}
        <div 
          onClick={() => navigate('/feed?filter=liked')}
          className="bg-brand-sky p-6 rounded-3xl relative group hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between min-h-[200px]"
        >
          <div className="flex justify-between items-start">
            <Heart className="w-8 h-8 text-brand-ink" />
            <button className="w-8 h-8 rounded-full bg-brand-ink/10 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <h3 className="font-serif text-2xl font-bold text-brand-ink mt-8">Liked Posts</h3>
        </div>

        {/* Drafts */}
        <div 
          onClick={() => navigate('/feed?filter=drafts')}
          className="bg-brand-ochre/30 border-2 border-dashed border-brand-ochre/80 p-6 rounded-3xl relative group hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between min-h-[200px]"
        >
          <div className="flex justify-between items-start">
            <FileEdit className="w-8 h-8 text-brand-ink" />
            <button className="w-8 h-8 rounded-full bg-brand-ink/10 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <h3 className="font-serif text-2xl font-bold text-brand-ink mt-8">Drafts</h3>
        </div>

      </section>
    </div>
  );
}