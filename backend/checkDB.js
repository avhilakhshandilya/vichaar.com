require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .ilike('question', '%Argentina%');

  console.log(JSON.stringify(data, null, 2));
}

check();
