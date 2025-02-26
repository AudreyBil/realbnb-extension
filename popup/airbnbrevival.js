
//Format Open AI answer
function formatAnalysisResult(analysis) {

	if (analysis.toLowerCase().includes("not enough data")) {
		return `There is not enough information on this listing in order to analyse it.`
	}

	// Split into lines
	const lines = analysis.split('\n').map(line => line.trim());

	// Find the score line specifically
	const scoreLine = lines.find(line => line.toLowerCase().startsWith('score:'));
	if (!scoreLine) {
		console.error('No score line found in:', analysis);
		return '<div class="error">Invalid analysis format</div>';
	}

	// Extract score from the score line
	const scoreMatch = scoreLine.match(/(\d+)%/);
	const score = scoreMatch ? scoreMatch[1] : "N/A";

	// Start collecting factors from after the score line
	const scoreLineIndex = lines.findIndex(line => line.toLowerCase().startsWith('score:'));
	const factors = lines
		.slice(scoreLineIndex + 1)  // Start from after score line
		.filter(line => line.trim().startsWith('+') || line.trim().startsWith('-'))  // Only take factors with + or -
		.map(line => ({
			text: line.substring(1).trim(),  // Remove the + or - and trim
			isPositive: line.startsWith('+')
		}));

	console.log('Parsed result:', { score, factors });  // Debug log

	return `
		<div class="result">
			<div class="score">
				<span class="score-number">${score}%</span>
				<span class="score-label">Lived-In Probability</span>
			</div>
			<div class="keywords">
				${factors.map(factor =>
					`<span class="keyword ${factor.isPositive ? 'positive' : 'negative'}">${factor.text}</span>`
				).join('')}
			</div>
		</div>
	`;
}

//Extract text and images from airbnb listing
async function extractListingData() {
	try {
		//Get all text content
		const bodyText = document.body.innerText;

		//Get image URLS (limited to 10 first images)
		const imageElements = document.querySelectorAll('img'); //Get a NodeList (collection of DOM elements)
		const images = Array.from(imageElements) //transform the NodeList into an array to be able to use all array methods
			.slice(0, 10) //take the 10 first images
			.map(img => img.src) //takes each element and extract just it src attribute
			.filter(src => src) // Remove any empty or null src values
		return {
			pageText: bodyText,
			images: images
		};
	} catch (error) {
		console.error('Error extracting listing data:', error);
		throw error;
	}
}

function fallbackAnalysis(listingData){

	const text = listingData.pageText.toLowerCase();
	let score = 50;
	const factors = [];

	 // Personal Use indicators
	const personalUseKeywords = [
		{ words: ["my home", "my place", "our place", "my family", "our family"], weight: 15, label: "+ Personal references" },
		{ words: ["when we're away", "when i'm away", "while i'm traveling"], weight: 15, label: "+ Limited availability" },
		{ words: ["my favorite", "i love", "we love", "personal"], weight: 5, label: "+ Personal touches" },
		{ words: ["primary", "live here", "live in", "my neighborhood"], weight: 10, label: "+ Home descriptions" },
		{ words: ["part of", "sharing", "share my", "share our"], weight: 10, label: "+ Sharing language" },
		{ words: ["toys", "my books", "my collection"], weight: 8, label: "+ Personal areas" },
	  ];

	// Dedicated rental indicators
	const rentalKeywords = [
		{ words: ["investment", "property manager", "management"], weight: 15, label: "- Commercial terms" },
		{ words: ["every amenity", "professionally cleaned", "professional cleaning", "hotel quality"], weight: 5, label: "- Professional setup" },
		{ words: ["available year", "available all year", "always available"], weight: 10, label: "- Full availability" },
		{ words: ["units", "properties", "our listings", "portfolio"], weight: 15, label: "- Multiple properties" },
	  ];

	let personalUseCount = 0;
	for (const category of personalUseKeywords){
		for (const keyword of category.words) {
			if (text.includes(keyword)) {
				score += category.weight;
				console.log('this kw was found:' + keyword);
				if (!factors.includes(category.label) && personalUseCount < 3){
					factors.push(category.label);
					personalUseCount++;
				}
				break;
			}
		}
	  }

	let rentalCount = 0;
	for (const category of rentalKeywords){
		for (keyword of category.words) {
			if (text.includes(keyword)) {
				score += category.weight;
				console.log('this kw was found:' + keyword);
				if (!factors.includes(category.label) && rentalCount < 3) {
					factors.push(category.label);
					rentalCount++;
				}
				break;
			}
		}
	}

	if (personalUseCount === 0 && rentalKeywords === 0){
			return `Not enough data`;
	}

	score = Math.max(0, Math.min(100, score));

	return `Score: ${score}%\nFactors:\n${factors.join("\n")}`;
}

