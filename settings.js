/**
 * ADHD Reading Helper Settings Page
 */
(function () {
  'use strict';

  const DEFAULT_EXCLUDED = ['html', 'header', 'footer', 'button', 'input', 'textarea', 'select'];

  const strengthEl = document.getElementById('strength');
  const strengthValueEl = document.getElementById('strengthValue');
  const enabledEl = document.getElementById('enabled');
  const defaultTagsEl = document.getElementById('defaultTags');
  const pageTagsEl = document.getElementById('pageTags');
  const scanBtn = document.getElementById('scanBtn');

  function renderTagCheckbox(container, tag, checked, onChange) {
    const id = 'tag-' + tag;
    const item = document.createElement('div');
    item.className = 'tag-item';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.id = id;
    cb.checked = checked;
    cb.addEventListener('change', () => onChange(tag, cb.checked));
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = '<' + tag + '>';
    item.appendChild(cb);
    item.appendChild(label);
    container.appendChild(item);
  }

  function loadSettings() {
    chrome.storage.sync.get(
      { strength: 3, enabled: true, tagExclusions: {} },
      (items) => {
        strengthEl.value = items.strength;
        strengthValueEl.textContent = items.strength;
        enabledEl.checked = items.enabled !== false;
        const exclusions = items.tagExclusions || {};

        defaultTagsEl.innerHTML = '';
        DEFAULT_EXCLUDED.forEach((tag) => {
          const excluded = exclusions[tag] !== false;
          renderTagCheckbox(defaultTagsEl, tag, excluded, (t, checked) => {
            saveTagExclusion(t, checked);
          });
        });

        const pageTags = Object.keys(exclusions).filter((t) => !DEFAULT_EXCLUDED.includes(t));
        pageTagsEl.innerHTML = '';
        pageTags.sort().forEach((tag) => {
          const excluded = exclusions[tag] === true;
          renderTagCheckbox(pageTagsEl, tag, excluded, (t, checked) => {
            saveTagExclusion(t, checked);
          });
        });
      }
    );
  }

  function saveTagExclusion(tag, exclude) {
    chrome.storage.sync.get({ tagExclusions: {} }, (items) => {
      const ex = items.tagExclusions || {};
      ex[tag] = exclude;
      chrome.storage.sync.set({ tagExclusions: ex }, reloadFirstContentTab);
    });
  }

  function reloadFirstContentTab() {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const candidates = tabs.filter(
        (t) =>
          t.url &&
          !t.url.startsWith('chrome://') &&
          !t.url.startsWith('edge://') &&
          !t.url.startsWith('about:') &&
          !t.url.startsWith('chrome-extension://')
      );
      const tab = candidates[0];
      if (tab && tab.id) {
        chrome.tabs.reload(tab.id);
      }
    });
  }

  strengthEl.addEventListener('input', () => {
    const v = parseInt(strengthEl.value, 10);
    strengthValueEl.textContent = v;
    chrome.storage.sync.set({ strength: v }, reloadFirstContentTab);
  });

  enabledEl.addEventListener('change', () => {
    chrome.storage.sync.set({ enabled: enabledEl.checked }, reloadFirstContentTab);
  });

  scanBtn.addEventListener('click', () => {
    scanBtn.disabled = true;
    scanBtn.textContent = 'Scanning...';
    // From the settings (options) page, the active tab is this page itself (chrome-extension://),
    // which we cannot inject into. Instead, find a non-extension tab in the current window.
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      const candidates = tabs.filter(
        (t) =>
          t.url &&
          !t.url.startsWith('chrome://') &&
          !t.url.startsWith('edge://') &&
          !t.url.startsWith('about:') &&
          !t.url.startsWith('chrome-extension://')
      );

      const tab = candidates[0];
      if (!tab || !tab.id) {
        scanBtn.disabled = false;
        scanBtn.textContent = 'Scan current page for tags';
        alert('No regular webpage or file tab found in this window to scan.');
        return;
      }
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: () => {
            const tags = new Set();
            const walk = (el) => {
              if (el.tagName) tags.add(el.tagName.toLowerCase());
              for (let i = 0; i < el.children.length; i++) walk(el.children[i]);
            };
            if (document.body) walk(document.body);
            return Array.from(tags).sort();
          }
        },
        (results) => {
          scanBtn.disabled = false;
          scanBtn.textContent = 'Scan current page for tags';
          if (chrome.runtime.lastError) {
            alert('Could not scan: ' + chrome.runtime.lastError.message);
            return;
          }
          const tags = (results && results[0] && results[0].result) || [];
          chrome.storage.sync.get({ tagExclusions: {} }, (items) => {
            const ex = items.tagExclusions || {};
            const defaultSet = new Set(DEFAULT_EXCLUDED);
            tags.forEach((t) => {
              if (!defaultSet.has(t) && ex[t] === undefined) ex[t] = false;
            });
            chrome.storage.sync.set({ tagExclusions: ex });
            loadSettings();
          });
        }
      );
    });
  });

  loadSettings();
})();
