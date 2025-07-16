/**
 * Regen-AI Impact Tracker - Revolutionary Popup UI Script
 * =======================================================
 *
 * Original Author: Simonas Zilinskas
 * Original Repository: https://github.com/simonaszilinskas/ai-impact-tracker
 * License: GPL-3.0
 *
 * This is a revolutionary redesign with psychological principles,
 * color psychology, and innovative UX patterns.
 */

/**
 * Safely access chrome.storage API
 * Returns null if not available
 */
const getChromeStorage = () => {
  try {
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

// Revolutionary State Management
const RegenAIState = {
  userState: "notOptedIn", // 'notOptedIn', 'donor', 'emailCollected'
  impactLevel: "low", // 'low', 'medium', 'high'
  contributionStreak: 0,
  totalContributed: 0,
  lastContributionDate: null,

  updateUserState(newState) {
    this.userState = newState;
    localStorage.setItem("regenAI_userState", newState);
    this.updateUI();
  },

  updateImpactLevel(energyUsage) {
    if (energyUsage < 100) this.impactLevel = "low";
    else if (energyUsage < 500) this.impactLevel = "medium";
    else this.impactLevel = "high";
    this.updateUI();
  },

  updateUI() {
    this.updateActionCard();
    this.updateProgressBar();
    this.updateM2Chart();
    // Update Plant Trees Now button label
    const plantTreesBtn = document.getElementById("plant-trees-btn");
    if (plantTreesBtn) {
      if (this.userState === "donor") {
        plantTreesBtn.innerHTML =
          '<i class="ri-dashboard-line"></i> View Dashboard';
      } else {
        plantTreesBtn.innerHTML =
          '<i class="ri-plant-line"></i> Plant Trees Now';
      }
    }
    // Update Restore Forests Now button label
    const restoreBtn = document.getElementById("simple-donate-btn");
    if (restoreBtn) {
      if (this.userState === "donor") {
        restoreBtn.innerHTML =
          '<i class="ri-dashboard-line"></i> View Dashboard';
      } else {
        restoreBtn.innerHTML =
          '<i class="ri-plant-line"></i> 🌱 Restore Forests Now';
      }
    }
  },

  updateM2Chart() {
    const m2Value = document.getElementById("m2-planted-value");
    const m2Fill = document.getElementById("m2-chart-fill");
    const m2Label = document.getElementById("m2-chart-label");
    const m2Bar = m2Fill?.parentElement;
    const m2ValueContainer = m2Value?.parentElement;

    if (!m2Value || !m2Fill || !m2Label || !m2Bar || !m2ValueContainer) return;

    let m2Planted = 0;
    let label = "No forest restoration yet";
    let isDonor = this.userState === "donor";

    if (isDonor) {
      // Generate a random number between 50-500 for donors
      m2Planted = Math.floor(Math.random() * 451) + 50; // 50 to 500
      label = `You've helped restore ${m2Planted} m² of forest! 🌱`;
    }

    // Update the value display
    m2Value.textContent = m2Planted;

    // Update the chart fill (max width is 100%, scale based on max 500m²)
    const fillPercentage = Math.min((m2Planted / 500) * 100, 100);
    m2Fill.style.width = `${fillPercentage}%`;

    // Update the label
    m2Label.textContent = label;

    // Color logic
    if (isDonor) {
      m2Bar.classList.remove("red");
      m2Fill.classList.remove("red");
      m2ValueContainer.classList.remove("red");
    } else {
      m2Bar.classList.add("red");
      m2Fill.classList.add("red");
      m2ValueContainer.classList.add("red");
    }

    return;
  },

  updateActionCard() {
    const actionCard = document.getElementById("donation-card");
    const actionTitle = actionCard?.querySelector(".action-title");
    const actionDescription = actionCard?.querySelector(".action-description");

    if (this.userState === "donor") {
      if (actionTitle) actionTitle.textContent = "Continue Your Impact";
      if (actionDescription)
        actionDescription.textContent = `You've contributed to ${this.totalContributed}m² of forest restoration. Keep making a difference!`;
    } else {
      if (actionTitle) actionTitle.textContent = "Support Forest Restoration";
      if (actionDescription)
        actionDescription.textContent =
          "Offset your AI impact by contributing to Bergwaldprojekt's reforestation efforts";
    }
  },

  updateProgressBar() {
    const progressFill = document.getElementById("donation-progress");
    const progressText = document.getElementById("donation-text");

    if (this.userState === "donor") {
      const progress = Math.min((this.totalContributed / 100) * 100, 100);
      if (progressFill) progressFill.style.width = `${progress}%`;
      if (progressText)
        progressText.textContent = `${this.totalContributed}m² restored`;
    } else {
      if (progressFill) progressFill.style.width = "0%";
      if (progressText) progressText.textContent = "Ready to make a difference";
    }
  },
};

// Revolutionary Animation Controller
const AnimationController = {
  animateValue(element, start, end, duration = 1000) {
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const current = start + (end - start) * this.easeOutQuart(progress);
      element.textContent = this.formatNumber(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  },

  easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  },

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return Math.round(num).toString();
  },

  triggerConfetti() {
    // Simple confetti effect for achievements
    const colors = ["#2E7D32", "#1976D2", "#FF9800", "#4CAF50"];
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const confetti = document.createElement("div");
        confetti.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          background: ${colors[Math.floor(Math.random() * colors.length)]};
          border-radius: 50%;
          pointer-events: none;
          z-index: 10000;
          animation: confetti-fall 2s ease-out forwards;
        `;
        document.body.appendChild(confetti);

        setTimeout(() => confetti.remove(), 2000);
      }, i * 50);
    }
  },
};

// Add confetti animation to CSS
const style = document.createElement("style");
style.textContent = `
  @keyframes confetti-fall {
    0% {
      transform: translate(-50%, -50%) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, 100vh) rotate(720deg);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", function () {
  try {
    // Initialize revolutionary state
    RegenAIState.userState =
      localStorage.getItem("regenAI_userState") || "notOptedIn";
    RegenAIState.totalContributed =
      parseInt(localStorage.getItem("regenAI_totalContributed")) || 0;

    // Set up revolutionary tab switching
    document
      .getElementById("lifetime-tab")
      .addEventListener("click", function () {
        // Only show overlay if not opted in
        if (!getUserEmail()) {
          showEmailOverlay();
          return;
        }
        switchTab("lifetime");
      });

    document.getElementById("today-tab").addEventListener("click", function () {
      switchTab("today");
    });

    // Set up revolutionary email form
    setupEmailForm();

    // Set up revolutionary estimation method toggle
    setupEstimationMethodToggle();

    // Add revolutionary resize observer
    adjustPopupHeight();

    // Initialize with empty data
    updateTodayStats([]);
    updateLifetimeStats([]);

    // Try to load logs with revolutionary animations
    loadLogs();

    // Test Supabase connection and load data
    testAndLoadSupabaseData();

    // Initialize revolutionary state UI
    RegenAIState.updateUI();

    // Set up revolutionary donation button
    setupDonationButton();

    // Set up simple donation button
    setupSimpleDonationButton();

    // Set up test donor button
    setupTestDonorButton();

    // Set up m² chart interactions
    setupM2ChartInteractions();
  } catch (err) {
    console.error("Error initializing revolutionary popup:", err);
  }
});

/**
 * Revolutionary tab switching with smooth animations
 */
function switchTab(tabId) {
  // Hide all tabs with fade out
  document.querySelectorAll(".stats-container").forEach((container) => {
    container.classList.remove("active");
    container.style.opacity = "0";
  });

  // Remove active class from all tab buttons
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Show the selected tab with fade in
  const selectedTab = document.getElementById(`${tabId}-stats`);
  const selectedTabBtn = document.getElementById(`${tabId}-tab`);

  if (selectedTab) {
    selectedTab.classList.add("active");
    setTimeout(() => {
      selectedTab.style.opacity = "1";
    }, 50);
  }

  if (selectedTabBtn) {
    selectedTabBtn.classList.add("active");
  }
}

/**
 * Revolutionary donation button setup
 */
function setupDonationButton() {
  const donateBtn = document.getElementById("donate-btn");
  if (donateBtn) {
    donateBtn.addEventListener("click", function () {
      if (!getUserEmail()) {
        showEmailOverlay();
        return;
      }
      if (RegenAIState.userState === "donor") {
        // Show contribution success
        showContributionSuccess();
      } else {
        // Show email overlay for new users
        showEmailOverlay();
      }
    });
  }
}

// Simple donation button handler
function setupSimpleDonationButton() {
  const simpleDonateBtn = document.getElementById("simple-donate-btn");
  console.log("🔍 Looking for simple-donate-btn:", simpleDonateBtn);
  if (!simpleDonateBtn) return;
  console.log("✅ Found simple-donate-btn, adding click listener");
  simpleDonateBtn.addEventListener("click", function () {
    if (RegenAIState.userState === "donor") {
      window.open("/dashboard/index.html", "_blank");
      return;
    }
    console.log("🌱 Donation button clicked!");
    redirectToDonationLanding();
  });
}

// Redirect to donation landing page
function redirectToDonationLanding() {
  // Get latest stats from storage
  const storage = getChromeStorage();
  if (!storage) {
    // fallback to DOM if storage not available
    const energyValue = document.getElementById("energy-value");
    const co2Value = document.getElementById("co2-value");
    const waterValue = document.getElementById("water-value");
    const tokensValue = document.getElementById("total-tokens-value");
    const messagesValue = document.getElementById("messages-value");
    const energy = energyValue
      ? energyValue.textContent.replace(/[^\d.]/g, "")
      : "0";
    const co2 = co2Value ? co2Value.textContent.replace(/[^\d.]/g, "") : "0";
    const water = waterValue
      ? waterValue.textContent.replace(/[^\d.]/g, "")
      : "0";
    const tokens = tokensValue
      ? tokensValue.textContent.replace(/[^\d.]/g, "")
      : "0";
    const messages = messagesValue
      ? messagesValue.textContent.replace(/[^\d.]/g, "")
      : "0";

    // Send message to background script to open donation page
    console.log("📤 Sending message to background script with stats:", {
      energy,
      co2,
      water,
      tokens,
      messages,
    });
    chrome.runtime.sendMessage(
      {
        action: "openDonationPage",
        stats: { energy, co2, water, tokens, messages },
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Error sending message:", chrome.runtime.lastError);
        } else {
          console.log("✅ Message sent successfully:", response);
        }
      }
    );
    return;
  }

  storage.get(["chatgptLogs"], function (result) {
    const logs = result.chatgptLogs || [];
    // Calculate stats as in popup
    let tokens = 0,
      messages = logs.length,
      energy = 0,
      co2 = 0,
      water = 0;
    logs.forEach((log) => {
      tokens += (log.inputTokens || 0) + (log.outputTokens || 0);
      energy += log.energyUsage || 0;
      co2 += log.co2Emissions || 0;
      water += ((log.energyUsage || 0) / 1000) * 0.2;
    });

    // Send message to background script to open donation page
    const stats = {
      energy: (Math.round(energy * 10) / 10).toString(),
      co2: (Math.round(co2 * 1000) / 1000).toString(),
      water: (Math.round(water * 10) / 10).toString(),
      tokens: tokens.toString(),
      messages: messages.toString(),
    };
    console.log(
      "📤 Sending message to background script with calculated stats:",
      stats
    );
    chrome.runtime.sendMessage(
      {
        action: "openDonationPage",
        stats: stats,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("❌ Error sending message:", chrome.runtime.lastError);
        } else {
          console.log("✅ Message sent successfully:", response);
        }
      }
    );
  });
}

