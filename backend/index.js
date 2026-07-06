import { Hono } from "hono";
import { cors } from "hono/cors";

import authRoutes from "./routes/auth.js";
import marketsRoutes from "./routes/markets.js";
import userRoutes from "./routes/user.js";
import chartRoutes from "./routes/charts.js";
import commentRoutes from "./routes/comments.js";
import walletRoutes from "./routes/wallet.js";
import { startCronJobs } from "./cron/marketSeeder.js";

const app = new Hono();

// CORS is required because frontend is on Cloudflare Pages and backend is on Cloudflare Workers
app.use('*', cors({
  origin: '*', // You can restrict this to your frontend URL later
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Routes
app.route("/api/auth", authRoutes);
app.route("/api/markets", marketsRoutes);
app.route("/api/user", userRoutes);
app.route("/api/charts", chartRoutes);
app.route("/api/comments", commentRoutes);
app.route("/api/wallet", walletRoutes);

// Test route
app.get("/", (c) => {
  return c.text("Vichaar Backend Running on Cloudflare!");
});

export default {
  fetch: (request, env, ctx) => {
    const trimmedEnv = {};
    for (const key in env) {
      trimmedEnv[key] = typeof env[key] === 'string' ? env[key].replace(/^\uFEFF/, '').trim() : env[key];
    }
    globalThis.process = { env: trimmedEnv };
    return app.fetch(request, env, ctx);
  },
  
  // Cloudflare Scheduled Events (Cron)
  async scheduled(event, env, ctx) {
    const trimmedEnv = {};
    for (const key in env) {
      trimmedEnv[key] = typeof env[key] === 'string' ? env[key].replace(/^\uFEFF/, '').trim() : env[key];
    }
    globalThis.process = { env: trimmedEnv };
    // When Cloudflare triggers the cron, we run our seeder logic here
    // In Express we used `node-cron`, but here we just call the function directly
    console.log(`Cron triggered: ${event.cron}`);
    
    // Pass environment variables down if needed
    // You'll need to refactor marketSeeder to export a function that runs ONE cycle instead of a continuous loop
    try {
      await startCronJobs(event.cron);
    } catch (e) {
      console.error("Cron Error: ", e);
    }
  }
};
