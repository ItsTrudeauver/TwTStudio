// components/SkillCompiler.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SkillCompilerProps {
  selectedChar: any;
  setSelectedChar: (char: any) => void;
  fetchRoster: () => void;
  roster: any[];
}

export default function SkillCompiler({ selectedChar, setSelectedChar, fetchRoster, roster }: SkillCompilerProps) {
  const [skillName, setSkillName] = useState('');
  const [appliesIn, setAppliesIn] = useState<'combat' | 'expedition' | 'global'>('combat');
  const [priority, setPriority] = useState(10);
  const [unsuppressable, setUnsuppressable] = useState(false);
  const [presets, setPresets] = useState<any[]>([]);

  // Search-dropdown states
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // In-state blocks initialized with complete double condition and nested branches
  const [blocks, setBlocks] = useState<any[]>([
    { 
      trigger: 'ON_POWER_CALC', 
      target: 'SELF', 
      target_param: '',
      chance: '100', 
      conditions: [{ type: 'NONE', param: '', connector: 'AND' }], 
      branches: [{ chance: '50', target: 'INHERIT', action_type: 'MULTIPLY_POWER', value: '1.0', log: '' }],
      action_type: 'MULTIPLY_POWER', 
      value: '1.25', 
      log: '{caster} entered Surge!' 
    }
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('stardust_skill_presets');
    if (saved) {
      try { setPresets(JSON.parse(saved)); } catch {}
    }
  }, []);

  const addBlockField = () => {
    setBlocks([...blocks, { 
      trigger: 'ON_POWER_CALC', 
      target: 'SELF', 
      target_param: '',
      chance: '100', 
      conditions: [{ type: 'NONE', param: '', connector: 'AND' }], 
      branches: [{ chance: '50', target: 'INHERIT', action_type: 'MULTIPLY_POWER', value: '1.0', log: '' }],
      action_type: 'MULTIPLY_POWER', 
      value: '1.0', 
      log: '' 
    }]);
  };

  const removeBlockField = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const updateBlockField = (blockIdx: number, key: string, value: any) => {
    const updated = [...blocks];
    updated[blockIdx][key] = value;
    setBlocks(updated);
  };

  // --- IF GATES STATE HELPERS ---
  const addConditionField = (blockIdx: number) => {
    const updated = [...blocks];
    updated[blockIdx].conditions.push({ type: 'NONE', param: '', connector: 'AND' });
    setBlocks(updated);
  };

  const removeConditionField = (blockIdx: number, condIdx: number) => {
    const updated = [...blocks];
    updated[blockIdx].conditions = updated[blockIdx].conditions.filter((_: any, i: number) => i !== condIdx);
    setBlocks(updated);
  };

  const updateConditionField = (blockIdx: number, condIdx: number, key: string, value: any) => {
    const updated = [...blocks];
    updated[blockIdx].conditions[condIdx][key] = value;
    setBlocks(updated);
  };

  // --- NESTED BRANCHING STATE HELPERS ---
  const addBranchField = (blockIdx: number) => {
    const updated = [...blocks];
    if (!updated[blockIdx].branches) updated[blockIdx].branches = [];
    updated[blockIdx].branches.push({ chance: '50', target: 'INHERIT', action_type: 'MULTIPLY_POWER', value: '1.0', log: '' });
    setBlocks(updated);
  };

  const removeBranchField = (blockIdx: number, branchIdx: number) => {
    const updated = [...blocks];
    updated[blockIdx].branches = updated[blockIdx].branches.filter((_: any, i: number) => i !== branchIdx);
    setBlocks(updated);
  };

  const updateBranchField = (blockIdx: number, branchIdx: number, key: string, value: any) => {
    const updated = [...blocks];
    updated[blockIdx].branches[branchIdx][key] = value;
    setBlocks(updated);
  };

  const handleDeleteSkill = async (e: React.MouseEvent, skillNameToDelete: string) => {
    e.stopPropagation();
    if (!selectedChar) return;
    if (!confirm(`🗑️ Are you sure you want to delete the "${skillNameToDelete}" skill from ${selectedChar.name}?`)) return;

    const currentSkills = Array.isArray(selectedChar.ability_tags) ? selectedChar.ability_tags : [];
    const updatedSkills = currentSkills.filter((s: any) => s.skill_name !== skillNameToDelete);

    const { error } = await supabase
      .from('characters_cache')
      .update({ ability_tags: updatedSkills })
      .eq('id', selectedChar.id);

    if (error) {
      alert(`Error deleting skill: ${error.message}`);
    } else {
      setSelectedChar({ ...selectedChar, ability_tags: updatedSkills });
      fetchRoster();
    }
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChar) return;

    const compiledSkill = {
      skill_name: skillName,
      applies_in: appliesIn,
      priority: Number(priority),
      unsuppressable,
      blocks: blocks.map(b => ({
        trigger: b.trigger,
        target: b.target === 'ALL_ALLIES_EXCEPT' ? `ALL_ALLIES_EXCEPT_${b.target_param}` : b.target,
        chance: Number(b.chance),
        action_type: b.action_type,
        value: b.action_type === 'REGISTER_CHANCE_ROUTER' ? '' : b.value,
        log_template: b.action_type === 'REGISTER_CHANCE_ROUTER' ? '' : b.log,
        conditions: b.conditions.map((c: any) => ({
          type: c.type,
          param: c.param,
          connector: c.connector
        })),
        branches: b.action_type === 'REGISTER_CHANCE_ROUTER' ? b.branches.map((branch: any) => ({
          chance: Number(branch.chance),
          target: branch.target || 'INHERIT',
          action_type: branch.action_type,
          value: branch.value,
          log_template: branch.log
        })) : []
      }))
    };

    const currentSkills = Array.isArray(selectedChar.ability_tags) ? selectedChar.ability_tags : [];
    const updatedSkills = [...currentSkills.filter((s: any) => s.skill_name !== skillName), compiledSkill];

    const { error } = await supabase
      .from('characters_cache')
      .update({ ability_tags: updatedSkills })
      .eq('id', selectedChar.id);

    if (error) {
      alert(`Error saving skill: ${error.message}`);
    } else {
      alert(`✨ Compiled skill saved successfully to ${selectedChar.name}!`);
      setSelectedChar({ ...selectedChar, ability_tags: updatedSkills });
      fetchRoster();
      setSkillName('');
    }
  };

  const handleSaveAsPreset = () => {
    if (!skillName || !skillName.trim()) {
      alert('Please enter a skill name first.');
      return;
    }
    const compiledSkill = {
      skill_name: skillName,
      applies_in: appliesIn,
      priority: Number(priority),
      unsuppressable,
      blocks: blocks.map(b => ({
        trigger: b.trigger,
        target: b.target === 'ALL_ALLIES_EXCEPT' ? `ALL_ALLIES_EXCEPT_${b.target_param}` : b.target,
        chance: Number(b.chance),
        action_type: b.action_type,
        value: b.action_type === 'REGISTER_CHANCE_ROUTER' ? '' : b.value,
        log_template: b.action_type === 'REGISTER_CHANCE_ROUTER' ? '' : b.log,
        conditions: b.conditions.map((c: any) => ({
          type: c.type,
          param: c.param,
          connector: c.connector
        })),
        branches: b.action_type === 'REGISTER_CHANCE_ROUTER' ? b.branches.map((branch: any) => ({
          chance: Number(branch.chance),
          target: branch.target || 'INHERIT',
          action_type: branch.action_type,
          value: branch.value,
          log_template: branch.log
        })) : []
      }))
    };

    const updatedPresets = [...presets.filter((p: any) => p.skill_name !== skillName), compiledSkill];
    setPresets(updatedPresets);
    localStorage.setItem('stardust_skill_presets', JSON.stringify(updatedPresets));
    alert(`📁 Saved "${skillName}" to Presets Library!`);
  };

  const handleLoadPreset = (preset: any) => {
    setSkillName(preset.skill_name);
    setAppliesIn(preset.applies_in);
    setPriority(preset.priority);
    setUnsuppressable(preset.unsuppressable || false);
    
    const formattedBlocks = preset.blocks.map((b: any) => {
      const isExcept = String(b.target).startsWith('ALL_ALLIES_EXCEPT_');
      const baseTarget = isExcept ? 'ALL_ALLIES_EXCEPT' : b.target;
      const exceptId = isExcept ? b.target.split('_').pop() : '';

      return {
        trigger: b.trigger,
        target: baseTarget,
        target_param: exceptId,
        chance: String(b.chance || 100),
        action_type: b.action_type,
        value: b.value,
        log: b.log_template,
        conditions: b.conditions ? b.conditions.map((c: any) => ({
          type: c.type,
          param: c.param,
          connector: c.connector || 'AND'
        })) : [{ type: 'NONE', param: '', connector: 'AND' }],
        branches: b.branches ? b.branches.map((branch: any) => ({
          chance: String(branch.chance || 50),
          target: branch.target || 'INHERIT',
          action_type: branch.action_type,
          value: branch.value,
          log: branch.log_template
        })) : [{ chance: '50', target: 'INHERIT', action_type: 'MULTIPLY_POWER', value: '1.0', log: '' }]
      };
    });
    setBlocks(formattedBlocks);
  };

  return (
    <div className="space-y-4 h-[calc(100vh-180px)] overflow-y-auto">
      {/* Search-As-You-Type Horizontal Roster Selector */}
      <div className="flex items-center gap-3 bg-neutral-900 p-3 rounded-lg border border-neutral-800 relative">
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Select Character to Edit:</label>
        
        <div className="relative min-w-[260px]">
          <input
            type="text"
            placeholder="🔍 Search character name..."
            value={isOpen ? searchTerm : (selectedChar ? `${selectedChar.name} (${selectedChar.rarity})` : '')}
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
                  setSelectedChar(null);
                  setSearchTerm('');
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-850 text-xs text-red-400 border-b border-neutral-800 font-bold"
              >
                ✕ Clear Selection
              </button>
              {roster
                .filter(char => char.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(char => (
                  <button
                    key={char.id}
                    type="button"
                    onClick={() => {
                      setSelectedChar(char);
                      setSearchTerm(`${char.name} (${char.rarity})`);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-xs text-neutral-300"
                  >
                    {char.name} ({char.rarity}) [ID {char.id}]
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid Container */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* PANEL 2.1: ACTIVE SKILLS & PRESETS */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-lg flex-1 overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Unit Active Skills</h3>
            {selectedChar ? (
              <div className="space-y-3">
                <p className="text-xs text-neutral-400">Selected: <span className="font-bold text-white">{selectedChar.name}</span></p>
                {Array.isArray(selectedChar.ability_tags) && selectedChar.ability_tags.length > 0 ? (
                  selectedChar.ability_tags.map((skill: any, idx: number) => (
                    <div 
                      key={idx} 
                      onClick={() => handleLoadPreset(skill)}
                      className="group bg-neutral-950 hover:bg-neutral-900/60 border border-neutral-800 p-2.5 rounded text-[11px] space-y-1 cursor-pointer transition-all relative"
                    >
                      <button
                        onClick={(e) => handleDeleteSkill(e, skill.skill_name)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all font-bold text-[10px]"
                      >
                        ✕ Delete
                      </button>
                      <div className="font-semibold text-emerald-400 text-xs">{skill.skill_name}</div>
                      <div className="text-neutral-500">Priority: {skill.priority} | {skill.applies_in}</div>
                      {skill.blocks?.map((b: any, bIdx: number) => (
                        <div key={bIdx} className="text-neutral-400 border-t border-neutral-900 pt-1 mt-1 italic">
                          "{b.log_template || (b.action_type === 'REGISTER_CHANCE_ROUTER' ? 'Branches Chance Engine Triggered' : '')}"
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-500 italic">No skills currently assigned to this unit.</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic">Select a character from the selector above first.</p>
            )}
          </div>

          {/* Local Presets list */}
          <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-lg h-[240px] overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Global Presets Library</h3>
            {presets.length > 0 ? (
              <div className="space-y-1.5">
                {presets.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-neutral-950 p-2 rounded border border-neutral-800/60 text-xs">
                    <span className="font-semibold text-neutral-300">{p.skill_name}</span>
                    <button onClick={() => handleLoadPreset(p)} className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-0.5 px-2 rounded text-[10px]">Load</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic">No saved skill presets.</p>
            )}
          </div>
        </div>

        {/* PANEL 2.2: COMPILER WORKSPACE */}
        <div className="lg:col-span-3 bg-neutral-900 p-6 border border-neutral-800 rounded-lg flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-800/40 pb-3">
            <h3 className="text-md font-bold">✨ Roster Compiler Rigs</h3>
            <div className="flex gap-2">
              <button type="button" onClick={handleSaveAsPreset} className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-1 px-3 rounded text-[11px]">Save as Preset</button>
              <button type="button" onClick={addBlockField} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-3 rounded text-[11px]">+ Add Block</button>
            </div>
          </div>

          {selectedChar ? (
            <form onSubmit={handleSaveSkill} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Skill Name</label>
                  <input type="text" required value={skillName} onChange={(e) => setSkillName(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white" placeholder="Lucky 7" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Priority (1-100)</label>
                  <input type="number" required value={priority} onChange={(e) => setPriority(Number(e.target.value))} className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Context</label>
                  <select value={appliesIn} onChange={(e: any) => setAppliesIn(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white">
                    <option value="combat">Combat</option>
                    <option value="expedition">Expedition</option>
                    <option value="global">Global</option>
                  </select>
                </div>
                <div className="flex items-center pt-4">
                  <input type="checkbox" id="unsuppressable" checked={unsuppressable} onChange={(e) => setUnsuppressable(e.target.checked)} className="mr-2" />
                  <label htmlFor="unsuppressable" className="text-xs font-semibold text-neutral-400">Unsuppressable</label>
                </div>
              </div>

              <div className="space-y-3">
                {blocks.map((block, idx) => (
                  <div key={idx} className="bg-neutral-950/80 border border-neutral-800/80 p-3 rounded-lg relative space-y-3">
                    <button type="button" onClick={() => removeBlockField(idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-400 text-xs">✕</button>
                    
                    {/* Line 1: WHEN / ON / CHANCE */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">WHEN (Trigger)</label>
                        <select
                          value={block.trigger}
                          onChange={(e) => {
                            const next = [...blocks];
                            next[idx].trigger = e.target.value;
                            setBlocks(next);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                        >
                          <option value="ON_BATTLE_START">Battle Starts</option>
                          <option value="ON_POWER_CALC">Power is Calculated</option>
                          <option value="POST_POWER_CALC">Post-Power Calculation</option>
                          <option value="ON_BATTLE_END">Battle Ends</option>
                        </select>
                      </div>
                      
                      {/* Target Selector & Optional Target Parameter */}
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">ON (Target)</label>
                          <select
                            value={block.target}
                            onChange={(e) => updateBlockField(idx, 'target', e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                          >
                            <option value="SELF">Self (Caster)</option>
                            <option value="ADJACENT_ALLIES">Adjacent Allies</option>
                            <option value="ALL_ALLIES">All Allies</option>
                            <option value="ALL_ALLIES_EXCEPT">All Allies Except (By ID)</option>
                            <option value="ALL_ENEMIES">All Enemies</option>
                            <option value="RANDOM_OPPONENT">Random Opponent</option>
                            <option value="WEAKEST_ALLY">Weakest Ally</option>
                            <option value="WEAKEST_ENEMY">Weakest Enemy</option>
                            <option value="STRONGEST_ALLY">Strongest Ally</option>
                            <option value="STRONGEST_ENEMY">Strongest Enemy</option>
                            <option value="SLOT_1">Slot 1 (Absolute L)</option>
                            <option value="SLOT_2">Slot 2</option>
                            <option value="SLOT_3">Slot 3 (Middle)</option>
                            <option value="SLOT_4">Slot 4</option>
                            <option value="SLOT_5">Slot 5 (Absolute R)</option>
                          </select>
                        </div>
                        
                        {/* Dedicated Target Parameter input field */}
                        {block.target === 'ALL_ALLIES_EXCEPT' && (
                          <div className="w-20">
                            <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Except ID</label>
                            <input
                              type="text"
                              value={block.target_param || ''}
                              onChange={(e) => updateBlockField(idx, 'target_param', e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                              placeholder="ID"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">CHANCE (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={block.chance}
                          onChange={(e) => {
                            const next = [...blocks];
                            next[idx].chance = e.target.value;
                            setBlocks(next);
                          }}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                          placeholder="e.g. 100"
                        />
                      </div>
                    </div>

                    {/* Chained Logical Gates */}
                    <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between border-b border-neutral-800/40 pb-1">
                        <span className="text-[10px] uppercase font-bold text-neutral-400">🛡️ Logic Chain (IF Gates)</span>
                        <button type="button" onClick={() => addConditionField(idx)} className="bg-neutral-800 hover:bg-emerald-700 text-white font-bold py-0.5 px-2 rounded text-[9px]">+ Add Condition</button>
                      </div>

                      {block.conditions?.map((cond: any, condIdx: number) => (
                        <div key={condIdx} className="flex flex-wrap items-center gap-2 text-xs">
                          {condIdx > 0 && (
                            <select
                              value={cond.connector || 'AND'}
                              onChange={(e) => updateConditionField(idx, condIdx, 'connector', e.target.value)}
                              className="bg-neutral-950 border border-neutral-800 rounded p-1 text-white text-[10px]"
                            >
                              <option value="AND">AND</option>
                              <option value="OR">OR</option>
                            </select>
                          )}
                          <span className="text-neutral-500 font-bold text-[10px]">{condIdx === 0 ? 'IF' : ''}</span>
                          
                          <select
                            value={cond.type}
                            onChange={(e) => updateConditionField(idx, condIdx, 'type', e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 rounded p-1 text-white text-[10px] flex-1 min-w-[130px]"
                          >
                            <option value="NONE">Always True (No Condition)</option>
                            <option value="IF_TEAM_HAS">Team Has Character ID</option>
                            <option value="IF_TEAM_HAS_SKILL">Team Has Skill Name</option>
                            <option value="IF_POSITION_BETWEEN">Positioned Between IDs</option>
                            <option value="IF_POSITION_ADJACENT_TO">Adjacent to Character ID</option>
                            <option value="IF_POSITION_NOT_ADJACENT_TO">Not Adjacent to Character ID</option>
                            <option value="IF_SELF_SUPPRESSED">If Self is Silenced</option>
                            <option value="IF_RESULT_IS">If Battle Result is (LOSS/WIN)</option>
                            <option value="IF_FLAG_ACTIVE">If Global State Flag is True</option>
                          </select>

                          {cond.type !== 'NONE' && (
                            <input
                              type="text"
                              value={cond.param}
                              onChange={(e) => updateConditionField(idx, condIdx, 'param', e.target.value)}
                              className="bg-neutral-950 border border-neutral-800 rounded p-1 text-white text-[10px] w-16"
                              placeholder="Param"
                            />
                          )}

                          {condIdx > 0 && (
                            <button type="button" onClick={() => removeConditionField(idx, condIdx)} className="text-red-500 hover:text-red-400 text-xs px-1">✕</button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* DO & VALUE / BRANCHES */}
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">DO (Action Type)</label>
                        <select
                          value={block.action_type}
                          onChange={(e) => updateBlockField(idx, 'action_type', e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-xs text-white"
                        >
                          <option value="MULTIPLY_POWER">Multiply Power (Dynamic/Formula)</option>
                          <option value="ADD_FLAT_POWER">Add Flat Power (Formula)</option>
                          <option value="SUPPRESS_SKILL">Suppress / Silence Skill</option>
                          <option value="FORCE_VARIANCE">Force Variance (Float value)</option>
                          <option value="HARVEST_VARIANCE_DELTA">Harvest Variance Delta</option>
                          <option value="SET_STATE_FLAG">Set Global State Flag</option>
                          <option value="REGISTER_RETRY">Register Retry (Yhwach)</option>
                          <option value="SET_MULTIPLIER_FLOOR">Set Multiplier Floor (Cleanse)</option>
                          <option value="ELIMINATE_UNIT">Eliminate / Kill Unit (Kamikaze)</option>
                          <option value="FORCE_BATTLE_RESULT">Force Battle Result (Revive)</option>
                          <option value="REGISTER_POST_PHASE">Register Post-Phase Action (Zodiac)</option>
                          <option value="CLEANSE_SUPPRESSIONS">Cleanse / Purge Suppressions</option>
                          <option value="EXPEDITION_YIELD_MULTIPLIER">Expedition Yield Multiplier</option>
                          <option value="EXPEDITION_TIME_SCALED_MULTIPLIER">Expedition Time Scaled Multiplier</option>
                          <option value="REWARD_MULTIPLIER">Global Reward Multiplier</option>
                          <option value="REGISTER_CHANCE_ROUTER">Split Mutually Exclusive Branches (Joker)</option>
                        </select>
                      </div>

                      {/* DYNAMIC RENDERING: Standard Input vs. Nested Branches List */}
                      {block.action_type === 'REGISTER_CHANCE_ROUTER' ? (
                        <div className="bg-neutral-900/60 p-3 rounded border border-neutral-800 space-y-3">
                          <div className="flex items-center justify-between border-b border-neutral-800/40 pb-1.5">
                            <span className="text-[10px] uppercase font-bold text-neutral-400">🎲 Dynamic Either/Or Branches</span>
                            <button type="button" onClick={() => addBranchField(idx)} className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-0.5 px-2 rounded text-[9px]">+ Add Branch</button>
                          </div>

                          {block.branches?.map((branch: any, brIdx: number) => (
                            <div key={brIdx} className="bg-neutral-950 p-3 rounded border border-neutral-800/60 relative space-y-2">
                              <button type="button" onClick={() => removeBranchField(idx, brIdx)} className="absolute top-2 right-2 text-red-500 hover:text-red-400 text-xs">✕</button>
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                <div>
                                  <label className="block text-[8px] uppercase font-bold text-neutral-500 mb-0.5">Branch Chance (%)</label>
                                  <input type="number" min="1" max="100" value={branch.chance} onChange={(e) => updateBranchField(idx, brIdx, 'chance', e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-[10px] text-white" />
                                </div>
                                <div>
                                  <label className="block text-[8px] uppercase font-bold text-neutral-500 mb-0.5">Branch Target</label>
                                  <select value={branch.target || 'INHERIT'} onChange={(e) => updateBranchField(idx, brIdx, 'target', e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-[10px] text-white">
                                    <option value="INHERIT">Inherit (Use Parent Target)</option>
                                    <option value="SELF">Self (Caster)</option>
                                    <option value="ALL_ALLIES">All Allies</option>
                                    <option value="ALL_ENEMIES">All Enemies</option>
                                    <option value="RANDOM_OPPONENT">Random Opponent</option>
                                    <option value="WEAKEST_ALLY">Weakest Ally</option>
                                    <option value="WEAKEST_ENEMY">Weakest Enemy</option>
                                    <option value="STRONGEST_ALLY">Strongest Ally</option>
                                    <option value="STRONGEST_ENEMY">Strongest Enemy</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[8px] uppercase font-bold text-neutral-500 mb-0.5">Branch DO</label>
                                  <select value={branch.action_type} onChange={(e) => updateBranchField(idx, brIdx, 'action_type', e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-[10px] text-white">
                                    <option value="MULTIPLY_POWER">Multiply Power</option>
                                    <option value="ADD_FLAT_POWER">Add Flat Power</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[8px] uppercase font-bold text-neutral-500 mb-0.5">Branch Formula</label>
                                  <input type="text" value={branch.value} onChange={(e) => updateBranchField(idx, brIdx, 'value', e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-[10px] text-white" placeholder="e.g. 1.75" />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[8px] uppercase font-bold text-neutral-500 mb-0.5">Branch Log</label>
                                <input type="text" value={branch.log} onChange={(e) => updateBranchField(idx, brIdx, 'log', e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-[10px] text-neutral-300" placeholder="e.g. {caster} flipped the Joker!" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Modifier / Formula Value</label>
                            <input
                              type="text"
                              value={block.value}
                              onChange={(e) => updateBlockField(idx, 'value', e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                              placeholder="e.g. 1.50, dead_allies_count"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Log Template (Printed during combat)</label>
                            <input
                              type="text"
                              value={block.log}
                              onChange={(e) => updateBlockField(idx, 'log', e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-neutral-300"
                              placeholder="e.g. {caster} went Berserk (+50% Power)!"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded text-xs transition-all shadow">
                Save and Compile Skill to {selectedChar.name}
              </button>
            </form>
          ) : (
            <p className="text-xs text-neutral-500 italic">Select a character from the selector above first.</p>
          )}
        </div>
      </div>
    </div>
  );
}