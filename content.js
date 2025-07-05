/**
 * AI Impact Tracker - Content Script
 * =====================================
 *
 * Original Author: Simonas Zilinskas
 * Original Repository: https://github.com/simonaszilinskas/ai-impact-tracker
 * License: GPL-3.0
 *
 * This is a modified version of the original work.
 *
 * This script captures conversation data from the ChatGPT web interface,
 * extracts message content, calculates token usage, energy consumption,
 * and CO2 emissions. It persists data to Chrome storage for the popup UI.
 */

// In-memory storage for conversation logs
const logs = [];
let conversationId = null;
let isExtensionContextValid = true; // Track if extension context is still valid
let intervalIds = []; // Track all intervals to clear them if context is invalidated

// Constants for EcoLogits methodology
// These constants are derived from academic research on LLM energy consumption
const ENERGY_ALPHA = 8.91e-5; // Energy coefficient for model parameters (Wh/token/B-params)
const ENERGY_BETA = 1.43e-3; // Base energy per token (Wh/token)
const LATENCY_ALPHA = 8.02e-4; // Latency coefficient for model parameters (s/token/B-params)
const LATENCY_BETA = 2.23e-2; // Base latency per token (s/token)
const PUE = 1.2; // Power Usage Effectiveness for modern data centers
const GPU_MEMORY = 80; // A100 GPU memory in GB
const SERVER_POWER_WITHOUT_GPU = 1; // Server power excluding GPUs (kW)
const INSTALLED_GPUS = 8; // Typical GPUs per server in OpenAI's infrastructure
const GPU_BITS = 4; // Quantization level in bits (4-bit = 4x memory compression)
const WORLD_EMISSION_FACTOR = 0.418; // Global average emission factor (kgCO2eq/kWh)

/**
 * Checks if the extension context is still valid
 * @returns {boolean} True if context is valid, false otherwise
 */
function checkExtensionContext() {
  try {
    // Try to access a simple Chrome API property
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
      return true;
    }
  } catch (e) {
    console.warn("Extension context check failed:", e.message);
  }
  return false;
}

/**
 * Gets the current estimation method from storage
 * @returns {Promise<string>} 'community' or 'altman'
 */
function getEstimationMethod() {
  return new Promise((resolve) => {
    if (!checkExtensionContext()) {
      console.log(
        "Content script: No extension context, defaulting to community"
      );
      resolve("community"); // Default to community estimates
      return;
    }

    try {
      chrome.storage.local.get(["estimationMethod"], function (result) {
        if (chrome.runtime.lastError) {
          console.error(
            "Content script: Error getting estimation method:",
            chrome.runtime.lastError
          );
          resolve("community");
        } else {
          const method = result.estimationMethod || "community";
          console.log(
            "Content script: Loaded estimation method from storage:",
            method
          );
          resolve(method);
        }
      });
    } catch (error) {
      console.error(
        "Content script: Error accessing storage for estimation method:",
        error
      );
      resolve("community");
    }
  });
}

/**
 * Saves data to Chrome's local storage
 * Handles extension context invalidation gracefully
 * @param {Object} data - Data object to store
 */
function saveToStorage(data) {
  try {
    // Check if extension context is still valid
    if (!isExtensionContextValid || !checkExtensionContext()) {
      console.warn("Extension context invalidated, skipping storage save");
      return;
    }

    // Check if Chrome API is still available
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      chrome.storage.local.set(data, function () {
        // Check for runtime error
        if (chrome.runtime.lastError) {
          console.error("Chrome storage error:", chrome.runtime.lastError);
          // If context is invalidated, we'll retry once after a delay
          if (
            chrome.runtime.lastError.message.includes(
              "Extension context invalidated"
            )
          ) {
            console.warn("Extension context has been invalidated");
            isExtensionContextValid = false;
            // Clear all intervals to prevent further errors
            intervalIds.forEach((id) => clearInterval(id));
            intervalIds = [];
          }
        }
      });
    } else {
      console.warn("Chrome storage API not available");
    }
  } catch (e) {
    console.error("Storage error:", e);
    // Don't throw further, just log and continue
  }
}

/**
 * Saves or updates a conversation exchange
 * @param {string} userMessage - The user's message
 * @param {string} assistantResponse - ChatGPT's response
 */
