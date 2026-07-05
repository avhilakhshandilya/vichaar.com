import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// A palette of nice vibrant colors for the different lines
const COLORS = [
  '#2979ff', // Blue (France)
  '#00e5ff', // Cyan (Argentina)
  '#ffea00', // Yellow (Spain)
  '#ff9100', // Orange (Brazil)
  '#00c853', // Green
  '#ff3d00', // Red
  '#d500f9', // Purple
];

export default function MultiMarketChart({ markets }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      if (!markets || markets.length === 0) return;
      
      const marketIds = markets.map(m => m.id);
      
      // Generate 24 hours of simulated historical data since we don't have a real history table yet
      let historyData = [];
      const now = new Date().getTime();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      // We generate one data point per hour
      for (let i = 0; i <= 24; i++) {
        const timestamp = oneDayAgo + (i * 60 * 60 * 1000);
        
        markets.forEach(m => {
          const currentProb = m.yesPrice ?? m.yes;
          // Calculate a realistic historical price that converges on the current price
          // Start with more randomness, and reduce it as we get closer to 'now'
          const timeRatio = i / 24; 
          const maxDeviation = 30 * (1 - timeRatio); // up to 30% deviation 24h ago
          
          // Use market ID to seed a pseudo-random direction so it's consistent
          const seed = m.id.charCodeAt(0) % 2 === 0 ? 1 : -1;
          const randomFactor = (Math.sin(i * 0.5 + seed) * maxDeviation);
          
          let historicalPrice = Math.round(currentProb + randomFactor);
          historicalPrice = Math.max(1, Math.min(99, historicalPrice));
          
          historyData.push({
            market_id: m.id,
            yes_price: historicalPrice,
            created_at: new Date(timestamp).toISOString()
          });
        });
      }

      try {
        // We need to pivot the data so each timestamp has the price of all markets.
        // Since timestamps might not perfectly align across different markets,
        // we round them to the nearest minute or just rely on sequence.
        // A simple approach: group by rounded time
        const timeMap = {};
        
        // Initialize a baseline using the earliest point or 50%
        let baseline = {};
        markets.forEach(m => {
          const mName = m.name || m.optionName;
          baseline[mName] = 50; // fallback
        });

        historyData.forEach(row => {
          // Round to nearest minute to group concurrent updates
          const timeKey = new Date(row.created_at).getTime();
          const roundedTime = Math.round(timeKey / 60000) * 60000;
          
          if (!timeMap[roundedTime]) {
            timeMap[roundedTime] = { time: roundedTime };
          }
          
          // Find the name of the market
          const market = markets.find(m => m.id === row.market_id);
          if (market) {
            const mName = market.name || market.optionName;
            timeMap[roundedTime][mName] = row.yes_price;
            baseline[mName] = row.yes_price; // update baseline for forward filling
          }
        });

        // Convert to array and sort by time
        let chartData = Object.values(timeMap).sort((a, b) => a.time - b.time);

        // Forward-fill missing values so lines don't break
        let lastValues = {};
        chartData = chartData.map(point => {
          markets.forEach(m => {
            const mName = m.name || m.optionName;
            if (point[mName] !== undefined) {
              lastValues[mName] = point[mName];
            } else if (lastValues[mName] !== undefined) {
              point[mName] = lastValues[mName];
            } else {
              // If completely missing at the start, use the current baseline or 50
              point[mName] = 50; 
              lastValues[mName] = 50;
            }
          });
          return point;
        });
        
        // Add a final point with the current live prices to ensure the chart ends exactly where the market is
        const now = new Date().getTime();
        const finalPoint = { time: now };
        markets.forEach(m => {
          const mName = m.name || m.optionName;
          finalPoint[mName] = m.yesPrice ?? m.yes;
        });
        chartData.push(finalPoint);

        // Ensure we have at least 2 points for a line
        if (chartData.length === 1) {
          chartData.unshift({ ...chartData[0], time: chartData[0].time - 60000 });
        }

        setData(chartData);
      } catch (err) {
        console.error("Error charting multi market data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [markets]);

  if (loading) {
    return <div className="h-full w-full flex items-center justify-center text-slate-500">Loading Chart...</div>;
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-wrap items-center gap-4 mb-2 pl-2 text-[13px] font-semibold">
        {markets.slice(0, 7).map((market, index) => {
           const color = COLORS[index % COLORS.length];
           const currentProb = market.yesPrice ?? market.yes ?? 0;
           return (
             <div key={market.id} className="flex items-center gap-1.5 text-slate-400">
               <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
               <span>{market.name || market.optionName}</span>
               <span className="text-white ml-0.5">{Number(currentProb).toFixed(1)}%</span>
             </div>
           );
        })}
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#2a2e33" vertical={false} />
            <XAxis 
              dataKey="time" 
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(val) => {
                const date = new Date(val);
                return date.toLocaleTimeString([], { hour: 'numeric' });
              }} 
              axisLine={false} 
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              minTickGap={40}
            />
            <YAxis 
              orientation="right"
              domain={[0, 100]} 
              tickFormatter={(tick) => `${tick}%`} 
              width={45} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 11 }} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#16181d', borderColor: '#2a2e33', color: '#fff', borderRadius: '8px' }}
              itemStyle={{ fontWeight: 'bold' }}
              labelFormatter={(label) => {
                return new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }}
            />
            
            {markets.slice(0, 7).map((market, index) => (
              <Line 
                key={market.id}
                type="stepAfter" 
                dataKey={market.name || market.optionName} 
                stroke={COLORS[index % COLORS.length]} 
                strokeWidth={2} 
                dot={false}
                isAnimationActive={false}
                connectNulls={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
