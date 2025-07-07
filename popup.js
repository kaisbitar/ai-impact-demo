/**
 * AI Impact Tracker - Popup UI Script
 * =======================================
 *
 * Original Author: Simonas Zilinskas
 * Original Repository: https://github.com/simonaszilinskas/ai-impact-tracker
 * License: GPL-3.0
 *
 * This is a modified version of the original work.
 *
 * This script handles the popup UI functionality including loading,
 * displaying usage logs and environmental metrics.
 */

/**
 * Safely access chrome.storage API
 * Returns null if not available
 */
const getChromeStorage = () => {
  try {
    // Check if we're in a proper extension context
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local
    ) {
      return chrome.storage.local;
    }
  } catch (e) {
    console.error("Error accessing chrome storage API:", e);
  }
  return null;
};

document.addEventListener("DOMContentLoaded", function () {
  try {
    // Set up tab switching (this will work regardless of storage)
    document
      .getElementById("lifetime-tab")
      .addEventListener("click", function () {
        switchTab("lifetime");
      });

    document.getElementById("today-tab").addEventListener("click", function () {
      switchTab("today");
    });

    // Set up email form event listeners
    setupEmailForm();

    // Set up estimation method toggle
    setupEstimationMethodToggle();

    // Add resize observer to adjust popup size based on content
    adjustPopupHeight();

    // Initialize with empty data
    updateTodayStats([]);
    updateLifetimeStats([]);

    // Check if user has email and show/hide overlay accordingly
    checkUserEmailAndUpdateUI();

    // Try to load logs, but don't fail if storage is unavailable
    loadLogs();

    // Test Supabase connection first, then load data
    testAndLoadSupabaseData();

    // Set subtitle and metric label based on user state
    const userState = localStorage.getItem("userState") || "notOptedIn";
    const subtitle = document.getElementById("user-state-subtitle");
    const metricLabel = document.getElementById("main-metric-label");
    const mainMetricTile = document.getElementById("main-metric-tile");
    if (userState === "donor") {
      if (subtitle)
        subtitle.textContent = "Thank you for supporting reforestation!";
      if (metricLabel) metricLabel.textContent = "m² restored";
      if (mainMetricTile) mainMetricTile.style.display = "";
    } else {
      if (subtitle) subtitle.textContent = "Track your AI footprint";
      if (metricLabel) metricLabel.textContent = "Tokens";
      if (mainMetricTile) mainMetricTile.style.display = "none";
    }
  } catch (err) {
    console.error("Error initializing popup:", err);
  }
});

/**
 * Adjusts the popup height to fit content without scrolling
 * Uses a safer implementation to avoid ResizeObserver loop errors
 */
function adjustPopupHeight() {
  // Use requestAnimationFrame to avoid ResizeObserver loops
  let rafId = null;
  let lastHeight = 0;
  let resizeObserver = null;

  // Function that actually handles resizing, but throttled with rAF
  const processResize = () => {
    rafId = null;

    // Get the visible tab content
    const activeTab = document.querySelector(".stats-container.active");
    if (!activeTab) return;

    // Get current height
    const currentScrollHeight = document.body.scrollHeight;

    // Only process if height actually changed since last check
    if (
      currentScrollHeight !== lastHeight &&
      currentScrollHeight > window.innerHeight
    ) {
      lastHeight = currentScrollHeight;

      // If we made changes, disconnect and delay re-connecting to prevent loops
      if (resizeObserver) {
        resizeObserver.disconnect();
        setTimeout(() => {
          resizeObserver.observe(document.body);
        }, 100);
      }
    }
  };

  // Create the observer with throttling pattern
  resizeObserver = new ResizeObserver(() => {
    if (!rafId) {
      rafId = requestAnimationFrame(processResize);
    }
  });

  // Start observing
  resizeObserver.observe(document.body);

  // Save reference to allow cleanup if needed
  window._popupResizeObserver = resizeObserver;
}

/**
 * Switches between lifetime and today tabs
 * @param {string} tabId - The ID of the tab to switch to ('lifetime' or 'today')
 */
