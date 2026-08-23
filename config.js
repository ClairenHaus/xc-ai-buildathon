window.BUILDATHON_CONFIG = {
  registrationEndpoint: "https://iyyatugcngmqplsyzjsq.supabase.co/functions/v1/register-buildathon",

  replayPreEventCheckoutUrl: "https://buy.stripe.com/7sYbJ29RR7QjgOFatQbQY06",
  replayPostEventCheckoutUrl: "https://buy.stripe.com/00w7sM0hh1rV41TdG2bQY07",
  eventStartIso: "2026-09-01T19:00:00-04:00",

  thankYouPath: "thank-you.html",

  event: {
    title: "AI in Action: The Buildathon",
    date: "Tuesday, September 1, 2026",
    time: "7:00 PM ET",
    durationMinutes: 75
  }
};

// Keep event-time copy on both static pages driven by this config.
(() => {
  const updateDisplayedTime = () => {
    if (!document.body) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.includes("6:00 PM ET")) {
        node.nodeValue = node.nodeValue.replaceAll("6:00 PM ET", "7:00 PM ET");
      }
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateDisplayedTime, { once: true });
  } else {
    updateDisplayedTime();
  }
})();
