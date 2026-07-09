import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { calculateSmoothedPercentages } from '../utils/marketUtils';
import { Calendar, Copy, Info, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000' : 'https://vichaar-backend.avhilakh.workers.dev');

export default function Market() {
  const { market_id } = useParams();
  const [market, setMarket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [myVote, setMyVote] = useState(null); // 'Yes' | 'No' | null
  const [voteLoading, setVoteLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('vichaarUser') || 'null');

  useEffect(() => {
    async function loadData() {
      const { data: m } = await supabase.from('markets').select('*').eq('market_id', market_id).single();
      if (m) setMarket(formatMarket(m));

      try {
        const res = await fetch(`${API_URL}/api/comments/${market_id}`);
        const data = await res.json();
        if (data.success) setComments(data.comments);
      } catch (err) { console.error(err); }

      // Check if logged-in user already voted
      if (currentUser) {
        const { data: existing } = await supabase
          .from('votes').select('choice').eq('user_id', currentUser.user_id).eq('market_id', market_id).maybeSingle();
        if (existing) setMyVote(existing.choice);
      }

      setLoading(false);
    }

    if (market_id) loadData();

    const marketSub = supabase.channel(`market_${market_id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'markets', filter: `market_id=eq.${market_id}` }, (payload) => {
        setMarket(formatMarket(payload.new));
      }).subscribe();

    const commentSub = supabase.channel(`comments_${market_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `market_id=eq.${market_id}` }, async (payload) => {
        const { data: c } = await supabase.from('comments')
          .select('comment_id, content, created_at, parent_id, users(user_id, username, display_name)')
          .eq('comment_id', payload.new.comment_id).single();
        if (c) {
          setComments((prev) => [{ id: c.comment_id, content: c.content, created_at: c.created_at, parent_id: c.parent_id, user_id: c.users.user_id, username: c.users.username, display_name: c.users.display_name }, ...prev]);
        }
      }).subscribe();

    return () => { supabase.removeChannel(marketSub); supabase.removeChannel(commentSub); };
  }, [market_id]);

  const formatMarket = (m) => {
    const { yes, no, totalVotes } = calculateSmoothedPercentages(m.house_yes_points, m.house_no_points);
    return { id: m.market_id, question: m.question, description: m.description, category: m.category, status: m.status, winning_outcome: m.winning_outcome, yes, no, image_url: m.image_url, end_date: m.end_date, totalVotes };
  };

  const handleVote = async (choice) => {
    if (!currentUser) { alert('Please log in to vote.'); return; }
    setVoteLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/markets/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.user_id, market_id, choice })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setMyVote(data.choice);
    } catch (err) { alert(err.message); }
    finally { setVoteLoading(false); }
  };

  const submitComment = async (e, parentId = null) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) return;
    try {
      if (!currentUser) throw new Error('Please log in to comment.');
      const res = await fetch(`${API_URL}/api/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.user_id, market_id, content, parent_id: parentId })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      if (parentId) { setReplyContent(''); setReplyingTo(null); } else { setNewComment(''); }
      const refreshRes = await fetch(`${API_URL}/api/comments/${market_id}`);
      const refreshData = await refreshRes.json();
      if (refreshData.success) setComments(refreshData.comments);
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading Market...</div>;
  if (!market) return <div className="p-10 text-center text-red-500">Market not found</div>;

  const isClosed = market.status !== 'Active' || (market.end_date && new Date(market.end_date) < new Date());
  const topLevelComments = comments.filter(c => !c.parent_id);

  const CommentNode = ({ comment, level = 0 }) => {
    const replies = comments.filter(c => c.parent_id === comment.id).reverse();
    const [isCollapsed, setIsCollapsed] = useState(false);
    return (
      <div className={`flex flex-col gap-3 ${level > 0 ? 'mt-2' : ''}`}>
        <div className="flex gap-4">
          <div className={`rounded-full bg-slate-800 flex items-center justify-center text-green-400 font-bold border border-slate-700 uppercase shrink-0 ${level === 0 ? 'w-10 h-10' : 'w-8 h-8 text-xs'}`}>
            {comment.display_name.charAt(0)}
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`font-bold text-white ${level > 0 ? 'text-sm' : ''}`}>{comment.display_name}</span>
              <span className={`text-slate-500 ${level > 0 ? 'text-[10px]' : 'text-xs'}`}>{new Date(comment.created_at).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
              <button onClick={() => setIsCollapsed(!isCollapsed)} className="ml-auto text-slate-500 hover:text-white transition-colors flex items-center gap-1 text-xs">
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>
            {!isCollapsed && (
              <>
                <p className={`text-slate-300 break-words ${level > 0 ? 'text-sm' : ''}`}>{comment.content}</p>
                <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} className="text-xs text-slate-400 hover:text-green-400 font-bold mt-2 transition-colors">Reply</button>
                {replyingTo === comment.id && (
                  <form onSubmit={(e) => submitComment(e, comment.id)} className="flex gap-2 mt-3">
                    <input type="text" autoFocus value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Write a reply..." className="flex-grow bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500 transition-colors" />
                    <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-1.5 rounded-lg text-sm transition-colors">Post</button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
        {!isCollapsed && replies.length > 0 && (
          <div className="ml-5 pl-5 border-l border-slate-800 flex flex-col gap-4 mt-2">
            {replies.map(reply => <CommentNode key={reply.id} comment={reply} level={level + 1} />)}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-8 pb-36 lg:pb-6">

        {/* Left: Info + Discussion */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl p-6">
            <div className="flex gap-4 items-start mb-4">
              <img 
                src={market.image_url || `https://ui-avatars.com/api/?name=${market.category}&background=random`} 
                alt="market" 
                className="w-14 h-14 rounded-xl object-cover border border-[#2a2e33] shrink-0" 
                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${market.category}&background=random` }}
              />
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-1 rounded">{market.category}</span>
                <h1 className="text-xl sm:text-2xl font-bold text-white mt-2 leading-snug">{market.question}</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 items-center border-t border-[#2a2e33] pt-4 mt-4">
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }} className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1d23] hover:bg-[#2a2e33] text-slate-300 rounded-lg transition-colors text-sm">
                <Copy size={14} /> Copy Link
              </button>
              <div className="flex items-center gap-2 text-slate-400 text-sm ml-auto">
                <Calendar size={14} />
                <span>Ends: {market.end_date ? new Date(market.end_date).toLocaleDateString() : 'TBD'}</span>
                {isClosed && <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs border border-red-500/30">{market.status === 'Resolved' ? 'RESOLVED' : 'CLOSED'}</span>}
              </div>
            </div>
          </div>

          {market.description && (
            <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Info className="text-blue-400" size={18} /> About</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{market.description}</p>
            </div>
          )}

          {/* Discussion */}
          <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Discussion</h2>
            <form onSubmit={submitComment} className="flex gap-3 mb-6">
              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={currentUser ? "Share your thoughts..." : "Log in to comment"} disabled={!currentUser} className="flex-grow bg-[#0f1115] border border-[#2a2e33] rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-green-500 transition-colors disabled:opacity-50" />
              <button type="submit" disabled={!currentUser} className="bg-[#2a2e33] hover:bg-[#3a3f45] text-white font-bold px-5 py-2 rounded-xl transition-colors text-sm disabled:opacity-50">Post</button>
            </form>
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
              {topLevelComments.length === 0 ? <p className="text-slate-500 text-center py-4 text-sm">No comments yet. Be the first!</p>
                : topLevelComments.map(c => <CommentNode key={c.id} comment={c} />)}
            </div>
          </div>
        </div>

        {/* Right: Vote Panel */}
        <div className="lg:col-span-1" id="vote-widget">
          <div className="bg-[#111317] border border-[#2a2e33] rounded-2xl p-6 sticky top-6">

            {/* Community sentiment */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-green-400 font-bold">YES {market.yes}%</span>
                <span className="text-red-400 font-bold">NO {market.no}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#1a1d23] overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-500" style={{ width: `${market.yes}%` }} />
              </div>
              <p className="text-slate-500 text-xs mt-2 text-center">{market.totalVotes} vote{market.totalVotes !== 1 ? 's' : ''} cast</p>
            </div>

            <h2 className="text-lg font-bold text-white mb-4">Your Vote</h2>

            {market.winning_outcome && (
              <div className={`p-3 rounded-xl mb-4 text-center font-bold border ${market.winning_outcome === 'Yes' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                Resolved: {market.winning_outcome}
              </div>
            )}

            {myVote ? (
              <div className={`p-4 rounded-xl border-2 text-center ${myVote === 'Yes' ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-red-500/10 border-red-500 text-red-400'}`}>
                <div className="text-2xl mb-1">{myVote === 'Yes' ? '👍' : '👎'}</div>
                <p className="font-bold text-lg">You voted {myVote.toUpperCase()}</p>
                <p className="text-xs opacity-70 mt-1">Your vote is locked in</p>
              </div>
            ) : isClosed ? (
              <div className="p-4 rounded-xl bg-[#1a1d23] border border-[#2a2e33] text-center text-slate-400 text-sm">
                {market.status === 'Resolved' ? 'This market has been resolved.' : 'Voting is closed for this market.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleVote('YES')} disabled={voteLoading} className="py-4 rounded-xl font-bold text-lg bg-green-500/10 border-2 border-green-500/40 text-green-400 hover:bg-green-500/20 hover:border-green-500 transition-all disabled:opacity-50">
                  👍 YES
                </button>
                <button onClick={() => handleVote('NO')} disabled={voteLoading} className="py-4 rounded-xl font-bold text-lg bg-red-500/10 border-2 border-red-500/40 text-red-400 hover:bg-red-500/20 hover:border-red-500 transition-all disabled:opacity-50">
                  👎 NO
                </button>
              </div>
            )}

            {!currentUser && !myVote && !isClosed && (
              <p className="text-slate-500 text-xs text-center mt-3">
                <a href="/login" className="text-green-400 hover:underline">Log in</a> to cast your vote
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky vote bar */}
      {!myVote && !isClosed && (
        <div className="lg:hidden fixed bottom-[68px] left-0 w-full bg-[#0e1014]/95 backdrop-blur-md border-t border-[#2a2e33] p-3 z-40 flex gap-3">
          <button onClick={() => handleVote('YES')} disabled={voteLoading} className="flex-1 py-3 rounded-xl font-bold bg-green-500 hover:bg-green-400 text-black transition-colors disabled:opacity-50">
            YES {market.yes}%
          </button>
          <button onClick={() => handleVote('NO')} disabled={voteLoading} className="flex-1 py-3 rounded-xl font-bold bg-red-500 hover:bg-red-400 text-white transition-colors disabled:opacity-50">
            NO {market.no}%
          </button>
        </div>
      )}
    </>
  );
}
