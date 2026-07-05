import React from 'react';
import ActivityFeed from '../components/ActivityFeed';

export default function LiveActivity() {
  return (
    <div className="bg-[#0f1115] text-white min-h-screen">
      <div className="bg-slate-900 border-b border-slate-800 py-4 px-6 mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Live Global Activity
        </h2>
      </div>
      
      <div className="px-4 pb-24">
        <ActivityFeed />
      </div>
    </div>
  );
}
