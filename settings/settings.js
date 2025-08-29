// @ts-check
/// <reference path="../shared.js" />

/** @type {HTMLElement} */
// @ts-ignore
const groupsContainer = document.getElementById("groups-container");
/** @type {HTMLElement} */
// @ts-ignore
const customSites = document.getElementById("custom-sites");
/** @type {HTMLElement} */
// @ts-ignore
const customSitesList = document.getElementById("custom-sites-list");
/** @type {HTMLElement} */
// @ts-ignore
const websitesContent = document.getElementById("websites-content");
/** @type {HTMLInputElement} */
// @ts-ignore
const useGlobal = document.getElementById("enable-blur");
/** @type {HTMLInputElement} */
// @ts-ignore
const useOnlyThisWebsite = document.getElementById("use-only-this-website");
/** @type {HTMLElement} */
// @ts-ignore
const background = document.getElementById("background");
/** @type {HTMLElement} */
// @ts-ignore
const modalContainer = document.getElementById("modal-container");
/** @type {HTMLElement} */
// @ts-ignore
const addWordModal = document.getElementById("add-word-modal");
/** @type {HTMLInputElement} */
// @ts-ignore
const addWordInput = document.getElementById("add-word-input");
/** @type {HTMLInputElement} */
// @ts-ignore
const addWordCaseSensitive = document.getElementById("add-word-case-sensitive");
/** @type {HTMLElement} */
// @ts-ignore
const addWordSubmit = document.getElementById("add-word-submit");
/** @type {((keyword: string, caseSensitive: boolean) => void)} */
let addWordSubmitCallback = () => {};
/** @type {HTMLElement} */
// @ts-ignore
const addWordCancel = document.getElementById("add-word-cancel");
/** @type {HTMLSelectElement} */
// @ts-ignore
const globalMuteAction = document.getElementById("global-mute-action");
/** @type {HTMLElement} */
// @ts-ignore
const acknowledgementsWindow = document.getElementById("acknowledgements-window");
/** @type {HTMLElement} */
// @ts-ignore
const acknowledgements = document.getElementById("acknowledgements");
/** @type {HTMLInputElement} */
// @ts-ignore
const debugMode = document.getElementById("debug-mode");

let currentSettings = new Settings();
let deletedLegacySettings = false;

init();

function init() {
	console.log("Initializing settings page...");
	
	// Initialize with default settings first to prevent null reference errors
	currentSettings = new Settings();
	initSettings();
	renderSettings();
	
	getSettings((result) => {
		console.log("Settings loaded successfully");
		currentSettings = result;
		// Re-render with loaded settings
		renderSettings();
	}, (msg) => {
		console.error(msg);
		console.log("No settings found, using default settings");
		// Settings are already initialized and rendered above
	});
	
	let scrollRatio = 0;
	let mouseRatio = 0;
	// Move background x position as a product of the scroll y position
	document.addEventListener("scroll", () => {
		// calculate scroll ratio (0 at top, 1 at bottom)
		scrollRatio = window.scrollY / (document.body.scrollHeight - window.innerHeight);
		updateFoil(scrollRatio, mouseRatio);
	});
	// Move background x position as a product of the mouse y position
	document.addEventListener("mousemove", (event) => {
		mouseRatio = event.clientY / window.innerHeight;
		updateFoil(scrollRatio, mouseRatio);
	});
	
	// Add null check for acknowledgements
	if (acknowledgements) {
		acknowledgements.addEventListener("click", () => {
			if (acknowledgementsWindow) {
				acknowledgementsWindow.style.display = "block";
			}
		});
	}
	
	initModals();
	
	// Add event listener to the existing HTML "Add word" button as fallback
	const existingAddButton = document.querySelector('.add-button');
	if (existingAddButton) {
		console.log("Found existing add button, attaching event listener");
		existingAddButton.addEventListener("click", () => {
			console.log("Existing add word button clicked");
			displayAddWordModal((keyword, caseSensitive) => {
				if (keyword.trim().length === 0) {
					return;
				}
				// Add to the first group (default group should always exist)
				let groups = currentSettings.getGroupsList();
				if (groups.length === 0) {
					console.log("No groups found, creating default group");
					// Create default group if it doesn't exist
					currentSettings.groups["default"] = new Group("default", "Default Group", []);
					groups = currentSettings.getGroupsList();
				}
				let firstGroup = groups[0];
				if (firstGroup && firstGroup.addPattern) {
					firstGroup.addPattern(new KeywordMute(generateId(), keyword, caseSensitive));
					updateSettings();
				}
			});
		});
	} else {
		console.log("Existing add button not found");
	}
}

