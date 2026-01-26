const { Client } = require('@notionhq/client');
const { NOTION_PROPERTIES, DATE_LOCALE, MESSAGES, DATE_FORMAT_OPTIONS } = require('./constants');
require('dotenv').config();

class NotionService {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.data_source_id = process.env.NOTION_DATABASE_ID;
    }

    async fetchData(startDate, endDate) {
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
            return response;
        } catch (error) {
            console.error(MESSAGES.ERROR_HANDLER, error);
            throw new Error(MESSAGES.FAILED_RETRIEVE_EXPENSES);
        }
    }

    async listExpenses() {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

        try {
            const response = await this.fetchData(startDate, endDate);

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

    /**
     * Summarizes expenses by category and calculates total expenses.
     * @returns {Object} Summary of expenses and total expenses.
     */
    async summarizeExpenses() {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();

        const expenses = await this.listExpenses(startDate, endDate);
        const summary = {};

        expenses.forEach(expense => {
            const category = expense.category;
            if (!summary[category]) {
                summary[category] = { total: 0, items: [] };
            }
            summary[category].total += expense.amount;
            summary[category].items.push(expense);
        });

        const totalExpenses = Object.values(summary).reduce((acc, cat) => acc + cat.total, 0);
        return { summary, totalExpenses };
    }
}

module.exports = new NotionService();
