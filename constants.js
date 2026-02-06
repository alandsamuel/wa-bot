// Commands
const COMMANDS = {
    LIST: '!list',
    TODAY: '!today',
    CANCEL: 'cancel',
    NOTION_LINK: '!notionlink',
    PO: '!po',
    WISHLIST: '!wishlist'
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
    FULL_PRICE: 'Price',
    DP: 'DP',
    PELUNAS: 'Pelunas',
    STATUS_LUNAS: 'Status Lunas',
    ARRIVED: 'Arrived ?'
};

// Wishlist Database Properties
const WISHLIST_PROPERTIES = {
    NAME: 'Name',
    PRICE: 'Price',
    URL: 'URL',
    ATTACHMENT: 'Attachment',
    NOTE: 'Note',
    PRIORITY: 'Priority',
    CATEGORY: 'Category',
    LAST_EDITED: 'Last Edited'
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
    HELP_MESSAGE: '💡 Commands:\n• Type expense with amount: "makan nasi padang 20000"\n• !list - List monthly expenses\n• !today - Today\'s expenses\n• !summarize - Monthly summary by category\n• !po - Add pre-order (PO)\n• !po list - List all pre-orders\n• !wishlist - Add wishlist item\n• !wishlist list - List all wishlist items\n• !notionlink - Get Notion database link\n• Send receipt image - Process receipt with Veryfi\n• cancel - Cancel pending input',

    // Wishlist
    WISHLIST_WELCOME: '🛍️ Welcome to Wishlist!\n\nPlease provide the following details:\n\n1️⃣ Item Name: ',
    WISHLIST_ASKING_PRICE: '2️⃣ Price (e.g., 500000 or 500k): ',
    WISHLIST_ASKING_URL: '3️⃣ Product URL (or type "skip"): ',
    WISHLIST_ASKING_NOTE: '4️⃣ Note (or type "skip"): ',
    WISHLIST_ASKING_PRIORITY: '5️⃣ Priority (or type "skip"): ',
    WISHLIST_ASKING_CATEGORY: '6️⃣ Category (or type "skip"): ',
    WISHLIST_ADDED: '✅ Wishlist item added successfully!\n\n🛍️ Item: {name}\n💰 Price: Rp. {price}',
    WISHLIST_CANCELLED: '❌ Wishlist addition cancelled.',
    WISHLIST_DUPLICATE: '❌ An item with the name "{name}" already exists in your wishlist. Please use a different name.',
    WISHLIST_INVALID_PRICE: '❌ Please enter a valid number for Price (e.g., 500000 or 500k)',
    NO_WISHLIST_ITEMS_FOUND: 'No wishlist items found.',
    WISHLIST_ITEMS_HEADER: 'Here are your wishlist items:',
    WISHLIST_ITEM: '🛍️ {name}\n💰 Price: Rp. {price}\n{optionalFields}',
    FAILED_RETRIEVE_WISHLIST: 'Failed to retrieve wishlist items from Notion',
    FAILED_ADD_WISHLIST: 'Failed to add wishlist item to Notion',
    FAILED_CHECK_DUPLICATE_WISHLIST: 'Failed to check for duplicate wishlist names',

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
    PO_ASKING_RELEASE_DATE: '4️⃣ Release Date (YYYY-MM-DD, Q1 2026 or type "skip"): ',
    PO_ASKING_FULL_PRICE: '5️⃣ Full Price (e.g., 500000 or 500k): ',
    PO_ASKING_DP: '6️⃣ Down Payment/DP (e.g., 100000 or 100k): ',
    PO_ADDED: '✅ Pre-order added successfully!\n\n📦 Item: {name}\n🏪 Toko: {toko}\n💰 Full Price: Rp. {fullPrice}',
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
    WISHLIST_PROPERTIES,
    DATE_LOCALE,
    MESSAGES,
    DATE_FORMAT_OPTIONS
};