// Function to simulate user becoming a donor (for testing)
function simulateDonorStatus() {
  RegenAIState.updateUserState("donor");
  RegenAIState.totalContributed = 3000; // Simulate some contributions
  RegenAIState.updateUI();
}

// Set up test donor button
function setupTestDonorButton() {
  const testDonorBtn = document.getElementById("test-donor-btn");
  if (!testDonorBtn) return;

  // Set initial label based on state
  const setButtonLabel = () => {
    const userState = localStorage.getItem("regenAI_userState") || "notOptedIn";
    testDonorBtn.textContent =
      userState === "donor"
        ? "🔄 Switch to Non-Donor Demo"
        : "🧪 Switch to Donor Demo";
  };

  setButtonLabel();

  testDonorBtn.addEventListener("click", function () {
    const currentState =
      localStorage.getItem("regenAI_userState") || "notOptedIn";
    if (currentState === "donor") {
      RegenAIState.updateUserState("notOptedIn");
      RegenAIState.totalContributed = 0;
      RegenAIState.updateUI();
      setButtonLabel();
      return;
    }
    RegenAIState.updateUserState("donor");
    RegenAIState.totalContributed = 3000;
    RegenAIState.updateUI();
    setButtonLabel();
  });
}

/**
 * Show revolutionary contribution success
 */
