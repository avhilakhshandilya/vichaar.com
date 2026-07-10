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
      className="bg-[#111317] border border-[#2a2e33] hover:border-[#3a3f45] transition-colors rounded-xl p-5 flex flex-col group cursor-pointer h-[320px]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <img 
          src={market.image_url || `https://ui-avatars.com/api/?name=${market.category}&background=random`} 
          alt={market.category} 
          className="w-6 h-6 rounded object-cover" 
          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${market.category}&background=random` }}
        />
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{market.category}</span>
      </div>
      
      {/* Title */}
      <h2 className="text-[15px] font-bold text-white mb-6 line-clamp-3 leading-snug group-hover:text-white/90 transition-colors">
        {market.question}
      </h2>
      
      {/* Options (Yes / No) */}
      <div className="flex flex-col gap-5 mb-6 flex-1">
        {/* Yes Row */}
        <div className="flex items-center justify-between group/row">
          <div className="flex flex-col w-full mr-6">
            <span className="text-[13px] text-gray-300 font-medium mb-2">Yes</span>
            {/* Progress bar line */}
            <div className="h-[2px] bg-[#2a2e33] w-full rounded-full overflow-hidden">
              <div className="h-full bg-[#00c853] rounded-full transition-all duration-500" style={{ width: `${yes}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 mt-1">
            <span className="text-xs text-gray-400 font-mono">{yes > 0 ? (100 / yes).toFixed(2) : "0.00"}x</span>
            <div className="px-3 py-1 rounded-full border border-[#00c853]/40 hover:bg-[#00c853]/10 transition-colors text-white text-[13px] font-bold w-[60px] text-center">
              {yes}%
            </div>
          </div>
        </div>

        {/* No Row */}
        <div className="flex items-center justify-between group/row">
          <div className="flex flex-col w-full mr-6">
            <span className="text-[13px] text-gray-300 font-medium mb-2">No</span>
            {/* Progress bar line */}
            <div className="h-[2px] bg-[#2a2e33] w-full rounded-full overflow-hidden">
              <div className="h-full bg-[#ff3b30] rounded-full transition-all duration-500" style={{ width: `${no}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 mt-1">
            <span className="text-xs text-gray-400 font-mono">{no > 0 ? (100 / no).toFixed(2) : "0.00"}x</span>
            <div className="px-3 py-1 rounded-full border border-[#ff3b30]/40 hover:bg-[#ff3b30]/10 transition-colors text-white text-[13px] font-bold w-[60px] text-center">
              {no}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer / Status */}
      <div className="flex items-center justify-between text-xs font-medium text-gray-500 mt-auto">
        <span>{Math.max(0, totalVotes - 200).toLocaleString()} vol</span>
        
        {market.status === 'Resolved' ? (
          <span className={`font-bold uppercase tracking-wider ${market.winning_outcome === 'YES' ? 'text-[#00c853]' : market.winning_outcome === 'NO' ? 'text-[#ff3b30]' : 'text-slate-400'}`}>
            {market.winning_outcome ? `Resolved ${market.winning_outcome}` : 'Cancelled'}
          </span>
        ) : market.status === 'CANCEL' ? (
          <span className="font-bold uppercase tracking-wider text-slate-400">Cancelled</span>
        ) : new Date(market.end_date) <= new Date() ? (
          <span className="font-bold uppercase tracking-wider text-yellow-500">Pending</span>
        ) : (
          <span>1 market</span>
        )}
      </div>
    </div>
  );
}
