// Commands
const COMMANDS = {
    LIST: '!list',
    TODAY: '!today',
    CANCEL: 'cancel',
    NOTION_LINK: '!notionlink',
    PO: '!po'
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

// PO Tracker Database Properties
const PO_PROPERTIES = {
    NAME: 'Name',
    TOKO: 'Toko',
    LINKS: 'Links',
    RELEASE_DATE: 'Release Date',
    FULL_PRICE: 'Full Price',
    DP: 'DP',
    PELUNAS: 'Pelunas',
    STATUS_LUNAS: 'Status Lunas',
    ARRIVED: 'Arrived ?'
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
    HELP_MESSAGE: '💡 Commands:\n• Type expense with amount: "makan nasi padang 20000"\n• !list - List recent expenses\n• !today - Today\'s expenses\n• !summarize - Monthly summary\n• !notionlink - Get Notion Data link\n• Send receipt image - Process receipt with Veryfi',

    // List expenses
    NO_EXPENSES_FOUND: 'No expenses found.',
    EXPENSES_HEADER: 'Here are your recent expenses:',
    EXPENSES_FOR_MONTH: '📊 Expenses for monthly pay cycle {monthYear}',
    EXPENSES_FOR_TODAY: '📊 Expenses for today ({date})',
    EXPENSE_ITEM: '- {name}: Rp. {amount} on {date}',
    TOTAL_EXPENSES: '\n💰 Total: Rp. {total}',

    // Receipt handling
    RECEIPT_PROCESSING: '⏳ Processing receipt...',
    RECEIPT_PROCESSED: '✅ Receipt processed successfully!',
    RECEIPT_ERROR: '❌ Error processing receipt:',
    RECEIPT_STORED: '✅ Receipt stored: {vendor} - Rp. {amount}\n📁 Category: {category}',

    // Errors
    ERROR_MESSAGE: 'Error: {error}',
    ERROR_HANDLER: 'Error in message handler:',
    FAILED_RETRIEVE_EXPENSES: 'Failed to retrieve expenses from Notion',
    FAILED_ADD_EXPENSE: 'Failed to add expense to Notion',
    FAILED_FETCH_CATEGORIES: 'Failed to fetch categories from Notion',

    // PO Tracker
    PO_WELCOME: '📦 Welcome to PO Tracker!\n\nPlease provide the following details:\n\n1️⃣ Item Name: ',
    PO_ASKING_TOKO: '2️⃣ Store/Toko: ',
    PO_ASKING_LINKS: '3️⃣ Product Links (or type "skip"): ',
    PO_ASKING_RELEASE_DATE: '4️⃣ Release Date (YYYY-MM-DD or type "skip"): ',
    PO_ASKING_FULL_PRICE: '5️⃣ Full Price: ',
    PO_ASKING_DP: '6️⃣ Down Payment (DP): ',
    PO_ASKING_PELUNAS: '7️⃣ Remaining Payment (Pelunas): ',
    PO_ASKING_STATUS_LUNAS: '8️⃣ Payment Status (Lunas/Pending/Partial or type "skip"): ',
    PO_ASKING_ARRIVED: '9️⃣ Has it arrived? (Yes/No or type "skip"): ',
    PO_ADDED: '✅ Pre-order added successfully!\n\n📦 Item: {name}\n🏪 Toko: {toko}\n💰 Full Price: {fullPrice}',
    PO_CANCELLED: '❌ Pre-order addition cancelled.',
    NO_POS_FOUND: 'No pre-orders found.',
    POS_HEADER: 'Here are your ongoing pre-orders:',
    PO_ITEM: '📦 {name}\n🏪 {toko}\n💰 Full: Rp. {fullPrice} | DP: Rp. {dp} | Pelunas: Rp. {pelunas}\n📅 Release: {releaseDate}\n✈️ Arrived: {arrived}\n',
    FAILED_RETRIEVE_POS: 'Failed to retrieve pre-orders from Notion',
    FAILED_ADD_PO: 'Failed to add pre-order to Notion'
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
    PO_PROPERTIES,
    DATE_LOCALE,
    MESSAGES,
    DATE_FORMAT_OPTIONS
};