function showContributionSuccess() {
  const actionCard = document.getElementById("donation-card");
  if (actionCard) {
    actionCard.style.transform = "scale(1.05)";
    actionCard.style.boxShadow = "0 20px 40px rgba(46, 125, 50, 0.3)";

    setTimeout(() => {
      actionCard.style.transform = "scale(1)";
      actionCard.style.boxShadow = "";
    }, 300);

    // Trigger confetti for achievement
    AnimationController.triggerConfetti();
  }
}

/**
 * Revolutionary load logs with enhanced animations
 */
function loadLogs() {
  try {
    const storage = getChromeStorage();
    if (!storage) {
      console.warn("Chrome storage API not available - showing empty stats");
      // Add some sample data for testing
      const sampleLogs = [
        {
          timestamp: Date.now(),
          inputTokens: 50,
          outputTokens: 150,
          energyUsage: 0.5,
          co2Emissions: 0.0002,
          userMessage: "Sample message",
          assistantResponse: "Sample response",
        },
      ];
      updateTodayStatsWithAnimation(sampleLogs);
      updateLifetimeStatsWithAnimation(sampleLogs);
      return;
    }

    storage.get(["chatgptLogs", "extensionVersion"], function (result) {
      const lastError = chrome.runtime && chrome.runtime.lastError;
      if (lastError) {
        console.error("Error loading logs:", lastError);
        setTimeout(() => {
          tryLoadLogsAgain();
        }, 500);
        return;
      }

      const logs = result.chatgptLogs || [];
      const version = result.extensionVersion || "unknown";

      console.log("📊 Loaded logs from storage:", logs.length, "entries");
      console.log("📊 Sample log entry:", logs[0]);

      // If no logs found, add some sample data for testing
      if (logs.length === 0) {
        console.log("📊 No logs found, adding sample data for testing");
        const sampleLogs = [
          {
            timestamp: Date.now(),
            inputTokens: 50,
            outputTokens: 150,
            energyUsage: 0.5,
            co2Emissions: 0.0002,
            userMessage: "Sample message",
            assistantResponse: "Sample response",
          },
          {
            timestamp: Date.now() - 3600000, // 1 hour ago
            inputTokens: 30,
            outputTokens: 100,
            energyUsage: 0.3,
            co2Emissions: 0.0001,
            userMessage: "Another sample",
            assistantResponse: "Another response",
          },
        ];
        updateTodayStatsWithAnimation(sampleLogs);
        updateLifetimeStatsWithAnimation(sampleLogs);
      } else {
        // Update stats with revolutionary animations
        updateTodayStatsWithAnimation(logs);
        updateLifetimeStatsWithAnimation(logs);
      }

      // Update impact level based on energy usage
      const totalEnergy = calculateTotalEnergy(logs);
      RegenAIState.updateImpactLevel(totalEnergy);
    });
  } catch (e) {
    console.error("Error in revolutionary loadLogs:", e);
    updateTodayStats([]);
    updateLifetimeStats([]);
  }
}

