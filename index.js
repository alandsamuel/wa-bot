const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config');
const { COMMANDS, REACTIONS, MESSAGES } = require('./constants');
const { parsePriceWithK } = require('./helper');
const {
    pendingExpenses,
    pendingWishlistItems,
    handleListCommand,
    handleTodayCommand,
    handleNotionLinkCommand,
    handleCategoryInput,
    handleExpenseInput,
    handleSummarizeCommand,
    handleReceiptConfirmation,
    handleListPOsCommand,
    handleWishlistCommand,
    handleWishlistInput,
    handleListWishlistCommand
} = require('./handler');
const { initializeCron, stopCron } = require('./cron');
const { handleReceiptMessage } = require('./receipt');
const notionService = require('./NotionService');

const client = new Client(config.clientOptions);

const pendingPOs = new Map();

async function handlePOCommand(message, userId) {
    console.log('Handling PO command');
    pendingPOs.set(userId, {});
    await message.reply(MESSAGES.PO_WELCOME);
}

async function handlePOInput(message, userId, text) {
    const poData = pendingPOs.get(userId);

    if (text === COMMANDS.CANCEL) {
        console.log('PO addition cancelled by user');
        await message.reply(MESSAGES.PO_CANCELLED);
        pendingPOs.delete(userId);
        return;
    }

    // Determine which step we're at
    const step = Object.keys(poData).length;

    try {
        switch (step) {
            case 0:
                // Name
                poData.name = text;
                pendingPOs.set(userId, poData);
                await message.reply(MESSAGES.PO_ASKING_TOKO);
                break;

            case 1:
                // Toko
                poData.toko = text;
                pendingPOs.set(userId, poData);
                await message.reply(MESSAGES.PO_ASKING_LINKS);
                break;

            case 2:
                // Links
                poData.links = text;
                pendingPOs.set(userId, poData);
                await message.reply(MESSAGES.PO_ASKING_RELEASE_DATE);
                break;

            case 3:
                // Release Date
                poData.releaseDate = text;
                pendingPOs.set(userId, poData);
                await message.reply(MESSAGES.PO_ASKING_FULL_PRICE);
                break;

            case 4:
                // Full Price (with k support)
                const fullPrice = parsePriceWithK(text);
                if (isNaN(fullPrice)) {
                    await message.reply('❌ Please enter a valid number for Full Price (e.g., 500000 or 500k)');
                    return;
                }
                poData.fullPrice = fullPrice;
                pendingPOs.set(userId, poData);
                await message.reply(MESSAGES.PO_ASKING_DP);
                break;

            case 5:
                // DP (with k support) - Final step
                const dp = parsePriceWithK(text);
                if (isNaN(dp)) {
                    await message.reply('❌ Please enter a valid number for DP (e.g., 100000 or 100k)');
                    return;
                }
                poData.dp = dp;
                console.log('Adding PO:', poData);

                await notionService.addPO(poData);
                await message.reply(MESSAGES.PO_ADDED
                    .replace('{name}', poData.name)
                    .replace('{toko}', poData.toko)
                    .replace('{fullPrice}', poData.fullPrice));

                pendingPOs.delete(userId);
                break;
        }
    } catch (error) {
        console.error('Error in PO input handling:', error);
        await message.reply(MESSAGES.ERROR_MESSAGE.replace('{error}', error.message));
    }
}

async function handleListPOCommand(message) {
    console.log('Handling PO list command');
    const response = await notionService.listPOs();
    await message.reply(response);
}

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

        // Handle pending PO input
        if (pendingPOs.has(userId)) {
            console.log('Handling PO input for pending PO');
            await handlePOInput(message, userId, text);
            return;
        }

        // Handle pending wishlist input
        if (pendingWishlistItems.has(userId)) {
            console.log('Handling wishlist input for pending wishlist item');
            await handleWishlistInput(message, userId, text);
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
            case '!po list':
                await handleListPOsCommand(message);
                break;
            case COMMANDS.PO:
                await handlePOCommand(message, userId);
                break;
            case '!wishlist list':
                await handleListWishlistCommand(message);
                break;
            case COMMANDS.WISHLIST:
                await handleWishlistCommand(message, userId);
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


// Export PO handlers for testing and avoid starting the client when required as a module
module.exports = {
    handlePOCommand,
    handlePOInput,
    handleListPOCommand
};

if (require.main === module) {
    client.initialize();
}
