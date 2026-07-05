import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import SportsMatchRow from '../components/market/SportsMatchRow';
import MultiMarketCard from '../components/market/MultiMarketCard';
import { Trophy, Swords, Goal, Circle, Target } from 'lucide-react';
import ActivityFeed from '../components/ActivityFeed';
import { groupMarkets } from '../utils/marketUtils';

export default function Sports() {
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // By default, just fetch Football or Sports. We'll allow filtering if needed.
  const [activeSport, setActiveSport] = useState('All'); 

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
      // Fetch only sports categories (Football, Cricket, or anything that implies sports)
      // Since our DB check constraint allowed Football, Cricket, let's fetch those.
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
          const total = market.house_yes_points + market.house_no_points;
          const yes = total > 0 ? Math.round((market.house_yes_points / total) * 100) : 50;
          return {
            ...market,
            id: market.market_id,
            yes,
            no: 100 - yes
          };
        });
        setMarkets(formattedData);
      } else if (error) {
        console.error(error);
      }
      setLoading(false);
    }
    
    loadSports();

    // Subscribe to realtime updates
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
        
        {/* Left Sidebar (Desktop) / Horizontal Scroll (Mobile) */}
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Live & Upcoming
            </h2>
            <div className="bg-slate-800 rounded-lg p-1 flex">
              <button className="bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-md shadow">Matches</button>
              <button className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors">Futures</button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : markets.length === 0 ? (
            <div className="text-center py-20 bg-[#15171c] border border-slate-800 rounded-2xl">
              <Trophy size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400 font-bold">No active matches for {activeSport}.</p>
              <p className="text-slate-500 text-sm mt-2">Check back later for new games!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupMarkets(markets).map(item => (
                item.isGroup ? (
                  <div key={item.id} className="w-full">
                     <MultiMarketCard group={item} />
                  </div>
                ) : (
                  <SportsMatchRow key={item.id} market={item} />
                )
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block lg:col-span-1">
          <ActivityFeed />
        </div>

      </div>
    </div>
  );
}
