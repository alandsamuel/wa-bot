const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config');
const { COMMANDS, REACTIONS, MESSAGES } = require('./constants');
const {
    pendingExpenses,
    handleListCommand,
    handleTodayCommand,
    handleNotionLinkCommand,
    handleCategoryInput,
    handleExpenseInput,
    handleSummarizeCommand
} = require('./handler');
const { initializeCron, stopCron } = require('./cron');

const client = new Client(config.clientOptions);

client.on('ready', () => {
    console.log(MESSAGES.BOT_READY);
    console.log(MESSAGES.BOT_PHONE, client.info.wid.user);
    console.log(MESSAGES.BOT_PLATFORM, client.info.platform);
    console.log(MESSAGES.LISTENING);

    // Initialize cron job for daily summary
    initializeCron(client);
});

client.on('auth_failure', (message) => {
    console.log(MESSAGES.AUTH_FAILURE + ' ' + message);
});

client.on('disconnected', (reason) => {
    console.log(MESSAGES.DISCONNECTED, reason);
    stopCron();
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('message', async (message) => {
    console.log(MESSAGES.MESSAGE_RECEIVED);

    if (!message.from.includes(process.env.WHITELISTED_NUMBERS)) return;

    message.react(REACTIONS.WATCHING);

    if (message.fromMe) return;

    const text = message.body;
    const lowerText = text.toLowerCase();
    const userId = message.from;

    try {
        // Handle pending expense category input
        if (pendingExpenses.has(userId)) {
            console.log(MESSAGES.HANDLING_CATEGORY);
            await handleCategoryInput(message, userId, text);
            return;
        }

        // Route commands using switch case
        switch (lowerText) {
            case COMMANDS.LIST:
                await handleListCommand(message);
                break;
            case COMMANDS.TODAY:
                await handleTodayCommand(message);
                break;
            case COMMANDS.NOTION_LINK:
                await handleNotionLinkCommand(message);
                break;
            case "!summarize":
                await handleSummarizeCommand(message);
                break;
            default:
                // Try to parse as expense if no command matched
                await handleExpenseInput(message, userId, text);
        }
    } catch (error) {
        console.error(MESSAGES.ERROR_HANDLER, error);
        await message.reply(MESSAGES.ERROR_MESSAGE.replace('{error}', error.message));
    }
});


client.initialize();
