const axios = require('axios');

const RAPID_API_KEY = '297db5bccfmsh2a6dee75f1038d2p165a62jsn91af72450106';
const RAPID_API_HOST = 'sky-scrapper.p.rapidapi.com';

async function testApi() {
  console.log('🚀 Testing Sky-Scrapper API...');
  
  const options = {
    method: 'GET',
    url: 'https://sky-scrapper.p.rapidapi.com/api/v2/flights/searchFlightsComplete',
    params: {
      originSkyId: 'LOND',
      destinationSkyId: 'NYCA',
      originEntityId: '27544008',
      destinationEntityId: '27537542',
      cabinClass: 'economy',
      adults: '1',
      sortBy: 'best',
      currency: 'USD',
      market: 'en-US',
      countryCode: 'US'
    },
    headers: {
      'x-rapidapi-key': RAPID_API_KEY,
      'x-rapidapi-host': RAPID_API_HOST
    }
  };

  try {
    const response = await axios.request(options);
    if (response.data.status) {
      console.log('✅ Success! Found flights:', response.data.data.itineraries.length);
      console.log('Example Flight Price:', response.data.data.itineraries[0].price.formatted);
    } else {
      console.log('❌ API returned error status:', response.data);
    }
  } catch (error) {
    console.error('❌ Connection Failed:', error.message);
  }
}

testApi();
