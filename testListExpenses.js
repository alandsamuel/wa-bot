require('dotenv').config();
const NotionService = require('./NotionService');

async function test() {
    try {
        // console.log('Testing listExpenses...');
        // const result = await NotionService.listExpenses();
        // console.log('Result:');
        // console.log(result);

        // const create = await NotionService.addExpense({
        //     amount: 15000,
        //     category: 'Food',
        //     description: 'Test expense from testListExpenses.js',
        //     date: new Date().toISOString()
        // });
        // console.log('Add Expense Result:');
        // console.log(create);

        // const categories = await NotionService.getCategories();
        // console.log('Categories:');
        // console.log(categories);

        const summary = await NotionService.summarizeExpenses();
        console.log('Summary:');
        console.log(summary);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

test();
