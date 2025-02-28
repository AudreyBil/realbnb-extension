
import { formatAnalysisResult } from "./formatanalysis.js";
import { extractListingData } from "./extraction.js";
import { analyzeWitOpenAI } from "./api.js";

//Process tab
async function handleTabs(tabs){
	const contentDisplay = document.getElementById('contentDisplay');
	//Check if the tab exists
	if (!tabs[0]?.id) {
		contentDisplay.innerHTML = '<div class="error">No active tab found</div>';
		return;
	}

	try {// Check if API key is set
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

		contentDisplay.classList.add('loading');
		contentDisplay.innerHTML = '<span class="loading-text">Analyzing listing</span>';
		// Extract the listing data - fix for Chrome
		 let extractionResult;
		 try {
		   // Try the browser.scripting approach first
		   const results = await browser.scripting.executeScript({
			 target: { tabId: tabs[0].id },
			 func: extractListingData
		   });
		   extractionResult = results[0];
		 } catch (scriptError) {
		   console.error('Scripting API failed:', scriptError);
		   // Fallback to chrome.tabs.executeScript for Chrome
		   if (typeof chrome !== 'undefined' && chrome.tabs) {
			 contentDisplay.innerHTML = '<span class="loading-text">Retrying extraction</span>';
			 const results = await new Promise((resolve, reject) => {
			   chrome.tabs.executeScript(
				 tabs[0].id,
				 { code: `(${extractListingData.toString()})()` },
				 (results) => {
				   if (chrome.runtime.lastError) {
					 reject(chrome.runtime.lastError);
				   } else {
					 resolve(results);
				   }
				 }
			   );
			 });
			 extractionResult = { result: results[0] };
		   }
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
		contentDisplay.innerHTML = formatAnalysisResult(analysis);
	} catch (error) {
		contentDisplay.classList.remove('loading');
		contentDisplay.innerHTML = `<div class="error">${error.message}</div>`;
	}
}

// Add initialization logging
console.log('Script loaded');

// Initialize when popup opens
browser.tabs.query({ active: true, currentWindow: true }, handleTabs);
