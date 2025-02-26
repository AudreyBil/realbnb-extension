// Function to check if a URL matches Airbnb room pattern
function isAirbnbRoomUrl(url) {
  return url && url.match(/^https?:\/\/www\.airbnb\.[^/]+\/rooms\//);
}

// Function to update the action button state
async function updateActionButton(tabId, url) {
  if (isAirbnbRoomUrl(url)) {
    await browser.action.enable(tabId);
    await browser.action.setIcon({
      tabId: tabId,
      path: "icons/airbnb-icon.png"
    });
    } else {
      await browser.action.disable(tabId);
      await browser.action.setIcon({
        tabId: tabId,
        path: "icons/airbnb-icon-disabled.png"
    });
    }
}

 // Update all tabs when the extension starts
async function initializeAllTabs() {
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
	  await updateActionButton(tab.id, tab.url);
	}
  }

  //Update Action button when tab updates
function handleUpdated(tabId, changeInfo, tab) {
	if (changeInfo.url || changeInfo.status === 'complete') {
		updateActionButton(tabId, tab.url);
	}
}

// Update Action button with the tab activates
async function handleActivated(activeInfo) { //get the new tabID
	const tab = await browser.tabs.get(activeInfo.tabId); //get the tab info with the new tabID
	updateActionButton(tab.id, tab.url);
}

// Listen for tab updates
browser.tabs.onUpdated.addListener(handleUpdated);

// Listen for tab activation
browser.tabs.onActivated.addListener(handleActivated);

// Listen for navigation changes
browser.webNavigation?.onCommitted.addListener((details) => {
	if (details.frameId === 0) { // Only handle main frame navigation
	  updateActionButton(details.tabId, details.url);
	}
  });

  // Initialize all tabs when the extension starts
  initializeAllTabs().catch(console.error);

  // Handle extension installation or update
  browser.runtime.onInstalled.addListener(() => {
	initializeAllTabs().catch(console.error);
  });
