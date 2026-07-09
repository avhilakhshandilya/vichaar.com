import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vichaar-backend.avhilakh.workers.dev');


export default function Leaderboard() {
  const [traders, setTraders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch(`${API_URL}/api/user/leaderboard`);
        const data = await res.json();
        if (data.success) {
          setTraders(data.leaderboard);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto w-full animate-fade-in-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Top Traders</h1>
          <p className="text-slate-400">Global rankings based on prediction accuracy (win rate).</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="flex justify-between p-4 border-b border-slate-800 text-sm font-semibold text-slate-400 uppercase tracking-wider">
          <div>Trader</div>
          <div className="text-right">Win Rate</div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading rankings...</div>
          ) : traders.map((trader, index) => {
            const rank = index + 1;
            return (
              <Link to={`/user/${trader.username}`} key={trader.username} className="flex justify-between items-center p-4 hover:bg-slate-800/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <span className={`text-xl font-bold w-6 text-center ${
                    rank === 1 ? 'text-yellow-400' :
                    rank === 2 ? 'text-slate-300' :
                    rank === 3 ? 'text-amber-600' :
                    'text-slate-500'
                  }`}>
                    #{rank}
                  </span>
                  
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-green-400 font-bold border border-slate-700 uppercase shrink-0">
                    {trader.display_name.charAt(0)}
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="font-semibold text-white">{trader.display_name}</span>
                    <span className="text-xs text-slate-400">@{trader.username}</span>
                  </div>
                </div>
                
                <div className="text-right font-mono text-lg font-bold text-white">
                  {trader.winRate ?? 0}%
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}