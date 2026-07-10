import { supabase } from '../utils/supabase.js';
import axios from 'axios';
import Groq from 'groq-sdk';

export async function seedBreakingMarkets() {
  console.log("🚀 [Cron] Starting Breaking News Seeder (Groq + GNews)...");

  try {
    const groqKey = process.env.GROQ_API_KEY;
    const gnewsKey = process.env.GNEWS_API_KEY;
    
    if (!groqKey || !gnewsKey) {
      throw new Error("Missing GROQ_API_KEY or GNEWS_API_KEY");
    }

    // 1. Fetch Live Breaking News for India
    console.log("📡 Fetching live breaking news from GNews...");
    const gnewsRes = await axios.get(`https://gnews.io/api/v4/top-headlines?category=breaking-news&country=in&lang=en&max=10&apikey=${gnewsKey.trim()}`);
    
    const articles = gnewsRes.data.articles || [];
    if (articles.length === 0) {
      console.log("No breaking news found at this moment.");
      return;
    }

    const newsSummary = articles.map(a => `- ${a.title}: ${a.description}`).join("\n");
    
    // 2. Pass to Groq (Llama 3.3 70B) to generate markets
    const groq = new Groq({ apiKey: groqKey });
    
    const prompt = `You are a prediction market creator. I will provide you with the latest breaking news headlines and summaries from India.
Read them and generate the top 2 most interesting prediction market topics that will resolve in the near future.
For each topic, you must generate exactly 2 resolution dates (e.g. "By Friday", "By End of Month", or "By Oct 2026", "By Dec 2026").
Prefix the title exactly with "[GROUP:breaking-" followed by a COMPLETE SENTENCE QUESTION asking what will happen, ending with a closing bracket "] ".
IMPORTANT: DO NOT start every question with the word "Will". Vary your phrasing! Use different structures like "Is the government planning to...", "Could the Supreme Court...", "What are the chances that...", "Is a ban imminent for...", etc.
Example Title: "[GROUP:breaking-Is the Supreme Court likely to grant bail to the Chief Minister?] "
The description should give brief context about why this is breaking news.
Also provide a short image_keyword (1-2 words) for each topic that represents it visually (e.g. "parliament", "bitcoin", "temple", "court").
Respond ONLY with a valid JSON array. No markdown, no introductory text.

Headlines:
${newsSummary}

Format exactly like this:
[
  {
    "title": "[GROUP:breaking-Is the Supreme Court likely to grant bail to the Chief Minister?] ",
    "description": "Context about the breaking news...",
    "image_keyword": "supreme court",
    "options": [
      { "name": "By Friday", "end_date": "2026-10-20T23:59:59Z" },
      { "name": "By End of Month", "end_date": "2026-10-31T23:59:59Z" }
    ]
  }
]`;

    console.log("🧠 Asking Groq to generate grouped breaking markets...");
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
    });

    let content = chatCompletion.choices[0]?.message?.content || "";
    
    // Strip markdown formatting
    if (content.startsWith("```json")) content = content.slice(7);
    if (content.startsWith("```")) content = content.slice(3);
    if (content.endsWith("```")) content = content.slice(0, -3);
    content = content.trim();

    let markets;
    try {
      markets = JSON.parse(content);
    } catch (err) {
      console.error("❌ Failed to parse JSON from Groq:", content);
      return;
    }

    let insertedCount = 0;
    for (const group of markets) {
      let title = group.title;
      if (!title.startsWith("[GROUP:breaking-")) {
        // Fallback safety if Groq forgets the exact format
        title = `[GROUP:breaking-${Date.now()}] `;
      }

      for (const opt of (group.options || [])) {
        // Validate date
        const endDate = new Date(opt.end_date);
        if (isNaN(endDate.getTime()) || endDate < new Date()) {
          console.warn("Skipping option with invalid or past end_date:", opt.name);
          continue;
        }

        const fullQuestion = `${title.trim()} ${opt.name}`;

        // Check if already exists to prevent duplicates
        const { data: existing } = await supabase.from('markets').select('market_id').eq('question', fullQuestion).single();
        if (existing) continue;

        const { error } = await supabase.from('markets').insert({
          question: fullQuestion,
          description: group.description,
          category: 'Politics', // Map to Politics for DB constraint, frontend overrides to Breaking
          end_date: opt.end_date,
          image_url: group.image_keyword
            ? `https://source.unsplash.com/400x200/?${encodeURIComponent(group.image_keyword)}`
            : `https://source.unsplash.com/400x200/?breaking+news+india`,
          status: 'Active',
          house_yes_points: 50,
          house_no_points: 50,
          
          
          created_at: new Date().toISOString()
        });

        if (error) {
          console.error("❌ Failed to insert grouped market:", fullQuestion, error);
        } else {
          insertedCount++;
          console.log(`✅ Created breaking group option: ${fullQuestion}`);
        }
      }
    }

    console.log(`🏁 [Cron] Breaking News Seeder finished. Created ${insertedCount} grouped markets.`);

  } catch (error) {
    console.error("❌ Breaking News Seeder error:", error.message);
  }
}
