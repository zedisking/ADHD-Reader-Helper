/**
 * ADHD Reading Helper Content Script
 * Applies bionic reading to text nodes, respecting tag exclusions from settings
 */
(function () {
  'use strict';

  const DEFAULT_EXCLUDED = ['html', 'header', 'footer', 'button', 'input', 'textarea', 'select'];
  const DATA_ATTR = 'data-bionic-reader-processed';

  let currentStrength = 3;
  let tagExclusions = {}; // tagName -> true (exclude) | false (include)
  let enabled = true;
  let observer = null;

  function getDefaultExclusions() {
    const o = {};
    DEFAULT_EXCLUDED.forEach((t) => (o[t.toLowerCase()] = true));
    return o;
  }

  function loadSettings() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(
          {
            strength: 3,
            enabled: true,
            tagExclusions: getDefaultExclusions()
          },
          (items) => {
            currentStrength = Math.max(1, Math.min(5, items.strength || 3));
            enabled = items.enabled !== false;
            tagExclusions = { ...getDefaultExclusions(), ...(items.tagExclusions || {}) };
            resolve();
          }
        );
      } else {
        resolve();
      }
    });
  }

  function isTagExcluded(tagName) {
    const tag = (tagName || '').toLowerCase();
    return tagExclusions[tag] === true;
  }

  function shouldProcessElement(el) {
    if (!el || !el.tagName) return false;
    return !isTagExcluded(el.tagName);
  }

  function getTextNodes(root) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          let parent = node.parentElement;
          while (parent) {
            if (!shouldProcessElement(parent)) return NodeFilter.FILTER_REJECT;
            if (parent === root) break;
            parent = parent.parentElement;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  function processPage() {
    if (!enabled || typeof BIONIC_READER === 'undefined') return;
    if (!document.body) return;

    const textNodes = getTextNodes(document.body);
    textNodes.forEach((node) => {
      if (node.parentElement && node.parentElement.hasAttribute(DATA_ATTR)) return;
      BIONIC_READER.processTextNode(node, currentStrength);
    });
  }

  function init() {
    loadSettings().then(() => {
      if (!enabled) return;
      processPage();

      observer = new MutationObserver((mutations) => {
        if (!enabled) return;
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute(DATA_ATTR)) {
              const textNodes = getTextNodes(node);
              textNodes.forEach((n) => BIONIC_READER.processTextNode(n, currentStrength));
            }
          });
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes.strength) currentStrength = Math.max(1, Math.min(5, changes.strength.newValue || 3));
    if (changes.enabled) enabled = changes.enabled.newValue !== false;
    if (changes.tagExclusions) tagExclusions = { ...getDefaultExclusions(), ...(changes.tagExclusions.newValue || {}) };
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
