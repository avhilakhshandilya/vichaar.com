import axios from "axios";
import { supabase } from "../utils/supabase.js";
import { getImageForQuestion, IMAGES } from "../utils/imageHelper.js";

const BASE_LIQUIDITY = 100;

// Top economies matching World Bank seeder
const COUNTRIES = [
  { code: 'USA', name: 'United States', flag: 'https://flagcdn.com/w320/us.png' },
  { code: 'CHN', name: 'China', flag: 'https://flagcdn.com/w320/cn.png' },
  { code: 'IND', name: 'India', flag: 'https://flagcdn.com/w320/in.png' },
  { code: 'JPN', name: 'Japan', flag: 'https://flagcdn.com/w320/jp.png' },
  { code: 'DEU', name: 'Germany', flag: 'https://flagcdn.com/w320/de.png' }
];

const INDICATORS = [
  { 
    code: 'LUR', 
    name: 'Unemployment Rate', 
    formatQuestion: (countryName, threshold, year) => `[IMF] ${countryName} Unemployment below ${threshold}% in ${year}?`,
    formatDescription: (countryName, threshold, year) => `This market resolves to Yes if the IMF projects the Unemployment Rate for ${countryName} to fall below ${threshold}% in ${year}.`,
    getThreshold: (historicalVal) => (historicalVal > 2 ? historicalVal - 0.2 : 2.0).toFixed(1)
  },
  { 
    code: 'BCA_NGDPD', 
    name: 'Current Account Balance', 
    formatQuestion: (countryName, threshold, year) => `[IMF] ${countryName} Current Account above ${threshold}% of GDP in ${year}?`,
    formatDescription: (countryName, threshold, year) => `This market resolves to Yes if the IMF projects the Current Account Balance for ${countryName} to exceed ${threshold}% of GDP in ${year}.`,
    getThreshold: (historicalVal) => (historicalVal + 0.5).toFixed(1)
  }
];

async function seedIMFMarkets() {
  console.log("🏦 [Cron] Starting IMF Market Seeder (Datamapper API)...");

  let createdCount = 0;
  const currentYear = new Date().getFullYear();
  const endOfYear = new Date(`${currentYear}-12-31T23:59:59Z`).toISOString();

  for (const country of COUNTRIES) {
    for (const indicator of INDICATORS) {
      try {
        // Fetch the 2025 projection data point from IMF API to base the 2026 threshold on
        const url = `https://www.imf.org/external/datamapper/api/v1/${indicator.code}?periods=2025`;
        const response = await axios.get(url);
        
        const dataMap = response.data.values[indicator.code];
        if (dataMap && dataMap[country.code] && dataMap[country.code]['2025'] !== undefined) {
          const historicalValue = dataMap[country.code]['2025'];
          
          const threshold = indicator.getThreshold(historicalValue);
          const targetYear = new Date().getFullYear();
          const question = indicator.formatQuestion(country.name, threshold, targetYear);
          const description = indicator.formatDescription(country.name, threshold, targetYear);

          // Check if market already exists
          const { data: existing } = await supabase
            .from('markets')
            .select('market_id')
            .eq('question', question)
            .single();
            
          if (existing) continue;

          const { error } = await supabase.from('markets').insert([{
            question: question,
            description: description,
            category: 'Politics', // Intercepted by frontend as Economics
            image_url: getImageForQuestion(question),
            house_yes_points: BASE_LIQUIDITY / 2,
            house_no_points: BASE_LIQUIDITY / 2,
            status: 'Active',
            end_date: endOfYear
          }]);

          if (error) {
            console.error(`❌ Failed to insert market: ${question}`, error);
          } else {
            console.log(`✅ Created IMF Market: ${question}`);
            createdCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Error fetching data for ${country.code} - ${indicator.code}:`, error.message);
      }
    }
  }

  console.log(`🏁 [Cron] IMF Seeder finished. Created ${createdCount} markets.`);
}

export {  seedIMFMarkets  };
