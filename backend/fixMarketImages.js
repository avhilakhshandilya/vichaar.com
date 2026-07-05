const { supabase } = require('./utils/supabase');
const { getImageForQuestion } = require('./utils/imageHelper');

async function fixAllMarketImages() {
  console.log('🖼️  Fixing ALL market images in DB...');

  const { data: markets, error } = await supabase
    .from('markets')
    .select('market_id, question, image_url')
    .eq('status', 'Active');

  if (error) { console.error('❌ Fetch error:', error); return; }
  console.log(`Found ${markets.length} active markets.`);

  let updated = 0;
  for (const market of markets) {
    const url = market.image_url || '';
    
    // source.unsplash.com is deprecated. We only want images.unsplash.com
    const needsUpdate = !url.startsWith('https://images.unsplash.com/');

    if (needsUpdate) {
      const newImage = getImageForQuestion(market.question);
      const { error: updateError } = await supabase
        .from('markets')
        .update({ image_url: newImage })
        .eq('market_id', market.market_id);

      if (!updateError) {
        console.log(`✅ ${market.question.substring(0, 70)}`);
        updated++;
      } else {
        console.error(`❌ ${market.market_id}:`, updateError.message);
      }
    }
  }

  console.log(`\n🏁 Done! Updated ${updated} / ${markets.length} markets.`);
}

fixAllMarketImages();
