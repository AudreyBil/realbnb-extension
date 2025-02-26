//Format Open AI answer
function formatAnalysisResult(analysis) {
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
                    content: `Analyze this Airbnb listing and estimate wether it is likely to be a full-time rental or an owner-occupied home. .
					Consider factors like: description style, amenities, host information, calendar availabilities, etc.
                    Return the analysis in this exact format (score should always be on the first line of your answer):
                    Score: [0-100]%
                    Factors:
                    + [positive factor that suggests lived-in]
                    - [negative factor that suggests not lived-in]
                    - [negative factor]
                    + [positive factor]
                    + [positive factor]

                    Always use + for factors suggesting it's lived-in and - for factors suggesting it's not.
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

        return data.choices[0].message.content;
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
		console.log(analysis);
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
