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

export default function App() {
  return (
    <div className="min-h-screen bg-brand-cream p-6 md:p-12">
      {/* Top Navigation */}
      <header className="flex justify-between items-center max-w-6xl mx-auto border-b border-brand-ink/10 pb-6">
        <div className="flex items-center space-x-2">
          <span className="font-serif text-3xl font-bold tracking-tight text-brand-ink">JamBlog</span>
        </div>
        <nav className="space-x-6 text-xs md:text-sm font-semibold uppercase tracking-wider text-brand-ink/70">
          <a href="#" className="hover:text-brand-terracotta transition">Home</a>
          <a href="#" className="hover:text-brand-terracotta transition">Feed</a>
          <a href="#" className="hover:text-brand-terracotta transition border-b-2 border-brand-terracotta pb-1 text-brand-ink">Profile</a>
          <a href="#" className="hover:text-brand-terracotta transition">Settings</a>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto mt-10">
        {/* User Profile Header */}
        <section className="flex flex-col md:flex-row items-center md:items-start justify-between mb-12 gap-6">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full bg-brand-ink flex items-center justify-center text-brand-cream text-3xl font-serif">
              JD
            </div>
            <div>
              <h1 className="font-serif text-3xl font-bold text-brand-ink">Dashboard</h1>
              <p className="text-brand-ink/60 text-sm mt-1">Manage your long-form thoughts & exports</p>
            </div>
          </div>

          <div className="flex space-x-8 text-center bg-white/50 px-6 py-3 rounded-2xl border border-brand-ink/5 shadow-sm">
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

        {/* Colorful Dashboard Grid (Matching Design Draft) */}
        <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          {/* Analytics Card */}
          <div className="bg-brand-sky p-6 rounded-3xl relative group hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-start">
              <BarChart3 className="w-8 h-8 text-brand-ink" />
              <button className="w-8 h-8 rounded-full bg-brand-ink/10 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-serif text-2xl font-bold text-brand-ink mt-8">Analytics</h3>
          </div>

          {/* My Post Card */}
          <div className="bg-brand-lavender p-6 rounded-3xl relative group hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-start">
              <FileText className="w-8 h-8 text-brand-ink" />
              <button className="w-8 h-8 rounded-full bg-brand-ink/10 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-serif text-2xl font-bold text-brand-ink mt-8">My Post</h3>
          </div>

          {/* Shared Post Card */}
          <div className="bg-brand-ochre p-6 rounded-3xl relative group hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-start">
              <Share2 className="w-8 h-8 text-brand-ink" />
              <button className="w-8 h-8 rounded-full bg-brand-ink/10 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-serif text-2xl font-bold text-brand-ink mt-8">Shared Post</h3>
          </div>

          {/* My Private Post Card */}
          <div className="bg-brand-terracotta text-white p-6 rounded-3xl relative group hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-start">
              <Lock className="w-8 h-8 text-white" />
              <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
            <h3 className="font-serif text-2xl font-bold mt-8">My Private Post</h3>
          </div>

          {/* Template Card */}
          <div className="bg-brand-terracotta text-white p-6 rounded-3xl relative group hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-start">
              <Layout className="w-8 h-8 text-white" />
              <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
            <h3 className="font-serif text-2xl font-bold mt-8">Template</h3>
          </div>

          {/* Liked Post Card */}
          <div className="bg-brand-sky p-6 rounded-3xl relative group hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-start">
              <Heart className="w-8 h-8 text-brand-ink" />
              <button className="w-8 h-8 rounded-full bg-brand-ink/10 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-serif text-2xl font-bold text-brand-ink mt-8">Liked Post</h3>
          </div>

          {/* Draft Card */}
          <div className="bg-brand-ochre/40 border border-brand-ochre p-6 rounded-3xl relative group hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[220px]">
            <div className="flex justify-between items-start">
              <FileEdit className="w-8 h-8 text-brand-ink" />
              <button className="w-8 h-8 rounded-full bg-brand-ink/10 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-serif text-2xl font-bold text-brand-ink mt-8">Draft</h3>
          </div>

        </section>
      </main>
    </div>
  );
}