function updateFoil(scrollRatio, mouseRatio) {
	let ratio = scrollRatio * 0.5 + mouseRatio * 0.5;
	background.style.backgroundPositionX  = `${ratio * 80}%`;
}

function initSettings() {
	// Update the settings when the toggle is changed
	if (useOnlyThisWebsite) {
		useOnlyThisWebsite.addEventListener("change", () => {
			if (typeof chrome !== "undefined" && chrome.tabs) {
				chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
					let currentTab = tabs[0];
					if (currentTab.url !== undefined) {
						let url = new URL(currentTab.url);
						let hostname = url.hostname;
						currentSettings.setWebsiteEnabled(hostname, useOnlyThisWebsite.checked);
						updateSettings();
					}
				});
			} else {
				console.log("Chrome API not available, simulating website toggle");
				// For testing purposes when not in extension context
				currentSettings.setWebsiteEnabled("example.com", useOnlyThisWebsite.checked);
				updateSettings();
			}
		});
	}
	if (globalMuteAction) {
		globalMuteAction.addEventListener("change", () => {
			currentSettings.globalMuteAction = globalMuteAction.value;
			updateSettings();
		});
	}
	if (debugMode) {
		debugMode.addEventListener("change", () => {
			currentSettings.debugMode = debugMode.checked;
			updateSettings();
		});
	}
}