async function saveLog(userMessage, assistantResponse) {
  // Use message prefix as unique identifier for this exchange
  const userMessageKey = userMessage.substring(0, 100);

  // Estimate token count (4 chars ≈ 1 token for English text)
  const userTokenCount = Math.ceil(userMessage.length / 4);
  const assistantTokenCount = Math.ceil(assistantResponse.length / 4);

  // Get the current estimation method and calculate environmental impact
  const estimationMethod = await getEstimationMethod();
  const energyData = calculateEnergyAndEmissions(
    assistantTokenCount,
    estimationMethod
  );
  const energyUsage = energyData.totalEnergy;
  const co2Emissions = energyData.co2Emissions;

  // Check if we already have a log with this user message
  const existingLogIndex = logs.findIndex(
    (log) => log.userMessage.substring(0, 100) === userMessageKey
  );

  let shouldUpdateNotification = false;

  if (existingLogIndex !== -1) {
    // Update existing log if new response is more complete
    const existingLog = logs[existingLogIndex];

    if (
      assistantResponse.length > existingLog.assistantResponse.length ||
      (assistantResponse.length > 0 &&
        existingLog.assistantResponse.length === 0)
    ) {
      // Update with more complete response
      logs[existingLogIndex] = {
        ...existingLog,
        assistantResponse: assistantResponse,
        assistantTokenCount: assistantTokenCount,
        energyUsage: energyData.totalEnergy,
        co2Emissions: energyData.co2Emissions,
        lastUpdated: Date.now(),
      };

      saveToStorage({ chatgptLogs: logs });
      shouldUpdateNotification = true;
    }
  } else {
    // Create new log entry
    const logEntry = {
      timestamp: Date.now(),
      lastUpdated: Date.now(),
      url: window.location.href,
      conversationId: conversationId,
      userMessage: userMessage,
      assistantResponse: assistantResponse,
      userTokenCount: userTokenCount,
      assistantTokenCount: assistantTokenCount,
      energyUsage: energyUsage,
      co2Emissions: co2Emissions,
    };

    logs.push(logEntry);
    saveToStorage({ chatgptLogs: logs });
    shouldUpdateNotification = true;
  }

  // Always update the notification when logs change
  // Create the notification if it doesn't exist yet
  if (!document.getElementById("ai-impact-notification")) {
    createUsageNotification();
  } else {
    updateUsageNotification();
  }
}

/**
 * Scans the DOM for ChatGPT conversation messages
 * Uses data attributes specific to ChatGPT's DOM structure
 * Includes error handling to prevent extension crashes
 */
async function scanMessages() {
  // Skip if extension context is invalidated
  if (!isExtensionContextValid) {
    return false;
  }

  try {
    // Find all user and assistant messages by their data attributes
    const userMessages = [
      ...document.querySelectorAll('[data-message-author-role="user"]'),
    ];
    const assistantMessages = [
      ...document.querySelectorAll('[data-message-author-role="assistant"]'),
    ];

    // Attempt alternative selectors if the primary ones didn't find anything
    let foundMessages = userMessages.length > 0 && assistantMessages.length > 0;

    // If we didn't find any messages with the primary selectors, try alternative ones
    if (!foundMessages) {
      // Try some alternative selectors that might match different versions of ChatGPT
      const alternativeUserSelectors = [
        ".markdown p", // Look for paragraph text in markdown areas
        '[data-role="user"]',
        ".user-message",
        '[data-testid="user-message"]',
        ".text-message-content",
      ];

      const alternativeAssistantSelectors = [
        ".markdown p",
        '[data-role="assistant"]',
        ".assistant-message",
        '[data-testid="assistant-message"]',
        ".assistant-response",
      ];

      // Try each alternative selector
      for (const userSelector of alternativeUserSelectors) {
        const altUserMessages = document.querySelectorAll(userSelector);
        if (altUserMessages.length > 0) {
          for (const assistantSelector of alternativeAssistantSelectors) {
            const altAssistantMessages =
              document.querySelectorAll(assistantSelector);
            if (altAssistantMessages.length > 0) {
              console.log(
                `Found alternative selectors: ${userSelector} (${altUserMessages.length}) and ${assistantSelector} (${altAssistantMessages.length})`
              );

              // Try to process these alternative messages
              for (
                let i = 0;
                i <
                Math.min(altUserMessages.length, altAssistantMessages.length);
                i++
              ) {
                try {
                  const userMessage = altUserMessages[i].textContent.trim();
                  const assistantResponse =
                    altAssistantMessages[i].textContent.trim();

                  if (userMessage && assistantResponse) {
                    // Save any non-empty exchange
                    await saveLog(userMessage, assistantResponse);
                    foundMessages = true;
                  }
                } catch (altMessageError) {
                  console.error(
                    "Error processing alternative message pair:",
                    altMessageError
                  );
                }
              }

              // If we found messages with this selector pair, stop trying others
              if (foundMessages) break;
            }
          }
          // If we found messages with any assistant selector, stop trying other user selectors
          if (foundMessages) break;
        }
      }
    }

    // Log the results of the scan for debugging
    if (userMessages.length > 0 || assistantMessages.length > 0) {
      console.log(
        `Found ${userMessages.length} user messages and ${assistantMessages.length} assistant messages`
      );
    }

    // Process message pairs in order
    for (let i = 0; i < userMessages.length; i++) {
      if (i < assistantMessages.length) {
        try {
          const userMessage = userMessages[i].textContent.trim();
          const assistantResponse = assistantMessages[i].textContent.trim();

          if (userMessage) {
            // Save any non-empty exchange
            await saveLog(userMessage, assistantResponse);
          }
        } catch (messageError) {
          console.error("Error processing message pair:", messageError);
          // Continue with next message pair
        }
      }
    }

    return foundMessages;
  } catch (e) {
    console.error("Error scanning messages:", e);
    return false;
  }
}

