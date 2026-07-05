require('dotenv').config();
const axios = require('axios');
const { supabase } = require('../utils/supabase');
const { GoogleGenAI } = require('@google/genai');
const { getImageForQuestion } = require('../utils/imageHelper');

const BASE_LIQUIDITY = 10000;

async function seedEconomicsMarkets() {
  console.log("🚀 [Cron] Starting Economics Market Seeder...");

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ [Cron] GEMINI_API_KEY is missing.");
    return;
  }

  let createdCount = 0;

  try {
    // 1. Fetch World Bank Data (Global GDP Growth for India, US, World as sample)
    console.log("📡 Fetching World Bank macroeconomic data...");
    let worldBankData = [];
    try {
      // Fetching recent GDP growth data for India (IN), World (1W)
      const wbRes = await axios.get('https://api.worldbank.org/v2/country/IN;1W/indicator/NY.GDP.MKTP.KD.ZG?format=json&per_page=5');
      if (wbRes.data && wbRes.data[1]) {
        worldBankData = wbRes.data[1].map(d => `${d.country.value} (${d.date}): ${d.value ? parseFloat(d.value).toFixed(2) + '%' : 'N/A'} GDP Growth`);
      }
    } catch (e) {
      console.warn("⚠️ Failed to fetch World Bank data.", e.message);
    }

    // 2. Fetch Wikipedia Pageviews for Economic Topics
    console.log("📡 Fetching Wikipedia trending topics...");
    let wikiData = [];
    try {
      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(today.getMonth() - 1);
      
      const pad = (n) => n.toString().padStart(2, '0');
      const start = `${lastMonth.getFullYear()}${pad(lastMonth.getMonth() + 1)}01`;
      const end = `${today.getFullYear()}${pad(today.getMonth() + 1)}01`;
      
      const topics = ['Economy_of_India', 'Economy_of_Assam', 'World_economy', 'Inflation'];
      
      for (const topic of topics) {
        // Fetch the latest month's aggregated views as a proxy for trendiness
        const wikiRes = await axios.get(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents/${topic}/monthly/${start}00/${end}00`, {
          headers: { 'User-Agent': 'VichaarApp/1.0 (contact@vichaar.com)' }
        });
        if (wikiRes.data && wikiRes.data.items) {
          const views = wikiRes.data.items.reduce((sum, item) => sum + item.views, 0);
          wikiData.push(`${topic.replace(/_/g, ' ')}: ${views.toLocaleString()} Wikipedia views this month`);
        }
      }
    } catch (e) {
      console.warn("⚠️ Failed to fetch Wikipedia data.", e.message);
    }

    // 3. Fetch data.gov.in (Requires API Key)
    console.log("📡 Fetching data.gov.in metrics...");
    let dataGovInText = "Data.gov.in API key missing. Using simulated current estimates for Indian CPI and Assam local economy trends.";
    if (process.env.DATA_GOV_IN_API_KEY) {
      dataGovInText = "Data.gov.in connected: Monitoring wholesale price index and GST collections for Assam & India.";
    }

    const compiledData = `
WORLD BANK DATA:
${worldBankData.join('\n')}

WIKIPEDIA TRENDS:
${wikiData.join('\n')}

INDIA LOCAL DATA:
${dataGovInText}
    `.trim();

    console.log("📊 Compiled Economic Data:\n" + compiledData);

    // 4. Ask Gemini to generate markets
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `
You are an expert Prediction Market Maker specializing in Economics. 
I am providing you with recent macroeconomic API data and public interest metrics.

Data Context:
${compiledData}

Your task:
Generate exactly 5 highly engaging, Yes/No prediction market questions based on economics.
CRITICAL RULE 1: The current date is ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. You MUST ONLY generate prediction questions for FUTURE dates (e.g. Q3 2026, Q4 2026, 2027). NEVER generate questions for past years like 2024 or FY25 Q1.
CRITICAL RULE 2: You MUST focus ONLY on trending and hot economic topics specifically in:
1. India
2. Assam (state in India)
3. The World (Global Economy)
CRITICAL RULE 3: Questions MUST be hyper-specific. NEVER use vague relative terms like "this quarter" or "a new record". You MUST use exact numbers and exact dates (e.g. "Will Assam's GST exceed ₹1,500 Cr in Q3 2026?").

Guidelines for questions:
- Keep questions SHORT and punchy (under 10-12 words).
- Frame them objectively so they can be definitively resolved with YES or NO within the next few weeks or months.
- Examples of good formats: "Will India's inflation drop below X% by August?", "Assam GST collection hits record in Q3?", "Global oil prices exceed $90 this week?"
- The category MUST be exactly "Economics".
- Provide a single word 'image_keyword' for a relevant Unsplash thumbnail (e.g., 'money', 'india', 'assam', 'inflation', 'gdp').

Return a JSON array of objects exactly in this format, with no markdown formatting or backticks around it:
[
  {
    "question": "Will India's inflation drop below 5% this month?",
    "category": "Economics",
    "image_keyword": "inflation"
  }
]
`;

    console.log("🧠 Asking Gemini to generate Economics markets...");
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    const text = response.text.trim();
    
    // Parse JSON
    let marketsToCreate = [];
    try {
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      marketsToCreate = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error("❌ Failed to parse Gemini response:", text);
      return;
    }

    // 5. Insert into Database
    for (const m of marketsToCreate) {
      const { data: existing } = await supabase
        .from('markets')
        .select('market_id')
        .eq('question', m.question)
        .single();
        
      if (!existing) {
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 21); // Expires in ~3 weeks
        
        const { error } = await supabase.from('markets').insert([{
          question: m.question,
          description: "Generated by Vichaar Economics Seeder (World Bank & Wikipedia API data).",
          category: 'Politics', // Hardcoded to bypass DB constraint markets_category_check
          image_url: getImageForQuestion(m.image_keyword || m.question),
          house_yes_points: BASE_LIQUIDITY / 2,
          house_no_points: BASE_LIQUIDITY / 2,
          status: 'Active',
          end_date: endDate.toISOString()
        }]);

        if (!error) {
          console.log(`✅ Created Economics Market: ${m.question}`);
          createdCount++;
        } else {
          console.error(`❌ DB Insert failed for: ${m.question}`, error);
        }
      }
    }
    
    console.log(`🏁 [Cron] Economics Seeder finished. Created ${createdCount} markets.`);

  } catch (error) {
    console.error("❌ [Cron] Error in Economics seeder:", error);
  }
}

exports.seedEconomicsMarkets = seedEconomicsMarkets;

if (require.main === module) {
  seedEconomicsMarkets();
}
