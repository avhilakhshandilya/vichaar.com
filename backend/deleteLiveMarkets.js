const { supabase } = require('./utils/supabase');

async function deleteLiveMarkets() {
  console.log("Deleting all active markets...");
  const { data, error } = await supabase
    .from('markets')
    .delete()
    .eq('status', 'Active');
    
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Successfully deleted live markets.");
  }
}

deleteLiveMarkets();
