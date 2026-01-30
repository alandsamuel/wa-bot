const { Client } = require('@notionhq/client');
const { NOTION_PROPERTIES, PO_PROPERTIES, DATE_LOCALE, MESSAGES, DATE_FORMAT_OPTIONS } = require('./constants');
require('dotenv').config();

class NotionService {
    constructor() {
        this.notion = new Client({
            auth: process.env.NOTION_TOKEN
        });
        this.data_source_id = process.env.NOTION_DATABASE_ID;
        this.po_database_id = process.env.PO_DATABASE_ID;
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
                    number: poData.fullPrice
                },
                [PO_PROPERTIES.DP]: {
                    number: poData.dp
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
                    date: {
                        start: poData.releaseDate
                    }
                };
            }

            // Note: Pelunas, Status Lunas, and Arrived are formula/calculated fields in Notion
            // They don't need to be set here as they're automatically calculated

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
}

module.exports = new NotionService();
