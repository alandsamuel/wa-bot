# WhatsApp Expense Bot 📊

A WhatsApp bot that helps you track and manage your expenses directly through WhatsApp messages, with integration to Notion database.

## Features

- ✅ **Expense Tracking**: Send expenses in natural format (e.g., "makan nasi padang 20000")
- 📋 **List Expenses**: View monthly expenses summary with `!list` command
- 🔗 **Share Notion Link**: Get your Notion database link with `!notionlink` command
- 🏷️ **Category Management**: Automatically categorize expenses from predefined categories
- 💾 **Notion Integration**: All expenses stored in your Notion database
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

## Usage

### Start the Bot
```bash
pnpm start
```

The bot will display a QR code on first run. Scan it with WhatsApp to authenticate.

### Commands

| Command | Description | Example |
|---------|-------------|---------|
| `makan nasi padang 20000` | Add expense | Stores expense with amount and asks for category |
| `!list` | List monthly expenses | Shows all expenses for current month with total |
| `!notionlink` | Get Notion link | Shares your Notion database link |
| `cancel` | Cancel pending expense | Cancels expense addition when waiting for category |

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
├── index.js              # Main bot logic with command handlers
├── NotionService.js      # Notion database integration
├── config.js             # Bot configuration
├── constants.js          # Centralized constants and messages
├── testListExpenses.js   # Test script for Notion integration
├── Dockerfile            # Docker configuration
├── .dockerignore         # Docker build exclusions
├── .gitignore            # Git exclusions
├── .env.example          # Environment variables template
├── package.json          # Project dependencies
└── pnpm-workspace.yaml   # pnpm workspace config
```

## Project Features

### Clean Code Architecture
- **constants.js**: All hardcoded strings, commands, and messages centralized
- **NotionService.js**: Encapsulated Notion API interactions
- **index.js**: Command routing with switch case for better readability
- Extracted handler functions for each command type

### Error Handling
- Graceful error messages sent to WhatsApp
- Comprehensive logging for debugging
- Try-catch blocks around all async operations

### Configuration
- Environment-based configuration
- Puppeteer sandbox mode disabled for Docker compatibility
- Local authentication with WhatsApp session persistence

## Development

### Add New Command
1. Add command constant in `constants.js`
2. Create handler function in `index.js`
3. Add case to switch statement
4. Add help message in `MESSAGES.HELP_MESSAGE`

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
