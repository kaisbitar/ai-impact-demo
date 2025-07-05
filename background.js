/**
 * AI Impact Tracker - Background Script
 * =========================================
 *
 * Original Author: Simonas Zilinskas
 * Original Repository: https://github.com/simonaszilinskas/ai-impact-tracker
 * License: GPL-3.0
 *
 * This is a modified version of the original work.
 *
 * This script handles extension initialization and background tasks.
 */

chrome.runtime.onInstalled.addListener((details) => {
  console.log("AI Impact Tracker installation type:", details.reason);

  // Different handling for install vs. update
  if (details.reason === "install") {
    // Fresh install
    console.log("Fresh install - initializing storage");
    chrome.storage.local.set({
      chatgptLogs: [],
      extensionVersion: chrome.runtime.getManifest().version,
    });
  } else if (details.reason === "update") {
    // Handle upgrade - preserve existing data
    console.log("Extension update detected - preserving data");

    try {
      chrome.storage.local.get(
        ["chatgptLogs", "extensionVersion"],
        (result) => {
          // Check for runtime errors
          if (chrome.runtime.lastError) {
            console.error(
              "Error accessing storage during update:",
              chrome.runtime.lastError
            );
            return;
          }

          // Store the new version
          const oldVersion = result.extensionVersion || "0.0";
          const newVersion = chrome.runtime.getManifest().version;

          console.log(`Updating from version ${oldVersion} to ${newVersion}`);

          // Extra log to debug upgrade path
          console.log("Existing data:", {
            hasLogs: !!result.chatgptLogs,
            logsIsArray: Array.isArray(result.chatgptLogs),
            logsCount: Array.isArray(result.chatgptLogs)
              ? result.chatgptLogs.length
              : 0,
          });

          // Make sure chatgptLogs exists and is valid
          if (!result.chatgptLogs || !Array.isArray(result.chatgptLogs)) {
            console.warn(
              "Invalid logs format detected during update, repairing..."
            );
            chrome.storage.local.set({
              chatgptLogs: [],
              extensionVersion: newVersion,
            });
          } else {
            // Just update the version while preserving logs
            chrome.storage.local.set({
              extensionVersion: newVersion,
            });
          }
        }
      );
    } catch (err) {
      console.error("Critical error during update:", err);
    }
  }
});

// Handle message from content script to open popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openPopup") {
    // Chrome doesn't allow programmatically opening the popup,
    // but we can focus the extension's browser action
    chrome.action.openPopup();
    console.log("Attempted to open popup");
    return true;
  }
});
