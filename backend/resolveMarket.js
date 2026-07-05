

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log("Usage: node resolveMarket.js <market_id> <winning_outcome>");
  console.log("winning_outcome can be: YES, NO, CANCEL");
  process.exit(1);
}

const market_id = args[0];
const winning_outcome = args[1].toUpperCase();

if (!['YES', 'NO', 'CANCEL'].includes(winning_outcome)) {
  console.log("Error: winning_outcome must be YES, NO, or CANCEL");
  process.exit(1);
}

async function resolve() {
  try {
    const res = await fetch('http://localhost:5000/api/markets/resolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ market_id, winning_outcome })
    });
    
    const data = await res.json();
    if (data.success) {
      console.log("SUCCESS:", data.message);
    } else {
      console.log("ERROR:", data.message);
    }
  } catch (err) {
    console.error("Failed to connect to backend API.", err.message);
  }
}

resolve();
