// This function extracts text and images from an Airbnb listing
// It needs to be defined in global scope for Chrome's executeScript
function extractListingData() {
	try {
	  // Get all text content
	  const bodyText = document.body.innerText;

	  // Get image URLs (limited to 10 first images)
	  const imageElements = document.querySelectorAll('img');
	  const images = Array.from(imageElements)
		.slice(0, 10)
		.map(img => img.src)
		.filter(src => src); // Remove any empty or null src values

	  return {
		pageText: bodyText,
		images: images
	  };
	} catch (error) {
	  console.error('Error extracting listing data:', error);
	  return {
		error: error.message,
		pageText: "",
		images: []
	  };
	}
  }

  // Export for module environments
  try {
	if (typeof module !== 'undefined' && module.exports) {
	  module.exports = { extractListingData };
	} else if (typeof exports !== 'undefined') {
	  exports.extractListingData = extractListingData;
	}
  } catch (e) {
	// Ignore export errors in non-module environments
  }

  // Make sure the function is available in the global scope
  // This is necessary for Chrome's executeScript
  try {
	window.extractListingData = extractListingData;
  } catch (e) {
	// Ignore if not in a window context
  }