function renderSettings() {
	console.log("renderSettings called");
	
	if (useGlobal) {
		useGlobal.checked = currentSettings.mutableEnabled;
		useGlobal.addEventListener("change", () => {
			currentSettings.mutableEnabled = useGlobal.checked;
			updateSettings();
		});
		console.log("useGlobal initialized");
	}
	
	// Load toggle's initial state based on the current tab
	if (typeof chrome !== "undefined" && chrome.tabs) {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			let currentTab = tabs[0];
			if (currentTab.url !== undefined) {
				let url = new URL(currentTab.url);
				let hostname = url.hostname;
				if (useOnlyThisWebsite) {
					useOnlyThisWebsite.checked = currentSettings.isSiteExplicitlyEnabled(hostname);
					useOnlyThisWebsite.disabled = false;
				}
			} else {
				// Disable the toggle on pages like the browser settings
				if (useOnlyThisWebsite) {
					useOnlyThisWebsite.checked = false;
					useOnlyThisWebsite.disabled = true;
				}
			}
		});
	} else {
		// For testing purposes when not in extension context
		if (useOnlyThisWebsite) {
			useOnlyThisWebsite.checked = false;
			useOnlyThisWebsite.disabled = false;
		}
		console.log("useOnlyThisWebsite initialized for testing");
	}
	if (customSitesList) {
		customSitesList.innerHTML = "";
	}
	const websiteRules = currentSettings.getWebsiteRulesList();
	if (customSites) {
		if (websiteRules.length === 0) {
			customSites.style.display = "none";
		} else {
			customSites.style.display = "block";
		}
	}
	// Sort the website rules by host in alphabetical order
	websiteRules.sort((a, b) => {
		return a.host.localeCompare(b.host);
	});
	const hostLabelMaxLength = 22;
	for (let site of websiteRules) {
		const siteElement = document.createElement("div");
		siteElement.classList.add("group-element");
		// Truncate the host if it's too long
		let hostLabel = site.host;
		if (hostLabel.length > hostLabelMaxLength) {
			hostLabel = hostLabel.substring(0, hostLabelMaxLength) + "...";
		}
		siteElement.textContent = hostLabel;
		const siteDelete = document.createElement("button");
		siteDelete.classList.add("element-delete");
		siteDelete.classList.add("site-delete");
		siteDelete.innerText = "x";
		if (siteDelete !== null) {
			siteDelete.addEventListener("click", () => {
				currentSettings.deleteSiteRule(site.host);
				updateSettings();
			});
		}
		siteElement.appendChild(siteDelete);
		const siteToggle = document.createElement("label");
		siteToggle.innerHTML = `
			<label class="toggle-switch settings-toggle">
				<input type="checkbox">
				<span class="toggle-inner settings-toggle-inner"></span>
			</label>
		`;
		const siteToggleInput = siteToggle.querySelector("input");
		if (siteToggleInput === null) {
			throw new Error("Could not find input element in site toggle");
		}
		siteToggleInput.checked = site.enabled;
		siteToggleInput.addEventListener("change", () => {
			site.enabled = siteToggleInput.checked;
			updateSettings();
		});
		siteElement.appendChild(siteToggle);
		if (customSitesList) {
			customSitesList.appendChild(siteElement);
		}
	}

	// Render the muted keywords without grouping
	console.log("Rendering trigger words section");
	if (groupsContainer) {
		groupsContainer.innerHTML = "";
		let groupContent = document.createElement("div");
		groupContent.classList.add("group-content");
		// Remove mute-list class to avoid column-reverse
		
		// Get all patterns from all groups
		let allPatterns = [];
		for (let group of currentSettings.getGroupsList()) {
			for (let pattern of group.patterns) {
				allPatterns.push({pattern: pattern, group: group});
			}
		}
		console.log("Found", allPatterns.length, "patterns");
		
		// Render all patterns FIRST (so they appear above the button)
		for (let item of allPatterns) {
			let patternElement = document.createElement("div");
			patternElement.classList.add("group-element");
			patternElement.textContent = item.pattern.plaintext();
			let deleteButton = document.createElement("button");
			deleteButton.classList.add("element-delete");
			deleteButton.textContent = "x";
			deleteButton.addEventListener("click", () => {
				item.group.deletePattern(item.pattern.id);
				updateSettings();
			});
			patternElement.appendChild(deleteButton);
			groupContent.appendChild(patternElement);
		}
		
		// Add the "Add word" button AFTER the patterns (so it appears below)
		let addButton = document.createElement("div");
		addButton.classList.add("add-button");
		addButton.innerHTML = `
			<div class="add-button-text">Add word</div>
			<div class="add-button-plus">+</div>
		`;
		if (allPatterns.length === 0) {
			addButton.classList.add("add-button-empty");
		}
		addButton.addEventListener("click", () => {
			console.log("Add word button clicked"); // Debug log
			displayAddWordModal((keyword, caseSensitive) => {
				if (keyword.trim().length === 0) {
					return;
				}
				// Add to the first group (default group should always exist)
				let groups = currentSettings.getGroupsList();
				if (groups.length === 0) {
					console.log("No groups found, creating default group");
					// Create default group if it doesn't exist
					currentSettings.groups["default"] = new Group("default", "Default Group", []);
					groups = currentSettings.getGroupsList();
				}
				let firstGroup = groups[0];
				if (firstGroup && firstGroup.addPattern) {
					firstGroup.addPattern(new KeywordMute(generateId(), keyword, caseSensitive));
					updateSettings();
				}
			});
		});
		groupContent.appendChild(addButton);
		
		groupsContainer.appendChild(groupContent);
		console.log("Add word button created and event listener attached");
	} else {
		console.error("groupsContainer not found!");
	}
	if (globalMuteAction) {
		globalMuteAction.value = currentSettings.globalMuteAction;
	}
	if (debugMode) {
		debugMode.checked = currentSettings.debugMode;
	}
	
	// Load AI settings
	loadAISettings();
}