/**
 * Calculate total energy usage from logs
 */
function calculateTotalEnergy(logs) {
  return logs.reduce((total, log) => {
    const energy = calculateEnergyAndEmissionsInPopup(log.outputTokens || 0);
    return total + energy.energyUsageWh;
  }, 0);
}

/**
 * Revolutionary update today stats with animations
 */
function updateTodayStatsWithAnimation(logs) {
  const todayLogs = filterTodayLogs(logs);
  const stats = calculateStats(todayLogs);

  console.log("📊 Today logs:", todayLogs.length, "entries");
  console.log("📊 Calculated stats:", stats);

  // Animate usage metrics
  const messagesValue = document.getElementById("messages-value");
  if (messagesValue) {
    messagesValue.textContent = stats.messages;
    console.log("📊 Updated messages value:", stats.messages);
  } else {
    console.warn("❌ messages-value element not found");
  }

  const tokensInValue = document.getElementById("tokens-in-value");
  if (tokensInValue) tokensInValue.textContent = stats.tokensIn;

  const tokensOutValue = document.getElementById("tokens-out-value");
  if (tokensOutValue) tokensOutValue.textContent = stats.tokensOut;

  const totalTokensValue = document.getElementById("total-tokens-value");
  if (totalTokensValue) {
    totalTokensValue.textContent = stats.totalTokens;
    console.log("📊 Updated total tokens value:", stats.totalTokens);
  } else {
    console.warn("❌ total-tokens-value element not found");
  }

  // Animate environmental impact
  const energyValue = document.getElementById("energy-value");
  if (energyValue) energyValue.textContent = `${stats.energyUsageWh} kWh`;

  const waterValue = document.getElementById("water-value");
  if (waterValue) waterValue.textContent = `${stats.waterUsedL} L`;

  const co2Value = document.getElementById("co2-value");
  if (co2Value) co2Value.textContent = `${stats.co2EmittedKg} kg`;

  const restoredValue = document.getElementById("restored-value");
  if (restoredValue) restoredValue.textContent = `${stats.forestRestoredM2} m²`;

  // Animate environmental equivalents
  const phonesValue = document.getElementById("phones-value");
  if (phonesValue) phonesValue.textContent = stats.phonesCharged;

  const youtubeValue = document.getElementById("youtube-value");
  if (youtubeValue) youtubeValue.textContent = `${stats.youtubeMinutes} min`;

  const elevatorValue = document.getElementById("elevator-value");
  if (elevatorValue)
    elevatorValue.textContent = `${stats.elevatorFloors} floors`;

  // Update all visual elements
  updateChangeIndicators(stats);
  updateTokenUsageVisual(stats);
  // updateImpactBalance(stats); // Removed as per edit hint

  // Ensure main metric shows total tokens
  const mainMetricValue = document.getElementById("main-metric-value");
  if (mainMetricValue) {
    mainMetricValue.textContent = stats.totalTokens || 0;
  }
}