/**
 * Intercepts fetch requests to extract conversation information
 * Uses a fetch proxy pattern to capture API responses without affecting functionality
 */
function setupFetchInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async function (resource, init) {
    const url = resource instanceof Request ? resource.url : resource;

    // Call original fetch
    const response = await originalFetch.apply(this, arguments);

    // Process conversation API responses
    if (typeof url === "string" && url.includes("conversation")) {
      try {
        // Extract conversation ID from URL
        const match = url.match(/\/c\/([a-zA-Z0-9-]+)/);
        if (match && match[1]) {
          conversationId = match[1];
        }

        // Process server-sent events streams
        if (
          response.headers.get("content-type")?.includes("text/event-stream")
        ) {
          const clonedResponse = response.clone();

          (async () => {
            try {
              const reader = clonedResponse.body.getReader();
              const decoder = new TextDecoder();
              let buffer = "";
              let lastUpdateTime = 0;

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Process stream data
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                // Extract conversation ID
                const convoMatch = buffer.match(
                  /"conversation_id":\s*"([^"]+)"/
                );
                if (convoMatch && convoMatch[1]) {
                  conversationId = convoMatch[1];
                }

                // Check for content updates during streaming
                const now = Date.now();
                if (now - lastUpdateTime > 500) {
                  // Update every 500ms max
                  lastUpdateTime = now;

                  // Quick scan for updates during active generation
                  await scanMessages();

                  // Update notification with latest data
                  updateUsageNotification();
                }

                // Limit buffer size
                if (buffer.length > 100000) {
                  buffer = buffer.substring(buffer.length - 50000);
                }
              }

              // Scan after stream completes
              setTimeout(async () => {
                await scanMessages();
                updateUsageNotification();
              }, 1000);
            } catch {
              // Ignore stream processing errors
            }
          })();
        }
      } catch {
        // Ignore general interception errors
      }
    }

    return response;
  };
}

/**
 * Sets up a MutationObserver to detect when new messages are added to the DOM
 * Efficiently triggers scans only when relevant content changes
 */
function setupObserver() {
  // Track the time of the last update to avoid excessive updates
  let lastUpdateTime = 0;

  const observer = new MutationObserver(async (mutations) => {
    let shouldScan = false;

    // Check if any assistant messages were added or modified
    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node.getAttribute("data-message-author-role") === "assistant" ||
              node.querySelector('[data-message-author-role="assistant"]'))
          ) {
            shouldScan = true;
            break;
          }
        }
      } else if (mutation.type === "characterData") {
        // Text content changed inside an element
        // This can catch typing updates on the assistant's responses
        shouldScan = true;
      }

      if (shouldScan) break;
    }

    // Scan on relevant changes
    if (shouldScan) {
      const now = Date.now();

      // Throttle updates to avoid excessive processing
      // Update at most every 300ms during active typing/generation
      if (now - lastUpdateTime > 300) {
        lastUpdateTime = now;

        // Scan for new/updated content
        await scanMessages();

        // Update the notification with latest data
        updateUsageNotification();
      }

      // Also do delayed scans to catch fully completed responses
      setTimeout(async () => {
        await scanMessages();
        updateUsageNotification();
      }, 1000);
    }
  });

  // Observe the entire document for changes, including text changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

/**
 * Creates and inserts the usage notification element into the ChatGPT UI
 */
