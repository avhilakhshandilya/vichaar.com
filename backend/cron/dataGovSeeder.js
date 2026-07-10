import axios from "axios";
import { supabase } from "../utils/supabase.js";
import { getImageForQuestion } from "../utils/imageHelper.js";

const BASE_LIQUIDITY = 50;
const DATAGOV_API_KEY = process.env.DATAGOV_API_KEY;

// Known Resource ID for Real time Air Quality Index
const AQI_RESOURCE_ID = "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69"; 

const TARGET_CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Kolkata', 'Chennai', 'Hyderabad'];

export async function seedDataGovMarkets() {
  console.log("🇮🇳 [Cron] Starting Data.gov.in API Seeder...");

  if (!DATAGOV_API_KEY) {
    console.error("❌ DATAGOV_API_KEY is missing. Skipping data.gov.in seeder.");
    return;
  }

  let createdCount = 0;

  try {
    // 1. Fetch AQI Data
    const aqiUrl = `https://api.data.gov.in/resource/${AQI_RESOURCE_ID}?api-key=${DATAGOV_API_KEY}&format=json&limit=100`;
    
    let aqiData;
    try {
      const resp = await axios.get(aqiUrl, { timeout: 10000 });
      aqiData = resp.data;
    } catch (apiError) {
      console.error(`⚠️ data.gov.in API error (Rate limit or downtime): ${apiError.message}`);
      return; // Exit early if API is down
    }

    if (aqiData && aqiData.records && aqiData.records.length > 0) {
      for (const city of TARGET_CITIES) {
        // Find the record for the city
        const record = aqiData.records.find(r => 
          r.city && r.city.toLowerCase() === city.toLowerCase() && 
          r.pollutant_id === 'PM2.5' // Use PM2.5 as the primary index
        ) || aqiData.records.find(r => 
          r.city && r.city.toLowerCase() === city.toLowerCase()
        );

        if (record && record.pollutant_max) {
          const currentAqiMax = parseInt(record.pollutant_max, 10);
          if (isNaN(currentAqiMax)) continue;

          // Create a market threshold: current max + 20%
          const threshold = Math.ceil(currentAqiMax * 1.2 / 10) * 10; // Round to nearest 10
          
          // Target date: end of current week
          const today = new Date();
          const targetDate = new Date(today);
          targetDate.setDate(today.getDate() + (7 - today.getDay())); // Next Sunday
          const dateStr = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          const question = `${city} AQI above ${threshold} on ${dateStr}?`;
          
          const { data: existing } = await supabase
            .from('markets')
            .select('market_id')
            .eq('question', question)
            .single();
            
          if (!existing) {
            const { error } = await supabase.from('markets').insert([{
              question: question,
              description: `This market predicts whether the Air Quality Index (AQI) in ${city} will exceed ${threshold} by ${dateStr}. Current max AQI is ${currentAqiMax}. Data sourced from the official Government of India Open Data Portal (data.gov.in).`,
              category: 'Politics',
              image_url: getImageForQuestion(question),
              house_yes_points: BASE_LIQUIDITY / 2,
              house_no_points: BASE_LIQUIDITY / 2,
              status: 'Active',
              end_date: targetDate.toISOString()
            }]);

            if (error) {
              console.error(`❌ Failed to insert data.gov.in AQI market for ${city}:`, error);
            } else {
              console.log(`✅ Created data.gov.in AQI Market: ${question}`);
              createdCount++;
            }
          }
        }
      }
    } else {
       console.log("⚠️ No valid records found in data.gov.in AQI response.");
    }

    // 2. Fetch CPI / Inflation Data
    // Using a standard Resource ID for Consumer Price Index (General)
    const CPI_RESOURCE_ID = "1b95b8fb-41a4-44b4-a159-d3e91122a84a";
    const cpiUrl = `https://api.data.gov.in/resource/${CPI_RESOURCE_ID}?api-key=${DATAGOV_API_KEY}&format=json&limit=10`;
    
    let cpiData;
    try {
      const resp = await axios.get(cpiUrl, { timeout: 10000 });
      cpiData = resp.data;
    } catch (apiError) {
      console.error(`⚠️ data.gov.in API error (CPI): ${apiError.message}`);
    }

    if (cpiData && cpiData.records && cpiData.records.length > 0) {
       // Just grab the latest CPI record
       const latestRecord = cpiData.records[0];
       
       // Assuming the dataset has fields like 'inflation_rate' or 'general_index'
       const cpiValue = parseFloat(latestRecord.inflation_rate || latestRecord.general_index || latestRecord.cpi_general);
       
       if (!isNaN(cpiValue)) {
         // Create a market: "Will the CPI Inflation rate exceed [current+0.5]% next month?"
         const targetInflation = (cpiValue + 0.5).toFixed(1);
         
         const today = new Date();
         const targetDate = new Date(today.getFullYear(), today.getMonth() + 2, 0); // End of next month
         const dateStr = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
         
         const question = `Will India's CPI Inflation exceed ${targetInflation}% for ${dateStr}?`;
         
         const { data: existing } = await supabase
            .from('markets')
            .select('market_id')
            .eq('question', question)
            .single();
            
         if (!existing) {
            const { error } = await supabase.from('markets').insert([{
              question: question,
              description: `This market predicts whether India's Consumer Price Index (CPI) inflation rate will exceed ${targetInflation}% by the end of ${dateStr}. Current latest reported value is ${cpiValue}%. Data sourced from official data.gov.in statistics.`,
              category: 'Politics',
              image_url: getImageForQuestion(question),
              house_yes_points: BASE_LIQUIDITY / 2,
              house_no_points: BASE_LIQUIDITY / 2,
              status: 'Active',
              end_date: targetDate.toISOString()
            }]);

            if (error) {
              console.error(`❌ Failed to insert data.gov.in CPI market:`, error);
            } else {
              console.log(`✅ Created data.gov.in CPI Market: ${question}`);
              createdCount++;
            }
         }
       }
    }

  } catch (error) {
    console.error("❌ Error in data.gov.in seeder:", error);
  }

  console.log(`🏁 [Cron] Data.gov.in Seeder finished. Created ${createdCount} markets.`);
}
