require('dotenv').config();
const axios = require('axios');
const { supabase } = require('../utils/supabase');

async function askGroq(prompt) {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");
  const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
    model: 'llama-3.1-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data.choices[0].message.content;
}

async function askOpenRouter(prompt) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY missing");
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: 'perplexity/llama-3.1-sonar-large-128k-online', // Excellent for searching the web
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'http://localhost:5173', 
      'X-Title': 'Vichaar',
      'Content-Type': 'application/json'
    }
  });
  return response.data.choices[0].message.content;
}

async function resolveExpiredMarkets() {
  console.log("🤖 [Cron] Starting Automated AI Market Resolver (Groq/OpenRouter)...");

  if (!process.env.GROQ_API_KEY && !process.env.OPENROUTER_API_KEY) {
    console.error("❌ [Cron] Both GROQ_API_KEY and OPENROUTER_API_KEY are missing. Cannot resolve markets.");
    return;
  }

  try {
    const now = new Date().toISOString();
    
    // 1. Fetch expired active markets
    const { data: expiredMarkets, error } = await supabase
      .from('markets')
      .select('market_id, question, description, end_date')
      .eq('status', 'Active')
      .lt('end_date', now);

    if (error) throw error;

    if (!expiredMarkets || expiredMarkets.length === 0) {
      console.log("✅ No expired markets need resolution right now.");
      return;
    }

    console.log(`🔍 Found ${expiredMarkets.length} expired markets. Asking AI to resolve...`);
    let resolvedCount = 0;

    // 2. Process each market individually
    for (const market of expiredMarkets) {
      try {
        const prompt = `
You are an automated prediction market resolution oracle.
You have access to facts to check real-time events.
Please resolve the following prediction market that has just ended.

Market Question: "${market.question}"
Market Description: "${market.description}"
End Date: ${market.end_date}

Instructions:
- Determine if this event definitively occurred or the condition was met by the end date.
- If the event occurred and the condition was met, the outcome is "YES".
- If the event definitively did NOT occur, or the condition failed, the outcome is "NO".
- If the outcome is still ambiguous, the event hasn't finished, or you cannot find reliable proof, the outcome is "UNRESOLVED".

Return ONLY a JSON object in this format (no markdown, no backticks, no other text):
{
  "outcome": "YES" | "NO" | "UNRESOLVED",
  "reason": "Short explanation of why you chose this outcome."
}
`;

        console.log(`\n🧠 Resolving Market ID ${market.market_id}: "${market.question}"`);
        
        let text = "";
        let result = null;

        try {
           console.log(`   ⚡ Asking Groq (Llama 3.1 70B)...`);
           text = await askGroq(prompt);
           let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
           // Find the first { and last } in case of extra text
           const startIdx = cleanText.indexOf('{');
           const endIdx = cleanText.lastIndexOf('}');
           if (startIdx !== -1 && endIdx !== -1) {
             cleanText = cleanText.substring(startIdx, endIdx + 1);
           }
           result = JSON.parse(cleanText);
           
           if (!result.outcome || result.outcome === 'UNRESOLVED') {
               throw new Error("Groq returned UNRESOLVED or invalid output");
           }
        } catch (groqErr) {
           console.log(`   ⚠️ Groq couldn't resolve definitively (${groqErr.message}). Falling back to OpenRouter (Perplexity Sonar Online)...`);
           try {
               text = await askOpenRouter(prompt);
               let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
               const startIdx = cleanText.indexOf('{');
               const endIdx = cleanText.lastIndexOf('}');
               if (startIdx !== -1 && endIdx !== -1) {
                 cleanText = cleanText.substring(startIdx, endIdx + 1);
               }
               result = JSON.parse(cleanText);
           } catch (orErr) {
               console.error(`   ❌ OpenRouter also failed:`, orErr.message);
               result = { outcome: "UNRESOLVED", reason: "All AI providers failed." };
           }
        }

        console.log(`   Outcome: ${result?.outcome}`);
        console.log(`   Reason: ${result?.reason}`);

        if (result && (result.outcome === 'YES' || result.outcome === 'NO')) {
          console.log(`   ➡️ Triggering payout for ${result.outcome}...`);
          
          // Hit the local API to execute resolution
          const resolveRes = await axios.post(`http://localhost:${process.env.PORT || 5000}/api/markets/resolve`, {
            market_id: market.market_id,
            winning_outcome: result.outcome
          });

          if (resolveRes.data.success) {
             console.log(`   ✅ Successfully resolved and paid out!`);
             resolvedCount++;
          } else {
             console.error(`   ❌ Failed to resolve via API:`, resolveRes.data.message);
          }
        } else {
          console.log(`   ⏭️ Skipping market. AI could not confidently resolve it.`);
        }

      } catch (marketErr) {
        console.error(`   ❌ Error resolving market ${market.market_id}:`, marketErr.message);
      }
    }

    console.log(`\n🏁 [Cron] AI Market Resolver finished. Successfully resolved ${resolvedCount}/${expiredMarkets.length} markets.`);

  } catch (error) {
    console.error("❌ [Cron] Error in AI Market Resolver:", error.message);
  }
}

module.exports = { resolveExpiredMarkets };

// For manual testing
if (require.main === module) {
  resolveExpiredMarkets();
}