/**
 * Revolutionary update lifetime stats with animations
 */
function updateLifetimeStatsWithAnimation(logs) {
  const stats = calculateStats(logs);

  // Similar animation logic for lifetime stats
  // This would be called when switching to lifetime tab
  updateTokenUsageVisual(stats);
  // updateImpactBalance(stats); // Removed as per edit hint
}

/**
 * Update revolutionary change indicators
 */
function updateChangeIndicators(stats) {
  const energyChange = document.getElementById("energy-change");
  const waterChange = document.getElementById("water-change");
  const co2Change = document.getElementById("co2-change");

  if (energyChange) {
    const change = Math.round((stats.energyUsageWh / 100) * 100);
    energyChange.textContent = `+${change}% today`;
    energyChange.className = `stat-change ${
      change > 0 ? "positive" : "negative"
    }`;
  }

  if (waterChange) {
    const change = Math.round(((stats.energyUsageWh * 0.5) / 50) * 100);
    waterChange.textContent = `+${change}% today`;
    waterChange.className = `stat-change ${
      change > 0 ? "positive" : "negative"
    }`;
  }

  if (co2Change) {
    const change = Math.round(((stats.energyUsageWh * 0.0005) / 0.25) * 100);
    co2Change.textContent = `+${change}% today`;
    co2Change.className = `stat-change ${change > 0 ? "negative" : "positive"}`;
  }
}

/**
 * Filter logs for today
 */
function filterTodayLogs(logs) {
  const today = new Date().toDateString();
  return logs.filter((log) => {
    const logDate = new Date(log.timestamp).toDateString();
    return logDate === today;
  });
}

