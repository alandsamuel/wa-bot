# WhatsApp Expense Bot - Agent Context Guide

## Project Overview

**wa-bot** is a WhatsApp-based expense tracking bot that integrates with Notion to help users manage and track their expenses directly through WhatsApp messages. The bot also supports receipt image processing and PO (Purchase Order) tracking functionality.

## Core Purpose

- Enable users to log expenses via WhatsApp in natural language format
- Automatically categorize expenses
- Store and retrieve expense data from Notion database
- Process receipt images for data extraction
- Track purchase orders (POs)
- Search expenses by description
- Provide daily and monthly expense summaries

## Technology Stack

**Runtime & Package Manager:**

- Node.js 20+
- pnpm 10.26.2+

**Key Dependencies:**

- `whatsapp-web.js` (GitHub fork) - WhatsApp client integration
- `@notionhq/client` - Notion API integration
- `node-cron` - Scheduling daily summaries
- `axios` - HTTP requests
- `dotenv` - Environment variable management
- `moment-timezone` - Timezone handling (Asia/Jakarta)
- `qrcode-terminal` - QR code generation for WhatsApp authentication

**Testing:**

- Jest for unit testing

## Project Architecture

### Core Files

#### 1. **index.js** - Main Entry Point

- Initializes WhatsApp client with QR code authentication
- Routes incoming messages to appropriate handlers
- Manages pending PO commands with `pendingPOs` Map
- Handles command dispatch with feature toggle checks
- Integrates cron jobs for daily summaries

#### 2. **handler.js** - Message Processing Logic

- `handleListCommand()` - Fetches and displays monthly expenses
- `handleTodayCommand()` - Shows today's expenses
- `handleNotionLinkCommand()` - Provides Notion database link
- `handleCategoryInput()` - Processes category selection for expenses
- `handleExpenseInput()` - Parses and validates expense amounts
- `handleReceiptConfirmation()` - Handles receipt confirmation flow
- `handleListPOsCommand()` - Lists all POs
- `handleSearchCommand()` - Searches expenses by description
- `handleSummarizeCommand()` - Shows monthly summary by category
- `handleWishlistCommand()` - Add wishlist item
- `handleWishlistInput()` - Process wishlist item input
- `handleListWishlistCommand()` - List all wishlist items
- `pendingExpenses` Map - Tracks ongoing expense entry workflows

#### 3. **NotionService.js** - Notion Database Integration

- **Constructor**: Initializes Notion client with API token
- `listExpenses()` - Queries expenses for current month
- `todayExpenses()` - Retrieves today's expenses
- `addExpense()` - Adds expense record to Notion database
- `summarizeExpenses()` - Returns monthly summary by category
- `searchExpenses()` - Searches expenses by description
- `listPOs()` - Fetches PO records
- `addPO()` - Creates new PO entry
- `listWishlistItems()` - Lists all wishlist items
- `addWishlistItem()` - Adds new wishlist item
- Database structure validation and formatting

#### 4. **receipt.js** - Receipt Image Processing

- `handleReceiptMessage()` - Processes uploaded receipt images
- Integrates with Veryfi API for OCR/data extraction
- Extracts expense details from receipts automatically
- Formats extracted data for Notion storage

#### 5. **cron.js** - Scheduled Tasks

- `initializeCron()` - Sets up daily summary job
- `stopCron()` - Gracefully stops scheduled tasks
- Sends daily expense summary at midnight (Asia/Jakarta timezone)

#### 6. **config/** - Configuration Directory

- **index.js** - WhatsApp client options, authentication and session settings
- **feature.json** - Feature toggle configuration for commands
- **featureConfig.js** - Module to load and access feature toggles

#### 7. **constants.js** - Constants & Messages

- **COMMANDS**: !list, !today, !po, !notionlink, !search, !summarize, !wishlist, cancel
- **REACTIONS**: Emoji reactions (👀)
- **NOTION_PROPERTIES**: Database field mappings (Name, Amount, Category, Date)
- **PO_PROPERTIES**: PO database fields (Name, Toko, Links, Release Date, Price, DP, Pelunas, Status Lunas, Arrived)
- **WISHLIST_PROPERTIES**: Wishlist database fields
- **MESSAGES**: All user-facing message templates

