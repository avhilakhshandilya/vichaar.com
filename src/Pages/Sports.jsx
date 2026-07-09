import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Trophy, Swords, Goal, Circle, Target } from 'lucide-react';
import ActivityFeed from '../components/ActivityFeed';
import { calculateSmoothedPercentages } from '../utils/marketUtils';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vichaar-backend.avhilakh.workers.dev');

export default function Sports() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSport, setActiveSport] = useState('All'); 
  
  // Votes state for the logged-in user
  const [myVotes, setMyVotes] = useState({});
  const [voteLoading, setVoteLoading] = useState(false);

  const currentUserStr = localStorage.getItem('vichaarUser');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

  const sportCategories = [
    { name: 'All', icon: <Trophy size={16} /> },
    { name: 'Football', icon: <Goal size={16} /> },
    { name: 'Cricket', icon: <Target size={16} /> },
    { name: 'MMA/UFC', icon: <Swords size={16} /> },
    { name: 'Basketball', icon: <Circle size={16} /> }
  ];

  useEffect(() => {
    async function loadSports() {
      setLoading(true);
      let query = supabase
        .from('markets')
        .select('*')
        .in('category', ['Football', 'Cricket', 'Sports', 'MMA', 'Basketball', 'UFC'])
        .eq('status', 'Active')
        .order('created_at', { ascending: false });

      if (activeSport !== 'All') {
        query = supabase
          .from('markets')
          .select('*')
          .eq('category', activeSport)
          .eq('status', 'Active')
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (data) {
        const formattedData = data.map(market => {
          const { yes, no, totalVotes } = calculateSmoothedPercentages(market.house_yes_points, market.house_no_points);
          return {
            ...market,
            id: market.market_id,
            yesPrice: yes,
            noPrice: no,
            totalVotes
          };
        });
        setMarkets(formattedData);

        if (currentUser) {
           const marketIds = formattedData.map(m => m.id);
           const { data: votesData } = await supabase
             .from('votes')
             .select('market_id, choice')
             .eq('user_id', currentUser.user_id);
             
           if (votesData) {
             const voteMap = {};
             votesData.forEach(v => voteMap[v.market_id] = v.choice);
             setMyVotes(voteMap);
           }
        }
      } else if (error) {
        console.error(error);
      }
      setLoading(false);
    }
    
    loadSports();

    const channel = supabase
      .channel('sports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'markets' }, (payload) => {
        loadSports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSport]);

  const handleVote = async (e, marketId, choice) => {
    e.preventDefault();
    e.stopPropagation();
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      
      {/* Featured Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-500/30 rounded-2xl p-8 mb-8 relative overflow-hidden shadow-2xl shadow-blue-900/20">
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white mb-2">Sports Odds & Predictions</h1>
          <p className="text-blue-200 font-medium max-w-xl">Trade on live sports events around the world. Better odds than any sportsbook, powered by the crowd.</p>
        </div>
        <div className="absolute right-0 top-0 opacity-20 transform translate-x-1/4 -translate-y-1/4">
           <Trophy size={200} className="text-blue-300" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-[#15171c] border border-slate-800 rounded-2xl p-4 sticky top-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-2">All Sports</h3>
            <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 custom-scrollbar">
              {sportCategories.map(sport => (
                <button
                  key={sport.name}
                  onClick={() => setActiveSport(sport.name)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold shrink-0 lg:w-full text-left ${
                    activeSport === sport.name 
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {sport.icon}
                  <span className="text-sm">{sport.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          
          <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl overflow-hidden mt-2">
            <div className="flex justify-between items-center p-4 border-b border-[#2a2e33] text-sm text-gray-400 font-bold bg-[#0d0f12]">
              <div className="flex items-center gap-2">
                <span>{activeSport} Matches</span>
              </div>
              <div className="hidden sm:flex gap-16 pr-4">
                <span>Vote</span>
              </div>
            </div>

            <div className="flex flex-col">
              {loading ? (
                <div className="p-10 text-center text-slate-500 flex justify-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : markets.length === 0 ? (
                <div className="p-10 text-center text-slate-500">
                  <Trophy size={32} className="mx-auto text-slate-600 mb-4" />
                  <p>No active matches for {activeSport}.</p>
                </div>
              ) : markets.map((market) => {
                const isClosed = market.status === 'Resolved' || new Date(market.end_date) < new Date();
                const votedChoice = myVotes[market.id];

                return (
                  <Link 
                    to={`/market/${market.id}`}
                    key={market.id} 
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-[#2a2e33]/50 hover:bg-[#16181d] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                      <img src={market.image_url || `https://ui-avatars.com/api/?name=${market.category}&background=random`} alt={market.category} className="w-10 h-10 rounded-full border border-[#2a2e33] shrink-0 object-cover" />
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-green-400 mb-0.5">{market.category}</div>
                        <div className="font-bold text-white text-base leading-tight group-hover:text-blue-400 transition-colors">{market.question}</div>
                        <div className="text-xs text-gray-500 mt-1">{market.totalVotes} votes cast</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto mt-4 sm:mt-0">
                      <div className="flex flex-col items-center">
                        <div className="text-sm font-bold text-green-400">Y {market.yesPrice}%</div>
                        <div className="text-sm font-bold text-red-400">N {market.noPrice}%</div>
                      </div>
                      
                      <div className="flex gap-2 justify-end min-w-[140px]">
                        {votedChoice ? (
                           <div className={`flex items-center justify-center font-bold px-4 py-2 rounded-lg text-sm border w-full ${votedChoice === 'YES' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                             Voted {votedChoice}
                           </div>
                        ) : market.status === 'Resolved' ? (
                          <div className={`flex items-center justify-center font-bold px-4 py-2 rounded-lg text-sm w-full ${
                            market.winning_outcome === 'YES' ? 'bg-green-500/20 text-green-400' :
                            market.winning_outcome === 'NO' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/50 text-slate-400'
                          }`}>
                            {market.winning_outcome ? `Resolved: ${market.winning_outcome}` : 'Cancelled'}
                          </div>
                        ) : isClosed ? (
                          <div className="flex items-center justify-center font-bold px-4 py-2 rounded-lg bg-slate-800/50 text-slate-400 text-sm border border-slate-700 w-full">
                            Closed
                          </div>
                        ) : (
                          <>
                            <button onClick={(e) => handleVote(e, market.id, 'YES')} disabled={voteLoading} className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 font-bold px-4 py-2 rounded-lg min-w-[60px] transition-colors disabled:opacity-50 z-10">
                              YES
                            </button>
                            <button onClick={(e) => handleVote(e, market.id, 'NO')} disabled={voteLoading} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold px-4 py-2 rounded-lg min-w-[60px] transition-colors disabled:opacity-50 z-10">
                              NO
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-6">
            <ActivityFeed />
          </div>
        </div>

      </div>
    </div>
  );
}
