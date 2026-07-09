import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vichaar-backend.avhilakh.workers.dev');

export default function VoteModal({ isOpen, onClose, market, initialChoice, onVoteSuccess }) {
  const [selected, setSelected] = useState(initialChoice || 'YES');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !market) return null;

  const handleVote = async () => {
    setError(null);
    setLoading(true);
    try {
      const userStr = localStorage.getItem('vichaarUser');
      if (!userStr) throw new Error('You must be logged in to vote.');
      const user = JSON.parse(userStr);

      const res = await fetch(`${API_URL}/api/markets/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, market_id: market.id, choice: selected })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to cast vote');

      if (onVoteSuccess) onVoteSuccess(data.choice);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-end sm:items-center z-50 p-4">
      <div className="bg-[#15171c] w-full max-w-md rounded-2xl border border-[#2a2e33] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-white">Cast Your Vote</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">{market.question}</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setSelected('YES')}
            className={`py-4 rounded-xl font-bold text-lg transition-all border-2 ${
              selected === 'YES'
                ? 'bg-green-500/20 border-green-500 text-green-400 scale-[1.02]'
                : 'bg-[#1a1d23] border-[#2a2e33] text-slate-400 hover:border-green-500/50'
            }`}
          >
            YES
          </button>
          <button
            onClick={() => setSelected('NO')}
            className={`py-4 rounded-xl font-bold text-lg transition-all border-2 ${
              selected === 'NO'
                ? 'bg-red-500/20 border-red-500 text-red-400 scale-[1.02]'
                : 'bg-[#1a1d23] border-[#2a2e33] text-slate-400 hover:border-red-500/50'
            }`}
          >
            NO
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        <button
          onClick={handleVote}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-bold text-base transition-colors disabled:opacity-50 ${
            selected === 'YES'
              ? 'bg-green-500 hover:bg-green-400 text-black'
              : 'bg-red-500 hover:bg-red-400 text-white'
          }`}
        >
          {loading ? 'Submitting...' : `Confirm — Vote ${selected}`}
        </button>
        <p className="text-center text-slate-500 text-xs mt-3">Your vote is final and cannot be changed.</p>
      </div>
    </div>
  );
}
