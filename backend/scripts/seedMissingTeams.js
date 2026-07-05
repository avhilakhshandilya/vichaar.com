const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function addMissingTeams() {
  const missingTeams = [
    { name: 'Canada', code: 'ca' },
    { name: 'Paraguay', code: 'py' },
    { name: 'Morocco', code: 'ma' },
    { name: 'Norway', code: 'no' },
    { name: 'Mexico', code: 'mx' },
    { name: 'USA', code: 'us' },
    { name: 'Switzerland', code: 'ch' },
    { name: 'Egypt', code: 'eg' },
    { name: 'Colombia', code: 'co' }
  ];
  
  for (const team of missingTeams) {
    const question = `[GROUP:world-cup-winner] ${team.name}`;
    
    // Check if it already exists
    const { data: existing } = await supabase.from('markets').select('*').eq('question', question);
    if (existing && existing.length > 0) {
      console.log(`${team.name} already exists.`);
      continue;
    }
    
    const insertData = {
      question: question,
      category: 'Football',
      image_url: `https://flagcdn.com/w320/${team.code}.png`,
      status: 'Active',
      house_yes_points: 5000,
      house_no_points: 95000,
      end_date: '2026-07-19T00:00:00.000Z'
    };
    
    const { error } = await supabase.from('markets').insert([insertData]);
    if (error) console.error(`Error adding ${team.name}:`, error.message);
    else console.log(`Added ${team.name}`);
  }
}

addMissingTeams();
