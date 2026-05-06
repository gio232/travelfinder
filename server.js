const axios = require('axios');
const { Telegraf } = require('telegraf');
const nodeHtmlToImage = require('node-html-to-image');
const fs = require('fs');
const path = require('path');
const http = require('http'); // Добавляем модуль http

// Load Localizations
const i18n = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales.json'), 'utf8'));

// --- CONFIG (Using Environment Variables) ---
const RAPID_API_KEY = process.env.RAPID_API_KEY || '297db5bccfmsh2a6dee75f1038d2p165a62jsn91af72450106';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8601612357:AAGntRC84iVcnx2XyIbETUtIX8G38F-SKZQ';
const CHAT_ID = process.env.CHAT_ID || '1157863036';

// --- DATA MAPPING ---
const COUNTRY_HUBS = {
  'Germany': [
    { name: 'Berlin', skyId: 'BER', entityId: '27547050' },
    { name: 'Munich', skyId: 'MUC', entityId: '27536640' },
    { name: 'Frankfurt', skyId: 'FRA', entityId: '27541623' }
  ],
  'Poland': [
    { name: 'Warsaw', skyId: 'WAW', entityId: '27537960' },
    { name: 'Krakow', skyId: 'KRK', entityId: '27543209' }
  ],
  'France': [
    { name: 'Paris', skyId: 'PARI', entityId: '27539733' },
    { name: 'Nice', skyId: 'NCE', entityId: '27539658' }
  ]
};

const VACATION_TYPES = [
  { id: 'beach', name: '🏝 Beach & Relax', tags: ['PMI', 'AYT', 'HER', 'TFS', 'BCN'] },
  { id: 'mountains', name: '🏔 Mountains & Ski', tags: ['INN', 'GVA', 'KUT', 'ZRH'] },
  { id: 'city', name: '🏛 City Break', tags: ['FCO', 'MAD', 'BUD', 'PRG', 'VCE'] },
  { id: 'active', name: '🥾 Active & Nature', tags: ['FNC', 'PDL', 'OSL', 'REK'] }
];

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// --- DB HELPERS (Mock for Supabase) ---
const db = {
  async getUser(tgId) { return { lang: 'en', origin: 'BER' }; }, // Mock fetch
  async updateUserLang(tgId, lang) { console.log(`DB: Updated ${tgId} to ${lang}`); },
  async updateUserOrigin(tgId, city) { console.log(`DB: Updated ${tgId} to ${city}`); }
};

// --- TELEGRAM INTERFACE (Wizard Flow) ---
bot.start((ctx) => {
  ctx.reply('🌍 Welcome to Nomad OS! Let\'s set up your profile.\n\nStep 1: Choose your country:', {
    reply_markup: {
      inline_keyboard: Object.keys(COUNTRY_HUBS).map(country => [{ text: country, callback_data: `select_country_${country}` }])
    }
  });
});

bot.action(/select_country_(.+)/, (ctx) => {
  const country = ctx.match[1];
  ctx.reply(`Step 2: Choose your hub in ${country}:`, {
    reply_markup: {
      inline_keyboard: COUNTRY_HUBS[country].map(hub => [{ text: hub.name, callback_data: `city_${hub.skyId}` }])
    }
  });
});

bot.action(/city_(.+)/, async (ctx) => {
  const cityCode = ctx.match[1];
  await db.updateUserOrigin(ctx.from.id, cityCode);
  ctx.reply('Step 3: What kind of vacation do you prefer?', {
    reply_markup: {
      inline_keyboard: VACATION_TYPES.map(type => [{ text: type.name, callback_data: `type_${type.id}` }])
    }
  });
});

bot.action(/type_(.+)/, async (ctx) => {
  const typeId = ctx.match[1];
  // Mock saving preference
  ctx.reply('✅ Profile Complete! Now you can find your perfect trip.', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔥 Hot Deal of the Day', callback_data: 'search' }],
        [{ text: '⚙️ Settings', callback_data: 'settings' }]
      ]
    }
  });
});

bot.command('settings', (ctx) => {
  ctx.reply('🛠 **Nomad OS Settings**', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🌐 Change Language', callback_data: 'change_lang' }],
        [{ text: '✈ Set Origin City', callback_data: 'set_origin' }],
        [{ text: '💳 Subscription Status', callback_data: 'check_sub' }]
      ]
    }
  });
});

