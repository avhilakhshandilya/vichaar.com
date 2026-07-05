import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MessageCircle, Globe, Rss, Link as LinkIcon } from 'lucide-react'; 

export default function Footer() {
  const marketLinks = [
    { title: 'Politics', desc: 'Predictions & odds' },
    { title: 'Trump', desc: 'Predictions & odds' },
    { title: 'Elections', desc: 'Predictions & odds' },
    { title: 'Crypto', desc: 'Predictions & odds' },
    { title: 'Bitcoin', desc: 'Predictions & odds' },
    { title: 'Ethereum', desc: 'Predictions & odds' },
    { title: 'Sports', desc: 'Predictions & odds' },
    { title: 'NBA', desc: 'Predictions & odds' },
    { title: 'Wimbledon', desc: 'Predictions & odds' },
    { title: 'Culture', desc: 'Predictions & odds' },
    { title: 'Pop Culture', desc: 'Predictions & odds' },
    { title: 'Box Office', desc: 'Predictions & odds' },
  ];

  const supportLinks = [
    { label: 'Learn', url: '#' },
    { label: 'X (Twitter)', url: 'https://x.com/avhilakh' },
    { label: 'Instagram', url: '#' },
    { label: 'Discord', url: '#' },
    { label: 'TikTok', url: '#' },
    { label: 'News', url: '#' },
    { label: 'Contact us', url: 'https://x.com/avhilakh' },
    { label: 'Help Center', url: '#' },
    { label: 'Status', url: '#' }
  ];

  const vichaarLinks = [
    'Rewards', 'APIs', 'Leaderboard', 'Accuracy', 'Brand', 'Activity', 'Careers', 'Press'
  ];

  return (
    <footer className="w-full bg-[#0e1014] border-t border-[#2a2e33] mt-12 py-12 px-6 lg:px-12 text-sm text-[#8b949e]">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between mb-12 gap-12">
          
          {/* Logo & Tagline */}
          <div className="md:w-1/4">
            <Link to="/" className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-bold text-[#00c853]">Vichaar</span>
            </Link>
            <p className="font-bold text-white mb-6">The World's Largest Prediction Market™</p>
          </div>

          {/* Links Grid */}
          <div className="md:w-3/4 grid grid-cols-2 md:grid-cols-4 gap-8">
            
            {/* Markets by Category (Takes up 2 columns) */}
            <div className="col-span-2">
              <h4 className="text-[#64748b] font-medium mb-4">Markets by category and topics</h4>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-4">
                {marketLinks.map((link, idx) => (
                  <div key={idx} className="cursor-pointer group">
                    <div className="text-white font-medium group-hover:text-[#00c853] transition-colors">{link.title}</div>
                    <div className="text-xs text-[#64748b]">{link.desc}</div>
                  </div>
                ))}
                <div className="cursor-pointer text-[#64748b] hover:text-white transition-colors mt-2 flex items-center gap-1">
                  View more <span className="text-[10px]">▼</span>
                </div>
              </div>
            </div>

            {/* Support & Social */}
            <div>
              <h4 className="text-[#64748b] font-medium mb-4">Support & Social</h4>
              <ul className="space-y-3">
                {supportLinks.map((link, idx) => (
                  <li key={idx}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#00c853] cursor-pointer transition-colors font-medium block">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Vichaar specific links */}
            <div>
              <h4 className="text-[#64748b] font-medium mb-4">Vichaar</h4>
              <ul className="space-y-3">
                {vichaarLinks.map((link, idx) => (
                  <li key={idx}>
                    <Link to={`/${link.toLowerCase()}`} className="text-white hover:text-[#00c853] cursor-pointer transition-colors font-medium">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-[#2a2e33] flex flex-col lg:flex-row items-center lg:items-start justify-between gap-6">
          
          {/* Social Icons */}
          <div className="flex items-center gap-4 text-[#8b949e]">
            <a href="#" className="hover:text-[#00c853] transition-colors"><Mail className="w-5 h-5" /></a>
            <a href="#" className="hover:text-[#00c853] transition-colors"><Globe className="w-5 h-5" /></a>
            <a href="#" className="hover:text-[#00c853] transition-colors"><MessageCircle className="w-5 h-5" /></a>
            <a href="#" className="hover:text-[#00c853] transition-colors"><Rss className="w-5 h-5" /></a>
            <a href="#" className="hover:text-[#00c853] transition-colors"><LinkIcon className="w-5 h-5" /></a>
          </div>

          {/* Copyright & Legal Links */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-x-4 gap-y-2 text-xs">
            <span className="text-white font-medium">Vichaar Inc. © 2026</span>
            <span className="cursor-pointer hover:text-white transition-colors">Privacy</span>
            <span>·</span>
            <span className="cursor-pointer hover:text-white transition-colors">Terms of Use</span>
            <span>·</span>
            <span className="cursor-pointer hover:text-white transition-colors">Market Integrity</span>
            <span>·</span>
            <span className="cursor-pointer hover:text-white transition-colors">Help Center</span>
            <span>·</span>
            <span className="cursor-pointer hover:text-white transition-colors">Docs</span>
          </div>
        </div>

        {/* Disclaimer Text */}
        <div className="mt-6 text-[10px] text-[#475569] text-center lg:text-left leading-relaxed">
          Vichaar operates globally through separate legal entities. Vichaar is operated by Vichaar Inc., a regulated Designated Contract Market. This international platform is not regulated by any specific financial authority in all jurisdictions and operates independently. Trading involves substantial risk of loss. See our Terms of Service & Privacy Policy.
        </div>
      </div>
    </footer>
  );
}
