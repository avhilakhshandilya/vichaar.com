import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Cloud, Calendar, TrendingUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CityWeather() {
  const { city } = useParams();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDate, setActiveDate] = useState(null);
  
  // Trade state
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [tradeType, setTradeType] = useState('YES');
  const [amount, setAmount] = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [stableMarketId, setStableMarketId] = useState(null);

  useEffect(() => {
    async function loadWeatherMarkets() {
      // Fetch all weather markets for this city
      const searchString = `${city} %`;
      const { data: ms, error } = await supabase
        .from("markets")
        .select("*")
        .ilike("question", searchString)
        .eq("category", "Politics");
        
      if (ms && ms.length > 0) {
        // Parse the questions to extract date and threshold
        const regex = /^(.*?) (above|rain over) (.*?) on (.*?)\?$/i;
        
        const parsedMarkets = ms.map(m => {
          const match = m.question.match(regex);
          if (!match) return null;
          
          const total = m.house_yes_points + m.house_no_points;
          const yes = total > 0 ? (m.house_yes_points / total) : 0.5;
          const no = total > 0 ? (m.house_no_points / total) : 0.5;
          
          return {
            id: m.market_id,
            city: match[1],
            metricType: match[2],
            threshold: parseFloat(match[3]),
            dateLabel: match[4],
            question: m.question,
            yesPrice: Math.round(yes * 100),
            noPrice: Math.round(no * 100),
            yesMultiplier: (1 / yes).toFixed(2),
            noMultiplier: (1 / no).toFixed(2),
            totalVolume: total,
            image_url: m.image_url,
            end_date: m.end_date,
            status: m.status,
            winning_outcome: m.winning_outcome
          };
        }).filter(m => m !== null);
        
        setMarkets(parsedMarkets);
        
        // Find unique dates
        const uniqueDates = [...new Set(parsedMarkets.map(m => m.dateLabel))];
        
        // Sort dates chronologically if possible, or just string sort
        // Since format is "Monday, Jul 7", we can parse it roughly or just rely on DB order
        if (uniqueDates.length > 0) {
          setActiveDate(uniqueDates[0]);
        }

        // Define a stable market ID for comments (smallest UUID for this city)
        const stableId = [...parsedMarkets].sort((a, b) => a.id.localeCompare(b.id))[0].id;
        setStableMarketId(stableId);

        // Load comments
        try {
          const res = await fetch(`${API_URL}/api/comments/${stableId}`);
          const data = await res.json();
          if (data.success) {
            setComments(data.comments);
          }
        } catch (err) {
          console.error(err);
        }
      }
      setLoading(false);
    }
    
    if (city) loadWeatherMarkets();
  }, [city]);

  useEffect(() => {
    if (!stableMarketId) return;

    // Subscribe to comments
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

  const handleOrder = async () => {
    if (!amount || amount <= 0 || !selectedMarket) return;
    setTradeLoading(true);
    try {
      const userStr = localStorage.getItem("vichaarUser");
      if (!userStr) throw new Error("Please login to trade.");
      const user = JSON.parse(userStr);

      const res = await fetch(`${API_URL}/api/markets/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          market_id: selectedMarket.id,
          choice: tradeType,
          amount: parseInt(amount)
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      
      alert(`Successfully placed order!`);
      setAmount('');
      
      // Update local state temporarily
      setMarkets(prev => prev.map(m => {
        if (m.id === selectedMarket.id) {
           return {
             ...m,
             totalVolume: m.totalVolume + parseInt(amount)
           };
        }
        return m;
      }));
      
    } catch (err) {
      alert(err.message);
    } finally {
      setTradeLoading(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !stableMarketId) return;

    try {
      const userStr = localStorage.getItem("vichaarUser");
      if (!userStr) throw new Error("Please login to comment.");
      const user = JSON.parse(userStr);

      const res = await fetch(`${API_URL}/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
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
  const activeMarketsForDate = markets.filter(m => m.dateLabel === activeDate).sort((a, b) => {
    // Attempt to sort by threshold numerically
    const aVal = parseFloat(a.threshold);
    const bVal = parseFloat(b.threshold);
    return (isNaN(aVal) || isNaN(bVal)) ? 0 : aVal - bVal;
  });

  const totalCityVolume = markets.reduce((acc, m) => acc + m.totalVolume, 0);

  const potentialPayout = amount && selectedMarket ? 
    (tradeType === 'YES' ? (amount * parseFloat(selectedMarket.yesMultiplier)).toFixed(2) : (amount * parseFloat(selectedMarket.noMultiplier)).toFixed(2)) 
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-fade-in-up grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      
      {/* Left Column: Chart & Options List */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-3 sm:gap-4 items-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <Cloud size={24} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Weather in {city}</h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">Predict temperatures and precipitation</p>
            </div>
          </div>
          <div className="bg-[#111317] border border-[#2a2e33] px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-slate-300 text-xs sm:text-sm font-bold flex items-center gap-2">
            <TrendingUp size={14} className="text-green-400" />
            <span>${(totalCityVolume).toLocaleString()} Total Vol.</span>
          </div>
        </div>
        
        {/* Date Tabs (Pill Buttons) */}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
          {uniqueDates.map(dateStr => (
            <button
              key={dateStr}
              onClick={() => { setActiveDate(dateStr); setSelectedMarket(null); }}
              className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition-colors border ${
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

        {/* Options List for Selected Date */}
        <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl overflow-hidden mt-2">
          
          <div className="flex justify-between items-center p-4 border-b border-[#2a2e33] text-sm text-gray-400 font-bold bg-[#0d0f12]">
            <div className="flex items-center gap-2">
              <span>Thresholds for {activeDate}</span>
            </div>
            {activeMarketsForDate.some(m => m.status !== 'Resolved' && new Date(m.end_date) >= new Date()) ? (
              <div className="hidden sm:flex gap-16 pr-4">
                 <span>Buy Yes</span>
                 <span>Buy No</span>
              </div>
            ) : (
              <div className="flex pr-12">
                 <span>Result</span>
              </div>
            )}
          </div>

          <div className="flex flex-col">
            {activeMarketsForDate.map(market => {
              const displayName = market.metricType === 'above' 
                ? `${market.threshold}°C or above` 
                : `Over ${market.threshold}mm rain`;

              return (
                <div 
                  key={market.id} 
                  className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-[#2a2e33]/50 transition-colors ${selectedMarket?.id === market.id ? 'bg-[#1a1d24]' : 'hover:bg-[#16181d]'}`}
                >
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <img src={market.image_url || `https://ui-avatars.com/api/?name=${city}&background=random`} alt={city} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0 border border-[#2a2e33]" />
                    <div className="flex-1">
                      <div className="font-bold text-white text-base sm:text-lg leading-tight">{displayName}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">${(market.totalVolume).toLocaleString()} Vol.</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto mt-4 sm:mt-0">
                    {/* Probability */}
                    <div className="text-lg sm:text-xl font-bold text-white min-w-[3rem] text-left sm:text-right">
                      {market.yesPrice}%
                    </div>
                    {/* Trading Interface or Resolution Status */}
                    <div className="flex gap-2 sm:gap-4 flex-1 justify-end">
                      {market.status === 'Resolved' ? (
                        <div className={`flex items-center justify-center font-bold px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base ${
                          market.winning_outcome === 'YES' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          market.winning_outcome === 'NO' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                          'bg-slate-700/50 text-slate-400 border border-slate-600'
                        }`}>
                          {market.winning_outcome ? `Resolved: ${market.winning_outcome}` : 'Cancelled'}
                        </div>
                      ) : new Date(market.end_date) < new Date() ? (
                        <div className="flex items-center justify-center font-bold px-4 sm:px-6 py-2 rounded-lg bg-slate-800/50 text-slate-400 border border-slate-700 text-sm sm:text-base">
                          Pending Resolution
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => { setSelectedMarket(market); setTradeType('YES'); }}
                            className="flex flex-col items-center justify-center bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 font-bold px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg min-w-[70px] sm:min-w-[80px] transition-colors"
                          >
                            <span className="text-[10px] sm:text-xs">Buy Yes</span>
                            <span className="text-sm sm:text-base">{market.yesPrice}¢</span>
                          </button>
                          <button 
                            onClick={() => { setSelectedMarket(market); setTradeType('NO'); }}
                            className="flex flex-col items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg min-w-[70px] sm:min-w-[80px] transition-colors"
                          >
                            <span className="text-[10px] sm:text-xs">Buy No</span>
                            <span className="text-sm sm:text-base">{market.noPrice}¢</span>
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

        {/* Comment Section */}
        <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl p-4 sm:p-6 mt-4">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">City Weather Discussion</h2>
          
          <form onSubmit={submitComment} className="flex gap-2 sm:gap-4 mb-8">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`What are your thoughts on ${city}'s weather?`} 
              className="flex-grow min-w-0 w-full bg-[#16181d] border border-[#2a2e33] rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base text-white focus:outline-none focus:border-[#00c853] transition-colors"
            />
            <button type="submit" className="shrink-0 bg-[#2a2e33] hover:bg-[#3a3f45] text-white text-sm sm:text-base font-bold px-4 sm:px-6 rounded-lg transition-colors border border-[#3a3f45]">
              Post
            </button>
          </form>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {comments.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No comments yet. Start the debate!</p>
            ) : comments.map(c => (
              <div key={c.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1a1d24] flex items-center justify-center text-[#00c853] font-bold border border-[#2a2e33] uppercase shrink-0">
                  {c.display_name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-white">{c.display_name}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(c.created_at).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Right Column: Trade Slip */}
      <div className="lg:col-span-1">
        {selectedMarket ? (
          <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl p-6 sticky top-6 shadow-xl">
            
            {/* Selected Option Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2a2e33]">
              <img src={selectedMarket.image_url || `https://ui-avatars.com/api/?name=${city}&background=random`} className="w-10 h-10 rounded-full" alt="selected" />
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">{activeDate}</div>
                <div className="text-xl font-bold text-white">
                  {selectedMarket.metricType === 'above' ? `${selectedMarket.threshold}°C or above` : `Over ${selectedMarket.threshold}mm rain`}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 mb-6 bg-[#1a1d24] p-1 rounded-lg border border-[#2a2e33]">
              <button 
                onClick={() => setTradeType('YES')}
                className={`flex-1 py-2 rounded-md font-bold transition-all ${tradeType === 'YES' ? 'bg-[#00c853] text-black shadow-lg shadow-[#00c853]/20' : 'text-slate-400 hover:text-white'}`}
              >
                YES {selectedMarket.yesPrice}¢
              </button>
              <button 
                onClick={() => setTradeType('NO')}
                className={`flex-1 py-2 rounded-md font-bold transition-all ${tradeType === 'NO' ? 'bg-[#ff3b30] text-white shadow-lg shadow-[#ff3b30]/20' : 'text-slate-400 hover:text-white'}`}
              >
                NO {selectedMarket.noPrice}¢
              </button>
            </div>

            <div className="mb-6 bg-[#16181d] rounded-lg p-3 flex items-center border border-[#2a2e33] focus-within:border-blue-500 transition-colors">
              <span className="text-gray-400 text-sm font-bold mr-2">$</span>
              <input 
                type="number" 
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-transparent border-none text-white w-full text-lg font-mono focus:outline-none placeholder-gray-600"
              />
            </div>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Odds</span>
                <span className="text-white font-mono">{tradeType === 'YES' ? selectedMarket.yesMultiplier : selectedMarket.noMultiplier}x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Potential Payout</span>
                <span className="text-[#00c853] font-bold font-mono text-lg flex items-center gap-1">
                  ${potentialPayout}
                </span>
              </div>
            </div>

            <button 
              onClick={handleOrder}
              disabled={tradeLoading || !amount || amount <= 0 || (selectedMarket.end_date && new Date(selectedMarket.end_date) < new Date())}
              className={`w-full py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 ${
                selectedMarket.status === 'Resolved' ? (selectedMarket.winning_outcome === 'YES' ? 'bg-green-500 text-black' : selectedMarket.winning_outcome === 'NO' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400') :
                (selectedMarket.end_date && new Date(selectedMarket.end_date) < new Date()) ? 'bg-slate-700 text-slate-400' :
                tradeType === 'YES' ? 'bg-[#00c853] hover:bg-[#00e676] text-black' : 'bg-[#ff3b30] hover:bg-[#ff453a] text-white'
              }`}
            >
              {selectedMarket.status === 'Resolved' ? (selectedMarket.winning_outcome ? `Resolved: ${selectedMarket.winning_outcome}` : 'Cancelled') : 
               (selectedMarket.end_date && new Date(selectedMarket.end_date) < new Date()) ? 'Pending Resolution' : 
               tradeLoading ? 'Processing...' : 'Trade'}
            </button>
            <p className="text-center text-[10px] text-gray-500 mt-4">By trading, you agree to the Terms of Use.</p>
          </div>
        ) : (
          <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl p-6 h-64 flex flex-col items-center justify-center text-slate-500 border-dashed sticky top-6">
            <Cloud size={48} className="mb-4 opacity-50" />
            <p>Select a threshold to place a trade.</p>
          </div>
        )}
      </div>

    </div>
  );
}