function switchTab(tabId) {
  // Hide all tabs
  document.querySelectorAll(".stats-container").forEach((container) => {
    container.classList.remove("active");
  });

  // Remove active class from all tab buttons
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Show the selected tab
  document.getElementById(`${tabId}-stats`).classList.add("active");
  document.getElementById(`${tabId}-tab`).classList.add("active");

  // No need for manual resize event with our improved ResizeObserver
}

/**
 * Loads logs from Chrome storage and updates the UI
 * Includes additional error handling and logging
 */
function loadLogs() {
  try {
    // Get storage safely
    const storage = getChromeStorage();
    if (!storage) {
      console.warn("Chrome storage API not available - showing empty stats");
      return; // We already initialized with empty stats
    }

    storage.get(["chatgptLogs", "extensionVersion"], function (result) {
      // Check for chrome.runtime.lastError safely
      const lastError = chrome.runtime && chrome.runtime.lastError;
      if (lastError) {
        console.error("Error loading logs:", lastError);
        // Retry once after a short delay
        setTimeout(() => {
          tryLoadLogsAgain();
        }, 500);
        return;
      }

      const logs = result.chatgptLogs || [];
      const version = result.extensionVersion || "unknown";

      updateTodayStats(logs);
      updateLifetimeStats(logs);
    });
  } catch (e) {
    console.error("Error in loadLogs:", e);
    // Use empty arrays as fallback
    updateTodayStats([]);
    updateLifetimeStats([]);
  }
}

function tryLoadLogsAgain() {
  try {
    // Get storage safely
    const storage = getChromeStorage();
    if (!storage) {
      console.warn("Chrome storage API not available in retry attempt");
      return; // We already initialized with empty stats
    }

    storage.get("chatgptLogs", function (result) {
      // Safely handle result
      if (!result) {
        console.warn("No result from storage in retry");
        return;
      }

      const logs = Array.isArray(result.chatgptLogs) ? result.chatgptLogs : [];

      updateTodayStats(logs);
      updateLifetimeStats(logs);
    });
  } catch (e) {
    console.error("Error in retry loadLogs:", e);
    // Already initialized with empty stats
  }
}

/**
 * Updates the "Today" section with statistics for today
 * @param {Array} logs - Array of conversation log entries
 */
function updateTodayStats(logs) {
  // Get today's date (midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter logs for today only
  const todayLogs = logs.filter((log) => new Date(log.timestamp) >= today);

  // Calculate today's statistics
  let todayMessages = todayLogs.length;
  let todayTokensIn = 0;
  let todayTokensOut = 0;
  let todayEnergyUsage = 0;
  let todayWater = 0;
  let todayPhones = 0;
  let todayYoutube = 0;
  let todayElevator = 0;

  todayLogs.forEach((log) => {
    todayTokensIn += log.userTokenCount || 0;
    todayTokensOut += log.assistantTokenCount || 0;
    todayEnergyUsage += log.energyUsage || 0;
  });

  // Simple demo calculation for water (0.2L per kWh)
  todayWater = (todayEnergyUsage / 1000) * 0.2;
  // Phones charged (13.5 Wh per charge)
  todayPhones = Math.round((todayEnergyUsage / 13.5) * 10) / 10;
  // YouTube streamed (0.25 Wh per min)
  todayYoutube = Math.round(todayEnergyUsage / 0.25);
  // Elevator travel (6.25 Wh per floor)
  todayElevator = Math.round(todayEnergyUsage / 6.25);

  // Update the DOM
  document.getElementById("today-messages").textContent = todayMessages;
  document.getElementById("today-tokens-in").textContent = todayTokensIn;
  document.getElementById("today-tokens-out").textContent = todayTokensOut;
  document.getElementById("today-energy").textContent = formatNumber(todayEnergyUsage.toFixed(2), true);
  document.getElementById("today-water").textContent = todayWater < 1 ? `${Math.round(todayWater * 1000)} ml` : `${todayWater.toFixed(2)} L`;
  document.getElementById("today-phones").textContent = todayPhones;
  document.getElementById("today-youtube").textContent = todayYoutube < 60 ? `${todayYoutube} min` : `${(todayYoutube/60).toFixed(1)} h`;
  document.getElementById("today-elevator").textContent = todayElevator;
}

