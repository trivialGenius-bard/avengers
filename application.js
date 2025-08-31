var aiEnabled = true;
// @ts-check
/// <reference path="shared.js" />

/** @type {Settings} */
let settings = new Settings();
let shuffledBag = [];
/** @type {HTMLElement|undefined} */
let debugWindow;
/** @type {HTMLElement|undefined} */
let debugHost;
/** @type {HTMLElement|undefined} */
let debugParsers;
/** @type {HTMLElement|undefined} */
let debugTotalPosts;
/** @type {HTMLElement|undefined} */
let debugPostsMuted;

let totalPostCount = 0;
let totalPostsMuted = 0;

init();

function init() {
    debug("Mutable has been loaded successfully!");
    getSettings((result) => {
        console.log("Settings loaded");
        settings = result;
        initParsing();
    }, (msg) => {
        console.error(msg);
        console.log("No settings found, creating default settings");
        initParsing();
    });
    subscribeToSettings((result) => {
        debug("Settings updated");
        resetPosts();
        settings = result;
        if (settings.debugMode) {
            createDebugWindow();
        } else {
            removeDebugWindow();
        }
    });
}

/**
 * Create the debug window element.
 */
function createDebugWindow() {
    if (document.getElementById("mutable-debug-window")) {
        document.getElementById("mutable-debug-window")?.remove();
    }
    debugWindow = document.createElement("div");
    debugWindow.id = "mutable-debug-window";
    const title = document.createElement("div");
    title.textContent = "Mutable Debug Window";
    title.classList.add("mutable-debug-title");
    debugWindow.appendChild(title);
    debugHost = document.createElement("div");
    debugHost.classList.add("mutable-debug-item");
    debugWindow.appendChild(debugHost);
    debugParsers = document.createElement("div");
    debugParsers.classList.add("mutable-debug-item");
    debugWindow.appendChild(debugParsers);
    debugTotalPosts = document.createElement("div");
    debugTotalPosts.classList.add("mutable-debug-item");
    debugWindow.appendChild(debugTotalPosts);
    debugPostsMuted = document.createElement("div");
    debugPostsMuted.classList.add("mutable-debug-item");
    debugWindow.appendChild(debugPostsMuted);
    document.body.appendChild(debugWindow);
    debug("Debug window created");
}

/**
 * Update the values in the debug window.
 * @param {string} parserNames
 */
function updateDebugWindow(parserNames) {
    if (!settings.debugMode) {
        removeDebugWindow();
        return;
    }
    if (!debugWindow) {
        createDebugWindow();
    }
    if (debugHost) {
        debugHost.textContent = "Host: " + window.location.hostname;
    }
    if (debugParsers) {
        debugParsers.textContent = "Parsers: " + parserNames;
    }
    if (debugTotalPosts) {
        debugTotalPosts.textContent = "Posts Found: " + totalPostCount;
    }
    if (debugPostsMuted) {
        debugPostsMuted.textContent = "Posts Muted: " + totalPostsMuted;
    }
}

/**
 * Remove the debug window element.
 */
function removeDebugWindow() {
    if (debugWindow) {
        debugWindow.remove();
        debugWindow = undefined;
        debug("Debug window removed");
    }
    // Remove the debug class from all posts
    for (let post of document.querySelectorAll(".mutable-debug-post")) {
        post.classList.remove("mutable-debug-post");
    }
}

function initParsing() {
    // Every second, parse the page for new posts
    setInterval(() => {
        parse();
    }, 1000);
    // Also parse whenever the page is scrolled (but only once per second)
    let scrollTimeout = null;
    document.addEventListener("wheel", () => {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        } else {
            parse();
        }
        scrollTimeout = setTimeout(() => {
            parse();
        }, 100);
    });
    parse();
}

/**
 * Parse the page for posts and hide any that match the mute patterns.
 */
