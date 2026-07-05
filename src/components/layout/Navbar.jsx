import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Settings, Bell } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('vichaarUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchUnreadCount(parsedUser.user_id);
      
      const interval = setInterval(() => fetchUnreadCount(parsedUser.user_id), 15000);
      return () => clearInterval(interval);
    }
  }, []);

  const fetchUnreadCount = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/user/notifications?user_id=${userId}`);
      const data = await res.json();
      if (data.success) {
        const unread = data.notifications.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?q=${encodeURIComponent(search.trim())}`);
    } else {
      navigate(`/`);
    }
  };

  const handleCategory = (cat) => {
    navigate(`/?category=${encodeURIComponent(cat)}`);
  };

  return (
    <nav className="sticky top-0 z-50 flex flex-col bg-[#0e1014]/80 backdrop-blur-md border-b border-[#2a2e33] text-sm font-medium">
      {/* Top Tier */}
      <div className="flex justify-between items-center px-6 py-3">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold text-green-400 hover:text-green-300 transition-colors tracking-tight">
            Vichaar
          </Link>
          
          <div className="hidden md:flex items-center gap-6 font-bold text-slate-300">
            <Link to="/" className="hover:text-white transition-colors">MARKETS</Link>
            <Link to="/leaderboard" className="hover:text-white transition-colors">LEADERBOARD</Link>
            <Link to="/portfolio" className="hover:text-white transition-colors">PORTFOLIO</Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hidden lg:block flex-grow max-w-md mx-6">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search markets..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#16181d] text-white border border-[#2a2e33] hover:border-[#3a3f45] rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-[#00c853] transition-colors text-sm"
            />
          </form>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/notifications" className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </Link>
              
              <Link to="/rewards" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full text-slate-200 font-bold transition-colors">
                <span className="text-green-400">●</span> {user.total_points || 0}
              </Link>
              
              <div className="hidden md:flex items-center gap-3 bg-slate-800 rounded-full pl-2 pr-4 py-1">
                <Link to={`/user/${user.username}`} className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold hover:opacity-80 transition-opacity">
                  {user.display_name?.charAt(0).toUpperCase()}
                </Link>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-bold text-white">{user.display_name}</span>
                  <span className="text-[10px] text-slate-400">@{user.username}</span>
                </div>
                <Link to="/settings" className="text-slate-400 hover:text-white ml-2 transition-colors">
                  <Settings size={16} />
                </Link>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-slate-300 hover:text-white transition-colors font-bold">
                Log in
              </Link>
              <Link to="/signup" className="bg-green-400 hover:bg-green-500 text-black px-4 py-2 rounded-full font-bold transition-colors">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Bottom Tier: Categories */}
      <div className="flex items-center gap-6 px-6 py-3 border-t border-[#2a2e33]/50 overflow-x-auto whitespace-nowrap text-slate-400 text-xs font-bold uppercase tracking-wider custom-scrollbar">
        <span onClick={() => handleCategory('Trending')} className="hover:text-white cursor-pointer transition-colors">Trending</span>
        <span onClick={() => handleCategory('Elections')} className="hover:text-slate-200 cursor-pointer">Elections</span>
        <span onClick={() => handleCategory('Politics')} className="hover:text-slate-200 cursor-pointer">Politics</span>
        <span onClick={() => handleCategory('Science')} className="hover:text-slate-200 cursor-pointer">Science</span>
        <span onClick={() => handleCategory('Weather')} className="hover:text-slate-200 cursor-pointer">Weather</span>
        <span onClick={() => handleCategory('Economics')} className="hover:text-slate-200 cursor-pointer">Economics</span>
      </div>
    </nav>
  );
}