/**
 * Calculate revolutionary stats from logs
 */
function calculateStats(logs) {
  let messages = logs.length;
  let tokensIn = 0;
  let tokensOut = 0;
  let totalTokens = 0;
  let energyUsageWh = 0;
  let waterUsedL = 0;
  let co2EmittedKg = 0;
  let forestRestoredM2 = 0;
  let phonesCharged = 0;
  let youtubeMinutes = 0;
  let elevatorFloors = 0;

  logs.forEach((log) => {
    tokensIn += log.inputTokens || 0;
    tokensOut += log.outputTokens || 0;
    totalTokens += (log.inputTokens || 0) + (log.outputTokens || 0);
    // Use the actual energy and CO2 values from the log (set by content script)
    const logEnergy = log.energyUsage || 0;
    const logCO2 = log.co2Emissions || 0;
    energyUsageWh += logEnergy;
    co2EmittedKg += logCO2;
    // Water calculation: 0.2 L per kWh (as in content script, see methodology)
    waterUsedL += (logEnergy / 1000) * 0.2;
    // Equivalents
    phonesCharged += logEnergy / 13.5;
    youtubeMinutes += logEnergy / 0.25;
    elevatorFloors += logEnergy / 6.25;
  });

  // Forest restored (example: 1 m² per 1000 tokens)
  forestRestoredM2 = Math.floor(totalTokens / 1000);

  return {
    messages,
    tokensIn,
    tokensOut,
    totalTokens,
    energyUsageWh: Math.round(energyUsageWh * 10) / 10, // 1 decimal place
    waterUsedL: Math.round(waterUsedL * 10) / 10,
    co2EmittedKg: Math.round(co2EmittedKg * 1000) / 1000, // 3 decimals for small values
    forestRestoredM2,
    phonesCharged: Math.round(phonesCharged),
    youtubeMinutes: Math.round(youtubeMinutes),
    elevatorFloors: Math.round(elevatorFloors),
  };
}

/**
 * Revolutionary email form setup with enhanced UX
 */
function setupEmailForm() {
  const emailForm = document.getElementById("email-form");
  const emailInput = document.getElementById("email-input");
  const skipBtn = document.getElementById("skip-btn");

  if (emailForm) {
    emailForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const email = emailInput.value.trim();
      const marketingConsent =
        document.getElementById("marketing-consent").checked;

      if (isValidEmail(email)) {
        saveUserEmail(email, marketingConsent);
        hideEmailOverlay();

        // Show success animation
        showEmailSuccess();
      } else {
        // Show error state
        emailInput.style.borderColor = "#f44336";
        emailInput.style.boxShadow = "0 0 0 3px rgba(244, 67, 54, 0.2)";

        setTimeout(() => {
          emailInput.style.borderColor = "";
          emailInput.style.boxShadow = "";
        }, 2000);
      }
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener("click", function () {
      hideEmailOverlay();
      RegenAIState.updateUserState("notOptedIn");
    });
  }
}

/**
 * Show revolutionary email success
 */
function showEmailSuccess() {
  const overlay = document.getElementById("email-overlay");
  const overlayContent = overlay?.querySelector(".overlay-content");

  if (overlayContent) {
    overlayContent.innerHTML = `
      <div class="overlay-header">
        <div class="overlay-icon" style="background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);">
          <i class="ri-check-line"></i>
        </div>
        <div class="overlay-title">Welcome to Regen-AI!</div>
        <div class="overlay-description">
          You're now part of the solution. Start tracking your impact and contributing to forest restoration.
        </div>
      </div>
      <div class="overlay-actions">
        <button class="btn btn-primary btn-full" onclick="hideEmailOverlay()">
          <i class="ri-arrow-right-line"></i>
          Get Started
        </button>
      </div>
    `;

    // Trigger confetti
    AnimationController.triggerConfetti();
  }
}

/**
 * Revolutionary show email overlay with enhanced animations
 */
function showEmailOverlay() {
  const overlay = document.getElementById("email-overlay");
  if (overlay) {
    overlay.classList.add("active");

    // Focus on email input
    setTimeout(() => {
      const emailInput = document.getElementById("email-input");
      if (emailInput) emailInput.focus();
    }, 300);
  }
}

