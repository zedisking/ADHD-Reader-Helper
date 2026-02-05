/**
 * Bionic Reading Core - Converts text to bionic format by bolding word fixations
 * Strength scale: 1 (subtle) to 5 (strong) - controls how much of each word is bolded
 */
(function (global) {
  'use strict';

  const BIONIC_READER = {
    /**
     * Convert a word to bionic format
     * @param {string} word - The word to convert
     * @param {number} strength - 1-5, controls bold portion (1=~25%, 5=~60%)
     * @returns {string} HTML string with bolded fixation
     */
    wordToBionic: function (word, strength) {
      if (!word || word.length === 0) return word;

      const s = Math.max(1, Math.min(5, strength || 3));
      // Strength 1: ~25%, 2: ~35%, 3: ~45%, 4: ~52%, 5: ~60%
      const ratio = 0.2 + (s * 0.1);
      const boldLength = Math.max(1, Math.ceil(word.length * ratio));

      const boldPart = word.substring(0, boldLength);
      const rest = word.substring(boldLength);

      if (rest.length === 0) return word;
      return '<b>' + this.escapeHtml(boldPart) + '</b>' + this.escapeHtml(rest);
    },

    escapeHtml: function (text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    /**
     * Convert text node content to bionic format, preserving structure
     * @param {string} text - Raw text
     * @param {number} strength - 1-5
     * @returns {string} HTML with bionic formatting
     */
    textToBionic: function (text, strength) {
      if (!text || typeof text !== 'string') return '';

      const s = Math.max(1, Math.min(5, strength || 3));
      const wordRegex = /(\S+)/g;
      return text.replace(wordRegex, (match) => this.wordToBionic(match, s));
    },

    /**
     * Process a text node and replace with bionic-formatted HTML
     * @param {Text} textNode - DOM text node
     * @param {number} strength - 1-5
     */
    processTextNode: function (textNode, strength) {
      const text = textNode.textContent;
      if (!text.trim()) return;

      const html = this.textToBionic(text, strength);
      const span = document.createElement('span');
      span.innerHTML = html;
      span.classList.add('bionic-reader-processed');
      span.setAttribute('data-bionic-reader-processed', '');
      textNode.parentNode.replaceChild(span, textNode);
    }
  };

  global.BIONIC_READER = BIONIC_READER;
})(typeof window !== 'undefined' ? window : self);
