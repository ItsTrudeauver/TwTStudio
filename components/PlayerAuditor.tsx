// components/PlayerAuditor.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function PlayerAuditor() {
  const [userId, setUserId] = useState('');
  const [player, setPlayer] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit fields state
  const [gems, setGems] = useState(0);
  const [coins, setCoins] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [updating, setUpdating] = useState(false);

  // Gifting state
  const [giftCardId, setGiftCardId] = useState<number | ''>('');
  const [giftDupes, setGiftDupes] = useState(0);
  const [gifting, setGifting] = useState(false);

  // Fetch roster on load for the gifting dropdown list
  useEffect(() => {
    supabase
      .from('characters_cache')
      .select('id, name, rarity')
      .order('id', { ascending: true })
      .then(({ data }) => {
        if (data) setRoster(data);
      });
  }, []);

  const fetchInventory = async (uid: string) => {
    const { data } = await supabase
      .from('inventory')
      .select(`
        id,
        dupe_level,
        bond_level,
        characters_cache ( name, rarity )
      `)
      .eq('user_id', uid);
    if (data) setInventory(data);
  };

  const handleSearchPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;

    setLoading(true);
    setPlayer(null);
    setInventory([]);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId.trim())
        .single();

      if (error || !data) {
        throw new Error('Player not found in database.');
      }

      setPlayer(data);
      setGems(data.gacha_gems || 0);
      setCoins(data.coins || 0);
      setLevel(data.team_level || 1);
      setXp(data.team_xp || 0);
      await fetchInventory(data.user_id);
    } catch (err: any) {
      // Offer registration option on fail
      if (confirm(`🤷 Player ${userId.trim()} not found in the users table. Would you like to initialize/register their profile now?`)) {
        await handleRegisterPlayer(userId.trim());
      }
    }
    setLoading(false);
  };

  const handleRegisterPlayer = async (uid: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .insert({ user_id: uid, gacha_gems: 5000, coins: 100 });

      if (error) throw error;
      alert(`🎉 Player ${uid} successfully registered!`);
      setUserId(uid);
      // Trigger search again
      const { data } = await supabase.from('users').select('*').eq('user_id', uid).single();
      if (data) {
        setPlayer(data);
        setGems(5000);
        setCoins(100);
        setLevel(1);
        setXp(0);
      }
    } catch (err: any) {
      alert(`Failed to register player: ${err.message}`);
    }
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
      alert(`💰 Successfully updated wallet for player ${player.user_id}!`);
      setPlayer({ ...player, gacha_gems: gems, coins, team_level: level, team_xp: xp });
    } catch (err: any) {
      alert(err.message);
    }
    setUpdating(false);
  };

  const handleGiftCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player || !giftCardId) return;

    setGifting(true);
    try {
      const { error } = await supabase
        .from('inventory')
        .insert({
          user_id: player.user_id,
          card_id: Number(giftCardId),
          dupe_level: Number(giftDupes)
        });

      if (error) {
        // If they already own it, offer to update dupe instead
        if (error.message.includes('unique_user_character')) {
          const { error: updateError } = await supabase
            .from('inventory')
            .update({ dupe_level: Number(giftDupes) })
            .eq('user_id', player.user_id)
            .eq('card_id', Number(giftCardId));
          if (updateError) throw updateError;
          alert('📝 Updated dupe level on existing card!');
        } else {
          throw error;
        }
      } else {
        alert('🎁 Successfully added card to player inventory!');
      }

      setGiftCardId('');
      fetchInventory(player.user_id);
    } catch (err: any) {
      alert(`Failed to grant unit: ${err.message}`);
    }
    setGifting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-140px)] overflow-y-auto">
      {/* Left Search and Wallet Stats */}
      <div className="lg:col-span-2 bg-neutral-900 p-6 border border-neutral-800 rounded-lg space-y-4">
        <h3 className="text-md font-bold mb-4">🔍 Search Player ID</h3>
        <form onSubmit={handleSearchPlayer} className="flex gap-2 mb-4">
          <input
            type="text"
            required
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none"
            placeholder="e.g. 1463071276036788392"
          />
          <button type="submit" disabled={loading} className="bg-neutral-100 hover:bg-white text-neutral-900 px-4 rounded text-xs font-bold transition-all">
            Audit
          </button>
        </form>

        {player ? (
          <div className="space-y-4">
            <div className="bg-neutral-950 p-3 rounded border border-neutral-800/60 space-y-1.5 text-xs">
              <div className="flex justify-between"><span>User ID:</span> <span className="font-mono text-neutral-400 select-all">{player.user_id}</span></div>
              <div className="flex justify-between"><span>Gems Balance:</span> <span className="font-bold text-yellow-400">{player.gacha_gems?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Coins Balance:</span> <span className="font-bold text-emerald-400">{player.coins?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Team Level:</span> <span className="font-bold text-white">{player.team_level}</span></div>
            </div>

            <form onSubmit={handleUpdateResources} className="space-y-3 pt-4 border-t border-neutral-800/40">
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
                  <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Level</label>
                  <input type="number" value={level} onChange={(e) => setLevel(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">XP</label>
                  <input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-white" />
                </div>
              </div>
              <button type="submit" disabled={updating} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs transition-all shadow">
                Commit Currency Updates
              </button>
            </form>
          </div>
        ) : (
          <p className="text-xs text-neutral-500 italic">No player selected. Search or register above.</p>
        )}
      </div>

      {/* Middle/Right: Inventory & Gifting Console */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-140px)]">
        
        {/* Inventory Viewer */}
        <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-lg flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Player Inventory</h3>
          <div className="space-y-1.5 flex-1 overflow-y-auto">
            {inventory.length > 0 ? (
              inventory.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-neutral-950 p-2 rounded border border-neutral-800/60 text-xs">
                  <div>
                    <span className="font-semibold text-neutral-300">{item.characters_cache?.name}</span>
                    <span className="text-neutral-500 text-[10px] ml-2">({item.characters_cache?.rarity})</span>
                  </div>
                  <span className="text-emerald-400 font-mono">Dupe Lv.{item.dupe_level}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-500 italic">Inventory is empty or no player audited.</p>
            )}
          </div>
        </div>

        {/* Gift Card Console */}
        <div className="bg-neutral-900 p-5 border border-neutral-800 rounded-lg">
          <h3 className="text-sm font-bold mb-4">🎁 Award Unit to Player</h3>
          {player ? (
            <form onSubmit={handleGiftCharacter} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Select Card</label>
                <select
                  required
                  value={giftCardId}
                  onChange={(e) => setGiftCardId(Number(e.target.value) || '')}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white"
                >
                  <option value="">Select a character...</option>
                  {roster.map(char => (
                    <option key={char.id} value={char.id}>{char.name} ({char.rarity}) [ID {char.id}]</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Dupe Level (0 - 10)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={giftDupes}
                  onChange={(e) => setGiftDupes(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white"
                />
              </div>

              <button type="submit" disabled={gifting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs transition-all shadow">
                {gifting ? 'Granting...' : 'Grant Character to Player'}
              </button>
            </form>
          ) : (
            <p className="text-xs text-neutral-500 italic">Inspect a player first to award characters.</p>
          )}
        </div>
      </div>
    </div>
  );
}