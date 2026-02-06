require('dotenv').config();

// Mock the NotionService to avoid API calls
jest.mock('../NotionService', () => {
    return {
        checkDuplicateWishlistName: jest.fn(),
        listWishlistItems: jest.fn(),
        addWishlistItem: jest.fn()
    };
});

const notionService = require('../NotionService');
const {
    handleWishlistCommand,
    handleWishlistInput,
    handleListWishlistCommand,
    pendingWishlistItems
} = require('../handler');
const { MESSAGES, COMMANDS } = require('../constants');

describe('Wishlist Feature', () => {
    // Mock message object
    const createMockMessage = () => ({
        reply: jest.fn().mockResolvedValue({})
    });

    beforeEach(() => {
        jest.clearAllMocks();
        pendingWishlistItems.clear();
    });

    describe('handleWishlistCommand', () => {
        test('should initialize wishlist form and prompt for item name', async () => {
            const message = createMockMessage();
            const userId = 'user123';

            await handleWishlistCommand(message, userId);

            expect(pendingWishlistItems.has(userId)).toBe(true);
            expect(message.reply).toHaveBeenCalledWith(MESSAGES.WISHLIST_WELCOME);
        });
    });

    describe('handleWishlistInput', () => {
        test('should handle name input and move to price prompt', async () => {
            const message = createMockMessage();
            const userId = 'user123';
            notionService.checkDuplicateWishlistName.mockResolvedValue(false);

            // Initialize wishlist
            await handleWishlistCommand(message, userId);
            message.reply.mockClear();

            // Input name
            await handleWishlistInput(message, userId, 'MacBook Pro');

            expect(notionService.checkDuplicateWishlistName).toHaveBeenCalledWith('MacBook Pro');
            expect(message.reply).toHaveBeenCalledWith(MESSAGES.WISHLIST_ASKING_PRICE);
            expect(pendingWishlistItems.get(userId).name).toBe('MacBook Pro');
        });

        test('should reject duplicate wishlist name', async () => {
            const message = createMockMessage();
            const userId = 'user123';
            notionService.checkDuplicateWishlistName.mockResolvedValue(true);

            // Initialize wishlist
            await handleWishlistCommand(message, userId);
            message.reply.mockClear();

            // Input duplicate name
            await handleWishlistInput(message, userId, 'MacBook Pro');

            expect(message.reply).toHaveBeenCalledWith(MESSAGES.WISHLIST_DUPLICATE.replace('{name}', 'MacBook Pro'));
            // Wishlist should still be pending (not moved to next step)
            expect(pendingWishlistItems.get(userId).name).toBeUndefined();
        });

        test('should handle price input and move to URL prompt', async () => {
            const message = createMockMessage();
            const userId = 'user123';
            notionService.checkDuplicateWishlistName.mockResolvedValue(false);

            // Initialize and set name
            await handleWishlistCommand(message, userId);
            await handleWishlistInput(message, userId, 'iPhone 15');
            message.reply.mockClear();

            // Input price with k suffix
            await handleWishlistInput(message, userId, '15000k');

            expect(message.reply).toHaveBeenCalledWith(MESSAGES.WISHLIST_ASKING_URL);
            expect(pendingWishlistItems.get(userId).price).toBe(15000000);
        });

        test('should reject invalid price format', async () => {
            const message = createMockMessage();
            const userId = 'user123';
            notionService.checkDuplicateWishlistName.mockResolvedValue(false);

            // Initialize and set name
            await handleWishlistCommand(message, userId);
            await handleWishlistInput(message, userId, 'Watch');
            message.reply.mockClear();

            // Input invalid price
            await handleWishlistInput(message, userId, 'invalid_price');

            expect(message.reply).toHaveBeenCalledWith(MESSAGES.WISHLIST_INVALID_PRICE);
            // Should stay at price step
            expect(pendingWishlistItems.get(userId).price).toBeUndefined();
        });

        test('should handle skip for optional URL field', async () => {
            const message = createMockMessage();
            const userId = 'user123';
            notionService.checkDuplicateWishlistName.mockResolvedValue(false);

            // Initialize and go through name and price
            await handleWishlistCommand(message, userId);
            await handleWishlistInput(message, userId, 'Monitor');
            await handleWishlistInput(message, userId, '3000k');
            message.reply.mockClear();

            // Skip URL
            await handleWishlistInput(message, userId, 'skip');

            expect(message.reply).toHaveBeenCalledWith(MESSAGES.WISHLIST_ASKING_NOTE);
            expect(pendingWishlistItems.get(userId).url).toBe('skip');
        });

        test('should handle skip for optional Note field', async () => {
            const message = createMockMessage();
            const userId = 'user123';
            notionService.checkDuplicateWishlistName.mockResolvedValue(false);

            // Initialize and go through name, price, url
            await handleWishlistCommand(message, userId);
            await handleWishlistInput(message, userId, 'Keyboard');
            await handleWishlistInput(message, userId, '500k');
            await handleWishlistInput(message, userId, 'https://example.com');
            message.reply.mockClear();

            // Skip Note
            await handleWishlistInput(message, userId, 'skip');

            expect(message.reply).toHaveBeenCalledWith(MESSAGES.WISHLIST_ASKING_PRIORITY);
            expect(pendingWishlistItems.get(userId).note).toBe('skip');
        });

        test('should handle skip for optional Priority field', async () => {
            const message = createMockMessage();
            const userId = 'user123';
            notionService.checkDuplicateWishlistName.mockResolvedValue(false);

            // Initialize and go through name, price, url, note
            await handleWishlistCommand(message, userId);
            await handleWishlistInput(message, userId, 'Mouse');
            await handleWishlistInput(message, userId, '250k');
            await handleWishlistInput(message, userId, 'https://example.com/mouse');
            await handleWishlistInput(message, userId, 'Wireless mouse');
            message.reply.mockClear();

            // Skip Priority
            await handleWishlistInput(message, userId, 'skip');

            expect(message.reply).toHaveBeenCalledWith(MESSAGES.WISHLIST_ASKING_CATEGORY);
            expect(pendingWishlistItems.get(userId).priority).toBe('skip');
        });

        test('should complete wishlist addition with all fields', async () => {
            const message = createMockMessage();
            const userId = 'user123';
            notionService.checkDuplicateWishlistName.mockResolvedValue(false);
            notionService.addWishlistItem.mockResolvedValue('✅ Wishlist item added');

            // Complete full form
            await handleWishlistCommand(message, userId);
            await handleWishlistInput(message, userId, 'Sony Headphones');
            await handleWishlistInput(message, userId, '1500k');
            await handleWishlistInput(message, userId, 'https://example.com/headphones');
            await handleWishlistInput(message, userId, 'Noise cancelling');
            await handleWishlistInput(message, userId, 'High');
            message.reply.mockClear();

            // Final input - category
            await handleWishlistInput(message, userId, 'Electronics');

            expect(notionService.addWishlistItem).toHaveBeenCalledWith({
                name: 'Sony Headphones',
                price: 1500000,
                url: 'https://example.com/headphones',
                note: 'Noise cancelling',
                priority: 'High',
                category: 'Electronics'
            });

            expect(message.reply).toHaveBeenCalledWith(
                MESSAGES.WISHLIST_ADDED
                    .replace('{name}', 'Sony Headphones')
                    .replace('{price}', 1500000)
            );

            // Wishlist should be cleared after completion
            expect(pendingWishlistItems.has(userId)).toBe(false);
        });

        test('should cancel wishlist addition with cancel command', async () => {
            const message = createMockMessage();
            const userId = 'user123';
            notionService.checkDuplicateWishlistName.mockResolvedValue(false);

            // Initialize and start form
            await handleWishlistCommand(message, userId);
            await handleWishlistInput(message, userId, 'PlayStation 5');
            message.reply.mockClear();

            // Cancel
            await handleWishlistInput(message, userId, COMMANDS.CANCEL);

            expect(message.reply).toHaveBeenCalledWith(MESSAGES.WISHLIST_CANCELLED);
            expect(pendingWishlistItems.has(userId)).toBe(false);
        });

        test('should handle cancel at price step', async () => {
            const message = createMockMessage();
            const userId = 'user123';
            notionService.checkDuplicateWishlistName.mockResolvedValue(false);

            // Initialize and set name
            await handleWishlistCommand(message, userId);
            await handleWishlistInput(message, userId, 'Game Console');
            message.reply.mockClear();

            // Cancel at price step
            await handleWishlistInput(message, userId, COMMANDS.CANCEL);

            expect(message.reply).toHaveBeenCalledWith(MESSAGES.WISHLIST_CANCELLED);
            expect(pendingWishlistItems.has(userId)).toBe(false);
        });
    });

    describe('handleListWishlistCommand', () => {
        test('should list all wishlist items', async () => {
            const message = createMockMessage();
            const mockResponse = 'Here are your wishlist items:\n\n🛍️ MacBook Pro\n💰 Price: Rp. 15,000,000';
            notionService.listWishlistItems.mockResolvedValue(mockResponse);

            await handleListWishlistCommand(message);

            expect(notionService.listWishlistItems).toHaveBeenCalled();
            expect(message.reply).toHaveBeenCalledWith(mockResponse);
        });

        test('should handle empty wishlist', async () => {
            const message = createMockMessage();
            notionService.listWishlistItems.mockResolvedValue(MESSAGES.NO_WISHLIST_ITEMS_FOUND);

            await handleListWishlistCommand(message);

            expect(message.reply).toHaveBeenCalledWith(MESSAGES.NO_WISHLIST_ITEMS_FOUND);
        });
    });

    describe('pendingWishlistItems state management', () => {
        test('should maintain separate state for multiple users', async () => {
            const message1 = createMockMessage();
            const message2 = createMockMessage();
            const userId1 = 'user1';
            const userId2 = 'user2';

            notionService.checkDuplicateWishlistName.mockResolvedValue(false);

            // User 1 starts wishlist
            await handleWishlistCommand(message1, userId1);
            await handleWishlistInput(message1, userId1, 'Item1');

            // User 2 starts wishlist
            await handleWishlistCommand(message2, userId2);
            await handleWishlistInput(message2, userId2, 'Item2');

            // Verify separate states
            expect(pendingWishlistItems.get(userId1).name).toBe('Item1');
            expect(pendingWishlistItems.get(userId2).name).toBe('Item2');
        });
    });
});
