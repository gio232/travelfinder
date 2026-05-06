const axios = require('axios');

const options = {
  method: 'GET',
  url: 'https://fly-scraper.p.rapidapi.com/v2/flights/search-roundtrip',
  params: {
    originSkyId: 'PARI',
    destinationSkyId: 'MSYA'
  },
  headers: {
    'x-rapidapi-key': '297db5bccfmsh2a6dee75f1038d2p165a62jsn91af72450106',
    'x-rapidapi-host': 'fly-scraper.p.rapidapi.com'
  }
};

async function testApi() {
  try {
    console.log('🚀 Sending SINGLE test request to Fly-Scraper...');
    const response = await axios.request(options);
    console.log('✅ Success! Data structure preview:');
    console.log(JSON.stringify(response.data, null, 2).substring(0, 1000) + '...');
  } catch (error) {
    console.error('❌ API Error:', error.message);
  }
}

testApi();
