require('dotenv').config();

// We'll mock NotionService to avoid network calls and whatsapp-web.js Client to simulate messages
jest.mock('../../NotionService', () => ({
    listExpenses: jest.fn().mockResolvedValue({
        total: 100000,
        count: 2,
        expenses: [
            { id: '1', amount: 50000, category: 'Food', description: 'Lunch', date: '2026-02-07' },
            { id: '2', amount: 50000, category: 'Transport', description: 'Taxi', date: '2026-02-07' }
        ]
    }),
    todayExpenses: jest.fn().mockResolvedValue({
        total: 75000,
        count: 2,
        expenses: [
            { id: '1', amount: 50000, category: 'Food', description: 'Lunch at cafe', date: '2026-02-07' },
            { id: '2', amount: 25000, category: 'Transport', description: 'Taxi ride', date: '2026-02-07' }
        ]
    }),
    getCategories: jest.fn().mockResolvedValue(['Food', 'Transport', 'Shopping', 'Entertainment', 'Bills', 'Health', 'Other']),
    addExpense: jest.fn().mockResolvedValue({ success: true, id: 'new-123' }),
    summarizeExpenses: jest.fn().mockResolvedValue({
        total: 175000,
        count: 5,
        byCategory: { 'Food': 75000, 'Transport': 100000 },
        period: 'February 2026'
    }),
    listPOs: jest.fn().mockResolvedValue('Pre-order list retrieved successfully'),
    addPO: jest.fn().mockResolvedValue({ success: true, id: 'po-123' }),
    checkDuplicateWishlistName: jest.fn().mockResolvedValue(false),
    addWishlistItem: jest.fn().mockResolvedValue({ success: true, id: 'wish-123' }),
    listWishlistItems: jest.fn().mockResolvedValue('Wishlist items retrieved successfully')
}));

const NotionService = require('../../NotionService');

// Create a lightweight Message stub used by handlers
function createMessageStub(body, from = '12345@s.whatsapp.net') {
    return {
        body,
        from,
        fromMe: false,
        reply: jest.fn().mockResolvedValue(true),
        react: jest.fn().mockResolvedValue(true)
    };
}

// Import handlers directly
const handler = require('../../handler');
const index = require('../../index');

