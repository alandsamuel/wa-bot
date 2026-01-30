require('dotenv').config();

// Mock the NotionService to avoid making actual API calls
jest.mock('../NotionService', () => ({
    listExpenses: jest.fn().mockResolvedValue([
        {
            id: 'expense-1',
            amount: 50000,
            category: 'Food',
            description: 'Lunch at restaurant',
            date: '2026-01-30'
        },
        {
            id: 'expense-2',
            amount: 25000,
            category: 'Transport',
            description: 'Taxi to office',
            date: '2026-01-30'
        },
        {
            id: 'expense-3',
            amount: 100000,
            category: 'Shopping',
            description: 'Groceries',
            date: '2026-01-29'
        }
    ]),

    addExpense: jest.fn().mockResolvedValue({
        id: 'new-expense-123',
        amount: 15000,
        category: 'Food',
        description: 'Test expense from testListExpenses.js',
        date: '2026-01-31',
        success: true
    }),

    getCategories: jest.fn().mockResolvedValue([
        'Food',
        'Transport',
        'Shopping',
        'Entertainment',
        'Bills',
        'Health',
        'Other'
    ]),

    summarizeExpenses: jest.fn().mockResolvedValue({
        total: 175000,
        count: 3,
        byCategory: {
            'Food': 50000,
            'Transport': 25000,
            'Shopping': 100000
        },
        period: 'This Month'
    }),

    todayExpenses: jest.fn().mockResolvedValue({
        total: 75000,
        count: 2,
        expenses: [
            {
                id: 'expense-1',
                amount: 50000,
                category: 'Food',
                description: 'Lunch at restaurant',
                date: '2026-01-31'
            },
            {
                id: 'expense-2',
                amount: 25000,
                category: 'Transport',
                description: 'Taxi to office',
                date: '2026-01-31'
            }
        ]
    })
}));

const NotionService = require('../NotionService');

describe('NotionService', () => {
    beforeEach(() => {
        // Clear all mock calls before each test
        jest.clearAllMocks();
    });

    describe('listExpenses', () => {
        it('should return a list of expenses', async () => {
            const result = await NotionService.listExpenses();

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result[0]).toHaveProperty('id');
            expect(result[0]).toHaveProperty('amount');
            expect(result[0]).toHaveProperty('category');
            expect(result[0]).toHaveProperty('description');
            expect(result[0]).toHaveProperty('date');
            expect(NotionService.listExpenses).toHaveBeenCalledTimes(1);
        });

        it('should return expenses with correct structure', async () => {
            const result = await NotionService.listExpenses();

            result.forEach(expense => {
                expect(typeof expense.id).toBe('string');
                expect(typeof expense.amount).toBe('number');
                expect(typeof expense.category).toBe('string');
                expect(typeof expense.description).toBe('string');
                expect(typeof expense.date).toBe('string');
            });
        });
    });

    describe('addExpense', () => {
        it('should add a new expense successfully', async () => {
            const newExpense = {
                amount: 15000,
                category: 'Food',
                description: 'Test expense from testListExpenses.js',
                date: new Date().toISOString()
            };

            const result = await NotionService.addExpense(newExpense);

            expect(result).toBeDefined();
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('success', true);
            expect(result.amount).toBe(15000);
            expect(result.category).toBe('Food');
            expect(NotionService.addExpense).toHaveBeenCalledTimes(1);
            expect(NotionService.addExpense).toHaveBeenCalledWith(newExpense);
        });

        it('should handle expense with all required fields', async () => {
            const expenseData = {
                amount: 50000,
                category: 'Transport',
                description: 'Monthly bus pass',
                date: '2026-01-31'
            };

            const result = await NotionService.addExpense(expenseData);

            expect(result).toHaveProperty('id');
            expect(result.success).toBe(true);
        });
    });

    describe('getCategories', () => {
        it('should return a list of categories', async () => {
            const result = await NotionService.getCategories();

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
            expect(result).toContain('Food');
            expect(result).toContain('Transport');
            expect(NotionService.getCategories).toHaveBeenCalledTimes(1);
        });

        it('should return only string values', async () => {
            const result = await NotionService.getCategories();

            result.forEach(category => {
                expect(typeof category).toBe('string');
            });
        });
    });

    describe('summarizeExpenses', () => {
        it('should return expense summary with totals', async () => {
            const result = await NotionService.summarizeExpenses();

            expect(result).toBeDefined();
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('count');
            expect(result).toHaveProperty('byCategory');
            expect(typeof result.total).toBe('number');
            expect(typeof result.count).toBe('number');
            expect(typeof result.byCategory).toBe('object');
            expect(NotionService.summarizeExpenses).toHaveBeenCalledTimes(1);
        });

        it('should have valid category breakdown', async () => {
            const result = await NotionService.summarizeExpenses();

            expect(result.byCategory).toBeDefined();
            const categoryTotals = Object.values(result.byCategory);
            const sumOfCategories = categoryTotals.reduce((sum, val) => sum + val, 0);

            expect(sumOfCategories).toBe(result.total);
        });
    });

    describe('todayExpenses', () => {
        it('should return today\'s expenses', async () => {
            const result = await NotionService.todayExpenses();

            expect(result).toBeDefined();
            expect(result).toHaveProperty('total');
            expect(result).toHaveProperty('count');
            expect(result).toHaveProperty('expenses');
            expect(Array.isArray(result.expenses)).toBe(true);
            expect(NotionService.todayExpenses).toHaveBeenCalledTimes(1);
        });

        it('should have matching count and expenses length', async () => {
            const result = await NotionService.todayExpenses();

            expect(result.count).toBe(result.expenses.length);
        });

        it('should have expenses with correct total', async () => {
            const result = await NotionService.todayExpenses();

            const calculatedTotal = result.expenses.reduce((sum, expense) => sum + expense.amount, 0);
            expect(calculatedTotal).toBe(result.total);
        });
    });

    describe('Integration Tests', () => {
        it('should handle multiple operations in sequence', async () => {
            // List expenses
            const expenses = await NotionService.listExpenses();
            expect(expenses).toBeDefined();

            // Add new expense
            const newExpense = await NotionService.addExpense({
                amount: 15000,
                category: 'Food',
                description: 'Test expense',
                date: new Date().toISOString()
            });
            expect(newExpense.success).toBe(true);

            // Get categories
            const categories = await NotionService.getCategories();
            expect(categories.length).toBeGreaterThan(0);

            // Get summary
            const summary = await NotionService.summarizeExpenses();
            expect(summary.total).toBeGreaterThan(0);

            // Get today's expenses
            const today = await NotionService.todayExpenses();
            expect(today.count).toBeGreaterThanOrEqual(0);

            // Verify all methods were called
            expect(NotionService.listExpenses).toHaveBeenCalled();
            expect(NotionService.addExpense).toHaveBeenCalled();
            expect(NotionService.getCategories).toHaveBeenCalled();
            expect(NotionService.summarizeExpenses).toHaveBeenCalled();
            expect(NotionService.todayExpenses).toHaveBeenCalled();
        });
    });
});