function createUsageNotification() {
  // Check if notification already exists
  if (document.getElementById("ai-impact-notification")) {
    return;
  }

  // Create the notification element
  const notification = document.createElement("div");
  notification.id = "ai-impact-notification";
  notification.className = "ai-impact-notification";

  // Create the styles for the notification
  const styles = document.createElement("style");
  styles.textContent = `
    /* Notification box styles */
    .ai-impact-notification {
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      touch-action: none;
      background: #f0fdf4;
      color: #166534;
      padding: 10px 24px;
      border-radius: 32px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      font-size: 20px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      transition: all 0.3s ease;
      cursor: move;
      line-height: 1.2;
      text-align: center;
      border: 3px solid #4ade80;
      font-weight: 600;
      min-width: 0;
      max-width: none;
      height: auto;
      user-select: none;
    }
    .ai-impact-notification.low-usage-notification {
      background: #f0fdf4;
      color: #166534;
      border: 3px solid #4ade80;
    }
    .ai-impact-notification.medium-usage-notification {
      background: #fefce8;
      color: #92400e;
      border: 3px solid #fbbf24;
    }
    .ai-impact-notification.high-usage-notification {
      background: #fef2f2;
      color: #991b1b;
      border: 3px solid #ef4444;
    }
    .ai-impact-emoji {
      margin: 0 12px 0 0;
      font-size: 24px;
      color: inherit;
      background: none;
      display: flex;
      align-items: center;
    }
    
    .ai-impact-content {
      text-align: center;
      white-space: nowrap;
      overflow: visible;
    }
    
    .ai-impact-message {
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .ai-impact-energy {
      font-weight: 500;
      display: inline;
      margin-left: 4px;
    }
    
    /* Usage level colors for spark emoji - more specific selectors */
    .ai-impact-notification .ai-impact-emoji.low-usage {
      background: #000; /* Grey for low usage */
    }
    
    .ai-impact-notification .ai-impact-emoji.medium-usage {
      
      background: #000; /* Amber for medium usage */
    }
    
    .ai-impact-notification .ai-impact-emoji.high-usage {
      background: red;/* Red for high usage */
    }
    
    /* Make the notification adapt to the dark mode of ChatGPT */
    .dark .ai-impact-notification {
      background-color: #343541;
      color: #ECECF1;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .ai-impact-notification {
        font-size: 11px;
        padding: 3px 10px;
      }
    }
    
    @media (max-width: 480px) {
      .ai-impact-notification {
        font-size: 10px;
        padding: 3px 8px;
      }
    }
  `;

  // Default basic message (will be updated by updateUsageNotification)
  let message = "Track AI impact, support forest restoration";

  // Initially populate with basic message
  notification.innerHTML = `
    <div class="ai-impact-content">
      <div id="ai-impact-message" class="ai-impact-message">${message}</div>
    </div>
  `;

  // Make the notification draggable
  let isDragging = false;
  let offsetX, offsetY;

  // Mouse events for dragging
  notification.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", moveDrag);
  document.addEventListener("mouseup", endDrag);

  // Touch events for mobile dragging
  notification.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    e.clientX = touch.clientX;
    e.clientY = touch.clientY;
    startDrag(e);
  });

  document.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    e.clientX = touch.clientX;
    e.clientY = touch.clientY;
    moveDrag(e);
  });

  document.addEventListener("touchend", endDrag);

  // Start dragging
  function startDrag(e) {
    isDragging = true;

    // Calculate the offset of the cursor/touch from the notification's top-left corner
    const rect = notification.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // Change cursor to grabbing during drag
    notification.style.cursor = "grabbing";

    // Prevent default behaviors
    e.preventDefault();
  }

  // Handle drag movement
  function moveDrag(e) {
    if (!isDragging) return;

    // Calculate new position
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;

    // Keep notification within viewport bounds
    const notifWidth = notification.offsetWidth;
    const notifHeight = notification.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Constrain horizontal position
    const boundedX = Math.max(0, Math.min(x, windowWidth - notifWidth));

    // Constrain vertical position
    const boundedY = Math.max(0, Math.min(y, windowHeight - notifHeight));

    // Update position styles - remove the transform property
    notification.style.left = boundedX + "px";
    notification.style.top = boundedY + "px";
    notification.style.transform = "none";

    // Prevent default to avoid page scrolling during drag
    e.preventDefault();
  }

  // End dragging
  function endDrag() {
    if (isDragging) {
      isDragging = false;
      // Change cursor back to move
      notification.style.cursor = "move";

      // Save position to localStorage for persistence
      try {
        const rect = notification.getBoundingClientRect();
        const position = {
          x: rect.left,
          y: rect.top,
        };
        localStorage.setItem(
          "aiImpactNotificationPosition",
          JSON.stringify(position)
        );
      } catch (e) {
        console.error("Error saving notification position:", e);
      }
    }
  }

  // Add event listener to open extension popup (now on double click to avoid conflicts with dragging)
  notification.addEventListener("dblclick", () => {
    // Try to open the extension popup programmatically
    try {
      chrome.runtime.sendMessage({ action: "openPopup" });
    } catch (e) {
      console.error("Failed to open popup:", e);
    }
  });

  // Add the styles to the head with error handling
  try {
    if (document.head) {
      document.head.appendChild(styles);
    } else {
      console.warn("Document head not available for styles - will retry");
      // If head is not available yet, we'll try again later
      setTimeout(() => {
        if (document.head) {
          document.head.appendChild(styles);
        }
      }, 500);
    }
  } catch (e) {
    console.error("Error appending styles:", e);
  }

  // Find the right position in ChatGPT's UI to insert the notification
  try {
    const mainHeader = document.querySelector("header");
    if (mainHeader && mainHeader.parentNode) {
      // Try to insert after the header for better integration
      mainHeader.parentNode.insertBefore(notification, mainHeader.nextSibling);
    } else if (document.body) {
      // Fallback to body if header not found
      document.body.appendChild(notification);
    } else {
      console.warn(
        "Neither header nor body available for notification insertion"
      );
    }
  } catch (e) {
    console.error("Error inserting notification:", e);
  }

  // Remember position if dragged, using localStorage to persist across page refreshes
  try {
    // Check if we have saved position in localStorage
    const savedPosition = localStorage.getItem("aiImpactNotificationPosition");
    if (savedPosition) {
      const position = JSON.parse(savedPosition);
      notification.style.left = position.x + "px";
      notification.style.top = position.y + "px";
      notification.style.transform = "none"; // Remove the default centering
    }
  } catch (e) {
    console.error("Error restoring notification position:", e);
  }

  console.log("AI Impact notification added to page");

  // Initial update
  updateUsageNotification();
}

