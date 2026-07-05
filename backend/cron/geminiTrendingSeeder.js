require('dotenv').config();
const axios = require('axios');
const { supabase } = require('../utils/supabase');
const { GoogleGenAI } = require('@google/genai');
const { getImageForQuestion } = require('../utils/imageHelper');

const BASE_LIQUIDITY = 10000;

async function seedGeminiTrendingMarkets() {
  console.log("🚀 [Cron] Starting Gemini Trending Market Seeder...");

  if (!process.env.GEMINI_API_KEY || !process.env.GNEWS_API_KEY) {
    console.error("❌ [Cron] GEMINI_API_KEY or GNEWS_API_KEY is missing.");
    return;
  }

  let createdCount = 0;

  try {
    // 1. Fetch top world news headlines
    console.log("📡 Fetching global and Indian headlines from GNews...");
    const [globalRes, indiaRes] = await Promise.all([
      axios.get(`https://gnews.io/api/v4/top-headlines?category=world&lang=en&max=4&apikey=${process.env.GNEWS_API_KEY.trim()}`),
      axios.get(`https://gnews.io/api/v4/top-headlines?category=general&lang=en&country=in&max=4&apikey=${process.env.GNEWS_API_KEY.trim()}`)
    ]);
    
    const globalArticles = globalRes.data.articles || [];
    const indiaArticles = indiaRes.data.articles || [];
    
    // Combine and remove exact duplicates by title if any
    const allArticles = [...globalArticles, ...indiaArticles];
    const uniqueArticlesMap = new Map();
    allArticles.forEach(a => uniqueArticlesMap.set(a.title, a));
    const articles = Array.from(uniqueArticlesMap.values());
    
    if (articles.length === 0) {
      console.log("No articles found.");
      return;
    }

    const newsSummary = articles.map(a => `- ${a.title}`).join("\n");
    console.log("📰 Headlines to process:\n" + newsSummary);

    // 2. Ask Gemini to generate markets
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
You are a Prediction Market Maker. I will give you a list of breaking news headlines.
Your job is to generate exactly 5 interesting Yes/No prediction market questions based on these topics.

Headlines:
${newsSummary}

Guidelines for questions:
- Keep questions SHORT and punchy — ideally under 10 words. Think tweet-length.
- Use a diverse range of sentence structures. DO NOT always start with "Will". Try using formats like "[Topic] happens by [Date]?", "[Person/Country] does X?", "[Event] confirmed this week?".
- Frame them objectively so they can be definitively resolved with YES or NO.
- The category must be one of: Trending, Politics, Finance, Science, Economics, Culture, Elections.
- Provide a single word 'image_keyword' for a relevant Unsplash thumbnail.

Return a JSON array of objects exactly in this format, with no markdown formatting or backticks around it:
[
  {
    "question": "Will X happen?",
    "category": "Trending",
    "image_keyword": "politics"
  }
]
`;

    console.log("🧠 Asking Gemini to generate markets...");
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    const text = response.text.trim();
    
    // Parse JSON
    let marketsToCreate = [];
    try {
      // Remove any markdown formatting if present
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      marketsToCreate = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error("❌ Failed to parse Gemini response:", text);
      return;
    }

    // 3. Insert into Database
    for (const m of marketsToCreate) {
      const { data: existing } = await supabase
        .from('markets')
        .select('market_id')
        .eq('question', m.question)
        .single();
        
      if (!existing) {
        // Set end date to roughly 3 weeks from now
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 21);
        
        const { error } = await supabase.from('markets').insert([{
          question: m.question,
          description: m.description,
          category: 'Politics', // Hardcoded to bypass DB constraint markets_category_check
          image_url: getImageForQuestion(m.question),
          house_yes_points: BASE_LIQUIDITY / 2,
          house_no_points: BASE_LIQUIDITY / 2,
          status: 'Active',
          end_date: endDate.toISOString()
        }]);

        if (!error) {
          console.log(`✅ Created Gemini Market: ${m.question}`);
          createdCount++;
        } else {
          console.error(`❌ DB Insert failed for: ${m.question}`, error);
        }
      }
    }
    
    console.log(`🏁 [Cron] Gemini Seeder finished. Created ${createdCount} markets.`);

  } catch (error) {
    console.error("❌ [Cron] Error in Gemini seeder:", error);
  }
}

exports.seedGeminiTrendingMarkets = seedGeminiTrendingMarkets;

// For manual execution testing
if (require.main === module) {
  seedGeminiTrendingMarkets();
}
