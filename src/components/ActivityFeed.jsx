import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vichaar-backend.avhilakh.workers.dev');


export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);

  const fetchActivity = async () => {
    try {
      const res = await fetch(`${API_URL}/api/markets/activity`);
      const data = await res.json();
      if (data.success) {
        setActivities(data.activities);
      }
    } catch (err) {
      console.error("Failed to fetch activity feed", err);
    }
  };

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 10000); // poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#15171c] border border-slate-800 rounded-2xl overflow-hidden sticky top-6">
      <div className="p-4 border-b border-slate-800 bg-[#1a1d24]">
        <h3 className="font-black text-white flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Live Activity
        </h3>
      </div>
      
      <div className="flex flex-col max-h-[600px] overflow-y-auto custom-scrollbar">
        {activities.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            No recent activity.
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="p-4 border-b border-slate-800/50 hover:bg-[#1a1d24] transition-colors animate-fade-in-up">
              
              <div className="flex justify-between items-start mb-2">
                <Link to={activity.user?.username ? `/user/${activity.user.username}` : '#'} className="flex items-center gap-2 group">
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold group-hover:opacity-80">
                    {activity.user?.display_name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                    {activity.user?.display_name || 'Unknown User'}
                  </span>
                </Link>
                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Clock size={10} />
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </span>
              </div>

              <div className="pl-8 text-sm">
                {activity.type === 'vote' ? (
                  <div>
                    <span className="text-slate-400">bet </span>
                    <span className="font-bold text-white flex items-center inline-flex gap-1">
                      <span className="text-green-400 text-[10px]">●</span>{activity.amount} 
                    </span>
                    <span className="text-slate-400"> on </span>
                    <span className={`font-bold inline-flex items-center gap-1 ${activity.choice === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                      {activity.choice === 'YES' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {activity.choice}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-slate-300">
                    <MessageCircle size={14} className="mt-0.5 text-slate-500 shrink-0" />
                    <p className="line-clamp-2 italic text-xs">"{activity.content}"</p>
                  </div>
                )}
                
                <Link to={activity.market?.market_id ? `/market/${activity.market.market_id}` : '#'} className="mt-2 block text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors line-clamp-1">
                  {activity.market?.question || 'Deleted Market'}
                </Link>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
