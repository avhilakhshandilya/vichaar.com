import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SportsMatchRow from "../components/market/SportsMatchRow";
import MarketCard from "../components/market/MarketCard";
import MultiMarketCard from "../components/market/MultiMarketCard";

import ActivityFeed from "../components/ActivityFeed";
import { getMarkets } from "../services/marketService";
import { groupMarkets } from "../utils/marketUtils";
import { supabase } from "../services/supabase";
import { Trophy } from 'lucide-react';

function Home() {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Active');

  useEffect(() => {
    async function loadMarkets() {
      const data = await getMarkets();
      const formattedMarkets = data
        .map(formatMarket)
        .filter(m => m.category === 'Weather'); // Only keep Weather markets
      setMarkets(formattedMarkets);
    }
  
    loadMarkets();

    const subscription = supabase
      .channel('markets_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'markets' }, (payload) => {
        setMarkets(prev => prev.map(m => {
          if (m.id === payload.new.market_id) {
            return formatMarket(payload.new);
          }
          return m;
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const formatMarket = (market) => {
    const total = market.house_yes_points + market.house_no_points;
    const yes = total > 0 ? Math.round((market.house_yes_points / total) * 100) : 50;
    
    let displayCategory = market.category;
    const q = (market.question || '').toLowerCase();
    
    // Override category for bypassed markets
    if (displayCategory === 'Politics') {
      if (q.includes('gdp') || q.includes('inflation') || q.includes('cpi') || q.includes('unemployment') || q.includes('current account') || q.includes('gst') || q.includes('budget') || q.includes('tax') || q.includes('pm-kisan') || q.includes('economy') || q.includes('fed') || q.includes('reserve') || q.includes('jobs') || q.includes('stock') || q.includes('market') || q.includes('trade')) {
        displayCategory = 'Economics';
      } else if (q.includes('btc') || q.includes('bitcoin') || q.includes('eth') || q.includes('ethereum')) {
        displayCategory = 'Crypto';
      } else if (q.includes('spy') || q.includes('tsla') || q.includes('tesla') || q.includes('aapl') || q.includes('apple') || q.includes('rbi') || q.includes('interest rate') || q.includes('crude') || q.includes('gas')) {
        displayCategory = 'Economics';
      } else if (q.includes('space') || q.includes('science') || q.includes('launch') || q.includes('asteroid') || q.includes('nasa') || q.includes('solar') || q.includes('aurora') || q.includes('wildfire') || q.includes('typhoon') || q.includes('storm')) {
        displayCategory = 'Science';
      } else if (q.includes('temperature') || q.includes('precipitation') || q.includes('rain') || q.includes('°c') || q.includes('weather')) {
        displayCategory = 'Weather';
      } else if (q.includes('sports') || q.includes('football') || q.includes('cricket') || q.match(/\[group:(.*?)-vs-(.*?)\]/)) {
        displayCategory = 'Sports';
      } else if (q.includes('election') || q.includes('vote') || q.includes('poll') || q.includes('parliament') || q.includes('congress') || q.includes('senate') || q.includes('bjp') || q.includes('modi') || q.includes('biden') || q.includes('trump') || q.includes('president') || q.includes('minister')) {
        displayCategory = 'Elections';
      } else if (q.includes('movie') || q.includes('film') || q.includes('oscar') || q.includes('grammy') || q.includes('music') || q.includes('box office') || q.includes('celebrity') || q.includes('actor') || q.includes('culture') || q.includes('song')) {
        displayCategory = 'Culture';
      }
    }

    return {
      ...market,
      id: market.market_id,
      question: market.question,
      category: displayCategory,
      yes,
      no: 100 - yes,
      image_url: market.image_url,
    };
  };

  const handleOpenTrade = (marketId) => {
    navigate(`/market/${marketId}`);
  };

  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  const category = searchParams.get('category');
  let displayedMarkets = markets;

  if (category && category.toLowerCase() !== 'trending') {
    if (category.toLowerCase() === 'sports') {
      displayedMarkets = displayedMarkets.filter(m => m.category.toLowerCase() === 'sports' || m.category.toLowerCase() === 'football' || m.category.toLowerCase() === 'cricket');
    } else {
      displayedMarkets = displayedMarkets.filter(m => m.category.toLowerCase() === category.toLowerCase());
    }
  }
  if (query) {
    displayedMarkets = displayedMarkets.filter(m => m.question.toLowerCase().includes(query.toLowerCase()));
  }

  const now = new Date();
  if (statusFilter === 'Active') {
    displayedMarkets = displayedMarkets.filter(m => m.status === 'Active' && new Date(m.end_date) > now);
  } else if (statusFilter === 'Past') {
    displayedMarkets = displayedMarkets.filter(m => m.status === 'Resolved' || m.status === 'CANCEL' || new Date(m.end_date) <= now);
  }

  let groupedMarkets = groupMarkets(displayedMarkets);
  if (category && category.toLowerCase() === 'trending') {
    groupedMarkets.sort((a, b) => {
      const volA = a.isGroup 
        ? a.options.reduce((sum, opt) => sum + opt.house_yes_points + opt.house_no_points, 0)
        : a.house_yes_points + a.house_no_points;
      const volB = b.isGroup 
        ? b.options.reduce((sum, opt) => sum + opt.house_yes_points + opt.house_no_points, 0)
        : b.house_yes_points + b.house_no_points;
      return volB - volA;
    });
  }

  const gridMarkets = groupedMarkets;

  return (
    <div className="bg-[#0f1115] text-white min-h-screen pb-10">
      
      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 flex flex-col gap-8 pt-6">
        
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-white">{statusFilter === 'Active' ? 'Active Markets' : 'Past Markets'}</h1>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#16181d] border border-[#2a2e33] text-white px-4 py-2 text-sm font-bold rounded-lg focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            <option value="Active">Active</option>
            <option value="Past">Past</option>
          </select>
        </div>

        {/* Left Column (Featured Market + Grid) */}
        <div className="w-full flex flex-col gap-6">
          
          {/* Feed Markets */}
          {displayedMarkets.length === 0 ? (
            <div className="bg-[#15171c] border border-[#2a2e33] rounded-2xl p-10 text-center text-slate-400">
              No markets found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {gridMarkets.map((item) => (
                item.isGroup ? (
                  <MultiMarketCard key={item.id} group={item} />
                ) : (
                  <MarketCard key={item.id} market={item} />
                )
              ))}
            </div>
          )}
          
        </div>

      </div>

    </div>
  );
}

export default Home;