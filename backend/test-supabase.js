const { createClient } = require('@supabase/supabase-js'); 
require('dotenv').config(); 
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY); 

supabase.from('users').select('*').limit(1).then(console.log).catch(console.error);