async function parse() {
    let host = window.location.hostname;
    if (!settings.mutableEnabled) {
        debug("Mutable is disabled");
        updateDebugWindow("Disabled globally");
        return;
    }
    if (!settings.isSiteEnabled(host)) {
        debug("Site is disabled");
        updateDebugWindow("Disabled for site");
        return;
    }
    if (!settings.enabledByDefault && !settings.isSiteExplicitlyEnabled(host)) {
        debug("Mutable is in whitelist mode and this site is not explicitly enabled");
        updateDebugWindow("Not enabled for site");
        return;
    }
    let posts = [];
    /** @type {string[]} */
    let parsersApplied = [];
    // First check if any specialized parser applies to this page
    for (let parser of Parser.specializedParsers()) {
        if (parser.appliesToPage()) {
            debug(`Applying parser: ${parser.parserName}`);
            posts.push(...parser.getPosts());
            parsersApplied.push(parser.parserName);
        }
    }
    totalPostCount += posts.length;
    // If the specialized parser hasn't found any posts on this site so far, use the universal parser
    if (totalPostCount === 0) {
        debug(`Applying universal parser`);
        posts.push(...UniversalParser.getPosts());
        parsersApplied.push(UniversalParser.parserName);
    }
    if (parsersApplied.length > 0) {
        debug(`Found ${posts.length} posts on ${parsersApplied.join(", ")}`);
        for (let post of posts) {
            post.postElement.setAttribute(PROCESSED_INDICATOR, "true");
            if (settings.debugMode && !post.postElement.classList.contains("mutable-debug-post")) {
                // console.log(post.authorHandle());
                // console.log(post.authorName());
                // console.log(post.postContents());
                if (!parsersApplied.includes(UniversalParser.parserName)) {
                    post.postElement.classList.add("mutable-debug-post");
                    // Add tooltip with debug info
                    post.postElement.setAttribute("title", `Author: ${post.authorName()}\nHandle: ${post.authorHandle()}\nAlt: ${post.mediaAltText()}\nContents: ${post.postContents()?.substring(0, 100)}`);
                }
            }
            let matchText = await match(post);
            if (matchText !== null) {
                hidePost(post.postElement, matchText);
                totalPostsMuted++;
            }
        }
    }
    updateDebugWindow(parsersApplied.length > 0?parsersApplied.join(", ") : "none");
}

/**
 * Determine whether the provided post matches any of the mute patterns.
 * @param {Post} text The post to check
 * @returns {string|null} The pattern that matched, or null if no pattern matched
 */
