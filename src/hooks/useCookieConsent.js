import { useState, useEffect } from 'react';

const STORAGE_KEY = 'livingroom_cookie_consent';

export const useCookieConsent = () => {
  const [consent, setConsent] = useState(null); // null = not yet decided, true = accepted, false = declined
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check local storage on mount
    const storedConsent = localStorage.getItem(STORAGE_KEY);
    
    if (storedConsent === 'granted') {
      setConsent(true);
      setShowBanner(false);
    } else if (storedConsent === 'denied') {
      setConsent(false);
      setShowBanner(false);
    } else {
      // No preference stored yet
      setConsent(null);
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem(STORAGE_KEY, 'granted');
    setConsent(true);
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem(STORAGE_KEY, 'denied');
    setConsent(false);
    setShowBanner(false);
  };

  const resetConsent = () => {
    localStorage.removeItem(STORAGE_KEY);
    setConsent(null);
    setShowBanner(true);
  };

  return {
    consent,
    showBanner,
    acceptCookies,
    declineCookies,
    resetConsent
  };
};

export default useCookieConsent;