/**
 * Updates the notification with the current user's usage level
 */
function updateUsageNotification() {
  try {
    const messageElement = document.getElementById("ai-impact-message");

    if (!messageElement) {
      // Element not found, which could be normal if notification isn't created yet
      return;
    }

    // Get today's usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter logs for today only - with error handling
    let todayLogs = [];
    let todayEnergyUsage = 0;
    let todayMessages = 0;

    try {
      // Safely filter logs
      if (Array.isArray(logs)) {
        todayLogs = logs.filter((log) => {
          try {
            // Handle potentially invalid log entries
            return log && log.timestamp && new Date(log.timestamp) >= today;
          } catch (dateError) {
            // Skip this log entry if date parsing fails
            return false;
          }
        });

        todayMessages = todayLogs.length;

        // Safely calculate energy
        todayLogs.forEach((log) => {
          try {
            todayEnergyUsage += log.energyUsage || 0;
          } catch (energyError) {
            // Skip this log if energy calculation fails
          }
        });
      }
    } catch (logsError) {
      console.error("Error processing logs for notification:", logsError);
      // Continue with defaults (zeros) if logs processing fails
    }

    // Format energy usage for display (1 decimal place)
    const formattedEnergy = todayEnergyUsage.toFixed(1);

    // Add a timestamp for debugging
    const updateTime = new Date().toLocaleTimeString();

    // Determine icon and color based on user state and usage level
    const userState = getUserState();
    const icon = userState === "donor" ? "🌿" : "⚡️";

    // Define usage thresholds (in Wh)
    const LOW_USAGE_THRESHOLD = 5.0; // Green: 0-5 Wh
    const MEDIUM_USAGE_THRESHOLD = 15.0; // Yellow: 5-15 Wh
    // Red: 15+ Wh

    // Determine usage level and notification class
    let notificationClass = "low-usage-notification";
    if (todayEnergyUsage > MEDIUM_USAGE_THRESHOLD) {
      notificationClass = "high-usage-notification";
    } else if (todayEnergyUsage > LOW_USAGE_THRESHOLD) {
      notificationClass = "medium-usage-notification";
    }

    // Update the notification box class
    const notificationBox = document.getElementById("ai-impact-notification");
    if (notificationBox) {
      notificationBox.classList.remove(
        "low-usage-notification",
        "medium-usage-notification",
        "high-usage-notification"
      );
      notificationBox.classList.add(notificationClass);
    }

    // Set the icon and message as before
    let message = `<span class="ai-impact-emoji">${icon}</span> <span class="ai-impact-energy">${formattedEnergy} Wh today</span>`;

    // Log for debugging how frequently updates occur
    console.log(
      `[${updateTime}] Updating energy notification: ${formattedEnergy} Wh (${notificationClass})`
    );

    // Update the UI with error handling
    try {
      messageElement.innerHTML = message;
    } catch (updateError) {
      console.error("Error updating notification message:", updateError);
    }
  } catch (error) {
    console.error("Error in updateUsageNotification:", error);
  }
}

