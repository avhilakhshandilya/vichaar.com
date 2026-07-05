const axios = require('axios');

const domains = [
  'v3.football.api-sports.io',
  'v1.basketball.api-sports.io',
  'v1.baseball.api-sports.io',
  'v1.hockey.api-sports.io',
  'v1.tennis.api-sports.io',
  'v1.cricket.api-sports.io',
  'v1.rugby.api-sports.io'
];

async function testDomains() {
  for (const domain of domains) {
    try {
      const res = await axios.get(`https://${domain}/status`, {
        headers: { 'x-apisports-key': '79a202b62c7f3482c81a7e7f4331e772' },
        timeout: 5000
      });
      console.log(`✅ ${domain}: OK (Plan: ${res.data.response?.subscription?.plan || 'Unknown'})`);
    } catch (e) {
      if (e.response) {
        console.log(`❌ ${domain}: HTTP ${e.response.status}`);
      } else {
        console.log(`❌ ${domain}: ${e.message}`);
      }
    }
  }
}

testDomains();
