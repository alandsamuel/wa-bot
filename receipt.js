const axios = require('axios');
const { MESSAGES } = require('./constants');
const notionService = require('./NotionService');
require('dotenv').config();

// Veryfi API Configuration
const VERYFI_API_URL = 'https://api.veryfi.com/api/v8/partner/documents';
const VERYFI_CLIENT_ID = process.env.VERYFI_CLIENT_ID;
const VERYFI_AUTHORIZATION = process.env.VERYFI_AUTHORIZATION;

// Supported image formats
const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];

/**
 * Validates if the message contains an image
 * @param {Object} message - WhatsApp message object
 * @returns {boolean} True if message contains a supported image
 */
function isImageMessage(message) {
    return message.hasMedia && message.type === 'image';
}

/**
 * Downloads media from WhatsApp message
 * @param {Object} message - WhatsApp message object
 * @returns {Promise<Buffer>} Media buffer
 */
async function downloadMediaFromMessage(message) {
    try {
        const media = await message.downloadMedia();
        return media.data ? Buffer.from(media.data, 'base64') : null;
    } catch (error) {
        console.error('Error downloading media from message:', error);
        throw new Error('Failed to download image from message');
    }
}

/**
 * Converts buffer to base64 string
 * @param {Buffer} buffer - File buffer
 * @returns {string} Base64 encoded string
 */
function bufferToBase64(buffer) {
    return buffer.toString('base64');
}

/**
 * Processes receipt image with Veryfi API
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string} fileName - Name of the file
 * @returns {Promise<Object>} Extracted receipt data from Veryfi
 */
async function processReceiptWithVeryfi(imageBuffer, fileName) {
    try {
        if (!VERYFI_CLIENT_ID || !VERYFI_AUTHORIZATION) {
            throw new Error('Missing Veryfi credentials in environment variables');
        }

        // Convert buffer to base64
        const base64Data = bufferToBase64(imageBuffer);

        // Prepare request payload
        const payload = {
            file_data: base64Data,
            file_name: fileName,
            categories: [],
            tags: ['whatsapp'],
            document_type: 'receipt',
            auto_delete: false,
            boost_mode: false,
            confidence_details: true,
            bounding_boxes: false
        };

        // Make API request to Veryfi
        const response = await axios.post(VERYFI_API_URL, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'CLIENT-ID': VERYFI_CLIENT_ID,
                'Authorization': `apikey ${VERYFI_AUTHORIZATION}`
            },
            timeout: 30000 // 30 second timeout
        });

        return response.data;
    } catch (error) {
        console.error('Error processing receipt with Veryfi:', error.message);
        if (error.response) {
            console.error('Veryfi API error:', error.response.status, error.response.data);
        }
        throw new Error(`Failed to process receipt: ${error.message}`);
    }
}

/**
 * Formats receipt data into a readable message
 * @param {Object} receiptData - Extracted receipt data from Veryfi
 * @returns {string} Formatted receipt message
 */
function formatReceiptMessage(receiptData) {
    const vendor = receiptData.meta?.vendor?.name || receiptData.vendor?.name || 'Unknown';
    const total = receiptData.meta?.total?.value || receiptData.total || 0;
    const currency = receiptData.meta?.currency_code?.value || 'IDR';
    const receiptDate = receiptData.meta?.date?.value || new Date().toISOString().split('T')[0];
    const lineItems = receiptData.line_items || [];

    let message = '📄 Receipt Details\n';
    message += `${'='.repeat(50)}\n\n`;
    message += `🏪 Merchant: ${vendor}\n`;
    message += `📅 Date: ${receiptDate}\n`;
    message += `💰 Total: ${currency} ${total}\n\n`;

    if (lineItems.length > 0) {
        message += '📋 Items:\n';
        lineItems.slice(0, 10).forEach((item) => {
            const description = item.description || 'Unknown item';
            const quantity = item.quantity || 1;
            const price = item.total || item.unit_price || 0;
            message += `   • ${description} (x${quantity}) - ${currency} ${price}\n`;
        });
        if (lineItems.length > 10) {
            message += `   ... and ${lineItems.length - 10} more items\n`;
        }
    }

    message += `\n${'='.repeat(50)}\n`;
    message += `✅ Receipt processed successfully!\n`;
    message += `Receipt ID: ${receiptData.id || 'N/A'}`;

    return message;
}

/**
 * Extracts relevant data from receipt for Notion storage
 * @param {Object} receiptData - Extracted receipt data from Veryfi
 * @returns {Object} Formatted data for Notion
 */
function extractReceiptForNotion(receiptData) {
    const vendor = receiptData.meta?.vendor?.name || receiptData.vendor?.name || 'Receipt';
    const total = receiptData.meta?.total?.value || receiptData.total || 0;
    const receiptDate = receiptData.meta?.date?.value || new Date().toISOString().split('T')[0];

    return {
        description: vendor,
        amount: Math.round(total),
        date: receiptDate
    };
}

/**
 * Main handler for receipt processing from WhatsApp message
 * @param {Object} message - WhatsApp message object
 * @returns {Promise<string>} Response message to send to user
 */
async function handleReceiptMessage(message) {
    try {
        // Check if message contains an image
        if (!isImageMessage(message)) {
            return null; // Not an image, don't process
        }

        // Send processing indicator
        await message.react('⏳');

        // Download media from message
        console.log('Downloading media from WhatsApp message...');
        const imageBuffer = await downloadMediaFromMessage(message);

        if (!imageBuffer) {
            await message.react('❌');
            return 'Failed to download image. Please try again.';
        }

        // Get filename from message
        const fileName = message.filename || `receipt_${Date.now()}.jpg`;

        // Process receipt with Veryfi
        console.log('Processing receipt with Veryfi API...');
        const receiptData = await processReceiptWithVeryfi(imageBuffer, fileName);

        // Extract data for Notion
        const receiptForNotion = extractReceiptForNotion(receiptData);

        // Store in Notion
        console.log('Storing receipt in Notion...');
        await notionService.addExpense({
            amount: receiptForNotion.amount,
            category: 'Receipt',
            description: receiptForNotion.description,
            date: receiptForNotion.date
        });

        // Format and send response
        const formattedMessage = formatReceiptMessage(receiptData);
        await message.react('✅');
        console.log('Receipt stored successfully in Notion');

        return formattedMessage;
    } catch (error) {
        console.error('Error in handleReceiptMessage:', error);
        await message.react('❌');
        return `Error processing receipt: ${error.message}`;
    }
}

module.exports = {
    handleReceiptMessage,
    isImageMessage,
    downloadMediaFromMessage,
    processReceiptWithVeryfi,
    formatReceiptMessage,
    extractReceiptForNotion,
    bufferToBase64
};
