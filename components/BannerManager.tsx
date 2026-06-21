// components/BannerManager.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface BannerManagerProps {
  roster: any[];
}

export default function BannerManager({ roster }: BannerManagerProps) {
  const [banners, setBorders] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [pity, setPity] = useState(300);
  const [rateUpChance, setRateUpChance] = useState(0.5);
  const [endTime, setEndTime] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    const { data } = await supabase.from('banners').select('*').order('id', { ascending: false });
    if (data) setBorders(data);
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert('Please select at least one rate-up unit.');
      return;
    }
    if (!endTime) {
      alert('Please select an end timestamp.');
      return;
    }

    setSubmitting(true);
    const endUnix = Math.floor(new Date(endTime).getTime() / 1000);

    try {
      // Deactivate all previous active banners
      await supabase.from('banners').update({ is_active: false }).eq('is_active', true);

      // Create new banner
      const { error } = await supabase.from('banners').insert({
        name,
        rate_up_ids: selectedIds,
        rate_up_chance: Number(rateUpChance),
        spark_pity: Number(pity),
        is_active: true,
        end_timestamp: endUnix
      });

      if (error) throw error;
      alert(`📅 Banner "${name}" successfully created and scheduled!`);
      setName('');
      setSelectedIds([]);
      fetchBanners();
    } catch (err: any) {
      alert(err.message);
    }
    setSubmitting(false);
  };

  const handleToggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)] overflow-y-auto">
      {/* Create Banner Form */}
      <div className="bg-neutral-900 p-6 border border-neutral-800 rounded-lg">
        <h3 className="text-md font-bold mb-4">📅 Create Banner Event</h3>
        <form onSubmit={handleCreateBanner} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Banner Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white" placeholder="Winter Holiday" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Spark Pity</label>
              <input type="number" required value={pity} onChange={(e) => setPity(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Rate-up Chance (0.1 - 1.0)</label>
              <input type="number" step="0.1" required value={rateUpChance} onChange={(e) => setRateUpChance(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Expiration End-Time (UTC)</label>
            <input type="datetime-local" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white" />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Select Rate-up Units</label>
            <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-2 bg-neutral-950 border border-neutral-800 rounded">
              {roster.map(char => (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => handleToggleSelect(char.id)}
                  className={`flex items-center justify-between p-1.5 rounded text-left text-xs transition-all border ${selectedIds.includes(char.id) ? 'bg-emerald-950/40 border-emerald-800 text-white' : 'bg-transparent border-transparent text-neutral-400 hover:bg-neutral-900'}`}
                >
                  <span>{char.name} ({char.rarity})</span>
                  {selectedIds.includes(char.id) && <span className="text-emerald-400 font-bold">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-neutral-100 hover:bg-white text-neutral-900 font-semibold py-2 px-4 rounded text-sm transition-all disabled:opacity-50">
            {submitting ? 'Scheduling...' : 'Deploy Banner'}
          </button>
        </form>
      </div>

      {/* Active Banners History List */}
      <div className="bg-neutral-900 p-6 border border-neutral-800 rounded-lg flex flex-col">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Scheduled Banner Timeline</h3>
        <div className="space-y-3 flex-1 overflow-y-auto">
          {banners.map((b) => {
            const dateStr = new Date(b.end_timestamp * 1000).toLocaleString();
            return (
              <div key={b.id} className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg text-xs space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{b.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.is_active ? 'bg-emerald-900 text-emerald-300 border border-emerald-800' : 'bg-neutral-800 text-neutral-500'}`}>
                    {b.is_active ? 'ACTIVE' : 'EXPIRED'}
                  </span>
                </div>
                <div className="text-neutral-400">Ends: <span className="text-neutral-300 font-semibold">{dateStr}</span></div>
                <div className="text-neutral-400">Rate-Up IDs: <span className="text-neutral-300">{b.rate_up_ids.join(', ')}</span></div>
                <div className="text-neutral-400">Spark: {b.spark_pity} | Chance: {b.rate_up_chance}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}