/**
 * Updates the lifetime statistics section
 * @param {Array} logs - Array of conversation log entries
 */
function updateLifetimeStats(logs) {
  // Calculate lifetime totals
  let totalMessages = logs.length;
  let totalEnergyUsage = 0;

  // Only use actual log data, don't add minimum values
  if (logs.length === 0) {
    totalEnergyUsage = 0;
  } else {
    logs.forEach((log) => {
      // Ensure we have at least a minimum energy value
      const logEnergy = log.energyUsage || 0;
      totalEnergyUsage += logEnergy;
    });

    // Use actual value, no minimum threshold
    totalEnergyUsage = totalEnergyUsage;
  }

  // Update the UI
  document.getElementById("lifetime-messages").textContent =
    formatNumber(totalMessages);
  document.getElementById("lifetime-energy").textContent = formatNumber(
    totalEnergyUsage.toFixed(2),
    true
  );

  // Calculate and update lifetime environmental equivalents
  const equivalents = calculateEnvironmentalEquivalents(totalEnergyUsage);

  // Update the DOM with the calculated values, ensure we have proper formatting
  try {
    // Update each element individually with error handling
    // Format YouTube streaming time - show in hours if over 60 minutes
    const lifetimeMovieMinutes = equivalents.movies;
    let lifetimeFormattedMovieTime;

    if (lifetimeMovieMinutes >= 60) {
      const lifetimeMovieHours = lifetimeMovieMinutes / 60;
      // One decimal place for 1-10 hours, no decimals above 10 hours
      if (lifetimeMovieHours < 10) {
        lifetimeFormattedMovieTime = `${formatNumber(
          lifetimeMovieHours.toFixed(1)
        )} hours`;
      } else {
        lifetimeFormattedMovieTime = `${formatNumber(
          Math.round(lifetimeMovieHours)
        )} hours`;
      }
    } else {
      lifetimeFormattedMovieTime = `${formatNumber(lifetimeMovieMinutes)} mins`;
    }

    document.getElementById("lifetime-movies").textContent =
      lifetimeFormattedMovieTime;

    // Special handling for water consumption with explicit debugging
    const waterElement = document.getElementById("lifetime-toasts");
    if (waterElement) {
      // Format water in ml if small, otherwise in L with simpler format
      if (equivalents.water < 0.01) {
        waterElement.textContent = `${formatNumber(
          (equivalents.water * 1000).toFixed(0)
        )} ml`;
      } else if (equivalents.water < 1) {
        waterElement.textContent = `${formatNumber(
          (equivalents.water * 1000).toFixed(0)
        )} ml`;
      } else {
        waterElement.textContent = `${formatNumber(
          equivalents.water.toFixed(1)
        )} L`;
      }
    } else {
      console.error(
        "Water consumption element not found! Check the ID in HTML."
      );
    }

    document.getElementById("lifetime-phones").textContent = formatNumber(
      equivalents.phones
    );
    document.getElementById("lifetime-elevator").textContent = `${formatNumber(
      equivalents.elevator
    )} floors`;

    // Force a repaint to ensure updates are visible
    document.body.style.display = "none";
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = "";
  } catch (error) {
    console.error("Error updating environmental equivalents:", error);
  }
}

/**
 * Calculates environmental equivalents for a given energy usage
 * Handles zero values appropriately
 * @param {number} energyUsageWh - Energy usage in watt-hours
 * @returns {Object} Object containing various environmental equivalents
 */
