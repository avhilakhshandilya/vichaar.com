import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, User, Save, Mail, Lock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vichaar-backend.avhilakh.workers.dev');


export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    old_password: '',
    new_password: ''
  });

  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('vichaarUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setFormData(prev => ({
        ...prev,
        display_name: parsedUser.display_name || '',
        email: parsedUser.email || ''
      }));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Update Display Name
      const profileRes = await fetch(`${API_URL}/api/user/profile/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          display_name: formData.display_name
        })
      });
      const profileData = await profileRes.json();
      if (!profileData.success) throw new Error(profileData.message);

      // 2. Update Email (if changed)
      if (formData.email !== user.email) {
        const emailRes = await fetch(`${API_URL}/api/user/profile/email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.user_id,
            email: formData.email
          })
        });
        const emailData = await emailRes.json();
        if (!emailData.success) throw new Error(emailData.message);
      }

      // 3. Update Password (if provided)
      if (formData.old_password && formData.new_password) {
        const passRes = await fetch(`${API_URL}/api/user/profile/password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.user_id,
            old_password: formData.old_password,
            new_password: formData.new_password
          })
        });
        const passData = await passRes.json();
        if (!passData.success) throw new Error(passData.message);
      }

      alert("Settings updated successfully!");
      
      // Update local storage
      const updatedUser = { 
        ...user, 
        display_name: formData.display_name,
        email: formData.email
      };
      localStorage.setItem('vichaarUser', JSON.stringify(updatedUser));
      
      window.location.reload();
      
    } catch (err) {
      alert("Error updating settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f1115] text-white p-6 pb-20 animate-fade-in-up">
      <div className="max-w-2xl mx-auto">
        
        <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-6">
          <SettingsIcon className="text-blue-400" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
            <p className="text-slate-400 text-sm mt-1">Manage your profile and preferences</p>
          </div>
        </div>

        <div className="bg-[#15171c] border border-slate-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6">Edit Profile</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Username (Locked) */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <User size={16} /> Username
              </label>
              <input 
                type="text" 
                value={`@${user.username}`}
                disabled
                className="w-full bg-[#0a0c0f] border border-slate-800 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed transition-colors"
              />
              <p className="text-xs text-slate-500 mt-2">Your username is a unique identifier and cannot be changed.</p>
            </div>

            {/* Display Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                Display Name
              </label>
              <input 
                type="text" 
                name="display_name"
                required
                value={formData.display_name}
                onChange={handleChange}
                placeholder="Enter your display name" 
                className="w-full bg-[#0a0c0f] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-slate-500 mt-2">This is the name that appears on the leaderboard and in comments.</p>
            </div>

            <hr className="border-slate-800 my-8" />
            <h3 className="text-lg font-bold text-white mb-4">Account Details</h3>

            {/* Email Address */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <Mail size={16} /> Email Address
              </label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com" 
                className="w-full bg-[#0a0c0f] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-slate-500 mt-2">Used for password recovery and important notifications.</p>
            </div>

            <hr className="border-slate-800 my-8" />
            <h3 className="text-lg font-bold text-white mb-4">Change Password</h3>

            {/* Old Password */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <Lock size={16} /> Current Password
              </label>
              <input 
                type="password" 
                name="old_password"
                value={formData.old_password}
                onChange={handleChange}
                placeholder="Enter your current password" 
                className="w-full bg-[#0a0c0f] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <Lock size={16} /> New Password
              </label>
              <input 
                type="password" 
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                placeholder="Enter a new password" 
                className="w-full bg-[#0a0c0f] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-8 bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-lg transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
