const cron = require('node-cron');
const notionService = require('./NotionService');
const { MESSAGES } = require('./constants');
const moment = require('moment-timezone');

// Cron schedule configuration - runs every day at 00:00 (midnight) Asia/Jakarta timezone
const CRON_SCHEDULE = '0 0 * * *';
const REMINDER_CRON_SCHEDULE = '0 23 * * *';
const TIMEZONE = 'Asia/Jakarta';

let scheduledTask = null;
let reminderTask = null;

async function getYesterdayExpenses() {
    const today = moment().tz(TIMEZONE);
    const yesterday = today.clone().subtract(1, 'day');

    const startDate = yesterday.clone().startOf('day').toISOString();
    const endDate = yesterday.clone().endOf('day').toISOString();

    try {
        const response = await notionService.fetchData(startDate, endDate);

        if (response.results.length === 0) {
            return MESSAGES.NO_EXPENSES_FOUND;
        }

        const dateStr = yesterday.format('ddd, MMM D, YYYY');
        let message = MESSAGES.EXPENSES_HEADER + '\n';
        message += `📊 Yesterday's Expenses (${dateStr})\n`;
        message += `${'='.repeat(60)}\n\n`;

        let totalExpenses = 0;
        response.results.forEach((page) => {
            const properties = page.properties;
            const name = properties['Name']?.title[0]?.text?.content || 'No description';
            const amount = properties['Amount']?.number || 0;
            message += `   • ${name} - Rp. ${notionService.addThousandSeparator(amount)}\n`;
            totalExpenses += amount;
        });

        message += `\n${'='.repeat(60)}\n`;
        message += `Total Expenses Yesterday: Rp. ${notionService.addThousandSeparator(totalExpenses)}`;

        return message;
    } catch (error) {
        console.error(MESSAGES.ERROR_HANDLER, error);
        throw new Error(MESSAGES.FAILED_RETRIEVE_EXPENSES);
    }
}

async function sendExpenseReminder(client) {
    const message = MESSAGES.EXPENSE_REMINDER;
    const whitelistNumbers = process.env.WHITELISTED_NUMBERS.split(',');
    for (const number of whitelistNumbers) {
        const chatId = number.trim() + '@c.us';
        await client.sendMessage(chatId, message);
        console.log(`✅ Expense reminder sent to ${number}`);
    }
}

async function sendDailySummary(client) {
    console.log('⏰ Running daily summary cron job...');
    try {
        if (!process.env.WHITELISTED_NUMBERS) {
            console.error('❌ WHITELISTED_NUMBERS not set');
            return;
        }

        const yesterdayExpenses = await getYesterdayExpenses();
        console.log('📊 Daily summary message:', yesterdayExpenses);

        const whitelistNumbers = process.env.WHITELISTED_NUMBERS.split(',');
        for (const number of whitelistNumbers) {
            const chatId = number.trim() + '@c.us';
            await client.sendMessage(chatId, yesterdayExpenses);
            console.log(`✅ Daily summary sent to ${number}`);
        }
    } catch (error) {
        console.error('❌ Error in daily summary cron:', error);
    }
}

function initializeCron(client) {
    if (scheduledTask) {
        console.log('Cron job already initialized');
        return;
    }

    scheduledTask = cron.schedule(CRON_SCHEDULE, async () => {
        await sendDailySummary(client);
    });

    reminderTask = cron.schedule(REMINDER_CRON_SCHEDULE, async () => {
        console.log('⏰ Running expense reminder cron job...');
        try {
            await sendExpenseReminder(client);
        } catch (error) {
            console.error('❌ Error in expense reminder cron:', error);
        }
    });

    console.log(`✅ Daily summary cron: Runs every day at 00:00 ${TIMEZONE} timezone (${CRON_SCHEDULE})`);
    console.log(`✅ Expense reminder cron: Runs every day at 23:00 ${TIMEZONE} timezone (${REMINDER_CRON_SCHEDULE})`);
}

function stopCron() {
    if (scheduledTask) {
        scheduledTask.stop();
        scheduledTask.destroy();
        scheduledTask = null;
    }
    if (reminderTask) {
        reminderTask.stop();
        reminderTask.destroy();
        reminderTask = null;
    }
    console.log('Cron jobs stopped');
}

module.exports = {
    initializeCron,
    stopCron,
    sendDailySummary,
    sendExpenseReminder,
    CRON_SCHEDULE,
    REMINDER_CRON_SCHEDULE,
    getYesterdayExpenses
};
