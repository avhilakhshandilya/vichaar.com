import { supabase } from './utils/supabase.js';
async function run() {
  const { data } = await supabase.from('markets').select('market_id, question, status').ilike('question', '%Goa%');
  console.log('Goa markets count:', data.length);
  console.log(data);
}
run();
