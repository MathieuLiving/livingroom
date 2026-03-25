/**
 * Utility functions for safe fetch operations during auth state changes
 */

let isSigningOut = false;
let isUnloading = false;

// Track signing out state
export const setSigningOut = (value) => {
  isSigningOut = value;
};

// Track unloading state
export const setUnloading = (value) => {
  isUnloading = value;
};

/**
 * Check if we're currently signing out or unloading
 */
export const isSigningOutOrUnloading = () => {
  return isSigningOut || isUnloading;
};

/**
 * Check if an error is ignorable (network noise during logout/unload)
 */
export const isIgnorableFetchError = (error) => {
  if (!error) return false;

  const message = String(error?.message || "").toLowerCase();
  const name = String(error?.name || "").toLowerCase();

  // AbortError is expected during logout
  if (name === "aborterror") return true;

  // Network errors during unload are expected
  if (message.includes("abort")) return true;
  if (message.includes("network")) return true;
  if (message.includes("failed to fetch")) return true;

  return false;
};

/**
 * Safe fetch wrapper that respects abort signals and logout state
 */
export const safeFetch = async (url, options = {}) => {
  // If we're signing out or unloading, don't make the request
  if (isSigningOutOrUnloading()) {
    const error = new Error("Fetch aborted: signing out or unloading");
    error.name = "AbortError";
    throw error;
  }

  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // Re-throw the error - caller will handle it
    throw error;
  }
};