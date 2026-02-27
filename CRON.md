# Cron Jobs Documentation

This bot includes two automated cron jobs that run on a schedule.

## Daily Summary

- **Default Time**: 00:00 (midnight) Asia/Jakarta timezone
- **Purpose**: Sends yesterday's expenses summary to whitelisted numbers
- **Cron Expression**: `0 0 * * *`

## Expense Reminder

- **Default Time**: 23:00 (11 PM) Asia/Jakarta timezone
- **Purpose**: Reminds you to input your daily expenses
- **Cron Expression**: `0 23 * * *`

## Customize Cron Schedules

Edit the constants in `cron.js`:

```javascript
// Daily summary - runs at midnight
const CRON_SCHEDULE = '0 0 * * *';

// Expense reminder - runs at 11 PM
const REMINDER_CRON_SCHEDULE = '0 23 * * *';
```

Use [cron expression syntax](https://crontab.guru/) for custom schedules.

## Testing Cron Jobs

You can manually test the cron jobs by sending commands to the bot:

| Command       | Description                           |
| ------------- | ------------------------------------- |
| `!testcron`   | Trigger daily summary manually        |

The bot will send you yesterday's expenses summary immediately.

## Verify Cron is Running

1. Start the bot: `pnpm start`
2. Look for these log messages:
   ```
   ✅ Daily summary cron: Runs every day at 00:00 Asia/Jakarta timezone (0 0 * * *)
   ✅ Expense reminder cron: Runs every day at 23:00 Asia/Jakarta timezone (0 23 * * *)
   ```
3. If you see "Cron job already initialized", the crons are already running from a previous session
