import { supabase } from '../utils/supabase.js';

export async function seedBreakingMarkets() {
  console.log("🚀 [Cron] Starting Breaking News Seeder (Perplexity Sonar)...");

  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      throw new Error("Missing OPENROUTER_API_KEY");
    }

    const prompt = `You are a prediction market creator with live internet access. 
Search for the top 3 biggest breaking news stories in India right now (politics, business, crypto, law, etc). 
Generate a binary (Yes/No) prediction market question for each that will resolve within the next 3 to 7 days.
Prefix each question exactly with "[Breaking] ".
The description should give brief context about why this is breaking news.
The end_date must be in ISO format (YYYY-MM-DDTHH:MM:SSZ) and be between 3 and 7 days from now.
Respond ONLY with a valid JSON array. No markdown, no introductory text.
Format exactly like this:
[
  {
    "question": "[Breaking] Will the Supreme Court grant bail to [Person] by Friday?",
    "description": "Context about the breaking news...",
    "end_date": "2024-11-20T23:59:59Z"
  }
]`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "perplexity/sonar",
        messages: [
          { role: "system", content: "You are a JSON-only bot. Only output valid JSON arrays. Do not wrap in markdown blocks." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content.trim();
    
    // Strip markdown formatting if Perplexity ignores the system prompt
    if (content.startsWith("```json")) content = content.slice(7);
    if (content.startsWith("```")) content = content.slice(3);
    if (content.endsWith("```")) content = content.slice(0, -3);
    content = content.trim();

    let markets;
    try {
      markets = JSON.parse(content);
    } catch (err) {
      console.error("❌ Failed to parse JSON from Perplexity:", content);
      return;
    }

    let insertedCount = 0;
    for (const m of markets) {
      // Validate date
      const endDate = new Date(m.end_date);
      if (isNaN(endDate.getTime()) || endDate < new Date()) {
        console.warn("Skipping market with invalid or past end_date:", m.question);
        continue;
      }

      // Ensure prefix
      let question = m.question;
      if (!question.startsWith("[Breaking]")) {
        question = "[Breaking] " + question;
      }

      const { error } = await supabase.from('markets').insert({
        question: question,
        description: m.description,
        category: 'Politics',
        end_date: m.end_date,
        image_url: `https://ui-avatars.com/api/?name=Breaking&background=random&color=fff`,
        status: 'Active',
        house_yes_points: 0,
        house_no_points: 0,
        created_at: new Date().toISOString()
      });

      if (error) {
        console.error("❌ Failed to insert market:", question, error);
      } else {
        insertedCount++;
        console.log(`✅ Created breaking market: ${question}`);
      }
    }

    console.log(`🏁 [Cron] Breaking News Seeder finished. Created ${insertedCount} markets.`);

  } catch (error) {
    console.error("❌ Breaking News Seeder error:", error.message);
  }
}
