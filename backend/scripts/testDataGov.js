const axios = require('axios');

const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070';

async function fetchMandiPrices() {
  try {
    console.log("Fetching Mandi Prices...");
    const url = `https://api.data.gov.in/resource/${RESOURCE_ID}?api-key=${API_KEY}&format=json&limit=10`;
    const response = await axios.get(url);
    
    console.log("Records found:", response.data.records.length);
    for (const record of response.data.records) {
      console.log(`- ${record.state} | ${record.market} | ${record.commodity} | Min: ${record.min_price}, Max: ${record.max_price}, Modal: ${record.modal_price}`);
    }
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

fetchMandiPrices();