//Send data to OpenAI and get back analysis
async function analyzeWitOpenAI(listingData) {
	try {
        // Prepare content array with text first
        const content = [{
            type: "text",
            text: listingData.pageText
        }];

        // Add images in correct format
        for (const imageUrl of listingData.images) {
            content.push({
                type: "image_url",
                image_url: {
                    url: imageUrl,
                    detail: "low"  // Can be "low", "medium", or "high"
                }
            });
        }
        const requestBody = {
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are analyzing vacation rental listings to determine if they appear to be primary residences that are occasionally shared or dedicated full-time vacation properties. This analysis is for educational purposes about the sharing economy.

					Focus only on objective indicators in the listing such as:
					- Presence of personal items vs. professional staging
					- How the space is described by the host
					- Availability patterns
					- Nature of amenities and furnishings
					- How the host describes their connection to the property

					This is an objective analysis of publicly available listing information only, with no personal judgment about hosts or properties. The purpose is to understand different types of listings in the sharing economy.
					Here are some signals to take into account - you can add other signals if you find them relevant:

					POSITIVE SIGNALS (suggesting owner-occupied):
					- Personal items visible in photos (books, family photos, unique decorations)
					- Listing mentions "my home" or personal stories about the space
					- Limited availability in calendar (only available on weekends or specific dates)
					- Detailed local recommendations written from personal experience
					- Evidence of personalization (not generic/professional staging)
					- Unique/eclectic furnishings rather than standardized decor
					- Workspace or areas that suggest regular personal use
					- Mentions sharing part of the home or nearby presence

					NEGATIVE SIGNALS (suggesting full-time rental):
					- Professional/generic staging in all photos
					- Multiple identical properties from same host
					- Year-round availability with minimal blocked dates
					- Generic/template descriptions of neighborhood
					- Standardized amenities focusing on tourists only
					- Property described as "investment" or "rental unit"
					- Professional management company mentioned
					- High volume of reviews suggesting constant turnover

					IGNORE the following as they are not reliable indicators:
					- Number of years hosting (long-time hosts can still share their homes)
					- Superhost status (applies to both types of hosts)
					- Professional photos (both types use these now)
					- Price (not a reliable indicator either way)

					Return the analysis in this exact format:
					Score: [0-100]%
					(This represents likelihood the property is a primary residence; higher = more likely)

					Factors:
					+ [positive factor suggesting primary residence, 2-4 words]
					+ [another positive factor]
					- [negative factor suggesting dedicated rental]
					- [another negative factor]

					Always use + for factors suggesting primary residence and - for factors suggesting dedicated rental.
					Each factor should be 2-4 words maximum.`
				},
                {
                    role: "user",
                    content: content
                }
            ],
            max_tokens: 300
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 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'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ API Error:', errorData);
            throw new Error(`API returned ${response.status}: ${errorData}`);
        }

        const data = await response.json();
        console.log('✅ OpenAI response:', data);

        if (!data.choices || !data.choices[0]) {
            console.error('❌ Unexpected API response structure:', data);
            throw new Error('Invalid response from OpenAI API');
        }

		const responseContent = data.choices[0].message.content;
		console.log(responseContent);
		if ((responseContent.toLowerCase().includes("sorry") ||
		responseContent.toLowerCase().includes("I can't assist")) && !responseContent.includes("Score:")){
			console.log('Response is a refusal - using fallback analysis');
      		return fallbackAnalysis(listingData);
		}

        return responseContent;
    } catch (error) {
        console.error('❌ Error in OpenAI analysis:', error);
        throw error;
	}
}

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
