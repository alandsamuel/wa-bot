// Price conversion helper functions

/**
 * Converts price string with 'k' suffix to numeric value
 * Examples: "50k" → 50000, "100.5k" → 100500, "500000" → 500000
 * @param {string} priceText - Price as string with optional 'k' suffix
 * @returns {number} - Parsed price as number
 */
function parsePriceWithK(priceText) {
    let price = priceText.replace(/,/g, '.').toLowerCase();
    if (price.endsWith('k')) {
        price = price.slice(0, -1) + '000';
    }
    return parseFloat(price);
}

/**
 * Adds thousand separator to a number
 * Examples: 500000 → "500,000", 1234567 → "1,234,567"
 * @param {number} num - Number to format
 * @returns {string} - Formatted number with thousand separators
 */
function addThousandSeparator(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

module.exports = {
    parsePriceWithK,
    addThousandSeparator
};
