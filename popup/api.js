//Send data to OpenAI and get back analysis
export async function analyzeWitOpenAI(listingData) {
	try {

		// Get API key from storage
		const { apiKey } = await browser.storage.local.get('apiKey'); //using object destructing syntax to retrieve the apiKey property

		if (!apiKey) {
			throw new Error('API key not found. Please set it in the extension options.');
		}

		//Prepare the request content
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
					- Ignore Number of years hosting (long-time hosts can still share their homes)
					- Ignore Superhost status (applies to both types of hosts)
					- Ignore Professional photos (both types use these now)
					- Ignore Price (not a reliable indicator either way)
					- Ignore Host responsiveness (both type can be responsive)

					Return the analysis in this exact format:
					Score: [0-100]%
					(This represents likelihood the property is a primary residence; higher = more likely)

					Factors:
					+ [positive factor suggesting primary residence, 2-4 words]
					+ [another positive factor]
					- [negative factor suggesting dedicated rental]
					- [another negative factor]

					Always use + for factors suggesting primary residence and - for factors suggesting dedicated rental. It does not have to be 2 of each, you can also have 5 negatives factors or 5 positives.
					Each factor should be 2-4 words maximum.`
				},
				{
					role: "user",
					content: content
				}
			],
			max_tokens: 300 // a token = roughly 3/4 characters so this keeps the analysis concise
		};

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer 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'
			},
			body: JSON.stringify(requestBody) //convert the js requestBody object into a JSON string to be transmitted over HTTP
		});

		if (!response.ok) {
			const errorData = await response.text();
			console.error('❌ API Error:', errorData);
			throw new Error(`API returned ${response.status}: ${errorData}`);
		}

		//Store Open AI answer
		const data = await response.json(); //Convert the JSON string sent by openAI into a JS object
		console.log('✅ OpenAI response:', data);

		//Checking that the answer contains the choices array, which contains the answer
		if (!data.choices || !data.choices[0]) {
			console.error('❌ Unexpected API response structure:', data);
			throw new Error('Invalid response from OpenAI API');
		}

		//Return the actual answer, stored in choices array, under message > content.
		//We use index 0 as we could have asked for several different answers from OpenAI in our initial request
		return data.choices[0].message.content;
	} catch (error) {
		console.error('❌ Error in OpenAI analysis:', error);
		throw error;
	}
}
