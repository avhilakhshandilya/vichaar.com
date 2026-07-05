import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronUp, Trophy, Target } from 'lucide-react';

export default function SportsMatchRow({ market }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tradeType, setTradeType] = useState('YES');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  // Parse "Will Team A beat Team B?"
  let teamA = "YES";
  let teamB = "NO";
  let title = market.question;
  
  const questionMatch = market.question.match(/Will (.*) beat (.*)\?/i);
  if (questionMatch) {
    teamA = questionMatch[1];
    teamB = questionMatch[2];
    title = `${teamA} vs ${teamB}`;
  }

  // Calculate probabilities and multipliers
  const total = market.house_yes_points + market.house_no_points;
  const yesProb = total > 0 ? (market.house_yes_points / total) : 0.5;
  const noProb = total > 0 ? (market.house_no_points / total) : 0.5;
  
  const yesPrice = Math.round(yesProb * 100);
  const noPrice = Math.round(noProb * 100);
  
  const yesMultiplier = (1 / yesProb).toFixed(2);
  const noMultiplier = (1 / noProb).toFixed(2);

  const handleOrder = async () => {
    if (!amount || amount <= 0) return;
    setLoading(true);
    try {
      const userStr = localStorage.getItem("vichaarUser");
      if (!userStr) throw new Error("Please login to trade.");
      const user = JSON.parse(userStr);

      const res = await fetch("http://localhost:5000/api/markets/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          market_id: market.market_id,
          choice: tradeType,
          amount: parseInt(amount)
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      
      alert(`Successfully placed order for ${amount} points on ${tradeType === 'YES' ? teamA : teamB}!`);
      setAmount('');
      setIsExpanded(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const potentialPayout = amount ? (tradeType === 'YES' ? (amount * parseFloat(yesMultiplier)).toFixed(0) : (amount * parseFloat(noMultiplier)).toFixed(0)) : 0;

  return (
    <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl p-5 hover:bg-[#16181d] transition-colors mb-4 group cursor-default">
      
      {/* Header Section */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <Trophy size={10} className="text-yellow-500" />
        </div>
        <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">
          {market.category}
        </span>
      </div>

      {/* Main Title */}
      <Link to={`/market/${market.market_id}`} className="block text-lg text-white font-bold mb-4 hover:text-green-400 transition-colors">
        {title}
      </Link>

      {/* Options Rows */}
      <div className="flex flex-col gap-3 mb-4">
        
        {/* Option A (Yes) */}
        <div 
          onClick={() => {
            setTradeType('YES');
            setIsExpanded(true);
          }}
          className="flex justify-between items-center group/row cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teamA)}&background=${teamA === 'YES' ? '00c853' : '2a2e33'}&color=fff&rounded=true&size=32`} 
              alt={teamA}
              className="w-8 h-8 rounded-full border border-[#2a2e33]" 
            />
            <span className="font-semibold text-gray-100 group-hover/row:text-white transition-colors">{teamA}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 text-sm mr-4 font-mono">{yesMultiplier}x</span>
            <div className="px-4 py-1.5 rounded-full border border-[#00c853] text-[#00c853] font-bold text-sm bg-transparent hover:bg-[#00c853]/10 transition-colors">
              {yesPrice}%
            </div>
          </div>
        </div>

        {/* Option B (No) */}
        <div 
          onClick={() => {
            setTradeType('NO');
            setIsExpanded(true);
          }}
          className="flex justify-between items-center group/row cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teamB)}&background=${teamB === 'NO' ? 'ff3b30' : '2a2e33'}&color=fff&rounded=true&size=32`} 
              alt={teamB}
              className="w-8 h-8 rounded-full border border-[#2a2e33]" 
            />
            <span className="font-semibold text-gray-100 group-hover/row:text-white transition-colors">{teamB}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-400 text-sm mr-4 font-mono">{noMultiplier}x</span>
            <div className="px-4 py-1.5 rounded-full border border-[#00c853] text-[#00c853] font-bold text-sm bg-transparent hover:bg-[#00c853]/10 transition-colors">
              {noPrice}%
            </div>
          </div>
        </div>

      </div>

      {/* Footer / Stats */}
      <div className="flex justify-between items-center text-xs text-gray-500 font-medium pt-2 border-t border-[#2a2e33]/50">
        <div>
          ${(total).toLocaleString()} vol
        </div>
        <div>
          <Link to={`/market/${market.market_id}`} className="hover:text-gray-300 transition-colors">
            View Details
          </Link>
        </div>
      </div>

      {/* Expandable Trade Interface */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[#2a2e33] animate-fade-in-up">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Target size={16} className="text-blue-400" />
              Quick Trade
            </h4>
            <button onClick={() => setIsExpanded(false)} className="text-gray-500 hover:text-white">
              <ChevronUp size={20} />
            </button>
          </div>

          <div className="flex gap-2 mb-4 bg-[#1a1d24] p-1 rounded-lg border border-[#2a2e33]">
            <button 
              onClick={() => setTradeType('YES')}
              className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${tradeType === 'YES' ? 'bg-[#00c853] text-black' : 'text-gray-400 hover:text-white'}`}
            >
              {teamA.substring(0, 10)} {yesPrice}%
            </button>
            <button 
              onClick={() => setTradeType('NO')}
              className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${tradeType === 'NO' ? 'bg-[#ff3b30] text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {teamB.substring(0, 10)} {noPrice}%
            </button>
          </div>

          <div className="mb-4 bg-[#16181d] rounded-lg p-3 flex items-center border border-[#2a2e33] focus-within:border-blue-500 transition-colors">
            <span className="text-gray-400 font-bold mr-2">$</span>
            <input 
              type="number" 
              placeholder="Amount to wager"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent border-none text-white w-full font-mono focus:outline-none placeholder-gray-600 text-sm"
            />
          </div>

          <div className="flex justify-between items-center mb-4 text-xs font-bold">
            <span className="text-gray-400">Potential Payout</span>
            <span className="text-[#00c853] font-mono">
              ${potentialPayout}
            </span>
          </div>

          <div className="flex gap-2">
             <button 
                onClick={handleOrder}
                disabled={loading || !amount || amount <= 0}
                className="w-full py-3 bg-[#00c853] hover:bg-[#00e676] text-black font-extrabold rounded-lg transition-colors text-sm disabled:opacity-50"
             >
                {loading ? 'Processing...' : 'Place Order'}
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
