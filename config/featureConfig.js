const fs = require('fs');
const path = require('path');

const featureConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'feature.json'), 'utf8'));

const commandKeyMap = {
    'list': '!list',
    'today': '!today',
    'recent': '!recent',
    'top': '!top',
    'budget': '!budget',
    'budgetSet': '!budget <amount>',
    'summarize': '!summarize',
    'search': '!search <term>',
    'po': '!po',
    'poList': '!po list',
    'wishlist': '!wishlist',
    'wishlistList': '!wishlist list',
    'notionlink': '!notionlink',
    'receipt': 'Send receipt image'
};

function isEnabled(featureKey) {
    const commandKey = commandKeyMap[featureKey] || featureKey;
    for (const category of Object.values(featureConfig.categories)) {
        if (category.commands[commandKey]?.enabled !== undefined) {
            return category.commands[commandKey].enabled === true;
        }
    }
    return false;
}

function getHelpMessage() {
    let helpText = featureConfig.help.header;
    helpText += featureConfig.help.expenseExample;

    for (const category of Object.values(featureConfig.categories)) {
        const enabledCommands = Object.entries(category.commands)
            .filter(([_, cmd]) => cmd.enabled);

        if (enabledCommands.length > 0) {
            helpText += `\n\n${category.name}\n`;
            enabledCommands.forEach(([cmd, details]) => {
                helpText += `• ${cmd} - ${details.description}\n`;
            });
        }
    }

    helpText += featureConfig.help.footer;
    return helpText.trim();
}

function getCommandMap() {
    const commandMap = {};
    for (const category of Object.values(featureConfig.categories)) {
        for (const [cmd, details] of Object.entries(category.commands)) {
            if (cmd.startsWith('!') || cmd.startsWith('Send')) {
                commandMap[cmd] = details;
            }
        }
    }
    return commandMap;
}

module.exports = {
    featureConfig,
    isEnabled,
    getHelpMessage,
    getCommandMap
};
