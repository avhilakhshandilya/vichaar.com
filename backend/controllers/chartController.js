import { supabase } from "../utils/supabase.js";

export const getMarketHistory = async (req, res) => {
  try {
    const { market_id } = req.params;

    const { data: votes, error } = await supabase
      .from('votes')
      .select('*')
      .eq('market_id', market_id)
      .order('created_at', { ascending: true }); 

    if (error) {
      // Fallback if created_at doesn't exist
      console.warn(error.message);
    }

    let yesPool = 500; // Assume 500 base house points
    let noPool = 500;
    
    const history = [{
      time: 'Initial',
      probability: 50
    }];

    if (votes) {
      votes.forEach((v, index) => {
        if (v.choice.toUpperCase() === 'YES') {
          yesPool += v.amount;
        } else {
          noPool += v.amount;
        }
        
        const total = yesPool + noPool;
        const prob = Math.round((yesPool / total) * 100);
        
        const dateStr = v.created_at ? new Date(v.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : `Trade ${index + 1}`;
        
        history.push({
          time: dateStr,
          probability: prob
        });
      });
    }

    return res.json({ success: true, history });
  } catch (error) {
    console.error("Chart Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
