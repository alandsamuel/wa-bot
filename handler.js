const notionService = require('./NotionService');
const { COMMANDS, MESSAGES } = require('./constants');
const { parsePriceWithK } = require('./helper');

const moment = require('moment-timezone');

const TIMEZONE = 'Asia/Jakarta';
const pendingExpenses = new Map();

// Command handlers
async function handleListCommand(message) {
    console.log(MESSAGES.HANDLING_LIST);
    const response = await notionService.listExpenses();
    await message.reply(response);
}

async function handleTodayCommand(message) {
    console.log('Handling today command');
    const response = await notionService.todayExpenses();
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

    // Check if this is a receipt or manual expense
    if (expenseData.isReceipt) {
        // For receipts, store with extracted data
        await notionService.addExpense({
            amount: expenseData.amount,
            category,
            description: expenseData.description,
            date: expenseData.date
        });
        console.log('Receipt stored successfully in Notion');
    } else {
        // For manual expenses
        await notionService.addExpense({
            amount: Number(expenseData.amount),
            category,
            description: expenseData.description,
            date: moment().tz(TIMEZONE).toISOString()
        });
    }

    const confirmMessage = expenseData.isReceipt
        ? MESSAGES.RECEIPT_STORED.replace('{vendor}', expenseData.description).replace('{amount}', expenseData.amount).replace('{category}', category)
        : MESSAGES.EXPENSE_ADDED.replace('{amount}', expenseData.amount).replace('{description}', expenseData.description).replace('{category}', category);

    await message.reply(confirmMessage);
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

async function handleReceiptConfirmation(message, userId, text) {
    const receiptData = pendingExpenses.get(userId);

    if (text === COMMANDS.CANCEL) {
        console.log('Receipt storage cancelled by user');
        await message.reply(MESSAGES.EXPENSE_CANCELLED);
        pendingExpenses.delete(userId);
        return;
    }

    // Text is the confirmation for description
    const confirmedDescription = text.trim();
    console.log('Receipt description confirmed:', confirmedDescription);

    // Update description if user provided a different one
    receiptData.description = confirmedDescription;

    // Move to category selection phase
    const categoryPrompt = MESSAGES.EXPENSE_DETECTED_PROMPT
        .replace('{description}', receiptData.description)
        .replace('{amount}', receiptData.amount)
        .replace('{categories}', receiptData.categories.join('\n'));

    // Change the phase to category selection
    receiptData.phase = 'selectCategory';

    await message.reply(categoryPrompt);
}

function parseExpense(text) {
    const match = text.match(/(.+?)\s+(\d+(?:,\d+|\.\d+)?[k|K]?)$/i);
    if (match) {
        const amount = parsePriceWithK(match[2]);
        const description = match[1].trim();
        return { description, amount };
    }
    return null;
}

async function handleSummarizeCommand(message) {
    console.log('Handling summarize command');
    const response = await notionService.summarizeExpenses();
    await message.reply(response);
}

async function handleListPOsCommand(message) {
    console.log('Handling list POs command');
    const response = await notionService.listPOs();
    await message.reply(response);
}

module.exports = {
    pendingExpenses,
    handleListCommand,
    handleTodayCommand,
    handleNotionLinkCommand,
    handleCategoryInput,
    handleExpenseInput,
    handleSummarizeCommand,
    handleReceiptConfirmation,
    handleListPOsCommand
}
