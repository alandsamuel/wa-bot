# WhatsApp Expense Bot 📊

A WhatsApp bot that helps you track and manage your expenses directly through WhatsApp messages, with integration to Notion database.

## Features

- ✅ **Expense Tracking**: Send expenses in natural format (e.g., "makan nasi padang 20000")
- 📋 **List Monthly Expenses**: View monthly expenses summary with `!list` command
- 📅 **Today's Expenses**: Check today's expenses with `!today` command
- � **Monthly Summary**: Breakdown expenses by category with `!summarize` command
- 📊 **Daily Summary**: Automatic daily summary of yesterday's expenses sent at midnight
- 🧾 **Receipt Processing**: Send receipt images for automatic data extraction and Notion storage
- 🔗 **Share Notion Link**: Get your Notion database link with `!notionlink` command
- 📦 **Pre-Order Tracking**: Track purchase orders with `!po` and `!po list` commands
- 🛍️ **Wishlist Management**: Manage wishlist items with `!wishlist` and `!wishlist list` commands
- 🏷️ **Category Management**: Automatically categorize expenses from predefined categories
- 💾 **Notion Integration**: All data stored in your Notion database
- 🧪 **Comprehensive Testing**: End-to-end and unit tests for all commands
- 🔐 **Whitelisted Access**: Only whitelisted phone numbers can use the bot

## Prerequisites