/*function match(post) {
	const contents = post.postContents();
	const groups = settings.getGroupsList();
	if (contents) {
		for (let group of groups) {
			for (let pattern of group.patterns) {
				if (pattern.isMatch(contents)) {
					return pattern.plaintext();
				}
			}
		}
	}
	const altTexts = post.mediaAltText();
	if (altTexts) {
		for (let altText of altTexts) {
			for (let group of groups) {
				for (let pattern of group.patterns) {
					if (pattern.isMatch(altText)) {
						return pattern.plaintext();
					}
				}
			}
		}
	}
	return null;
}*/
async function match(post) {
    // Quick pass: Check text against stored keywords
    const contents = post.postContents();
    const groups = settings.getGroupsList();
    if (contents) {
        for (let group of groups) {
            for (let pattern of group.patterns) {
                if (pattern.isMatch(contents)) {
                    return pattern.plaintext();
                }
            }
        }
    }
    const altTexts = post.mediaAltText();
    if (altTexts) {
        for (let altText of altTexts) {
            for (let group of groups) {
                for (let pattern of group.patterns) {
                    if (pattern.isMatch(altText)) {
                        return pattern.plaintext();
                    }
                }
            }
        }
    }

    // Deep pass: Check if AI is enabled
    if (aiEnabled) {
        try {
            // Define aiSettings (example: enable all models; customize based on user settings)
            console.log("Try AI");
            const aiSettings = {
                sarcasm: false,
                detoxify: true,
                depression: false,
                zeroshot: false
            };

            // Generate unique requestId
            const requestId = Date.now().toString();

            // Send to background.js
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({
                    type: 'AI_ANALYZE_TEXT',
                    text: contents || '', // Use post contents as text
                    aiSettings,
                    requestId
                }, (resp) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(resp);
                        console.log("Responce: ", resp.results);

                    };
                });
            });

            // Interpret results (example logic: match if any score > 0.5)
            const results = response.results || {};
            console.log("Response type: ", response.type, " Results type: ", results.type)

            let isMatch = false;
            let matchedWord = null;

            // Check each category
            for (const [category, scores] of Object.entries(results)) {
                const maxScore = Math.max(...(Array.isArray(scores)?scores.flat() : [0])); // Assume scores are arrays
                //console.log("max score: ", maxScore)

                if (maxScore > 0.2) { // Threshold; adjust as needed
                    isMatch = true;
                    matchedWord = category; // e.g., "sarcasm" as matchedWord
                    console.log("Matching result: ", isMatch, ", reason:", matchedWord)
                    break; // Or collect all
                }
            }

            return isMatch?matchedWord : null;
        } catch (error) {
            console.error('Error in AI deep pass:', error);
            return null; // Fallback
        }
    }

    // No match found in either pass
    return null;
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // --- ДЕБАГ: Логируем всё входящее сообщение ---
    console.log("[DEBUG_APP] 1. Получено сообщение в content script (application.js):", message);
    console.log("[DEBUG_APP] 1a. Тип message:", typeof message);
    // --- КОНЕЦ ДЕБАГА ---

    // --- ИСПРАВЛЕНИЕ: Правильная обработка AI_ANALYSIS_RESULT ---
    if (message && message.action === "AI_ANALYSIS_RESULT") {
        console.log("[DEBUG_APP] 2. Сообщение является результатом AI анализа (AI_ANALYSIS_RESULT).");

        // Извлекаем объект результата, отправленный background.js
        // Ожидаемый формат: message.result = { isMatch: boolean, matchedWord: string, ... }
        const analysisResult = message.result;

        console.log("[DEBUG_APP] 3. Содержимое message.result:", analysisResult);
        console.log("[DEBUG_APP] 3a. Тип message.result:", typeof analysisResult);

        if (analysisResult && typeof analysisResult === 'object') {
            console.log("[DEBUG_APP] 4. message.result является объектом.");

            // Проверяем флаг isMatch, отправленный background.js после анализа и проверки порогов
            const isMatch = analysisResult.isMatch;
            const matchedWord = analysisResult.matchedWord;

            console.log("[DEBUG_APP] 5. isMatch:", isMatch);
            console.log("[DEBUG_APP] 6. matchedWord:", matchedWord);

            // --- ЛОГИКА ПРИНЯТИЯ РЕШЕНИЯ ---
            // Если background.js установил isMatch в true, значит, текст соответствует критериям
            if (isMatch === true) {
                console.log("[DEBUG_APP] 🚨 ФЛАГ isMatch установлен в TRUE. Применяем блюр.");
                // --- ВЫЗОВ ФУНКЦИИ БЛЮРА ---
                // Предполагается, что функция applyBlur определена где-то выше в application.js
                // и реализует логику скрытия/размытия элементов.
                if (typeof applyBlur === 'function') {
                    applyBlur(); // Вызываем функцию блюра
                    console.log("[DEBUG_APP] ✅ Функция applyBlur() была вызвана.");
                } else {
                    console.error("[DEBUG_APP] ❌ Функция applyBlur не найдена!");
                }
            } else {
                console.log("[DEBUG_APP] ✅ ФЛАГ isMatch НЕ установлен (false/undefined). Блюр не применяется.");
            }
            // --- КОНЕЦ ЛОГИКИ ПРИНЯТИЯ РЕШЕНИЯ ---

        } else {
            console.error("[DEBUG_APP] ❌ ОШИБКА: message.result отсутствует или не является объектом!");
        }
    }
    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---

    // ... здесь может быть обработка других типов сообщений ...
    // (остальной код application.js, который не касается AI_ANALYSIS_RESULT, остается без изменений)
});
// --- КОНЕЦ ИСПРАВЛЕННОГО КОДА ---
/**
 * @param {HTMLElement} element
 * @param {string} reason
 */
