import axios from 'axios';
const API_KEY = process.env.DATAGOV_API_KEY;
const URL = `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69?api-key=${API_KEY}&format=json&limit=10`;
async function test() {
  try {
    const res = await axios.get(URL);
    console.log(Object.keys(res.data));
    if (res.data.records) {
      console.log(res.data.records.length, 'records');
      console.log('Sample record:', res.data.records[0]);
    } else {
      console.log('Data:', JSON.stringify(res.data, null, 2).slice(0, 500));
    }
  } catch (e) {
    console.error(e.response ? e.response.data : e.message);
  }
}
test();
