const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const notionService = require('./NotionService');
const config = require('./config');
const { COMMANDS, REACTIONS, MESSAGES, NOTION_LINK } = require('./constants');

const client = new Client(config.clientOptions);

const pendingExpenses = new Map();

// Command handlers
async function handleListCommand(message) {
    console.log(MESSAGES.HANDLING_LIST);
    const response = await notionService.listExpenses();
    await message.reply(response);
}

async function handleNotionLinkCommand(message) {
    console.log('Handling notion link command');
    await message.reply(MESSAGES.NOTION_LINK_RESPONSE);
}

async function handleCategoryInput(message, userId, text) {
    const expenseData = pendingExpenses.get(userId);
    const category = `${text.substring(0, 1).toUpperCase()}${text.substring(1, text.length).trim()}`;

    if (text === COMMANDS.CANCEL) {
        console.log('Expense addition cancelled by user');
        await message.reply(MESSAGES.EXPENSE_CANCELLED);
        pendingExpenses.delete(userId);
        return;
    }

    if (!expenseData.categories.includes(category)) {
        console.log(MESSAGES.INVALID_CATEGORY + category);
        await message.reply(MESSAGES.INVALID_CATEGORY_RESPONSE.replace('{categories}', expenseData.categories.join('\n')));
        return;
    }

    console.log(MESSAGES.ADDING_EXPENSE + category);
    await notionService.addExpense({
        amount: Number(expenseData.amount),
        category,
        description: expenseData.description,
        date: new Date().toISOString()
    });

    await message.reply(MESSAGES.EXPENSE_ADDED.replace('{amount}', expenseData.amount).replace('{description}', expenseData.description).replace('{category}', category));
    pendingExpenses.delete(userId);
}

async function handleExpenseInput(message, userId, text) {
    const expense = parseExpense(text);
    if (expense) {
        console.log(MESSAGES.EXPENSE_DETECTED, expense);
        const categories = await notionService.getCategories();
        console.log(MESSAGES.CATEGORIES_FETCHED, categories);
        pendingExpenses.set(userId, { ...expense, categories });
        await message.reply(MESSAGES.EXPENSE_DETECTED_PROMPT.replace('{description}', expense.description).replace('{amount}', expense.amount).replace('{categories}', categories.join('\n')));
    } else {
        console.log(MESSAGES.NO_EXPENSE_DETECTED);
        await message.reply(MESSAGES.HELP_MESSAGE);
    }
}

function parseExpense(text) {
    const match = text.match(/(.+?)\s+(\d+(?:,\d+|\.\d+)?[k|K]?)$/i);
    if (match) {
        let amount = match[2].replace(/,/g, '.');
        if (amount.toLowerCase().endsWith('k')) {
            amount = amount.slice(0, -1) + '000';
        }
        const description = match[1].trim();
        return { description, amount };
    }
    return null;
}

async function handleSummarizeCommand(message) {
    console.log('Handling summarize command');
    const { summary, totalExpenses } = await notionService.summarizeExpenses();
    let response = 'Expense Summary:\n';

    for (const [category, data] of Object.entries(summary)) {
        response += `Category: ${category}, Total: ${data.total}\n`;
    }
    response += `Total Expenses: ${totalExpenses}`;
    await message.reply(response);
}

client.on('ready', () => {
    console.log(MESSAGES.BOT_READY);
    console.log(MESSAGES.BOT_PHONE, client.info.wid.user);
    console.log(MESSAGES.BOT_PLATFORM, client.info.platform);
    console.log(MESSAGES.LISTENING);
});

client.on('auth_failure', (message) => {
    console.log(MESSAGES.AUTH_FAILURE + ' ' + message);
});

client.on('disconnected', (reason) => {
    console.log(MESSAGES.DISCONNECTED, reason);
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
            case COMMANDS.NOTION_LINK:
                await handleNotionLinkCommand(message);
                break;
            default:
                // Try to parse as expense if no command matched
                await handleExpenseInput(message, userId, text);
        }

        if (message.body.startsWith('!summarize')) {
            await handleSummarizeCommand(message);
        }
    } catch (error) {
        console.error(MESSAGES.ERROR_HANDLER, error);
        await message.reply(MESSAGES.ERROR_MESSAGE.replace('{error}', error.message));
    }
});


client.initialize();
