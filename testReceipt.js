const fs = require('fs');
const path = require('path');
require('dotenv').config();
const {
    processReceiptWithVeryfi,
    formatReceiptMessage,
    extractReceiptForNotion,
    bufferToBase64
} = require('./receipt');

/**
 * Test Veryfi Receipt Processing
 * Usage: node testReceipt.js
 */
async function testVeryfiReceipt() {
    console.log('🧪 Testing Veryfi Receipt Processing...\n');

    // Check environment variables
    console.log('📋 Checking environment variables...');
    if (!process.env.VERYFI_CLIENT_ID) {
        console.error('❌ Error: VERYFI_CLIENT_ID not set in .env');
        process.exit(1);
    }
    if (!process.env.VERYFI_AUTHORIZATION) {
        console.error('❌ Error: VERYFI_AUTHORIZATION not set in .env');
        process.exit(1);
    }
    console.log('✅ Environment variables loaded\n');

    // Check if test image exists
    const testImagePath = path.join(__dirname, 'test.heic');
    console.log(`📁 Looking for test image: ${testImagePath}`);

    if (!fs.existsSync(testImagePath)) {
        console.error(`❌ Error: test.jpeg not found at ${testImagePath}`);
        console.log('\n📝 To test, please:');
        console.log('1. Download or place a receipt image named "test.jpeg" in the project root');
        console.log('2. Run: node testReceipt.js\n');
        process.exit(1);
    }
    console.log('✅ Test image found\n');

    try {
        // Read test image
        console.log('📸 Reading test image...');
        const imageBuffer = fs.readFileSync(testImagePath);
        console.log(`✅ Image loaded (${imageBuffer.length} bytes)\n`);

        // Process receipt with Veryfi
        console.log('🔄 Sending receipt to Veryfi API...');
        console.log(`   Client ID: ${process.env.VERYFI_CLIENT_ID.substring(0, 10)}...`);
        console.log(`   Authorization: ${process.env.VERYFI_AUTHORIZATION.split(':')[0]}:***\n`);

        const receiptData = await processReceiptWithVeryfi(imageBuffer, 'test.jpeg');

        console.log('✅ Receipt processed successfully!\n');

        // Display extracted data
        console.log('📄 Extracted Receipt Data:');
        console.log('━'.repeat(60));
        console.log(`Receipt ID: ${receiptData.id || 'N/A'}`);
        console.log(`Vendor: ${receiptData.meta?.vendor?.name || receiptData.vendor?.name || 'N/A'}`);
        console.log(`Total: ${receiptData.meta?.total?.value || receiptData.total || 'N/A'}`);
        console.log(`Currency: ${receiptData.meta?.currency_code?.value || 'N/A'}`);
        console.log(`Date: ${receiptData.meta?.date?.value || 'N/A'}`);
        console.log(`Line Items: ${receiptData.line_items?.length || 0} items`);
        console.log('━'.repeat(60) + '\n');

        // Test formatting
        console.log('📝 Formatted Message:');
        console.log('━'.repeat(60));
        const formattedMessage = formatReceiptMessage(receiptData);
        console.log(formattedMessage);
        console.log('━'.repeat(60) + '\n');

        // Test Notion extraction
        console.log('💾 Data for Notion Storage:');
        console.log('━'.repeat(60));
        const notionData = extractReceiptForNotion(receiptData);
        console.log(`Description: ${notionData.description}`);
        console.log(`Amount: ${notionData.amount}`);
        console.log(`Date: ${notionData.date}`);
        console.log(`Category: Receipt`);
        console.log('━'.repeat(60) + '\n');

        // Display line items if available
        if (receiptData.line_items && receiptData.line_items.length > 0) {
            console.log('🛒 Line Items:');
            console.log('━'.repeat(60));
            receiptData.line_items.slice(0, 5).forEach((item, index) => {
                console.log(`${index + 1}. ${item.description || 'Unknown'}`);
                console.log(`   Qty: ${item.quantity || 1}, Price: ${item.total || item.unit_price || 'N/A'}`);
            });
            if (receiptData.line_items.length > 5) {
                console.log(`... and ${receiptData.line_items.length - 5} more items`);
            }
            console.log('━'.repeat(60) + '\n');
        }
        console.log(`Total : ${receiptData?.total.value}`)

        console.log('✅ All tests passed! Veryfi integration is working correctly.\n');
    } catch (error) {
        console.error('❌ Error during test:');
        console.error(`   ${error.message}\n`);

        if (error.response) {
            console.error('API Response Error:');
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Data:`, error.response.data);
        }

        process.exit(1);
    }
}

// Run test
testVeryfiReceipt();