#### 8. **helper.js** - Utility Functions

- `parsePriceWithK()` - Parses prices with K suffix (e.g., "20k" → 20000)
- Price validation and parsing utilities

## Command Reference

| Command | Purpose | Example |
| ------- | ------- | ------- |
| `!list` | View monthly expenses summary | `!list` |
| `!today` | Check today's expenses | `!today` |
| `!summarize` | Monthly summary by category | `!summarize` |
| `!search <term>` | Search expenses by description | `!search makan` |
| `!notionlink` | Get Notion database link | `!notionlink` |
| `!po` | Start PO tracking entry | `!po` |
| `!po list` | List all pre-orders | `!po list` |
| `!wishlist` | Add wishlist item | `!wishlist` |
| `!wishlist list` | List all wishlist items | `!wishlist list` |
| Natural language | Log expense | `makan nasi padang 20000` |
| Image | Process receipt | Send receipt image |
| `cancel` | Cancel current operation | `cancel` |

## Feature Toggles

Commands can be enabled/disabled via `config/feature.json`:

```json
{
  "commands": {
    "list": { "enabled": true, "description": "List monthly expenses" },
    "today": { "enabled": true, "description": "Today's expenses" },
    "summarize": { "enabled": true, "description": "Monthly summary by category" },
    "search": { "enabled": true, "description": "Search expenses by description" },
    "po": { "enabled": true, "description": "Add pre-order (PO)" },
    "poList": { "enabled": true, "description": "List all pre-orders" },
    "wishlist": { "enabled": true, "description": "Add wishlist item" },
    "wishlistList": { "enabled": true, "description": "List all wishlist items" },
    "notionlink": { "enabled": true, "description": "Get Notion database link" },
    "receipt": { "enabled": true, "description": "Process receipt with Veryfi" }
  }
}
```

- Disabled commands won't execute and won't appear in help message
- Use `isEnabled('featureName')` to check toggle status
- Use `getHelpMessage()` to get dynamically generated help text

## Data Flow

### Expense Logging Flow

1. User sends message with expense info
2. Bot detects expense format (e.g., "makan nasi padang 20000")
3. `handleExpenseInput()` parses amount
4. Bot prompts for category selection
5. `handleCategoryInput()` validates and confirms category
6. `notionService.addExpense()` stores in Notion
7. Bot confirms addition to user

### Receipt Processing Flow

1. User sends receipt image
2. `handleReceiptMessage()` processes image
3. Veryfi API extracts data (items, amounts)
4. Bot displays extracted items for confirmation
5. User confirms category
6. Data stored in Notion with extracted details

### Search Flow

1. User sends `!search <term>`
2. `handleSearchCommand()` calls `notionService.searchExpenses()`
3. Notion API queries expenses where description contains term
4. Results displayed with amount, category, and date
5. Total shown at bottom

### Daily Summary Flow

1. Cron job triggers at midnight (Asia/Jakarta)
2. `NotionService.todayExpenses()` fetches yesterday's expenses
3. Summary formatted and sent to user

## Environment Variables Required

```env
WHITELISTED_NUMBERS=6281234567890          # Comma-separated WhatsApp numbers
NOTION_TOKEN=your_notion_api_key           # Notion integration token
NOTION_DATABASE_ID=your_database_id        # Expenses database ID
PO_DATABASE_ID=your_po_database_id         # PO tracker database ID
WISHLIST_DATABASE_ID=your_wishlist_db_id   # Wishlist database ID
NOTION_LINK=https://www.notion.so/...      # Notion database URL
VERYFI_CLIENT_ID=your_client_id            # Veryfi OCR service client ID
VERYFI_AUTHORIZATION=username:api_key      # Veryfi API credentials
```

## Notion Database Schema

### Expenses Database Properties

- **Name** (Title) - Expense description
- **Amount** (Number) - Expense amount in IDR
- **Category** (Select) - Auto-filled from categories
- **Date** (Date) - Transaction date (defaults to today)

### PO Tracker Database Properties

