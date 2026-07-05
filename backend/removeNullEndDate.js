require('dotenv').config();
const { supabase } = require('./utils/supabase');

async function removeNullEndDateMarkets() {
  console.log("Removing markets with no end_date...");
  
  const { data, error } = await supabase
    .from('markets')
    .delete()
    .is('end_date', null)
    .select();

  if (error) {
    console.error("Error deleting markets:", error);
  } else {
    console.log(`Successfully deleted ${data.length} markets.`);
  }
}

removeNullEndDateMarkets();
