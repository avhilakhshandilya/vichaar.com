const axios = require('axios');

const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';

async function searchCatalog(keyword) {
  try {
    const url = `https://api.data.gov.in/catalog/v1?api-key=${API_KEY}&format=json&limit=5&title=${keyword}`;
    const response = await axios.get(url);
    console.log(`\nResults for ${keyword}:`);
    for (const record of response.data.records || []) {
      console.log(`- ${record.title} (ID: ${record.index_name})`);
    }
  } catch (err) {
    console.error(`Error for ${keyword}:`, err.message);
  }
}

async function run() {
  await searchCatalog('GST');
  await searchCatalog('Election');
  await searchCatalog('Policy');
}

run();
