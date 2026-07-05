import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import MarketChart from '../components/market/MarketChart';
import { Calendar, Share, Copy, Info, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

export default function Market() {
  const { market_id } = useParams();
  const [market, setMarket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // id of comment being replied to
  const [replyContent, setReplyContent] = useState(''); // content of the reply
  const [loading, setLoading] = useState(true);
  
  // Trade state
  const [tradeType, setTradeType] = useState('YES');
  const [amount, setAmount] = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Load market
      const { data: m, error } = await supabase
        .from("markets")
        .select("*")
        .eq("market_id", market_id)
        .single();
        
      if (m) {
        setMarket(formatMarket(m));
      }

      // Load comments
      try {
        const res = await fetch(`http://localhost:5000/api/comments/${market_id}`);
        const data = await res.json();
        if (data.success) {
          setComments(data.comments);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    
    if (market_id) loadData();

    // Subscribe to market changes
    const marketSub = supabase
      .channel(`market_${market_id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'markets', filter: `market_id=eq.${market_id}` }, (payload) => {
        setMarket(formatMarket(payload.new));
      })
      .subscribe();

    // Subscribe to comments
    const commentSub = supabase
      .channel(`comments_${market_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `market_id=eq.${market_id}` }, async (payload) => {
        // Fetch full comment to get user info
        const { data: c } = await supabase
          .from('comments')
          .select(`comment_id, content, created_at, users(user_id, username, display_name)`)
          .eq('comment_id', payload.new.comment_id)
          .single();
          
        if (c) {
          const formatted = {
            id: c.comment_id,
            content: c.content,
            created_at: c.created_at,
            user_id: c.users.user_id,
            username: c.users.username,
            display_name: c.users.display_name
          };
          setComments((prev) => [formatted, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(marketSub);
      supabase.removeChannel(commentSub);
    };
  }, [market_id]);

  const formatMarket = (m) => {
    const total = m.house_yes_points + m.house_no_points;
    const yes = total > 0 ? Math.round((m.house_yes_points / total) * 100) : 50;
    return {
      id: m.market_id,
      question: m.question,
      description: m.description,
      category: m.category,
      yes,
      no: 100 - yes,
      image_url: m.image_url,
      end_date: m.end_date
    };
  };

  const handleOrder = async () => {
    if (!amount || amount <= 0) return;
    setTradeLoading(true);
    try {
      const userStr = localStorage.getItem("vichaarUser");
      if (!userStr) throw new Error("Please login to trade.");
      const user = JSON.parse(userStr);

      const res = await fetch("http://localhost:5000/api/markets/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          market_id: market.id,
          choice: tradeType,
          amount: parseInt(amount)
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      
      alert(data.message);
      setAmount('');
    } catch (err) {
      alert(err.message);
    } finally {
      setTradeLoading(false);
    }
  };

  const submitComment = async (e, parentId = null) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;

    try {
      const userStr = localStorage.getItem("vichaarUser");
      if (!userStr) throw new Error("Please login to comment.");
      const user = JSON.parse(userStr);

      const res = await fetch("http://localhost:5000/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id,
          market_id: market.id,
          content: content,
          parent_id: parentId
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      if (parentId) {
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
      
      // Immediately refetch comments to update the UI
      const refreshRes = await fetch(`http://localhost:5000/api/comments/${market.id}`);
      const refreshData = await refreshRes.json();
      if (refreshData.success) {
        setComments(refreshData.comments);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading Market...</div>;
  if (!market) return <div className="p-10 text-center text-red-500">Market not found</div>;

  const price = tradeType === 'YES' ? market.yes : market.no;
  const potentialPayout = amount ? ((amount / (price / 100))).toFixed(2) : 0;

  // Group comments into threads
  const topLevelComments = comments.filter(c => !c.parent_id);

  // Recursive Comment Component
  const CommentNode = ({ comment, level = 0 }) => {
    const replies = comments.filter(c => c.parent_id === comment.id).reverse();
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    return (
      <div className={`flex flex-col gap-3 ${level > 0 ? 'mt-2' : ''}`}>
        <div className={`flex gap-4`}>
          <div className={`rounded-full bg-slate-800 flex items-center justify-center text-green-400 font-bold border border-slate-700 uppercase shrink-0 ${level === 0 ? 'w-10 h-10' : 'w-8 h-8 text-xs'}`}>
            {comment.display_name.charAt(0)}
          </div>
          <div className="flex-grow">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-bold text-white ${level > 0 ? 'text-sm' : ''}`}>{comment.display_name}</span>
              <span className={`text-slate-500 ${level > 0 ? 'text-[10px]' : 'text-xs'}`}>
                {new Date(comment.created_at).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
              </span>
              <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="ml-auto text-slate-500 hover:text-white transition-colors flex items-center gap-1 text-xs"
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
            
            {!isCollapsed && (
              <>
                <p className={`text-slate-300 ${level > 0 ? 'text-sm' : ''}`}>{comment.content}</p>
                <button 
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="text-xs text-slate-400 hover:text-green-400 font-bold mt-2 transition-colors"
                >
                  Reply
                </button>
                
                {/* Reply Input Box */}
                {replyingTo === comment.id && (
                  <form onSubmit={(e) => submitComment(e, comment.id)} className="flex gap-2 mt-3">
                    <input 
                      type="text" 
                      autoFocus
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..." 
                      className="flex-grow bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
                    />
                    <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-1.5 rounded-lg text-sm transition-colors">
                      Post
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>

        {/* Nested Replies */}
        {!isCollapsed && replies.length > 0 && (
          <div className="ml-5 pl-5 border-l border-slate-800 flex flex-col gap-4 mt-2">
            {replies.map(reply => (
              <CommentNode key={reply.id} comment={reply} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };


  return (
    <>
      <div className="p-6 max-w-6xl mx-auto w-full animate-fade-in-up grid grid-cols-1 lg:grid-cols-3 gap-8 pb-24 lg:pb-6">
      
      {/* Left Column: Chart & Info */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex gap-4 items-center mb-6">
            <img src={market.image_url} alt="market" className="w-16 h-16 rounded-xl object-cover border border-slate-700" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-1 rounded">{market.category}</span>
              <h1 className="text-2xl font-bold text-white mt-2">{market.question}</h1>
            </div>
          </div>
          
          <div className="h-64 w-full bg-slate-950 rounded-lg p-4 border border-slate-800 relative">
             <MarketChart marketId={market.id} currentYes={market.yes} />
          </div>

          <div className="mt-6 flex flex-wrap gap-4 items-center justify-between border-t border-slate-800 pt-6">
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors font-medium text-sm"
              >
                <Copy size={16} /> Copy Link
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors font-medium text-sm">
                <Share size={16} /> Share
              </button>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Calendar size={16} />
              <span>Ends: {market.end_date ? new Date(market.end_date).toLocaleDateString() : 'TBD'}</span>
              {market.end_date && new Date(market.end_date) < new Date() && (
                 <span className="ml-2 bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs border border-red-500/30">CLOSED</span>
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Info className="text-blue-400" size={20} /> About this Market
          </h2>
          <div className="text-slate-300 space-y-4 text-sm">
            {market.description && (
              <p className="text-base text-slate-200 border-b border-slate-800 pb-4 mb-4">{market.description}</p>
            )}
            <p>This market will resolve to <strong className="text-green-400">YES</strong> if the event described in the title occurs before the expiration date. Otherwise, it will resolve to <strong className="text-red-400">NO</strong>.</p>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <h3 className="font-bold text-white mb-2 flex items-center gap-2"><CheckCircle2 className="text-green-400" size={16} /> Resolution Criteria</h3>
              <p className="text-slate-400">The resolution source for this market will be official announcements or credible reporting by major news outlets. If the outcome is ambiguous, Vichaar governance will act as the final arbiter.</p>
            </div>
          </div>
        </div>

        {/* Comment Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Discussion</h2>
          
          <form onSubmit={submitComment} className="flex gap-4 mb-8">
            <input 
              type="text" 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What are your thoughts?" 
              className="flex-grow bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500 transition-colors"
            />
            <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 rounded-lg transition-colors">
              Post
            </button>
          </form>

          <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {topLevelComments.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No comments yet. Be the first!</p>
            ) : topLevelComments.map(c => (
              <CommentNode key={c.id} comment={c} />
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Trading Interface */}
      <div className="lg:col-span-1" id="order-widget">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-6">
          <h2 className="text-xl font-bold text-white mb-6">Place Order</h2>
          
          <div className="flex gap-2 mb-6 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => setTradeType('YES')}
              className={`flex-1 py-2 rounded-md font-bold transition-all ${tradeType === 'YES' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              YES {market.yes}¢
            </button>
            <button 
              onClick={() => setTradeType('NO')}
              className={`flex-1 py-2 rounded-md font-bold transition-all ${tradeType === 'NO' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              NO {market.no}¢
            </button>
          </div>

          <div className="mb-6 bg-slate-800 rounded-lg p-3 flex items-center border border-slate-700 focus-within:border-green-500 transition-colors">
            <span className="text-green-400 text-xs font-bold mr-2">●</span>
            <input 
              type="number" 
              placeholder="Amount to wager"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent border-none text-white w-full text-lg font-mono focus:outline-none placeholder-slate-500"
            />
          </div>

          <div className="flex justify-between items-center mb-6 text-sm">
            <span className="text-slate-400">Potential Payout</span>
            <span className="text-green-400 font-bold font-mono text-lg flex items-center gap-1">
              <span className="text-sm">●</span>{potentialPayout}
            </span>
          </div>

          <button 
            onClick={handleOrder}
            disabled={tradeLoading || !amount || amount <= 0 || (market.end_date && new Date(market.end_date) < new Date())}
            className={`w-full py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 ${
              (market.end_date && new Date(market.end_date) < new Date()) ? 'bg-slate-700 text-slate-400' :
              tradeType === 'YES' ? 'bg-green-500 hover:bg-green-600 text-black' : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {(market.end_date && new Date(market.end_date) < new Date()) ? 'Market Closed' : tradeLoading ? 'Processing...' : 'Confirm Order'}
          </button>
        </div>
      </div>

    </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-[68px] md:bottom-0 left-0 w-full bg-[#0e1014]/95 backdrop-blur-md border-t border-[#2a2e33] p-4 z-40 flex gap-4">
        <button 
          onClick={() => {
            setTradeType('YES');
            document.getElementById('order-widget')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex-1 py-3 rounded-xl font-bold bg-green-500 hover:bg-green-600 text-black shadow-lg shadow-green-500/20 transition-colors flex items-center justify-center gap-2"
        >
          Yes {market.yes}¢
        </button>
        <button 
          onClick={() => {
            setTradeType('NO');
            document.getElementById('order-widget')?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex-1 py-3 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-colors flex items-center justify-center gap-2"
        >
          No {market.no}¢
        </button>
      </div>
    </>
  );
}
