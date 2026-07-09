import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Clock, Target, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vichaar-backend.avhilakh.workers.dev');

export default function UserProfile() {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/user/profile/${username}`);
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
    const isOwnProfile = username === JSON.parse(localStorage.getItem('vichaarUser'))?.username;
    return (
      <div className="flex flex-col items-center justify-center text-white py-20 min-h-screen bg-[#0f1115]">
        <h2 className="text-2xl font-bold mb-4">User not found.</h2>
        {isOwnProfile && (
          <button 
            onClick={() => {
              localStorage.removeItem('vichaarUser');
              window.location.href = '/';
            }}
            className="px-6 py-2 bg-red-500/20 text-red-500 rounded-full font-bold border border-red-500/50 hover:bg-red-500 hover:text-white transition-colors"
          >
            Clear Data / Logout
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#0f1115] text-white min-h-screen pb-20">
      
      {/* Profile Header */}
      <div className="bg-[#111317] border-b border-[#2a2e33] pt-12 pb-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-indigo-500/20">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-black text-white">{profile.display_name}</h1>
            <p className="text-slate-400 font-medium mt-1">@{profile.username}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-8 space-y-8">
        
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto md:mx-0">
          <div className="bg-[#15171c] border border-[#2a2e33] rounded-2xl p-6">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Target size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Win Rate</span>
            </div>
            <div className="text-3xl font-black text-white">
              {profile.winRate}%
            </div>
            <p className="text-xs text-slate-500 mt-1">On resolved markets</p>
          </div>

          <div className="bg-[#15171c] border border-[#2a2e33] rounded-2xl p-6">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Activity size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Total Votes</span>
            </div>
            <div className="text-3xl font-black text-white">
              {profile.totalVotes || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Total votes cast</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white border-b border-[#2a2e33] pb-4">Voting History</h2>

        {/* History Content */}
        <div className="space-y-4">
          {profile.history && profile.history.length > 0 ? (
            profile.history.map((vote) => (
              <div key={vote.id} className="bg-[#15171c] border border-[#2a2e33] rounded-2xl p-5 hover:border-[#3a3f45] transition-colors">
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
                  <div className="bg-[#0f1115] border border-[#2a2e33] rounded-full px-3 py-1 flex items-center gap-2">
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Voted</span>
                    <span className={`font-bold flex items-center gap-1 text-sm ${vote.choice === 'YES' ? 'text-green-400' : 'text-red-400'}`}>
                      {vote.choice === 'YES' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {vote.choice}
                    </span>
                  </div>

                  <div className="bg-[#0f1115] border border-[#2a2e33] rounded-full px-3 py-1 flex items-center gap-2 ml-auto">
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Status</span>
                    <span className={`text-sm font-bold ${
                      vote.status === 'Active' ? 'text-blue-400' :
                      vote.isWinner === true ? 'text-green-400' :
                      vote.isWinner === false ? 'text-red-400' :
                      'text-slate-400'
                    }`}>
                      {vote.status === 'Active' ? 'Active' : 
                       vote.isWinner === true ? 'Won' : 
                       vote.isWinner === false ? 'Lost' : 'Cancelled'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-[#15171c] border border-[#2a2e33] rounded-2xl text-slate-500 font-medium">
              This user hasn't voted yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
