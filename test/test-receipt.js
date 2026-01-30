require('dotenv').config();

// Mock the receipt module to avoid consuming API credits
jest.mock('../receipt', () => {
    const originalModule = jest.requireActual('../receipt');

    return {
        ...originalModule,
        processReceiptWithVeryfi: jest.fn().mockResolvedValue({
            id: 'mock-receipt-12345',
            vendor: {
                name: {
                    value: 'Test Grocery Store'
                }
            },
            total: {
                value: 125000
            },
            currency_code: {
                value: 'IDR'
            },
            date: {
                value: '2026-01-30'
            },
            line_items: [
                {
                    description: 'Milk 1L',
                    quantity: 2,
                    total: 25000,
                    unit_price: 12500
                },
                {
                    description: 'Bread',
                    quantity: 1,
                    total: 15000,
                    unit_price: 15000
                },
                {
                    description: 'Eggs (12 pack)',
                    quantity: 1,
                    total: 30000,
                    unit_price: 30000
                },
                {
                    description: 'Butter',
                    quantity: 1,
                    total: 35000,
                    unit_price: 35000
                },
                {
                    description: 'Orange Juice',
                    quantity: 1,
                    total: 20000,
                    unit_price: 20000
                }
            ]
        })
    };
});

const {
    processReceiptWithVeryfi,
    formatReceiptMessage,
    extractReceiptForNotion,
    bufferToBase64
} = require('../receipt');

/**
 * Receipt Processing Unit Tests (MOCKED)
 * Note: These tests use mocked data and do NOT consume Veryfi API credits
 */
