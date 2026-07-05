require('dotenv').config();
const { supabase } = require('./utils/supabase');
const crypto = require('crypto');

async function seedMissingTeams() {
  const endDate = new Date('2026-07-19T00:00:00Z').toISOString();
  
  const missingTeams = [
    { team: 'England', yesPoints: 12000, noPoints: 88000, image: 'https://flagcdn.com/w320/gb-eng.png' },
    { team: 'Germany', yesPoints: 10000, noPoints: 90000, image: 'https://flagcdn.com/w320/de.png' },
    { team: 'Portugal', yesPoints: 8000, noPoints: 92000, image: 'https://flagcdn.com/w320/pt.png' },
    { team: 'Netherlands', yesPoints: 6000, noPoints: 94000, image: 'https://flagcdn.com/w320/nl.png' },
    { team: 'Italy', yesPoints: 5000, noPoints: 95000, image: 'https://flagcdn.com/w320/it.png' },
    { team: 'Belgium', yesPoints: 3000, noPoints: 97000, image: 'https://flagcdn.com/w320/be.png' }
  ];

  console.log("Seeding missing World Cup teams...");

  for (const t of missingTeams) {
    const marketId = crypto.randomUUID();
    const { error } = await supabase
      .from('markets')
      .insert({
        market_id: marketId,
        question: `[GROUP:world-cup-winner] ${t.team}`,
        category: 'Football',
        status: 'Active',
        end_date: endDate,
        image_url: t.image,
        house_yes_points: t.yesPoints,
        house_no_points: t.noPoints
      });
      
    if (error) {
      console.error(`Error inserting ${t.team}:`, error);
    } else {
      console.log(`Successfully added ${t.team} (${marketId})`);
      
      // Add initial history
      await supabase.from('market_history').insert({
        market_id: marketId,
        yes_price: Math.round((t.yesPoints / (t.yesPoints + t.noPoints)) * 100),
        no_price: Math.round((t.noPoints / (t.yesPoints + t.noPoints)) * 100),
        total_volume: t.yesPoints + t.noPoints
      });
    }
  }
  console.log("Seeding complete.");
}

seedMissingTeams();
