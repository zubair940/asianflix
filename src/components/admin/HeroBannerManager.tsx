import React, { useState, useEffect } from 'react';
import { HeroBanner, Drama } from '../../types.js';
import { featureService } from '../../services/featureService.js';
import { useToast } from '../../context/ToastContext.js';
import { Image, Plus, Trash2, CheckCircle, Sparkles, AlertCircle } from 'lucide-react';

interface HeroBannerManagerProps {
  dramas: Drama[];
}

export const HeroBannerManager: React.FC<HeroBannerManagerProps> = ({ dramas }) => {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);

  // New banner form state
  const [dramaId, setDramaId] = useState(dramas[0]?.id || '');
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [badge, setBadge] = useState('FEATURED PREMIERE');
  const [imageUrl, setImageUrl] = useState('');
  const [buttonText, setButtonText] = useState('Stream Now Free');

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await featureService.getHeroBanners();
      setBanners(res);
    } catch (err: any) {
      showToast('Error loading banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedDrama = dramas.find((d) => d.id === dramaId);
      const res = await featureService.saveHeroBanner({
        dramaId,
        title: title || selectedDrama?.title || 'Featured Drama',
        tagline: tagline || selectedDrama?.description || 'Stream exclusively on KDramaBox',
        badge: badge || 'MUST WATCH',
        imageUrl: imageUrl || selectedDrama?.backdrop || selectedDrama?.poster || '',
        buttonText,
        active: true
      });
      showToast('Hero Campaign Banner created!', 'success');
      setTitle('');
      setTagline('');
      loadBanners();
    } catch (err: any) {
      showToast(err.message || 'Error saving banner', 'error');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await featureService.deleteHeroBanner(id);
      showToast('Banner removed', 'info');
      loadBanners();
    } catch (err: any) {
      showToast('Error deleting banner', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Image className="w-5 h-5 text-[#00C2FF]" /> Hero Campaign Banner Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Customize top homepage spotlight carousels, promos, and VIP release badges.
          </p>
        </div>
      </div>

      {/* Add Banner Form */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-[#00C2FF]" /> Add Featured Spotlight Banner
        </h3>

        <form onSubmit={handleCreateBanner} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Link to Drama:</label>
            <select
              value={dramaId}
              onChange={(e) => {
                setDramaId(e.target.value);
                const d = dramas.find((x) => x.id === e.target.value);
                if (d) {
                  setTitle(d.title);
                  setImageUrl(d.backdrop || d.poster);
                  setTagline(d.description.slice(0, 100) + '...');
                }
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00C2FF]"
            >
              {dramas.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.releaseYear})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Badge Tag (e.g. EXCLUSIVE):</label>
            <input
              type="text"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00C2FF]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Custom Headline Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. World Premiere Episode 1 Out Now"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00C2FF]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Call to Action Button Text:</label>
            <input
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="e.g. Watch Episode 1 Free"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00C2FF]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-300 block mb-1">Sub-headline / Tagline Description:</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Short catchy summary line"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00C2FF]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-bold text-slate-300 block mb-1">Backdrop Image URL:</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#00C2FF]"
            />
          </div>

          <button
            type="submit"
            className="md:col-span-2 py-3 px-4 rounded-xl bg-[#00C2FF] text-black font-extrabold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Save Spotlight Hero Campaign
          </button>
        </form>
      </div>

      {/* Existing Banners List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((b) => (
          <div
            key={b.id}
            className="p-4 rounded-3xl bg-slate-900 border border-slate-800 relative group overflow-hidden flex flex-col justify-between space-y-3"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(15,23,42,0.95), rgba(15,23,42,0.6)), url(${b.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-[#00C2FF] text-[10px] font-extrabold uppercase tracking-wider">
                {b.badge}
              </span>

              <button
                onClick={() => handleDeleteBanner(b.id)}
                className="p-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="text-base font-extrabold text-white">{b.title}</h4>
              <p className="text-xs text-slate-300 line-clamp-2 mt-1">{b.tagline}</p>
            </div>

            <span className="inline-flex text-[11px] font-bold text-[#00C2FF] bg-black/60 px-3 py-1 rounded-xl w-max">
              Button: {b.buttonText}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