bot.command('search', async (ctx) => {
  ctx.reply('🔍 Searching for the best deals... Please wait.');
  await generateAndSendDeal();
});

bot.action('settings', (ctx) => {
  ctx.reply('🛠 **Settings Menu** (Logic Coming Soon)');
});

bot.action('search', async (ctx) => {
  ctx.reply('🔍 Hunting for the Hot Deal of the Day...');
  await generateAndSendDeal();
});

// Handle Language Selection
bot.action('change_lang', (ctx) => {
  ctx.reply('Choose your language:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'English 🇺🇸', callback_data: 'lang_en' }, { text: 'Deutsch 🇩🇪', callback_data: 'lang_de' }],
        [{ text: 'Polski 🇵🇱', callback_data: 'lang_pl' }]
      ]
    }
  });
});

bot.action(/lang_(.+)/, async (ctx) => {
  const lang = ctx.match[1];
  await db.updateUserLang(ctx.from.id, lang);
  ctx.answerCbQuery(`Language set to ${lang.toUpperCase()}`);
  ctx.reply(`✅ Language updated!`);
});

// --- APP LOGIC ---
const ORIGIN_HUBS = [
  { name: 'Berlin', skyId: 'BER', entityId: '27547050' },
  { name: 'Warsaw', skyId: 'WAW', entityId: '27537960' },
  { name: 'Paris', skyId: 'PARI', entityId: '27539733' },
  { name: 'Prague', skyId: 'PRG', entityId: '27545465' },
  { name: 'London', skyId: 'LOND', entityId: '27544008' }
];

async function generateAndSendDeal() {
  console.log('🔍 Hunting for fresh combos across Europe...');
  
  for (const hub of ORIGIN_HUBS) {
    try {
      console.log(`✈️ Checking flights from ${hub.name}...`);
      const flightResponse = await axios.get('https://sky-scrapper.p.rapidapi.com/api/v2/flights/searchFlightsComplete', {
        params: { 
          originSkyId: hub.skyId, 
          destinationSkyId: 'ANY', 
          originEntityId: hub.entityId, 
          destinationEntityId: '', 
          currency: 'USD' 
        },
        headers: { 'x-rapidapi-key': RAPID_API_KEY, 'x-rapidapi-host': 'sky-scrapper.p.rapidapi.com' }
      });

      if (!flightResponse.data || !flightResponse.data.data || !flightResponse.data.data.itineraries) {
        console.log(`⚠️ No data for ${hub.name}. Skipping.`);
        continue;
      }

      const flight = flightResponse.data.data.itineraries[0];
      if (!flight) continue;

      const destinationName = flight.legs[0].destination.name;
      const htmlTemplate = fs.readFileSync(path.join(__dirname, 'ticket_template.html'), 'utf8');
      
      const image = await nodeHtmlToImage({
        html: htmlTemplate,
        content: {
          ORIGIN: hub.name,
          DESTINATION: destinationName,
          HOTEL_NAME: 'Premium Selection Hotel',
          DEPARTURE_DATE: flight.legs[0].departure.split('T')[0],
          NIGHTS: '5',
          RATING: '4.7',
          PRICE: flight.price.raw,
          SAVINGS: '40'
        }
      });

      const userLang = 'en'; 
      const t = i18n[userLang];

      await bot.telegram.sendPhoto(CHAT_ID, { source: image }, {
        caption: `🔥 **${t.new_deal}**\n💰 ${t.price}: ${flight.price.formatted}\n📍 Route: ${hub.name} ✈ ${destinationName}\n\n[${t.checkout}](https://www.skyscanner.net)`,
        parse_mode: 'Markdown'
      });

      console.log(`✅ Deal from ${hub.name} sent!`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error scanning ${hub.name}:`, error.message);
    }
  }
}

// Запуск раз в 6 часов
setInterval(generateAndSendDeal, 1000 * 60 * 60 * 6);
generateAndSendDeal();

bot.launch();
console.log('🚀 Nomad OS Server is running...');

// --- RENDER PORT HACK ---
// Render требует, чтобы Web Service слушал порт. Создаем "пустой" сервер.
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Nomad OS is Alive\n');
}).listen(PORT, () => {
  console.log(`📡 Port Hack: Listening on port ${PORT}`);
});

