import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Calendar, Image as ImageIcon, Tag, Hash, HelpCircle } from 'lucide-react';

export default function Admin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    category: 'Trending',
    image_url: '',
    end_date: '',
    house_yes_points: 500,
    house_no_points: 500
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/markets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          house_yes_points: parseInt(formData.house_yes_points) || 500,
          house_no_points: parseInt(formData.house_no_points) || 500
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      alert("Market Created Successfully!");
      navigate(`/market/${data.market.market_id}`);
    } catch (err) {
      alert("Error creating market: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1115] text-white p-6 pb-20 animate-fade-in-up">
      <div className="max-w-3xl mx-auto">
        
        <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-6">
          <ShieldCheck className="text-green-400" size={32} />
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Create and manage prediction markets</p>
          </div>
        </div>

        <div className="bg-[#15171c] border border-slate-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-6">Create New Market</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Question */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <HelpCircle size={16} /> Market Question
              </label>
              <input 
                type="text" 
                name="question"
                required
                value={formData.question}
                onChange={handleChange}
                placeholder="e.g. Will Bitcoin reach 100k by December?" 
                className="w-full bg-[#0a0c0f] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Tag size={16} /> Category
                </label>
                <select 
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-[#0a0c0f] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors appearance-none"
                >
                  <option value="Trending">Trending</option>
                  <option value="Elections">Elections</option>
                  <option value="Politics">Politics</option>
                  <option value="Sports">Sports</option>
                  <option value="Culture">Culture</option>
                  <option value="Crypto">Crypto</option>
                  <option value="Commodities">Commodities</option>
                  <option value="Economics">Economics</option>
                  <option value="Finance">Finance</option>
                  <option value="Football">Football</option>
                </select>
              </div>

              {/* End Date */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                  <Calendar size={16} /> Expiration Date
                </label>
                <input 
                  type="date" 
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full bg-[#0a0c0f] border border-slate-700 rounded-xl px-4 py-3 text-slate-300 focus:outline-none focus:border-green-500 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
                <ImageIcon size={16} /> Cover Image URL
              </label>
              <input 
                type="url" 
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg" 
                className="w-full bg-[#0a0c0f] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>

            {/* Initial Liquidity */}
            <div className="bg-[#0f1115] border border-slate-800 rounded-xl p-6 mt-8">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Hash size={16} className="text-blue-400" /> Initial Liquidity Seed
              </h3>
              <p className="text-xs text-slate-500 mb-6">Set the initial points in the pool to determine the starting odds. (Default is 500/500 for a 50% start).</p>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-green-400 mb-2">YES Points</label>
                  <input 
                    type="number" 
                    name="house_yes_points"
                    value={formData.house_yes_points}
                    onChange={handleChange}
                    className="w-full bg-[#0a0c0f] border border-green-500/30 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-red-400 mb-2">NO Points</label>
                  <input 
                    type="number" 
                    name="house_no_points"
                    value={formData.house_no_points}
                    onChange={handleChange}
                    className="w-full bg-[#0a0c0f] border border-red-500/30 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-8 bg-green-500 hover:bg-green-600 text-black font-bold py-4 rounded-xl text-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Market...' : 'Publish Market'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