- Node.js 20+
- pnpm 10.26.2+
- WhatsApp account
- [Notion Integration Token](https://www.notion.so/my-integrations)
- Notion Database for storing expenses

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd wa-bot
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Setup environment variables**

   ```bash
   cp .env.example .env
   ```

4. **Configure your `.env` file**
   ```env
   WHITELISTED_NUMBERS=6281234567890
   NOTION_TOKEN=your_notion_api_key
   NOTION_DATABASE_ID=your_database_id
   NOTION_LINK=https://www.notion.so/your-database
   VERYFI_CLIENT_ID=your_veryfi_client_id
   VERYFI_AUTHORIZATION=your_veryfi_username:your_veryfi_api_key
   ```

## Getting Your Notion Credentials

### Notion Token

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click "Create new integration"
3. Name your integration and select "Read" and "Update" capabilities
4. Copy the "Internal Integration Token"

### Database ID

1. Open your Notion expense database
2. The URL looks like: `https://www.notion.so/workspace/[DATABASE_ID]?v=...`
3. Copy the `DATABASE_ID` part

### Database Structure

Your Notion database must have these properties:

- **Name** (Title): Description of the expense
- **Amount** (Number): Expense amount
- **Category** (Select): Category of the expense
- **Date** (Date): Date of the expense

### Veryfi Credentials

1. Go to [Veryfi Dashboard](https://app.veryfi.com/api/settings/keys/)
2. Copy your **Client ID**
3. Copy your **API Key** in format: `username:api_key`

## Usage

### Start the Bot

```bash
pnpm start
```

The bot will display a QR code on first run. Scan it with WhatsApp to authenticate.

### Testing

#### Run All Tests

```bash
npm test
```

Runs the complete test suite including unit tests and end-to-end tests (78 tests total).

#### Run End-to-End Tests Only

```bash
npm run test:e2e
```

Runs end-to-end tests that verify all commands work correctly in isolation. Covers:

- List, today, and summarize expense commands
- Expense tracking flows (add and cancel)
- PO (pre-order) add/list flows
- Wishlist add/list flows
- Notion link command
- Cancel operations for all interactive flows

#### Test Notion Integration

```bash
node testListExpenses.js
```

Tests fetching and listing expenses from Notion.

#### Test Veryfi Receipt Processing

```bash
node testReceipt.js
```

Tests the Veryfi API integration for receipt processing. Requires:

1. A test receipt image named `test.jpeg` in the project root
2. Valid Veryfi credentials in `.env`

The test will display extracted receipt data and formatted output.

### Commands

| Command                   | Description                 | Example                                             |
| ------------------------- | --------------------------- | --------------------------------------------------- |
| `makan nasi padang 20000` | Add expense                 | Stores expense with amount and asks for category    |
| `!list`                   | List monthly expenses       | Shows all expenses for current month with total     |
| `!today`                  | Show today's expenses       | Displays all expenses for today with daily total    |
| `!summarize`              | Monthly summary by category | Shows expenses breakdown by category                |
| `!notionlink`             | Get Notion link             | Shares your Notion database link                    |
| `!po`                     | Add pre-order (PO)          | Start interactive flow to track pre-orders          |
| `!po list`                | List all pre-orders         | Shows all pre-orders with details                   |
| `!wishlist`               | Add wishlist item           | Start interactive flow to add items to wishlist     |
| `!wishlist list`          | List all wishlist items     | Shows all wishlist items with prices                |
| `cancel`                  | Cancel pending input        | Cancels any pending operation (expense/PO/wishlist) |
| Send receipt image        | Process receipt             | Extracts data and stores in Notion                  |

### Expense Format

Send expenses in this format:

```
<description> <amount>
```

Examples:

- `makan nasi padang 20000`
- `bensin motor 50000`
- `belanja groceries 150k` (supports 'k' suffix for thousands)

The bot will ask you to select a category from your existing categories in Notion.

### Receipt Processing

Simply send a receipt image to the bot and it will:

1. Extract data using Veryfi (vendor, total amount, items, date)
2. Send you a formatted summary with extracted details
3. Ask you to confirm or modify the vendor description
4. Ask you to select a category from available categories
5. Store the receipt in your Notion database with the confirmed details

Supported image formats: JPEG, PNG, WebP, GIF, BMP

**Flow is identical to manual expenses** - you have full control over the description and category before storing.

## Docker Support

### Build Docker Image

```bash
docker build -t wa-bot .
```

### Run with Docker

```bash
docker run --env-file .env -v wa-auth:/app/.wwebjs_auth wa-bot
```

The `-v wa-auth:/app/.wwebjs_auth` flag persists WhatsApp session data across container restarts.

## Project Structure

```
wa-bot/
├── index.js                    # Main bot entry point and event listeners
├── handler.js                  # Command handlers and expense parsing logic
├── cron.js                     # Daily summary cron job scheduler
├── NotionService.js            # Notion database integration and queries
├── config.js                   # Bot configuration
├── constants.js                # Centralized constants and messages
├── helper.js                   # Helper utilities (price parsing, etc.)
├── receipt.js                  # Receipt processing logic
├── Dockerfile                  # Docker configuration
├── .dockerignore               # Docker build exclusions
├── .gitignore                  # Git exclusions
├── .env.example                # Environment variables template
├── package.json                # Project dependencies
├── jest.config.js              # Jest testing configuration
├── pnpm-workspace.yaml         # pnpm workspace config
├── test/                       # Test suite
│   ├── test-list-expenses.js   # Notion integration tests
│   ├── test-receipt.js         # Receipt processing tests
│   ├── test-price-validation.js# Price parsing tests
│   ├── test-wishlist.js        # Wishlist functionality tests
│   └── e2e/                    # End-to-end tests
│       └── e2e-commands.test.js# Complete command flow tests
└── README.md                   # This file
```

## Project Features

### Clean Code Architecture

- **constants.js**: All hardcoded strings, commands, and messages centralized
- **NotionService.js**: Encapsulated Notion API interactions and data fetching
- **handler.js**: Separated command handlers and expense parsing logic for better modularity
- **cron.js**: Scheduled tasks management with configurable timing
- **index.js**: Clean entry point with command routing via switch case
- Modular design allowing easy testing and feature additions

### Error Handling

- Graceful error messages sent to WhatsApp
- Comprehensive logging for debugging
- Try-catch blocks around all async operations
- Cron job error handling with fallback messaging

### Configuration

- Environment-based configuration
- Puppeteer sandbox mode disabled for Docker compatibility
- Local authentication with WhatsApp session persistence
- Customizable cron schedule for daily summary (default: 00:00)

## Development

### Add New Command

1. Add command constant in `constants.js`
2. Create handler function in `handler.js`
3. Add case to switch statement in `index.js`
4. Add help message in `MESSAGES.HELP_MESSAGE`

### Customize Cron Schedule

Edit the `CRON_SCHEDULE` constant in `cron.js`:

```javascript
// Run at 06:00 AM daily
const CRON_SCHEDULE = "0 6 * * *";
```

Use [cron expression syntax](https://crontab.guru/) for other schedules.

### Add New Message

1. Add to `MESSAGES` object in `constants.js`
2. Use `{placeholder}` syntax for dynamic values
3. Replace placeholders with `.replace()` in code

## Troubleshooting

### Bot not responding

- Check `.env` variables are correct
- Verify phone number is whitelisted (without + or spaces)
- Check bot logs for errors

### Can't connect to Notion

- Verify `NOTION_TOKEN` is valid
- Check database ID is correct
- Ensure integration has "Read" and "Update" permissions

### QR Code issues

- Delete `.wwebjs_auth` folder and restart bot
- Ensure WhatsApp account isn't logged in elsewhere

## License

ISC

## Support

For issues or questions, please check the bot logs and ensure all environment variables are correctly configured.
