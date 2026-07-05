require('dotenv').config();
const { supabase } = require('./utils/supabase');

function algorithmicShorten(q) {
  let short = q;
  if (q.startsWith("Will ")) short = q.substring(5);
  if (q.startsWith("Is ")) short = q.substring(3);
  if (q.startsWith("Expect ")) short = q.substring(7);

  // Weather rules
  if (q.includes("forecast to reach a maximum temperature above")) {
    const parts = q.split(" forecast to reach a maximum temperature above ");
    const city = parts[0].replace("Is ", "");
    const tempAndDate = parts[1].split(" on ");
    return `Will ${city} exceed ${tempAndDate[0]} on ${tempAndDate[1].replace("?", "")}?`;
  }
  if (q.includes("receive more than")) {
    const parts = q.split(" to receive more than ");
    const city = parts[0].replace("Expect ", "");
    const rainAndDate = parts[1].split(" of precipitation on ");
    return `Will ${city} get ${rainAndDate[0]} rain on ${rainAndDate[1].replace("?", "")}?`;
  }

  // Asteroid rule
  if (q.includes("Asteroid ") && q.includes("passes within")) {
    const ast = q.split(" passes within")[0];
    return `${ast} safely pass Earth?`;
  }

  // Fallback: take first 7 words and add "..."
  const words = short.split(" ");
  if (words.length > 8) {
    return words.slice(0, 8).join(" ") + "...?";
  }
  return short;
}

async function migrateDescriptionsAlgorithmically() {
  console.log('🔄 Migrating existing long questions algorithmically...');

  const { data: markets, error } = await supabase
    .from('markets')
    .select('market_id, question, description')
    .eq('status', 'Active');

  if (error) { console.error('❌ Fetch error:', error); return; }

  let count = 0;
  for (const market of markets) {
    // If it already has a description, skip
    if (market.description) {
      continue;
    }

    const shortQuestion = algorithmicShorten(market.question);

    const { error: updateError } = await supabase
      .from('markets')
      .update({ 
        question: shortQuestion, 
        description: market.question 
      })
      .eq('market_id', market.market_id);

    if (!updateError) {
      console.log(`✅ ${shortQuestion}`);
      count++;
    } else {
      console.error(`❌ DB Error:`, updateError.message);
    }
  }

  console.log(`\n🏁 Done! Migrated ${count} markets.`);
}

migrateDescriptionsAlgorithmically();