function updateSettings() {
	console.log("updateSettings called");
	if (typeof chrome !== "undefined" && chrome.storage) {
		putSettings(currentSettings, () => {
			if (!deletedLegacySettings) {
				deletedLegacySettings = true;
				// Remove legacy settings now that we have successfully saved the new settings
				// TODO: Remove this in a few versions
				deleteSettings("settings");
			}
			renderSettings();
		}, (error) => {
			console.error("Failed to save settings:", error);
			// Still update the UI even if saving fails
			renderSettings();
		});
	} else {
		console.log("Chrome storage not available, updating UI only");
		// When Chrome storage is not available (like in standalone HTML), just update the UI
		renderSettings();
	}
}


function initModals() {
	console.log("Initializing modals...");
	// Remove existing event listeners to prevent duplication
	if (addWordCancel) {
		addWordCancel.removeEventListener("click", handleCancelClick);
		addWordCancel.addEventListener("click", handleCancelClick);
		console.log("Added cancel button listener");
	} else {
		console.log("addWordCancel element not found");
	}
	
	if (addWordSubmit) {
		addWordSubmit.removeEventListener("click", handleSubmitClick);
		addWordSubmit.addEventListener("click", handleSubmitClick);
		console.log("Added submit button listener");
	} else {
		console.log("addWordSubmit element not found");
	}
	
	// Get the nested child of class window-controls from addWordModal
	if (addWordModal) {
		let windowControls = addWordModal.getElementsByClassName("window-controls")[0];
		if (windowControls) {
			windowControls.removeEventListener("click", handleCancelClick);
			windowControls.addEventListener("click", handleCancelClick);
			console.log("Added window controls listener");
		}
	} else {
		console.log("addWordModal element not found");
	}
}

function handleCancelClick() {
	hideModals();
}

function handleSubmitClick() {
	let keyword = addWordInput.value;
	if (!keyword) {
		alert("Please enter a keyword");
		return;
	}
	hideModals();
	addWordSubmitCallback(keyword, addWordCaseSensitive.checked);
}

/**
 * @param {((keyword: string, caseSensitive: boolean) => void)} submitCallback
 */
function displayAddWordModal(submitCallback) {
	addWordInput.value = "";
	addWordCaseSensitive.checked = false;
	addWordSubmitCallback = submitCallback;

	addWordModal.style.display = "";
	modalContainer.style.display = "flex";

	addWordInput.focus();
	
	// Add Enter key handler
	addWordInput.addEventListener("keypress", handleKeyPress);
	
	// Add Escape key handler
	document.addEventListener("keydown", handleEscapeKey);
	
	// Add click handler for modal background
	modalContainer.addEventListener("click", handleModalBackgroundClick);
}

function handleKeyPress(event) {
	if (event.key === "Enter") {
		handleSubmitClick();
	}
}

function handleEscapeKey(event) {
	if (event.key === "Escape") {
		hideModals();
	}
}

function handleModalBackgroundClick(event) {
	// Close modal if clicking on the background (not on the modal itself)
	if (event.target === modalContainer) {
		hideModals();
	}
}

function hideModals() {
	addWordModal.style.display = "none";
	modalContainer.style.display = "none";
	
	// Remove the Enter key handler
	addWordInput.removeEventListener("keypress", handleKeyPress);
	
	// Remove the Escape key handler
	document.removeEventListener("keydown", handleEscapeKey);
	
	// Remove the modal background click handler
	modalContainer.removeEventListener("click", handleModalBackgroundClick);
}

// AI Settings functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AI sliders
    initializeAISliders();
    
    // Also initialize modals here as a backup
    setTimeout(() => {
        initModals();
    }, 100);
});

