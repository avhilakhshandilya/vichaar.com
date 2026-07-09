import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vichaar-backend.avhilakh.workers.dev');


export default function Notifications() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('vichaarUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/user/notifications?user_id=${user.user_id}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        // Automatically mark as read once viewed
        markAsRead();
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch(`${API_URL}/api/user/notifications/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id })
      });
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-[#0f1115] text-white min-h-screen">
      <div className="max-w-3xl mx-auto pt-6 px-4 pb-24">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
            <Bell size={24} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="bg-[#15171c] border border-slate-800 rounded-2xl p-10 text-center text-slate-500 font-medium">
            You have no notifications yet.
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map(notif => (
              <div 
                key={notif.id} 
                className={`bg-[#15171c] border ${notif.is_read ? 'border-slate-800' : 'border-blue-500/30'} rounded-2xl p-5 relative overflow-hidden transition-all`}
              >
                {!notif.is_read && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                )}
                
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    {notif.title}
                  </h3>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                    <Clock size={12} />
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <p className="text-slate-300 text-sm leading-relaxed">
                  {notif.message}
                </p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