- **Name** (Title) - PO identifier/name
- **Toko** (Select) - Store/vendor name
- **Links** (URL) - Product links
- **Release Date** (Text) - Expected delivery date
- **Price** (Number) - Full price
- **DP** (Number) - Down payment
- **Pelunas** (Number) - Final payment (calculated)
- **Status Lunas** (Checkbox) - Payment completion status (calculated)
- **Arrived** (Select) - Delivery status

### Wishlist Database Properties

- **Name** (Title) - Item name
- **Price** (Number) - Item price
- **URL** (URL) - Product link
- **Note** (Text) - Additional notes
- **Priority** (Select) - Priority level
- **Category** (Select) - Item category

## Testing

Test files located in `/test/`:

- `test-receipt.js` - Receipt processing validation
- `test-price-validation.js` - Price parsing tests
- `test-list-expenses.js` - Expense listing tests
- `test-wishlist.js` - Wishlist functionality tests
- `e2e/e2e-commands.test.js` - End-to-end command tests

Run tests with: `pnpm test`

## Workflow States

The bot maintains state using three Maps:

1. **pendingExpenses** - Tracks users currently entering expense data
   - Stores: categories list, amount, description, item details, isReceipt flag
   - Cleared on completion or cancellation

2. **pendingPOs** - Tracks users entering PO information
   - Stores: name, store, links, release date, price, DP, final payment
   - Cleared on completion or cancellation

3. **pendingWishlistItems** - Tracks users entering wishlist items
   - Stores: name, price, url, note, priority, category
   - Cleared on completion or cancellation

## Error Handling

- **Invalid Category**: Bot reprompts with available categories
- **Invalid Amount**: Price parsing validates format
- **Authentication Failure**: QR code re-displayed
- **Notion Connection Error**: Error logged and user notified
- **Receipt Processing Failure**: User prompted to try again or enter manually
- **Disabled Command**: Command silently ignored

## Key Features Implementation

### WhatsApp Authentication

- QR code-based authentication on first run
- Session persistence with automatic reconnection
- Phone number whitelisting for security

### Natural Language Processing

- Freeform expense entry (e.g., "makan 15000")
- Automatic K-suffix handling (e.g., "20k" → 20000)
- Search by description using Notion's "contains" filter

### Timezone Handling

- All times in Asia/Jakarta (WIB)
- Moment-timezone for consistent date handling
- Daily summaries at midnight local time

### Feature Toggles

- Each command can be enabled/disabled via `config/feature.json`
- Disabled commands are hidden from help message
- Toggle checks before command execution in `index.js`

## Common Modification Points

1. **Add New Command**: 
   - Add to `constants.js` COMMANDS
   - Add to `config/feature.json` with enabled/description
   - Add handler function in `handler.js`
   - Add route in `index.js` with `isEnabled()` check
2. **Change Categories**: Modify categories returned by `notionService.getCategories()`
3. **Adjust Summary Schedule**: Update cron expression in `cron.js`
4. **Modify Notion Fields**: Update properties in `constants.js` and queries in `NotionService.js`
5. **Add Message Templates**: Insert in `constants.js` MESSAGES object
6. **Change Timezone**: Update TIMEZONE in `handler.js` and `cron.js`
7. **Toggle Feature**: Update `config/feature.json` enabled flag

## Important Dependencies & Versions

- `@notionhq/client: ^5.8.0` - Notion API client
- `whatsapp-web.js` (fork) - Custom fork for stability
- `node-cron: ^4.2.1` - Cron scheduling
- `jest: ^30.2.0` - Testing framework (dev)

## Development Notes

- Uses pnpm workspaces (see pnpm-workspace.yaml)
- Docker support available (see Dockerfile)
- Environment validation on startup
- Graceful shutdown on process termination
- Logging to console for debugging

## Future Enhancement Areas

1. Multiple expense categories with icons
2. Budget tracking and alerts
3. Expense analytics and trends
4. User preferences and customization
5. Multi-user support with individual databases
6. Receipt image quality validation
7. Expense editing and deletion
8. Recurring expense templates

---

_Last Updated: February 2026_
_For development questions, refer to README.md_
