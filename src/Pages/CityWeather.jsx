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

  useEffect(() => {
    async function loadWeatherMarkets() {
      // Fetch all weather markets for this city
      const searchString = `${city} %`;
      const { data: ms, error } = await supabase
        .from("markets")
        .select("*")
        .ilike("question", searchString)
        .eq("category", "Politics") // DB constraint forces Politics, we will filter by regex to ensure it's weather
        .eq("status", "Active");
        
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
            end_date: m.end_date
          };
        }).filter(m => m !== null && new Date(m.end_date) > new Date());
        
        setMarkets(parsedMarkets);
        
        // Find unique dates
        const uniqueDates = [...new Set(parsedMarkets.map(m => m.dateLabel))];
        
        // Sort dates chronologically if possible, or just string sort
        // Since format is "Monday, Jul 7", we can parse it roughly or just rely on DB order
        if (uniqueDates.length > 0) {
          setActiveDate(uniqueDates[0]);
        }
      }
      setLoading(false);
    }
    
    if (city) loadWeatherMarkets();
  }, [city]);

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
        <div className="flex justify-between items-start">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <Cloud size={24} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Weather in {city}</h1>
              <p className="text-slate-400 mt-1">Predict temperatures and precipitation</p>
            </div>
          </div>
          <div className="bg-[#111317] border border-[#2a2e33] px-4 py-2 rounded-lg text-slate-300 text-sm font-bold flex items-center gap-2">
            <TrendingUp size={16} className="text-green-400" />
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
            <div className="flex gap-16 pr-4">
               <span>Buy Yes</span>
               <span>Buy No</span>
            </div>
          </div>

          <div className="flex flex-col">
            {activeMarketsForDate.map(market => {
              const displayName = market.metricType === 'above' 
                ? `${market.threshold}°C or above` 
                : `Over ${market.threshold}mm rain`;

              return (
                <div 
                  key={market.id} 
                  onClick={() => setSelectedMarket(market)}
                  className={`flex justify-between items-center p-4 border-b border-[#2a2e33]/50 cursor-pointer transition-colors ${selectedMarket?.id === market.id ? 'bg-[#1a1d24]' : 'hover:bg-[#16181d]'}`}
                >
                  <div className="flex items-center gap-4">
                    <img src={market.image_url || `https://ui-avatars.com/api/?name=${city}&background=random`} alt={city} className="w-8 h-8 rounded-full border border-[#2a2e33]" />
                    <div>
                      <div className="font-bold text-white text-lg">{displayName}</div>
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
              );
            })}
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
                (selectedMarket.end_date && new Date(selectedMarket.end_date) < new Date()) ? 'bg-slate-700 text-slate-400' :
                tradeType === 'YES' ? 'bg-[#00c853] hover:bg-[#00e676] text-black' : 'bg-[#ff3b30] hover:bg-[#ff453a] text-white'
              }`}
            >
              {(selectedMarket.end_date && new Date(selectedMarket.end_date) < new Date()) ? 'Market Closed' : tradeLoading ? 'Processing...' : 'Trade'}
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
