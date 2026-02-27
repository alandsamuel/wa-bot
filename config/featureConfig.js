const fs = require('fs');
const path = require('path');

const featureConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'feature.json'), 'utf8'));

function isEnabled(feature) {
    return featureConfig.commands[feature]?.enabled === true;
}

function getHelpMessage() {
    const commands = featureConfig.commands;
    let helpText = '💡 Commands:\n';
    helpText += '• Type expense with amount: "makan nasi padang 20000"\n';
    
    if (commands.list.enabled) helpText += `• !list - ${commands.list.description}\n`;
    if (commands.today.enabled) helpText += `• !today - ${commands.today.description}\n`;
    if (commands.summarize.enabled) helpText += `• !summarize - ${commands.summarize.description}\n`;
    if (commands.search.enabled) helpText += `• !search <term> - ${commands.search.description}\n`;
    if (commands.po.enabled) helpText += `• !po - ${commands.po.description}\n`;
    if (commands.poList.enabled) helpText += `• !po list - ${commands.poList.description}\n`;
    if (commands.wishlist.enabled) helpText += `• !wishlist - ${commands.wishlist.description}\n`;
    if (commands.wishlistList.enabled) helpText += `• !wishlist list - ${commands.wishlistList.description}\n`;
    if (commands.notionlink.enabled) helpText += `• !notionlink - ${commands.notionlink.description}\n`;
    if (commands.receipt.enabled) helpText += `• Send receipt image - ${commands.receipt.description}\n`;
    
    helpText += '• cancel - Cancel pending input';
    
    return helpText;
}

module.exports = {
    featureConfig,
    isEnabled,
    getHelpMessage
};
