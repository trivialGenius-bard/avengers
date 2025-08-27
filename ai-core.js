// ai-core.js
import * as tf from "@tensorflow/tfjs";
import { AutoTokenizer } from "@xenova/transformers";

// Если в Node.js, раскомментируй
// import * as tf from "@tensorflow/tfjs-node";

const loadedModels = {};
const loadedTokenizers = {};

/**
 * Универсальный загрузчик модели
 */
export async function loadModel(modelName) {
  if (loadedModels[modelName]) return loadedModels[modelName];

  try {
    const modelPath = `/models/${modelName}/model.json`;
    const nodePath = `file://models/${modelName}/model.json`;
    const isNode = typeof window === "undefined";

    const model = await tf.loadGraphModel(isNode ? nodePath : modelPath);
    console.log(`✅ Модель '${modelName}' загружена`);
    loadedModels[modelName] = model;
    return model;
  } catch (err) {
    console.error(`❌ Ошибка загрузки модели '${modelName}':`, err);
    throw err;
  }
}

/**
 * Универсальный загрузчик токенайзера
 */
export async function loadTokenizer(modelName) {
  if (loadedTokenizers[modelName]) return loadedTokenizers[modelName];

  try {
    const tokenizerPath = `models/${modelName}`;
    const tokenizer = await AutoTokenizer.from_pretrained(tokenizerPath);
    console.log(`✅ Токенайзер '${modelName}' загружен`);
    loadedTokenizers[modelName] = tokenizer;
    return tokenizer;
  } catch (err) {
    console.error(`❌ Ошибка загрузки токенайзера '${modelName}':`, err);
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
    return_tensors: "tf",
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

  if (aiSettings.sarcasm)
    tasks.push(runModel("sarcasm-detector", text).then((res) => ({ sarcasm: res })));
  if (aiSettings.detoxify)
    tasks.push(runModel("detoxify", text).then((res) => ({ detoxify: res })));
  if (aiSettings.depression)
    tasks.push(runModel("depression-detector", text).then((res) => ({ depression: res })));
  if (aiSettings.zeroshot)
    tasks.push(runModel("zero-shot", text).then((res) => ({ zeroshot: res })));

  const results = await Promise.all(tasks);
  return results.reduce((acc, r) => Object.assign(acc, r), {});
}

/**
 * Пример использования
 */
async function demo() {
  const result = await analyzeText({
    text: "Oh, great, another meeting. Just what I needed.",
    aiSettings: {
      sarcasm: true,
      detoxify: true,
      depression: true,
      zeroshot: true,
    },
  });

  console.log("Результат анализа:", result);
}

// Автозапуск
if (import.meta.url === `file://${process.argv[1]}`) {
  demo();
}
