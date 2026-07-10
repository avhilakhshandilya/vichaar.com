import React from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateSmoothedPercentages } from '../../utils/marketUtils';

export default function MultiMarketCard({ group }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (e) e.stopPropagation();
    navigate(`/event/${encodeURIComponent(group.id)}`);
  };

  // Sort options by "yes" chance descending
  const sortedOptions = [...group.options].sort((a, b) => {
    const aPct = calculateSmoothedPercentages(a.house_yes_points, a.house_no_points).yes;
    const bPct = calculateSmoothedPercentages(b.house_yes_points, b.house_no_points).yes;
    return bPct - aPct;
  });

  const totalGroupVotes = group.options.reduce((sum, opt) => sum + Math.max(0, calculateSmoothedPercentages(opt.house_yes_points, opt.house_no_points).totalVotes - 200), 0);

  return (
    <div 
      onClick={handleClick}
      className="bg-[#111317] border border-[#2a2e33] hover:border-[#3a3f45] transition-colors rounded-xl p-5 flex flex-col group cursor-pointer h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {group.image_url ? (
          <img src={group.image_url} alt="" className="w-6 h-6 rounded object-cover" />
        ) : (
          <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-[#2a2e33] flex items-center justify-center">
            <span className="text-[10px]">🏆</span>
          </div>
        )}
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{group.category || 'Multiple Choice'}</span>
      </div>
      
      {/* Title */}
      <h2 className="text-[15px] font-bold text-white mb-6 line-clamp-2 leading-snug group-hover:text-white/90 transition-colors">
        {group.title}
      </h2>
      
      {/* Options */}
      <div className="flex flex-col gap-5 mb-6 flex-1">
        {sortedOptions.slice(0, 3).map((opt) => {
          const { yes } = calculateSmoothedPercentages(opt.house_yes_points, opt.house_no_points);
          const multiplier = yes > 0 ? (100 / yes).toFixed(2) : "0.00";
          return (
            <div key={opt.id} className="flex items-center justify-between group/row">
              <div className="flex flex-col w-full mr-6">
                <span className="text-[13px] text-gray-300 font-medium mb-2 truncate">{opt.name}</span>
                {/* Progress bar line */}
                <div className="h-[2px] bg-[#2a2e33] w-full rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${yes}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0 mt-1">
                <span className="text-xs text-gray-400 font-mono">{multiplier}x</span>
                <div className="px-3 py-1 rounded-full border border-teal-500/40 hover:bg-teal-500/10 transition-colors text-white text-[13px] font-bold w-[60px] text-center">
                  {yes}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between text-xs font-medium text-gray-500 mt-auto">
        <span>{totalGroupVotes.toLocaleString()} vol</span>
        <span>{group.options.length} markets</span>
      </div>
    </div>
  );
}
