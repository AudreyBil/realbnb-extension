Start new chat
Projects

    Chats

Starred

Airbnb revival

    Minishell

Recents

    Fixing Chrome Manifest V3 Extension Issues
    Troubleshooting Chrome Extension Issues
    Troubleshooting Chrome Extension Popup Issue
    Securing API Keys for Browser Extensions
    Importing Functions Between Files in Browser Extensions
    Flexible Score Detection in Code
    Parsing Structured Text Response
    Improving Airbnb Revival Browser Extension

Professional plan
A
All projects
Airbnb revival
Private


Airbnb revival

    Fixing Chrome Manifest V3 Extension Issues
    Last message 7 minutes ago

Troubleshooting Chrome Extension Issues
Last message 28 minutes ago
Troubleshooting Chrome Extension Popup Issue
Last message 50 minutes ago
Securing API Keys for Browser Extensions
Last message 2 hours ago
Importing Functions Between Files in Browser Extensions
Last message 3 hours ago
Flexible Score Detection in Code
Last message 4 hours ago
Parsing Structured Text Response
Last message 1 day ago
Improving Airbnb Revival Browser Extension
Last message 1 day ago
Storing Airbnb Listing Description in a Variable
Last message 2 days ago
Improving Accuracy of Airbnb Revival Extension
Last message 2 days ago
Airbnb Listing Residency Likelihood Detector
Last message 6 days ago
Project knowledge
5% of knowledge capacity used
manifest
14 minutes ago
README
45 minutes ago
browser-polyfill
45 minutes ago
main
46 minutes ago
formatanalysis
46 minutes ago
extraction
46 minutes ago
api
46 minutes ago
airbnbrevival
46 minutes ago
airbnbrevival
46 minutes ago
options
46 minutes ago
options
46 minutes ago
background
1 hour ago
browser-polyfill.js

2.50 KB •119 lines•Formatting may be inconsistent from source
// This script provides a compatibility layer between Chrome and Firefox WebExtension APIs
// It allows you to use the 'browser' namespace in Chrome

(function() {
	// If the browser namespace already exists (Firefox), do nothing
	if (typeof browser !== 'undefined') {
	  return;
	}

	// Create the browser namespace for Chrome
	window.browser = {};

	// Storage API
	browser.storage = {
	  local: {
		get: function(keys) {
		  return new Promise((resolve, reject) => {
			chrome.storage.local.get(keys, (result) => {
			  if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			  } else {
				resolve(result);
			  }
			});
		  });
		},
		set: function(items) {
		  return new Promise((resolve, reject) => {
			chrome.storage.local.set(items, () => {
			  if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			  } else {
				resolve();
			  }
			});
		  });
		}
	  }
	};

	// Tabs API
	browser.tabs = {
	  query: function(queryInfo) {
		return new Promise((resolve, reject) => {
		  chrome.tabs.query(queryInfo, (tabs) => {
			if (chrome.runtime.lastError) {
			  reject(chrome.runtime.lastError);
			} else {
			  resolve(tabs);
			}
		  });
		});
	  },
	  get: function(tabId) {
		return new Promise((resolve, reject) => {
		  chrome.tabs.get(tabId, (tab) => {
			if (chrome.runtime.lastError) {
			  reject(chrome.runtime.lastError);
			} else {
			  resolve(tab);
			}
		  });
		});
	  },
	  onUpdated: chrome.tabs.onUpdated,
	  onActivated: chrome.tabs.onActivated
	};

	// Runtime API
	browser.runtime = {
	  getURL: chrome.runtime.getURL,
	  onInstalled: chrome.runtime.onInstalled
	};

	// Scripting API
	browser.scripting = {
	  executeScript: function(details) {
		return new Promise((resolve, reject) => {
		  chrome.scripting.executeScript(details, (results) => {
			if (chrome.runtime.lastError) {
			  reject(chrome.runtime.lastError);
			} else {
			  resolve(results);
			}
		  });
		});
	  }
	};

	// Action API (renamed from browserAction in Manifest V3)
	browser.action = {
	  enable: function(tabId) {
		return new Promise((resolve) => {
		  chrome.action.enable(tabId);
		  resolve();
		});
	  },
	  disable: function(tabId) {
		return new Promise((resolve) => {
		  chrome.action.disable(tabId);
		  resolve();
		});
	  },
	  setIcon: function(details) {
		return new Promise((resolve) => {
		  chrome.action.setIcon(details);
		  resolve();
		});
	  }
	};

	// WebNavigation API
	if (chrome.webNavigation) {
	  browser.webNavigation = {
		onCommitted: chrome.webNavigation.onCommitted
	  };
	}
  })();
