import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { calculateSmoothedPercentages, getTrueVolume, groupMarkets } from '../utils/marketUtils';
import { Trophy, Info, Calendar } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vichaar-backend.avhilakh.workers.dev');

function formatMarket(m) {
  const { yes, no, totalVotes } = calculateSmoothedPercentages(m.house_yes_points, m.house_no_points);
  const trueVolume = getTrueVolume(m.house_yes_points, m.house_no_points);
  
  const nameMatch = m.question.match(/\] (.*)$/);
  const optionName = nameMatch ? nameMatch[1] : m.question;

  let displayCategory = m.category;
  if (m.question.toLowerCase().startsWith('[group:breaking-')) {
    displayCategory = 'Breaking';
  }

  return {
    id: m.market_id,
    name: optionName,
    yesPrice: yes,
    noPrice: no,
    totalVotes: trueVolume,
    image_url: m.image_url,
    end_date: m.end_date,
    status: m.status,
    winning_outcome: m.winning_outcome,
    description: m.description,
    category: displayCategory
  };
}

export default function MultiEvent() {
  const { event_id } = useParams();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState(null);

  // Votes state for the logged-in user
  const [myVotes, setMyVotes] = useState({});
  const [voteLoading, setVoteLoading] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [stableMarketId, setStableMarketId] = useState(null);

  const currentUserStr = localStorage.getItem('vichaarUser');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  useEffect(() => {
    async function loadData() {
      const searchString = `[GROUP:${event_id}]%`;
      const { data: ms, error } = await supabase
        .from("markets")
        .select("*")
        .ilike("question", searchString);
        
      if (ms && ms.length > 0) {
        // Use groupMarkets to get the correct title and shortened option names
        const grouped = groupMarkets(ms);
        const groupData = grouped[0] || {};
        
        let processedMs = ms;
        let derivedTitle = null;

        if (groupData && groupData.isGroup) {
          derivedTitle = groupData.title;
          // groupData.options contains the markets with shortened .name
          processedMs = groupData.options.map(opt => {
             // Overwrite question with the shortened name so formatMarket uses it
             return { ...opt, original_question: opt.question, question: '[GROUP:dummy] ' + opt.name };
          });
        }

        const activeMs = processedMs.filter(m => m.status === 'Active');
        const formatted = (activeMs.length > 0 ? activeMs : processedMs).map(formatMarket).sort((a, b) => b.yesPrice - a.yesPrice);
        setMarkets(formatted);
        
        // Pass the derived title to a state to display it
        if (derivedTitle) {
           setEventTitle(derivedTitle);
        }

        const stableId = [...formatted].sort((a, b) => a.id.localeCompare(b.id))[0].id;
        setStableMarketId(stableId);

        try {
          const res = await fetch(`${API_URL}/api/comments/${stableId}`);
          const data = await res.json();
          if (data.success) {
            setComments(data.comments);
          }
        } catch (err) { console.error(err); }

        // Fetch my votes if logged in
        if (currentUser) {
           const marketIds = formatted.map(m => m.id);
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
    
    if (event_id) loadData();
  }, [event_id]);

  useEffect(() => {
    if (!stableMarketId) return;

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

  const handleVote = async (marketId, choice) => {
    if (!currentUser) { alert("Please login to vote."); return; }
    setVoteLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/markets/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser.user_id, market_id: marketId, choice })
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
        body: JSON.stringify({ user_id: currentUser.user_id, market_id: stableMarketId, content: newComment })
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

  let rawTitle = event_id;
  if (rawTitle.toLowerCase().startsWith('breaking-')) {
    rawTitle = rawTitle.slice(9);
  }
  let title = rawTitle;
  if (!rawTitle.includes(' ') && rawTitle.includes('-')) {
     title = rawTitle.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  } else {
     title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  }
  const totalEventVotes = markets.reduce((acc, m) => acc + m.totalVotes, 0);
  let bannerUrl = markets[0]?.image_url;
  if (event_id && event_id.toLowerCase().includes('election')) {
     bannerUrl = 'https://images.unsplash.com/photo-1532210317995-cc56d90177d9?q=80&w=1200&auto=format&fit=crop';
  }
  const description = markets[0]?.description;
  const displayCategory = markets[0]?.category || 'Multiple Choice';

  const displayTitle = eventTitle || title;

  return (
    <div className="min-h-screen bg-[#0e1014] text-white">
      {/* Banner */}
      <div className="w-full h-48 md:h-64 relative overflow-hidden bg-[#111317]">
        {bannerUrl ? (
          <img src={bannerUrl} alt={displayTitle} className="w-full h-full object-cover opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1014] via-[#0e1014]/60 to-transparent" />
        
        {/* Banner Content */}
        <div className="absolute bottom-6 left-6 right-6 max-w-7xl mx-auto flex items-end justify-between">
          <div>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-3 inline-flex items-center gap-1.5 ${
              displayCategory === 'Breaking' 
                ? 'bg-[#111317]/80 backdrop-blur-sm border border-red-500/30 text-red-400' 
                : 'bg-indigo-500 text-white'
            }`}>
              {displayCategory === 'Breaking' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
              {displayCategory}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-white max-w-3xl leading-tight">
              {displayTitle}
            </h1>
          </div>
          
          <div className="hidden md:flex gap-3">
             <div className="bg-[#111317]/80 backdrop-blur-sm border border-[#2a2e33] rounded-xl px-4 py-2 flex flex-col items-end">
               <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Group Volume</span>
               <span className="text-lg font-bold text-indigo-400">{totalEventVotes} votes</span>
             </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full animate-fade-in-up grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        
        {/* Left Column: List & Discussion */}
        <div className="lg:col-span-2 flex flex-col gap-8">

        
        {/* Options List */}
        <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl overflow-hidden mt-4">
          
          <div className="flex justify-between items-center p-4 border-b border-[#2a2e33] text-sm text-gray-400 font-bold bg-[#0d0f12]">
            <div className="flex items-center gap-2">
              <span>{totalEventVotes} Total Votes</span>
            </div>
            <div className="hidden sm:flex gap-16 pr-4">
               <span>Vote</span>
            </div>
          </div>

          <div className="flex flex-col">
            {markets.map((market, index) => {
              const isClosed = market.status === 'Resolved' || new Date(market.end_date) < new Date();
              const votedChoice = myVotes[market.id];

              return (
                <div 
                  key={market.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-[#2a2e33] hover:bg-[#1a1d24] transition-colors gap-4"
                >
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <span className="text-slate-500 font-mono text-sm w-4 shrink-0">{index + 1}</span>
                    <img src={market.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(market.name.match(/\(([^)]+)\)/) ? market.name.match(/\(([^)]+)\)/)[1] : market.name)}&background=random`} alt={market.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-[#2a2e33] shrink-0" />
                    <div>
                      <div className="font-bold text-white text-base sm:text-lg leading-tight">{market.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{market.totalVotes} votes cast</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto pl-8 sm:pl-0">
                    <div className="flex gap-4 sm:flex-col sm:gap-0 items-center">
                      <div className="text-sm font-bold text-green-400">Y {market.yesPrice}%</div>
                      <div className="text-sm font-bold text-red-400">N {market.noPrice}%</div>
                    </div>
                    
                    <div className="flex gap-2">
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

        {/* About Section */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4">About this event</h2>
          <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl p-6 text-slate-300 text-sm leading-relaxed">
            {description ? (
              <p>{description}</p>
            ) : (
              <p className="italic opacity-50">No description provided for this multi-date event.</p>
            )}
          </div>
        </div>
      </div>

      {/* Comment Section */}
      <div className="lg:col-span-1">
        <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl p-6 sticky top-6">
          <h2 className="text-lg font-bold text-white mb-4">Discussion</h2>
          <form onSubmit={submitComment} className="flex gap-2 mb-6">
            <input 
              type="text" 
              value={newComment} 
              onChange={(e) => setNewComment(e.target.value)} 
              placeholder={`Discuss ${displayTitle}...`} 
              disabled={!currentUser}
              className="flex-grow min-w-0 bg-[#16181d] border border-[#2a2e33] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50"
            />
            <button type="submit" disabled={!currentUser} className="shrink-0 bg-[#2a2e33] hover:bg-[#3a3f45] text-white text-sm font-bold px-4 rounded-lg transition-colors disabled:opacity-50">
              Post
            </button>
          </form>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {comments.length === 0 ? (
              <p className="text-slate-500 text-center py-4 text-sm">No comments yet. Start the debate!</p>
            ) : comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#1a1d24] flex items-center justify-center text-green-400 font-bold border border-[#2a2e33] uppercase shrink-0 text-xs">
                  {c.display_name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-white text-sm">{c.display_name}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(c.created_at).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                    </span>
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