function calculateEnvironmentalEquivalents(energyUsageWh) {
  // Ensure we're working with a valid number
  const validEnergyUsage = parseFloat(energyUsageWh) || 0;

  // Convert Wh to kWh
  const energyUsageKwh = validEnergyUsage / 1000;

  // If energy usage is zero or very close to zero, return zeros for all equivalents
  if (energyUsageKwh < 0.0001) {
    return {
      electricity: "0",
      movies: 0,
      water: 0,
      phones: 0,
      elevator: 0,
    };
  }

  // Environmental equivalents based on methodology.md
  // YouTube video streaming (0.25 Wh per minute of standard definition streaming)
  const movieMinutes = Math.max(0, Math.round(validEnergyUsage / 0.25));

  // Water consumption calculation (liters)
  // Water_Consumption_Liters = (Energy_Wh / 1000) * WUE_L_per_kWh
  // Using WUE of 0.2 L/kWh for Azure data centers
  const waterConsumptionLiters = Math.max(0, (validEnergyUsage / 1000) * 0.2);

  // Phone charges (10-15 Wh per full charge)
  const phoneCharges = Math.max(
    0,
    Math.round((validEnergyUsage / 13.5) * 10) / 10
  );

  // Elevator rides (6.25 Wh per person per floor - assuming 2 people per elevator)
  const elevatorFloors = Math.max(0, Math.round(validEnergyUsage / 6.25));

  // Convert to numbers and apply sensible defaults to prevent NaN
  return {
    electricity: energyUsageKwh.toFixed(3),
    movies: movieMinutes || 0,
    water: waterConsumptionLiters || 0,
    phones: phoneCharges || 0,
    elevator: elevatorFloors || 0,
  };
}

/**
 * Formats numbers with commas for better readability
 * For watt-hour values over 1000, uses k format (e.g., 1.4k)
 * @param {number} num - Number to format
 * @param {boolean} isEnergy - Whether this is an energy value (Wh)
 * @returns {string} Formatted number string
 */
function formatNumber(num, isEnergy = false) {
  // Parse the number to ensure we're working with a number
  const value = parseFloat(num);

  // For energy values (Wh) over 1000, use k format
  if (isEnergy && value >= 1000) {
    return (value / 1000).toFixed(1) + "k";
  }

  // Otherwise use comma format
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Sets up email form event listeners
 */
function setupEmailForm() {
  const emailInput = document.getElementById("email-input");
  const submitBtn = document.getElementById("email-submit");

  // Submit email
  submitBtn.addEventListener("click", function () {
    const email = emailInput.value.trim();
    const marketingConsent =
      document.getElementById("marketing-consent").checked;

    if (email && isValidEmail(email)) {
      saveUserEmail(email, marketingConsent);
      hideEmailOverlay();
    } else {
      emailInput.style.borderColor = "#e74c3c";
      setTimeout(() => {
        emailInput.style.borderColor = "";
      }, 3000);
    }
  });

  // Allow enter key to submit
  emailInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      submitBtn.click();
    }
  });
}

/**
 * Checks user email and updates UI accordingly
 */
function checkUserEmailAndUpdateUI() {
  getUserEmail().then((email) => {
    if (email) {
      hideEmailOverlay();
    } else {
      showEmailOverlay();
    }
  });
}

/**
 * Shows the email collection overlay
 */
function showEmailOverlay() {
  const overlay = document.getElementById("email-overlay");
  const lifetimeContainer = document.getElementById("lifetime-stats");
  const disclaimer = document.querySelector(".estimation-disclaimer");

  overlay.classList.remove("hidden");
  lifetimeContainer.classList.add("lifetime-blurred");
  if (disclaimer) disclaimer.style.display = "none";
}

/**
 * Hides the email collection overlay
 */
function hideEmailOverlay() {
  const overlay = document.getElementById("email-overlay");
  const lifetimeContainer = document.getElementById("lifetime-stats");
  const disclaimer = document.querySelector(".estimation-disclaimer");

  overlay.classList.add("hidden");
  lifetimeContainer.classList.remove("lifetime-blurred");
  if (disclaimer) disclaimer.style.display = "block";
  document.getElementById("email-input").value = "";
}

/**
 * Validates email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Saves user email to storage
 */
function saveUserEmail(email, marketingConsent = false) {
  const storage = getChromeStorage();
  if (storage) {
    storage.set(
      {
        userEmail: email,
        emailConsent: true,
        emailConsentDate: new Date().toISOString(),
        marketingConsent: marketingConsent,
        marketingConsentDate: marketingConsent
          ? new Date().toISOString()
          : null,
      },
      function () {
        sendEmailToBackend(email, marketingConsent);
      }
    );
  }
}

/**
 * Gets user email from storage
 */
function getUserEmail() {
  return new Promise((resolve) => {
    const storage = getChromeStorage();
    if (storage) {
      storage.get(["userEmail"], function (result) {
        resolve(result.userEmail || null);
      });
    } else {
      resolve(null);
    }
  });
}

