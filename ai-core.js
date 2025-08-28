// ai-core.js – Browser/Chrome Extension version
import * as tf from "@tensorflow/tfjs";
import { AutoTokenizer } from "@xenova/transformers";

// Хранилища загруженных моделей и токенайзеров
const loadedModels = {};
const loadedTokenizers = {};

/**
 * Универсальный загрузчик модели
 * Использует chrome.runtime.getURL для доступа к ресурсам в расширении
 */
export async function loadModel(modelName) {
    if (loadedModels[modelName]) return loadedModels[modelName];

    try {
        const modelUrl = chrome.runtime.getURL(`models/${modelName}/model.json`);
        const model = await tf.loadGraphModel(modelUrl);
        console.log(` Модель '${modelName}' загружена`);
        loadedModels[modelName] = model;
        return model;
    } catch (err) {
        console.error(` Ошибка загрузки модели '${modelName}':`, err);
        throw err;
    }
}

/**
 * Универсальный загрузчик токенайзера
 */
export async function loadTokenizer(modelName) {
    if (loadedTokenizers[modelName]) return loadedTokenizers[modelName];

    try {
        // В transformers-web токенайзер можно грузить из "pretrained" папки
        const tokenizerUrl = chrome.runtime.getURL(`models/${modelName}`);
        const tokenizer = await AutoTokenizer.from_pretrained(tokenizerUrl);
        console.log(` Токенайзер '${modelName}' загружен`);
        loadedTokenizers[modelName] = tokenizer;
        return tokenizer;
    } catch (err) {
        console.error(` Ошибка загрузки токенайзера '${modelName}':`, err);
        throw err;
    }
}

/**
 * Универсальный запуск модели
 */
async function runModel(modelName, text) {
    const model = await loadModel(modelName);
    const tokenizer = await loadTokenizer(modelName);

    const encoded = await tokenizer(text, {
        padding: true,
        truncation: true,
        return_tensors: "tf", // браузерный tfjs это понимает
    });

    const output = model.execute(encoded);
    const result = Array.isArray(output) ? output[0] : output;
    return await result.array();
}

/**
 * Параллельный анализатор
 */
export async function analyzeText({ text, aiSettings }) {
    const tasks = [];
    console.log('Analys starting');
    if (aiSettings.sarcasm)
        tasks.push(runModel("sarcasm-detector", text).then((res) => ({ sarcasm: res })))
    if (aiSettings.detoxify)
        tasks.push(runModel("detoxify", text).then((res) => ({ detoxify: res })));
    if (aiSettings.depression)
        tasks.push(runModel("depression-detector", text).then((res) => ({ depression: res })));
    if (aiSettings.zeroshot)
        tasks.push(runModel("zero-shot", text).then((res) => ({ zeroshot: res })));

    const results = await Promise.all(tasks);
    return results.reduce((acc, r) => Object.assign(acc, r), {});
}

// ⚠️ В браузерной версии мы НЕ делаем автозапуск (demo),
// потому что этот модуль подключается из background.js