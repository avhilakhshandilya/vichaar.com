import React from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateSmoothedPercentages } from '../../utils/marketUtils';

function getCategoryBanner(imageUrl, category) {
  if (imageUrl && !imageUrl.includes('ui-avatars.com')) return imageUrl;
  const keywords = {
    Breaking: 'breaking+news+newspaper',
    Economics: 'economy+finance+charts',
    Weather: 'weather+clouds+sky',
    Sports: 'sports+stadium',
    Crypto: 'cryptocurrency+bitcoin',
    Science: 'science+space',
    Culture: 'culture+art',
    Elections: 'election+vote',
  };
  const kw = keywords[category] || 'news+event';
  return `https://source.unsplash.com/400x200/?${kw}`;
}

export default function MultiMarketCard({ group }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (e) e.stopPropagation();
    navigate(`/multi/${group.id}`);
  };

  const handleRowClick = (e, optionId) => {
    e.stopPropagation();
    navigate(`/market/${optionId}`);
  };

  const totalGroupVotes = group.options.reduce(
    (sum, opt) => sum + calculateSmoothedPercentages(opt.house_yes_points, opt.house_no_points).totalVotes,
    0
  );

  const bannerUrl = getCategoryBanner(group.image_url, group.category);
  const displayCategory = group.category === 'Politics' ? 'Breaking' : (group.category || 'Multi');

  return (
    <div
      onClick={handleClick}
      className="bg-[#111317] border border-[#2a2e33] hover:border-[#3a3f45] transition-all rounded-2xl overflow-hidden flex flex-col cursor-pointer hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5 group"
    >
      {/* Banner Image */}
      <div className="relative w-full h-36 overflow-hidden">
        <img
          src={bannerUrl}
          alt={group.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${group.title}&background=1a1d23&color=fff&size=400`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111317] via-[#111317]/40 to-transparent" />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#111317]/80 backdrop-blur-sm border border-red-500/30 text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {displayCategory}
          </span>
        </div>

        {/* Multi-date badge */}
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-[#111317]/80 backdrop-blur-sm border border-[#2a2e33] text-slate-400">
            {group.options.length} dates
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Title */}
        <h2 className="text-sm font-semibold text-white mb-3 line-clamp-2 leading-snug group-hover:text-white/80 transition-colors">
          {group.title.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </h2>

        {/* Date rows — Polymarket style */}
        <div className="flex flex-col gap-2 flex-1">
          {group.options.map((opt) => {
            const { yes, no, totalVotes } = calculateSmoothedPercentages(opt.house_yes_points, opt.house_no_points);
            const label = opt.optionName || opt.name || opt.question;
            const endDate = opt.end_date ? new Date(opt.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
            const isExpired = opt.end_date && new Date(opt.end_date) < new Date();

            return (
              <div
                key={opt.market_id || opt.id}
                onClick={(e) => handleRowClick(e, opt.market_id || opt.id)}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-[#2a2e33] hover:border-[#3a3f45] bg-[#0f1115] transition-colors"
              >
                {/* Date label */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-300 truncate">{label}</div>
                  <div className="text-[10px] text-slate-500">{endDate} · {totalVotes} votes</div>
                </div>

                {/* Probability */}
                <div className="text-sm font-bold text-[#00c853] shrink-0">{yes}%</div>

                {/* Buttons */}
                {isExpired ? (
                  <div className="text-[10px] px-2 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 shrink-0">Ended</div>
                ) : (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={(e) => handleRowClick(e, opt.market_id || opt.id)}
                      className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-[#00c853]/10 hover:bg-[#00c853]/20 text-[#00c853] border border-[#00c853]/30 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      onClick={(e) => handleRowClick(e, opt.market_id || opt.id)}
                      className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 text-[#ff3b30] border border-[#ff3b30]/30 transition-colors"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#2a2e33] text-xs text-slate-500">
          <span>{totalGroupVotes} total votes</span>
          <span className="text-indigo-400 font-bold hover:underline">View All →</span>
        </div>
      </div>
    </div>
  );
}
