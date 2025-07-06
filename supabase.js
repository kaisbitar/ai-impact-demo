/**
 * Supabase REST API Functions for AI Impact Tracker
 * ================================================
 *
 * This file contains functions to interact with Supabase using the REST API.
 * No external Supabase client library is needed.
 */

// Supabase configuration
const SUPABASE_URL = "https://golidwlfnfabmothqipx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvbGlkd2xmbmZhYm1vdGhxaXB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MDkzODIsImV4cCI6MjA2NzM4NTM4Mn0.HH2a3IFhuWeZXPvTu_Ub9BgAwdLtwLVFrIUtHW93nMc";

/**
 * Submit usage data to Supabase using REST API
 * @param {Object} usageData - The usage data object
 * @returns {Promise} - Promise that resolves when data is submitted
 */
async function submitUsageData(usageData) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/usage_data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(usageData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Get usage data for a specific user using REST API
 * @param {string} userId - The user ID
 * @returns {Promise} - Promise that resolves with usage data
 */
async function getUserUsageData(userId) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/usage_data?user_id=eq.${userId}&order=timestamp.desc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Get today's usage data for a user using REST API
 * @param {string} userId - The user ID
 * @returns {Promise} - Promise that resolves with today's usage data
 */
async function getTodayUsageData(userId) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const url = `${SUPABASE_URL}/rest/v1/usage_data?user_id=eq.${userId}&timestamp=gte.${today.toISOString()}&order=timestamp.desc`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Test function to check if Supabase is reachable
 * @returns {Promise} - Promise that resolves with connection status
 */
async function testSupabaseConnection() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/usage_data?limit=1`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

// Export functions for use in other files
window.supabaseClient = {
  submitUsageData,
  getUserUsageData,
  getTodayUsageData,
  testSupabaseConnection,
};
