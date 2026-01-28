const notionService = require('./NotionService');
const { COMMANDS, MESSAGES } = require('./constants');
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
    await notionService.addExpense({
        amount: Number(expenseData.amount),
        category,
        description: expenseData.description,
        date: moment().tz(TIMEZONE).toISOString()
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
    const response = await notionService.summarizeExpenses();
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
    parseExpense
};
