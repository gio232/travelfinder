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

// Глобальный логгер всех входящих событий
bot.use((ctx, next) => {
  console.log(`📥 [Telegram] Update received: ${ctx.updateType} from ${ctx.from ? ctx.from.id : 'unknown'}`);
  return next();
});

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
  const session = sessions[ctx.from.id] || { lang: 'en', cityId: 'BER' };
  session.mode = mode;

  ctx.editMessageText('✅ Configuration Complete! Searching for the best deals now...');
  // Передаем id пользователя, чтобы бот знал, кому слать результат
  await generateAndSendDeal(session.cityId, 'beach', mode, ctx.from.id);
});

bot.command('ping', (ctx) => {
  ctx.reply('📡 Nomad OS is Online and Connected!');
});

async function generateAndSendDeal(specificHubId = null, vacationType = null, mode = 'flight', targetChatId = null) {
  const finalChatId = targetChatId || CHAT_ID;
  console.log(`🔍 [Task] Searching for ${vacationType || 'Any'}... Mode: ${mode}, Target: ${finalChatId}`);
  
  const hubsToSearch = specificHubId ? [{ id: specificHubId, name: 'Selected City' }] : [{ id: 'BER', name: 'Berlin' }];
  
  for (const hub of hubsToSearch) {
    try {
      const dest = 'ANY';
      const apiUrl = `https://${FLY_SCRAPER_HOST}/v2/flights/search-roundtrip`;
      
      console.log(`📡 [Network] Calling Fly-Scraper: ${hub.id} -> ${dest}`);
      
      const response = await axios.get(apiUrl, {
        params: { originSkyId: hub.id, destinationSkyId: dest },
        headers: { 'x-rapidapi-key': RAPID_API_KEY, 'x-rapidapi-host': FLY_SCRAPER_HOST }
      });

        // ЛОГИРУЕМ СТРУКТУРУ (чтобы понять, где лежат данные)
        console.log('📡 API Response Keys:', Object.keys(response.data));
        
        // У Fly-Scraper данные обычно лежат в response.data.itineraries или response.data.data.itineraries
        const itineraries = response.data.itineraries || (response.data.data ? response.data.data.itineraries : null);

        if (!itineraries || itineraries.length === 0) {
          console.log(`⚠️ No itineraries found for ${hub.id}.`);
          continue;
        }

        const flight = itineraries[0];
        const destinationName = flight.legs[0].destination.name;
        
        console.log(`✅ Found flight to ${destinationName}! Generating image...`);

        const htmlTemplate = fs.readFileSync(path.join(__dirname, 'ticket_template.html'), 'utf8');
        const isCombo = mode === 'combo';
        const flightPrice = flight.price.raw;
        const hotelPrice = isCombo ? 250 : 0;
        const totalPrice = flightPrice + hotelPrice;

        const image = await nodeHtmlToImage({
          html: htmlTemplate,
          content: {
            ORIGIN: hub.name,
            DESTINATION: destinationName,
            HOTEL_NAME: isCombo ? 'Elite Resort & Spa' : 'Flight Only',
            DEPARTURE_DATE: flight.legs[0].departure.split('T')[0],
            NIGHTS: '7',
            RATING: '4.9',
            PRICE: totalPrice,
            SAVINGS: isCombo ? '35' : '15'
          }
        });

        const userLang = 'en'; 
        const t = i18n[userLang];

        await bot.telegram.sendPhoto(finalChatId, { source: image }, {
          caption: `🔥 **${t.new_deal}**\n💰 Price: ${flight.price.formatted}${isCombo ? ' (+ Hotel)' : ''}\n📍 ${hub.id} ✈ ${destinationName}\n\n[Book Now](https://www.skyscanner.net)`,
          parse_mode: 'Markdown'
        });

        console.log(`🎉 Success! Message sent to ${finalChatId}`);
        break; 
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.warn('🚦 Rate limit hit (429). Sleeping for 1 minute...');
        await new Promise(resolve => setTimeout(resolve, 60000));
      } else {
        console.error(`❌ Error in generateAndSendDeal:`, error.message);
      }
    }
  }
}

// Запуск раз в 6 часов
setInterval(generateAndSendDeal, 1000 * 60 * 60 * 6);
// generateAndSendDeal(); // УДАЛЯЕМ АВТО-СТАРТ, чтобы не ловить 429 при деплое

bot.launch().then(() => {
  console.log('✅ Telegraf Bot is Polling and Ready!');
});
console.log('🚀 Nomad OS Server is starting...');

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

    // Безопасное извлечение данных
    const itineraries = flightResponse.data.itineraries || (flightResponse.data.data ? flightResponse.data.data.itineraries : null);

    if (!itineraries) {
      return res.json({ success: false, error: 'No deals found' });
    }

    const deals = itineraries.slice(0, 5).map(f => {
      const flightPrice = f.price.raw;
      const isCombo = type === 'combo';
      
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

