// background.js - "The Post Office" for Chrome Extension Message Routing
// Single task: Routing messages between tabs and AI analysis

//import { analyzeText } from './ai-core.js';

// Message queue for sequential processing
const messageQueue = [];
let isProcessing = false;

/**
 * Sequential message processor
 * Ensures messages are processed one by one to avoid conflicts
 */
async function processMessageQueue() {
    if (isProcessing || messageQueue.length === 0) return;

    isProcessing = true;
    console.log(`Processing message queue (${messageQueue.length} messages)`);

    while (messageQueue.length > 0) {
        const { message, sender, sendResponse } = messageQueue.shift();

        try {
            console.log(`Processing message from tab ${sender.tab?.id}:`, message.type);
            const result = await handleMessage(message, sender);

            // Send response back to original tab
            if (sender.tab?.id) {
                chrome.tabs.sendMessage(sender.tab.id, {
                    type: 'AI_ANALYSIS_RESPONSE',
                    requestId: message.requestId,
                    result,
                    success: true
                });
            }

            // Also call sendResponse for direct communication
            if (sendResponse) {
                sendResponse({ success: true, result });
            }

        } catch (error) {
            console.error(`❌ Error processing message from tab ${sender.tab?.id}:`, error);

            const errorResponse = {
                type: 'AI_ANALYSIS_ERROR',
                requestId: message.requestId,
                error: error.message,
                success: false
            };

            if (sender.tab?.id) {
                chrome.tabs.sendMessage(sender.tab.id, errorResponse);
            }

            if (sendResponse) {
                sendResponse(errorResponse);
            }
        }
    }

    isProcessing = false;
    console.log(`✅ Message queue processing complete`);
}

/**
 * Handle individual messages based on type
 */
async function handleMessage(message, sender) {
    const startTime = Date.now();

    switch (message.type) {
        case 'AI_ANALYZE_TEXT':
            console.log(`🔍 AI Analysis request from tab ${sender.tab?.id}`);
            console.log(`📝 Text: "${message.text}"`);
            console.log(`⚙️ Settings:`, message.aiSettings);

            /*const analysisResult = await analyzeText({
                text: message.text,
                aiSettings: message.aiSettings
            });*/

            const processingTime = Date.now() - startTime;
            console.log(`✅ Analysis completed in ${processingTime}ms for tab ${sender.tab?.id}`);

            return {
                type: 'AI_ANALYSIS_COMPLETE',
                results: 5, //analysisResult,
                processingTime,
                tabId: sender.tab?.id
            };

        case 'PING':
            console.log(`🏓 Ping from tab ${sender.tab?.id}`);
            return {
                type: 'PONG',
                timestamp: Date.now(),
                tabId: sender.tab?.id
            };

        case 'GET_QUEUE_STATUS':
            return {
                type: 'QUEUE_STATUS',
                queueLength: messageQueue.length,
                isProcessing,
                tabId: sender.tab?.id
            };

        default:
            throw new Error(`Unknown message type: ${message.type}`);
    }
}

/**
 * Chrome runtime message listener - The main "Post Office" routing function
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`📬 Message received from tab ${sender.tab?.id}:`, message.type);

    // Add message to queue for sequential processing
    messageQueue.push({ message, sender, sendResponse });

    // Start processing queue
    processMessageQueue();

    // Return true to indicate we'll send response asynchronously
    return true;
});

/**
 * Tab management - Track active tabs for better routing
 */
const activeTabs = new Set();

chrome.tabs.onCreated.addListener((tab) => {
    activeTabs.add(tab.id);
    console.log(`📋 Tab ${tab.id} created. Active tabs: ${activeTabs.size}`);
});

chrome.tabs.onRemoved.addListener((tabId) => {
    activeTabs.delete(tabId);
    console.log(`🗑️ Tab ${tabId} removed. Active tabs: ${activeTabs.size}`);

    // Clean up any pending messages for removed tab
    const remainingMessages = messageQueue.filter(item => item.sender.tab?.id !== tabId);
    const removedCount = messageQueue.length - remainingMessages.length;

    if (removedCount > 0) {
        console.log(`🧹 Cleaned up ${removedCount} pending messages for removed tab ${tabId}`);
        messageQueue.length = 0;
        messageQueue.push(...remainingMessages);
    }
});

/**
 * Extension startup
 */
chrome.runtime.onStartup.addListener(() => {
    console.log(`🚀 Background script started - "The Post Office" is open for business`);
});

chrome.runtime.onInstalled.addListener(() => {
    console.log(`⚡ Extension installed - Background routing service initialized`);
});

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleMessage,
        processMessageQueue,
        messageQueue,
        activeTabs
    };
}