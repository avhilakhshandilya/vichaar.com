const { supabase } = require("../utils/supabase");
const bcrypt = require("bcrypt");

exports.claimDailyBonus = async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ success: false, message: "Missing user_id" });

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_points, last_daily_claim')
      .eq('user_id', user_id)
      .single();

    if (userError || !user) throw userError || new Error("User not found");

    const now = new Date();
    let canClaim = false;

    if (!user.last_daily_claim) {
      canClaim = true;
    } else {
      const lastClaim = new Date(user.last_daily_claim);
      // Check if last claim was before today (in local/server time for simplicity)
      if (lastClaim.toDateString() !== now.toDateString() && lastClaim < now) {
        canClaim = true;
      }
    }

    if (!canClaim) {
      return res.status(400).json({ success: false, message: "Daily bonus already claimed today." });
    }

    const newTotal = user.total_points + 50;
    const { error: updateError } = await supabase
      .from('users')
      .update({ total_points: newTotal, last_daily_claim: new Date().toISOString() })
      .eq('user_id', user_id);

    if (updateError) throw updateError;

    // Insert Notification
    await supabase.from('notifications').insert([{
      user_id,
      title: 'Daily Bonus Claimed! 🎉',
      message: 'You successfully claimed your 50 points daily bonus. Come back tomorrow for more!'
    }]);

    return res.json({ 
      success: true, 
      message: "Successfully claimed 50 points!", 
      newTotal 
    });
  } catch (error) {
    console.error("Bonus Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPortfolio = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    if (!user_id) return res.status(400).json({ success: false, message: "Missing user_id" });

    // Fetch user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_points')
      .eq('user_id', user_id)
      .single();
      
    if (userError || !user) throw userError || new Error("User not found");

    // Fetch votes with joined market data
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select(`
        vote_id,
        choice,
        amount,
        markets (
          market_id,
          question,
          status,
          winning_outcome
        )
      `)
      .eq('user_id', user_id);

    if (votesError) throw votesError;

    // Transform data for frontend
    const activePositions = votes.map(v => ({
      id: v.vote_id,
      question: v.markets.question,
      type: v.choice,
      amount: v.amount,
      status: v.markets.status,
    }));

    return res.json({
      success: true,
      liquid_points: user.total_points,
      positions: activePositions
    });
  } catch (error) {
    console.error("Portfolio Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('username, display_name, total_points')
      .order('total_points', { ascending: false })
      .limit(10);

    if (error) throw error;

    return res.json({ success: true, leaderboard: users });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Fetch user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, username, display_name, total_points')
      .eq('username', username)
      .single();

    if (userError || !user) throw userError || new Error("User not found");

    // Fetch resolved bets history to calculate win rate
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select(`
        vote_id,
        choice,
        amount,
        created_at,
        markets (
          market_id,
          question,
          status,
          winning_outcome
        )
      `)
      .eq('user_id', user.user_id)
      .order('created_at', { ascending: true });

    if (votesError) throw votesError;

    let correctBets = 0;
    let totalResolved = 0;
    let totalVolume = 0;
    let cumulativeVolume = 0;
    const chartData = [];

    const history = votes.map(v => {
      const isResolved = v.markets.status === 'Resolved';
      const isWinner = isResolved && v.markets.winning_outcome === v.choice;
      
      totalVolume += v.amount;
      cumulativeVolume += v.amount;
      
      // Add data point for chart
      chartData.push({
        date: new Date(v.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        volume: cumulativeVolume
      });

      if (isResolved) {
        totalResolved++;
        if (isWinner) correctBets++;
      }

      return {
        id: v.vote_id,
        market_id: v.markets.market_id,
        question: v.markets.question,
        choice: v.choice,
        amount: v.amount,
        status: v.markets.status,
        winning_outcome: v.markets.winning_outcome,
        isWinner,
        created_at: v.created_at
      };
    });

    // Ensure we sort history descending for the feed
    history.reverse();

    const winRate = totalResolved > 0 ? Math.round((correctBets / totalResolved) * 100) : 0;

    return res.json({
      success: true,
      profile: {
        username: user.username,
        display_name: user.display_name,
        total_points: user.total_points,
        winRate,
        totalBets: votes.length,
        totalVolume,
        chartData,
        history
      }
    });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ success: false, message: "User ID required" });

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    
    return res.json({ success: true, notifications: data });
  } catch (error) {
    console.error("Notifications Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ success: false, message: "User ID required" });

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user_id)
      .eq('is_read', false);

    if (error) throw error;
    
    return res.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error("Notifications Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { user_id, display_name } = req.body;
    
    if (!user_id || !display_name) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ display_name })
      .eq('user_id', user_id)
      .select('user_id, username, display_name')
      .single();

    if (error) throw error;

    return res.json({ 
      success: true, 
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateEmail = async (req, res) => {
  try {
    const { user_id, email } = req.body;
    
    if (!user_id || !email) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ email })
      .eq('user_id', user_id)
      .select('user_id, username, display_name, email')
      .single();

    if (error) {
      // If column doesn't exist, this will throw
      if (error.code === '42703') {
         return res.status(500).json({ success: false, message: "Database Error: The 'email' column does not exist in the users table." });
      }
      throw error;
    }

    return res.json({ 
      success: true, 
      message: "Email updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update Email Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { user_id, old_password, new_password } = req.body;

    if (!user_id || !old_password || !new_password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Fetch user's current password hash
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('user_id', user_id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify old password
    const passwordMatches = await bcrypt.compare(old_password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "Incorrect old password" });
    }

    // Hash new password
    const new_password_hash = await bcrypt.hash(new_password, 10);

    // Update in DB
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: new_password_hash })
      .eq('user_id', user_id);

    if (updateError) throw updateError;

    return res.json({ 
      success: true, 
      message: "Password changed successfully!"
    });
  } catch (error) {
    console.error("Update Password Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
