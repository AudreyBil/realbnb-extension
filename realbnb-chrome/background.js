// Absolute minimal background script
console.log("Background script loaded");

// Basic listener to show the script is working
chrome.runtime.onInstalled.addListener(function() {
  console.log("Extension installed");
});

// No async code, no complex logic - just basic functionality
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === "ping") {
    sendResponse({status: "pong"});
  }
  return true;
});
