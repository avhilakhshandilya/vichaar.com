const axios = require('axios');
const { supabase } = require('../utils/supabase');

const BASE_LIQUIDITY = 10000;

async function seedSpaceMarkets() {
  console.log("🚀 [Cron] Starting Space Devs Market Seeder...");

  let createdCount = 0;
  // Use a date far enough in the future for market expiration.
  const endOfYear = new Date(`2026-12-31T23:59:59Z`).toISOString();

  try {
    const url = 'https://lldev.thespacedevs.com/2.2.0/launch/upcoming/?limit=5';
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'VichaarApp/1.0 (contact@example.com)' }
    });

    const launches = response.data?.results || [];

    for (const launch of launches) {
      if (!launch.name || !launch.net) continue;
      
      const launchDate = new Date(launch.net).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const question = `${launch.name} launches on schedule on ${launchDate}?`;

      // Check if market already exists
      const { data: existing } = await supabase
        .from('markets')
        .select('market_id')
        .eq('question', question)
        .single();
        
      if (existing) continue;

      const { error } = await supabase.from('markets').insert([{
        question: question,
        description: `This market resolves to Yes if SpaceX successfully launches the '${launch.name}' mission from ${launch.pad?.name} within the current month, as confirmed by official SpaceX manifest updates.`,
        category: 'Politics', // Stored under Politics, filtered by keywords into Science
        image_url: `https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=800`,
        house_yes_points: BASE_LIQUIDITY / 2,
        house_no_points: BASE_LIQUIDITY / 2,
        status: 'Active',
        end_date: endOfMonth
      }]);

      if (error) {
        console.error(`❌ Failed to insert space market: ${question}`, error);
      } else {
        console.log(`✅ Created Space Market: ${question}`);
        createdCount++;
      }
    }
  } catch (error) {
    console.error(`❌ Error fetching Space Devs data:`, error.message);
  }

  console.log(`🏁 [Cron] Space Devs Seeder finished. Created ${createdCount} markets.`);
}

module.exports = { seedSpaceMarkets };
