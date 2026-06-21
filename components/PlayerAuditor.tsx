// components/PlayerAuditor.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PlayerAuditor() {
  const [userId, setUserId] = useState('');
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Edit fields state
  const [gems, setGems] = useState(0);
  const [coins, setCoins] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [updating, setUpdating] = useState(false);

  const handleSearchPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;

    setLoading(true);
    setPlayer(null);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId.trim())
        .single();

      if (error || !data) throw new Error('Player not found.');

      setPlayer(data);
      setGems(data.gacha_gems || 0);
      setCoins(data.coins || 0);
      setLevel(data.team_level || 1);
      setXp(data.team_xp || 0);
    } catch (err: any) {
      alert(err.message);
    }
    setLoading(false);
  };

  const handleUpdateResources = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          gacha_gems: Number(gems),
          coins: Number(coins),
          team_level: Number(level),
          team_xp: Number(xp)
        })
        .eq('user_id', player.user_id);

      if (error) throw error;
      alert(`💰 Successfully updated player ${player.user_id}!`);
      setPlayer({ ...player, gacha_gems: gems, coins, team_level: level, team_xp: xp });
    } catch (err: any) {
      alert(err.message);
    }
    setUpdating(false);
  };

  // Replace your return block in components/PlayerAuditor.tsx with this corrected version:
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-140px)] overflow-y-auto">
      {/* Left Search and Stats */}
      <div className="lg:col-span-2 bg-neutral-900 p-6 border border-neutral-800 rounded-lg">
        <h3 className="text-md font-bold mb-4">🔍 Search Player ID</h3>
        <form onSubmit={handleSearchPlayer} className="flex gap-2 mb-6">
          <input
            type="text"
            required
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none"
            placeholder="e.g. 1463071276036788392"
          />
          <button type="submit" disabled={loading} className="bg-neutral-100 hover:bg-white text-neutral-900 px-4 rounded text-xs font-bold transition-all disabled:opacity-40">
            {loading ? 'Searching...' : 'Audit'}
          </button>
        </form>

        {selectedPlayerView({ player })}
      </div>
    </div>
  );

  function playerWorkspace() {
    if (!player) return null;
    return (
      <div className="space-y-4 border-t border-neutral-800 pt-4 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-neutral-400">Database Record ID:</span>
          <span className="text-neutral-200 font-mono select-all">{player.user_id}</span>
        </div>
        <div className="bg-neutral-950 p-3 rounded border border-neutral-800/60 space-y-1.5">
          <div className="flex justify-between"><span>Gems Balance:</span> <span className="font-bold text-yellow-400">{player.gacha_gems?.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Coins Balance:</span> <span className="font-bold text-emerald-400">{player.coins?.toLocaleString()}</span></div>
          <div className="flex justify-between"><span>Team Level:</span> <span className="font-bold text-white">{player.team_level}</span></div>
          <div className="flex justify-between"><span>Checkin Streak:</span> <span className="font-bold text-white">{player.checkin_streak} d</span></div>
        </div>
      </div>
    );
  }

  function selectedPlayerView({ player }: { player: any }) {
    if (!player) return <p className="text-xs text-neutral-500 italic">No player selected. Search above.</p>;
    return (
      <div className="space-y-4">
        {playerWorkspace()}
        <form onSubmit={handleUpdateResources} className="space-y-3 pt-2 border-t border-neutral-800/40">
          <h4 className="text-[10px] uppercase font-bold text-neutral-500">Update Wallet & Levels</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Gems</label>
              <input type="number" value={gems} onChange={(e) => setGems(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-white" />
            </div>
            <div>
              <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Coins</label>
              <input type="number" value={coins} onChange={(e) => setCoins(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Team Level</label>
              <input type="number" value={level} onChange={(e) => setLevel(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-white" />
            </div>
            <div>
              <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Team XP</label>
              <input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-white" />
            </div>
          </div>

          <button type="submit" disabled={updating} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs transition-all shadow">
            {updating ? 'Updating...' : 'Commit Currency Updates'}
          </button>
        </form>
      </div>
    );
  }
}