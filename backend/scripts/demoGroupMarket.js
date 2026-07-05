const { supabase } = require('../utils/supabase');

const BASE_LIQUIDITY = 10000;

async function seedGroupMarket() {
  console.log("🚀 Starting Grouped Market Seeder...");

  const endOfYear = new Date(`2026-12-31T23:59:59Z`).toISOString();
  const groupId = "us-iran-peace-talks";
  
  const options = [
    { name: "July 3", yesRatio: 0.16 },
    { name: "July 10", yesRatio: 0.18 },
    { name: "July 17", yesRatio: 0.31 },
    { name: "July 31", yesRatio: 0.64 }
  ];

  for (const opt of options) {
    const question = `[GROUP:${groupId}] ${opt.name}`;
    
    // Check if market already exists
    const { data: existing } = await supabase
      .from('markets')
      .select('market_id')
      .eq('question', question)
      .single();
      
    if (existing) {
      console.log(`Skipping (already exists): ${question}`);
      continue;
    }

    const yesPoints = Math.round(BASE_LIQUIDITY * opt.yesRatio);
    const noPoints = Math.round(BASE_LIQUIDITY * (1 - opt.yesRatio));

    const { error } = await supabase.from('markets').insert([{
      question: question,
      category: 'Politics',
      image_url: `https://via.placeholder.com/320x320.png?text=%F0%9F%87%BA%F0%9F%87%B8%F0%9F%A4%9D%F0%9F%87%AE%F0%9F%87%B7`, // US & Iran Shake Hand flags emojis 🇺🇸🤝🇮🇷
      house_yes_points: yesPoints,
      house_no_points: noPoints,
      status: 'Active',
      end_date: endOfYear
    }]);

    if (error) {
      console.error(`❌ Failed to insert: ${question}`, error);
    } else {
      console.log(`✅ Created Group Market Option: ${question}`);
    }
  }

  console.log(`🏁 Grouped Market Seeder finished.`);
}

seedGroupMarket();