describe('Receipt Processing', () => {
    beforeEach(() => {
        // Clear all mock calls before each test
        jest.clearAllMocks();
    });

    describe('processReceiptWithVeryfi', () => {
        it('should process receipt and return structured data', async () => {
            const imageBuffer = Buffer.from('dummy-image-data');
            const fileName = 'test-receipt.jpg';

            const result = await processReceiptWithVeryfi(imageBuffer, fileName);

            expect(result).toBeDefined();
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('vendor');
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('currency_code');
            expect(result).toHaveProperty('date');
            expect(result).toHaveProperty('line_items');
            expect(processReceiptWithVeryfi).toHaveBeenCalledTimes(1);
            expect(processReceiptWithVeryfi).toHaveBeenCalledWith(imageBuffer, fileName);
        });

        it('should return receipt with correct vendor information', async () => {
            const imageBuffer = Buffer.from('test-data');
            const result = await processReceiptWithVeryfi(imageBuffer, 'receipt.jpg');

            expect(result.vendor).toBeDefined();
            expect(result.vendor.name).toBeDefined();
            expect(result.vendor.name.value).toBe('Test Grocery Store');
        });

        it('should return receipt with correct total and currency', async () => {
            const imageBuffer = Buffer.from('test-data');
            const result = await processReceiptWithVeryfi(imageBuffer, 'receipt.jpg');

            expect(result.total).toBeDefined();
            expect(result.total.value).toBe(125000);
            expect(result.currency_code).toBeDefined();
            expect(result.currency_code.value).toBe('IDR');
        });

        it('should return receipt with line items', async () => {
            const imageBuffer = Buffer.from('test-data');
            const result = await processReceiptWithVeryfi(imageBuffer, 'receipt.jpg');

            expect(result.line_items).toBeDefined();
            expect(Array.isArray(result.line_items)).toBe(true);
            expect(result.line_items.length).toBe(5);

            // Verify line item structure
            result.line_items.forEach(item => {
                expect(item).toHaveProperty('description');
                expect(item).toHaveProperty('quantity');
                expect(item).toHaveProperty('total');
                expect(item).toHaveProperty('unit_price');
            });
        });

        it('should return receipt with valid date', async () => {
            const imageBuffer = Buffer.from('test-data');
            const result = await processReceiptWithVeryfi(imageBuffer, 'receipt.jpg');

            expect(result.date).toBeDefined();
            expect(result.date.value).toBe('2026-01-30');
            expect(result.date.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('formatReceiptMessage', () => {
        let mockReceiptData;

        beforeEach(async () => {
            const imageBuffer = Buffer.from('test-data');
            mockReceiptData = await processReceiptWithVeryfi(imageBuffer, 'test.jpg');
        });

        it('should format receipt data into a readable message', () => {
            const message = formatReceiptMessage(mockReceiptData);

            expect(message).toBeDefined();
            expect(typeof message).toBe('string');
            expect(message.length).toBeGreaterThan(0);
        });

        it('should include vendor name in formatted message', () => {
            const message = formatReceiptMessage(mockReceiptData);

            expect(message).toContain('Test Grocery Store');
            expect(message).toContain('Merchant');
        });

        it('should include total amount in formatted message', () => {
            const message = formatReceiptMessage(mockReceiptData);

            expect(message).toContain('125000');
            expect(message).toContain('Total');
        });

        it('should include currency in formatted message', () => {
            const message = formatReceiptMessage(mockReceiptData);

            expect(message).toContain('IDR');
        });

        it('should include date in formatted message', () => {
            const message = formatReceiptMessage(mockReceiptData);

            expect(message).toContain('2026-01-30');
            expect(message).toContain('Date');
        });

        it('should include line items in formatted message', () => {
            const message = formatReceiptMessage(mockReceiptData);

            expect(message).toContain('Items');
            expect(message).toContain('Milk 1L');
            expect(message).toContain('Bread');
            expect(message).toContain('Eggs (12 pack)');
        });

        it('should include receipt ID in formatted message', () => {
            const message = formatReceiptMessage(mockReceiptData);

            expect(message).toContain('mock-receipt-12345');
            expect(message).toContain('Receipt ID');
        });
    });

    describe('extractReceiptForNotion', () => {
        let mockReceiptData;

        beforeEach(async () => {
            const imageBuffer = Buffer.from('test-data');
            mockReceiptData = await processReceiptWithVeryfi(imageBuffer, 'test.jpg');
        });

        it('should extract data in Notion-compatible format', () => {
            const notionData = extractReceiptForNotion(mockReceiptData);

            expect(notionData).toBeDefined();
            expect(notionData).toHaveProperty('description');
            expect(notionData).toHaveProperty('amount');
            expect(notionData).toHaveProperty('date');
        });

        it('should extract vendor name as description', () => {
            const notionData = extractReceiptForNotion(mockReceiptData);

            expect(notionData.description).toBe('Test Grocery Store');
        });

        it('should extract total as rounded amount', () => {
            const notionData = extractReceiptForNotion(mockReceiptData);

            expect(notionData.amount).toBe(125000);
            expect(typeof notionData.amount).toBe('number');
            expect(Number.isInteger(notionData.amount)).toBe(true);
        });

        it('should extract date in correct format', () => {
            const notionData = extractReceiptForNotion(mockReceiptData);

            expect(notionData.date).toBe('2026-01-30');
            expect(notionData.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('bufferToBase64', () => {
        it('should convert buffer to base64 string', () => {
            const buffer = Buffer.from('Hello World');
            const base64 = bufferToBase64(buffer);

            expect(base64).toBeDefined();
            expect(typeof base64).toBe('string');
            expect(base64).toBe('SGVsbG8gV29ybGQ=');
        });

        it('should handle empty buffer', () => {
            const buffer = Buffer.from('');
            const base64 = bufferToBase64(buffer);

            expect(base64).toBe('');
        });

        it('should handle binary data', () => {
            const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
            const base64 = bufferToBase64(buffer);

            expect(base64).toBeDefined();
            expect(typeof base64).toBe('string');
            // Should be able to decode back to original
            expect(Buffer.from(base64, 'base64').toString()).toBe('Hello');
        });
    });

    describe('Integration Tests', () => {
        it('should process complete receipt workflow', async () => {
            // Step 1: Process receipt
            const imageBuffer = Buffer.from('test-receipt-image-data');
            const receiptData = await processReceiptWithVeryfi(imageBuffer, 'test-receipt.jpg');

            expect(receiptData).toBeDefined();
            expect(receiptData.id).toBe('mock-receipt-12345');

            // Step 2: Format message
            const formattedMessage = formatReceiptMessage(receiptData);
            expect(formattedMessage).toContain('Test Grocery Store');
            expect(formattedMessage).toContain('125000');

            // Step 3: Extract for Notion
            const notionData = extractReceiptForNotion(receiptData);
            expect(notionData.description).toBe('Test Grocery Store');
            expect(notionData.amount).toBe(125000);
            expect(notionData.date).toBe('2026-01-30');

            // Verify all functions were called
            expect(processReceiptWithVeryfi).toHaveBeenCalled();
        });

        it('should handle line items correctly', async () => {
            const imageBuffer = Buffer.from('test-data');
            const receiptData = await processReceiptWithVeryfi(imageBuffer, 'receipt.jpg');

            // Verify line items total matches receipt total
            const lineItemsTotal = receiptData.line_items.reduce((sum, item) => sum + item.total, 0);
            expect(lineItemsTotal).toBe(125000);
            expect(lineItemsTotal).toBe(receiptData.total.value);
        });

        it('should verify all line items have required fields', async () => {
            const imageBuffer = Buffer.from('test-data');
            const receiptData = await processReceiptWithVeryfi(imageBuffer, 'receipt.jpg');

            receiptData.line_items.forEach(item => {
                expect(item.description).toBeDefined();
                expect(item.quantity).toBeGreaterThan(0);
                expect(item.total).toBeGreaterThan(0);
                expect(item.unit_price).toBeGreaterThan(0);

                // Verify quantity * unit_price logic
                expect(item.quantity * item.unit_price).toBe(item.total);
            });
        });
    });
});
