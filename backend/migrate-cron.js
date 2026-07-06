import fs from 'fs';
import path from 'path';

const cronDir = path.join(process.cwd(), 'cron');

const files = fs.readdirSync(cronDir);
for (const file of files) {
  if (!file.endsWith('.js')) continue;
  const filePath = path.join(cronDir, file);
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Replace requires
  code = code.replace(/const\s+\{\s*supabase\s*\}\s*=\s*require\(['"]\.\.\/utils\/supabase['"]\);/g, 'import { supabase } from "../utils/supabase.js";');
  code = code.replace(/const\s+axios\s*=\s*require\(['"]axios['"]\);/g, 'import axios from "axios";');
  code = code.replace(/require\(['"]dotenv['"]\)\.config\(\);/g, 'import dotenv from "dotenv";\ndotenv.config();');
  code = code.replace(/const\s+cron\s*=\s*require\(['"]node-cron['"]\);/g, ''); // Remove node-cron
  code = code.replace(/const\s+\{\s*GoogleGenAI\s*\}\s*=\s*require\(['"]@google\/genai['"]\);/g, 'import { GoogleGenAI } from "@google/genai";');
  
  // Replace internal requires (e.g. const { seedPoliticsMarkets } = require('./politicsSeeder');)
  code = code.replace(/const\s+\{\s*([a-zA-Z0-9_]+)\s*\}\s*=\s*require\(['"]\.\/([a-zA-Z0-9_]+)['"]\);/g, 'import { $1 } from "./$2.js";');
  
  // Replace exports.fn = or module.exports = { fn }
  code = code.replace(/exports\.([a-zA-Z0-9_]+)\s*=\s*(async\s*function|\([^)]*\)\s*=>)/g, 'export const $1 = $2');
  code = code.replace(/module\.exports\s*=\s*\{([^}]+)\};/g, 'export { $1 };');
  code = code.replace(/exports\.([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+);/g, 'export { $2 as $1 };');
  
  fs.writeFileSync(filePath, code);
}
console.log("Cron Migration complete.");
