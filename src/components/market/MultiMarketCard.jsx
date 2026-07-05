import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy } from 'lucide-react';

export default function MultiMarketCard({ group }) {
  const navigate = useNavigate();
  
  // Calculate total volume for the whole event
  const totalVol = group.options.reduce((acc, opt) => acc + (opt.house_yes_points || 0) + (opt.house_no_points || 0), 0);
  
  // Get top 3 options
  const topOptions = group.options.slice(0, 3);

  return (
    <div 
      onClick={() => navigate(`/event/${group.id}`)}
      className="bg-[#111317] border border-[#2a2e33] hover:border-[#3a3f45] transition-colors rounded-2xl p-5 flex flex-col group-card cursor-pointer"
    >
      {/* Header with image */}
      <div className="flex gap-4 items-center mb-4">
        {group.image_url ? (
          <img src={group.image_url} alt={group.title} className="w-12 h-12 rounded-xl object-cover border border-[#2a2e33]" />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
            <Trophy size={20} className="text-yellow-500" />
          </div>
        )}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{group.category}</span>
          <h2 className="text-lg font-bold text-white leading-tight mt-1">{group.title}</h2>
        </div>
      </div>
      
      {/* Options List */}
      <div className="flex flex-col gap-2 mt-2 flex-grow mb-4">
        {topOptions.map(opt => (
          <div key={opt.id} className="flex items-center justify-between group/row hover:bg-[#16181d] -mx-2 px-2 py-1.5 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <img src={opt.image_url || `https://ui-avatars.com/api/?name=${opt.optionName}&background=random`} alt={opt.optionName} className="w-6 h-6 rounded-full border border-[#2a2e33] object-cover" />
              <span className="text-white font-semibold text-sm group-hover/row:text-[#00c853] transition-colors">{opt.optionName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-sm">{opt.yes}%</span>
              <div className="flex gap-1">
                <span className="text-xs font-bold text-[#00c853] bg-[#00c853]/10 px-2 py-1 rounded">Yes</span>
                <span className="text-xs font-bold text-[#ff3b30] bg-[#ff3b30]/10 px-2 py-1 rounded">No</span>
              </div>
            </div>
          </div>
        ))}
        {group.options.length > 3 && (
          <div className="text-xs text-gray-500 mt-1 font-semibold">
            + {group.options.length - 3} more outcomes
          </div>
        )}
      </div>
      
      {/* Footer Stats */}
      <div className="flex items-center justify-between text-sm mt-auto pt-4 border-t border-[#2a2e33]">
        <span className="text-gray-500 font-mono text-xs">${totalVol > 0 ? totalVol.toLocaleString() : '20,000'} Vol.</span>
      </div>
    </div>
  );
}
