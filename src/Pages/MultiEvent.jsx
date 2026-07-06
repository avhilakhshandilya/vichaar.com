import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Trophy, Info, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


export default function MultiEvent() {
  const { event_id } = useParams();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState(null);

  // Trade state
  const [tradeType, setTradeType] = useState('YES');
  const [amount, setAmount] = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [stableMarketId, setStableMarketId] = useState(null);

  useEffect(() => {
    async function loadData() {
      // e.g. event_id = world-cup-winner
      const searchString = `[GROUP:${event_id}]%`;
      const { data: ms, error } = await supabase
        .from("markets")
        .select("*")
        .ilike("question", searchString);
        
      if (ms && ms.length > 0) {
        const activeMs = ms.filter(m => m.status === 'Active');
        const formatted = (activeMs.length > 0 ? activeMs : ms).map(formatMarket).sort((a, b) => b.yesPrice - a.yesPrice);
        setMarkets(formatted);
        setSelectedMarket(formatted[0]);

        // Define a stable market ID for comments (smallest UUID)
        const stableId = [...formatted].sort((a, b) => a.id.localeCompare(b.id))[0].id;
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
    
    if (event_id) loadData();
  }, [event_id]);

  useEffect(() => {
    if (!stableMarketId) return;

    // Subscribe to comments
    const commentSub = supabase
      .channel(`comments_event_${stableMarketId}`)
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

  const formatMarket = (m) => {
    const total = m.house_yes_points + m.house_no_points;
    const yes = total > 0 ? (m.house_yes_points / total) : 0.5;
    const no = total > 0 ? (m.house_no_points / total) : 0.5;
    
    // Parse name from "[GROUP:world-cup-winner] France"
    const nameMatch = m.question.match(/\] (.*)$/);
    const optionName = nameMatch ? nameMatch[1] : m.question;

    let displayCategory = m.category;
    const q = (m.question || '').toLowerCase();
    
    // Override category for bypassed markets
    if (displayCategory === 'Politics') {
      if (q.includes('gdp') || q.includes('inflation') || q.includes('unemployment') || q.includes('current account') || q.includes('mandi') || q.includes('gst') || q.includes('nhai') || q.includes('pm-kisan')) {
        displayCategory = 'Economics';
      } else if (q.includes('btc') || q.includes('bitcoin') || q.includes('eth') || q.includes('ethereum')) {
        displayCategory = 'Crypto';
      } else if (q.includes('spy') || q.includes('tsla') || q.includes('tesla') || q.includes('aapl') || q.includes('apple') || q.includes('rbi') || q.includes('interest rate')) {
        displayCategory = 'Finance';
      } else if (q.includes('spaceflight') || q.includes('science') || q.includes('launch')) {
        displayCategory = 'Science';
      } else if (q.includes('temperature') || q.includes('precipitation')) {
        displayCategory = 'Weather';
      } else if (q.includes('sports') || q.includes('football') || q.includes('cricket') || q.match(/\[group:(.*?)-vs-(.*?)\]/)) {
        displayCategory = 'Sports';
      }
    }

    return {
      id: m.market_id,
      name: optionName,
      category: displayCategory,
      yesPrice: Math.round(yes * 100),
      noPrice: Math.round(no * 100),
      yesMultiplier: (1 / yes).toFixed(2),
      noMultiplier: (1 / no).toFixed(2),
      totalVolume: total,
      image_url: m.image_url,
      end_date: m.end_date
    };
  };

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
      
      alert(`Successfully placed order on ${selectedMarket.name}!`);
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

  if (loading) return <div className="p-10 text-center text-slate-400">Loading Event...</div>;
  if (markets.length === 0) return <div className="p-10 text-center text-red-500">Event not found</div>;

  const title = event_id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const totalEventVolume = markets.reduce((acc, m) => acc + m.totalVolume, 0);

  const potentialPayout = amount && selectedMarket ? 
    (tradeType === 'YES' ? (amount * parseFloat(selectedMarket.yesMultiplier)).toFixed(2) : (amount * parseFloat(selectedMarket.noMultiplier)).toFixed(2)) 
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto w-full animate-fade-in-up grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      
      {/* Left Column: Chart & Options List */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
              <Trophy size={24} className="text-yellow-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{title}</h1>
            </div>
          </div>
          {markets[0]?.end_date && (
            <div className="flex items-center gap-2 bg-[#111317] border border-[#2a2e33] px-4 py-2 rounded-lg text-slate-300 text-sm font-bold">
              <Calendar size={16} className="text-blue-400" />
              <span>Resolves: {new Date(markets[0].end_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              {new Date(markets[0].end_date) < new Date() && (
                 <span className="ml-2 bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs border border-red-500/30">CLOSED</span>
              )}
            </div>
          )}
        </div>
        


        {/* Options List */}
        <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl overflow-hidden mt-4">
          
          <div className="flex justify-between items-center p-4 border-b border-[#2a2e33] text-sm text-gray-400 font-bold">
            <div className="flex items-center gap-2">
              <span>${(totalEventVolume).toLocaleString()} Vol.</span>
            </div>
            <div className="flex gap-16 pr-4">
               <span>Buy Yes</span>
               <span>Buy No</span>
            </div>
          </div>

          <div className="flex flex-col">
            {markets.map(market => (
              <div 
                key={market.id} 
                onClick={() => setSelectedMarket(market)}
                className={`flex justify-between items-center p-4 border-b border-[#2a2e33]/50 cursor-pointer transition-colors ${selectedMarket?.id === market.id ? 'bg-[#1a1d24]' : 'hover:bg-[#16181d]'}`}
              >
                <div className="flex items-center gap-4">
                  <img src={market.image_url || `https://ui-avatars.com/api/?name=${market.name}&background=random`} alt={market.name} className="w-8 h-8 rounded-full border border-[#2a2e33]" />
                  <div>
                    <div className="font-bold text-white text-lg">{market.name}</div>
                    <div className="text-xs text-gray-500 font-mono">${(market.totalVolume).toLocaleString()} Vol.</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Probability */}
                  <div className="text-xl font-bold text-white w-16 text-right">
                    {market.yesPrice}%
                  </div>
                  
                  {/* Buy Yes Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedMarket(market); setTradeType('YES'); }}
                    className="w-24 py-2 bg-[#00c853]/10 hover:bg-[#00c853]/20 border border-[#00c853]/30 text-[#00c853] font-bold rounded flex flex-col items-center justify-center transition-colors"
                  >
                    <span className="text-xs">Buy Yes</span>
                    <span className="font-mono">{market.yesPrice}¢</span>
                  </button>

                  {/* Buy No Button */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedMarket(market); setTradeType('NO'); }}
                    className="w-24 py-2 bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 border border-[#ff3b30]/30 text-[#ff3b30] font-bold rounded flex flex-col items-center justify-center transition-colors"
                  >
                    <span className="text-xs">Buy No</span>
                    <span className="font-mono">{market.noPrice}¢</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comment Section */}
        <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl p-6 mt-4">
          <h2 className="text-xl font-bold text-white mb-4">Event Discussion</h2>
          
          <form onSubmit={submitComment} className="flex gap-4 mb-8">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What are your thoughts on this event?" 
              className="flex-grow bg-[#16181d] border border-[#2a2e33] rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00c853] transition-colors"
            />
            <button type="submit" className="bg-[#2a2e33] hover:bg-[#3a3f45] text-white font-bold px-6 rounded-lg transition-colors border border-[#3a3f45]">
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
        {selectedMarket && (
          <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl p-6 sticky top-6 shadow-xl">
            
            {/* Selected Option Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#2a2e33]">
              <img src={selectedMarket.image_url || `https://ui-avatars.com/api/?name=${selectedMarket.name}&background=random`} className="w-10 h-10 rounded-full" alt="selected" />
              <div>
                <div className="text-xs text-gray-500 font-bold uppercase">{title}</div>
                <div className="text-xl font-bold text-white">{selectedMarket.name}</div>
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
                (selectedMarket.end_date && new Date(selectedMarket.end_date) < new Date()) ? 'bg-slate-700 text-slate-400' :
                tradeType === 'YES' ? 'bg-[#00c853] hover:bg-[#00e676] text-black' : 'bg-[#ff3b30] hover:bg-[#ff453a] text-white'
              }`}
            >
              {(selectedMarket.end_date && new Date(selectedMarket.end_date) < new Date()) ? 'Market Closed' : tradeLoading ? 'Processing...' : 'Trade'}
            </button>
            <p className="text-center text-[10px] text-gray-500 mt-4">By trading, you agree to the Terms of Use.</p>
          </div>
        )}
      </div>

    </div>
  );
}
