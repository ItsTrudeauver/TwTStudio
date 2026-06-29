'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface PigmentManagerProps {
  selectedRelic: any;
  setSelectedRelic: (relic: any) => void;
  fetchRelics: () => void;
  relics: any[];
}

export default function PigmentManager({ selectedRelic, setSelectedRelic, fetchRelics, relics }: PigmentManagerProps) {
  const [name, setName] = useState('');
  const [rarity, setRarity] = useState('R');
  const [color, setColor] = useState('Vermilion');
  const [baseAtk, setBaseAtk] = useState(0);
  const [baseDef, setBaseDef] = useState(0);
  const [baseHp, setBaseHp] = useState(0);
  const [cost, setCost] = useState(5);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (selectedRelic) {
      setName(selectedRelic.name);
      setRarity(selectedRelic.rarity);
      setColor(selectedRelic.chroma_color || 'Vermilion');
      setBaseAtk(selectedRelic.base_atk || 0);
      setBaseDef(selectedRelic.base_def || 0);
      setBaseHp(selectedRelic.base_hp || 0);
      setCost(selectedRelic.cost || 5);
      setImageUrl(selectedRelic.image_url || '');
    } else {
      handleClearSelection();
    }
  }, [selectedRelic]);

  const handleClearSelection = () => {
    setSelectedRelic(null);
    setName('');
    setRarity('R');
    setColor('Vermilion');
    setBaseAtk(0);
    setBaseDef(0);
    setBaseHp(0);
    setCost(5);
    setImageUrl('');
  };

  const handleSavePigment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        rarity,
        chroma_color: color,
        base_atk: Number(baseAtk),
        base_def: Number(baseDef),
        base_hp: Number(baseHp),
        cost: Number(cost),
        image_url: imageUrl
      };

      if (selectedRelic) {
        const { error } = await supabase
          .from('relics_cache')
          .update(payload)
          .eq('id', selectedRelic.id);
        if (error) throw error;
        alert(`🎉 Updated Pigment: ${name}`);
      } else {
        const { error } = await supabase
          .from('relics_cache')
          .insert({ ...payload, ability_tags: [] });
        if (error) throw error;
        alert(`🎉 Created Pigment: ${name}`);
        handleClearSelection();
      }
      fetchRelics();
    } catch (err: any) {
      alert(`Error saving pigment: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Searchable Dropdown Selector */}
      <div className="flex items-center gap-3 bg-neutral-900 p-3 rounded-lg border border-neutral-800 relative">
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Select Pigment to Edit:</label>
        <div className="relative min-w-[280px]">
          <input
            type="text"
            placeholder="🔍 Search pigment name..."
            value={isOpen ? searchTerm : (selectedRelic ? `${selectedRelic.name} (${selectedRelic.chroma_color})` : '')}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setSearchTerm('');
              setIsOpen(true);
            }}
            className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-neutral-700"
          />
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-neutral-900 border border-neutral-800 rounded shadow-2xl z-50">
              <button
                type="button"
                onClick={() => {
                  handleClearSelection();
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-xs text-red-400 border-b border-neutral-800 font-bold"
              >
                ✕ Clear Selection
              </button>
              {relics
                .filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(r => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedRelic(r);
                      setSearchTerm(`${r.name} (${r.chroma_color})`);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-xs text-neutral-300"
                  >
                    {r.name} ({r.rarity}) [{r.chroma_color}] (ID {r.id})
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Block */}
      <div className="bg-neutral-900 p-6 rounded-lg border border-neutral-800 max-w-xl">
        <h2 className="text-md font-bold mb-4">{selectedRelic ? '⚙️ Edit Pigment Properties' : '🔮 Register New Pigment'}</h2>
        <form onSubmit={handleSavePigment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Pigment Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Rarity</label>
              <select
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none"
              >
                <option value="R">R</option>
                <option value="SR">SR</option>
                <option value="SSR">SSR</option>
                <option value="UR">UR</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Chroma Color Group</label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none"
              >
                <option value="Vermilion">Vermilion (Red/Offense)</option>
                <option value="Cobalt">Cobalt (Blue/Defense)</option>
                <option value="Viridian">Viridian (Green/Heal)</option>
                <option value="Aureolin">Aureolin (Yellow/Shield)</option>
                <option value="Tyrian">Tyrian (Purple/Silence)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Base ATK Add</label>
              <input
                type="number"
                required
                value={baseAtk}
                onChange={(e) => setBaseAtk(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Base DEF Add</label>
              <input
                type="number"
                required
                value={baseDef}
                onChange={(e) => setBaseDef(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Base HP Add</label>
              <input
                type="number"
                required
                value={baseHp}
                onChange={(e) => setBaseHp(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Memory Cost</label>
              <input
                type="number"
                required
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Image URL (Optional)</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-100 hover:bg-white text-neutral-900 font-semibold py-2 px-4 rounded text-sm disabled:opacity-50 transition-all"
          >
            {loading ? 'Saving pigment...' : selectedRelic ? 'Update Pigment' : 'Register Pigment'}
          </button>
        </form>
      </div>
    </div>
  );
}