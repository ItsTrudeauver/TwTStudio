// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Modular Component Imports
import RosterCreator from '../components/RosterCreator';
import SkillCompiler from '../components/SkillCompiler';
import BannerManager from '../components/BannerManager';
import PlayerAuditor from '../components/PlayerAuditor';
import PigmentManager from '../components/PigmentManager';
import RaidScheduler from '../components/RaidScheduler';
import RaidBossCreator from '../components/RaidBossCreator';

export default function AdminStudio() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Tab Manager: Roster, Pigments, Skills, Banners, Raids, Player Audits, Boss Creator
  const [activeTab, setActiveTab] = useState<'roster' | 'pigments' | 'skills' | 'banners' | 'raids' | 'auditor' | 'boss_creator'>('skills');
  const [roster, setRoster] = useState<any[]>([]);
  const [relics, setRelics] = useState<any[]>([]);
  const [selectedChar, setSelectedChar] = useState<any>(null);
  const [selectedRelic, setSelectedRelic] = useState<any>(null);

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
      fetchRelics();
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

  const fetchRelics = async () => {
    const { data, error } = await supabase
      .from('relics_cache')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error("❌ Supabase Relic Fetch Error:", error.message);
    } else {
      setRelics(data || []);
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
  // Replace your if (session) block in app/page.tsx with this full-width router:
  if (session) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col p-6">
        <header className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">⭐ TwT Command Center</h1>
            <p className="text-xs text-neutral-400">Logged in as: {session.user.email}</p>
          </div>
          <button onClick={handleLogout} className="bg-neutral-800 hover:bg-neutral-700 py-1.5 px-3 rounded text-xs transition-all">Sign Out</button>
        </header>

        {/* Global Tab Router Selector */}
        <div className="flex gap-2 border-b border-neutral-800 pb-2 mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('skills')}
            className={`py-1.5 px-4 rounded text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'skills' ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-neutral-400'}`}
          >
            ✨ Unified Skill Compiler
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`py-1.5 px-4 rounded text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'roster' ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-neutral-400'}`}
          >
            👤 Character Metadata
          </button>
          <button
            onClick={() => setActiveTab('pigments')}
            className={`py-1.5 px-4 rounded text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'pigments' ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-neutral-400'}`}
          >
            🔮 Pigment Registry
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`py-1.5 px-4 rounded text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'banners' ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-neutral-400'}`}
          >
            📅 Banner Scheduler
          </button>
          <button
            onClick={() => setActiveTab('raids')}
            className={`py-1.5 px-4 rounded text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'raids' ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-neutral-400'}`}
          >
            ⚔️ Raid Schedule Panel
          </button>
          <button
            onClick={() => setActiveTab('boss_creator')}
            className={`py-1.5 px-4 rounded text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'boss_creator' ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-neutral-400'}`}
          >
            👾 Raid Boss Creator
          </button>
          <button
            onClick={() => setActiveTab('auditor')}
            className={`py-1.5 px-4 rounded text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'auditor' ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-900 text-neutral-400'}`}
          >
            🔍 Player Auditor
          </button>
        </div>

        {/* Global Application Layout (All Tabs are now 100% Full-Width) */}
        <div className="flex-1">
          {activeTab === 'skills' && (
            <SkillCompiler 
              selectedChar={selectedChar} 
              setSelectedChar={setSelectedChar} 
              fetchRoster={fetchRoster} 
              roster={roster}
              selectedRelic={selectedRelic}
              setSelectedRelic={setSelectedRelic}
              fetchRelics={fetchRelics}
              relics={relics}
            />
          )}
          {activeTab === 'roster' && (
            <RosterCreator 
              selectedChar={selectedChar} 
              setSelectedChar={setSelectedChar} 
              fetchRoster={fetchRoster} 
              roster={roster}
            />
          )}
          {activeTab === 'pigments' && (
            <PigmentManager 
              selectedRelic={selectedRelic}
              setSelectedRelic={setSelectedRelic}
              fetchRelics={fetchRelics}
              relics={relics}
            />
          )}
          {activeTab === 'banners' && <BannerManager roster={roster} />}
          {activeTab === 'raids' && <RaidScheduler />}
          {activeTab === 'auditor' && <PlayerAuditor />}
          {activeTab === 'boss_creator' && <RaidBossCreator />}
        </div>
      </div>
    );
  }

  // --- LOGIN VIEW (Unauthenticated) ---
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="bg-neutral-900 p-8 rounded-lg shadow-2xl max-w-md w-full border border-neutral-800">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight">TwT Studio</h1>
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