function loadAISettings() {
    // Load main AI toggle
    const aiEnabled = document.getElementById('ai-enabled');
    if (aiEnabled && aiEnabled instanceof HTMLInputElement) {
        aiEnabled.checked = currentSettings.isAIEnabled();
        // Remove existing listener to prevent duplication
        aiEnabled.removeEventListener('change', handleAIEnabledChange);
        aiEnabled.addEventListener('change', handleAIEnabledChange);
    }

    // Load filter toggles and sliders
    const filters = ['toxicity', 'depression', 'irony', 'topics'];
    filters.forEach(filterType => {
        const toggle = document.getElementById(`${filterType}-enabled`);
        const slider = document.getElementById(`${filterType}-threshold`);
        const valueElement = slider?.nextElementSibling;

        if (toggle && toggle instanceof HTMLInputElement) {
            toggle.checked = currentSettings.isAIFilterEnabled(filterType);
            // Remove existing listener to prevent duplication
            toggle.removeEventListener('change', handleFilterToggleChange);
            toggle.addEventListener('change', handleFilterToggleChange);
        }

        if (slider && slider instanceof HTMLInputElement && valueElement) {
            slider.value = currentSettings.getAIFilterThreshold(filterType).toString();
            valueElement.textContent = slider.value + '%';
            // Remove existing listener to prevent duplication
            slider.removeEventListener('input', handleSliderInput);
            slider.addEventListener('input', handleSliderInput);
        }
    });

    // Load zero-shot topics
    const zeroShotTopics = document.getElementById('zero-shot-topics');
    if (zeroShotTopics && zeroShotTopics instanceof HTMLInputElement) {
        zeroShotTopics.value = currentSettings.getZeroShotTopics();
        // Remove existing listener to prevent duplication
        zeroShotTopics.removeEventListener('input', handleZeroShotTopicsInput);
        zeroShotTopics.addEventListener('input', handleZeroShotTopicsInput);
    }
}

// AI Settings event handlers
function handleAIEnabledChange() {
    if (this instanceof HTMLInputElement) {
        currentSettings.updateAISettings({ enabled: this.checked });
        updateSettings();
    }
}

function handleFilterToggleChange() {
    if (this instanceof HTMLInputElement) {
        const filterType = this.id.replace('-enabled', '');
        currentSettings.aiSettings.filters[filterType].enabled = this.checked;
        updateSettings();
    }
}

function handleSliderInput() {
    if (this instanceof HTMLInputElement) {
        const filterType = this.id.replace('-threshold', '');
        currentSettings.aiSettings.filters[filterType].threshold = parseInt(this.value);
        const valueElement = this.nextElementSibling;
        if (valueElement) {
            valueElement.textContent = this.value + '%';
        }
        updateSettings();
    }
}

function handleZeroShotTopicsInput() {
    if (this instanceof HTMLInputElement) {
        currentSettings.updateAISettings({ zeroShotTopics: this.value });
        updateSettings();
    }
}

function handleUseGlobalChange() {
    currentSettings.mutableEnabled = useGlobal.checked;
    updateSettings();
}

function handleUseOnlyThisWebsiteChange() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        let currentTab = tabs[0];
        if (currentTab.url !== undefined) {
            let url = new URL(currentTab.url);
            let hostname = url.hostname;
            currentSettings.setWebsiteEnabled(hostname, useOnlyThisWebsite.checked);
            updateSettings();
        }
    });
}

function handleGlobalMuteActionChange() {
    currentSettings.globalMuteAction = globalMuteAction.value;
    updateSettings();
}

function handleDebugModeChange() {
    currentSettings.debugMode = debugMode.checked;
    updateSettings();
}

function initializeAISliders() {
    const sliders = [
        { id: 'toxicity-threshold', valueId: 'toxicity-threshold' },
        { id: 'depression-threshold', valueId: 'depression-threshold' },
        { id: 'irony-threshold', valueId: 'irony-threshold' },
        { id: 'topics-threshold', valueId: 'topics-threshold' }
    ];

    sliders.forEach(slider => {
        const sliderElement = document.getElementById(slider.id);
        const valueElement = sliderElement?.nextElementSibling;
        
        if (sliderElement && valueElement) {
            // Update value display when slider changes
            sliderElement.addEventListener('input', function() {
                if (this instanceof HTMLInputElement) {
                    valueElement.textContent = this.value + '%';
                }
            });
        }
    });
}