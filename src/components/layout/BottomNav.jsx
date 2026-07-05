import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Radio, PieChart, User } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('vichaarUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const navItems = [
    { name: 'Browse', path: '/', icon: Compass },
    { name: 'Live', path: '/live', icon: Radio },
    { name: 'Portfolio', path: '/portfolio', icon: PieChart },
    { name: 'Profile', path: user ? `/user/${user.username}` : '/login', icon: User },
  ];

  return (
    <div className="fixed bottom-0 w-full bg-[#08090a] border-t border-slate-800/80 z-50 md:hidden pb-safe">
      <div className="flex justify-around items-center px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link 
              key={item.name} 
              to={item.path}
              className="flex flex-col items-center gap-1 min-w-[64px]"
            >
              <Icon 
                size={22} 
                className={`transition-colors ${isActive ? 'text-white' : 'text-slate-500'}`} 
              />
              <span className={`text-[10px] font-bold tracking-wide transition-colors ${isActive ? 'text-white' : 'text-slate-500'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
