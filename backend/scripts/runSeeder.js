const { seedMarkets } = require('../cron/marketSeeder');

console.log("🚀 Starting manual market seed...");
seedMarkets().then(() => {
  console.log("Done! Wait a few seconds for the async operations to complete, then hit Ctrl+C.");
});
