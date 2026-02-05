/**
 * ADHD Reading Helper Background Service Worker
 * Handles extension lifecycle; content script does the main work on pages
 */
chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.sync.set({
    strength: 3,
    enabled: true,
    tagExclusions: {
      html: true,
      header: true,
      footer: true,
      button: true,
      input: true,
      textarea: true,
      select: true
    }
  });

  // Auto-apply on first install: reload the first normal tab in the current window
  // so the content script runs immediately without you having to disable/re-enable.
  if (details.reason === 'install') {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const candidates = tabs.filter(
        (t) =>
          t.url &&
          !t.url.startsWith('chrome://') &&
          !t.url.startsWith('edge://') &&
          !t.url.startsWith('about:') &&
          !t.url.startsWith('chrome-extension://')
      );
      const tab = candidates.find((t) => t.active) || candidates[0];
      if (tab && tab.id) {
        chrome.tabs.reload(tab.id);
      }
    });
  }
});
