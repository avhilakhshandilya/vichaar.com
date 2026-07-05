const axios = require('axios');

async function testNews() {
  console.log("Testing GNews...");
  try {
    const res = await axios.get('https://gnews.io/api/v4/top-headlines?category=nation&lang=en&country=in&max=3&apikey=34d9fe0725a01a0ed39647c10a0f3885');
    console.log("GNews:", res.data.articles.map(a => a.title));
  } catch (e) { console.error("GNews Error", e.message); }

  console.log("\nTesting NewsAPI...");
  try {
    const res = await axios.get('https://newsapi.org/v2/everything?q=India+politics+OR+Election+OR+Parliament+OR+Prime+Minister+OR+BJP+OR+Congress&language=en&sortBy=publishedAt&pageSize=3&apiKey=41692ab090b74fb3b28270a7c5d69500');
    console.log("NewsAPI:", res.data.articles.map(a => a.title));
  } catch (e) { console.error("NewsAPI Error", e.message); }
}

testNews();
