// Configuration settings for the WhatsApp bot
require('dotenv').config();
const { LocalAuth } = require('whatsapp-web.js');

// Export configuration values
module.exports = {
    // WhatsApp client options
    clientOptions: {
        authStrategy: new LocalAuth({
            clientId: 'wa-bot',
            dataPath: './.wwebjs_auth'
        }),
        puppeteerOptions: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    }
};