import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { calculateSmoothedPercentages } from '../utils/marketUtils';
import { Cloud, Calendar, TrendingUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vichaar-backend.avhilakh.workers.dev');

export default function CityWeather() {
  const { city } = useParams();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDate, setActiveDate] = useState(null);
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [stableMarketId, setStableMarketId] = useState(null);
  
  // Votes state for the logged-in user
  const [myVotes, setMyVotes] = useState({});
  const [voteLoading, setVoteLoading] = useState(false);

  const currentUserStr = localStorage.getItem('vichaarUser');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    async function loadWeatherMarkets() {
      const searchString = `${city} %`;
      const { data: ms, error } = await supabase
        .from("markets")
        .select("*")
        .ilike("question", searchString)
        .eq("category", "Politics"); // Current fallback in DB
        
      if (ms && ms.length > 0) {
        const regex = /^(.*?) (above|rain over) (.*?) on (.*?)\?$/i;
        
        const parsedMarkets = ms.map(m => {
          const match = m.question.match(regex);
          if (!match) return null;
          
          const { yes, no, totalVotes } = calculateSmoothedPercentages(m.house_yes_points, m.house_no_points);
          
          return {
            id: m.market_id,
            city: match[1],
            metricType: match[2],
            threshold: parseFloat(match[3]),
            dateLabel: match[4],
            question: m.question,
            yesPrice: yes,
            noPrice: no,
            totalVotes: totalVotes,
            image_url: m.image_url,
            end_date: m.end_date,
            status: m.status,
            winning_outcome: m.winning_outcome
          };
        }).filter(m => m !== null);
        
        setMarkets(parsedMarkets);
        
        const uniqueDates = [...new Set(parsedMarkets.map(m => m.dateLabel))];
        if (uniqueDates.length > 0) setActiveDate(uniqueDates[0]);

        // Define stable ID for comments
        const stableId = [...parsedMarkets].sort((a, b) => a.id.localeCompare(b.id))[0].id;
        setStableMarketId(stableId);

        // Load comments
        try {
          const res = await fetch(`${API_URL}/api/comments/${stableId}`);
          const data = await res.json();
          if (data.success) setComments(data.comments);
        } catch (err) { console.error(err); }

        // Fetch my votes if logged in
        if (currentUser) {
           const marketIds = parsedMarkets.map(m => m.id);
           const { data: votesData } = await supabase
             .from('votes')
             .select('market_id, choice')
             .eq('user_id', currentUser.user_id)
             .in('market_id', marketIds);

           if (votesData) {
             const voteMap = {};
             votesData.forEach(v => voteMap[v.market_id] = v.choice);
             setMyVotes(voteMap);
           }
        }
      }
      setLoading(false);
    }
    
    if (city) loadWeatherMarkets();
  }, [city]);

  useEffect(() => {
    if (!stableMarketId) return;

    const commentSub = supabase
      .channel(`comments_city_${stableMarketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `market_id=eq.${stableMarketId}` }, async (payload) => {
        const { data: c } = await supabase
          .from('comments')
          .select(`comment_id, content, created_at, users(user_id, username, display_name)`)
          .eq('comment_id', payload.new.comment_id)
          .single();
          
        if (c) {
          const formatted = {
            id: c.comment_id,
            content: c.content,
            created_at: c.created_at,
            user_id: c.users.user_id,
            username: c.users.username,
            display_name: c.users.display_name
          };
          setComments((prev) => [formatted, ...prev]);
        }
      })
      .subscribe();

    return () => supabase.removeChannel(commentSub);
  }, [stableMarketId]);

  const handleVote = async (marketId, choice) => {
    if (!currentUser) {
      alert("Please login to vote.");
      return;
    }
    setVoteLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/markets/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          market_id: marketId,
          choice
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      
      setMyVotes(prev => ({ ...prev, [marketId]: choice }));
      setMarkets(prev => prev.map(m => m.id === marketId ? { ...m, totalVotes: m.totalVotes + 1 } : m));
    } catch (err) {
      alert(err.message);
    } finally {
      setVoteLoading(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !stableMarketId) return;

    try {
      if (!currentUser) throw new Error("Please login to comment.");

      const res = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          market_id: stableMarketId,
          content: newComment
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setNewComment('');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading Weather...</div>;
  if (markets.length === 0) return <div className="p-10 text-center text-red-500">No active weather markets found for {city}</div>;

  const uniqueDates = [...new Set(markets.map(m => m.dateLabel))];
  const pastDates = [];
  const activeDates = [];
  
  uniqueDates.forEach(dateStr => {
    const dateMarkets = markets.filter(m => m.dateLabel === dateStr);
    const isPast = dateMarkets.every(m => m.status === 'Resolved' || new Date(m.end_date) < new Date());
    if (isPast) {
      pastDates.push(dateStr);
    } else {
      activeDates.push(dateStr);
    }
  });

  const activeMarketsForDate = markets.filter(m => m.dateLabel === activeDate).sort((a, b) => {
    const aVal = parseFloat(a.threshold);
    const bVal = parseFloat(b.threshold);
    return (isNaN(aVal) || isNaN(bVal)) ? 0 : aVal - bVal;
  });

  const totalCityVotes = markets.reduce((acc, m) => acc + m.totalVotes, 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full animate-fade-in-up flex flex-col gap-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-3 sm:gap-4 items-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
            <Cloud size={24} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Weather in {city}</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Vote on temperatures and precipitation</p>
          </div>
        </div>
        <div className="bg-[#111317] border border-[#2a2e33] px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-slate-300 text-xs sm:text-sm font-bold flex items-center gap-2">
          <TrendingUp size={14} className="text-green-400" />
          <span>{totalCityVotes} Total Votes</span>
        </div>
      </div>
      
      {/* Date Tabs (Pill Buttons) */}
      <div className="flex gap-2 items-start w-full">
        {pastDates.length > 0 && (
          <div className="relative group shrink-0 z-50">
            <button
              className={`px-4 sm:px-5 py-2 rounded-full font-bold whitespace-nowrap transition-colors border flex items-center gap-2 ${
                pastDates.includes(activeDate) 
                  ? 'bg-slate-700 text-white border-slate-600 shadow-lg shadow-slate-900/20' 
                  : 'bg-[#111317] text-slate-400 border-[#2a2e33] hover:text-white hover:bg-[#1a1d24]'
              }`}
            >
              Past <span className="text-[10px]">▼</span>
            </button>
            <div className="absolute left-0 top-full mt-2 w-48 bg-[#16181d] border border-[#2a2e33] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all py-2">
              {pastDates.map(dateStr => (
                <button
                  key={dateStr}
                  onClick={() => setActiveDate(dateStr)}
                  className={`w-full text-left px-4 py-2 text-sm font-bold hover:bg-[#2a2e33] transition-colors ${
                    activeDate === dateStr ? 'text-blue-400 bg-[#2a2e33]/30' : 'text-slate-300'
                  }`}
                >
                  {dateStr}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar flex-1 items-center">
          {activeDates.map(dateStr => (
            <button
              key={dateStr}
              onClick={() => setActiveDate(dateStr)}
              className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition-colors border shrink-0 ${
                activeDate === dateStr 
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                  : 'bg-[#111317] text-slate-400 border-[#2a2e33] hover:text-white hover:bg-[#1a1d24]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar size={14} />
                {dateStr}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-4">
          
          {/* Options List */}
          <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[#2a2e33] text-sm text-gray-400 font-bold bg-[#0d0f12]">
              <div className="flex items-center gap-2">
                <span>Thresholds for {activeDate}</span>
              </div>
              <div className="hidden sm:flex gap-16 pr-4">
                <span>Vote</span>
              </div>
            </div>

            <div className="flex flex-col">
              {activeMarketsForDate.map(market => {
                const displayName = market.metricType === 'above' 
                  ? `${market.threshold}°C or above` 
                  : `Over ${market.threshold}mm rain`;

                const isClosed = market.status === 'Resolved' || new Date(market.end_date) < new Date();
                const votedChoice = myVotes[market.id];

                return (
                  <div key={market.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-[#2a2e33]/50 hover:bg-[#16181d] transition-colors">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <img src={market.image_url || `https://ui-avatars.com/api/?name=${city}&background=random`} alt={city} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0 border border-[#2a2e33]" />
                      <div className="flex-1">
                        <div className="font-bold text-white text-base sm:text-lg leading-tight">{displayName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{market.totalVotes} votes cast</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto mt-4 sm:mt-0">
                      <div className="flex flex-col items-center">
                        <div className="text-sm font-bold text-green-400">Y {market.yesPrice}%</div>
                        <div className="text-sm font-bold text-red-400">N {market.noPrice}%</div>
                      </div>

                      <div className="flex gap-2 flex-1 justify-end">
                        {votedChoice ? (
                           <div className={`flex items-center justify-center font-bold px-4 py-2 rounded-lg text-sm border ${votedChoice === 'YES' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                             Voted {votedChoice}
                           </div>
                        ) : market.status === 'Resolved' ? (
                          <div className={`flex items-center justify-center font-bold px-4 py-2 rounded-lg text-sm ${
                            market.winning_outcome === 'YES' ? 'bg-green-500/20 text-green-400' :
                            market.winning_outcome === 'NO' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/50 text-slate-400'
                          }`}>
                            {market.winning_outcome ? `Resolved: ${market.winning_outcome}` : 'Cancelled'}
                          </div>
                        ) : isClosed ? (
                          <div className="flex items-center justify-center font-bold px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 text-sm border border-slate-700">
                            Closed
                          </div>
                        ) : (
                          <>
                            <button onClick={() => handleVote(market.id, 'YES')} disabled={voteLoading} className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 font-bold px-4 py-2 rounded-lg min-w-[60px] transition-colors disabled:opacity-50">
                              YES
                            </button>
                            <button onClick={() => handleVote(market.id, 'NO')} disabled={voteLoading} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold px-4 py-2 rounded-lg min-w-[60px] transition-colors disabled:opacity-50">
                              NO
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Comment Section */}
        <div className="lg:col-span-1">
          <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl p-4 sm:p-6 sticky top-6">
            <h2 className="text-lg font-bold text-white mb-4">City Weather Discussion</h2>
            <form onSubmit={submitComment} className="flex gap-2 mb-6">
              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={`Thoughts on ${city}?`} disabled={!currentUser} className="flex-grow min-w-0 bg-[#16181d] border border-[#2a2e33] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50" />
              <button type="submit" disabled={!currentUser} className="shrink-0 bg-[#2a2e33] hover:bg-[#3a3f45] text-white text-sm font-bold px-4 rounded-lg transition-colors disabled:opacity-50">Post</button>
            </form>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {comments.length === 0 ? <p className="text-slate-500 text-center py-4 text-sm">No comments yet. Start the debate!</p>
              : comments.map(c => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a1d24] flex items-center justify-center text-green-400 font-bold border border-[#2a2e33] uppercase shrink-0 text-xs">{c.display_name.charAt(0)}</div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-white text-sm">{c.display_name}</span>
                      <span className="text-[10px] text-slate-500">{new Date(c.created_at).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-slate-300 mt-1 text-sm">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
