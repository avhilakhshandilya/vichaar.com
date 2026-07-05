require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');
const { supabase } = require('../utils/supabase');
const { seedPoliticsMarkets } = require('./politicsSeeder');
const { seedEconomicsMarkets } = require('./economicsSeeder');
const { seedIMFMarkets } = require('./imfSeeder');
const { seedFinanceMarkets } = require('./financeSeeder');
const { seedWikipediaMarkets } = require('./wikipediaSeeder');
const { seedSpaceMarkets } = require('./spaceSeeder');
const { seedCongressMarkets } = require('./congressSeeder');
const { seedWeatherMarkets } = require('./weatherSeeder');
const { seedIndiaGovMarkets } = require('./indiaGovSeeder');
const { updateMarketOdds } = require('./aiOddsUpdater');
const { seedGeminiTrendingMarkets } = require('./geminiTrendingSeeder');
const { seedNasaMarkets } = require('./nasaSeeder');
const { resolveExpiredMarkets } = require('./marketResolver');

// Base Liquidity to inject into each auto-created market
const BASE_LIQUIDITY = 10000; 

async function seedFootballMarkets() {
  console.log("⚽ [Cron] Starting Football Market Seeder...");

  if (!process.env.FOOTBALL_DATA_API_KEY) {
    console.error("❌ [Cron] FOOTBALL_DATA_API_KEY is missing.");
    return;
  }

  try {
    const response = await axios.get('https://api.football-data.org/v4/matches', {
      headers: {
        'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY.trim()
      }
    });

    const matches = response.data.matches || [];
    const upcomingMatches = matches.filter(m => m.status === 'SCHEDULED' || m.status === 'TIMED');
    const topGames = upcomingMatches.slice(0, 5);
    
    let createdCount = 0;

    for (const game of topGames) {
      if (!game.homeTeam || !game.awayTeam) continue;

      const groupId = `${game.homeTeam.name.replace(/[^a-zA-Z]/g, '')}-vs-${game.awayTeam.name.replace(/[^a-zA-Z]/g, '')}`;
      
      const options = [
        { name: `${game.homeTeam.name} Wins` },
        { name: `${game.awayTeam.name} Wins` },
        { name: `Draw` }
      ];

      for (const opt of options) {
        const question = `[GROUP:${groupId}] ${opt.name}`;
        
        const { data: existing } = await supabase
          .from('markets')
          .select('market_id')
          .eq('question', question)
          .single();
          
        if (existing) continue;

        const { error } = await supabase.from('markets').insert([{
          question: question,
          category: 'Football',
          image_url: game.competition?.emblem || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800',
          house_yes_points: Math.round(BASE_LIQUIDITY / 3),
          house_no_points: Math.round(BASE_LIQUIDITY - (BASE_LIQUIDITY / 3)),
          status: 'Active',
          end_date: game.utcDate
        }]);

        if (error) {
          console.error(`❌ Failed to insert market: ${question}`, error);
        } else {
          console.log(`✅ Created Football Market Option: ${question}`);
          createdCount++;
        }
      }
    }
    console.log(`🏁 [Cron] Football Group Seeder finished. Created ${createdCount} market options.`);
  } catch (error) {
    console.error("❌ [Cron] Error in football seeder:", error.response ? error.response.data : error.message);
  }
}

async function seedCricketMarkets() {
  console.log("🏏 [Cron] Starting Cricket Market Seeder...");

  if (!process.env.CRICKETDATA_API_KEY) {
    console.error("❌ [Cron] CRICKETDATA_API_KEY is missing.");
    return;
  }

  try {
    const response = await axios.get(`https://api.cricapi.com/v1/matches?apikey=${process.env.CRICKETDATA_API_KEY.trim()}&offset=0`);
    const matches = response.data.data || [];
    
    // Only grab upcoming matches
    const upcomingMatches = matches.filter(m => m.matchStarted === false && m.teams && m.teams.length === 2);
    const topGames = upcomingMatches.slice(0, 5);

    let createdCount = 0;

    for (const game of topGames) {
      const groupId = `${game.teams[0].replace(/[^a-zA-Z]/g, '')}-vs-${game.teams[1].replace(/[^a-zA-Z]/g, '')}`;
      
      const options = [
        { name: `${game.teams[0]} Wins` },
        { name: `${game.teams[1]} Wins` }
      ];

      for (const opt of options) {
        const question = `[GROUP:${groupId}] ${opt.name}`;
        
        const { data: existing } = await supabase
          .from('markets')
          .select('market_id')
          .eq('question', question)
          .single();
          
        if (existing) continue;

        // Try to get a team logo for the thumbnail
        let imageUrl = 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800';
        if (game.teamInfo && game.teamInfo.length > 0 && game.teamInfo[0].img) {
          imageUrl = game.teamInfo[0].img;
        }

        const { error } = await supabase.from('markets').insert([{
          question: question,
          category: 'Cricket',
          image_url: imageUrl,
          house_yes_points: BASE_LIQUIDITY / 2,
          house_no_points: BASE_LIQUIDITY / 2,
          status: 'Active',
          end_date: game.dateTimeGMT || game.date
        }]);

        if (error) {
          console.error(`❌ Failed to insert market: ${question}`, error);
        } else {
          console.log(`✅ Created Cricket Market Option: ${question}`);
          createdCount++;
        }
      }
    }
    console.log(`🏁 [Cron] Cricket Group Seeder finished. Created ${createdCount} market options.`);
  } catch (error) {
    console.error("❌ [Cron] Error in cricket seeder:", error.response ? error.response.data : error.message);
  }
}

async function seedAllMarkets() {
  await seedPoliticsMarkets();
  await seedEconomicsMarkets();
  await seedIMFMarkets();
  await seedFinanceMarkets();
  await seedWikipediaMarkets();
  await seedSpaceMarkets();
  await seedCongressMarkets();
  await seedWeatherMarkets();
  await seedIndiaGovMarkets();
  await seedGeminiTrendingMarkets();
  await seedNasaMarkets();
}

exports.startCronJobs = () => {
  // Run seeder every midnight
  cron.schedule('0 0 * * *', () => {
    seedAllMarkets();
  });
  console.log("⏰ Automated Market Seeder Cron Job scheduled for Midnight daily.");

  // Run AI Odds Updater every hour
  cron.schedule('0 * * * *', () => {
    updateMarketOdds();
  });
  console.log("⏰ Automated AI Odds Updater Cron Job scheduled for hourly execution.");

  // Run AI Market Resolver every 8 hours (3 times a day)
  cron.schedule('0 */8 * * *', () => {
    resolveExpiredMarkets();
  });
  console.log("⏰ Automated AI Market Resolver Cron Job scheduled for every 8 hours (3 times a day).");
};

exports.seedMarkets = seedAllMarkets;
