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
  userState: 'notOptedIn', // 'notOptedIn', 'donor', 'emailCollected'
  impactLevel: 'low', // 'low', 'medium', 'high'
  contributionStreak: 0,
  totalContributed: 0,
  lastContributionDate: null,
  
  updateUserState(newState) {
    this.userState = newState;
    localStorage.setItem('regenAI_userState', newState);
    this.updateUI();
  },
  
  updateImpactLevel(energyUsage) {
    if (energyUsage < 100) this.impactLevel = 'low';
    else if (energyUsage < 500) this.impactLevel = 'medium';
    else this.impactLevel = 'high';
    this.updateUI();
  },
  
  updateUI() {
    this.updateHeroSection();
    this.updateActionCard();
    this.updateProgressBar();
  },
  
  updateHeroSection() {
    const subtitle = document.getElementById("impact-subtitle");
    const metricLabel = document.getElementById("main-metric-label");
    const mainMetricTile = document.getElementById("main-metric-tile");
    
    if (this.userState === "donor") {
      if (subtitle) subtitle.textContent = "Thank you for supporting reforestation! 🌱";
      if (metricLabel) metricLabel.textContent = "m² restored";
      if (mainMetricTile) mainMetricTile.style.display = "block";
    } else {
      if (subtitle) subtitle.textContent = "Track your AI footprint";
      if (metricLabel) metricLabel.textContent = "Tokens";
      if (mainMetricTile) mainMetricTile.style.display = "none";
    }
  },
  
  updateActionCard() {
    const actionCard = document.getElementById('donation-card');
    const actionTitle = actionCard?.querySelector('.action-title');
    const actionDescription = actionCard?.querySelector('.action-description');
    
    if (this.userState === 'donor') {
      if (actionTitle) actionTitle.textContent = 'Continue Your Impact';
      if (actionDescription) actionDescription.textContent = 
        `You've contributed to ${this.totalContributed}m² of forest restoration. Keep making a difference!`;
    } else {
      if (actionTitle) actionTitle.textContent = 'Support Forest Restoration';
      if (actionDescription) actionDescription.textContent = 
        'Offset your AI impact by contributing to Bergwaldprojekt\'s reforestation efforts';
    }
  },
  
  updateProgressBar() {
    const progressFill = document.getElementById('donation-progress');
    const progressText = document.getElementById('donation-text');
    
    if (this.userState === 'donor') {
      const progress = Math.min((this.totalContributed / 100) * 100, 100);
      if (progressFill) progressFill.style.width = `${progress}%`;
      if (progressText) progressText.textContent = `${this.totalContributed}m² restored`;
    } else {
      if (progressFill) progressFill.style.width = '0%';
      if (progressText) progressText.textContent = 'Ready to make a difference';
    }
  }
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
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.round(num).toString();
  },
  
  triggerConfetti() {
    // Simple confetti effect for achievements
    const colors = ['#2E7D32', '#1976D2', '#FF9800', '#4CAF50'];
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const confetti = document.createElement('div');
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
  }
};