/**
 * Sends email to backend for collection
 */
function sendEmailToBackend(email, marketingConsent = false) {
  // Supabase configuration (public anon key - safe to expose in browser extensions)
  const SUPABASE_URL = "https://hhjwbkrobrljpuurvycq.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhoandia3JvYnJsanB1dXJ2eWNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjA1MTMsImV4cCI6MjA2MzQ5NjUxM30.aSU8ERRvV9RJdBYcReop42Ue3ZMH1U6S2JsNU-wpc5Y";

  fetch(`${SUPABASE_URL}/rest/v1/user_emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      email: email,
      extension_version: chrome.runtime?.getManifest()?.version || "unknown",
      consent_given: true,
      consent_date: new Date().toISOString(),
      marketing_consent: marketingConsent,
      marketing_consent_date: marketingConsent
        ? new Date().toISOString()
        : null,
    }),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Email sent to backend successfully");
      } else if (response.status === 409) {
        console.log("Email already exists in database (this is normal)");
      } else {
        console.error("Failed to send email to backend:", response.status);
      }
    })
    .catch((error) => {
      console.error("Error sending email to backend:", error);
    });
}

/**
 * Sets up the estimation method toggle functionality
 */
function setupEstimationMethodToggle() {
  const estimationSelect = document.getElementById("estimation-method");

  // Check if the estimation select element exists (it might be commented out)
  if (!estimationSelect) {
    console.log("Estimation method select not found - skipping setup");
    return;
  }

  // Load saved estimation method and ensure consistency
  loadEstimationMethod().then((method) => {
    const selectedMethod = method || "community";
    estimationSelect.value = selectedMethod;
  });

  // Handle estimation method change
  estimationSelect.addEventListener("change", function () {
    const selectedMethod = this.value;

    // Save the method first
    saveEstimationMethod(selectedMethod);

    // Recalculate existing logs with new method and wait for completion
    recalculateLogsInPopup(selectedMethod, () => {
      // After recalculation is complete, notify content scripts
      notifyEstimationMethodChange(selectedMethod);
    });
  });
}

/**
 * Loads the saved estimation method from storage
 */
function loadEstimationMethod() {
  return new Promise((resolve) => {
    const storage = getChromeStorage();
    if (storage) {
      storage.get(["estimationMethod"], function (result) {
        const method = result.estimationMethod || "community";
        resolve(method);
      });
    } else {
      resolve("community");
    }
  });
}

/**
 * Saves the estimation method to storage
 */
function saveEstimationMethod(method) {
  const storage = getChromeStorage();
  if (storage) {
    storage.set({ estimationMethod: method });
  }
}

/**
 * Recalculates all logs with the new estimation method in the popup
 */
function recalculateLogsInPopup(method, callback) {
  const storage = getChromeStorage();
  if (!storage) {
    if (callback) callback();
    return;
  }

  storage.get(["chatgptLogs"], function (result) {
    const logs = result.chatgptLogs || [];

    // Recalculate energy for all logs
    logs.forEach((log) => {
      if (log.assistantTokenCount > 0) {
        const energyData = calculateEnergyAndEmissionsInPopup(
          log.assistantTokenCount,
          method
        );
        log.energyUsage = energyData.totalEnergy;
        log.co2Emissions = energyData.co2Emissions;
      }
    });

    // Save updated logs back to storage
    storage.set({ chatgptLogs: logs }, function () {
      // Update the UI with recalculated data
      updateTodayStats(logs);
      updateLifetimeStats(logs);

      // Call the callback when everything is complete
      if (callback) callback();
    });
  });
}

/**
 * Energy calculation function for use in popup (matches content script logic)
 */
function calculateEnergyAndEmissionsInPopup(
  outputTokens,
  method = "community"
) {
  const ENERGY_ALPHA = 8.91e-5;
  const ENERGY_BETA = 1.43e-3;
  const PUE = 1.2;
  const WORLD_EMISSION_FACTOR = 0.418;

  if (method === "altman") {
    // Sam Altman's estimation: 0.34 Wh per query with 781 average output tokens
    const altmanEnergyPerToken = 0.34 / 781;
    const totalEnergy = outputTokens * altmanEnergyPerToken;

    // Ensure minimum energy value for visibility in UI
    const minEnergy = 0.01;
    const normalizedEnergy = Math.max(totalEnergy, minEnergy);

    // Calculate CO2 emissions (grams)
    const co2Emissions = normalizedEnergy * WORLD_EMISSION_FACTOR;

    return {
      totalEnergy: normalizedEnergy,
      co2Emissions,
    };
  } else {
    // Community estimates using EcoLogits methodology
    const activeParamsBillions = 55; // 55B active parameters
    const energyPerToken = ENERGY_ALPHA * activeParamsBillions + ENERGY_BETA;

    // Simplified calculation for popup (just the core energy per token)
    const totalEnergy = outputTokens * energyPerToken * PUE;

    // Ensure minimum energy value for visibility in UI
    const minEnergy = 0.01;
    const normalizedEnergy = Math.max(totalEnergy, minEnergy);

    // Calculate CO2 emissions (grams)
    const co2Emissions = normalizedEnergy * WORLD_EMISSION_FACTOR;

    return {
      totalEnergy: normalizedEnergy,
      co2Emissions,
    };
  }
}

/**
 * Tests Supabase connection and loads data if successful
 */
async function testAndLoadSupabaseData() {
  try {
    if (window.supabaseClient && window.supabaseClient.testSupabaseConnection) {
      const isConnected = await window.supabaseClient.testSupabaseConnection();
      if (isConnected) {
        await loadSupabaseData();
      } else {
        const subtitle = document.getElementById("user-state-subtitle");
        if (subtitle) {
          subtitle.textContent = "Supabase connection failed";
          subtitle.style.color = "#dc2626";
        }
      }
    }
  } catch (error) {
    const subtitle = document.getElementById("user-state-subtitle");
    if (subtitle) {
      subtitle.textContent = "Supabase connection failed";
      subtitle.style.color = "#dc2626";
    }
  }
}

/**
 * Loads data from Supabase for demo purposes
 */
async function loadSupabaseData() {
  try {
    const testUserId = "7ed16fa3-775b-4cc7-8b8c-2dfe12f01d80";
    if (window.supabaseClient && window.supabaseClient.getUserUsageData) {
      const supabaseData = await window.supabaseClient.getUserUsageData(
        testUserId
      );
      const totalEnergy = supabaseData.reduce(
        (sum, record) => sum + (record.energy_usage_wh || 0),
        0
      );
      const todayEnergyElement = document.getElementById("today-energy");
      if (todayEnergyElement) {
        todayEnergyElement.textContent = formatNumber(
          totalEnergy.toFixed(2),
          true
        );
      }
      const subtitle = document.getElementById("user-state-subtitle");
      if (subtitle) {
        subtitle.textContent = "Data from Supabase (Demo)";
        subtitle.style.color = "#059669";
      }
    }
  } catch (error) {
    // Optionally, show a user-friendly error in the UI
    const subtitle = document.getElementById("user-state-subtitle");
    if (subtitle) {
      subtitle.textContent = "Error loading data from Supabase";
      subtitle.style.color = "#dc2626";
    }
  }
}

/**
 * Notifies content script about estimation method change
 */
function notifyEstimationMethodChange(method) {
  // Send message to all ChatGPT tabs to update their method for new calculations
  if (chrome.tabs) {
    chrome.tabs.query({ url: "https://chatgpt.com/*" }, function (tabs) {
      if (tabs.length === 0) {
        console.log(
          "No ChatGPT tabs found - estimation method will apply to future tabs"
        );
        return;
      }

      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(
          tab.id,
          {
            type: "estimationMethodChanged",
            method: method,
          },
          function (response) {
            // Check for runtime errors and handle them gracefully
            if (chrome.runtime.lastError) {
              console.log(
                `Could not notify tab ${tab.id}: ${chrome.runtime.lastError.message}`
              );
              // This is normal - tab might not have the content script loaded yet
            } else {
              console.log(
                `Successfully notified tab ${tab.id} of estimation method change`
              );
            }
          }
        );
      });
    });
  }
}
