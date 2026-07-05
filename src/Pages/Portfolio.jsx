import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Portfolio() {
  const navigate = useNavigate();
  const [data, setData] = useState({ liquid_points: 0, positions: [] });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      const userStr = localStorage.getItem("vichaarUser");
      if (!userStr) {
        navigate("/login");
        return;
      }
      const user = JSON.parse(userStr);

      const res = await fetch(`http://localhost:5000/api/user/portfolio/${user.user_id}`);
      const result = await res.json();
      
      if (result.success) {
        setData({ liquid_points: result.liquid_points, positions: result.positions });
      }
    } catch (e) {
      console.error("Failed to load portfolio", e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimBonus = async () => {
    setClaiming(true);
    try {
      const userStr = localStorage.getItem("vichaarUser");
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const res = await fetch(`http://localhost:5000/api/user/claim-bonus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id })
      });
      const result = await res.json();

      alert(result.message);
      if (result.success) {
        loadPortfolio(); // Refresh balance
      }
    } catch (e) {
      console.error(e);
      alert("Error claiming bonus");
    } finally {
      setClaiming(false);
    }
  };

  const activePoints = data.positions.reduce((acc, pos) => acc + pos.amount, 0);
  const totalValue = data.liquid_points + activePoints;

  if (loading) return <div className="p-10 text-center text-slate-400">Loading Portfolio...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto w-full animate-fade-in-up">
      
      {/* Wallet Summary */}
      <div className="bg-gradient-to-r from-green-900 to-slate-900 border border-green-500/20 p-8 rounded-2xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <p className="text-slate-400 text-sm uppercase tracking-widest">Total Portfolio Value</p>
          <h1 className="text-5xl font-bold text-white mt-2 font-mono">₹{totalValue}</h1>
          <p className="text-green-400 mt-2 font-semibold">Liquid: ₹{data.liquid_points} | Locked: ₹{activePoints}</p>
        </div>
        
        <button 
          onClick={handleClaimBonus}
          disabled={claiming}
          className="mt-6 sm:mt-0 bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
        >
          {claiming ? 'Claiming...' : 'Claim Daily Reward (50 Points)'}
        </button>
      </div>

      {/* Positions List */}
      <h2 className="text-2xl font-bold text-white mb-6">Active Positions</h2>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {data.positions.length > 0 ? (
          data.positions.map((pos) => (
            <div key={pos.id} className="p-6 border-b border-slate-800 last:border-0 flex justify-between items-center hover:bg-slate-800/30 transition-colors">
              <div>
                <h3 className="font-semibold text-lg text-white">{pos.question}</h3>
                <span className={`inline-block px-2 py-1 rounded text-xs font-bold mt-2 ${
                  pos.type === 'YES' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {pos.type}
                </span>
              </div>
              <div className="text-right">
                <p className="font-bold text-white font-mono">₹{pos.amount}</p>
                <p className="text-xs text-slate-400">{pos.status}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="p-10 text-center text-slate-500">No active positions yet.</p>
        )}
      </div>
    </div>
  );
}