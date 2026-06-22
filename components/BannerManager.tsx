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

  // Search-as-you-type filter state for custom units
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('id', { ascending: false }); // Show newest first
    if (!error && data) setBorders(data);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert("❌ Please select at least one rate-up character for this banner!");
      return;
    }
    if (!endTime) {
      alert("❌ Please select a banner expiry date/time!");
      return;
    }

    setSubmitting(true);
    try {
      const endUnix = Math.floor(new Date(endTime).getTime() / 1000);

      // Deactivate older banners
      await supabase.from('banners').update({ is_active: false }).eq('is_active', true);

      // Insert new banner
      const { error } = await supabase
        .from('banners')
        .insert({
          name,
          rate_up_ids: selectedIds,
          rate_up_chance: Number(rateUpChance),
          spark_pity: Number(pity),
          is_active: true,
          end_timestamp: endUnix
        });

      if (error) throw error;

      alert(`🎉 Successfully Created Event Banner: ${name}!`);
      setName('');
      setSelectedIds([]);
      setEndTime('');
      fetchBanners();
    } catch (err: any) {
      alert(`Failed to create banner: ${err.message}`);
    }
    setSubmitting(false);
  };

  const handleToggleSelection = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-180px)] overflow-y-auto">
      {/* Create Banner Form (Spans 5 Columns) */}
      <div className="lg:col-span-5 bg-neutral-900 p-6 border border-neutral-800 rounded-lg">
        <h3 className="text-md font-bold mb-4">📅 Create Banner Event</h3>
        <form onSubmit={handleSaveBanner} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Banner Name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none" placeholder="Winter Holiday" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Spark Pity</label>
              <input type="number" required value={pity} onChange={(e) => setPity(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Rate-up Chance (0.1 - 1.0)</label>
              <input type="number" step="0.1" required value={rateUpChance} onChange={(e) => setRateUpChance(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Expiration End-Time (UTC)</label>
            <input type="datetime-local" required value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none" />
          </div>

          {/* Searchable Custom Units Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider">Select Rate-up Units</label>
              <span className="text-[10px] text-neutral-500">{selectedIds.length} Selected</span>
            </div>

            {/* Custom search bar */}
            <input
              type="text"
              placeholder="🔍 Filter custom units by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none focus:border-neutral-700"
            />

            <div className="grid grid-cols-1 gap-1.5 max-h-[160px] overflow-y-auto p-2 bg-neutral-950 border border-neutral-800 rounded">
              {roster
                .filter(char => char.id > 100) // Restricts list STRICTLY to custom/rebalanced units (IDs > 100)
                .filter(char => char.name.toLowerCase().includes(searchQuery.toLowerCase())) // Search filter
                .map(char => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => handleToggleSelection(char.id)}
                    className={`flex items-center justify-between p-2 rounded text-left text-xs transition-all border ${selectedIds.includes(char.id) ? 'bg-emerald-950/40 border-emerald-800 text-white' : 'bg-transparent border-transparent text-neutral-400 hover:bg-neutral-900'}`}
                  >
                    <span>{char.name} ({char.rarity}) [ID {char.id}]</span>
                    {selectedIds.includes(char.id) && <span className="text-emerald-400 font-bold">✓</span>}
                  </button>
                ))}
              {roster.filter(char => char.id > 100).length === 0 && (
                <p className="text-xs text-neutral-500 italic p-2 text-center">No custom units (IDs &gt; 100) found in database.</p>
              )}
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-neutral-100 hover:bg-white text-neutral-900 font-semibold py-2 px-4 rounded text-sm transition-all disabled:opacity-50">
            {submitting ? 'Scheduling...' : 'Deploy Banner'}
          </button>
        </form>
      </div>

      {/* Scheduled Timeline Panel (Spans 7 Columns) */}
      <div className="lg:col-span-7 bg-neutral-900 p-6 border border-neutral-800 rounded-lg flex flex-col h-full">
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
          {banners.length === 0 && (
            <p className="text-xs text-neutral-500 italic p-4 text-center">No banners currently scheduled.</p>
          )}
        </div>
      </div>
    </div>
  );
}