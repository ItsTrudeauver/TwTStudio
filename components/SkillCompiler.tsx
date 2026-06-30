'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SkillCompilerProps {
  selectedChar: any;
  setSelectedChar: (char: any) => void;
  fetchRoster: () => void;
  roster: any[];
  selectedRelic: any;
  setSelectedRelic: (relic: any) => void;
  fetchRelics: () => void;
  relics: any[];
}

const STANDARD_TAGS = [
  'Gamble', 'Gamble_Succeed', 'Gamble_Fail', 'Buff', 'Debuff', 
  'Synergy', 'Sacrifice', 'Disabler', 'Responsive', 'Sustain', 
  'Heal', 'Shield', 'Direct_Damage', 'HP_Multiplier', 'Rule_Lock', 
  'Yield_Multiplier', 'Death_Instance', 'Silence'
];

interface TagSelectorProps {
  tags: string[];
  onChange: (newTags: string[]) => void;
  placeholder?: string;
}

function TagSelector({ tags, onChange, placeholder = "Select tags..." }: TagSelectorProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const rawTags = tags as any;
  const sanitizedTags: string[] = Array.isArray(rawTags)
    ? rawTags
    : (typeof rawTags === 'string' && rawTags.trim() !== ''
        ? rawTags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : []);

  const filtered = STANDARD_TAGS.filter((t: string) => 
    t.toLowerCase().includes(query.toLowerCase()) && !sanitizedTags.includes(t)
  );

  const addTag = (tag: string) => {
    if (!sanitizedTags.includes(tag)) {
      onChange([...sanitizedTags, tag]);
    }
    setQuery('');
    setIsOpen(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(sanitizedTags.filter((t: string) => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      addTag(query.trim());
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex flex-wrap gap-1 bg-neutral-900 border border-neutral-800 rounded p-1.5 min-h-[38px] items-center focus-within:border-neutral-700">
        {sanitizedTags.map((t: string) => (
          <span key={t} className="flex items-center gap-1 bg-neutral-800 text-neutral-200 text-[10px] font-bold px-2 py-0.5 rounded border border-neutral-700">
            {t}
            <button type="button" onClick={() => removeTag(t)} className="text-red-400 hover:text-red-350 font-bold ml-0.5">✕</button>
          </span>
        ))}
        <input
          type="text"
          placeholder={sanitizedTags.length === 0 ? placeholder : ''}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent text-xs text-white outline-none placeholder-neutral-500 min-w-[60px]"
        />
      </div>
      {isOpen && (query || filtered.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded shadow-2xl z-50">
          {filtered.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => addTag(t)}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-880 text-xs text-neutral-300 transition-colors"
            >
              {t}
            </button>
          ))}
          {query.trim() && !STANDARD_TAGS.includes(query.trim()) && !sanitizedTags.includes(query.trim()) && (
            <button
              type="button"
              onClick={() => addTag(query.trim())}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-xs text-emerald-400 font-semibold border-t border-neutral-900 transition-colors"
            >
              ➕ Create tag: "{query.trim()}"
            </button>
          )}
        </div>
      )}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

export default function SkillCompiler({ 
  selectedChar, setSelectedChar, fetchRoster, roster,
  selectedRelic, setSelectedRelic, fetchRelics, relics 
}: SkillCompilerProps) {
  const [compilerMode, setCompilerMode] = useState<'character' | 'pigment'>('character');
  const [skillName, setSkillName] = useState('');
  const [description, setDescription] = useState('');
  const [appliesIn, setAppliesIn] = useState<'combat' | 'expedition' | 'global'>('combat');
  const [priority, setPriority] = useState(10);
  const [unsuppressable, setUnsuppressable] = useState(false);
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [presets, setPresets] = useState<any[]>([]);

  // Sandbox variables
  const [testFormula, setTestFormula] = useState('1.5 * dupes');
  const [sandboxDupes, setSandboxDupes] = useState(5);
  const [sandboxDeadAllies, setSandboxDeadAllies] = useState(0);
  const [sandboxSuppressed, setSandboxSuppressed] = useState(0);
  const [sandboxResult, setSandboxResult] = useState<string | number>('');

  // Search dropdown states
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // In-state blocks initialized with conditions and branches
  const [blocks, setBlocks] = useState<any[]>([
    {
      trigger: 'ON_POWER_CALC',
      target: 'SELF',
      target_param: '',
      chance: '100',
      conditions: [{ type: 'NONE', param: '', connector: 'AND' }],
      branches: [{ chance: '50', target: 'INHERIT', action_type: 'MULTIPLY_ATK', value: '1.0', log: '', branch_tags: [] }],
      action_type: 'MULTIPLY_ATK',
      value: '1.25',
      log: '{caster} entered Surge!',
      block_tags: []
    }
  ]);

  const handleRunSandbox = () => {
    try {
      // Stub tag helper calls and mathematical context variables to replicate backend engine scope
      let clean = testFormula
        .replace(/\bdupes\b/g, String(sandboxDupes))
        .replace(/\bdupe_level\b/g, String(sandboxDupes))
        .replace(/\bdead_allies_count\b/g, String(sandboxDeadAllies))
        .replace(/\bsuppressed_count\b/g, String(sandboxSuppressed))
        .replace(/\bbond_level\b/g, '5')
        .replace(/\bpower\b/g, '15000')
        .replace(/\btrue_power\b/g, '15000')
        .replace(/\bown_max_hp\b/g, '10000')
        .replace(/\bown_current_hp\b/g, '8500')
        .replace(/\bown_atk\b/g, '1200')
        .replace(/\bown_def\b/g, '450')
        .replace(/\btarget_max_hp\b/g, '50000')
        .replace(/\btarget_current_hp\b/g, '35000')
        .replace(/\btarget_lost_hp\b/g, '15000')
        .replace(/count_tag\([^)]*\)/g, '1')
        .replace(/has_tag\([^)]*\)/g, 'true')
        .replace(/enemy_count_tag\([^)]*\)/g, '0')
        .replace(/enemy_has_tag\([^)]*\)/g, 'false');

      if (/[^-+*/()0-9.\s]/i.test(clean.replace(/\*\*/g, ''))) {
        throw new Error('Unsupported tokens in validation sandbox');
      }

      const evalSafe = Function(`"use strict"; return (${clean})`)();
      setSandboxResult(Number(evalSafe));
    } catch (err: any) {
      setSandboxResult(`Error: ${err.message}`);
    }
  };

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
      branches: [{ chance: '50', target: 'INHERIT', action_type: 'MULTIPLY_ATK', value: '1.0', log: '', branch_tags: [] }],
      action_type: 'MULTIPLY_ATK',
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

  const addBranchField = (blockIdx: number) => {
    const updated = [...blocks];
    if (!updated[blockIdx].branches) updated[blockIdx].branches = [];
    updated[blockIdx].branches.push({ chance: '50', target: 'INHERIT', action_type: 'MULTIPLY_ATK', value: '1.0', log: '', branch_tags: [] });
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
    const activeObj = compilerMode === 'character' ? selectedChar : selectedRelic;
    if (!activeObj) return;
    if (!confirm(`Are you sure you want to delete the "${skillNameToDelete}" skill from ${activeObj.name}?`)) return;

    const currentSkills = Array.isArray(activeObj.ability_tags) ? activeObj.ability_tags : [];
    const updatedSkills = currentSkills.filter((s: any) => s.skill_name !== skillNameToDelete);
    const targetTable = compilerMode === 'character' ? 'characters_cache' : 'relics_cache';

    const { error } = await supabase
      .from(targetTable)
      .update({ ability_tags: updatedSkills })
      .eq('id', activeObj.id);

    if (error) {
      alert(`Error deleting skill: ${error.message}`);
    } else {
      if (compilerMode === 'character') {
        setSelectedChar({ ...selectedChar, ability_tags: updatedSkills });
        fetchRoster();
      } else {
        setSelectedRelic({ ...selectedRelic, ability_tags: updatedSkills });
        fetchRelics();
      }
    }
  };

  const compileSkillPayload = () => {
    return {
      skill_name: skillName,
      description: description.trim(),
      applies_in: appliesIn,
      priority: Number(priority),
      unsuppressable,
      skill_tags: Array.isArray(skillTags) ? skillTags : [],
      blocks: blocks.map(b => ({
        trigger: b.trigger,
        target: b.target === 'ALL_ALLIES_EXCEPT' ? `ALL_ALLIES_EXCEPT_${b.target_param}` : b.target,
        chance: Number(b.chance),
        action_type: b.action_type,
        value: b.action_type === 'REGISTER_CHANCE_ROUTER' ? '' : b.value,
        log_template: b.action_type === 'REGISTER_CHANCE_ROUTER' ? '' : b.log,
        block_tags: Array.isArray(b.block_tags) ? b.block_tags : [],
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
          branch_tags: Array.isArray(branch.branch_tags) ? branch.branch_tags : [],
          log_template: branch.log
        })) : []
      }))
    };
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeObj = compilerMode === 'character' ? selectedChar : selectedRelic;
    if (!activeObj) {
      alert('Please select an active compiler target before saving.');
      return;
    }

    const compiledSkill = compileSkillPayload();
    const currentSkills = Array.isArray(activeObj.ability_tags) ? activeObj.ability_tags : [];
    const updatedSkills = [...currentSkills.filter((s: any) => s.skill_name !== skillName), compiledSkill];
    const targetTable = compilerMode === 'character' ? 'characters_cache' : 'relics_cache';

    const { error } = await supabase
      .from(targetTable)
      .update({ ability_tags: updatedSkills })
      .eq('id', activeObj.id);

    if (error) {
      alert(`Error saving skill: ${error.message}`);
    } else {
      alert(`Compiled skill saved to ${activeObj.name}!`);
      if (compilerMode === 'character') {
        setSelectedChar({ ...selectedChar, ability_tags: updatedSkills });
        fetchRoster();
      } else {
        setSelectedRelic({ ...selectedRelic, ability_tags: updatedSkills });
        fetchRelics();
      }
      setSkillName('');
      setDescription('');
    }
  };

  const handleSaveAsPreset = () => {
    if (!skillName || !skillName.trim()) {
      alert('Please enter a skill name first.');
      return;
    }
    const compiledSkill = compileSkillPayload();
    const updatedPresets = [...presets.filter((p: any) => p.skill_name !== skillName), compiledSkill];
    setPresets(updatedPresets);
    localStorage.setItem('stardust_skill_presets', JSON.stringify(updatedPresets));
    alert(`Saved "${skillName}" to Presets Library!`);
  };

  const handleLoadPreset = (preset: any) => {
    setSkillName(preset.skill_name);
    setDescription(preset.description || '');
    setAppliesIn(preset.applies_in);
    setPriority(preset.priority);
    setUnsuppressable(preset.unsuppressable || false);
    
    // Resolve the raw tag arrays cleanly to prevent array-to-string format mismatches on subsequent compiles
    setSkillTags(Array.isArray(preset.skill_tags) ? preset.skill_tags : []);

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
        block_tags: Array.isArray(b.block_tags) ? b.block_tags : [],
        conditions: b.conditions ? b.conditions.map((c: any) => ({
          type: c.type,
          param: c.param,
          connector: c.connector || 'AND'
        })) : [{ type: 'NONE', param: '', connector: 'AND' }],
        branches: b.branches ? b.branches.map((branch: any) => {
          return {
            chance: String(branch.chance || 50),
            target: branch.target || 'INHERIT',
            action_type: branch.action_type,
            value: branch.value,
            branch_tags: Array.isArray(branch.branch_tags) ? branch.branch_tags : [],
            log: branch.log_template
          };
        }) : [{ chance: '50', target: 'INHERIT', action_type: 'MULTIPLY_ATK', value: '1.0', log: '', branch_tags: [] }]
      };
    });
    setBlocks(formattedBlocks);
  };

  return (
    <div className="space-y-4 text-white">
      {/* Mode Switch Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-neutral-900 p-3 rounded-lg border border-neutral-800 relative">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Target Type:</label>
          <div className="flex bg-neutral-950 rounded p-1 border border-neutral-800">
            <button
              onClick={() => {
                setCompilerMode('character');
                setSearchTerm('');
                setIsOpen(false);
              }}
              className={`py-1 px-3 rounded text-[10px] font-bold transition-all ${compilerMode === 'character' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              👤 Character
            </button>
            <button
              onClick={() => {
                setCompilerMode('pigment');
                setSearchTerm('');
                setIsOpen(false);
              }}
              className={`py-1 px-3 rounded text-[10px] font-bold transition-all ${compilerMode === 'pigment' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              🔮 Pigment
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Active Selection:</label>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={compilerMode === 'character' ? "🔍 Search character..." : "🔍 Search pigment..."}
              value={isOpen ? searchTerm : (compilerMode === 'character' ? (selectedChar ? `${selectedChar.name} (${selectedChar.rarity})` : '') : (selectedRelic ? `${selectedRelic.name} (${selectedRelic.chroma_color})` : ''))}
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
                    if (compilerMode === 'character') setSelectedChar(null);
                    else setSelectedRelic(null);
                    setSearchTerm('');
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-850 text-xs text-red-400 border-b border-neutral-800 font-bold"
                >
                  ✕ Clear Selection
                </button>
                {compilerMode === 'character' ? (
                  roster
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
                    ))
                ) : (
                  relics
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
                        {r.name} ({r.rarity}) [{r.chroma_color}] [ID {r.id}]
                      </button>
                    ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Assets & Sandbox */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-lg h-[350px] overflow-y-auto">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Unit Active Skills</h3>
            {((compilerMode === 'character' && selectedChar) || (compilerMode === 'pigment' && selectedRelic)) ? (
              <div className="space-y-3">
                <p className="text-xs text-neutral-400">Selected: <span className="font-bold text-white">{compilerMode === 'character' ? selectedChar.name : selectedRelic.name}</span></p>
                {(compilerMode === 'character' ? selectedChar.ability_tags : selectedRelic.ability_tags)?.map((skill: any, idx: number) => (
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
                ))}
                {((compilerMode === 'character' ? selectedChar.ability_tags : selectedRelic.ability_tags) || []).length === 0 && (
                  <p className="text-xs text-neutral-500 italic">No skills currently assigned.</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic">Select an asset from the switcher above first.</p>
            )}
          </div>

          <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-lg h-[200px] overflow-y-auto">
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

          {/* Math validator */}
          <div className="bg-neutral-900 p-4 border border-neutral-800 rounded-lg space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">🧮 Math Formula Validator</h3>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Formula to test</label>
                <input
                  type="text"
                  value={testFormula}
                  onChange={(e) => setTestFormula(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-white"
                  placeholder="e.g. 1.10 ** dead_allies_count"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[8px] uppercase font-bold text-neutral-500 mb-1">Dupes</label>
                  <input type="number" value={sandboxDupes} onChange={(e) => setSandboxDupes(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded p-1 text-center font-bold text-white" />
                </div>
                <div>
                  <label className="block text-[8px] uppercase font-bold text-neutral-500 mb-1">Dead Allies</label>
                  <input type="number" value={sandboxDeadAllies} onChange={(e) => setSandboxDeadAllies(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded p-1 text-center font-bold text-white" />
                </div>
                <div>
                  <label className="block text-[8px] uppercase font-bold text-neutral-500 mb-1">Suppressed</label>
                  <input type="number" value={sandboxSuppressed} onChange={(e) => setSandboxSuppressed(Number(e.target.value))} className="w-full bg-neutral-950 border border-neutral-800 rounded p-1 text-center font-bold text-white" />
                </div>
              </div>
              <button
                type="button"
                onClick={handleRunSandbox}
                className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-1.5 rounded transition-all text-[11px]"
              >
                Compute Mock Parse
              </button>
              {sandboxResult !== '' && (
                <div className="bg-neutral-950 border border-neutral-800 p-2 rounded flex justify-between font-mono text-[11px]">
                  <span className="text-neutral-500">Output:</span>
                  <span className={String(sandboxResult).startsWith('Error') ? 'text-red-400' : 'text-emerald-400 font-bold'}>{sandboxResult}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="lg:col-span-3 bg-neutral-900 p-6 border border-neutral-800 rounded-lg flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 border-b border-neutral-800/40 pb-3">
            <h3 className="text-md font-bold">✨ Roster Compiler Rigs</h3>
            <div className="flex gap-2">
              <button type="button" onClick={handleSaveAsPreset} className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-1 px-3 rounded text-[11px]">Save as Preset</button>
              <button type="button" onClick={addBlockField} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-3 rounded text-[11px]">+ Add Block</button>
            </div>
          </div>

          {((compilerMode === 'character' && selectedChar) || (compilerMode === 'pigment' && selectedRelic)) ? (
            <form onSubmit={handleSaveSkill} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
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
                <div className="md:col-span-2">
                  <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Static Skill Tags</label>
                  <TagSelector tags={skillTags} onChange={(newTags) => setSkillTags(newTags)} />
                </div>
                <div className="flex items-center pt-4">
                  <input type="checkbox" id="unsuppressable" checked={unsuppressable} onChange={(e) => setUnsuppressable(e.target.checked)} className="mr-2" />
                  <label htmlFor="unsuppressable" className="text-xs font-semibold text-neutral-400">Unsuppressable</label>
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
                <label className="block text-[10px] uppercase font-bold text-neutral-500 mb-1">Skill Plaintext Description</label>
                <textarea
                  required
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-xs text-white focus:outline-none focus:border-neutral-700 resize-none"
                  placeholder="Operational execution logs only. What happens, when, to whom. No lore or flavor text."
                />
              </div>

              <div className="space-y-3">
                {blocks.map((block, idx) => (
                  <div key={idx} className="bg-neutral-950/80 border border-neutral-800/80 p-3 rounded-lg relative space-y-3">
                    <button type="button" onClick={() => removeBlockField(idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-400 text-xs">✕</button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">WHEN (Trigger)</label>
                        <select
                          value={block.trigger}
                          onChange={(e) => updateBlockField(idx, 'trigger', e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white animate-none"
                        >
                          <option value="ON_BATTLE_START">Battle Starts</option>
                          <option value="ON_POWER_CALC">Power is Calculated</option>
                          <option value="POST_POWER_CALC">Post-Power Calculation</option>
                          <option value="ON_BATTLE_END">Battle Ends</option>
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
                            <option value="OPPOSING_INDEX">Opposing Index (Symmetric slot mapping)</option>
                            <option value="LOWEST_HP_PERCENT_ALLY">Lowest HP % Ally (Heal)</option>
                            <option value="FRONT_MOST_ALLY">Front-most Ally (Raid Tank)</option>
                            <option value="FRONT_MOST_ENEMY">Front-most Enemy (Raid Boss / Active Target)</option>
                            <option value="SLOT_1">Slot 1 (Absolute L)</option>
                            <option value="SLOT_2">Slot 2</option>
                            <option value="Slot 3">Slot 3 (Middle)</option>
                            <option value="SLOT_4">Slot 4</option>
                            <option value="SLOT_5">Slot 5 (Absolute R)</option>
                          </select>
                        </div>
                        
                        {block.target === 'ALL_ALLIES_EXCEPT' && (
                          <div className="w-20">
                            <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Except ID</label>
                            <input
                              type="text"
                              value={block.target_param || ''}
                              onChange={(e) => updateBlockField(idx, 'target_param', e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white font-semibold"
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
                          onChange={(e) => updateBlockField(idx, 'chance', e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                          placeholder="e.g. 100"
                        />
                      </div>
                    </div>

                    {/* Logic Gate Chain */}
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

                    {/* Action Select and Sub-branches */}
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">DO (Action Type)</label>
                        <select
                          value={block.action_type}
                          onChange={(e) => updateBlockField(idx, 'action_type', e.target.value)}
                          className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-xs text-white"
                        >
                          <option value="MULTIPLY_POWER">Multiply Power (Anya/Specialist Exception)</option>
                          <option value="ADD_FLAT_POWER">Add Flat Power (Mayple/Specialist Exception)</option>
                          <option value="MULTIPLY_ATK">Multiply ATK (3-Stat Budget Model)</option>
                          <option value="SET_ATK_MULTIPLIER">Set ATK Multiplier</option>
                          <option value="MULTIPLY_DEF">Multiply DEF (3-Stat Budget Model)</option>
                          <option value="MULTIPLY_HP">Multiply HP (3-Stat Budget Model)</option>
                          <option value="ADD_FLAT_ATK">Add Flat ATK (3-Stat Budget Model)</option>
                          <option value="MULTIPLY_BASE_ATK">Multiply Base ATK (Permanent Stat Shift)</option>
                          <option value="ADD_BASE_ATK">Add Base ATK (Permanent Flat Stat Shift)</option>
                          <option value="MULTIPLY_BASE_DEF">Multiply Base DEF (Permanent Stat Shift)</option>
                          <option value="ADD_BASE_DEF">Add Base DEF (Permanent Flat Stat Shift)</option>
                          <option value="MULTIPLY_BASE_POWER">Multiply Base Power (Synchronizes HP & Stats)</option>
                          <option value="ADD_BASE_POWER">Add Base Power (Class-Allocated Bonus)</option>
                          <option value="MULTIPLY_BASE_HP">Multiply Base HP (Synchronized Scaling Shift)</option>
                          <option value="ADD_BASE_HP">Add Base HP (Synchronized Flat Bonus)</option>
                          <option value="HEAL_ALLY">Heal Ally (Shared HP / Raid HP Scaling)</option>
                          <option value="HEAL_BOSS">Heal Boss (Inversion Mechanics)</option>
                          <option value="DEAL_BOSS_DAMAGE">Deal Boss Damage (Scaled by Caster ATK)</option>
                          <option value="DIVINE_REVERSAL">Divine Reversal (Inversion Damage Burst)</option>
                          <option value="ADD_PERSISTENT_SHIELD">Add Persistent Shield (Barrier)</option>
                          <option value="REINFORCE_STRUCK_SHIELD">Reinforce Struck Shield</option>
                          <option value="SET_BASE_POWER">Set Base Power (Anya Mind-read)</option>
                          <option value="SUPPRESS_SKILL">Suppress / Silence Skill</option>
                          <option value="SUPPRESS_RANDOM_SKILL">Suppress Random Skill (Targeted slot-based seal)</option>
                          <option value="CLEANSE_RANDOM_SUPPRESSION">Cleanse Random Suppression (Clear active silence)</option>
                          <option value="SUFFER_RECOIL_DAMAGE">Suffer Recoil Damage (Deals self damage based on ATK formula)</option>
                          <option value="DISPEL_BUFFS">Dispel Buffs (Purge opposing positive modifiers)</option>
                          <option value="CLEANSE_DEBUFFS">Cleanse Debuffs (Purge active deficits and silences)</option>
                          <option value="FORCE_VARIANCE">Force Variance (Float value)</option>
                          <option value="HARVEST_VARIANCE_DELTA">Harvest Variance Delta</option>
                          <option value="SET_STATE_FLAG">Set Global State Flag</option>
                          <option value="SET_MULTIPLIER_FLOOR">Set Multiplier Floor (Cleanse)</option>
                          <option value="ELIMINATE_UNIT">Eliminate / Kill Unit (Kamikaze)</option>
                          <option value="FORCE_BATTLE_RESULT">Force Battle Result (Revive)</option>
                          <option value="REGISTER_POST_PHASE">Register Post-Phase Action (Zodiac)</option>
                          <option value="REGISTER_RETRY">Register Turn Retry (Retry Stacks Loop)</option>
                          <option value="CLEANSE_SUPPRESSIONS">Cleanse / Purge Suppressions</option>
                          <option value="EXPEDITION_YIELD_MULTIPLIER">Expedition Yield Multiplier (Time and resource bonuses)</option>
                          <option value="EXPEDITION_TIME_SCALED_MULTIPLIER">Expedition Time Scaled Multiplier</option>
                          <option value="REWARD_MULTIPLIER">Global Reward Multiplier</option>
                          <option value="REGISTER_CHANCE_ROUTER">Split Mutually Exclusive Branches (Joker)</option>
                          <option value="APPLY_VULNERABLE">Apply Vulnerable (Target receives amplified damage this turn)</option>
                          <option value="APPLY_ENFEEBLE">Apply Enfeeble (Target deals reduced outgoing damage this turn)</option>
                          <option value="APPLY_BARRIER">Apply Barrier (Negate one incoming hit; stackable, expires in 1 turn)</option>
                        </select>
                      </div>

                      {block.action_type === 'REGISTER_CHANCE_ROUTER' ? (
                        <div className="bg-neutral-900/60 p-3 rounded border border-neutral-800 space-y-3">
                          <div className="flex items-center justify-between border-b border-neutral-800/40 pb-1.5">
                            <span className="text-[10px] uppercase font-bold text-neutral-400">🎲 Dynamic Either/Or Branches</span>
                            <button type="button" onClick={() => addBranchField(idx)} className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-0.5 px-2 rounded text-[9px]">+ Add Branch</button>
                          </div>

                          {block.branches?.map((branch: any, brIdx: number) => (
                            <div key={brIdx} className="bg-neutral-950 p-3 rounded border border-neutral-800/60 relative space-y-2">
                              <button type="button" onClick={() => removeBranchField(idx, brIdx)} className="absolute top-2 right-2 text-red-500 hover:text-red-400 text-xs">✕</button>

                              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
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
                                    <option value="OPPOSING_INDEX">Opposing Index</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[8px] uppercase font-bold text-neutral-500 mb-0.5">Branch DO</label>
                                  <select value={branch.action_type} onChange={(e) => updateBranchField(idx, brIdx, 'action_type', e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-[10px] text-white">
                                    <option value="MULTIPLY_POWER">Multiply Power</option>
                                    <option value="MULTIPLY_BASE_POWER">Multiply Base Power</option>
                                    <option value="ADD_FLAT_POWER">Add Flat Power</option>
                                    <option value="MULTIPLY_ATK">Multiply ATK</option>
                                    <option value="SET_ATK_MULTIPLIER">Set ATK Multiplier</option>
                                    <option value="MULTIPLY_DEF">Multiply DEF</option>
                                    <option value="MULTIPLY_HP">Multiply HP</option>
                                    <option value="ADD_FLAT_ATK">Add Flat ATK</option>
                                    <option value="MULTIPLY_BASE_ATK">Multiply Base ATK</option>
                                    <option value="ADD_BASE_ATK">Add Base ATK</option>
                                    <option value="MULTIPLY_BASE_DEF">Multiply Base DEF</option>
                                    <option value="ADD_BASE_DEF">Add Base DEF</option>
                                    <option value="MULTIPLY_BASE_POWER">Multiply Base Power</option>
                                    <option value="ADD_BASE_POWER">Add Base Power</option>
                                    <option value="MULTIPLY_BASE_HP">Multiply Base HP</option>
                                    <option value="ADD_BASE_HP">Add Base HP</option>
                                    <option value="HEAL_ALLY">Heal Ally</option>
                                    <option value="DEAL_BOSS_DAMAGE">Deal Boss Damage</option>
                                    <option value="ADD_PERSISTENT_SHIELD">Add Persistent Shield</option>
                                    <option value="FORCE_VARIANCE">Force Variance</option>
                                    <option value="REGISTER_POST_PHASE">Register Post-Phase Action</option>
                                    <option value="SUPPRESS_SKILL">Suppress / Silence Skill</option>
                                    <option value="SUPPRESS_RANDOM_SKILL">Suppress Random Skill</option>
                                    <option value="CLEANSE_RANDOM_SUPPRESSION">Cleanse Random Suppression</option>
                                    <option value="SUFFER_RECOIL_DAMAGE">Suffer Recoil Damage</option>
                                    <option value="DISPEL_BUFFS">Dispel Buffs</option>
                                    <option value="CLEANSE_DEBUFFS">Cleanse Debuffs</option>
                                    <option value="ELIMINATE_UNIT">Eliminate / Kill Unit</option>
                                    <option value="FORCE_BATTLE_RESULT">Force Battle Result</option>
                                    <option value="CLEANSE_SUPPRESSIONS">Cleanse Suppressions</option>
                                    <option value="APPLY_VULNERABLE">Apply Vulnerable</option>
                                    <option value="APPLY_ENFEEBLE">Apply Enfeeble</option>
                                    <option value="APPLY_BARRIER">Apply Barrier</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[8px] uppercase font-bold text-neutral-500 mb-0.5">Branch Formula</label>
                                  <input type="text" value={branch.value} onChange={(e) => updateBranchField(idx, brIdx, 'value', e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded p-1 text-[10px] text-white" placeholder="e.g. 1.75" />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-[8px] uppercase font-bold text-neutral-500 mb-0.5">Branch Tags</label>
                                  <TagSelector
                                    tags={Array.isArray(branch.branch_tags) ? branch.branch_tags : []}
                                    onChange={(newTags) => updateBranchField(idx, brIdx, 'branch_tags', newTags)}
                                  />
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Modifier / Formula Value</label>
                            <input
                              type="text"
                              value={block.value}
                              onChange={(e) => updateBlockField(idx, 'value', e.target.value)}
                              className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-xs text-white"
                              placeholder="e.g. 1.50, dead_allies_count, target_lost_hp, own_max_hp"
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

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-neutral-500 mb-1">Block Tags</label>
                            <TagSelector
                              tags={Array.isArray(block.block_tags) ? block.block_tags : []}
                              onChange={(newTags) => updateBlockField(idx, 'block_tags', newTags)}
                              placeholder="Add block-level tags..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded text-xs transition-all shadow">
                Save and Compile Skill to {compilerMode === 'character' ? selectedChar.name : selectedRelic.name}
              </button>
            </form>
          ) : (
            <p className="text-xs text-neutral-500 italic">Select an active target from the selector above first.</p>
          )}
        </div>
      </div>
    </div>
  );
}