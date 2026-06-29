// components/PlayerAuditor.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function PlayerAuditor() {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [player, setPlayer] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Lazy-loaded cache of resolved Discord snowflake usernames
  const [usernameCache, setUsernameCache] = useState<Record<string, string>>({});

  // Wallet stats states
  const [gems, setGems] = useState(0);
  const [coins, setCoins] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [updating, setUpdating] = useState(false);

  // Equipped team state (Characters + Relics)
  const [equippedTeam, setEquippedTeam] = useState<any[]>([]);

  // User Items (Consumables) states
  const [userItems, setUserItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('SSR Token');
  const [modifyItemQty, setModifyItemQty] = useState(1);
  const [adjustingItems, setAdjustingItems] = useState(false);

  // Autocomplete gifting states
  const [selectedGiftChar, setSelectedGiftChar] = useState<any>(null);
  const [giftSearchTerm, setGiftSearchTerm] = useState('');
  const [giftDropdownOpen, setGiftDropdownOpen] = useState(false);
  const [giftDupes, setGiftDupes] = useState(0);
  const [gifting, setGifting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    // 1. Fetch roster for autocomplete dropdown
    const { data: rosterData } = await supabase
      .from('characters_cache')
      .select('id, name, rarity')
      .order('id', { ascending: true });
    if (rosterData) setRoster(rosterData);

    // 2. Fetch all registered players
    const { data: userData } = await supabase
      .from('users')
      .select('user_id');
    if (userData) setAllUsers(userData);
  };

  // Lazily resolves Discord Snowflake ID to username
  const resolveUsername = async (uid: string) => {
    if (usernameCache[uid] || !uid) return;
    
    // Optimistically set to loading state
    setUsernameCache(prev => ({ ...prev, [uid]: 'Resolving...' }));

    try {
      // Query our secure, server-side Next.js proxy route
      const res = await fetch(`/api/discord/${uid}`);
      if (res.ok) {
        const data = await res.json();
        const name = data.global_name || data.username || uid;
        setUsernameCache(prev => ({ ...prev, [uid]: name }));
      } else {
        setUsernameCache(prev => ({ ...prev, [uid]: `User: ${uid.slice(-6)}` }));
      }
    } catch {
      setUsernameCache(prev => ({ ...prev, [uid]: `User: ${uid.slice(-6)}` }));
    }
  };
  
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
    if (data) setInventory(data || []);
  };

  const fetchPlayerTeam = async (uid: string) => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .eq('user_id', uid)
      .single();

    if (error || !data) {
      setEquippedTeam([]);
      return;
    }

    // Unpack equipped character & relic cache IDs
    const charIds = [data.slot_1, data.slot_2, data.slot_3, data.slot_4, data.slot_5].filter(Boolean);
    const relicIds = [data.slot_1_relic, data.slot_2_relic, data.slot_3_relic, data.slot_4_relic, data.slot_5_relic].filter(Boolean);

    // Get character names
    let charMap: Record<number, string> = {};
    if (charIds.length > 0) {
      const { data: chars } = await supabase.from('inventory').select('id, characters_cache(name)').in('id', charIds);
      chars?.forEach((c: any) => {
        if (c.characters_cache) charMap[c.id] = c.characters_cache.name;
      });
    }

    // Get relic names
    let relicMap: Record<number, string> = {};
    if (relicIds.length > 0) {
      const { data: relics } = await supabase.from('relics_inventory').select('id, relics_cache(name)').in('id', relicIds);
      relics?.forEach((r: any) => {
        if (r.relics_cache) relicMap[r.id] = r.relics_cache.name;
      });
    }

    const teamSlots = [];
    for (let i = 1; i <= 5; i++) {
      const cId = data[`slot_${i}`];
      const rId = data[`slot_${i}_relic`];
      teamSlots.push({
        slot: i,
        char: cId ? (charMap[cId] || `Inv ID ${cId}`) : 'Empty Slot',
        relic: rId ? (relicMap[rId] || `Relic ID ${rId}`) : 'None'
      });
    }
    setEquippedTeam(teamSlots);
  };

  const fetchPlayerItems = async (uid: string) => {
    const { data, error } = await supabase
      .from('user_items')
      .select('*')
      .eq('user_id', uid);
    if (!error && data) {
      setUserItems(data);
    } else {
      setUserItems([]);
    }
  };

  const handleAdjustItemQuantity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;

    setAdjustingItems(true);
    try {
      const { error } = await supabase
        .from('user_items')
        .upsert({
          user_id: player.user_id,
          item_id: selectedItemId,
          quantity: Number(modifyItemQty)
        }, { onConflict: 'user_id,item_id' });

      if (error) throw error;
      alert(`🎒 Successfully updated ${selectedItemId} quantity to ${modifyItemQty}!`);
      fetchPlayerItems(player.user_id);
    } catch (err: any) {
      alert(`Item update failed: ${err.message}`);
    } finally {
      setAdjustingItems(false);
    }
  };

  const selectPlayer = async (uid: string) => {
    setLoading(true);
    setPlayer(null);
    setInventory([]);
    setEquippedTeam([]);
    setUserItems([]);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', uid)
        .single();

      if (error || !data) {
        throw new Error('Player profile missing.');
      }

      setPlayer(data);
      setGems(data.gacha_gems || 0);
      setCoins(data.coins || 0);
      setLevel(data.team_level || 1);
      setXp(data.team_xp || 0);
      await fetchInventory(data.user_id);
      await fetchPlayerTeam(data.user_id);
      await fetchPlayerItems(data.user_id);
    } catch (err: any) {
      alert(`Error loading player details: ${err.message}`);
    }
    setLoading(false);
  };

  const handleRegisterPlayer = async (uid: string) => {
    if (!uid.trim()) return;
    try {
      const { error } = await supabase
        .from('users')
        .insert({ user_id: uid.trim(), gacha_gems: 5000, coins: 100 });

      if (error) throw error;
      alert(`🎉 Player ${uid.trim()} successfully registered!`);
      setSearchQuery('');
      await fetchInitialData();
      await selectPlayer(uid.trim());
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
      alert(`💰 Successfully updated wallet for player: ${player.user_id}`);
      setPlayer({ ...player, gacha_gems: gems, coins, team_level: level, team_xp: xp });
    } catch (err: any) {
      alert(err.message);
    }
    setUpdating(false);
  };

  const handleGiftCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player || !selectedGiftChar) return;

    setGifting(true);
    try {
      const { error } = await supabase
        .from('inventory')
        .insert({
          user_id: player.user_id,
          card_id: Number(selectedGiftChar.id),
          dupe_level: Number(giftDupes)
        });

      if (error) {
        if (error.message.includes('unique_user_character')) {
          const { error: updateError } = await supabase
            .from('inventory')
            .update({ dupe_level: Number(giftDupes) })
            .eq('user_id', player.user_id)
            .eq('card_id', Number(selectedGiftChar.id));
          if (updateError) throw updateError;
          alert('📝 Updated dupe level on existing card!');
        } else {
          throw error;
        }
      } else {
        alert('🎁 Successfully added card to player inventory!');
      }

      setSelectedGiftChar(null);
      setGiftSearchTerm('');
      fetchInventory(player.user_id);
    } catch (err: any) {
      alert(`Failed to grant unit: ${err.message}`);
    }
    setGifting(false);
  };

  // Filters the list of users based on search query (by either Snowflake ID or resolved Username)
  const filteredUsers = allUsers.filter(u => {
    const resolvedName = usernameCache[u.user_id] || '';
    return u.user_id.includes(searchQuery) || resolvedName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-140px)]">
      {/* Left Column: Player Search & Directory */}
      <div className="lg:col-span-2 bg-neutral-900 p-6 border border-neutral-800 rounded-lg flex flex-col h-full overflow-hidden">
        <h3 className="text-md font-bold mb-3">🔍 Player Auditor Console</h3>
        
        {/* Search Field */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none focus:border-neutral-700"
            placeholder="Search by Discord ID or Username..."
          />
          {searchQuery.trim().length >= 15 && !allUsers.some(u => u.user_id === searchQuery.trim()) && (
            <button
              type="button"
              onClick={() => handleRegisterPlayer(searchQuery)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 rounded text-xs font-bold transition-all"
            >
              + Register
            </button>
          )}
        </div>

        {/* Directory List of Players */}
        <div className="flex-1 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded p-2 mb-4 space-y-1">
          {filteredUsers.map((u) => {
            // Lazy load username as the player row is displayed
            if (!usernameCache[u.user_id]) {
              resolveUsername(u.user_id);
            }

            const isSelected = player?.user_id === u.user_id;

            return (
              <button
                key={u.user_id}
                onClick={() => selectPlayer(u.user_id)}
                className={`w-full flex items-center justify-between p-2 rounded text-left text-xs transition-all border ${isSelected ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-transparent border-transparent text-neutral-400 hover:bg-neutral-900/60'}`}
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-neutral-300">{usernameCache[u.user_id] || 'Resolving...'}</span>
                  <span className="text-[10px] text-neutral-500 font-mono mt-0.5">{u.user_id}</span>
                </div>
                <span className="text-[10px] text-neutral-500">Audit →</span>
              </button>
            );
          })}
          {filteredUsers.length === 0 && (
            <p className="text-xs text-neutral-500 italic p-4 text-center">No registered players match your search filter.</p>
          )}
        </div>

        {/* Selected Player Wallet Panel */}
        {player && (
          <div className="border-t border-neutral-800/60 pt-4 space-y-4">
            <div className="bg-neutral-950 p-3 rounded border border-neutral-800/60 space-y-1.5 text-xs">
              <div className="flex justify-between"><span>User:</span> <span className="font-semibold text-neutral-300">{usernameCache[player.user_id] || 'Resolving...'}</span></div>
              <div className="flex justify-between"><span>Gems Balance:</span> <span className="font-bold text-yellow-400">{player.gacha_gems?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Coins Balance:</span> <span className="font-bold text-emerald-400">{player.coins?.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Team Level:</span> <span className="font-bold text-white">{player.team_level}</span></div>
            </div>

            <form onSubmit={handleUpdateResources} className="space-y-3">
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
                {updating ? 'Updating...' : 'Commit Currency Updates'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Middle/Right Columns: Inventory List & Gifting Console */}
      <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-hidden">
        
        {/* Left Sub-Column: Inventory Viewer & Team Visualizer */}
        <div className="flex flex-col gap-4 h-full overflow-hidden">
          {/* Equipped Team Visualizer */}
          <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Equipped Team Active Slots</h3>
            {equippedTeam.length > 0 ? (
              <div className="grid grid-cols-1 gap-1 text-[11px]">
                {equippedTeam.map((slot) => (
                  <div key={slot.slot} className="bg-neutral-950 border border-neutral-800/40 p-1.5 rounded flex justify-between">
                    <div>
                      <span className="text-neutral-500 mr-2 font-bold">{slot.slot}.</span>
                      <span className="text-neutral-200 font-semibold">{slot.char}</span>
                    </div>
                    <span className="text-neutral-500 italic text-[10px]">relic: {slot.relic}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-neutral-500 italic">No squad active or player not selected.</p>
            )}
          </div>

          {/* Inventory Viewer */}
          <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-lg flex-1 overflow-hidden flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Player Inventory</h3>
            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {inventory.length > 0 ? (
                inventory.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-neutral-950 p-2 rounded border border-neutral-800/60 text-xs">
                    <div>
                      <span className="font-semibold text-neutral-300">{item.characters_cache?.name}</span>
                      <span className="text-neutral-500 text-[10px] ml-2">({item.characters_cache?.rarity})</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[10px]">Dupe Lv.{item.dupe_level}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-neutral-500 italic">Inventory is empty or no player selected.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Sub-Column: Gifting & Items Manager */}
        <div className="flex flex-col gap-4 h-full overflow-y-auto">
          {/* Items / Consumables Manager */}
          <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Modify Player Items Balance</h3>
            {player ? (
              <div className="space-y-3">
                <div className="bg-neutral-950 p-2 rounded border border-neutral-800/40 text-[10px] space-y-1 font-mono">
                  {userItems.length > 0 ? (
                    userItems.map(item => (
                      <div key={item.item_id} className="flex justify-between">
                        <span className="text-neutral-400">{item.item_id}:</span>
                        <span className="text-white font-bold">{item.quantity}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-neutral-500">No custom items held in bag.</span>
                  )}
                </div>

                <form onSubmit={handleAdjustItemQuantity} className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] uppercase font-bold text-neutral-500 mb-1">Item Select</label>
                      <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-1 text-[11px] text-white"
                      >
                        <option value="SSR Token">SSR Token</option>
                        <option value="bond_small">Faint Tincture</option>
                        <option value="bond_med">Vital Draught</option>
                        <option value="bond_large">Heart Elixirs</option>
                        <option value="bond_ur">Essence of Devotion</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] uppercase font-bold text-neutral-500 mb-1">Set Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={modifyItemQty}
                        onChange={(e) => setModifyItemQty(Number(e.target.value))}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-1 text-[11px]"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={adjustingItems}
                    className="w-full bg-neutral-100 hover:bg-white text-neutral-900 font-bold py-1 px-3 rounded text-[11px]"
                  >
                    {adjustingItems ? 'Saving item modifications...' : 'Update Item Quantity'}
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-[10px] text-neutral-500 italic">Select a player to modify custom bag items.</p>
            )}
          </div>

          {/* Gift Card Console (Gifting search dropdown) */}
          <div className="bg-neutral-900 p-5 border border-neutral-800 rounded-lg flex-1">
            <h3 className="text-sm font-bold mb-4">🎁 Award Unit to Player</h3>
            {player ? (
              <form onSubmit={handleGiftCharacter} className="space-y-4">
                {/* Typable search input for gifting characters */}
                <div className="relative">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Search & Select Card</label>
                  <input
                    type="text"
                    placeholder="🔍 Search character name..."
                    value={giftDropdownOpen ? giftSearchTerm : (selectedGiftChar ? `${selectedGiftChar.name} (${selectedGiftChar.rarity})` : '')}
                    onChange={(e) => {
                      setGiftSearchTerm(e.target.value);
                      setGiftDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setGiftSearchTerm('');
                      setGiftDropdownOpen(true);
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none focus:border-neutral-700"
                  />
                  {giftDropdownOpen && (
                    <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded shadow-2xl z-50">
                      {roster
                        .filter(char => char.name.toLowerCase().includes(giftSearchTerm.toLowerCase()))
                        .map(char => (
                          <button
                            key={char.id}
                            type="button"
                            onClick={() => {
                              setSelectedGiftChar(char);
                              setGiftSearchTerm(`${char.name} (${char.rarity})`);
                              setGiftDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-xs text-neutral-300 border-b border-neutral-800/40 last:border-0"
                          >
                            {char.name} ({char.rarity}) [ID {char.id}]
                          </button>
                        ))}
                      {roster.filter(char => char.name.toLowerCase().includes(giftSearchTerm.toLowerCase())).length === 0 && (
                        <p className="text-xs text-neutral-500 italic p-3 text-center">No matching cards found.</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Dupe Level (0 - 10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={giftDupes}
                    onChange={(e) => setGiftDupes(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={gifting || !selectedGiftChar}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs transition-all shadow disabled:opacity-50"
                >
                  {gifting ? 'Granting...' : 'Grant Character to Player'}
                </button>
              </form>
            ) : (
              <p className="text-xs text-neutral-500 italic">Audit a player in the directory first to grant character assets.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}