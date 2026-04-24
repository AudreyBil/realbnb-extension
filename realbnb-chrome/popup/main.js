// Import the required modules
import {analyzeWitOpenAI} from './api.js';
import {cacheResult, getCachedResult} from './cache.js';
import {extractListingData} from './extraction.js';
import {formatAnalysisResult} from './formatanalysis.js';

async function performAnalysis(tabs, contentDisplay, currentUrl) {
  // Update UI to show loading
  contentDisplay.classList.add('loading');
  contentDisplay.innerHTML =
      '<span class="loading-text">Analyzing listing</span>';

  // Extract the listing data
  let extractionResult;

  // Try to use the scripting API appropriate for the browser
  try {
    const results = await chrome.scripting.executeScript(
        {target: {tabId: tabs[0].id}, function: extractListingData});
    extractionResult = {result: results[0].result};
  } catch (error) {
    console.error('Error executing script:', error);
    throw new Error('Failed to extract listing data: ' + error.message);
  }

  // Update loading message
  contentDisplay.innerHTML =
      '<span class="loading-text">Processing with AI</span>';

  // Analyze with OpenAI
  const analysis = await analyzeWitOpenAI(extractionResult.result);

  // Display the result
  contentDisplay.classList.remove('loading');
  const formattedResult = formatAnalysisResult(analysis);
  contentDisplay.innerHTML = formattedResult;
  await cacheResult(currentUrl, formattedResult);
}

// Function to handle tabs and analyze the listing
async function handleTabs(tabs) {
  const contentDisplay = document.getElementById('contentDisplay');

  // Check if the tab exists
  if (!tabs[0]?.id) {
    contentDisplay.innerHTML = '<div class="error">No active tab found</div>';
    return;
  }

  try {
    // Get current URL to use as cache key
    const currentUrl = tabs[0].url;

    // Check if API key is set
    const result = await chrome.storage.local.get('apiKey');
    const apiKey = result.apiKey;

    if (!apiKey) {
      contentDisplay.innerHTML = `
          <div class="error">
            OpenAI API key is not set.
            <a href="${
          chrome.runtime.getURL(
              'options/options.html')}" target="_blank">Click here to set it up</a>
          </div>
        `;
      return;
    }

    // Check for cached result first
    const cachedResult = await getCachedResult(currentUrl);

    // Use cached result if available and not an error
    if (cachedResult && !cachedResult.includes('<div class="error">')) {
      contentDisplay.classList.remove('loading');
      contentDisplay.innerHTML = cachedResult;

      // Add a small indicator that this is a cached result
      const resultDiv = contentDisplay.querySelector('.result');
      if (resultDiv) {
        const cachedIndicator = document.createElement('div');
        cachedIndicator.className = 'cached-indicator';
        cachedIndicator.innerHTML =
            '<button id="refreshButton" class="refresh-button">Refresh Analysis</button>';
        resultDiv.appendChild(cachedIndicator);

        // Add refresh button event listener
        document.getElementById('refreshButton')
            .addEventListener('click', () => {
              performAnalysis(tabs, contentDisplay, currentUrl);
            });
      }
      return;
    }

    // if no valid cache, perform a new analysis
    await performAnalysis(tabs, contentDisplay, currentUrl);

  } catch (error) {
    contentDisplay.classList.remove('loading');
    contentDisplay.innerHTML = `<div class="error">${error.message}</div>`;
  }
}

chrome.tabs.query({active: true, currentWindow: true}, handleTabs);
