
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

	try {
		contentDisplay.classList.add('loading');
		contentDisplay.innerHTML = '<span class="loading-text">Analyzing listing</span>';
		//Extract the listing data
		const [extractionResult] = await browser.scripting.executeScript({
			target: { tabId: tabs[0].id},
			func: extractListingData
		});
		//Check for errors
		if (extractionResult.error) {
			throw new Error(extractionResult.error);
		}
		 // Update loading message
		 contentDisplay.innerHTML = '<span class="loading-text">Processing with AI</span>';

		//Analyze with OpenAI
		const analysis = await analyzeWitOpenAI(extractionResult.result);
		console.log(analysis);
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
