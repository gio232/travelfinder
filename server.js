const axios = require('axios');
const { Telegraf } = require('telegraf');
const nodeHtmlToImage = require('node-html-to-image');
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express'); // Добавляем Express для Mini App
const app = express();

// Load Localizations
const i18n = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales.json'), 'utf8'));

// --- CONFIG (Using Environment Variables) ---
const RAPID_API_KEY = process.env.RAPID_API_KEY || '297db5bccfmsh2a6dee75f1038d2p165a62jsn91af72450106';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8601612357:AAGntRC84iVcnx2XyIbETUtIX8G38F-SKZQ';
const CHAT_ID = process.env.CHAT_ID || '1157863036';

const FLY_SCRAPER_HOST = 'fly-scraper.p.rapidapi.com';
const SKY_SCRAPPER_HOST = 'sky-scrapper.p.rapidapi.com';

// --- DATA MAPPING ---
const COUNTRY_HUBS = {
  'Germany': [{ name: 'Berlin', skyId: 'BER' }, { name: 'Munich', skyId: 'MUC' }, { name: 'Frankfurt', skyId: 'FRA' }],
  'Poland': [{ name: 'Warsaw', skyId: 'WAW' }, { name: 'Krakow', skyId: 'KRK' }, { name: 'Gdansk', skyId: 'GDN' }],
  'France': [{ name: 'Paris', skyId: 'PARI' }, { name: 'Nice', skyId: 'NCE' }, { name: 'Lyon', skyId: 'LYS' }],
  'Spain': [{ name: 'Madrid', skyId: 'MAD' }, { name: 'Barcelona', skyId: 'BCN' }, { name: 'Malaga', skyId: 'AGP' }],
  'Italy': [{ name: 'Rome', skyId: 'ROME' }, { name: 'Milan', skyId: 'MILA' }, { name: 'Venice', skyId: 'VCE' }],
  'UK': [{ name: 'London', skyId: 'LOND' }, { name: 'Manchester', skyId: 'MAN' }, { name: 'Edinburgh', skyId: 'EDI' }],
  'Norway': [{ name: 'Oslo', skyId: 'OSL' }, { name: 'Bergen', skyId: 'BGO' }],
  'Switzerland': [{ name: 'Zurich', skyId: 'ZRH' }, { name: 'Geneva', skyId: 'GVA' }],
  'Austria': [{ name: 'Vienna', skyId: 'VIE' }, { name: 'Salzburg', skyId: 'SZG' }],
  'Netherlands': [{ name: 'Amsterdam', skyId: 'AMS' }],
  'Portugal': [{ name: 'Lisbon', skyId: 'LIS' }, { name: 'Porto', skyId: 'OPO' }]
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

bot.start((ctx) => {
  ctx.reply('🌍 Welcome to Nomad OS! Use our professional dashboard to set up your filters.', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Open Nomad Dashboard', web_app: { url: process.env.WEBAPP_URL || 'https://travelfinder-rigu.onrender.com' } }]
      ]
    }
  });
});

bot.command('app', (ctx) => {
  ctx.reply('Open the dashboard to configure your travel style:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '💎 Launch Dashboard', web_app: { url: process.env.WEBAPP_URL || 'https://travelfinder-rigu.onrender.com' } }]
      ]
    }
  });
});

// Handle Data from Mini App
bot.on('web_app_data', async (ctx) => {
  const data = JSON.parse(ctx.webAppData.data.json());
  await db.updateUserOrigin(ctx.from.id, data.country);
  // Additional logic for type...
  ctx.reply(`✅ Dashboard updated! Style: ${data.type} from ${data.country}. Searching for deals...`);
  await generateAndSendDeal(null, data.type);
});

bot.action(/type_(.+)/, async (ctx) => {
  const typeId = ctx.match[1];
  ctx.reply('Step 4: When do you want to travel?', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📅 Next 30 Days', callback_data: `date_next30_${typeId}` }],
        [{ text: '🗓 Next 3 Months', callback_data: `date_next90_${typeId}` }],
        [{ text: '🚀 Anytime', callback_data: `date_any_${typeId}` }]
      ]
    }
  });
});

bot.action(/date_(.+)_(.+)/, async (ctx) => {
  const timeframe = ctx.match[1];
  const typeId = ctx.match[2];
  
  ctx.reply('✅ Profile Complete! Now you can find your perfect trip.', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔥 Hot Deal of the Day', callback_data: `search_${typeId}` }],
        [{ text: '⚙️ Settings', callback_data: 'settings' }]
      ]
    }
  });
});

