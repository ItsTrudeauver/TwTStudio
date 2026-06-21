// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Modular Component Imports
import RosterCreator from '../components/RosterCreator';
import SkillCompiler from '../components/SkillCompiler';
import BannerManager from '../components/BannerManager';
import PlayerAuditor from '../components/PlayerAuditor';

export default function AdminStudio() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Tab Manager: Roster, Skills, Banners, Player Audits
  const [activeTab, setActiveTab] = useState<'roster' | 'skills' | 'banners' | 'auditor'>('skills');
  const [roster, setRoster] = useState<any[]>([]);
  const [selectedChar, setSelectedChar] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchRoster();
    }
  }, [session]);

  const fetchRoster = async () => {
    const { data, error } = await supabase
      .from('characters_cache')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error("❌ Supabase Fetch Error:", error.message);
    } else {
      setRoster(data || []);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(`❌ Login Failed: ${error.message}`);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSelectedChar(null);
  };

  // --- WORKSPACE VIEW (Authenticated) ---
  if (session) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col p-6">
        <header className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">⭐ Stardust Command Center</h1>
            <p className="text-xs text-neutral-400">Logged in as: {session.user.email}</p>
          </div>
          <button onClick={handleLogout} className="bg-neutral-800 hover:bg-neutral-700 py-1.5 px-3 rounded text-xs transition-all">Sign Out</button>
        </header>

        {/* Global Tab Router Selector */}
        <div className="flex gap-2 border-b border-neutral-800 pb-2 mb-4">
          <button
            onClick={() => setActiveTab('skills')}
            className={`py-1.5 px-4 rounded text-xs font-bold transition-all ${activeTab === 'skills' ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-neutral-400'}`}
          >
            ✨ Visual Skill Compiler
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-1.5 px-4 rounded text-xs font-bold transition-all ${activeTab === 'roster' ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-neutral-400'}`}
          >
            👤 Character Metadata & Crop
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`py-1.5 px-4 rounded text-xs font-bold transition-all ${activeTab === 'banners' ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-neutral-400'}`}
          >
            📅 Event Banner Scheduler
          </button>
          <button
            onClick={() => setActiveTab('auditor')}
            className={`py-1.5 px-4 rounded text-xs font-bold transition-all ${activeTab === 'auditor' ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-neutral-400'}`}
          >
            🔍 Player Auditor
          </button>
        </div>

        {/* Global Application Layout Wrapper */}
        {activeTab === 'skills' ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 flex-1">
            {/* LEFT PANEL: ROSTER INDEX (With Search) */}
          <div className="xl:col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg p-3 h-[calc(100vh-180px)] overflow-y-auto flex flex-col">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Roster Index</h2>
            
            {/* Search Input Bar */}
            <input
              type="text"
              placeholder="🔍 Search roster..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-1.5 text-xs text-white mb-3 focus:outline-none focus:border-neutral-700"
            />

            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {roster
                .filter(char => char.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((char) => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedChar(char)}
                    className={`w-full text-left p-2 rounded text-xs transition-all border ${selectedChar?.id === char.id ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-neutral-950/40 border-transparent text-neutral-400 hover:bg-neutral-800/40'}`}
                  >
                    <div className="font-semibold flex justify-between">
                      <span>{char.name}</span>
                      <span className="text-neutral-500 text-[10px]">ID {char.id}</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">
                      {char.rarity} | Pow: {char.true_power}
                    </div>
                  </button>
                ))}
            </div>
          </div>

            {/* Right Panel: Skill Compiler Wrapper */}
            <div className="xl:col-span-10">
              <SkillCompiler selectedChar={selectedChar} setSelectedChar={setSelectedChar} fetchRoster={fetchRoster} />
            </div>
          </div>
        ) : (
          <div className="flex-1">

{activeTab === 'roster' && (
  <RosterCreator 
    selectedChar={selectedChar} 
    setSelectedChar={setSelectedChar} 
    fetchRoster={fetchRoster} 
  />
)}
            {activeTab === 'banners' && <BannerManager roster={roster} />}
            {activeTab === 'auditor' && <PlayerAuditor />}
          </div>
        )}
      </div>
    );
  }

  // --- LOGIN VIEW (Unauthenticated) ---
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="bg-neutral-900 p-8 rounded-lg shadow-2xl max-w-md w-full border border-neutral-800">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Project Stardust</h1>
          <p className="text-neutral-500 text-sm mt-1">Admin Control Panel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-sm text-white focus:outline-none focus:border-neutral-700"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-sm text-white focus:outline-none focus:border-neutral-700"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-100 hover:bg-white text-neutral-900 font-semibold py-2.5 px-4 rounded transition-all text-sm disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-xs font-medium text-neutral-300">{message}</p>
        )}
      </div>
    </div>
  );
}