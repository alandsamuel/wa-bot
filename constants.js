// Commands
const COMMANDS = {
    LIST: '!list',
    CANCEL: 'cancel',
    NOTION_LINK: '!notionlink'
};

// Reactions
const REACTIONS = {
    WATCHING: '👀'
};

// Notion Database Properties
const NOTION_PROPERTIES = {
    NAME: 'Name',
    AMOUNT: 'Amount',
    CATEGORY: 'Category',
    DATE: 'Date'
};

// Date Locale
const DATE_LOCALE = 'en-US';

const NOTION_LINK = process.env.NOTION_LINK;

// Messages and Prompts
const MESSAGES = {
    // System messages
    BOT_READY: 'Client is Ready! Bot is running...',
    BOT_PHONE: 'Bot phone number:',
    BOT_PLATFORM: 'Bot platform:',
    LISTENING: '✅ Bot is now LISTENING for incoming messages...',
    AUTH_FAILURE: 'AUTHENTICATION FAILURE:',
    DISCONNECTED: 'Bot Disconnected:',
    MESSAGE_RECEIVED: '=== MESSAGE RECEIVED ===',
    NOTION_LINK_RESPONSE: `Here is your Notion link: ${NOTION_LINK}`,

    // Expense handling
    HANDLING_LIST: 'Handling expense list command',
    HANDLING_CATEGORY: 'Handling category input for pending expense',
    EXPENSE_DETECTED: 'Expense detected:',
    CATEGORIES_FETCHED: 'Available categories:',
    INVALID_CATEGORY: 'Invalid category entered:',
    ADDING_EXPENSE: 'Adding expense with category:',
    NO_EXPENSE_DETECTED: 'No expense pattern detected, showing help',

    // User responses
    EXPENSE_CANCELLED: '❌ Expense addition cancelled.',
    INVALID_CATEGORY_RESPONSE: '❌ Invalid category!\n\nAvailable categories:\n{categories}\n\nPlease enter a valid category:\n\nor type \'cancel\' to abort.',
    EXPENSE_ADDED: '✅ Expense added: {amount} - {description}\n📁 Category: {category}',
    EXPENSE_DETECTED_PROMPT: '📝 Expense detected: {description}\n💰 Amount: {amount}\n\nAvailable categories:\n{categories}\n\nPlease enter the category: \n or type \'cancel\' to abort.',
    HELP_MESSAGE: '💡 Commands:\n• Type expense with amount: "makan nasi padang 20000"\n• !list - List recent expenses\n• !notionlink - Get Notion Data link',

    // List expenses
    NO_EXPENSES_FOUND: 'No expenses found.',
    EXPENSES_HEADER: 'Here are your recent expenses:',
    EXPENSES_FOR_MONTH: '📊 Expenses for monthly pay cycle {monthYear}',
    EXPENSE_ITEM: '- {name}: Rp. {amount} on {date}',
    TOTAL_EXPENSES: '\n💰 Total: Rp. {total}',

    // Errors
    ERROR_MESSAGE: 'Error: {error}',
    ERROR_HANDLER: 'Error in message handler:',
    FAILED_RETRIEVE_EXPENSES: 'Failed to retrieve expenses from Notion',
    FAILED_ADD_EXPENSE: 'Failed to add expense to Notion',
    FAILED_FETCH_CATEGORIES: 'Failed to fetch categories from Notion'
};

// Date Format Options
const DATE_FORMAT_OPTIONS = {
    month: 'long',
    year: 'numeric'
};

module.exports = {
    COMMANDS,
    REACTIONS,
    NOTION_PROPERTIES,
    DATE_LOCALE,
    MESSAGES,
    DATE_FORMAT_OPTIONS
};
