import axios from "axios";
import { supabase } from "../utils/supabase.js";
import { getImageForQuestion, IMAGES } from "../utils/imageHelper.js";

const BASE_LIQUIDITY = 100;

const CITIES = [
  // 🇮🇳 Popular Indian Cities
  { name: 'Mumbai', lat: 19.07, lon: 72.87, tz: 'Asia/Kolkata' },
  { name: 'Delhi', lat: 28.61, lon: 77.20, tz: 'Asia/Kolkata' },
  { name: 'Bengaluru', lat: 12.97, lon: 77.59, tz: 'Asia/Kolkata' },
  { name: 'Chennai', lat: 13.08, lon: 80.27, tz: 'Asia/Kolkata' },
  { name: 'Kolkata', lat: 22.57, lon: 88.36, tz: 'Asia/Kolkata' },
  { name: 'Hyderabad', lat: 17.38, lon: 78.48, tz: 'Asia/Kolkata' },
  { name: 'Jaipur', lat: 26.91, lon: 75.79, tz: 'Asia/Kolkata' },
  { name: 'Ahmedabad', lat: 23.02, lon: 72.57, tz: 'Asia/Kolkata' },
  { name: 'Pune', lat: 18.52, lon: 73.85, tz: 'Asia/Kolkata' },
  { name: 'Lucknow', lat: 26.85, lon: 80.95, tz: 'Asia/Kolkata' },
  { name: 'Guwahati', lat: 26.14, lon: 91.73, tz: 'Asia/Kolkata' },
  { name: 'Tezpur', lat: 26.65, lon: 92.79, tz: 'Asia/Kolkata' },
  { name: 'Biswanath', lat: 26.73, lon: 93.15, tz: 'Asia/Kolkata' },

];

async function getOpenMeteoForecast(city) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&daily=temperature_2m_max,precipitation_sum&timezone=${city.tz}`;
  const resp = await axios.get(url);
  const daily = resp.data.daily;
  const result = [];
  for (let i = 0; i < 4 && i < (daily.time?.length || 0); i++) {
    result.push({
      date: daily.time[i],
      max_temp: daily.temperature_2m_max[i],
      precip: daily.precipitation_sum[i]
    });
  }
  return result;
}

async function seedWeatherMarkets() {
  console.log("🌤️ [Cron] Starting Open-Meteo Weather Market Seeder...");

  let createdCount = 0;

  for (const city of CITIES) {
    try {
      const forecastData = await getOpenMeteoForecast(city);
      if (!forecastData || forecastData.length < 4) continue;

      // Create markets for today (0), tomorrow (1), day after (2), and 3 days from now (3)
      const targetIndices = [0, 1, 2, 3];
      
      for (const targetIndex of targetIndices) {
        const dayData = forecastData[targetIndex];
        const targetDateRaw = dayData.date;
        const targetDate = new Date(targetDateRaw).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        
        const maxTemp = dayData.max_temp;
        const precip = dayData.precip;
        
        // Thresholds: Temperature (+/- 2 degrees from forecast)
        const thresholdTemp = Math.floor(maxTemp);
        
        const tempQuestion = `${city.name} above ${thresholdTemp}°C on ${targetDate}?`;

        // Market 1: Temperature
        const { data: existingTemp } = await supabase
          .from('markets')
          .select('market_id')
          .eq('question', tempQuestion)
          .single();
          
        if (!existingTemp) {
          const { error } = await supabase.from('markets').insert([{
            question: tempQuestion,
            description: `This market predicts whether the maximum recorded temperature in ${city.name} will exceed ${thresholdTemp}°C on ${targetDate}, based on Open-Meteo forecast data.`,
            category: 'Politics', // Route via Politics for DB check constraint
            image_url: getImageForQuestion(tempQuestion),
            house_yes_points: BASE_LIQUIDITY / 2,
            house_no_points: BASE_LIQUIDITY / 2,
            status: 'Active',
            end_date: new Date(`${targetDateRaw}T23:59:59Z`).toISOString()
          }]);

          if (error) {
            console.error(`❌ Failed to insert weather market: ${tempQuestion}`, error);
          } else {
            console.log(`✅ Created Weather Market: ${tempQuestion}`);
            createdCount++;
          }
        }

        // Market 2: Precipitation generation removed as per user request
      }

    } catch (error) {
      console.error(`❌ Error fetching Gemini data for ${city.name}:`, error.message);
    }
  }

  console.log(`🏁 [Cron] Weather Seeder finished. Created ${createdCount} markets.`);
}

export {  seedWeatherMarkets  };
