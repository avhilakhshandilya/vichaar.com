require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function closeExpiredMarkets() {
  console.log("🔒 Closing expired markets...");
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('markets')
    .update({ status: 'Ended' })
    .eq('status', 'Active')
    .lt('end_date', now)
    .select();

  if (error) {
    console.error("Error closing markets:", error);
  } else {
    console.log(`✅ Closed ${data.length} expired markets.`);
  }
}

closeExpiredMarkets();
