import fs from 'fs';
import path from 'path';

const cronDir = path.join(process.cwd(), 'cron');
const files = fs.readdirSync(cronDir);

for (const file of files) {
  if (!file.endsWith('.js')) continue;
  const filePath = path.join(cronDir, file);
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Fix aiOddsUpdater imports and top-level eval
  code = code.replace(/const\s+\{\s*createClient\s*\}\s*=\s*require\(['"]@supabase\/supabase-js['"]\);/g, 'import { supabase } from "../utils/supabase.js";');
  code = code.replace(/const\s+\{\s*GoogleGenAI\s*,\s*Type\s*\}\s*=\s*require\(['"]@google\/genai['"]\);/g, 'import { GoogleGenAI, Type } from "@google/genai";');
  
  // Remove top-level aiOddsUpdater initializations
  code = code.replace(/const\s+supabase\s*=\s*createClient\([^)]+\);\n/g, '');
  code = code.replace(/const\s+ai\s*=\s*new\s+GoogleGenAI\([^)]+\);\n/g, '');
  
  // Move ai initialization into the function
  code = code.replace(/async\s+function\s+updateMarketOdds\(\)\s*\{/g, 'async function updateMarketOdds() {\n  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });');
  
  // Fix imageHelper require
  code = code.replace(/const\s+\{\s*getImageForQuestion(?:,\s*IMAGES)?\s*\}\s*=\s*require\(['"]\.\.\/utils\/imageHelper['"]\);/g, 'import { getImageForQuestion, IMAGES } from "../utils/imageHelper.js";');
  
  // Fix YahooFinance require
  code = code.replace(/const\s+YahooFinance\s*=\s*require\(['"]yahoo-finance2['"]\)\.default\s*\|\|\s*require\(['"]yahoo-finance2['"]\);/g, 'import yahooFinance from "yahoo-finance2";');
  code = code.replace(/YahooFinance\./g, 'yahooFinance.');
  
  // Remove require.main === module (which breaks in ESM)
  code = code.replace(/if\s*\(\s*typeof\s+require\s*!==\s*['"]undefined['"]\s*&&\s*require\.main\s*===\s*module\s*\)\s*\{[\s\S]*\}\n?/g, '');
  code = code.replace(/if\s*\(\s*require\.main\s*===\s*module\s*\)\s*\{[\s\S]*\}\n?/g, '');
  
  fs.writeFileSync(filePath, code);
}
console.log("Cron Migration 2 complete.");
