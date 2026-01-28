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
    handleSummarizeCommand,
    handleReceiptConfirmation
} = require('./handler');
const { initializeCron, stopCron } = require('./cron');
const { handleReceiptMessage } = require('./receipt');
const notionService = require('./NotionService');

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
            const expenseData = pendingExpenses.get(userId);

            // Handle receipt confirmation (asking for description)
            if (expenseData.isReceipt && expenseData.phase === 'confirmDescription') {
                console.log('Handling receipt description confirmation');
                await handleReceiptConfirmation(message, userId, text);
                return;
            }

            // Handle category input (for both receipts and manual expenses)
            console.log(MESSAGES.HANDLING_CATEGORY);
            await handleCategoryInput(message, userId, text);
            return;
        }

        console.log('Processing command or expense input...');
        await message.react('⏳');

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
                // Try to process as receipt if image is sent
                const receiptResult = await handleReceiptMessage(message);
                if (receiptResult) {
                    // Show receipt details and ask to confirm description
                    await message.reply(receiptResult.formattedMessage);

                    // Get categories for the receipt flow
                    const categories = await notionService.getCategories();

                    // Store receipt data for pending confirmation
                    pendingExpenses.set(userId, {
                        ...receiptResult.receiptForNotion,
                        amount: receiptResult.receiptForNotion.amount,
                        categories,
                        isReceipt: true,
                        phase: 'confirmDescription'
                    });

                    // Ask user to confirm or modify the description
                    const descriptionPrompt = `📝 What will we call this transaction are :\n(or type 'cancel' to abort)`;
                    await message.reply(descriptionPrompt);
                } else {
                    // Try to parse as expense if not an image
                    await handleExpenseInput(message, userId, text);
                }
        }

        console.log('Finished command or expense input...');
        await message.react('✅');
    } catch (error) {
        console.error(MESSAGES.ERROR_HANDLER, error);
        await message.reply(MESSAGES.ERROR_MESSAGE.replace('{error}', error.message));
    }
});


client.initialize();
