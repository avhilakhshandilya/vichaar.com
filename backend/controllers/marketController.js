const { supabase } = require("../utils/supabase");

exports.vote = async (req, res) => {
  try {
    const { user_id, market_id, choice, amount } = req.body;
    
    if (!user_id || !market_id || !choice || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_points')
      .eq('user_id', user_id)
      .single();
      
    if (userError) throw userError;
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.total_points < amount) {
      return res.status(400).json({ success: false, message: "Insufficient points" });
    }

    // Execute updates
    const { error: updateError } = await supabase
      .from('users')
      .update({ total_points: user.total_points - amount })
      .eq('user_id', user_id);
      
    if (updateError) throw updateError;

    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('house_yes_points, house_no_points')
      .eq('market_id', market_id)
      .single();
      
    if (marketError) throw marketError;

    const updates = {};
    if (choice.toUpperCase() === 'YES') {
      updates.house_yes_points = market.house_yes_points + amount;
    } else {
      updates.house_no_points = market.house_no_points + amount;
    }
    
    const { error: marketUpdateError } = await supabase
      .from('markets')
      .update(updates)
      .eq('market_id', market_id);
      
    if (marketUpdateError) throw marketUpdateError;

    const dbChoice = choice.toUpperCase() === 'YES' ? 'Yes' : 'No';

    const { error: voteError } = await supabase
      .from('votes')
      .insert([{ user_id, market_id, choice: dbChoice, amount }]);
      
    if (voteError) throw voteError;

    return res.json({ success: true, message: "Order confirmed successfully!" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getActivityFeed = async (req, res) => {
  try {
    // 1. Fetch latest 10 votes with user and market info
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select(`
        vote_id, choice, amount, created_at,
        users ( username, display_name ),
        markets ( market_id, question )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (votesError) throw votesError;

    // 2. Fetch latest 10 comments with user and market info
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        comment_id, content, created_at,
        users ( username, display_name ),
        markets ( market_id, question )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (commentsError) throw commentsError;

    // Format and combine
    const formattedVotes = votes.map(v => ({
      type: 'vote',
      id: `vote_${v.vote_id}`,
      user: v.users,
      market: v.markets,
      choice: v.choice,
      amount: v.amount,
      created_at: v.created_at
    }));

    const formattedComments = comments.map(c => ({
      type: 'comment',
      id: `comment_${c.comment_id}`,
      user: c.users,
      market: c.markets,
      content: c.content,
      created_at: c.created_at
    }));

    // Combine, sort by created_at descending, take top 15
    const combined = [...formattedVotes, ...formattedComments]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 15);

    return res.json({ success: true, activities: combined });
  } catch (error) {
    console.error("Activity Feed Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.resolveMarket = async (req, res) => {
  try {
    const { market_id, winning_outcome } = req.body; // 'YES', 'NO', 'CANCEL'
    
    if (!market_id || !winning_outcome || !['YES', 'NO', 'CANCEL'].includes(winning_outcome)) {
      return res.status(400).json({ success: false, message: "Invalid parameters" });
    }

    // 1. Fetch market
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('*')
      .eq('market_id', market_id)
      .single();

    if (marketError || !market) return res.status(404).json({ success: false, message: "Market not found" });
    if (market.status === 'Resolved') return res.status(400).json({ success: false, message: "Market is already resolved" });

    // 2. Fetch all votes for this market
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .eq('market_id', market_id);

    if (votesError) throw votesError;

    // 3. Calculate Pools
    const totalYes = market.house_yes_points;
    const totalNo = market.house_no_points;
    const totalPool = totalYes + totalNo;

    const winningPool = winning_outcome === 'YES' ? totalYes : totalNo;

    // 4. Process payouts
    for (const vote of votes) {
      let payout = 0;
      let isWinner = false;

      if (winning_outcome === 'CANCEL') {
        // Refund
        payout = vote.amount;
        isWinner = null;
      } else if (vote.choice === winning_outcome) {
        // Pari-Mutuel Payout: (User wager / Winning Pool) * Total Pool
        if (winningPool > 0) {
          payout = Math.floor((vote.amount / winningPool) * totalPool);
        }
        isWinner = true;
      } else {
        // Lost
        payout = 0;
        isWinner = false;
      }

      // If user won or refunded, add points to their wallet and send notification
      if (payout > 0) {
        // Fetch current user balance
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('total_points')
          .eq('user_id', vote.user_id)
          .single();
          
        if (!userError && user) {
          await supabase
            .from('users')
            .update({ total_points: user.total_points + payout })
            .eq('user_id', vote.user_id);
            
          // Insert Notification
          await supabase.from('notifications').insert([{
            user_id: vote.user_id,
            title: isWinner === null ? 'Trade Refunded' : 'You Won! 🎉',
            message: isWinner === null 
              ? `Market '${market.question}' was cancelled. You have been refunded ${payout} points.`
              : `You won ${payout} points on '${market.question}'!`
          }]);
        }
      }

      // Mark vote as resolved
      await supabase
        .from('votes')
        .update({ 
          isWinner: isWinner 
        })
        .eq('vote_id', vote.vote_id);
    }

    // 5. Mark market as resolved
    await supabase
      .from('markets')
      .update({ 
        status: 'Resolved',
        winning_outcome: winning_outcome 
      })
      .eq('market_id', market_id);

    return res.json({ success: true, message: `Market resolved as ${winning_outcome}. Payouts distributed.` });

  } catch (error) {
    console.error("Resolve Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createMarket = async (req, res) => {
  try {
    const { question, category, image_url, end_date, house_yes_points, house_no_points } = req.body;
    
    if (!question || !category) {
      return res.status(400).json({ success: false, message: "Question and Category are required" });
    }

    const { data: newMarket, error } = await supabase
      .from('markets')
      .insert([
        {
          question,
          category,
          image_url: image_url || null,
          end_date: end_date || null,
          house_yes_points: house_yes_points || 500,
          house_no_points: house_no_points || 500,
          status: 'Active'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, message: "Market created successfully", market: newMarket });
  } catch (error) {
    console.error("Create Market Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
