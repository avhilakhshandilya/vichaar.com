import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vichaar-backend.avhilakh.workers.dev');

export default function Portfolio() {
  const navigate = useNavigate();
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVotes();
  }, []);

  const loadVotes = async () => {
    try {
      const userStr = localStorage.getItem('vichaarUser');
      if (!userStr) { navigate('/login'); return; }
      const user = JSON.parse(userStr);
      const res = await fetch(`${API_URL}/api/user/portfolio/${user.user_id}`);
      const result = await res.json();
      if (result.success) setVotes(result.votes || []);
    } catch (e) {
      console.error('Failed to load votes', e);
    } finally {
      setLoading(false);
    }
  };

  const activeVotes = votes.filter(v => v.status === 'Active');
  const resolvedVotes = votes.filter(v => v.status !== 'Active');
  const correctCount = resolvedVotes.filter(v => v.isWinner === true).length;
  const winRate = resolvedVotes.length > 0 ? Math.round((correctCount / resolvedVotes.length) * 100) : null;

  if (loading) return <div className="p-10 text-center text-slate-400">Loading your votes...</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto w-full">

      {/* Header stats */}
      <div className="bg-gradient-to-br from-[#111827] to-[#0f1115] border border-[#2a2e33] rounded-2xl p-6 mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">My Votes</h1>
        <div className="flex gap-6 flex-wrap">
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Total Votes</p>
            <p className="text-3xl font-bold text-white mt-1">{votes.length}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Win Rate</p>
            <p className="text-3xl font-bold text-green-400 mt-1">{winRate !== null ? `${winRate}%` : '—'}</p>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider">Correct</p>
            <p className="text-3xl font-bold text-white mt-1">{correctCount} / {resolvedVotes.length}</p>
          </div>
        </div>
      </div>

      {/* Active Votes */}
      <h2 className="text-xl font-bold text-white mb-4">Active Votes <span className="text-slate-500 font-normal text-base">({activeVotes.length})</span></h2>
      <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl overflow-hidden mb-8">
        {activeVotes.length > 0 ? activeVotes.map(v => (
          <Link to={`/market/${v.market_id}`} key={v.id} className="flex justify-between items-center p-4 border-b border-[#2a2e33] last:border-0 hover:bg-white/5 transition-colors">
            <p className="text-white text-sm line-clamp-2 flex-1 pr-4">{v.question}</p>
            <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${v.choice === 'Yes' || v.choice === 'YES' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {v.choice}
            </span>
          </Link>
        )) : (
          <p className="p-8 text-center text-slate-500">You have no active votes.</p>
        )}
      </div>

      {/* Resolved Votes */}
      <h2 className="text-xl font-bold text-white mb-4">Past Votes <span className="text-slate-500 font-normal text-base">({resolvedVotes.length})</span></h2>
      <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl overflow-hidden">
        {resolvedVotes.length > 0 ? resolvedVotes.map(v => {
          const isCancelled = v.winning_outcome === null;
          const isCorrect = v.isWinner === true;
          return (
            <Link to={`/market/${v.market_id}`} key={v.id} className="flex justify-between items-center p-4 border-b border-[#2a2e33] last:border-0 hover:bg-white/5 transition-colors">
              <div className="flex-1 pr-4">
                <p className="text-white text-sm line-clamp-2">{v.question}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${v.choice === 'Yes' || v.choice === 'YES' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  Voted {v.choice}
                </span>
              </div>
              <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${isCancelled ? 'bg-slate-700 text-slate-300' : isCorrect ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {isCancelled ? 'Cancelled' : isCorrect ? 'Correct ✅' : 'Wrong ❌'}
              </span>
            </Link>
          );
        }) : (
          <p className="p-8 text-center text-slate-500">No resolved votes yet.</p>
        )}
      </div>
    </div>
  );
}