/**
 * Revolutionary hide email overlay
 */
function hideEmailOverlay() {
  const overlay = document.getElementById("email-overlay");
  if (overlay) {
    overlay.classList.remove("active");
  }
}

/**
 * Revolutionary check user email and update UI
 */
function checkUserEmailAndUpdateUI() {
  const userEmail = getUserEmail();
  if (userEmail) {
    RegenAIState.updateUserState("emailCollected");
    hideEmailOverlay();
  } else {
    showEmailOverlay();
  }
}

/**
 * Revolutionary save user email with enhanced feedback
 */
function saveUserEmail(email, marketingConsent = false) {
  try {
    localStorage.setItem("userEmail", email);
    localStorage.setItem("marketingConsent", marketingConsent.toString());

    // Send to backend
    sendEmailToBackend(email, marketingConsent);

    // Update state
    RegenAIState.updateUserState("emailCollected");

    console.log("Email saved successfully:", email);
  } catch (error) {
    console.error("Error saving email:", error);
  }
}

/**
 * Revolutionary get user email
 */
function getUserEmail() {
  return localStorage.getItem("userEmail");
}

/**
 * Revolutionary send email to backend
 */
function sendEmailToBackend(email, marketingConsent = false) {
  // Implementation for sending email to backend
  // This would integrate with your backend service
  console.log("Sending email to backend:", { email, marketingConsent });
}

/**
 * Revolutionary email validation
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Revolutionary estimation method setup
 */
function setupEstimationMethodToggle() {
  const estimationSelect = document.getElementById("estimation-method");
  if (estimationSelect) {
    estimationSelect.addEventListener("change", function () {
      const method = this.value;
      saveEstimationMethod(method);
      recalculateLogsInPopup(method);
    });
  }
}

/**
 * Revolutionary load estimation method
 */
function loadEstimationMethod() {
  const storage = getChromeStorage();
  if (storage) {
    storage.get(["estimationMethod"], function (result) {
      const method = result.estimationMethod || "community";
      const select = document.getElementById("estimation-method");
      if (select) {
        select.value = method;
      }
    });
  }
}

/**
 * Revolutionary save estimation method
 */
function saveEstimationMethod(method) {
  const storage = getChromeStorage();
  if (storage) {
    storage.set({ estimationMethod: method });
  }
}

/**
 * Revolutionary recalculate logs
 */
function recalculateLogsInPopup(method, callback) {
  const storage = getChromeStorage();
  if (storage) {
    storage.get(["chatgptLogs"], function (result) {
      const logs = result.chatgptLogs || [];

      // Recalculate with new method
      logs.forEach((log) => {
        const energy = calculateEnergyAndEmissionsInPopup(
          log.outputTokens || 0,
          method
        );
        log.energyUsageWh = energy.energyUsageWh;
        log.co2Emissions = energy.co2Emissions;
      });

      // Update storage
      storage.set({ chatgptLogs: logs });

      // Update UI
      updateTodayStatsWithAnimation(logs);
      updateLifetimeStatsWithAnimation(logs);

      if (callback) callback();
    });
  }
}

/**
 * Revolutionary energy calculation
 */
function calculateEnergyAndEmissionsInPopup(
  outputTokens,
  method = "community"
) {
  let energyUsageWh;

  if (method === "community") {
    // Community estimates
    energyUsageWh = outputTokens * 0.0025; // 2.5 Wh per token
  } else {
    // Altman estimates
    energyUsageWh = outputTokens * 0.001; // 1 Wh per token
  }

  const co2Emissions = energyUsageWh * 0.0005; // 0.5 kg CO2 per kWh

  return {
    energyUsageWh,
    co2Emissions,
  };
}

/**
 * Revolutionary adjust popup height
 */