/**
 * Initializes the extension functionality
 */
function initialize() {
  // Load existing logs from storage with improved error handling and retry
  initializeWithRetry(3);

  // Setup periodic storage validation to fix potential issues
  setInterval(validateAndRepairStorage, 5 * 60 * 1000); // Every 5 minutes

  // Setup when DOM is ready
  const setupUI = async () => {
    setupFetchInterceptor();
    setupObserver();
    await scanMessages(); // Initial scan

    // Create notification if not created yet
    if (!document.getElementById("ai-impact-notification")) {
      createUsageNotification();
    }
  };

  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    setTimeout(setupUI, 1000);
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(setupUI, 1000);
    });
  }

  // Monitor URL changes to detect new conversations
  let lastUrl = window.location.href;
  const urlMonitorInterval = setInterval(() => {
    if (lastUrl !== window.location.href) {
      lastUrl = window.location.href;

      // Extract conversation ID from URL
      try {
        const match = window.location.href.match(/\/c\/([a-zA-Z0-9-]+)/);
        if (match && match[1]) {
          conversationId = match[1];
        }
      } catch {
        // Ignore URL parsing errors
      }

      // Scan after URL change
      setTimeout(async () => await scanMessages(), 1000);
    }
  }, 1000);
  intervalIds.push(urlMonitorInterval);

  // Setup periodic notification updates (every 2 minutes)
  // This ensures the notification reflects current usage even if the user
  // has the page open for a long time
  setInterval(() => {
    if (document.getElementById("ai-impact-notification")) {
      updateUsageNotification();
    } else {
      // In case the notification has been removed from the DOM for some reason
      createUsageNotification();
    }
  }, 2 * 60 * 1000); // 2 minutes in milliseconds
}

/**
 * Reloads logs from Chrome storage to sync with popup changes
 */
function reloadLogsFromStorage() {
  return new Promise((resolve) => {
    if (!checkExtensionContext()) {
      resolve();
      return;
    }

    try {
      chrome.storage.local.get(["chatgptLogs"], function (result) {
        if (chrome.runtime.lastError) {
          console.error(
            "Error reloading logs from storage:",
            chrome.runtime.lastError
          );
          resolve();
        } else {
          const storedLogs = result.chatgptLogs || [];
          // Update the in-memory logs array with the recalculated values
          logs.length = 0; // Clear existing logs
          logs.push(...storedLogs); // Add the updated logs
          console.log(`Reloaded ${logs.length} logs from storage`);
          resolve();
        }
      });
    } catch (error) {
      console.error("Error accessing storage for log reload:", error);
      resolve();
    }
  });
}

// Listen for messages from popup
if (
  typeof chrome !== "undefined" &&
  chrome.runtime &&
  chrome.runtime.onMessage
) {
  try {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "updateNotification") {
        if (message.enabled) {
          // Show the notification if it doesn't exist
          if (!document.getElementById("ai-impact-notification")) {
            createUsageNotification();
          }
        } else {
          // Hide the notification if it exists
          const notification = document.getElementById(
            "ai-impact-notification"
          );
          if (notification) {
            notification.parentNode.removeChild(notification);
          }
        }
        return true;
      } else if (message.type === "estimationMethodChanged") {
        // Acknowledge the change and reload logs from storage after a brief delay
        console.log(
          "Content script: Estimation method changed to:",
          message.method
        );

        // Wait a moment to ensure popup has finished saving, then reload
        setTimeout(() => {
          reloadLogsFromStorage().then(() => {
            // Update the notification with the new calculations
            updateUsageNotification();
            console.log(
              "Content script: Notification updated with new estimation method"
            );
          });
        }, 100);

        sendResponse({ success: true });
        return true;
      }
    });
  } catch (e) {
    console.warn("Failed to add message listener:", e);
  }
}

