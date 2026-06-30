// components/RaidBossCreator.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function RaidBossCreator() {
  const [bosses, setBosses] = useState<any[]>([]);
  const [selectedBoss, setSelectedBoss] = useState<any>(null);

  // Core Metadata States
  const [bossId, setBossId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxHp, setMaxHp] = useState(5000000);
  const [baseAtk, setBaseAtk] = useState(8000);
  const [baseDef, setBaseDef] = useState(1000);
  const [imageUrl, setImageUrl] = useState('');

  // Basic Attack State
  const [basicType, setBasicType] = useState<'st' | 'aoe'>('st');
  const [basicMult, setBasicMultiplier] = useState(1.0);

  // Skills Array State (Attack Pattern Compiler)
  const [skills, setSkills] = useState<any[]>([]);

  // Search Selector State
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBosses();
  }, []);

  useEffect(() => {
    if (selectedBoss) {
      setBossId(selectedBoss.boss_id);
      setName(selectedBoss.name);
      setDescription(selectedBoss.description || '');
      setMaxHp(selectedBoss.max_hp || 5000000);
      setBaseAtk(selectedBoss.base_atk || 8000);
      setBaseDef(selectedBoss.base_def || 1000);
      setImageUrl(selectedBoss.image_url || '');

      const basic = selectedBoss.basic_attack || { type: 'st', multiplier: 1.0 };
      setBasicType(basic.type || 'st');
      setBasicMultiplier(basic.multiplier || 1.0);

      const parsedSkills = typeof selectedBoss.skills === 'string' 
        ? JSON.parse(selectedBoss.skills) 
        : (selectedBoss.skills || []);
      setSkills(parsedSkills);
    } else {
      handleClearSelection();
    }
  }, [selectedBoss]);

  const fetchBosses = async () => {
    const { data, error } = await supabase
      .from('raid_bosses')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) setBosses(data);
  };

  const handleClearSelection = () => {
    setSelectedBoss(null);
    setBossId('');
    setName('');
    setDescription('');
    setMaxHp(5000000);
    setBaseAtk(8000);
    setBaseDef(1000);
    setImageUrl('');
    setBasicType('st');
    setBasicMultiplier(1.0);
    setSkills([]);
  };

  const addSkillBlock = () => {
    setSkills([...skills, {
      name: 'New Skill',
      type: 'heavy_strike',
      phase: 1,
      turn_interval: 3,
      multiplier: 1.0,
      shard_multiplier: 0.0,
      duration: 0,
      value: 0.0,
      target: 'STRONGEST_ALLY'
    }]);
  };

  const removeSkillBlock = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkillField = (index: number, key: string, value: any) => {
    const updated = [...skills];
    updated[index][key] = value;
    setSkills(updated);
  };

  const handleSaveBoss = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bossId.trim()) {
      alert("❌ Boss ID is required!");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        boss_id: bossId.toUpperCase().trim(),
        name,
        description,
        max_hp: Number(maxHp),
        base_atk: Number(baseAtk),
        base_def: Number(baseDef),
        image_url: imageUrl.trim(),
        basic_attack: {
          type: basicType,
          multiplier: Number(basicMult)
        },
        skills: skills // Postgres JSONB column converts array structures natively
      };

      const { error } = await supabase
        .from('raid_bosses')
        .upsert(payload, { onConflict: 'boss_id' });

      if (error) throw error;

      alert(`🎉 Successfully saved Raid Boss: ${name}!`);
      fetchBosses();
      handleClearSelection();
    } catch (err: any) {
      alert(`Error saving boss configuration: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 text-white">
      {/* Search Dropdown Selector */}
      <div className="flex items-center gap-3 bg-neutral-900 p-3 rounded-lg border border-neutral-800 relative">
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Select Boss to Edit:</label>
        <div className="relative min-w-[280px]">
          <input
            type="text"
            placeholder="🔍 Search existing raid bosses..."
            value={isOpen ? searchTerm : (selectedBoss ? `${selectedBoss.name} (${selectedBoss.boss_id})` : '')}
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
                ✕ Clear (Create New)
              </button>
              {bosses
                .filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(b => (
                  <button
                    key={b.boss_id}
                    type="button"
                    onClick={() => {
                      setSelectedBoss(b);
                      setSearchTerm(`${b.name} (${b.boss_id})`);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-xs text-neutral-300"
                  >
                    {b.name} [{b.boss_id}]
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Panel Split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Boss Base Stats (Spans 2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-neutral-900 p-5 border border-neutral-800 rounded-lg space-y-4">
            <h3 className="text-sm font-bold border-b border-neutral-800 pb-2">👾 Boss Core Attributes</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Unique Boss ID (uppercase)</label>
                <input
                  type="text"
                  required
                  disabled={!!selectedBoss}
                  value={bossId}
                  onChange={(e) => setBossId(e.target.value.toUpperCase())}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white uppercase focus:outline-none disabled:opacity-50"
                  placeholder="YHWACH_ALMIGHTY"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none"
                  placeholder="Yhwach"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Boss Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none resize-none"
                placeholder="Details of the encounter, lore background, or mechanics..."
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Max HP Pool</label>
                <input
                  type="number"
                  required
                  value={maxHp}
                  onChange={(e) => setMaxHp(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Base ATK</label>
                <input
                  type="number"
                  required
                  value={baseAtk}
                  onChange={(e) => setBaseAtk(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Base DEF</label>
                <input
                  type="number"
                  required
                  value={baseDef}
                  onChange={(e) => setBaseDef(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Discord Hosted CDN Image URL</label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none"
                placeholder="https://cdn.discordapp.com/attachments/..."
              />
            </div>
          </div>

          <div className="bg-neutral-900 p-5 border border-neutral-800 rounded-lg space-y-3">
            <h3 className="text-sm font-bold border-b border-neutral-800 pb-2">⚔️ Default Basic Attack Profile</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Target Mode</label>
                <select
                  value={basicType}
                  onChange={(e: any) => setBasicType(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none"
                >
                  <option value="st">Single-Target Frontline</option>
                  <option value="aoe">Area of Effect (Team-wide)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Multiplier Scale</label>
                <input
                  type="number"
                  step="0.05"
                  value={basicMult}
                  onChange={(e) => setBasicMultiplier(Number(e.target.value))}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Skills / Attack Patterns Compiler (Spans 3 Columns) */}
        <div className="lg:col-span-3 bg-neutral-900 p-6 border border-neutral-800 rounded-lg flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
            <h3 className="text-sm font-bold">📜 Boss Skill Schedules (Attack Patterns)</h3>
            <button
              type="button"
              onClick={addSkillBlock}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-3 rounded text-[11px] transition-all"
            >
              + Add Skill Block
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px] pr-1">
            {skills.map((skill, idx) => (
              <div key={idx} className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg relative space-y-3">
                <button
                  type="button"
                  onClick={() => removeSkillBlock(idx)}
                  className="absolute top-2.5 right-2.5 text-red-500 hover:text-red-400 text-xs font-bold transition-all"
                >
                  ✕ Remove
                </button>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="md:col-span-2">
                    <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Skill Name</label>
                    <input
                      type="text"
                      required
                      value={skill.name}
                      onChange={(e) => updateSkillField(idx, 'name', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                      placeholder="Dimensional Divide"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Active Phase</label>
                    <select
                      value={skill.phase}
                      onChange={(e) => updateSkillField(idx, 'phase', Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                    >
                      <option value={1}>Phase 1 (HP &gt; 50%)</option>
                      <option value={2}>Phase 2 (HP ≤ 50%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Turn Interval</label>
                    <input
                      type="number"
                      min="1"
                      value={skill.turn_interval}
                      onChange={(e) => updateSkillField(idx, 'turn_interval', Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs border-t border-neutral-900/60 pt-3">
                  <div>
                    <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Skill Handler Type</label>
                    <select
                      value={skill.type}
                      onChange={(e) => updateSkillField(idx, 'type', e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                    >
                      <option value="heavy_strike">Heavy Strike (Frontline ST)</option>
                      <option value="rampage">Rampage (Full AOE Strike)</option>
                      <option value="fractal_strike">Fractal Strike (ST + Shard Spawn)</option>
                      <option value="SUPPRESS_SKILL">Suppress Skill (Silence)</option>
                      <option value="FORCE_VARIANCE">Force Variance (Locked Variance)</option>
                      <option value="enrage">Enrage (Scale Attack)</option>
                      <option value="enfeeble">Enfeeble</option>
                      <option value="singularity_collapse">Singularity Collapse</option>
                      <option value="dimensional_shift">Dimensional Shift</option>
                    </select>
                  </div>

                  {/* Contextual Custom Stats Parameters based on Handler Type */}
                  {['heavy_strike', 'rampage', 'fractal_strike', 'singularity_collapse'].includes(skill.type) && (
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Damage Multiplier</label>
                      <input
                        type="number"
                        step="0.05"
                        value={skill.multiplier || 1.0}
                        onChange={(e) => updateSkillField(idx, 'multiplier', Number(e.target.value))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                      />
                    </div>
                  )}

                  {skill.type === 'fractal_strike' && (
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Shard Explosion Multiplier</label>
                      <input
                        type="number"
                        step="0.05"
                        value={skill.shard_multiplier || 0.4}
                        onChange={(e) => updateSkillField(idx, 'shard_multiplier', Number(e.target.value))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                      />
                    </div>
                  )}

                  {skill.type === 'SUPPRESS_SKILL' && (
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Target Selection</label>
                      <select
                        value={skill.target || 'ALL_ALLIES'}
                        onChange={(e) => updateSkillField(idx, 'target', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                      >
                        <option value="ALL_ALLIES">All Allies (Team-Wide)</option>
                        <option value="STRONGEST_ALLY">Strongest Ally Only</option>
                      </select>
                    </div>
                  )}

                  {skill.type === 'FORCE_VARIANCE' && (
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Lock Variance Value</label>
                      <input
                        type="number"
                        step="0.05"
                        value={skill.value || 1.0}
                        onChange={(e) => updateSkillField(idx, 'value', Number(e.target.value))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                      />
                    </div>
                  )}

                  {['enfeeble'].includes(skill.type) && (
                    <>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Debuff Duration (Turns)</label>
                        <input
                          type="number"
                          value={skill.duration || 2}
                          onChange={(e) => updateSkillField(idx, 'duration', Number(e.target.value))}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Reduction Value (Percent)</label>
                        <input
                          type="number"
                          step="0.05"
                          value={skill.value || 0.15}
                          onChange={(e) => updateSkillField(idx, 'value', Number(e.target.value))}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {skills.length === 0 && (
              <p className="text-xs text-neutral-500 italic p-6 text-center bg-neutral-950 border border-neutral-800 rounded-lg">
                No custom attack schedule or pattern compiled for this boss yet. Click "+ Add Skill Block" to compile.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveBoss}
            disabled={submitting}
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded text-xs transition-all shadow disabled:opacity-50"
          >
            {submitting ? 'Compiling to database...' : selectedBoss ? `Update Config for ${name}` : 'Create & Compile Brand New Boss'}
          </button>
        </div>
      </div>
    </div>
  );
}