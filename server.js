const axios = require('axios');
const { Telegraf } = require('telegraf');
const nodeHtmlToImage = require('node-html-to-image');
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express'); // Добавляем Express для Mini App
const app = express();

// Load Localizations & Hubs
const i18n = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales.json'), 'utf8'));
const HUB_DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'hubs.json'), 'utf8'));

// --- CONFIG ---
const RAPID_API_KEY = process.env.RAPID_API_KEY || '297db5bccfmsh2a6dee75f1038d2p165a62jsn91af72450106';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8601612357:AAGntRC84iVcnx2XyIbETUtIX8G38F-SKZQ';
const CHAT_ID = process.env.CHAT_ID || '1157863036';

const FLY_SCRAPER_HOST = 'fly-scraper.p.rapidapi.com';

const VACATION_TYPES = [
  { id: 'beach', name: '🏝 Beach & Relax', tags: ['PMI', 'AYT', 'HER', 'TFS', 'BCN'] },
  { id: 'mountains', name: '🏔 Mountains & Ski', tags: ['INN', 'GVA', 'KUT', 'ZRH'] },
  { id: 'city', name: '🏛 City Break', tags: ['FCO', 'MAD', 'BUD', 'PRG', 'VCE'] },
  { id: 'active', name: '🥾 Active & Nature', tags: ['FNC', 'PDL', 'OSL', 'REK'] }
];

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// --- SESSION MOCK ---
const sessions = {};

// --- WIZARD FLOW ---
bot.start((ctx) => {
  ctx.reply('🌍 Welcome to Nomad OS! Select your language / Выберите язык / Оберіть мову:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🇺🇸 English', callback_data: 'lang_en' }, { text: '🇷🇺 Русский', callback_data: 'lang_ru' }],
        [{ text: '🇺🇦 Українська', callback_data: 'lang_ua' }, { text: '🇩🇪 Deutsch', callback_data: 'lang_de' }]
      ]
    }
  });
});

bot.action(/lang_(.+)/, (ctx) => {
  const lang = ctx.match[1];
  sessions[ctx.from.id] = { lang };
  
  const welcomeText = {
    en: 'Step 2: Choose your origin country:',
    ru: 'Шаг 2: Выберите страну вылета:',
    ua: 'Крок 2: Оберіть країну вильоту:',
    de: 'Schritt 2: Wählen Sie Ihr Herkunftsland:'
  };

  ctx.editMessageText(welcomeText[lang] || welcomeText.en, {
    reply_markup: {
      inline_keyboard: Object.keys(HUB_DATA).map(c => [
        { text: HUB_DATA[c].name[lang] || c, callback_data: `country_${c}` }
      ])
    }
  });
});

bot.action(/country_(.+)/, (ctx) => {
  const country = ctx.match[1];
  const session = sessions[ctx.from.id];
  session.country = country;
  
  const cityText = {
    en: 'Step 3: Choose your city:',
    ru: 'Шаг 3: Выберите ваш город:',
    ua: 'Крок 3: Оберіть ваше місто:',
    de: 'Schritt 3: Wählen Sie Ihre Stadt:'
  };

  ctx.editMessageText(cityText[session.lang] || cityText.en, {
    reply_markup: {
      inline_keyboard: HUB_DATA[country].hubs.map(h => [
        { text: h.names[session.lang] || h.city, callback_data: `city_${h.id}` }
      ])
    }
  });
});

bot.action(/city_(.+)/, (ctx) => {
  const cityId = ctx.match[1];
  const session = sessions[ctx.from.id];
  session.cityId = cityId;

  const modeText = {
    en: 'Step 4: Choose service mode:',
    ru: 'Шаг 4: Выберите режим:',
    ua: 'Крок 4: Оберіть режим:',
    de: 'Schritt 4: Wählen Sie den Modus:'
  };

  ctx.editMessageText(modeText[session.lang], {
    reply_markup: {
      inline_keyboard: [
        [{ text: '✈️ Only Flight', callback_data: 'mode_flight' }],
        [{ text: '🏨 Flight + Hotel', callback_data: 'mode_combo' }]
      ]
    }
  });
});

bot.action(/mode_(.+)/, async (ctx) => {
  const mode = ctx.match[1];
  const session = sessions[ctx.from.id];
  session.mode = mode;

  ctx.editMessageText('✅ Configuration Complete! Searching for the best deals now...');
  await generateAndSendDeal(session.cityId, 'beach', mode);
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

