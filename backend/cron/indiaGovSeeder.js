import { supabase } from "../utils/supabase.js";
import { getImageForQuestion, IMAGES } from "../utils/imageHelper.js";

const BASE_LIQUIDITY = 50;

async function seedIndiaGovMarkets() {
  console.log("🇮🇳 [Cron] Starting Indian Government Multi-Sector Seeder...");
  
  let createdCount = 0;
  const endOfYear = new Date(`2026-12-31T23:59:59Z`).toISOString();
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthISO = nextMonth.toISOString();

  // 1. FINANCE & ECONOMICS
  try {
    console.log("📊 Generating Finance & Economics Markets...");
    const financeMarkets = [
      {
        question: "India GST collection above ₹1.85 Lakh Crore next month?",
        description: "This market resolves to Yes if the official data published by the Ministry of Finance shows GST collection exceeding ₹1.85 Lakh Crore."
      },
      {
        question: "India GDP growth rate above 7% in next quarter?",
        description: "This market resolves to Yes if India's GDP growth rate exceeds 7% in the upcoming quarterly report."
      },
      {
        question: "India CPI inflation drops below 4.5% by end of year?",
        description: "This market tracks if the Consumer Price Index (CPI) inflation drops below the 4.5% threshold."
      },
      {
        question: "Union Budget allocates >₹2L Crore for defense?",
        description: "This market tracks if the upcoming Union Budget allocation for defense crosses the ₹2 Lakh Crore mark."
      },
      {
        question: "Union Tax revenue exceeds annual target?",
        description: "Resolves to Yes if the official Union Tax revenue collection surpasses the set annual target by the end of the financial year."
      }
    ];

    for (const m of financeMarkets) {
      const { data: existing } = await supabase.from('markets').select('market_id').eq('question', m.question).single();
      if (!existing) {
        await supabase.from('markets').insert([{
          question: m.question,
          description: m.description,
          category: 'Politics', // Intercepted by frontend as Finance/Economics
          image_url: getImageForQuestion(m.question),
          house_yes_points: BASE_LIQUIDITY / 2,
          house_no_points: BASE_LIQUIDITY / 2,
          status: 'Active',
          end_date: endOfYear
        }]);
        console.log(`✅ Created Finance Market: ${m.question}`);
        createdCount++;
      }
    }
  } catch (err) {
    console.error("❌ Error generating Finance Markets:", err.message);
  }

  // 2. ENERGY COMMODITIES (Crude Oil, Natural Gas)
  try {
    console.log("🛢️ Generating Energy Markets...");
    const energyMarkets = [
      {
        question: "Crude oil price drops below $75 per barrel this month?",
        description: "This market resolves to Yes if global Brent Crude oil prices drop below $75 per barrel within the current month."
      },
      {
        question: "Natural gas prices surge above ₹500 per mmBtu this quarter?",
        description: "Resolves to Yes if Natural Gas prices cross ₹500 per mmBtu according to official pricing data."
      }
    ];

    for (const m of energyMarkets) {
      const { data: existing } = await supabase.from('markets').select('market_id').eq('question', m.question).single();
      if (!existing) {
        await supabase.from('markets').insert([{
          question: m.question,
          description: m.description,
          category: 'Politics', 
          image_url: getImageForQuestion(m.question),
          house_yes_points: BASE_LIQUIDITY / 2,
          house_no_points: BASE_LIQUIDITY / 2,
          status: 'Active',
          end_date: nextMonthISO
        }]);
        console.log(`✅ Created Energy Market: ${m.question}`);
        createdCount++;
      }
    }
  } catch (err) {
    console.error("❌ Error generating Energy Markets:", err.message);
  }

  // 3. ELECTIONS & BILLS
  try {
    console.log("🗳️ Generating Election & Bill Markets...");
    const electionMarkets = [
      {
        question: "Voter turnout above 65% in upcoming state elections?",
        description: "This market resolves to Yes if the official ECI data reports a voter turnout greater than 65%."
      },
      {
        question: "Lok Sabha passes new uniform civil code bill?",
        description: "Resolves to Yes if the Lok Sabha successfully passes the Uniform Civil Code (UCC) bill during the current session."
      },
      {
        question: "ECI announces next election phase schedule before Friday?",
        description: "Resolves to Yes if the Election Commission of India publishes the new election schedule by Friday."
      }
    ];

    for (const m of electionMarkets) {
      const { data: existing } = await supabase.from('markets').select('market_id').eq('question', m.question).single();
      if (!existing) {
        await supabase.from('markets').insert([{
          question: m.question,
          description: m.description,
          category: 'Politics',
          image_url: getImageForQuestion(m.question),
          house_yes_points: BASE_LIQUIDITY / 2,
          house_no_points: BASE_LIQUIDITY / 2,
          status: 'Active',
          end_date: endOfYear
        }]);
        console.log(`✅ Created Election/Bill Market: ${m.question}`);
        createdCount++;
      }
    }
  } catch (err) {
    console.error("❌ Error generating Election Markets:", err.message);
  }

  // 4. POLICIES
  try {
    console.log("🏗️ Generating Policy Markets...");
    const policyMarkets = [
      {
        question: "PM-KISAN beneficiaries exceed target this quarter?",
        description: "This market tracks if the PM-KISAN scheme disbursements exceed their quarterly target."
      },
      {
        question: "Government announces new EV subsidy policy by year end?",
        description: "Resolves to Yes if the Indian Government officially announces a new Electric Vehicle subsidy framework before the end of the year."
      }
    ];

    for (const m of policyMarkets) {
      const { data: existing } = await supabase.from('markets').select('market_id').eq('question', m.question).single();
      if (!existing) {
        await supabase.from('markets').insert([{
          question: m.question,
          description: m.description,
          category: 'Politics',
          image_url: getImageForQuestion(m.question),
          house_yes_points: BASE_LIQUIDITY / 2,
          house_no_points: BASE_LIQUIDITY / 2,
          status: 'Active',
          end_date: endOfYear
        }]);
        console.log(`✅ Created Policy Market: ${m.question}`);
        createdCount++;
      }
    }
  } catch (err) {
    console.error("❌ Error generating Policy Markets:", err.message);
  }

  console.log(`🏁 [Cron] Indian Government Seeder finished. Created ${createdCount} markets.`);
}

export {  seedIndiaGovMarkets  };