describe('E2E command handlers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.WHITELISTED_NUMBERS = '12345@s.whatsapp.net';
    });

    test('list command routes to handler and replies with list', async () => {
        const msg = createMessageStub('!list');
        await handler.handleListCommand(msg);

        expect(NotionService.listExpenses).toHaveBeenCalledTimes(1);
        expect(msg.reply).toHaveBeenCalled();
    });

    test('today command replies with today summary', async () => {
        const msg = createMessageStub('!today');
        await handler.handleTodayCommand(msg);

        expect(NotionService.todayExpenses).toHaveBeenCalledTimes(1);
        expect(msg.reply).toHaveBeenCalled();
        const reply = msg.reply.mock.calls[0][0];
        expect(reply).toContain('recent expenses');
    });

    test('summarize command replies with summary', async () => {
        const msg = createMessageStub('!summarize');
        await handler.handleSummarizeCommand(msg);

        expect(NotionService.summarizeExpenses).toHaveBeenCalledTimes(1);
        expect(msg.reply).toHaveBeenCalled();
        const reply = msg.reply.mock.calls[0][0];
        expect(reply).toContain('Summary');
    });

    test('PO flow: start and complete', async () => {
        const userId = '12345@s.whatsapp.net';
        const startMsg = createMessageStub('!po');

        // Start PO
        await index.handlePOCommand(startMsg, userId);
        expect(startMsg.reply).toHaveBeenCalled();

        // Provide name
        const nameMsg = createMessageStub('Awesome Widget', userId);
        await index.handlePOInput(nameMsg, userId, 'Awesome Widget');
        expect(nameMsg.reply).toHaveBeenCalled();

        // Toko
        const tokoMsg = createMessageStub('Toko X', userId);
        await index.handlePOInput(tokoMsg, userId, 'Toko X');
        expect(tokoMsg.reply).toHaveBeenCalled();

        // Links
        const linksMsg = createMessageStub('https://shop.example', userId);
        await index.handlePOInput(linksMsg, userId, 'https://shop.example');
        expect(linksMsg.reply).toHaveBeenCalled();

        // Release date
        const rdMsg = createMessageStub('2026-05-01', userId);
        await index.handlePOInput(rdMsg, userId, '2026-05-01');
        expect(rdMsg.reply).toHaveBeenCalled();

        // Full price
        const fpMsg = createMessageStub('500k', userId);
        await index.handlePOInput(fpMsg, userId, '500k');
        expect(fpMsg.reply).toHaveBeenCalled();

        // DP - final
        const dpMsg = createMessageStub('100k', userId);
        await index.handlePOInput(dpMsg, userId, '100k');
        expect(NotionService.addPO).toHaveBeenCalled();
        expect(dpMsg.reply).toHaveBeenCalled();
    });

    test('wishlist flow: start and complete', async () => {
        const userId = '12345@s.whatsapp.net';
        const start = createMessageStub('!wishlist', userId);
        await handler.handleWishlistCommand(start, userId);
        expect(start.reply).toHaveBeenCalled();

        const name = createMessageStub('New Gadget', userId);
        await handler.handleWishlistInput(name, userId, 'New Gadget');
        expect(name.reply).toHaveBeenCalled();

        const price = createMessageStub('1.2k', userId);
        await handler.handleWishlistInput(price, userId, '1.2k');
        expect(price.reply).toHaveBeenCalled();

        const url = createMessageStub('https://example', userId);
        await handler.handleWishlistInput(url, userId, 'https://example');
        expect(url.reply).toHaveBeenCalled();

        const note = createMessageStub('For birthday', userId);
        await handler.handleWishlistInput(note, userId, 'For birthday');
        expect(note.reply).toHaveBeenCalled();

        const priority = createMessageStub('High', userId);
        await handler.handleWishlistInput(priority, userId, 'High');
        expect(priority.reply).toHaveBeenCalled();

        const category = createMessageStub('Gadgets', userId);
        await handler.handleWishlistInput(category, userId, 'Gadgets');
        expect(NotionService.addWishlistItem).toHaveBeenCalled();
    });

    test('expense parsing and category selection flows', async () => {
        const userId = '12345@s.whatsapp.net';
        // Simulate sending an expense text
        const expenseMsg = createMessageStub('Lunch at cafe 25k', userId);
        await handler.handleExpenseInput(expenseMsg, userId, expenseMsg.body);

        // After detecting expense, pendingExpenses should have the entry
        const pending = handler.pendingExpenses.get(userId);
        expect(pending).toBeDefined();
        expect(pending.description).toContain('Lunch at cafe');

        // Simulate user selecting a category
        await handler.handleCategoryInput(expenseMsg, userId, 'Food');
        expect(NotionService.addExpense).toHaveBeenCalled();
        expect(handler.pendingExpenses.has(userId)).toBe(false);
    });

    test('!notionlink command', async () => {
        const msg = createMessageStub('!notionlink');
        await handler.handleNotionLinkCommand(msg);

        expect(msg.reply).toHaveBeenCalled();
        const reply = msg.reply.mock.calls[0][0];
        expect(reply).toContain('Notion link');
    });

    test('!po list command', async () => {
        const msg = createMessageStub('!po list');
        await index.handleListPOCommand(msg);

        expect(NotionService.listPOs).toHaveBeenCalledTimes(1);
        expect(msg.reply).toHaveBeenCalled();
    });

    test('!wishlist list command', async () => {
        const msg = createMessageStub('!wishlist list');
        await handler.handleListWishlistCommand(msg);

        expect(NotionService.listWishlistItems).toHaveBeenCalledTimes(1);
        expect(msg.reply).toHaveBeenCalled();
    });

    test('cancel expense flow', async () => {
        const userId = '12345@s.whatsapp.net';
        const expenseMsg = createMessageStub('Coffee 10k', userId);

        // Start expense
        await handler.handleExpenseInput(expenseMsg, userId, 'Coffee 10k');
        expect(handler.pendingExpenses.has(userId)).toBe(true);

        // Cancel it
        const cancelMsg = createMessageStub('cancel', userId);
        await handler.handleCategoryInput(cancelMsg, userId, 'cancel');

        expect(handler.pendingExpenses.has(userId)).toBe(false);
        expect(cancelMsg.reply).toHaveBeenCalledWith(expect.stringContaining('cancelled'));
    });

    test('cancel PO flow', async () => {
        const userId = '12345@s.whatsapp.net';
        const startMsg = createMessageStub('!po', userId);

        // Start PO
        await index.handlePOCommand(startMsg, userId);
        expect(startMsg.reply).toHaveBeenCalled();

        // Cancel it immediately
        const cancelMsg = createMessageStub('cancel', userId);
        await index.handlePOInput(cancelMsg, userId, 'cancel');

        expect(cancelMsg.reply).toHaveBeenCalledWith(expect.stringContaining('cancelled'));
    });

    test('cancel wishlist flow', async () => {
        const userId = '12345@s.whatsapp.net';
        const startMsg = createMessageStub('!wishlist', userId);

        // Start wishlist
        await handler.handleWishlistCommand(startMsg, userId);
        expect(startMsg.reply).toHaveBeenCalled();

        // Cancel it
        const cancelMsg = createMessageStub('cancel', userId);
        await handler.handleWishlistInput(cancelMsg, userId, 'cancel');

        expect(cancelMsg.reply).toHaveBeenCalledWith(expect.stringContaining('cancelled'));
    });
});
