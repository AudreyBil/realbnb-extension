
import { formatAnalysisResult } from "./formatanalysis.js";
import { extractListingData } from "./extraction.js";
import { analyzeWitOpenAI } from "./api.js";
import { getCachedResult, cacheResult } from "./cache.js";

//Process tab
async function handleTabs(tabs){
	const contentDisplay = document.getElementById('contentDisplay');
	//Check if the tab exists
	if (!tabs[0]?.id) {
		contentDisplay.innerHTML = '<div class="error">No active tab found</div>';
		return;
	}

	try {
		// Get current URL to use as cache key
		const currentUrl = tabs[0].url;

		// Check if API key is set
		const { apiKey } = await browser.storage.local.get('apiKey');
		if (!apiKey) {
			contentDisplay.innerHTML = `
				<div class="error">
					OpenAI API key is not set.
					<a href="${browser.runtime.getURL('options/options.html')}" target="_blank">Click here to set it up</a>
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
				cachedIndicator.innerHTML = '<button id="refreshButton" class="refresh-button">Refresh Analysis</button>';
				resultDiv.appendChild(cachedIndicator);

				// Add refresh button event listener
				document.getElementById('refreshButton').addEventListener('click', () => {
					performAnalysis(tabs, contentDisplay, currentUrl);
				});
			}
			return;
		}

		// If no valid cache, perform a new analysis
		await performAnalysis(tabs, contentDisplay, currentUrl);

	} catch (error) {
		contentDisplay.classList.remove('loading');
		contentDisplay.innerHTML = `<div class="error">${error.message}</div>`;
	}
}

// Separate function to perform the analysis and update cache
async function performAnalysis(tabs, contentDisplay, currentUrl) {
	contentDisplay.classList.add('loading');
	contentDisplay.innerHTML = '<span class="loading-text">Analyzing listing</span>';

	// Extract the listing data
	let extractionResult;
	try {
		// Execute script to extract data from the current page
		const results = await browser.scripting.executeScript({
			target: { tabId: tabs[0].id },
			func: extractListingData
		});
		extractionResult = results[0];
	} catch (error) {
		console.error('Failed to extract listing data:', error);
		throw new Error('Unable to extract listing data from the page');
	}

	//Check for errors
	if (extractionResult.error) {
		throw new Error(extractionResult.error);
	}

	// Update loading message
	contentDisplay.innerHTML = '<span class="loading-text">Processing with AI</span>';

	//Analyze with OpenAI
	const analysis = await analyzeWitOpenAI(extractionResult.result);
	console.log(analysis); //debug log

	//Display the result
	contentDisplay.classList.remove('loading');
	const formattedResult = formatAnalysisResult(analysis);
	contentDisplay.innerHTML = formattedResult;

	// Cache the result if it's not an error
	if (!formattedResult.includes('<div class="error">')) {
		await cacheResult(currentUrl, formattedResult);
	}
}

// Add initialization logging
console.log('Script loaded');

// Initialize when popup opens
browser.tabs.query({ active: true, currentWindow: true }, handleTabs);
