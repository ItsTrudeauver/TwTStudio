'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Local list of precompiled Python core configurations inside bosses.py
const PREDEFINED_RAIDS = [
  { id: 'SHYLEZSHKEBAN_ONYX', name: 'Shylezshkeban, the Onyx Moon' },
  { id: 'VESPERA_SHATTERED_GRACE', name: 'Vespera, the Shattered Grace' }
];

export default function RaidScheduler() {
  const [raids, setRaids] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('SHYLEZSHKEBAN_ONYX');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveRaids();
  }, []);

  const fetchActiveRaids = async () => {
    const { data, error } = await supabase
      .from('raid_bosses')
      .select('*')
      .order('end_timestamp', { ascending: false });
    if (!error && data) setRaids(data);
  };

  const handleDeployRaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endTime) {
      alert("❌ Please specify an event expiration date/time!");
      return;
    }

    setLoading(true);
    try {
      const endUnix = Math.floor(new Date(endTime).getTime() / 1000);
      const selectedBoss = PREDEFINED_RAIDS.find(r => r.id === selectedId);

      // 1. Deactivate older ongoing raids
      await supabase.from('raid_bosses').update({ is_active: false }).eq('is_active', true);

      // 2. Upsert/Update the new active target matching code specifications
      const { error } = await supabase
        .from('raid_bosses')
        .upsert({
          boss_id: selectedId,
          name: selectedBoss?.name || selectedId,
          is_active: true,
          end_timestamp: endUnix,
          description: 'Raid instance scheduled dynamically via TwT Studio Command Center.',
          max_hp: 5000000, // Safe baseline, core stats fall back to game_math or local configurations
          base_atk: 8000,
          skills: []
        }, { onConflict: 'boss_id' });

      if (error) throw error;

      alert(`🎉 Successfully scheduled Raid Event: ${selectedBoss?.name}!`);
      setEndTime('');
      fetchActiveRaids();
    } catch (err: any) {
      alert(`Deployment Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-180px)] overflow-y-auto">
      {/* Scheduler Form (Spans 5 Columns) */}
      <div className="lg:col-span-5 bg-neutral-900 p-6 border border-neutral-800 rounded-lg">
        <h3 className="text-md font-bold mb-4">⚔️ Schedule Predefined Raid Event</h3>
        <form onSubmit={handleDeployRaid} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Select Boss Configuration (Code-Defined)</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none"
            >
              {PREDEFINED_RAIDS.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Expiration End-Time (UTC)</label>
            <input
              type="datetime-local"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-100 hover:bg-white text-neutral-900 font-semibold py-2 px-4 rounded text-sm transition-all disabled:opacity-50"
          >
            {loading ? 'Activating Event...' : 'Deploy Active Raid Event'}
          </button>
        </form>
      </div>

      {/* History timeline (Spans 7 Columns) */}
      <div className="lg:col-span-7 bg-neutral-900 p-6 border border-neutral-800 rounded-lg flex flex-col h-full">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Raid Event History</h3>
        <div className="space-y-3 flex-1 overflow-y-auto">
          {raids.map((r) => {
            const dateStr = new Date(r.end_timestamp * 1000).toLocaleString();
            return (
              <div key={r.boss_id} className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg text-xs space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{r.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.is_active ? 'bg-emerald-900 text-emerald-300 border border-emerald-800' : 'bg-neutral-800 text-neutral-500'}`}>
                    {r.is_active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <div className="text-neutral-400">Ends: <span className="text-neutral-300 font-semibold">{dateStr}</span></div>
                <div className="text-neutral-400 font-mono text-[10px] text-neutral-500">ID: {r.boss_id}</div>
              </div>
            );
          })}
          {raids.length === 0 && (
            <p className="text-xs text-neutral-500 italic p-4 text-center">No raids historically scheduled.</p>
          )}
        </div>
      </div>
    </div>
  );
}