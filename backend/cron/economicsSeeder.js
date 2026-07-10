import axios from "axios";
import { supabase } from "../utils/supabase.js";
import { getImageForQuestion, IMAGES } from "../utils/imageHelper.js";

const BASE_LIQUIDITY = 50;

// Top economies matching World Bank seeder
const COUNTRIES = [
  { code: 'US', name: 'United States', flag: 'https://flagcdn.com/w320/us.png' },
  { code: 'CN', name: 'China', flag: 'https://flagcdn.com/w320/cn.png' },
  { code: 'IN', name: 'India', flag: 'https://flagcdn.com/w320/in.png' },
  { code: 'JP', name: 'Japan', flag: 'https://flagcdn.com/w320/jp.png' },
  { code: 'DE', name: 'Germany', flag: 'https://flagcdn.com/w320/de.png' }
];

const INDICATORS = [
  { 
    code: 'NY.GDP.MKTP.KD.ZG', 
    name: 'GDP Growth', 
    formatQuestion: (countryName, threshold, year) => `[WB] ${countryName} GDP Growth above ${threshold}% in ${year}?`,
    formatDescription: (countryName, threshold, year) => `This market resolves to Yes if the World Bank reports GDP growth for ${countryName} to exceed ${threshold}% for the year ${year}.`,
    getThreshold: (historicalVal) => (historicalVal > 0 ? historicalVal + 0.5 : 2.0).toFixed(1)
  },
  { 
    code: 'FP.CPI.TOTL.ZG', 
    name: 'Inflation', 
    formatQuestion: (countryName, threshold, year) => `[WB] ${countryName} Inflation below ${threshold}% in ${year}?`,
    formatDescription: (countryName, threshold, year) => `This market resolves to Yes if the World Bank reports Inflation for ${countryName} to fall below ${threshold}% for the year ${year}.`,
    getThreshold: (historicalVal) => (historicalVal > 2 ? historicalVal - 0.5 : 2.0).toFixed(1)
  }
];

async function seedEconomicsMarkets() {
  console.log("🚀 [Cron] Starting World Bank Market Seeder...");

  let createdCount = 0;
  
  const targetYear = new Date().getFullYear(); // e.g. 2026
  const historicalYear = targetYear - 2; // e.g. 2024 to base thresholds on
  const resolveDate = new Date(`${targetYear + 1}-07-01T23:59:59Z`).toISOString(); // WB usually releases data around mid next year

  for (const country of COUNTRIES) {
    for (const indicator of INDICATORS) {
      try {
        const url = `https://api.worldbank.org/v2/country/${country.code}/indicator/${indicator.code}?format=json&date=${historicalYear}`;
        const response = await axios.get(url);
        
        if (response.data && response.data[1] && response.data[1][0] && response.data[1][0].value !== null) {
          const historicalValue = response.data[1][0].value;
          
          const threshold = indicator.getThreshold(historicalValue);
          const question = indicator.formatQuestion(country.name, threshold, targetYear);
          const description = indicator.formatDescription(country.name, threshold, targetYear);

          const { data: existing } = await supabase
            .from('markets')
            .select('market_id')
            .eq('question', question)
            .single();
            
          if (existing) continue;

          const { error } = await supabase.from('markets').insert([{
            question: question,
            description: description,
            category: 'Economics', // Change from Politics to Economics
            image_url: country.flag,
            house_yes_points: BASE_LIQUIDITY / 2,
            house_no_points: BASE_LIQUIDITY / 2,
            status: 'Active',
            end_date: resolveDate
          }]);

          if (error) {
            console.error(`❌ Failed to insert market: ${question}`, error);
          } else {
            console.log(`✅ Created World Bank Market: ${question}`);
            createdCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Error fetching data for ${country.code} - ${indicator.code}:`, error.message);
      }
    }
  }

  console.log(`🏁 [Cron] World Bank Seeder finished. Created ${createdCount} markets.`);
}

export { seedEconomicsMarkets };