/**
 * Calculates energy usage and CO2 emissions based on selected methodology
 *
 * This implements either:
 * 1. EcoLogits methodology (community estimates) from https://arxiv.org/abs/2309.12456
 * 2. Sam Altman's estimation (0.34 Wh per query, scaled by tokens)
 *
 * @param {number} outputTokens - Number of tokens in the assistant's response
 * @param {string} method - 'community' or 'altman'
 * @returns {Object} Energy usage and emissions data
 */
function calculateEnergyAndEmissions(outputTokens, method = "community") {
  if (method === "altman") {
    // Sam Altman's estimation: 0.34 Wh per query with 781 average output tokens
    const altmanEnergyPerToken = 0.34 / 781; // ~0.000435 Wh per token
    const totalEnergy = outputTokens * altmanEnergyPerToken;

    // Ensure minimum energy value for visibility in UI
    const minEnergy = 0.01;
    const normalizedEnergy = Math.max(totalEnergy, minEnergy);

    // Calculate CO2 emissions (grams)
    const co2Emissions = normalizedEnergy * WORLD_EMISSION_FACTOR;

    return {
      numGPUs: 1, // Simplified for Altman estimate
      totalEnergy: normalizedEnergy,
      co2Emissions,
      modelDetails: {
        method: "altman",
        energyPerToken: altmanEnergyPerToken,
      },
    };
  } else {
    // Community estimates using EcoLogits methodology
    // ChatGPT is a Mixture of Experts (MoE) model with 440B total parameters
    const totalParams = 440e9;
    const activeRatio = 0.125; // 12.5% activation ratio for MoE models
    const activeParams = 55e9; // 55B active parameters
    const activeParamsBillions = activeParams / 1e9; // Convert to billions for calculations

    // Energy consumption per token (Wh/token) - based on ACTIVE parameters
    // This is because energy consumption during inference is primarily determined by compute,
    // which is proportional to active parameters in MoE models
    const energyPerToken = ENERGY_ALPHA * activeParamsBillions + ENERGY_BETA;

    // Calculate GPU memory requirements - based on TOTAL parameters
    // Memory footprint is determined by the total model size, not just active parameters
    const memoryRequired = (1.2 * totalParams * GPU_BITS) / 8; // in bytes
    const numGPUs = Math.ceil(memoryRequired / (GPU_MEMORY * 1e9));

    // Calculate inference latency - based on ACTIVE parameters
    // Latency is determined by compute, which is proportional to active parameters in MoE models
    const latencyPerToken = LATENCY_ALPHA * activeParamsBillions + LATENCY_BETA;
    const totalLatency = outputTokens * latencyPerToken;

    // Calculate GPU energy consumption (Wh) - using active parameters for computation
    const gpuEnergy = outputTokens * energyPerToken * numGPUs;

    // Calculate server energy excluding GPUs (Wh)
    // Converting kW to Wh by multiplying by hours (latency / 3600)
    const serverEnergyWithoutGPU =
      ((totalLatency * SERVER_POWER_WITHOUT_GPU * numGPUs) /
        INSTALLED_GPUS /
        3600) *
      1000;

    // Total server energy (Wh)
    const serverEnergy = serverEnergyWithoutGPU + gpuEnergy;

    // Apply data center overhead (PUE)
    const totalEnergy = PUE * serverEnergy;

    // Ensure minimum energy value for visibility in UI
    const minEnergy = 0.01; // Minimum 0.01 Wh to ensure visibility
    const normalizedEnergy = Math.max(totalEnergy, minEnergy);

    // Calculate CO2 emissions (grams)
    const co2Emissions = normalizedEnergy * WORLD_EMISSION_FACTOR;

    return {
      numGPUs,
      totalEnergy: normalizedEnergy,
      co2Emissions,
      modelDetails: {
        totalParams: totalParams / 1e9,
        activeParams: activeParams / 1e9,
        activationRatio: activeRatio,
        method: "community",
      },
    };
  }
}

/**
 * Validates and repairs storage if needed
 * This helps recover from corrupted/missing data
 */
