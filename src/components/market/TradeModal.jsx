import React, { useState } from 'react';
import MarketChart from './MarketChart';

export default function TradeModal({ isOpen, onClose, market, tradeType, onVoteSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If the modal is not told to open, don't show anything
  if (!isOpen || !market) return null;

  const isYes = tradeType === 'YES';
  const price = isYes ? market.yes : market.no;
  const potentialPayout = amount ? ((amount / (price / 100))).toFixed(2) : 0;

  const handleOrder = async () => {
    if (!amount || amount <= 0) return;
    setError(null);
    setLoading(true);

    try {
      const userStr = localStorage.getItem("vichaarUser");
      if (!userStr) {
        throw new Error("You must be logged in to trade.");
      }
      const user = JSON.parse(userStr);

      const res = await fetch("http://localhost:5000/api/markets/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          market_id: market.id,
          choice: tradeType,
          amount: parseInt(amount)
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to place order");
      }

      alert(data.message);
      setAmount('');
      if (onVoteSuccess) onVoteSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-end sm:items-center z-50 p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 p-6 shadow-2xl">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Buy {tradeType}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl font-bold transition-colors">
            &times;
          </button>
        </div>

        {/* Market Info */}
        <div className="mb-4">
          <p className="text-sm text-slate-400">Market</p>
          <p className="text-lg font-semibold text-white mt-1">{market.question}</p>
          <p className="text-sm text-green-400 mt-2">Current Price: {price}¢</p>
        </div>

        {/* Chart */}
        <div className="h-40 w-full mb-6 bg-slate-950 rounded-lg p-2 border border-slate-800">
          <MarketChart marketId={market.id} currentYes={market.yes} />
        </div>

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        {/* Amount Input */}
        <div className="mb-6 bg-slate-800 rounded-lg p-3 flex items-center border border-slate-700 focus-within:border-green-500 transition-colors">
          <span className="text-slate-400 font-bold mr-2">₹</span>
          <input
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-transparent text-white font-mono text-xl w-full outline-none"
            autoFocus
          />
        </div>

        {/* Payout Calculation */}
        <div className="flex justify-between text-sm mb-6 bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-slate-400">Potential Payout</span>
          <span className="font-mono text-green-400 font-bold">₹{potentialPayout}</span>
        </div>

        {/* Submit Button */}
        <button 
          onClick={handleOrder}
          disabled={loading || !amount || amount <= 0}
          className={`w-full py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 ${
            isYes 
              ? 'bg-green-500 hover:bg-green-600 text-black' 
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
        >
          {loading ? 'Processing...' : 'Confirm Order'}
        </button>
      </div>
    </div>
  );
}