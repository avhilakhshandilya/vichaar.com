import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vichaar-backend.avhilakh.workers.dev');


export default function MarketChart({ marketId, currentYes, compact = false }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`${API_URL}/api/charts/${marketId}`);
        const result = await res.json();
        if (result.success) {
          // If the market has no trades, just show a flat line from 50 to current
          let chartData = result.history;
          if (chartData.length <= 1) {
             chartData = [
               { time: 'Start', probability: 50 },
               { time: 'Now', probability: currentYes }
             ];
          }
          setData(chartData);
        }
      } catch (e) {
        console.error("Failed to load chart history", e);
      } finally {
        setLoading(false);
      }
    }
    if (marketId) loadHistory();
  }, [marketId, currentYes]);

  if (loading) {
    return <div className="animate-pulse bg-slate-800/50 rounded-lg w-full h-full flex items-center justify-center text-slate-500 text-sm">Loading chart...</div>;
  }

  // Determine line color based on current probability
  const color = currentYes > 50 ? '#4ade80' : '#f87171'; // Green for high, Red for low (or just always green for YES)

  return (
    <div className="w-full h-full min-h-[120px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2a2e33" vertical={false} />
          {!compact && (
            <XAxis 
              dataKey="time" 
              stroke="#475569" 
              fontSize={11} 
              tickMargin={10}
              tickFormatter={(val) => {
                if (val === 'Start' || val === 'Now') return val;
                const date = new Date(val);
                return isNaN(date) ? val : date.toLocaleTimeString([], { hour: 'numeric' });
              }}
              axisLine={false}
              tickLine={false}
              minTickGap={10}
              interval="preserveStartEnd"
            />
          )}
          {!compact && (
            <YAxis 
              orientation="right"
              domain={[0, 100]} 
              stroke="#475569" 
              fontSize={11} 
              tickFormatter={(val) => `${val}%`} 
              axisLine={false}
              tickLine={false}
              width={45}
            />
          )}
          {!compact && (
            <Tooltip 
              contentStyle={{ backgroundColor: '#16181d', borderColor: '#2a2e33', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ fontWeight: 'bold' }}
              formatter={(value) => [`${value}%`, 'Probability']}
              labelFormatter={(label) => {
                if (label === 'Start' || label === 'Now') return label;
                const date = new Date(label);
                return isNaN(date) ? label : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }}
            />
          )}
          <Area 
            type="stepAfter" 
            dataKey="probability" 
            stroke={color} 
            fillOpacity={1} 
            fill="url(#colorProb)"
            strokeWidth={compact ? 2 : 2} 
            dot={false} 
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
