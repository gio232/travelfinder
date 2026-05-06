/**
 * TRAVEL INTEL - TELEGRAM BOT & NOTIFIER
 * Handles sending deals to the private channel.
 */

const { Telegraf } = require('telegraf');
// const nodeHtmlToImage = require('node-html-to-image'); // Tool to convert HTML to Image

const bot = new Telegraf('YOUR_TELEGRAM_BOT_TOKEN');
const ADMIN_CHAT_ID = 'YOUR_CHAT_ID';

async function sendComboToTelegram(deal) {
  const html = `...`; // Load ticket_template.html and replace placeholders

  /* 
  const image = await nodeHtmlToImage({
    html: html,
    content: {
      ORIGIN: deal.origin,
      DESTINATION: deal.destination,
      HOTEL_NAME: deal.hotel,
      DEPARTURE_DATE: deal.departureDate,
      NIGHTS: deal.nights,
      RATING: deal.rating,
      PRICE: deal.price,
      SAVINGS: deal.savings
    }
  });
  */

  const messageText = `
🔥 **NEW SMART COMBO FOUND!**
📍 **Destination**: ${deal.destination}
🏨 **Hotel**: ${deal.hotel}
⭐ **Rating**: ${deal.rating}
📅 **Dates**: ${deal.dates}
💰 **Total Price**: ${deal.price}€ (Saved ${deal.savings}%)

[View Deal on Portal](${deal.link})
  `;

  // bot.telegram.sendPhoto(ADMIN_CHAT_ID, { source: image }, { caption: messageText, parse_mode: 'Markdown' });
  console.log('Sending deal to Telegram...', messageText);
}

module.exports = { sendComboToTelegram };
