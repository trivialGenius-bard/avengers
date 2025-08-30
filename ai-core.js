// ai-core.js – Исправленная версия: передаём только имя папки модели
import { AutoTokenizer, AutoModelForSequenceClassification, env } from "@xenova/transformers";

// ======================= КОНФИГУРАЦИЯ =======================
env.allowLocalModels = true;
env.useCache = false;
env.useBrowserCache = false;
env.allowQuantized = false;
env.backends.onnx.wasm.numThreads = 1;

const loadedModels = {};
const loadedTokenizers = {};

/**
 * Универсальный загрузчик модели.
 * @param {string} modelName - Имя папки модели (например, "sarcasm-detector", "detoxify")
 */
export async function loadModel(modelName) {
    // modelName теперь это просто имя папки, например "sarcasm-detector"
    console.log(`[DEBUG] loadModel called for: ${modelName}`);

    if (loadedModels[modelName]) {
        console.log(`[DEBUG] Model ${modelName} already loaded.`);
        return loadedModels[modelName];
    }

    try {
        // Передаём ТОЛЬКО имя папки, без префикса 'models/'
        // Библиотека должна сама искать это в web_accessible_resources
        console.log(`[DEBUG] Loading model '${modelName}'...`);
        const model = await AutoModelForSequenceClassification.from_pretrained(modelName, {
            local_files_only: true,
            quantized: false
        });
        console.log(`✅ Модель '${modelName}' успешно загружена`);
        loadedModels[modelName] = model;
        return model;
    } catch (err) {
        console.error(`❌ Ошибка загрузки модели '${modelName}':`, err);
        // Попробуем дать больше контекста об ошибке
        if (err.message && err.message.includes('file was not found locally')) {
            console.error(`   Подробности: Библиотека не смогла найти файлы модели '${modelName}'.`);
            console.error(`   Убедитесь, что папка 'models/${modelName}' существует в 'dist' после сборки`);
            console.error(`   и что 'manifest.json' разрешает доступ к 'models/${modelName}/*'.`);
        }
        throw err;
    }
}

/**
 * Универсальный загрузчик токенайзера.
 * @param {string} modelName - Имя папки модели (например, "sarcasm-detector", "detoxify")
 */
export async function loadTokenizer(modelName) {
    // modelName теперь это просто имя папки, например "sarcasm-detector"
    console.log(`[DEBUG] loadTokenizer called for: ${modelName}`);

    if (loadedTokenizers[modelName]) {
        console.log(`[DEBUG] Tokenizer ${modelName} already loaded.`);
        return loadedTokenizers[modelName];
    }

    try {
        // Передаём ТОЛЬКО имя папки, без префикса 'models/'
        console.log(`[DEBUG] Loading tokenizer '${modelName}'...`);
        const tokenizer = await AutoTokenizer.from_pretrained(modelName, {
            local_files_only: true
        });
        console.log(`✅ Токенайзер '${modelName}' успешно загружен`);
        loadedTokenizers[modelName] = tokenizer;
        return tokenizer;
    } catch (err) {
        console.error(`❌ Ошибка загрузки токенайзера '${modelName}':`, err);
        // Попробуем дать больше контекста об ошибке
        if (err.message && err.message.includes('file was not found locally')) {
            console.error(`   Подробности: Библиотека не смогла найти файлы токенайзера '${modelName}'.`);
            console.error(`   Убедитесь, что папка 'models/${modelName}' существует в 'dist' после сборки`);
            console.error(`   и что 'manifest.json' разрешает доступ к 'models/${modelName}/*'.`);
        }
        throw err;
    }
}

/**
 * Универсальный запуск модели.
 * @param {string} modelName - Имя папки модели (например, "sarcasm-detector")
 * @param {string} text - Текст для анализа
 */
async function runModel(modelName, text) {
    console.log(`[DEBUG] runModel called for: ${modelName}`);
    const model = await loadModel(modelName);
    const tokenizer = await loadTokenizer(modelName);
    const inputs = await tokenizer(text, { padding: true, truncation: true });
    const output = await model(inputs);

    // Получаем сырые логиты
    let resultData = Array.from(output.logits.data);

    // --- ИЗМЕНЕНИЕ: Применяем Sigmoid только к модели detoxify ---
    if (modelName === "detoxify") {
        console.log(`[DEBUG] Raw logits for ${modelName}:`, resultData);
        resultData = sigmoid(resultData); // Преобразуем логиты в вероятности
        console.log(`[DEBUG] Sigmoid probabilities for ${modelName}:`, resultData);
    }
    // --- КОНЕЦ ИЗМЕНЕНИЯ ---

    return resultData; // Возвращаем либо логиты, либо вероятности
}

/**
 * Применяет сигмоидную функцию к каждому элементу массива.
 * @param {number[]} logits - Массив логитов.
 * @returns {number[]} Массив вероятностей (0..1) для каждого логита.
 */
function sigmoid(logits) {
    return logits.map(logit => 1 / (1 + Math.exp(-logit)));
}

/**
 * Параллельный анализатор.
 * @param {Object} params - Параметры анализа
 * @param {string} params.text - Текст для анализа
 * @param {Object} params.aiSettings - Настройки AI (какие модели использовать)
 */
export async function analyzeText({ text, aiSettings }) {
    const tasks = [];
    console.log('Analysis starting');

    // ВАЖНО: Передаём ИМЕНА ПАПОК МОДЕЛЕЙ, а не относительные пути
    if (aiSettings.sarcasm)
        tasks.push(runModel("sarcasm-detector", text).then((res) => ({ sarcasm: res })));
    if (aiSettings.detoxify)
        tasks.push(runModel("detoxify", text).then((res) => ({ detoxify: res })));
    if (aiSettings.depression)
        tasks.push(runModel("depression-detector", text).then((res) => ({ depression: res })));
    if (aiSettings.zeroshot)
        tasks.push(runModel("zero-shot", text).then((res) => ({ zeroshot: res })));

    const results = await Promise.all(tasks);
    console.log('Analysis completed', results);
    return results.reduce((acc, r) => Object.assign(acc, r), {});
}

// ======================= ТЕСТ =======================
// Тест остается прежним, так как он использует chrome.runtime.getURL напрямую
async function testFetch() {
    try {
        const url = chrome.runtime.getURL('models/detoxify/config.json');
        console.log('[ТЕСТ] Пытаюсь загрузить URL:', url);
        const response = await fetch(url);
        if (response.ok) {
            console.log('[ТЕСТ] ✅ Успешный fetch! Статус:', response.status);
            const data = await response.json();
            console.log('[ТЕСТ] ✅ Получены данные:', data.model_type);
        } else {
            console.error('[ТЕСТ] ❌ Fetch провалился! Статус:', response.status, response.statusText);
        }
    } catch (e) {
        console.error('[ТЕСТ] ❌ Fetch вызвал исключение:', e);
    }
}
testFetch();