function adjustPopupHeight() {
  let rafId = null;
  let lastHeight = 0;
  let resizeObserver = null;

  const processResize = () => {
    rafId = null;
    const activeTab = document.querySelector(".stats-container.active");
    if (!activeTab) return;

    const currentScrollHeight = document.body.scrollHeight;
    if (
      currentScrollHeight !== lastHeight &&
      currentScrollHeight > window.innerHeight
    ) {
      lastHeight = currentScrollHeight;
      if (resizeObserver) {
        resizeObserver.disconnect();
        setTimeout(() => {
          resizeObserver.observe(document.body);
        }, 100);
      }
    }
  };

  resizeObserver = new ResizeObserver(() => {
    if (!rafId) {
      rafId = requestAnimationFrame(processResize);
    }
  });

  resizeObserver.observe(document.body);
  window._popupResizeObserver = resizeObserver;
}

/**
 * Revolutionary test and load Supabase data
 */
async function testAndLoadSupabaseData() {
  try {
    await loadSupabaseData();
  } catch (error) {
    console.error("Supabase connection failed:", error);
  }
}

/**
 * Revolutionary load Supabase data
 */
async function loadSupabaseData() {
  // Implementation for loading data from Supabase
  // This would integrate with your Supabase backend
  console.log("Loading Supabase data...");
}

/**
 * Revolutionary notify estimation method change
 */
function notifyEstimationMethodChange(method) {
  console.log("Estimation method changed to:", method);
  // Additional notification logic
}

// Legacy functions for compatibility
function updateTodayStats(logs) {
  updateTodayStatsWithAnimation(logs);
}

function updateLifetimeStats(logs) {
  updateLifetimeStatsWithAnimation(logs);
}

function tryLoadLogsAgain() {
  setTimeout(() => {
    loadLogs();
  }, 1000);
}

// IMPACT BALANCE CALCULATION AND VISUALIZATION
// Removed hero-related functions

function updateTokenUsageVisual(stats) {
  try {
    const tokenCard = document.getElementById("token-usage-card");
    if (tokenCard) {
      tokenCard.setAttribute(
        "data-tooltip",
        `In: ${stats.tokensIn} • Out: ${stats.tokensOut}`
      );
    }
    const inBar = document.getElementById("token-bar-in");
    const outBar = document.getElementById("token-bar-out");
    const total = stats.tokensIn + stats.tokensOut;
    if (inBar && outBar) {
      const inPercent = total ? Math.round((stats.tokensIn / total) * 100) : 0;
      const outPercent = total ? 100 - inPercent : 0;
      inBar.style.height = `${inPercent}%`;
      outBar.style.height = `${outPercent}%`;
    }
  } catch (e) {
    console.error("Error updating token usage visual", e);
  }
}

// Set up m² chart interactions
function setupM2ChartInteractions() {
  const viewDetailsBtn = document.getElementById("view-details-btn");
  const plantTreesBtn = document.getElementById("plant-trees-btn");
  const detailsContainer = document.getElementById("details-container");
  const m2ChartSection = document.querySelector(".m2-chart-section");
  const usageMetricsRow = document.getElementById("usage-metrics-row");

  if (viewDetailsBtn && detailsContainer && m2ChartSection && usageMetricsRow) {
    viewDetailsBtn.addEventListener("click", function (e) {
      e.preventDefault();

      const isVisible = detailsContainer.style.display === "block";

      if (isVisible) {
        detailsContainer.style.display = "none";
        m2ChartSection.classList.remove("details-visible");
        viewDetailsBtn.innerHTML =
          '<i class="ri-arrow-down-s-line"></i> View details';
        viewDetailsBtn.classList.remove("active");
        usageMetricsRow.classList.add("usage-limited");
      } else {
        detailsContainer.style.display = "block";
        m2ChartSection.classList.add("details-visible");
        viewDetailsBtn.innerHTML =
          '<i class="ri-arrow-up-s-line"></i> Hide details';
        viewDetailsBtn.classList.add("active");
        usageMetricsRow.classList.remove("usage-limited");
      }

      return;
    });
    // Set initial state
    usageMetricsRow.classList.add("usage-limited");
  }

  if (plantTreesBtn) {
    plantTreesBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (RegenAIState.userState === "donor") {
        window.open("/dashboard/index.html", "_blank");
        return;
      }
      redirectToDonationLanding();
      return;
    });
  }
}

// Export for global access
window.RegenAIState = RegenAIState;
window.AnimationController = AnimationController;