bot.action(/search_(.+)/, async (ctx) => {
  const typeId = ctx.match[1];
  ctx.reply('🔍 Hunting for the Hot Deal of the Day based on your style...');
  await generateAndSendDeal(null, typeId);
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

async function generateAndSendDeal(specificHub = null, vacationType = null) {
  console.log(`🔍 Hunting for ${vacationType ? vacationType : 'Any'} deals...`);
  
  const hubsToSearch = specificHub ? [specificHub] : ORIGIN_HUBS;
  
  for (const hub of hubsToSearch) {
    try {
      // Определяем цели: если тип отдыха выбран, ищем по его тегам, иначе - ANY
      const selectedType = VACATION_TYPES.find(t => t.id === vacationType);
      const destinations = selectedType ? selectedType.tags : ['ANY'];

      for (const dest of destinations) {
        console.log(`✈️ Checking ${hub.name} -> ${dest}...`);
        
        const flightResponse = await axios.get('https://fly-scraper.p.rapidapi.com/v2/flights/search-roundtrip', {
          params: { 
            originSkyId: hub.skyId, 
            destinationSkyId: dest
          },
          headers: { 
            'x-rapidapi-key': RAPID_API_KEY, 
            'x-rapidapi-host': FLY_SCRAPER_HOST 
          }
        });

        if (!flightResponse.data || !flightResponse.data.data || !flightResponse.data.data.itineraries) continue;

        const flight = flightResponse.data.data.itineraries[0];
        if (!flight) continue;

        const destinationName = flight.legs[0].destination.name;
        const htmlTemplate = fs.readFileSync(path.join(__dirname, 'ticket_template.html'), 'utf8');
        
        const image = await nodeHtmlToImage({
          html: htmlTemplate,
          content: {
            ORIGIN: hub.name,
            DESTINATION: destinationName,
            HOTEL_NAME: 'Handpicked Elite Stay',
            DEPARTURE_DATE: flight.legs[0].departure.split('T')[0],
            NIGHTS: '7',
            RATING: '4.8',
            PRICE: flight.price.raw,
            SAVINGS: '45'
          }
        });

        const userLang = 'en'; 
        const t = i18n[userLang];

        await bot.telegram.sendPhoto(CHAT_ID, { source: image }, {
          caption: `🔥 **${t.new_deal} (${selectedType ? selectedType.name : 'Top Choice'})**\n💰 ${t.price}: ${flight.price.formatted}\n📍 Route: ${hub.name} ✈ ${destinationName}\n\n[${t.checkout}](https://www.skyscanner.net)`,
          parse_mode: 'Markdown'
        });

        console.log(`✅ Targeted deal from ${hub.name} sent!`);
        break; // Отправляем один лучший вариант для хаба и переходим к следующему
      }
      
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

// --- MINI APP SERVER ---
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, 'public'))); // Абсолютный путь

app.get('/ping', (req, res) => res.send('Pong! Nomad OS is live.'));

app.get('/api/search', async (req, res) => {
  const { origin, type } = req.query;
  console.log(`📡 API Search Request: From ${origin}, Type ${type}`);
  
  try {
    // Упрощенный поиск для Mini App (быстрый ответ)
    const flightResponse = await axios.get('https://fly-scraper.p.rapidapi.com/v2/flights/search-roundtrip', {
      params: { originSkyId: origin, destinationSkyId: 'ANY' },
      headers: { 'x-rapidapi-key': RAPID_API_KEY, 'x-rapidapi-host': FLY_SCRAPER_HOST }
    });

    const deals = flightResponse.data.data.itineraries.slice(0, 5).map(f => {
      const flightPrice = f.price.raw;
      const isCombo = type === 'combo';
      
      // В режиме Combo добавляем динамическую стоимость отеля (от 150 до 400 USD за неделю)
      const mockHotelPrice = isCombo ? Math.floor(Math.random() * (400 - 150) + 150) : 0;
      const totalPrice = flightPrice + mockHotelPrice;
      
      return {
        origin: origin,
        destination: f.legs[0].destination.name,
        price: isCombo ? `$${totalPrice.toFixed(0)}` : f.price.formatted,
        date: f.legs[0].departure.split('T')[0],
        mode: type,
        hotelIncluded: isCombo
      };
    });

    res.json({ success: true, deals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`📡 Mini App & Port Hack: Listening on port ${PORT}`);
});

