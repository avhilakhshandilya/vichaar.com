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

  const totalGroupVotes = group.options.reduce((sum, opt) => sum + calculateSmoothedPercentages(opt.house_yes_points, opt.house_no_points).totalVotes, 0);

  return (
    <div 
      onClick={handleClick}
      className="bg-[#111317] border border-[#2a2e33] hover:border-[#3a3f45] transition-colors rounded-2xl p-5 flex flex-col group cursor-pointer"
    >
      <div className="flex gap-4 items-center mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-[#2a2e33] flex items-center justify-center shrink-0">
          <span className="text-xl">🏆</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Multiple Choice</span>
          <span className="text-xs text-indigo-400 font-bold">{group.options.length} Options</span>
        </div>
      </div>
      
      <h2 className="text-lg font-bold text-white mb-4 line-clamp-2 group-hover:text-white/80 transition-colors">
        {group.title}
      </h2>
      
      <div className="flex flex-col gap-2 mb-4 flex-1">
        {sortedOptions.slice(0, 3).map((opt, idx) => {
          const { yes } = calculateSmoothedPercentages(opt.house_yes_points, opt.house_no_points);
          return (
            <div key={opt.id} className="flex items-center justify-between text-sm bg-[#16181d] px-3 py-2 rounded-lg border border-[#2a2e33]">
              <div className="flex items-center gap-2 truncate">
                <span className="text-gray-500 font-mono text-xs">#{idx + 1}</span>
                <span className="text-gray-300 truncate">{opt.name}</span>
              </div>
              <span className="text-white font-bold shrink-0 ml-2">{yes}%</span>
            </div>
          );
        })}
        {sortedOptions.length > 3 && (
          <div className="text-xs text-gray-500 text-center mt-1">
            + {sortedOptions.length - 3} more options
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between text-sm pt-4 border-t border-[#2a2e33] mt-auto">
        <span className="text-gray-500 font-mono text-xs">{totalGroupVotes} Total Votes</span>
        <span className="text-indigo-400 font-bold text-xs hover:underline">View All &rarr;</span>
      </div>
    </div>
  );
}
