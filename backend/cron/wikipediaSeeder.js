import axios from "axios";
import { supabase } from "../utils/supabase.js";
import { getImageForQuestion, IMAGES } from "../utils/imageHelper.js";

const BASE_LIQUIDITY = 10000;

// Dynamic search queries for Wikipedia
const WIKI_QUERIES = [
  { term: 'intitle:2026 election India', category: 'Politics', icon: '🇮🇳' },
  { term: 'intitle:2026 election European Union', category: 'Politics', icon: '🇪🇺' },
  { term: 'intitle:2026 election United States', category: 'Politics', icon: '🇺🇸' },
  { term: 'intitle:2026 election China', category: 'Politics', icon: '🇨🇳' },
  { term: 'intitle:2026 sports India', category: 'Sports', icon: '🏏' },
  { term: 'intitle:2026 sports European', category: 'Sports', icon: '⚽' },
  { term: 'intitle:2026 in spaceflight', category: 'Science', icon: '🚀' },
  { term: 'intitle:2026 in science', category: 'Science', icon: '🔬' }
];

async function seedWikipediaMarkets() {
  console.log("📚 [Cron] Starting Wikipedia Market Seeder...");

  let createdCount = 0;
  const endOfYear = new Date(`2026-12-31T23:59:59Z`).toISOString();

  for (const query of WIKI_QUERIES) {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query.term)}&utf8=&format=json`;
      const response = await axios.get(url, {
        headers: { 'User-Agent': 'VichaarApp/1.0 (contact@example.com)' }
      });

      const searchResults = response.data?.query?.search || [];
      
      // Take top 2 most relevant results per query to avoid spamming the database
      const topResults = searchResults.slice(0, 2);

      for (const result of topResults) {
        // Filter out highly generic list pages like "List of elections in 2026"
        if (result.title.toLowerCase().includes("list of")) continue;

        const question = `${result.title} — smooth in 2026?`;

        // Check if market already exists
        const { data: existing } = await supabase
          .from('markets')
          .select('market_id')
          .eq('question', question)
          .single();
          
        if (existing) continue;

        const { error } = await supabase.from('markets').insert([{
          question: question,
          description: `This market resolves to Yes if the Wikipedia article for '${result.title}' remains relevant and active throughout 2026.`,
          category: 'Politics', // We use Politics due to DB constraint, UI will filter it
          image_url: getImageForQuestion(question),
          house_yes_points: BASE_LIQUIDITY / 2,
          house_no_points: BASE_LIQUIDITY / 2,
          status: 'Active',
          end_date: endOfYear
        }]);

        if (error) {
          console.error(`❌ Failed to insert market: ${question}`, error);
        } else {
          console.log(`✅ Created Wikipedia Market [${query.category}]: ${question}`);
          createdCount++;
        }
      }
    } catch (error) {
      console.error(`❌ Error fetching Wikipedia data for ${query.term}:`, error.message);
    }
  }

  console.log(`🏁 [Cron] Wikipedia Seeder finished. Created ${createdCount} markets.`);
}

export {  seedWikipediaMarkets  };
