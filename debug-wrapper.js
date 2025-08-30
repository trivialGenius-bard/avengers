// Сохраняем оригинальные функции
const originalGetURL = chrome.runtime.getURL.bind(chrome.runtime);
const originalFromPretrainedModel = window._testOriginalFromPretrainedModel || null; // Будет установлено позже
const originalFromPretrainedTokenizer = window._testOriginalFromPretrainedTokenizer || null; // Будет установлено позже

// Флаг для включения/выключения отладки
const DEBUG_ENABLED = true;

function debugLog(...args) {
    if (DEBUG_ENABLED) {
        console.log("[DEBUG_WRAPPER]", ...args);
    }
}

// 1. Оборачиваем chrome.runtime.getURL
chrome.runtime.getURL = function(path) {
    debugLog("chrome.runtime.getURL called with:", path, typeof path);
    // Проверка на ведущий слэш, который может быть проблемой
    if (typeof path === 'string' && path.startsWith('/')) {
        debugLog("⚠️  WARNING: chrome.runtime.getURL argument starts with '/'. This might cause issues.");
    }
    const result = originalGetURL(path);
    debugLog("chrome.runtime.getURL returned:", result);
    return result;
};

// 2. Функция для оборачивания from_pretrained (вызывается из ai-core.js после импортов)
export function wrapFromPretrained() {
    // Проверяем, не обернуты ли уже функции
    if (window._testFromPretrainedModelWrapperInstalled) {
        debugLog("from_pretrained wrappers already installed.");
        return;
    }

    // Импортируем библиотеку (предполагаем, что она уже загружена)
    // Так как мы не можем легко импортировать здесь, предположим, что AutoModel и AutoTokenizer доступны глобально
    // или будем оборачивать позже в ai-core.js
    // Этот подход с window.* позволяет установить обертку из другого файла
    if (typeof window._testOriginalFromPretrainedModel === 'undefined' && typeof AutoModelForSequenceClassification !== 'undefined') {
        window._testOriginalFromPretrainedModel = AutoModelForSequenceClassification.from_pretrained;
    }
    if (typeof window._testOriginalFromPretrainedTokenizer === 'undefined' && typeof AutoTokenizer !== 'undefined') {
        window._testOriginalFromPretrainedTokenizer = AutoTokenizer.from_pretrained;
    }

    if (window._testOriginalFromPretrainedModel) {
        AutoModelForSequenceClassification.from_pretrained = async function(pretrained_model_name_or_path, options = {}) {
            debugLog("AutoModelForSequenceClassification.from_pretrained called with:");
            debugLog("  pretrained_model_name_or_path:", pretrained_model_name_or_path, typeof pretrained_model_name_or_path);
            debugLog("  options:", options);
            // Проверка на проблемный путь
            if (typeof pretrained_model_name_or_path === 'string' && pretrained_model_name_or_path.includes('/models/') && pretrained_model_name_or_path.includes('chrome-extension://')) {
                // Проверим, не начинается ли он с /models/
                try {
                    const urlObj = new URL(pretrained_model_name_or_path);
                    if (urlObj.pathname.startsWith('/models/')) {
                        debugLog("⚠️  WARNING: Model path URL seems to have '/models/' prefix in pathname, which might be incorrect.");
                    }
                } catch (e) {
                    // Не URL
                    if (pretrained_model_name_or_path.startsWith('/models/')) {
                        debugLog("⚠️  WARNING: Model path string starts with '/models/'. This is likely wrong for a full URL.");
                    }
                }
            }
            if (typeof pretrained_model_name_or_path === 'string' && pretrained_model_name_or_path.startsWith('/models/chrome-extension://')) {
                debugLog("🚨 CRITICAL ERROR: Model path starts with '/models/chrome-extension://'. This is the bug!");
                // Можно бросить ошибку здесь для остановки
                // throw new Error(`Invalid model path detected: ${pretrained_model_name_or_path}`);
            }
            try {
                const result = await window._testOriginalFromPretrainedModel.call(this, pretrained_model_name_or_path, options);
                debugLog("AutoModelForSequenceClassification.from_pretrained succeeded.");
                return result;
            } catch (e) {
                debugLog("AutoModelForSequenceClassification.from_pretrained FAILED with path:", pretrained_model_name_or_path);
                debugLog("Error:", e);
                throw e; // Перебрасываем ошибку
            }
        };
        window._testFromPretrainedModelWrapperInstalled = true;
        debugLog("AutoModelForSequenceClassification.from_pretrained wrapped.");
    } else {
        debugLog("⚠️  Could not wrap AutoModelForSequenceClassification.from_pretrained. Not available yet?");
    }

    if (window._testOriginalFromPretrainedTokenizer) {
        AutoTokenizer.from_pretrained = async function(pretrained_model_name_or_path, options = {}) {
            debugLog("AutoTokenizer.from_pretrained called with:");
            debugLog("  pretrained_model_name_or_path:", pretrained_model_name_or_path, typeof pretrained_model_name_or_path);
            debugLog("  options:", options);
            // Аналогичные проверки для токенизатора
            if (typeof pretrained_model_name_or_path === 'string' && pretrained_model_name_or_path.startsWith('/models/chrome-extension://')) {
                debugLog("🚨 CRITICAL ERROR: Tokenizer path starts with '/models/chrome-extension://'. This is the bug!");
                // throw new Error(`Invalid tokenizer path detected: ${pretrained_model_name_or_path}`);
            }
            try {
                const result = await window._testOriginalFromPretrainedTokenizer.call(this, pretrained_model_name_or_path, options);
                debugLog("AutoTokenizer.from_pretrained succeeded.");
                return result;
            } catch (e) {
                debugLog("AutoTokenizer.from_pretrained FAILED with path:", pretrained_model_name_or_path);
                debugLog("Error:", e);
                throw e;
            }
        };
        debugLog("AutoTokenizer.from_pretrained wrapped.");
    } else {
        debugLog("⚠️  Could not wrap AutoTokenizer.from_pretrained. Not available yet?");
    }
}

debugLog("Debug wrapper loaded and chrome.runtime.getURL is now monitored.");