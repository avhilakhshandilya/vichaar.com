import yahooFinance from "yahoo-finance2";
import { supabase } from "../utils/supabase.js";
import { getImageForQuestion, IMAGES } from "../utils/imageHelper.js";

const BASE_LIQUIDITY = 10000;

const ASSETS = [
  { symbol: 'SPY', name: 'S&P 500 ETF', isCrypto: false },
  { symbol: 'TSLA', name: 'Tesla', isCrypto: false },
  { symbol: 'AAPL', name: 'Apple', isCrypto: false }
];

function getUpcomingFriday() {
  const d = new Date();
  const day = d.getDay(); // 0 is Sunday, 5 is Friday
  const diff = d.getDate() + (5 - day + 7) % 7;
  const friday = new Date(d.setDate(diff));
  friday.setHours(23, 59, 59, 999);
  return friday;
}

async function seedFinanceMarkets() {
  console.log("📈 [Cron] Starting Finance Market Seeder (Yahoo Finance)...");

  let createdCount = 0;
  const endOfWeek = getUpcomingFriday().toISOString();

  for (const asset of ASSETS) {
    try {
      const quote = await yahooFinance.quote(asset.symbol);
      if (!quote || !quote.regularMarketPrice) continue;

      const currentPrice = quote.regularMarketPrice;
      
      // Target is current price + 2% for short term
      const targetPrice = asset.isCrypto 
        ? Math.round(currentPrice * 1.05) // 5% for volatile crypto
        : (currentPrice * 1.02).toFixed(2); // 2% for stocks
        
      const question = `${asset.name} above $${targetPrice} by Friday?`;
      const description = `This market resolves to Yes if the official trading price of ${asset.name} (${asset.symbol}) exceeds $${targetPrice} at any point before the upcoming Friday market close. Current price was $${currentPrice.toFixed(2)} when the market was generated.`;

      // Check if market already exists
      const { data: existing } = await supabase
        .from('markets')
        .select('market_id')
        .eq('question', question)
        .single();
        
      if (existing) continue;

        const { error } = await supabase.from('markets').insert([{
          question: question,
          description: description,
          category: 'Politics', // Intercepted by frontend as Finance
          image_url: getImageForQuestion(question),
          house_yes_points: BASE_LIQUIDITY / 2,
          house_no_points: BASE_LIQUIDITY / 2,
          status: 'Active',
          end_date: getUpcomingFriday()
        }]);

      if (error) {
        console.error(`❌ Failed to insert market: ${question}`, error);
      } else {
        console.log(`✅ Created Finance Market: ${question}`);
        createdCount++;
      }
      
    } catch (error) {
      console.error(`❌ Error fetching data for ${asset.symbol}:`, error.message);
    }
  }

  console.log(`🏁 [Cron] Finance Seeder finished. Created ${createdCount} markets.`);
}

export {  seedFinanceMarkets  };
