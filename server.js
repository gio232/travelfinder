const axios = require('axios');
const { Telegraf } = require('telegraf');
const nodeHtmlToImage = require('node-html-to-image');
const fs = require('fs');
const path = require('path');

// Load Localizations
const i18n = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales.json'), 'utf8'));

// --- CONFIG ---
const RAPID_API_KEY = '297db5bccfmsh2a6dee75f1038d2p165a62jsn91af72450106';
const TELEGRAM_BOT_TOKEN = '8601612357:AAGntRC84iVcnx2XyIbETUtIX8G38F-SKZQ';
const CHAT_ID = '1157863036';

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

// --- DB HELPERS (Mock for Supabase) ---
const db = {
  async getUser(tgId) { return { lang: 'en', origin: 'BER' }; }, // Mock fetch
  async updateUserLang(tgId, lang) { console.log(`DB: Updated ${tgId} to ${lang}`); },
  async updateUserOrigin(tgId, city) { console.log(`DB: Updated ${tgId} to ${city}`); }
};

// --- TELEGRAM INTERFACE ---
bot.start((ctx) => {
  ctx.reply('🌍 Welcome to Nomad OS! Use /settings to configure your filters.');
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

// Handle Origin City Selection
bot.action('set_origin', (ctx) => {
  ctx.reply('Select your primary departure hub:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Berlin 🇩🇪', callback_data: 'city_BER' }, { text: 'Warsaw 🇵🇱', callback_data: 'city_WAW' }],
        [{ text: 'Paris 🇫🇷', callback_data: 'city_PAR' }, { text: 'Prague 🇨🇿', callback_data: 'city_PRG' }],
        [{ text: 'London 🇬🇧', callback_data: 'city_LON' }, { text: 'Munich 🇩🇪', callback_data: 'city_MUC' }]
      ]
    }
  });
});

bot.action(/city_(.+)/, async (ctx) => {
  const cityCode = ctx.match[1];
  await db.updateUserOrigin(ctx.from.id, cityCode);
  ctx.answerCbQuery(`Origin set to ${cityCode}`);
  ctx.reply(`✈️ Departure city updated to **${cityCode}**! Now you will receive deals from this hub.`);
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
async function generateAndSendDeal() {
  console.log('🔍 Hunting for fresh combos...');
  
  try {
    const flightResponse = await axios.get('https://sky-scrapper.p.rapidapi.com/api/v2/flights/searchFlightsComplete', {
      params: { originSkyId: 'LOND', destinationSkyId: 'NYCA', originEntityId: '27544008', destinationEntityId: '27537542', currency: 'USD' },
      headers: { 'x-rapidapi-key': RAPID_API_KEY, 'x-rapidapi-host': 'sky-scrapper.p.rapidapi.com' }
    });

    const flight = flightResponse.data.data.itineraries[0];
    if (!flight) return console.log('No deals found right now.');

    const htmlTemplate = fs.readFileSync(path.join(__dirname, 'ticket_template.html'), 'utf8');
    
    const image = await nodeHtmlToImage({
      html: htmlTemplate,
      content: {
        ORIGIN: 'London',
        DESTINATION: 'New York',
        HOTEL_NAME: 'Premium Selection Hotel',
        DEPARTURE_DATE: flight.legs[0].departure.split('T')[0],
        NIGHTS: '7',
        RATING: '4.8',
        PRICE: flight.price.raw,
        SAVINGS: '35'
      }
    });

    const userLang = 'en'; 
    const t = i18n[userLang];

    await bot.telegram.sendPhoto(CHAT_ID, { source: image }, {
      caption: `🔥 **${t.new_deal}**\n💰 ${t.price}: ${flight.price.formatted}\n📍 Route: London ✈ New York\n\n[${t.checkout}](https://www.skyscanner.net)`,
      parse_mode: 'Markdown'
    });

    console.log('✅ Deal sent to Telegram!');
  } catch (error) {
    console.error('❌ Error in generator:', error.message);
  }
}

// Запуск раз в 6 часов
setInterval(generateAndSendDeal, 1000 * 60 * 60 * 6);
generateAndSendDeal();

bot.launch();
console.log('🚀 Nomad OS Server is running...');