function hidePost(element, reason) {
    if (settings.globalMuteAction === "blur") {
        element.classList.add("mutable-blur");
        element.addEventListener("click", function(event) {
            if (element.classList.contains("mutable-blur")) {
                element.classList.remove("mutable-blur");
                event.stopPropagation();
                event.preventDefault();
                // Remove from children too
                for (let child of element.querySelectorAll(".mutable-blur")) {
                    if (child instanceof HTMLElement) {
                        child.classList.remove("mutable-blur");
                    }
                }
            }
        });
    } else if (settings.globalMuteAction === "blur-preview") {
        // Check if element is already wrapped to prevent duplicate processing
        if (element.parentNode && element.parentNode.classList && element.parentNode.classList.contains("mutable-wrapper")) {
            return; // Already processed
        }

        element.classList.add("mutable-blur");

        // Create wrapper to hold both the element and tag
        const wrapper = document.createElement("div");
        wrapper.className = "mutable-wrapper";
        wrapper.style.cssText = `
    		position: relative !important;
    		display: block !important;
    		width: 100% !important;
    		margin: 0 !important;
    		padding: 0 !important;
    		border: none !important;
    		background: transparent !important;
    		box-sizing: border-box !important;
    		overflow: visible !important;
    		z-index: 1 !important;
    	`;

        // Create tag element
        const tagElement = document.createElement("div");
        tagElement.className = "mutable-trigger-tag";
        tagElement.textContent = reason;

        // Insert wrapper before the element
        element.parentNode.insertBefore(wrapper, element);
        // Move element into wrapper
        wrapper.appendChild(element);
        // Add tag to wrapper (not to the blurred element)
        wrapper.appendChild(tagElement);

        element.addEventListener("click", function(event) {
            if (element.classList.contains("mutable-blur")) {
                element.classList.remove("mutable-blur");
                // Remove wrapper and restore original structure
                const parent = wrapper.parentNode;
                parent.insertBefore(element, wrapper);
                wrapper.remove();
                event.stopPropagation();
                event.preventDefault();
                // Remove from children too
                for (let child of element.querySelectorAll(".mutable-blur")) {
                    if (child instanceof HTMLElement) {
                        child.classList.remove("mutable-blur");
                    }
                }
            }
        });
    } else if (settings.globalMuteAction === "hide") {
        element.classList.add("mutable-hide");
    } else {
        console.error(`Unknown global mute action, defaulting to 'blur': ${settings.globalMuteAction}`);
        element.classList.add("mutable-blur");
        element.addEventListener("click", function(event) {
            if (element.classList.contains("mutable-blur")) {
                element.classList.remove("mutable-blur");
                event.stopPropagation();
                event.preventDefault();
            }
        });
    }
}

/**
 * @param {HTMLElement} element
 * @param {MouseEvent} event
 */
function removeOverlay(element, event) {
    if (element.classList.contains("mutable-image-overlay")) {
        element.classList.remove("mutable-image-overlay");
        element.style.setProperty("--overlay-image", "");
        event.stopPropagation();
        event.preventDefault();
        // Remove from children too
        for (let child of element.querySelectorAll(".mutable-image-overlay")) {
            if (child instanceof HTMLElement) {
                child.classList.remove("mutable-image-overlay");
                child.style.setProperty("--overlay-image", "");
            }
        }
    }
}

/**
 * Get a random index from the bag.
 * @param {number} listSize
 * @returns {number} A random index less than listSize
 */
function getIndexFromBag(listSize) {
    if (shuffledBag.length === 0) {
        for (let i = 0; i < listSize; i++) {
            shuffledBag.push(i);
        }
        shuffledBag = shuffle(shuffledBag);
    }
    return shuffledBag.pop() % listSize;
}

/**
 * Fisher-Yates shuffle.
 * https://stackoverflow.com/a/2450976/1330144
 * @param {Array.<T>} array
 * @returns {Array.<T>}
 * @template T
 */
function shuffle(array) {
    let currentIndex = array.length,
        randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
    return array;
}

/**
 * Reset all posts that have been hidden by Mutable.
 */
function resetPosts() {
    for (let post of document.querySelectorAll(`[${PROCESSED_INDICATOR}]`)) {
        post.removeAttribute(PROCESSED_INDICATOR);
        post.classList.remove("mutable-blur");
        post.classList.remove("mutable-hide");
        post.classList.remove("mutable-image-overlay");

        // Check if post is wrapped and restore original structure
        const wrapper = post.parentNode;
        if (wrapper && wrapper.querySelector && wrapper.querySelector(".mutable-trigger-tag")) {
            const grandParent = wrapper.parentNode;
            if (grandParent) {
                grandParent.insertBefore(post, wrapper);
                wrapper.remove();
            }
        }

        // Remove any remaining trigger tags
        const tags = document.querySelectorAll(".mutable-trigger-tag");
        tags.forEach(tag => tag.remove());
    }
}

/**
 * @param {any} message
 */
function log(message) {
    console.log(`Mutable: ${message}`);
}

/**
 * @param {any} message
 */
function debug(message) {
    if (settings.debugMode) {
        console.debug(`Mutable: ${message}`);
    }
}

/**
 * @param {any} message
 */
function error(message) {
    console.error(`Mutable: ${message}`);
}
