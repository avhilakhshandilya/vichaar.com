const axios = require('axios');
const { supabase } = require('../utils/supabase');
const { getImageForQuestion, IMAGES } = require('../utils/imageHelper');

const BASE_LIQUIDITY = 10000;
const NASA_KEY = process.env.NASA_API_KEY || 'DEMO_KEY';

async function seedNasaMarkets() {
  console.log("🚀 [Cron] Starting NASA Market Seeder...");

  let createdCount = 0;
  const endDate3Weeks = new Date();
  endDate3Weeks.setDate(endDate3Weeks.getDate() + 21);

  // ── 1. Near Earth Objects (Asteroids) ─────────────────────────────────────
  try {
    console.log("☄️ Fetching Near Earth Objects from NASA NeoWs...");
    const today = new Date().toISOString().slice(0, 10);
    const sevenDays = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const neoRes = await axios.get(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${sevenDays}&api_key=${NASA_KEY}`
    );

    const neoData = neoRes.data.near_earth_objects || {};
    const allNeos = Object.values(neoData).flat();

    // Filter: potentially hazardous asteroids only, sorted by closest approach
    const hazardous = allNeos
      .filter(n => n.is_potentially_hazardous_asteroid)
      .sort((a, b) => {
        const distA = parseFloat(a.close_approach_data[0]?.miss_distance?.lunar || '999');
        const distB = parseFloat(b.close_approach_data[0]?.miss_distance?.lunar || '999');
        return distA - distB;
      })
      .slice(0, 4);

    for (const neo of hazardous) {
      const approach = neo.close_approach_data[0];
      if (!approach) continue;
      const lunarDist = parseFloat(approach.miss_distance.lunar).toFixed(1);
      const approachDate = new Date(approach.close_approach_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const diameterKm = (
        (neo.estimated_diameter.kilometers.estimated_diameter_min +
          neo.estimated_diameter.kilometers.estimated_diameter_max) / 2
      ).toFixed(2);

      const question = `Asteroid ${neo.name} passes within ${lunarDist} lunar distances on ${approachDate}?`;

      const { data: existing } = await supabase.from('markets').select('market_id').eq('question', question).single();
      if (!existing) {
        const endDate = new Date(approach.close_approach_date);
        endDate.setDate(endDate.getDate() + 1);

        const { error } = await supabase.from('markets').insert([{
          question,
          category: 'Politics',
          image_url: getImageForQuestion(question),
          house_yes_points: BASE_LIQUIDITY / 2,
          house_no_points: BASE_LIQUIDITY / 2,
          status: 'Active',
          end_date: endDate.toISOString()
        }]);
        if (!error) { console.log(`✅ NASA Neo Market: ${question}`); createdCount++; }
      }
    }
  } catch (err) {
    console.error("❌ NASA NeoWs error:", err.message);
  }

  // ── 2. EONET – Live Natural Events (Storms, Wildfires, etc.) ──────────────
  try {
    console.log("🌪️ Fetching EONET natural events...");
    const eonetRes = await axios.get(
      `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=10&api_key=${NASA_KEY}`
    );

    const events = eonetRes.data.events || [];

    // Focus on dramatic, resolvable event types
    const INTERESTING_TYPES = ['Severe Storms', 'Wildfires', 'Volcanoes', 'Floods', 'Dust and Haze'];
    const filtered = events.filter(e =>
      e.categories?.some(c => INTERESTING_TYPES.includes(c.title))
    ).slice(0, 4);

    for (const event of filtered) {
      const category = event.categories?.[0]?.title || 'Natural Event';
      const question = `${event.title} — contained within 2 weeks?`;

      const { data: existing } = await supabase.from('markets').select('market_id').eq('question', question).single();
      if (!existing) {
        const { error } = await supabase.from('markets').insert([{
          question,
          category: 'Politics',
          image_url: getImageForQuestion(question),
          house_yes_points: BASE_LIQUIDITY / 2,
          house_no_points: BASE_LIQUIDITY / 2,
          status: 'Active',
          end_date: endDate3Weeks.toISOString()
        }]);
        if (!error) { console.log(`✅ NASA EONET Market: ${question}`); createdCount++; }
      }
    }
  } catch (err) {
    console.error("❌ NASA EONET error:", err.message);
  }

  // ── 3. DONKI – Space Weather (Solar Flares, CME, Geomagnetic Storms) ──────
  try {
    console.log("☀️ Fetching space weather from NASA DONKI...");
    const startDate = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const endDateStr = new Date().toISOString().slice(0, 10);

    const [flareRes, cmeRes] = await Promise.all([
      axios.get(`https://api.nasa.gov/DONKI/FLR?startDate=${startDate}&endDate=${endDateStr}&api_key=${NASA_KEY}`),
      axios.get(`https://api.nasa.gov/DONKI/CME?startDate=${startDate}&endDate=${endDateStr}&api_key=${NASA_KEY}`)
    ]);

    const flares = flareRes.data || [];
    const cmes = cmeRes.data || [];

    // Solar Flare market
    if (flares.length > 0) {
      const latestFlare = flares[flares.length - 1];
      const flareClass = latestFlare.classType || 'X-class';
      const question = `Another ${flareClass} solar flare erupts this week?`;

      const { data: existing } = await supabase.from('markets').select('market_id').eq('question', question).single();
      if (!existing) {
        const { error } = await supabase.from('markets').insert([{
          question,
          description: `This market resolves to Yes if NASA's DONKI database records a ${flareClass} solar flare event occurring before the end of the year ${endOfYear.substring(0, 4)}.`,
          category: 'Politics',
          image_url: IMAGES.solar,
          house_yes_points: BASE_LIQUIDITY / 2,
          house_no_points: BASE_LIQUIDITY / 2,
          status: 'Active',
          end_date: endOfYear
        }]);
        if (!error) { console.log(`✅ NASA DONKI Solar Flare Market: ${question}`); createdCount++; }
      }
    }

    // CME market
    if (cmes.length > 0) {
      const question = `A Coronal Mass Ejection causes geomagnetic storm this week?`;

      const { data: existing } = await supabase.from('markets').select('market_id').eq('question', question).single();
      if (!existing) {
        const { error } = await supabase.from('markets').insert([{
          question,
          description: `This market resolves to Yes if NASA's DONKI database confirms a Coronal Mass Ejection (CME) impacts Earth before the end of the year ${endOfYear.substring(0, 4)}.`,
          category: 'Politics',
          image_url: IMAGES.aurora,
          house_yes_points: BASE_LIQUIDITY / 2,
          house_no_points: BASE_LIQUIDITY / 2,
          status: 'Active',
          end_date: endOfYear
        }]);
        if (!error) { console.log(`✅ NASA DONKI CME Market: ${question}`); createdCount++; }
      }
    }
  } catch (err) {
    console.error("❌ NASA DONKI error:", err.message);
  }

  console.log(`🏁 [Cron] NASA Seeder finished. Created ${createdCount} markets.`);
}

module.exports = { seedNasaMarkets };

// Manual run
if (require.main === module) {
  seedNasaMarkets();
}
