require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI, Type } = require('@google/genai');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function updateMarketOdds() {
  console.log("🤖 [AI Oracle] Starting Dynamic Odds Updater...");

  try {
    // 1. Fetch unresolved markets (pick a random sample to avoid hitting rate limits)
    const { data: markets, error } = await supabase
      .from('markets')
      .select('*')
      .eq('status', 'Active')
      .limit(10); // Update 10 markets per run

    if (error) throw error;
    if (!markets || markets.length === 0) {
      console.log("🤖 [AI Oracle] No active markets found.");
      return;
    }

    console.log(`🤖 [AI Oracle] Evaluating odds for ${markets.length} markets...`);

    // 2. Evaluate each market
    for (const market of markets) {
      let questionToEvaluate = market.question;
      if (market.question.startsWith("[GROUP:")) {
        const match = market.question.match(/\[GROUP:(.*?)\] (.*)/);
        if (match) {
           questionToEvaluate = `In the context of '${match[1].replace(/-/g, ' ')}', will this specific outcome occur/win: ${match[2]}?`;
        } else {
           questionToEvaluate = market.question;
        }
      }

      console.log(`\n🔍 Evaluating: "${questionToEvaluate}" (Original: ${market.question})`);
      
      const prompt = `
        You are an expert prediction market analyst.
        Evaluate the probability of the following event occurring.
        
        Event: "${questionToEvaluate}"
        Category: ${market.category}
        End Date: ${market.end_date}

        Provide a realistic probability estimate (between 1 and 99). 
        Think step-by-step, considering real-world events, current trends, and baseline base rates.
        Then, output the final probability.
      `;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                reasoning: {
                  type: Type.STRING,
                  description: "Your brief analysis and reasoning for this probability."
                },
                probability: {
                  type: Type.INTEGER,
                  description: "The estimated probability as an integer between 1 and 99."
                }
              },
              required: ["reasoning", "probability"]
            }
          }
        });

        const result = JSON.parse(response.text);
        const targetProb = Math.max(1, Math.min(99, result.probability));
        
        console.log(`🧠 AI Reasoning: ${result.reasoning}`);
        console.log(`📊 AI Target Probability: ${targetProb}%`);

        // 3. Adjust Liquidity to match target probability
        // Probability = Yes / (Yes + No)
        // We will inject a total of 10000 points of liquidity, distributed according to the target probability.
        // E.g., if target = 75%, Yes = 7500, No = 2500.
        // We will blend this with the current house points to create a smooth transition.

        const newHouseYes = Math.floor(10000 * (targetProb / 100));
        const newHouseNo = 10000 - newHouseYes;

        // Smooth update: blend 50% old with 50% new
        const finalYes = Math.floor((market.house_yes_points + newHouseYes) / 2);
        const finalNo = Math.floor((market.house_no_points + newHouseNo) / 2);

        const currentProb = Math.round((market.house_yes_points / (market.house_yes_points + market.house_no_points)) * 100);
        const newProb = Math.round((finalYes / (finalYes + finalNo)) * 100);

        console.log(`📈 Shifted Odds: ${currentProb}% -> ${newProb}% (Yes: ${finalYes}, No: ${finalNo})`);

        // 4. Update the database
        const { error: updateError } = await supabase
          .from('markets')
          .update({
            house_yes_points: finalYes,
            house_no_points: finalNo
          })
          .eq('market_id', market.market_id);

        if (updateError) {
          console.error(`❌ Failed to update market ${market.market_id}:`, updateError.message);
        } else {
          console.log(`✅ Successfully updated market ${market.market_id}`);
        }

      } catch (aiError) {
        console.error(`❌ AI Error for market "${market.question}":`, aiError.message);
      }

      // 4-second delay to respect free tier rate limits (15 RPM)
      await new Promise(resolve => setTimeout(resolve, 4000));
    }

    console.log("\n🏁 [AI Oracle] Odds update complete.");

  } catch (error) {
    console.error("❌ Error in odds updater:", error);
  }
}

// Export for main cron runner
module.exports = { updateMarketOdds };

// Allow direct execution
if (require.main === module) {
  updateMarketOdds().then(() => process.exit(0));
}
