const { supabase } = require("../utils/supabase");

exports.deposit = async (req, res) => {
  try {
    const { user_id, amount } = req.body;

    if (!user_id || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount or user ID." });
    }

    // First fetch the current user's balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_points')
      .eq('user_id', user_id)
      .single();

    if (userError || !user) {
      throw userError || new Error("User not found.");
    }

    // Update the balance
    const newTotal = user.total_points + amount;

    const { error: updateError } = await supabase
      .from('users')
      .update({ total_points: newTotal })
      .eq('user_id', user_id);

    if (updateError) throw updateError;

    return res.json({ 
      success: true, 
      message: `Successfully deposited ${amount} points.`, 
      newTotal 
    });
  } catch (error) {
    console.error("Deposit Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const { user_id, amount } = req.body;

    if (!user_id || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount or user ID." });
    }

    // Fetch the current user's balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('total_points')
      .eq('user_id', user_id)
      .single();

    if (userError || !user) {
      throw userError || new Error("User not found.");
    }

    if (user.total_points < amount) {
      return res.status(400).json({ success: false, message: "Insufficient liquid points." });
    }

    // Update the balance
    const newTotal = user.total_points - amount;

    const { error: updateError } = await supabase
      .from('users')
      .update({ total_points: newTotal })
      .eq('user_id', user_id);

    if (updateError) throw updateError;

    return res.json({ 
      success: true, 
      message: `Successfully withdrew ${amount} points.`, 
      newTotal 
    });
  } catch (error) {
    console.error("Withdrawal Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
