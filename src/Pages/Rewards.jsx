import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Rewards() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [claimStatus, setClaimStatus] = useState({ success: false, message: '' });

  useEffect(() => {
    const storedUser = localStorage.getItem('vichaarUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleClaim = async () => {
    setLoading(true);
    setClaimStatus({ success: false, message: '' });

    try {
      const res = await fetch("http://localhost:5000/api/user/claim-bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message);
      }

      setClaimStatus({ success: true, message: data.message });
      
      // Update local user state
      const updatedUser = { ...user, total_points: data.newTotal };
      setUser(updatedUser);
      localStorage.setItem('vichaarUser', JSON.stringify(updatedUser));
      
      // Force reload to update navbar
      setTimeout(() => window.location.reload(), 1500);

    } catch (err) {
      setClaimStatus({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f1115] text-white p-6 pb-20 animate-fade-in-up flex items-center justify-center">
      <div className="max-w-md w-full bg-[#15171c] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Decorative background element */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>

        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 shadow-lg shadow-blue-500/10">
            <Gift size={32} />
          </div>
          
          <h1 className="text-3xl font-black mb-2 tracking-tight">Daily Rewards</h1>
          <p className="text-slate-400 text-sm mb-8">
            Claim your free Vichaar points every day to keep trading and climb the leaderboard!
          </p>

          <div className="bg-[#0a0c0f] border border-slate-800 w-full rounded-2xl p-6 mb-8 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Today's Bonus</p>
            <div className="text-5xl font-black text-white flex justify-center items-center gap-2">
              <span className="text-green-400 text-3xl">●</span> 50
            </div>
            <p className="text-slate-400 text-sm mt-2">Points</p>
          </div>

          {claimStatus.message && (
            <div className={`w-full p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-bold ${claimStatus.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {claimStatus.success ? <CheckCircle2 size={18} /> : null}
              {claimStatus.message}
            </div>
          )}

          <button 
            onClick={handleClaim}
            disabled={loading || claimStatus.success}
            className="w-full py-4 rounded-xl font-bold text-lg bg-blue-500 hover:bg-blue-600 text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20"
          >
            {loading ? 'Claiming...' : claimStatus.success ? 'Claimed!' : (
              <>
                <Sparkles size={20} /> Claim Daily Bonus
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
