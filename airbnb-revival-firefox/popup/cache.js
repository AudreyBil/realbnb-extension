// cache.js - Utility functions for managing the extension cache

// Get the current cache
export async function getCache() {
	const { cache = {} } = await browser.storage.local.get('cache');
	return cache;
  }

  // Get a cached result for a specific URL
  export async function getCachedResult(url) {
	const cache = await getCache();
	return cache[url];
  }

  // Save a result to the cache
  export async function cacheResult(url, result) {
	// Don't cache error results
	if (result.includes('<div class="error">')) {
	  return;
	}

	const cache = await getCache();

	// Add timestamp to track when entries were added
	const updatedCache = {
	  ...cache,
	  [url]: result
	};

	// Limit cache size to prevent storage issues (keep the 50 most recent)
	const urls = Object.keys(updatedCache);
	if (urls.length > 50) {
	  // Remove oldest entries to keep cache size manageable
	  const urlsToRemove = urls.slice(0, urls.length - 50);
	  urlsToRemove.forEach(url => delete updatedCache[url]);
	}

	// Save updated cache
	await browser.storage.local.set({ cache: updatedCache });
  }
