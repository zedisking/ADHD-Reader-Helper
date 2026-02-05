/**
 * ADHD Reading Helper Popup
 */
(function () {
  'use strict';

  const strengthEl = document.getElementById('strength');
  const strengthValEl = document.getElementById('strengthVal');
  const enabledEl = document.getElementById('enabled');

  chrome.storage.sync.get({ strength: 3, enabled: true }, (items) => {
    strengthEl.value = items.strength;
    strengthValEl.textContent = items.strength;
    enabledEl.checked = items.enabled !== false;
  });

  function reloadActiveTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.id) {
        chrome.tabs.reload(tab.id);
      }
    });
  }

  strengthEl.addEventListener('input', () => {
    const v = parseInt(strengthEl.value, 10);
    strengthValEl.textContent = v;
    chrome.storage.sync.set({ strength: v }, reloadActiveTab);
  });

  enabledEl.addEventListener('change', () => {
    chrome.storage.sync.set({ enabled: enabledEl.checked }, reloadActiveTab);
  });
})();
