import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import { supabase } from "../utils/supabase.js";
import { getImageForQuestion, IMAGES } from "../utils/imageHelper.js";

const BASE_LIQUIDITY = 100;

async function seedPoliticsMarkets() {
  console.log("🏛️ [Cron] Starting Politics Market Seeder...");

  let createdCount = 0;

  // 1. Fetch from GNews (Breaking National News)
  if (process.env.GNEWS_API_KEY) {
    try {
      console.log("📡 Fetching from GNews...");
      const res = await axios.get(`https://gnews.io/api/v4/top-headlines?category=nation&lang=en&country=in&max=3&apikey=${process.env.GNEWS_API_KEY.trim()}`);
      const articles = res.data.articles || [];

      for (const article of articles) {
        const question = `Major developments this week: "${article.title}"?`;
        
        const { data: existing } = await supabase
          .from('markets')
          .select('market_id')
          .eq('question', question)
          .single();
          
        if (!existing) {
          // Set end date to 7 days from now
          const endOfYear = new Date(new Date().getFullYear(), 11, 31).toISOString();

          const { error } = await supabase.from('markets').insert([{
            question: question,
            description: `This market resolves to Yes if the event described in the headline: '${article.title}' occurs by the end of the year. Context: ${article.description}`,
            category: 'Politics',
            image_url: getImageForQuestion(question),
            house_yes_points: BASE_LIQUIDITY / 2,
            house_no_points: BASE_LIQUIDITY / 2,
            status: 'Active',
            end_date: endOfYear
          }]);

          if (!error) {
            console.log(`✅ Created Politics Market: ${question}`);
            createdCount++;
          }
        }
      }
    } catch (e) {
      console.error("❌ [Cron] Error in GNews seeder:", e.response ? e.response.data : e.message);
    }
  }

  // 2. Fetch from NewsAPI (Specific Keywords)
  if (process.env.NEWSAPI_KEY) {
    try {
      console.log("📡 Fetching from NewsAPI...");
      const query = encodeURIComponent("India politics OR Election OR Parliament OR Prime Minister OR BJP OR Congress");
      const res = await axios.get(`https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=3&apiKey=${process.env.NEWSAPI_KEY.trim()}`);
      const articles = res.data.articles || [];

      for (const article of articles) {
        // Skip removed articles
        if (article.title === '[Removed]') continue;

        const question = `Policy shift imminent: "${article.title}"?`;
        
        const { data: existing } = await supabase
          .from('markets')
          .select('market_id')
          .eq('question', question)
          .single();
          
        if (!existing) {
          // Set end date to 14 days from now
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 14);

          const { error } = await supabase.from('markets').insert([{
            question: question,
            category: 'Politics',
            image_url: article.urlToImage || 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800',
            house_yes_points: BASE_LIQUIDITY / 2,
            house_no_points: BASE_LIQUIDITY / 2,
            status: 'Active',
            end_date: endDate.toISOString()
          }]);

          if (!error) {
            console.log(`✅ Created Politics Market: ${question}`);
            createdCount++;
          }
        }
      }
    } catch (e) {
      console.error("❌ [Cron] Error in NewsAPI seeder:", e.response ? e.response.data : e.message);
    }
  }

  console.log(`🏁 [Cron] Politics Seeder finished. Created ${createdCount} markets.`);
}

export { seedPoliticsMarkets as seedPoliticsMarkets };