function validateAndRepairStorage() {
  // Check if extension context is still valid
  if (!isExtensionContextValid || !checkExtensionContext()) {
    console.log("Extension context invalidated, skipping storage validation");
    return;
  }

  console.log("Running storage validation check...");

  try {
    chrome.storage.local.get(["chatgptLogs", "extensionVersion"], (result) => {
      if (chrome.runtime.lastError) {
        console.error("Error checking storage:", chrome.runtime.lastError);
        return;
      }

      let needsRepair = false;

      // Check if logs exists and is an array
      if (!result.chatgptLogs || !Array.isArray(result.chatgptLogs)) {
        console.warn("Invalid logs format in storage, needs repair");
        needsRepair = true;
      }

      // Check if version is missing
      if (!result.extensionVersion) {
        console.warn("Missing extension version in storage, will repair");
        needsRepair = true;
      }

      if (needsRepair) {
        // Use in-memory logs if they exist and are valid
        if (logs && Array.isArray(logs) && logs.length > 0) {
          console.log("Repairing storage with in-memory logs");
          chrome.storage.local.set({
            chatgptLogs: logs,
            extensionVersion: chrome.runtime.getManifest().version,
          });
        } else {
          // Otherwise initialize fresh (last resort)
          console.log("Initializing fresh logs in storage");
          chrome.storage.local.set({
            chatgptLogs: [],
            extensionVersion: chrome.runtime.getManifest().version,
          });
        }
      } else {
        // Log storage is healthy
        console.log("Storage validation passed - data is healthy");
      }
    });
  } catch (e) {
    console.error("Error accessing Chrome storage:", e);
    if (e.message && e.message.includes("Extension context invalidated")) {
      isExtensionContextValid = false;
      // Clear all intervals
      intervalIds.forEach((id) => clearInterval(id));
      intervalIds = [];
    }
  }
}

/**
 * Improved initialization with retry mechanism
 * @param {number} retryCount - Number of retries left
 */
function initializeWithRetry(retryCount = 3) {
  console.log(`Initializing with ${retryCount} retries remaining`);
  try {
    chrome.storage.local.get(["chatgptLogs", "extensionVersion"], (result) => {
      // Check for runtime error
      if (chrome.runtime.lastError) {
        console.error("Error loading logs:", chrome.runtime.lastError);

        // Check if it's a context invalidation error
        if (
          chrome.runtime.lastError.message &&
          chrome.runtime.lastError.message.includes(
            "Extension context invalidated"
          )
        ) {
          console.warn("Extension context invalidated during initialization");
          isExtensionContextValid = false;
          // Clear all intervals
          intervalIds.forEach((id) => clearInterval(id));
          intervalIds = [];
          return; // Don't retry if context is invalidated
        }

        if (retryCount > 0) {
          console.log(`Retrying in 1 second (${retryCount} attempts left)...`);
          setTimeout(() => initializeWithRetry(retryCount - 1), 1000);
          return;
        }
      }

      // Store extension version for reference
      const currentVersion = chrome.runtime.getManifest().version;
      const storedVersion = result.extensionVersion || "0.0";
      console.log(
        `Extension version: Current=${currentVersion}, Stored=${storedVersion}`
      );

      // Load logs with validation
      if (result && result.chatgptLogs && Array.isArray(result.chatgptLogs)) {
        try {
          // Clear any potential stale data
          logs.length = 0;
          logs.push(...result.chatgptLogs);
          console.log(`Loaded ${result.chatgptLogs.length} conversation logs`);
        } catch (arrayError) {
          console.error("Error adding logs to array:", arrayError);
          logs.length = 0;
        }
      } else {
        console.log("No existing logs found or invalid format, starting fresh");
        logs.length = 0;
      }

      // Create notification after logs are loaded
      setTimeout(createUsageNotification, 500);
    });
  } catch (e) {
    console.error("Critical initialization error:", e);

    // Check if it's a context invalidation error
    if (e.message && e.message.includes("Extension context invalidated")) {
      console.warn("Extension context invalidated during initialization");
      isExtensionContextValid = false;
      // Clear all intervals
      intervalIds.forEach((id) => clearInterval(id));
      intervalIds = [];
      return; // Don't continue if context is invalidated
    }

    if (retryCount > 0) {
      console.log(`Retrying in 1 second (${retryCount} attempts left)...`);
      setTimeout(() => initializeWithRetry(retryCount - 1), 1000);
    } else {
      // Last resort fallback
      logs.length = 0;
      setTimeout(createUsageNotification, 500);
    }
  }
}

// Handle page unload to clean up
window.addEventListener("beforeunload", () => {
  // Clear all intervals
  intervalIds.forEach((id) => clearInterval(id));
  intervalIds = [];
});

// Start the extension
initialize();

function getUserState() {
  // For demo: get from localStorage, default to 'notOptedIn'
  return localStorage.getItem("userState") || "notOptedIn";
}
