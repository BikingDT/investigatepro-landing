/**
 * InvestigatePro Simple Analytics
 * Privacy-friendly, lightweight page view tracking
 * 
 * Data sent: page path, referrer (domain only), screen size, timestamp
 * No cookies, no fingerprinting, no personal data
 */
(function() {
  'use strict';
  
  // Config - API endpoint
  const ENDPOINT = 'https://investigatepro.72-62-211-212.sslip.io/api/analytics/pageview';
  const DEBUG = false;
  
  // Get referrer domain only (privacy-friendly)
  function getReferrerDomain() {
    try {
      if (!document.referrer) return null;
      const url = new URL(document.referrer);
      // Don't track internal referrers
      if (url.hostname === window.location.hostname) return null;
      return url.hostname;
    } catch (e) {
      return null;
    }
  }
  
  // Track page view
  function trackPageView() {
    const data = {
      path: window.location.pathname,
      referrer: getReferrerDomain(),
      screen: screen.width + 'x' + screen.height,
      timestamp: new Date().toISOString()
    };
    
    if (DEBUG) console.log('Analytics:', data);
    
    // Use sendBeacon for reliability (works even when navigating away)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, JSON.stringify(data));
    } else {
      // Fallback for older browsers
      fetch(ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      }).catch(function() {});
    }
  }
  
  // Track on page load
  if (document.readyState === 'complete') {
    trackPageView();
  } else {
    window.addEventListener('load', trackPageView);
  }
})();
