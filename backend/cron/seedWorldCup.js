require('dotenv').config();
const { supabase } = require('../utils/supabase');

async function seedWorldCup() {
  const options = [
    { name: "France", yes: 3300, no: 6700 },
    { name: "Argentina", yes: 1900, no: 8100 },
    { name: "Spain", yes: 1300, no: 8700 },
    { name: "Brazil", yes: 1100, no: 8900 }
  ];

  for (const opt of options) {
    const question = `[GROUP:world-cup-winner] ${opt.name}`;
    
    // Check if exists
    const { data: existing } = await supabase.from('markets').select('market_id').eq('question', question).single();
    if (existing) {
      console.log(`Skipping ${opt.name}`);
      continue;
    }

    const { error } = await supabase.from('markets').insert([{
      question: question,
      category: 'Football',
      image_url: `https://ui-avatars.com/api/?name=${opt.name}&background=random&color=fff&rounded=true&size=128`,
      house_yes_points: opt.yes,
      house_no_points: opt.no,
      status: 'Active',
      end_date: new Date('2026-07-20').toISOString()
    }]);

    if (error) console.error(error);
    else console.log(`Created ${opt.name}`);
  }
}

seedWorldCup();
