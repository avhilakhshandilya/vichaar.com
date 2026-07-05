import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Clock, Trophy, Target, TrendingUp, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

export default function UserProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chart');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/user/profile/${username}`);
        const data = await res.json();
        if (data.success) {
          setProfile(data.profile);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return <div className="text-center text-white py-20 min-h-screen bg-[#0f1115]">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="text-center text-white py-20 min-h-screen bg-[#0f1115]">User not found.</div>;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#15171c] border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-400 text-xs mb-1">{label}</p>
          <p className="text-white font-bold flex items-center gap-1">
            <span className="text-green-400 text-[10px]">●</span>
            {payload[0].value.toLocaleString()} Total Vol.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#0f1115] text-white min-h-screen pb-20">
      
      {/* Profile Header */}
      <div className="bg-slate-900 border-b border-slate-800 pt-12 pb-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-indigo-500/20">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-black text-white">{profile.display_name}</h1>
            <p className="text-slate-400 font-medium mt-1">@{profile.username}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
              <div className="bg-[#15171c] border border-slate-800 rounded-full px-4 py-2 flex items-center gap-2">
                <Trophy size={16} className="text-yellow-400" />
                <span className="font-bold text-sm">{profile.total_points.toLocaleString()} Points</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#15171c] border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Target size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Win Rate</span>
            </div>
            <div className="text-3xl font-black text-white">
              {profile.winRate}%
            </div>
            <p className="text-xs text-slate-500 mt-1">On resolved markets</p>
          </div>
          
          <div className="bg-[#15171c] border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <TrendingUp size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Volume Traded</span>
            </div>
            <div className="text-3xl font-black text-white flex items-center gap-1">
              <span className="text-green-400 text-sm">●</span>
              {profile.totalVolume?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total points wagered</p>
          </div>

          <div className="bg-[#15171c] border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Activity size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Total Bets</span>
            </div>
            <div className="text-3xl font-black text-white">
              {profile.totalBets || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Positions taken</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('chart')}
            className={`pb-3 font-bold text-sm transition-colors ${activeTab === 'chart' ? 'text-white border-b-2 border-green-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Volume Chart
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`pb-3 font-bold text-sm transition-colors ${activeTab === 'history' ? 'text-white border-b-2 border-green-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Trade History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'chart' && (
          <div className="bg-[#15171c] border border-slate-800 rounded-2xl p-6 h-80">
            {profile.chartData && profile.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profile.chartData}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#475569" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    minTickGap={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="stepAfter" 
                    dataKey="volume" 
                    stroke="#4ade80" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorVolume)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 font-medium">
                Not enough data to generate chart.
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {profile.history && profile.history.length > 0 ? (
              profile.history.map((vote) => (
                <div key={vote.id} className="bg-[#15171c] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <Link to={`/market/${vote.market_id}`} className="font-bold text-lg text-white hover:text-green-400 transition-colors line-clamp-1">
                      {vote.question}
                    </Link>
                    {vote.created_at && (
                      <span className="text-xs text-slate-500 flex items-center gap-1 shrink-0 ml-4">
                        <Clock size={12} />
                        {formatDistanceToNow(new Date(vote.created_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1 flex items-center gap-2">
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Bet</span>
                      <span className={`font-bold flex items-center gap-1 text-sm ${vote.choice === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                        {vote.choice === 'YES' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {vote.choice}
                      </span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1 flex items-center gap-1">
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Amount</span>
                      <span className="font-bold text-white text-sm flex items-center gap-1">
                        <span className="text-green-400 text-[10px]">●</span>{vote.amount}
                      </span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-full px-3 py-1 flex items-center gap-2 ml-auto">
                      <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Status</span>
                      <span className={`text-sm font-bold ${
                        vote.status === 'Active' ? 'text-blue-400' :
                        vote.isWinner === true ? 'text-green-400' :
                        vote.isWinner === false ? 'text-red-400' :
                        'text-slate-400'
                      }`}>
                        {vote.status === 'Active' ? 'Active' : 
                         vote.isWinner === true ? 'Won' : 
                         vote.isWinner === false ? 'Lost' : 'Refunded'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-[#15171c] border border-slate-800 rounded-2xl text-slate-500 font-medium">
                This user hasn't placed any bets yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
