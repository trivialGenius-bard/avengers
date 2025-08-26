/* background.js */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'processModel') {
        // Simulate neural model processing (replace with actual model logic)
        console.log('Processing text with neural model:', message.data);

        // Example: Dummy logic (replace with your neural model inference)
        const isMatch = message.data.toLowerCase().includes('example'); // Placeholder

        // Send response
        sendResponse({ isMatch });
    }
    return true; // Indicates async response
});