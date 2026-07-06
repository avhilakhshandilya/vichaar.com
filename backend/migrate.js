import fs from 'fs';
import path from 'path';

const controllersDir = path.join(process.cwd(), 'controllers');
const routesDir = path.join(process.cwd(), 'routes');
const utilsDir = path.join(process.cwd(), 'utils');

// Migrate utils
const supabasePath = path.join(utilsDir, 'supabase.js');
if (fs.existsSync(supabasePath)) {
  let code = fs.readFileSync(supabasePath, 'utf8');
  code = code.replace(/const\s+\{\s*createClient\s*\}\s*=\s*require\(['"]@supabase\/supabase-js['"]\);/g, 'import { createClient } from "@supabase/supabase-js";');
  code = code.replace(/require\(['"]dotenv['"]\)\.config\(\);/g, 'import dotenv from "dotenv";\ndotenv.config();');
  code = code.replace(/module\.exports\s*=\s*\{\s*supabase\s*\};/g, 'export { supabase };');
  fs.writeFileSync(supabasePath, code);
}

// Migrate Controllers
const controllers = fs.readdirSync(controllersDir);
for (const file of controllers) {
  if (!file.endsWith('.js')) continue;
  const filePath = path.join(controllersDir, file);
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Replace requires
  code = code.replace(/const\s+\{\s*supabase\s*\}\s*=\s*require\(['"]\.\.\/utils\/supabase['"]\);/g, 'import { supabase } from "../utils/supabase.js";');
  code = code.replace(/const\s+bcrypt\s*=\s*require\(['"]bcrypt['"]\);/g, 'import bcrypt from "bcryptjs";');
  code = code.replace(/const\s+axios\s*=\s*require\(['"]axios['"]\);/g, 'import axios from "axios";');
  code = code.replace(/const\s+yahooFinance\s*=\s*require\(['"]yahoo-finance2['"]\)\.default;/g, 'import yahooFinance from "yahoo-finance2";');
  
  // Replace exports
  code = code.replace(/exports\.([a-zA-Z0-9_]+)\s*=\s*async\s*\(/g, 'export const $1 = async (');
  
  fs.writeFileSync(filePath, code);
}

// Migrate Routes
const routes = fs.readdirSync(routesDir);
for (const file of routes) {
  if (!file.endsWith('.js')) continue;
  const filePath = path.join(routesDir, file);
  let code = fs.readFileSync(filePath, 'utf8');
  
  // Replace requires with imports
  code = code.replace(/const\s+express\s*=\s*require\(['"]express['"]\);\s*const\s+router\s*=\s*express\.Router\(\);/g, 'import { Hono } from "hono";\nconst router = new Hono();');
  
  // Extract controller name
  const controllerMatch = code.match(/require\(['"]\.\.\/controllers\/([a-zA-Z0-9_]+)['"]\);/);
  if (controllerMatch) {
    const controllerName = controllerMatch[1];
    code = code.replace(/const\s+\{[^}]+\}\s*=\s*require\([^)]+\);/g, `import * as ctrl from "../controllers/${controllerName}.js";`);
    
    // Replace router.METHOD('/path', fn)
    code = code.replace(/router\.(get|post|put|delete)\(['"]([^'"]+)['"],\s*([a-zA-Z0-9_]+)\);/g, (match, method, path, fnName) => {
      // Don't inject req.body for GET requests
      const bodyStr = method === 'get' ? '{}' : 'await c.req.json().catch(()=>({}))';
      return `router.${method}('${path}', async (c) => {\n  let statusCode = 200;\n  const req = {\n    body: ${bodyStr},\n    params: c.req.param(),\n    query: c.req.query(),\n    headers: c.req.header(),\n  };\n  const res = {\n    status: (code) => { statusCode = code; return res; },\n    json: (data) => c.json(data, statusCode)\n  };\n  return await ctrl.${fnName}(req, res);\n});`;
    });
  }
  
  code = code.replace(/module\.exports\s*=\s*router;/g, 'export default router;');
  fs.writeFileSync(filePath, code);
}
console.log("Migration complete.");
