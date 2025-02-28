// Import the required modules
import { formatAnalysisResult } from "./formatanalysis.js";
import { extractListingData } from "./extraction.js";
import { analyzeWitOpenAI } from "./api.js";

// Function to handle tabs and analyze the listing
async function handleTabs(tabs) {
  const contentDisplay = document.getElementById('contentDisplay');

  // Check if the tab exists
  if (!tabs[0]?.id) {
    contentDisplay.innerHTML = '<div class="error">No active tab found</div>';
    return;
  }

  try {
    // Check if API key is set
    let apiKey;
    if (typeof chrome !== 'undefined' && chrome.storage) {
      // Try direct Chrome API first
      await new Promise(resolve => {
        chrome.storage.local.get('apiKey', (result) => {
          apiKey = result.apiKey;
          resolve();
        });
      });
    } else {
      // Fall back to browser polyfill
      const result = await browser.storage.local.get('apiKey');
      apiKey = result.apiKey;
    }

    if (!apiKey) {
      const optionsUrl = typeof chrome !== 'undefined' ?
        chrome.runtime.getURL('options/options.html') :
        browser.runtime.getURL('options/options.html');

      contentDisplay.innerHTML = `
        <div class="error">
          OpenAI API key is not set.
          <a href="${optionsUrl}" target="_blank">Click here to set it up</a>
        </div>
      `;
      return;
    }

    // Update UI to show loading
    contentDisplay.classList.add('loading');
    contentDisplay.innerHTML = '<span class="loading-text">Analyzing listing</span>';

    // Extract the listing data
    let extractionResult;

    // Try to use the scripting API appropriate for the browser
    try {
      if (typeof chrome !== 'undefined' && chrome.scripting) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: extractListingData
        });
        extractionResult = { result: results[0].result };
      } else {
        const results = await browser.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: extractListingData
        });
        extractionResult = results[0];
      }
    } catch (error) {
      console.error('Error executing script:', error);
      throw new Error('Failed to extract listing data: ' + error.message);
    }

    // Update loading message
    contentDisplay.innerHTML = '<span class="loading-text">Processing with AI</span>';

    // Analyze with OpenAI
    const analysis = await analyzeWitOpenAI(extractionResult.result);

    // Display the result
    contentDisplay.classList.remove('loading');
    contentDisplay.innerHTML = formatAnalysisResult(analysis);

  } catch (error) {
    contentDisplay.classList.remove('loading');
    contentDisplay.innerHTML = `<div class="error">${error.message}</div>`;
  }
}

// Add initialization logging
console.log('Popup script loaded');

// Initialize when popup opens
if (typeof chrome !== 'undefined' && chrome.tabs) {
  chrome.tabs.query({ active: true, currentWindow: true }, handleTabs);
} else {
  browser.tabs.query({ active: true, currentWindow: true }, handleTabs);
}

// Keep-alive ping to background service worker
if (typeof chrome !== 'undefined' && chrome.runtime) {
  // Send initial ping
  chrome.runtime.sendMessage({ action: "keepAlive" });

  // Setup periodic pings
  setInterval(() => {
    chrome.runtime.sendMessage({ action: "keepAlive" });
  }, 20000);
}