// Add confetti animation to CSS
const style = document.createElement('style');
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
    RegenAIState.userState = localStorage.getItem('regenAI_userState') || 'notOptedIn';
    RegenAIState.totalContributed = parseInt(localStorage.getItem('regenAI_totalContributed')) || 0;
    
    // Set up revolutionary tab switching
    document.getElementById("lifetime-tab").addEventListener("click", function () {
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
  const donateBtn = document.getElementById('donate-btn');
  if (donateBtn) {
    donateBtn.addEventListener('click', function() {
      if (!getUserEmail()) {
        showEmailOverlay();
        return;
      }
      if (RegenAIState.userState === 'donor') {
        // Show contribution success
        showContributionSuccess();
      } else {
        // Show email overlay for new users
        showEmailOverlay();
      }
    });
  }
}

/**
 * Show revolutionary contribution success
 */
function showContributionSuccess() {
  const actionCard = document.getElementById('donation-card');
  if (actionCard) {
    actionCard.style.transform = 'scale(1.05)';
    actionCard.style.boxShadow = '0 20px 40px rgba(46, 125, 50, 0.3)';
    
    setTimeout(() => {
      actionCard.style.transform = 'scale(1)';
      actionCard.style.boxShadow = '';
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

      // Update stats with revolutionary animations
      updateTodayStatsWithAnimation(logs);
      updateLifetimeStatsWithAnimation(logs);
      
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

  // Animate usage metrics
  const messagesValue = document.getElementById("messages-value");
  if (messagesValue) messagesValue.textContent = stats.messages;

  const tokensInValue = document.getElementById("tokens-in-value");
  if (tokensInValue) tokensInValue.textContent = stats.tokensIn;

  const tokensOutValue = document.getElementById("tokens-out-value");
  if (tokensOutValue) tokensOutValue.textContent = stats.tokensOut;

  const totalTokensValue = document.getElementById("total-tokens-value");
  if (totalTokensValue) totalTokensValue.textContent = stats.totalTokens;

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
  if (elevatorValue) elevatorValue.textContent = `${stats.elevatorFloors} floors`;

  // Update all visual elements
  updateChangeIndicators(stats);
  updateTokenUsageVisual(stats);
  updateImpactBalance(stats);
  
  // Ensure main metric shows total tokens
  const mainMetricValue = document.getElementById('main-metric-value');
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
  updateImpactBalance(stats);
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
    energyChange.className = `stat-change ${change > 0 ? 'positive' : 'negative'}`;
  }
  
  if (waterChange) {
    const change = Math.round((stats.energyUsageWh * 0.5 / 50) * 100);
    waterChange.textContent = `+${change}% today`;
    waterChange.className = `stat-change ${change > 0 ? 'positive' : 'negative'}`;
  }
  
  if (co2Change) {
    const change = Math.round((stats.energyUsageWh * 0.0005 / 0.25) * 100);
    co2Change.textContent = `+${change}% today`;
    co2Change.className = `stat-change ${change > 0 ? 'negative' : 'positive'}`;
  }
}

/**
 * Filter logs for today
 */
function filterTodayLogs(logs) {
  const today = new Date().toDateString();
  return logs.filter(log => {
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

  logs.forEach(log => {
    tokensIn += log.inputTokens || 0;
    tokensOut += log.outputTokens || 0;
    totalTokens += (log.inputTokens || 0) + (log.outputTokens || 0);
    const energy = calculateEnergyAndEmissionsInPopup(log.outputTokens || 0);
    energyUsageWh += energy.energyUsageWh;
    co2EmittedKg += energy.energyUsageWh * 0.0005;
    waterUsedL += energy.energyUsageWh * 0.5;
    // Equivalents
    phonesCharged += energy.energyUsageWh / 13.5;
    youtubeMinutes += energy.energyUsageWh / 0.25;
    elevatorFloors += energy.energyUsageWh / 6.25;
  });

  // Forest restored (example: 1 m² per 1000 tokens)
  forestRestoredM2 = Math.floor(totalTokens / 1000);

  return {
    messages,
    tokensIn,
    tokensOut,
    totalTokens,
    energyUsageWh: Math.round(energyUsageWh),
    waterUsedL: Math.round(waterUsedL),
    co2EmittedKg: Math.round(co2EmittedKg),
    forestRestoredM2,
    phonesCharged: Math.round(phonesCharged),
    youtubeMinutes: Math.round(youtubeMinutes),
    elevatorFloors: Math.round(elevatorFloors)
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
    emailForm.addEventListener("submit", function(e) {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      const marketingConsent = document.getElementById("marketing-consent").checked;
      
      if (isValidEmail(email)) {
        saveUserEmail(email, marketingConsent);
        hideEmailOverlay();
        
        // Show success animation
        showEmailSuccess();
      } else {
        // Show error state
        emailInput.style.borderColor = '#f44336';
        emailInput.style.boxShadow = '0 0 0 3px rgba(244, 67, 54, 0.2)';
        
        setTimeout(() => {
          emailInput.style.borderColor = '';
          emailInput.style.boxShadow = '';
        }, 2000);
      }
    });
  }
  
  if (skipBtn) {
    skipBtn.addEventListener("click", function() {
      hideEmailOverlay();
      RegenAIState.updateUserState('notOptedIn');
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
    RegenAIState.updateUserState('emailCollected');
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
    RegenAIState.updateUserState('emailCollected');
    
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
    estimationSelect.addEventListener("change", function() {
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
    storage.get(["estimationMethod"], function(result) {
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
    storage.get(["chatgptLogs"], function(result) {
      const logs = result.chatgptLogs || [];
      
      // Recalculate with new method
      logs.forEach(log => {
        const energy = calculateEnergyAndEmissionsInPopup(log.outputTokens || 0, method);
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
function calculateEnergyAndEmissionsInPopup(outputTokens, method = "community") {
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
    co2Emissions
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
    if (currentScrollHeight !== lastHeight && currentScrollHeight > window.innerHeight) {
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
function updateImpactBalance(stats) {
  try {
    // Calculate consumption score (based on environmental impact)
    const consumptionScore = calculateConsumptionScore(stats);
    
    // Get contribution score (from donations/offsets)
    const contributionScore = getContributionScore();
    
    // Calculate balance percentage (-100% to +100%)
    const balanceScore = calculateBalanceScore(consumptionScore, contributionScore);
    
    // Update visual elements
    updateBalanceVisualization(consumptionScore, contributionScore, balanceScore);
    
    // Update psychological messaging
    updatePsychologicalMessaging(balanceScore);
    
  } catch(e) {
    console.error('Error updating impact balance:', e);
  }
}

function calculateConsumptionScore(stats) {
  // Base consumption primarily on token usage and environmental impact
  const tokenScore = (stats.totalTokens || 0) * 0.1; // Scale tokens 
  const energyScore = parseFloat(stats.energy || 0) * 100; // Scale energy consumption
  const co2Score = parseFloat(stats.co2 || 0) * 50; // Scale CO2 impact
  const waterScore = parseFloat(stats.water || 0) * 2; // Scale water usage
  
  const totalScore = tokenScore + energyScore + co2Score + waterScore;
  return Math.max(totalScore, 1); // Minimum 1 to show consumption
}

function getContributionScore() {
  // For now, return 0 (no contributions yet)
  // In future, this would track actual donations/offsets
  return 0;
}

function calculateBalanceScore(consumption, contribution) {
  if (consumption === 0 && contribution === 0) return 0;
  
  const total = consumption + contribution;
  const balance = ((contribution - consumption) / Math.max(consumption, contribution)) * 100;
  
  // Clamp between -100 and +100
  return Math.max(-100, Math.min(100, Math.round(balance)));
}

function updateBalanceVisualization(consumption, contribution, balanceScore) {
  // Update consumption bar
  const consumptionFill = document.getElementById('consumption-fill');
  const contributionFill = document.getElementById('contribution-fill');
  const consumptionBar = document.getElementById('consumption-bar');
  const contributionBar = document.getElementById('contribution-bar');
  
  if (consumptionFill && contributionFill) {
    const total = Math.max(consumption + contribution, 1);
    const consumptionPercent = Math.round((consumption / total) * 100);
    const contributionPercent = Math.round((contribution / total) * 100);
    
    consumptionFill.style.width = `${Math.max(consumptionPercent, 5)}%`; // Minimum 5% to show
    contributionFill.style.width = `${contributionPercent}%`;
    
    // Update tooltips with detailed info
    if (consumptionBar) {
      consumptionBar.setAttribute('data-tooltip', `AI Consumption Score: ${consumption.toFixed(1)}`);
    }
    if (contributionBar) {
      contributionBar.setAttribute('data-tooltip', `Environmental Contributions: ${contribution.toFixed(1)}`);
    }
  }
  
  // Update balance score display
  const scoreValue = document.getElementById('score-value');
  const balanceScore_element = document.getElementById('balance-score');
  
  if (scoreValue) {
    scoreValue.textContent = `${balanceScore >= 0 ? '+' : ''}${balanceScore}%`;
  }
  
  if (balanceScore_element) {
    let tooltipText = '';
    if (balanceScore >= 20) {
      tooltipText = 'Planet Positive - Contributing more than consuming!';
    } else if (balanceScore >= 0) {
      tooltipText = 'Nearly Balanced - Almost offsetting your impact';
    } else if (balanceScore >= -50) {
      tooltipText = 'Environmental Debt - Consider offsetting your AI usage';
    } else {
      tooltipText = 'High Impact Debt - Time to balance your environmental footprint';
    }
    balanceScore_element.setAttribute('data-tooltip', tooltipText);
  }
}

function updatePsychologicalMessaging(balanceScore) {
  const heroElement = document.getElementById('impact-hero');
  const statusElement = document.getElementById('balance-status');
  
  if (!heroElement || !statusElement) return;
  
  // Remove existing classes
  heroElement.classList.remove('negative', 'neutral', 'positive');
  
  if (balanceScore >= 20) {
    // Positive impact
    heroElement.classList.add('positive');
    statusElement.textContent = 'Planet Positive 🌱';
    heroElement.setAttribute('data-tooltip', 'Contributing more than consuming - great job!');
  } else if (balanceScore >= 0) {
    // Nearly balanced
    heroElement.classList.add('neutral');
    statusElement.textContent = 'Nearly Balanced';
    heroElement.setAttribute('data-tooltip', 'Almost balanced - keep going!');
  } else if (balanceScore >= -50) {
    // Moderate debt
    heroElement.classList.add('negative');
    statusElement.textContent = 'Environmental Debt';
    heroElement.setAttribute('data-tooltip', 'Taking more than giving back to nature');
  } else {
    // High debt
    heroElement.classList.add('negative');
    statusElement.textContent = 'High Impact Debt';
    heroElement.setAttribute('data-tooltip', 'Time to give back to nature 🌍');
  }
}

function updateTokenUsageVisual(stats){
  try{
    const tokenCard=document.getElementById('token-usage-card');
    if(tokenCard){
       tokenCard.setAttribute('data-tooltip',`In: ${stats.tokensIn} • Out: ${stats.tokensOut}`);
    }
    const inBar=document.getElementById('token-bar-in');
    const outBar=document.getElementById('token-bar-out');
    const total=stats.tokensIn+stats.tokensOut;
    if(inBar&&outBar){
      const inPercent=total?Math.round((stats.tokensIn/total)*100):0;
      const outPercent=total?100-inPercent:0;
      inBar.style.height=`${inPercent}%`;
      outBar.style.height=`${outPercent}%`;
    }
  }catch(e){console.error('Error updating token usage visual',e);}
}

// Export for global access
window.RegenAIState = RegenAIState;
window.AnimationController = AnimationController;
