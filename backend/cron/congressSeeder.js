import axios from "axios";
import { supabase } from "../utils/supabase.js";
import { getImageForQuestion, IMAGES } from "../utils/imageHelper.js";

const BASE_LIQUIDITY = 50;

async function seedCongressMarkets() {
  console.log("🏛️ [Cron] Starting Congress & Elections Market Seeder...");

  let createdCount = 0;
  const endOfYear = new Date(`2026-12-31T23:59:59Z`).toISOString();

  // 1. Seed US Congressional Elections
  const electionMarkets = [
    "GOP wins US Senate in 2026 midterms?",
    "Democrats win US House in 2026 midterms?",
    "US Senate runoff needed in 2026?"
  ];

  for (const question of electionMarkets) {
    const { data: existing } = await supabase
      .from('markets')
      .select('market_id')
      .eq('question', question)
      .single();
      
    if (existing) continue;

    const { error } = await supabase.from('markets').insert([{
      question: question,
      description: `This market predicts if ${member.first_name} ${member.last_name} (${member.party}-${member.state}) will be selected to lead a major committee or secure a party leadership role before the end of the current term.`,
      category: 'Politics',
      image_url: getImageForQuestion(question),
      house_yes_points: BASE_LIQUIDITY / 2,
      house_no_points: BASE_LIQUIDITY / 2,
      status: 'Active',
      end_date: endOfYear
    }]);

    if (error) {
      console.error(`❌ Failed to insert election market: ${question}`, error);
    } else {
      console.log(`✅ Created Election Market: ${question}`);
      createdCount++;
    }
  }

  // 2. Seed GovTrack Legislation
  try {
    const url = 'https://www.govtrack.us/api/v2/bill?congress=118&limit=5';
    const response = await axios.get(url);

    const bills = response.data?.objects || [];

    for (const bill of bills) {
      if (!bill.title) continue;
      
      const question = `${bill.title} becomes law in 2026?`;

      // Check if market already exists
      const { data: existing } = await supabase
        .from('markets')
        .select('market_id')
        .eq('question', question)
        .single();
        
      if (existing) continue;

      const { error } = await supabase.from('markets').insert([{
        question: question,
        description: `This market resolves to Yes if the bill '${bill.title}' (introduced by ${bill.sponsor_name}) successfully passes both the House and Senate and is signed into law before the end of the year.`,
        category: 'Politics',
        image_url: getImageForQuestion(question),
        house_yes_points: BASE_LIQUIDITY / 2,
        house_no_points: BASE_LIQUIDITY / 2,
        status: 'Active',
        end_date: endOfYear
      }]);

      if (error) {
        console.error(`❌ Failed to insert legislation market: ${question}`, error);
      } else {
        console.log(`✅ Created Legislation Market: ${question}`);
        createdCount++;
      }
    }
  } catch (error) {
    console.error(`❌ Error fetching GovTrack data:`, error.message);
  }

  console.log(`🏁 [Cron] Congress & Elections Seeder finished. Created ${createdCount} markets.`);
}

export {  seedCongressMarkets  };
