// background.js

import { analyzeText } from './ai-core.js';

// --- Хранилище для отслеживания активных вкладок ---
const activeTabs = new Map();
// --- Очередь сообщений для обработки ---
const messageQueue = [];

// --- Функция для обработки сообщений из очереди ---
async function processMessageQueue() {
    if (messageQueue.length === 0) return;

    const messageData = messageQueue.shift();
    const { message, sender, sendResponse } = messageData;

    try {
        console.log(`📬 Processing queued AI request for tab ${sender.tab?.id}`);
        const results = await sendAIAnalysisRequest(sender.tab?.id, message.text, message.aiSettings);
        console.log(`✅ Analysis completed for tab ${sender.tab?.id}`, results);

        // Отправляем результат через sendResponse
        sendResponse({
            type: "AI_ANALYSIS_COMPLETE",
            success: true,
            results: results,
            requestId: message.requestId
        });
        console.log(`📨 Analysis result sent to tab ${sender.tab?.id}`);
    } catch (error) {
        console.error(`❌ Error processing message from tab ${sender.tab?.id}:`, error);
        // Отправляем ошибку через sendResponse
        sendResponse({
            type: "AI_ANALYSIS_ERROR",
            success: false,
            error: error.message || 'Unknown error during AI analysis',
            requestId: message.requestId
        });
    }
}

// --- Функция для отправки запроса на AI-анализ ---
async function sendAIAnalysisRequest(tabId, text, aiSettings) {
    try {
        console.log(`🧠 Initiating AI analysis for tab ${tabId} with settings:`, aiSettings);
        const results = await analyzeText({ text, aiSettings });
        console.log(`🧠 AI analysis results for tab ${tabId}:`, results);
        return results;
    } catch (error) {
        console.error(`🧠 Error in AI analysis for tab ${tabId}:`, error);
        throw error; // Перебрасываем ошибку для обработки выше
    }
}

// --- Обработчик входящих сообщений ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(`📬 Message received from tab ${sender.tab?.id}:`, message.type);

    if (message.type === "AI_ANALYZE_TEXT") {
        console.log(`🔍 AI Analysis request from tab ${sender.tab?.id}`);
        console.log(`📝 Text: "${message.text}"`);
        console.log(`⚙️ Settings:`, message.aiSettings);

        // ВАЖНО: Помещаем сообщение в очередь и возвращаем true для асинхронной обработки
        messageQueue.push({ message, sender, sendResponse });
        processMessageQueue(); // Начинаем обработку
        return true; // Указывает Chrome, что ответ будет отправлен асинхронно
    }

    // Обработка других типов сообщений (если есть)
    // ...

    // Для других сообщений не нужно возвращать true/sendResponse, если они не асинхронные
});

// --- Обработчики жизненного цикла вкладок ---
chrome.tabs.onCreated.addListener((tab) => {
    activeTabs.set(tab.id, { url: tab.url, title: tab.title });
    console.log(`📋 Tab ${tab.id} created. Active tabs: ${activeTabs.size}`);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        activeTabs.set(tabId, { url: tab.url, title: tab.title });
        console.log(`🔄 Tab ${tabId} updated. URL: ${tab.url}`);
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    activeTabs.delete(tabId);
    console.log(`🗑️ Tab ${tabId} closed. Active tabs: ${activeTabs.size}`);
});

// --- Инициализация ---
chrome.runtime.onInstalled.addListener(() => {
    console.log(`⚡ Extension installed - Background routing service initialized`);
});

// Экспорт функций для тестирования (если необходимо)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        // handleMessage, // handleMessage больше не используется напрямую
        processMessageQueue,
        messageQueue,
        activeTabs
    };
}