const { Client } = require('@notionhq/client');
const { NOTION_PROPERTIES, PO_PROPERTIES, WISHLIST_PROPERTIES, DATE_LOCALE, MESSAGES, DATE_FORMAT_OPTIONS } = require('./constants');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BUDGET_FILE = path.join(__dirname, 'budget.json');

class NotionService {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.data_source_id = process.env.NOTION_DATABASE_ID;
        this.po_database_id = process.env.PO_DATABASE_ID;
        this.wishlist_database_id = process.env.WISHLIST_DATABASE_ID;
    }

    async listExpenses() {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

        try {
            const response = await this.notion.dataSources.query({
                data_source_id: this.data_source_id,
                filter: {
                    and: [
                        {
                            property: NOTION_PROPERTIES.DATE,
                            date: {
                                on_or_after: startDate,
                            },
                        },
                        {
                            property: NOTION_PROPERTIES.DATE,
                            date: {
                                on_or_before: endDate,
                            },
                        },
                    ]
                },
                sorts: [
                    {
                        property: NOTION_PROPERTIES.DATE,
                        direction: 'descending'
                    }
                ]
            });

            if (response.results.length === 0) {
                return MESSAGES.NO_EXPENSES_FOUND;
            }

            const addThousandSeparator = (num) => {
                return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            };

            let message = MESSAGES.EXPENSES_HEADER + '\n';
            const monthYear = new Date(startDate).toLocaleDateString(DATE_LOCALE, DATE_FORMAT_OPTIONS);
            message += MESSAGES.EXPENSES_FOR_MONTH.replace('{monthYear}', monthYear) + '\n\n';

            let totalExpenses = 0;
            response.results.forEach((page) => {
                const properties = page.properties;
                const name = properties[NOTION_PROPERTIES.NAME]?.title[0]?.text?.content || 'No description';
                const amount = properties[NOTION_PROPERTIES.AMOUNT]?.number || 0;
                const date = properties[NOTION_PROPERTIES.DATE]?.date?.start || 'No date';

                message += MESSAGES.EXPENSE_ITEM.replace('{name}', name).replace('{amount}', addThousandSeparator(amount)).replace('{date}', date) + '\n';
                totalExpenses += amount;
            });

            message += MESSAGES.TOTAL_EXPENSES.replace('{total}', addThousandSeparator(totalExpenses));

            return message;
        } catch (error) {
            console.error(MESSAGES.ERROR_HANDLER, error);
            throw new Error(MESSAGES.FAILED_RETRIEVE_EXPENSES);
        }
    }

    async addExpense({ amount, category, description, date }) {
        const current = new Date(date);
        try {
            const response = await this.notion.pages.create({
                parent: { data_source_id: this.data_source_id },
                properties: {
                    [NOTION_PROPERTIES.NAME]: {
                        title: [
                            {
                                text: {
                                    content: description
                                }
                            }
                        ]
                    },
                    [NOTION_PROPERTIES.AMOUNT]: {
                        number: amount
                    },
                    [NOTION_PROPERTIES.CATEGORY]: {
                        select: {
                            name: category
                        }
                    },
                    [NOTION_PROPERTIES.DATE]: {
                        date: {
                            start: `${current.getFullYear()}-${(current.getMonth() + 1).toString().padStart(2, '0')}-${current.getDate().toString().padStart(2, '0')}`
                        }
                    }
                }
            });

            return MESSAGES.EXPENSE_ADDED.replace('{amount}', amount).replace('{description}', description);
        } catch (error) {
            console.error(MESSAGES.ERROR_HANDLER, error);
            throw new Error(MESSAGES.FAILED_ADD_EXPENSE);
        }
    }

    async getCategories() {
        try {
            const response = await this.notion.dataSources.query({
                data_source_id: this.data_source_id,
                filter: {
                    property: NOTION_PROPERTIES.CATEGORY,
                    select: {
                        is_not_empty: true
                    }
                }
            });

            const categories = new Set();
            response.results.forEach((page) => {
                const category = page.properties[NOTION_PROPERTIES.CATEGORY]?.select?.name;
                if (category) {
                    categories.add(category);
                }
            });

            return Array.from(categories);
        } catch (error) {
            console.error(MESSAGES.ERROR_HANDLER, error);
            throw new Error(MESSAGES.FAILED_FETCH_CATEGORIES);
        }
    }

    async todayExpenses() {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

        try {
            const response = await this.notion.dataSources.query({
                data_source_id: this.data_source_id,
                filter: {
                    and: [
                        {
                            property: NOTION_PROPERTIES.DATE,
                            date: {
                                on_or_after: startDate
                            }
                        },
                        {
                            property: NOTION_PROPERTIES.DATE,
                            date: {
                                on_or_before: endDate
                            }
                        }
                    ]
                },
                sorts: [
                    {
                        property: NOTION_PROPERTIES.DATE,
                        direction: 'descending'
                    }
                ]
            });

            const expenses = response.results.map((page) => {
                const props = page.properties;
                return {
                    id: page.id,
                    amount: props[NOTION_PROPERTIES.AMOUNT]?.number || 0,
                    category: props[NOTION_PROPERTIES.CATEGORY]?.select?.name || 'Uncategorized',
                    description: props[NOTION_PROPERTIES.NAME]?.title[0]?.text?.content || 'No description',
                    date: props[NOTION_PROPERTIES.DATE]?.date?.start || null
                };
            });

            const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);
            return {
                total,
                count: expenses.length,
                expenses
            };
        } catch (error) {
            console.error(MESSAGES.ERROR_HANDLER, error);
            throw new Error(MESSAGES.FAILED_RETRIEVE_EXPENSES);
        }
    }

    async listPOs() {
        try {
            const response = await this.notion.dataSources.query({
                data_source_id: this.po_database_id,
                sorts: [
                    {
                        property: PO_PROPERTIES.RELEASE_DATE,
                        direction: 'ascending'
                    }
                ]
            });

            if (response.results.length === 0) {
                return MESSAGES.NO_POS_FOUND;
            }

            const addThousandSeparator = (num) => {
                return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            };

            let message = MESSAGES.POS_HEADER + '\n\n';

            response.results.forEach((page) => {
                const properties = page.properties;
                const name = properties[PO_PROPERTIES.NAME]?.title[0]?.text?.content || 'Unknown';
                const toko = properties[PO_PROPERTIES.TOKO]?.rich_text[0]?.text?.content || 'N/A';
                const fullPrice = properties[PO_PROPERTIES.FULL_PRICE]?.number || 0;
                const dp = properties[PO_PROPERTIES.DP]?.number || 0;
                const pelunas = properties[PO_PROPERTIES.PELUNAS]?.number || 0;
                const releaseDate = properties[PO_PROPERTIES.RELEASE_DATE]?.date?.start || 'TBD';
                const arrived = properties[PO_PROPERTIES.ARRIVED]?.select?.name || 'N/A';

                message += MESSAGES.PO_ITEM
                    .replace('{name}', name)
                    .replace('{toko}', toko)
                    .replace('{fullPrice}', addThousandSeparator(fullPrice))
                    .replace('{dp}', addThousandSeparator(dp))
                    .replace('{pelunas}', addThousandSeparator(pelunas))
                    .replace('{releaseDate}', releaseDate)
                    .replace('{arrived}', arrived) + '\n';
            });

            return message;
        } catch (error) {
            console.error(MESSAGES.ERROR_HANDLER, error);
            throw new Error(MESSAGES.FAILED_RETRIEVE_POS);
        }
    }

    async addPO(poData) {
        try {
            const properties = {
                [PO_PROPERTIES.NAME]: {
                    title: [
                        {
                            text: {
                                content: poData.name
                            }
                        }
                    ]
                },
                [PO_PROPERTIES.TOKO]: {
                    select: {
                        name: poData.toko
                    }
                },
                [PO_PROPERTIES.FULL_PRICE]: {
                    number: Number(poData.fullPrice)
                },
                [PO_PROPERTIES.DP]: {
                    number: Number(poData.dp)
                }
            };

            // Add optional fields
            if (poData.links && poData.links.toLowerCase() !== 'skip') {
                properties[PO_PROPERTIES.LINKS] = {
                    url: poData.links
                };
            }

            if (poData.releaseDate && poData.releaseDate.toLowerCase() !== 'skip') {
                properties[PO_PROPERTIES.RELEASE_DATE] = {
                    rich_text: [
                        {
                            text: {
                                content: poData.releaseDate
                            }
                        }
                    ]
                };
            }

            // Note: Pelunas, Status Lunas, and Arrived are formula/calculated fields in Notion
            // They don't need to be set here as they're automatically calculated

            console.log('Creating PO with properties:', properties);

            const response = await this.notion.pages.create({
                parent: { database_id: this.po_database_id },
                properties: properties
            });

            return MESSAGES.PO_ADDED
                .replace('{name}', poData.name)
                .replace('{toko}', poData.toko)
                .replace('{fullPrice}', poData.fullPrice);
        } catch (error) {
            console.error(MESSAGES.ERROR_HANDLER, error);
            throw new Error(MESSAGES.FAILED_ADD_PO);
        }
    }

    async summarizeExpenses() {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

        try {
            const response = await this.notion.dataSources.query({
                data_source_id: this.data_source_id,
                filter: {
                    and: [
                        {
                            property: NOTION_PROPERTIES.DATE,
                            date: {
                                on_or_after: startDate
                            }
                        },
                        {
                            property: NOTION_PROPERTIES.DATE,
                            date: {
                                on_or_before: endDate
                            }
                        }
                    ]
                }
            });

            const byCategory = {};
            let total = 0;

            response.results.forEach((page) => {
                const props = page.properties;
                const category = props[NOTION_PROPERTIES.CATEGORY]?.select?.name || 'Uncategorized';
                const amount = props[NOTION_PROPERTIES.AMOUNT]?.number || 0;
                total += amount;
                byCategory[category] = (byCategory[category] || 0) + amount;
            });

            const monthYear = new Date(startDate).toLocaleDateString(DATE_LOCALE, DATE_FORMAT_OPTIONS);

            return {
                total,
                count: response.results.length,
                byCategory,
                period: monthYear
            };
        } catch (error) {
            console.error(MESSAGES.ERROR_HANDLER, error);
            throw new Error(MESSAGES.FAILED_RETRIEVE_EXPENSES);
        }
    }

    async checkDuplicateWishlistName(name) {
        try {
            const response = await this.notion.dataSources.query({
                data_source_id: this.wishlist_database_id,
                filter: {
                    property: WISHLIST_PROPERTIES.NAME,
                    title: {
                        equals: name
                    }
                }
            });

            return response.results.length > 0;
        } catch (error) {
            console.error(MESSAGES.ERROR_HANDLER, error);
            throw new Error(MESSAGES.FAILED_CHECK_DUPLICATE_WISHLIST);
        }
    }

    async listWishlistItems() {
        try {
            const response = await this.notion.dataSources.query({
                data_source_id: this.wishlist_database_id,
                sorts: [
                    {
                        property: WISHLIST_PROPERTIES.NAME,
                        direction: 'ascending'
                    }
                ]
            });

            if (response.results.length === 0) {
                return MESSAGES.NO_WISHLIST_ITEMS_FOUND;
            }

            const addThousandSeparator = (num) => {
                return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            };

            let message = MESSAGES.WISHLIST_ITEMS_HEADER + '\n\n';

            response.results.forEach((page) => {
                const properties = page.properties;
                const name = properties[WISHLIST_PROPERTIES.NAME]?.title[0]?.text?.content || 'Unknown';
                const price = properties[WISHLIST_PROPERTIES.PRICE]?.number || 0;
                const url = properties[WISHLIST_PROPERTIES.URL]?.url || null;
                const note = properties[WISHLIST_PROPERTIES.NOTE]?.rich_text[0]?.text?.content || null;
                const priority = properties[WISHLIST_PROPERTIES.PRIORITY]?.select?.name || null;
                const category = properties[WISHLIST_PROPERTIES.CATEGORY]?.select?.name || null;

                let optionalFields = '';
                if (url) optionalFields += `🔗 URL: ${url}\n`;
                if (note) optionalFields += `📝 Note: ${note}\n`;
                if (priority) optionalFields += `⭐ Priority: ${priority}\n`;
                if (category) optionalFields += `📁 Category: ${category}`;

                message += MESSAGES.WISHLIST_ITEM
                    .replace('{name}', name)
                    .replace('{price}', addThousandSeparator(price))
                    .replace('{optionalFields}', optionalFields.trim()) + '\n\n';
            });

            return message;
        } catch (error) {
            console.error(MESSAGES.ERROR_HANDLER, error);
            throw new Error(MESSAGES.FAILED_RETRIEVE_WISHLIST);
        }
    }

    async searchExpenses(term) {
        try {
            const response = await this.notion.dataSources.query({
                data_source_id: this.data_source_id,
                filter: {
                    property: NOTION_PROPERTIES.NAME,
                    title: {
                        contains: term
                    }
                },
                sorts: [
                    {
                        property: NOTION_PROPERTIES.DATE,
                        direction: 'descending'
                    }
                ]
            });

            if (response.results.length === 0) {
                return MESSAGES.NO_SEARCH_RESULTS.replace('{term}', term);
            }

            const addThousandSeparator = (num) => {
                return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            };

            let message = MESSAGES.SEARCH_RESULTS.replace('{term}', term) + '\n\n';

            let totalExpenses = 0;
            response.results.forEach((page) => {
                const properties = page.properties;
                const name = properties[NOTION_PROPERTIES.NAME]?.title[0]?.text?.content || 'No description';
                const amount = properties[NOTION_PROPERTIES.AMOUNT]?.number || 0;
                const category = properties[NOTION_PROPERTIES.CATEGORY]?.select?.name || 'Uncategorized';
                const date = properties[NOTION_PROPERTIES.DATE]?.date?.start || 'No date';

                message += `${name}\n💰 Rp. ${addThousandSeparator(amount)} | 📁 ${category} | 📅 ${date}\n\n`;
                totalExpenses += amount;
            });

            message += MESSAGES.TOTAL_EXPENSES.replace('{total}', addThousandSeparator(totalExpenses));

            return message;
        } catch (error) {
            console.error(MESSAGES.ERROR_HANDLER, error);
            throw new Error(MESSAGES.FAILED_RETRIEVE_EXPENSES);
        }
    }

    async addWishlistItem(wishlistData) {
        try {
            const properties = {
                [WISHLIST_PROPERTIES.NAME]: {
                    title: [
                        {
                            text: {
                                content: wishlistData.name
                            }
                        }
                    ]
                },
                [WISHLIST_PROPERTIES.PRICE]: {
                    number: Number(wishlistData.price)
                }
            };

            // Add optional fields
            if (wishlistData.url && wishlistData.url.toLowerCase() !== 'skip') {
                properties[WISHLIST_PROPERTIES.URL] = {
                    url: wishlistData.url
                };
            }

            if (wishlistData.note && wishlistData.note.toLowerCase() !== 'skip') {
                properties[WISHLIST_PROPERTIES.NOTE] = {
                    rich_text: [
                        {
                            text: {
                                content: wishlistData.note
                            }
                        }
                    ]
                };
            }

            if (wishlistData.priority && wishlistData.priority.toLowerCase() !== 'skip') {
                properties[WISHLIST_PROPERTIES.PRIORITY] = {
                    select: {
                        name: wishlistData.priority
                    }
                };
            }

            if (wishlistData.category && wishlistData.category.toLowerCase() !== 'skip') {
                properties[WISHLIST_PROPERTIES.CATEGORY] = {
                    select: {
                        name: wishlistData.category
                    }
                };
            }

            console.log('Creating Wishlist item with properties:', properties);

            const response = await this.notion.pages.create({
                parent: { database_id: this.wishlist_database_id },
                properties: properties
            });

            return MESSAGES.WISHLIST_ADDED
                .replace('{name}', wishlistData.name)
                .replace('{price}', wishlistData.price);
        } catch (error) {
            console.error(MESSAGES.ERROR_HANDLER, error);
            throw new Error(MESSAGES.FAILED_ADD_WISHLIST);
        }
    }

    async getRecentExpenses(limit = 10) {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

        try {
            const response = await this.notion.databases.query({
                database_id: this.data_source_id,
                filter: {
                    and: [
                        {
                            property: NOTION_PROPERTIES.DATE,
                            date: {
                                on_or_after: startDate
                            }
                        },
                        {
                            property: NOTION_PROPERTIES.DATE,
                            date: {
                                on_or_before: endDate
                            }
                        }
                    ]
                },
                sorts: [
                    {
                        property: NOTION_PROPERTIES.DATE,
                        direction: 'descending'
                    }
                ],
                page_size: limit
            });

            if (response.results.length === 0) {
                return MESSAGES.NO_RECENT_EXPENSES;
            }

            const addThousandSeparator = (num) => {
                return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            };

            let message = MESSAGES.RECENT_HEADER.replace('{count}', response.results.length) + '\n\n';

            response.results.forEach((page) => {
                const props = page.properties;
                const name = props[NOTION_PROPERTIES.NAME]?.title[0]?.text?.content || 'No description';
                const amount = props[NOTION_PROPERTIES.AMOUNT]?.number || 0;
                const category = props[NOTION_PROPERTIES.CATEGORY]?.select?.name || 'Uncategorized';
                const date = props[NOTION_PROPERTIES.DATE]?.date?.start || 'No date';

                message += `• ${name}\n  💰 Rp. ${addThousandSeparator(amount)} | 📁 ${category} | 📅 ${date}\n\n`;
            });

            return message;
        } catch (error) {
            console.error(MESSAGES.ERROR_HANDLER, error);
            throw new Error(MESSAGES.FAILED_RETRIEVE_EXPENSES);
        }
    }

    async getTopCategories() {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

        try {
            const response = await this.notion.databases.query({
                database_id: this.data_source_id,
                filter: {
                    and: [
                        {
                            property: NOTION_PROPERTIES.DATE,
                            date: {
                                on_or_after: startDate
                            }
                        },
                        {
                            property: NOTION_PROPERTIES.DATE,
                            date: {
                                on_or_before: endDate
                            }
                        }
                    ]
                }
            });

            if (response.results.length === 0) {
                return MESSAGES.NO_CATEGORIES_FOUND;
            }

            const byCategory = {};
            let total = 0;

            response.results.forEach((page) => {
                const props = page.properties;
                const category = props[NOTION_PROPERTIES.CATEGORY]?.select?.name || 'Uncategorized';
                const amount = props[NOTION_PROPERTIES.AMOUNT]?.number || 0;
                total += amount;
                byCategory[category] = (byCategory[category] || 0) + amount;
            });

            const sortedCategories = Object.entries(byCategory)
                .sort((a, b) => b[1] - a[1]);

            const addThousandSeparator = (num) => {
                return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            };

            let message = MESSAGES.TOP_CATEGORIES_HEADER + '\n\n';
            let rank = 1;

            sortedCategories.forEach(([category, amount]) => {
                const percent = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
                const bar = '█'.repeat(Math.ceil(percent / 5));
                message += `${rank}. ${category}\n   Rp. ${addThousandSeparator(amount)} (${percent}%)\n   ${bar}\n\n`;
                rank++;
            });

            message += `💰 Total: Rp. ${addThousandSeparator(total)}`;

            return message;
        } catch (error) {
            console.error(MESSAGES.ERROR_HANDLER, error);
            throw new Error(MESSAGES.FAILED_RETRIEVE_EXPENSES);
        }
    }

    loadBudget() {
        try {
            if (fs.existsSync(BUDGET_FILE)) {
                const data = fs.readFileSync(BUDGET_FILE, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading budget:', error);
        }
        return {};
    }

    saveBudget(budgetData) {
        try {
            fs.writeFileSync(BUDGET_FILE, JSON.stringify(budgetData, null, 2));
        } catch (error) {
            console.error('Error saving budget:', error);
            throw new Error('Failed to save budget');
        }
    }

    async setBudget(amount) {
        const budgetData = this.loadBudget();
        budgetData.monthly = amount;
        budgetData.updatedAt = new Date().toISOString();
        this.saveBudget(budgetData);
        return MESSAGES.BUDGET_SET.replace('{budget}', amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    }

    async getBudgetStatus() {
        const budgetData = this.loadBudget();
        
        if (!budgetData.monthly) {
            return MESSAGES.BUDGET_NO_BUDGET;
        }

        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

        const response = await this.notion.databases.query({
            database_id: this.data_source_id,
            filter: {
                and: [
                    {
                        property: NOTION_PROPERTIES.DATE,
                        date: {
                            on_or_after: startDate
                        }
                    },
                    {
                        property: NOTION_PROPERTIES.DATE,
                        date: {
                            on_or_before: endDate
                        }
                    }
                ]
            }
        });

        let spent = 0;
        response.results.forEach((page) => {
            const amount = page.properties[NOTION_PROPERTIES.AMOUNT]?.number || 0;
            spent += amount;
        });

        const budget = budgetData.monthly;
        const percent = budget > 0 ? Math.round((spent / budget) * 100) : 0;

        const addThousandSeparator = (num) => {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        };

        let alert = '';
        if (percent >= 100) {
            alert = '\n' + MESSAGES.BUDGET_ALERT_100.replace('{percent}', percent);
        } else if (percent >= 80) {
            alert = '\n' + MESSAGES.BUDGET_ALERT_80.replace('{percent}', percent);
        }

        return MESSAGES.BUDGET_SHOW
            .replace('{budget}', addThousandSeparator(budget))
            .replace('{spent}', addThousandSeparator(spent))
            .replace('{percent}', percent)
            .replace('{alert}', alert);
    }
}

module.exports = new NotionService();
