//Extract text and images from airbnb listing
export async function extractListingData() {
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
