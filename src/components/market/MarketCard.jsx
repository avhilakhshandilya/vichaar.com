import React from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateSmoothedPercentages } from '../../utils/marketUtils';

export default function MarketCard({ market }) {
  const navigate = useNavigate();
  const { yes, no, totalVotes } = calculateSmoothedPercentages(market.house_yes_points, market.house_no_points);

  const handleClick = (e) => {
    if (e) e.stopPropagation();
    if (market.category === 'Weather') {
      const match = market.question.match(/^(.*?) (above|rain over)/i);
      if (match) {
        navigate(`/weather/${match[1]}`);
        return;
      }
    }
    navigate(`/market/${market.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-[#111317] border border-[#2a2e33] hover:border-[#3a3f45] transition-colors rounded-2xl p-5 flex flex-col group cursor-pointer"
    >
      {/* Header with image */}
      <div className="flex gap-4 items-center mb-4">
        <img 
          src={market.image_url || `https://ui-avatars.com/api/?name=${market.category}&background=random`} 
          alt={market.category} 
          className="w-12 h-12 rounded-xl object-cover border border-[#2a2e33]" 
          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${market.category}&background=random` }}
        />
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{market.category}</span>
        </div>
      </div>
      
      {/* Question */}
      <h2 className="text-lg font-bold text-white mb-2 line-clamp-3 min-h-[50px] group-hover:text-white/80 transition-colors">
        {market.question}
      </h2>
      
      {/* Stats */}
      <div className="flex items-center justify-between text-sm mt-auto mb-4 border-b border-[#2a2e33] pb-4">
        <span className="text-white font-bold text-2xl">{yes}% <span className="text-gray-500 text-sm font-normal">chance</span></span>
        <span className="text-gray-500 font-mono text-xs">{totalVotes} Votes</span>
      </div>
      
      {/* Buttons or Status */}
      <div className="flex gap-3">
        {market.status === 'Resolved' ? (
          <div className={`flex-1 py-2 rounded-lg font-bold text-sm text-center border ${market.winning_outcome === 'YES' ? 'bg-[#00c853]/10 text-[#00c853] border-[#00c853]/30' : market.winning_outcome === 'NO' ? 'bg-[#ff3b30]/10 text-[#ff3b30] border-[#ff3b30]/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
            {market.winning_outcome ? `Resolved: ${market.winning_outcome}` : 'Cancelled'}
          </div>
        ) : market.status === 'CANCEL' ? (
          <div className="flex-1 py-2 rounded-lg font-bold text-sm text-center bg-slate-800 text-slate-400 border border-slate-700">
            Cancelled
          </div>
        ) : new Date(market.end_date) <= new Date() ? (
          <div className="flex-1 py-2 rounded-lg font-bold text-sm text-center bg-slate-800/50 text-slate-400 border border-slate-700">
            Pending Resolution
          </div>
        ) : (
          <>
            <button 
              onClick={handleClick}
              className="flex-1 bg-[#00c853]/10 hover:bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/30 py-2 rounded-lg font-bold text-sm transition-colors flex justify-between px-3 items-center"
            >
              <span>Yes</span> <span className="font-mono">{yes}%</span>
            </button>
            <button 
              onClick={handleClick}
              className="flex-1 bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 text-[#ff3b30] border border-[#ff3b30]/30 py-2 rounded-lg font-bold text-sm transition-colors flex justify-between px-3 items-center"
            >
              <span>No</span> <span className="font-mono">{no}%</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
