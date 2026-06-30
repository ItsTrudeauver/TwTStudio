// components/RaidBossCreator.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BATTLE_ACTIONS } from './SkillCompiler';

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

  // AST Skills Array State
  const [skills, setSkills] = useState<any[]>([]);
  const [selectedSkillIdx, setSelectedSkillIdx] = useState<number>(-1);

  // Active AST Skill Editor States
  const [skillName, setSkillName] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [priority, setPriority] = useState(10);
  const [unsuppressable, setUnsuppressable] = useState(false);
  const [blocks, setBlocks] = useState<any[]>([]);

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
      setSelectedSkillIdx(-1);
      clearSkillForm();
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
    setSelectedSkillIdx(-1);
    clearSkillForm();
  };

  const clearSkillForm = () => {
    setSkillName('');
    setSkillDesc('');
    setPriority(10);
    setUnsuppressable(false);
    setBlocks([]);
  };

  // --- AST BLOCK COMPILER BUILDERS ---
  const addBlockField = () => {
    setBlocks([...blocks, {
      trigger: 'ON_POWER_CALC',
      target: 'FRONT_MOST_ALLY',
      target_param: '',
      chance: '100',
      conditions: [{ type: 'NONE', param: '', connector: 'AND' }],
      action_type: 'DEAL_BOSS_DAMAGE',
      value: '1.0',
      log: '',
      block_tags: []
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

  const handleLoadSkillToEditor = (idx: number) => {
    const skill = skills[idx];
    setSelectedSkillIdx(idx);
    setSkillName(skill.skill_name);
    setSkillDesc(skill.description || '');
    setPriority(skill.priority || 10);
    setUnsuppressable(skill.unsuppressable || false);

    const formattedBlocks = (skill.blocks || []).map((b: any) => {
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
        block_tags: Array.isArray(b.block_tags) ? b.block_tags : [],
        conditions: b.conditions ? b.conditions.map((c: any) => ({
          type: c.type,
          param: c.param,
          connector: c.connector || 'AND'
        })) : [{ type: 'NONE', param: '', connector: 'AND' }]
      };
    });
    setBlocks(formattedBlocks);
  };

  const handleCompileSkillToBoss = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) {
      alert("❌ Skill Name is required!");
      return;
    }

    const compiledSkill = {
      skill_name: skillName,
      description: skillDesc.trim(),
      applies_in: 'combat',
      priority: Number(priority),
      unsuppressable,
      skill_tags: ['Boss_Attack'],
      blocks: blocks.map(b => ({
        trigger: b.trigger,
        target: b.target === 'ALL_ALLIES_EXCEPT' ? `ALL_ALLIES_EXCEPT_${b.target_param}` : b.target,
        chance: Number(b.chance),
        action_type: b.action_type,
        value: b.value,
        log_template: b.log,
        block_tags: Array.isArray(b.block_tags) ? b.block_tags : [],
        conditions: b.conditions.map((c: any) => ({
          type: c.type,
          param: c.param,
          connector: c.connector
        }))
      }))
    };

    let updatedSkills = [...skills];
    if (selectedSkillIdx >= 0) {
      updatedSkills[selectedSkillIdx] = compiledSkill;
    } else {
      updatedSkills = [...updatedSkills.filter(s => s.skill_name !== skillName), compiledSkill];
    }

    setSkills(updatedSkills);
    setSelectedSkillIdx(-1);
    clearSkillForm();
    alert(`🎉 Compiled skill "${skillName}" to active boss state list! Save boss to write changes to DB.`);
  };

  const handleDeleteSkill = (idx: number) => {
    setSkills(skills.filter((_, i) => i !== idx));
    setSelectedSkillIdx(-1);
    clearSkillForm();
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
        skills: skills // Array converts natively to JSONB
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
      {/* Search Selector */}
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
                className="w-full text-left px-3 py-1.5 hover:bg-neutral-880 text-xs text-red-400 border-b border-neutral-800 font-bold"
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
        
        {/* Left Column: Boss Base Stats & Skill Manager (Spans 2 Columns) */}
        <div className="lg:col-span-2 space-y-4 flex flex-col h-full">
          <div className="bg-neutral-900 p-5 border border-neutral-800 rounded-lg space-y-4">
            <h3 className="text-sm font-bold border-b border-neutral-800 pb-2">👾 Boss Core Attributes</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Unique Boss ID</label>
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
                rows={2}
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

          <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-lg space-y-3">
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

          {/* Active Skills State Monitor */}
          <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-lg flex-1 flex flex-col overflow-hidden max-h-[220px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Compiled Boss Skills</h3>
            <div className="flex-1 overflow-y-auto space-y-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded">
              {skills.map((skill, idx) => (
                <div 
                  key={idx} 
                  onClick={() => handleLoadSkillToEditor(idx)}
                  className={`flex items-center justify-between p-2 rounded text-xs transition-all cursor-pointer border ${selectedSkillIdx === idx ? 'bg-neutral-800 border-neutral-700' : 'bg-transparent border-transparent hover:bg-neutral-900'}`}
                >
                  <div className="flex flex-col">
                    <span className="font-bold text-emerald-400">{skill.skill_name}</span>
                    <span className="text-[10px] text-neutral-500 italic mt-0.5">priority: {skill.priority} | blocks: {skill.blocks?.length || 0}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSkill(idx);
                    }} 
                    className="text-red-500 hover:text-red-400 text-[10px] font-bold"
                  >
                    ✕ Delete
                  </button>
                </div>
              ))}
              {skills.length === 0 && (
                <p className="text-[10px] text-neutral-500 italic text-center p-4">No skills loaded on this boss yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AST Visual Sentence Block Compiler (Spans 3 Columns) */}
        <div className="lg:col-span-3 bg-neutral-900 p-6 border border-neutral-800 rounded-lg flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
            <h3 className="text-sm font-bold">🛠️ AST Boss Skill Compiler</h3>
            <div className="flex gap-2">
              {selectedSkillIdx >= 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSkillIdx(-1);
                    clearSkillForm();
                  }}
                  className="bg-neutral-800 hover:bg-neutral-750 text-neutral-300 font-bold py-1 px-3 rounded text-[11px]"
                >
                  + Create New
                </button>
              )}
              <button
                type="button"
                onClick={addBlockField}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-3 rounded text-[11px] transition-all"
              >
                + Add Block
              </button>
            </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-[500px] pr-1">
            <div className="grid grid-cols-3 gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
              <div className="col-span-2">
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Skill Name</label>
                <input 
                  type="text" 
                  value={skillName} 
                  onChange={(e) => setSkillName(e.target.value)} 
                  className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white" 
                  placeholder="Encounter: Dimensional Divide" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Priority</label>
                <input 
                  type="number" 
                  value={priority} 
                  onChange={(e) => setPriority(Number(e.target.value))} 
                  className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white" 
                />
              </div>
            </div>

            <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
              <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Skill Plaintext Description</label>
              <textarea
                rows={1}
                value={skillDesc}
                onChange={(e) => setSkillDesc(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-white resize-none"
                placeholder="Diagnostic execution descriptions only. What happens, when."
              />
            </div>

            {/* AST Blocks List */}
            <div className="space-y-3">
              {blocks.map((block, idx) => (
                <div key={idx} className="bg-neutral-950 border border-neutral-800/80 p-3 rounded-lg relative space-y-3">
                  <button 
                    type="button" 
                    onClick={() => removeBlockField(idx)} 
                    className="absolute top-2 right-2 text-red-500 hover:text-red-400 text-xs"
                  >
                    ✕
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">WHEN (Trigger)</label>
                      <select
                        value={block.trigger}
                        onChange={(e) => updateBlockField(idx, 'trigger', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                      >
                        <option value="ON_BATTLE_START">Battle Starts</option>
                        <option value="ON_POWER_CALC">Turn is Processed (ON_POWER_CALC)</option>
                        <option value="POST_POWER_CALC">Post-Power Calculation</option>
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">ON (Target)</label>
                        <select
                          value={block.target}
                          onChange={(e) => updateBlockField(idx, 'target', e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                        >
                          <option value="FRONT_MOST_ALLY">Front-most Player Unit (Raid Tank)</option>
                          <option value="WEAKEST_ALLY">Weakest Player Unit</option>
                          <option value="STRONGEST_ALLY">Strongest Player Unit</option>
                          <option value="ALL_ALLIES">All Player Units (Team-Wide)</option>
                          <option value="ALL_ALLIES_EXCEPT">All Players Except (By ID)</option>
                          <option value="SELF">Self (The Boss)</option>
                          <option value="SLOT_1">Player Slot 1 (Absolute L)</option>
                          <option value="SLOT_2">Player Slot 2</option>
                          <option value="SLOT_3">Player Slot 3 (Middle)</option>
                          <option value="SLOT_4">Player Slot 4</option>
                          <option value="SLOT_5">Player Slot 5 (Absolute R)</option>
                        </select>
                      </div>

                      {block.target === 'ALL_ALLIES_EXCEPT' && (
                        <div className="w-16">
                          <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Except ID</label>
                          <input
                            type="text"
                            value={block.target_param || ''}
                            onChange={(e) => updateBlockField(idx, 'target_param', e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
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
                        onChange={(e) => updateBlockField(idx, 'chance', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* IF Conditions block */}
                  <div className="bg-neutral-900/60 p-2 rounded border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between border-b border-neutral-800/40 pb-1">
                      <span className="text-[10px] uppercase font-bold text-neutral-400">🛡️ Logic Chain (IF Gates)</span>
                      <button 
                        type="button" 
                        onClick={() => addConditionField(idx)} 
                        className="bg-neutral-850 hover:bg-neutral-800 text-white font-bold py-0.5 px-2 rounded text-[9px]"
                      >
                        + Add IF Gate
                      </button>
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
                          <option value="IF_TURN_MODULO">Turn is Modulo of N</option>
                          <option value="IF_FLAG_ACTIVE">If Global State Flag is True</option>
                          <option value="IF_TEAM_HAS">Player Team Has Character ID</option>
                        </select>

                        {cond.type !== 'NONE' && (
                          <input
                            type="text"
                            value={cond.param}
                            onChange={(e) => updateConditionField(idx, condIdx, 'param', e.target.value)}
                            className="bg-neutral-950 border border-neutral-800 rounded p-1 text-white text-[10px] w-16"
                          />
                        )}

                        {condIdx > 0 && (
                          <button 
                            type="button" 
                            onClick={() => removeConditionField(idx, condIdx)} 
                            className="text-red-500 hover:text-red-400 text-xs px-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* DO Action block */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs border-t border-neutral-900/60 pt-3">
                    <div className="md:col-span-2">
                      <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">DO (Action Type)</label>
                      <select
                        value={block.action_type}
                        onChange={(e) => updateBlockField(idx, 'action_type', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                      >
                        {BATTLE_ACTIONS.map(action => (
                          <option key={action.value} value={action.value}>{action.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Formula Modifier Value</label>
                      <input
                        type="text"
                        value={block.value}
                        onChange={(e) => updateBlockField(idx, 'value', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                        placeholder="e.g. 1.5, own_atk"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Log Template (Printed during combat)</label>
                      <input
                        type="text"
                        value={block.log}
                        onChange={(e) => updateBlockField(idx, 'log', e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-neutral-300"
                        placeholder="e.g. {caster} cast Dimensional Divide dealing {math} damage!"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {blocks.length === 0 && (
                <p className="text-xs text-neutral-500 italic p-6 text-center bg-neutral-950 border border-neutral-800 rounded-lg">
                  No functional blocks defined in this skill. Click "+ Add Block" to build sentences.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-neutral-800 pt-4">
              <button
                type="button"
                onClick={handleCompileSkillToBoss}
                className="w-full bg-neutral-100 hover:bg-white text-neutral-900 font-bold py-2 rounded text-xs transition-all shadow"
              >
                {selectedSkillIdx >= 0 ? 'Update Skill in State' : 'Compile Skill to Boss List'}
              </button>
              <button
                type="submit"
                disabled={submitting}
                onClick={handleSaveBoss}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs transition-all shadow disabled:opacity-50"
              >
                {submitting ? 'Compiling to database...' : selectedBoss ? `Save Active Boss: ${name}` : 'Create Brand New Boss'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}