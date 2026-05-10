(function () {
  'use strict';

  const PROCESSED_ATTR = 'data-rtp-processed';
  const OVERLAY_CLASS = 'rtp-overlay';

  // ── DOM helpers ──────────────────────────────────────────────────────────────

  function findDataWordEl() {
    return document.querySelector('[data-word]');
  }

  /**
   * Walk the sentence container and collect every word token in order.
   * Returns { words, blankIndex, sentenceEl } or null.
   *
   * "words" is an array of plain strings.
   * "blankIndex" is the position (0-based) of the target word inside "words".
   */
  function parseSentence(dataWordEl) {
    // Climb up until we find a container that holds more than just the blank span
    let sentenceEl = dataWordEl.parentElement;
    while (sentenceEl && sentenceEl.children.length < 2) {
      sentenceEl = sentenceEl.parentElement;
    }
    if (!sentenceEl) sentenceEl = dataWordEl.parentElement;

    const words = [];
    let blankIndex = -1;

    function walkNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const tokens = node.textContent.split(/(\s+)/).filter(t => t.trim().length > 0);
        words.push(...tokens);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const dw = node.getAttribute('data-word');
        if (dw !== null) {
          blankIndex = words.length;
          words.push(dw.trim());
        } else {
          for (const child of node.childNodes) walkNode(child);
        }
      }
    }

    for (const child of sentenceEl.childNodes) walkNode(child);

    if (blankIndex === -1) return null;
    return { words, blankIndex, sentenceEl };
  }

  /**
   * Find the text input Lingvist uses for word guessing.
   * Tries several selector strategies.
   */
  function findGuessInput() {
    const candidates = [
      'input[class*="guess"]',
      'input[class*="answer"]',
      'input[class*="card"]',
      'input[class*="word"]',
      'input[type="text"]',
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  // ── Phrase-input overlay ─────────────────────────────────────────────────────

  function removeOverlay() {
    document.querySelectorAll('.' + OVERLAY_CLASS).forEach(el => el.remove());
  }

  function createOverlay(fullPhrase, blankIndex, guessInput) {
    removeOverlay();

    const wrapper = document.createElement('div');
    wrapper.className = OVERLAY_CLASS;

    const hint = document.createElement('p');
    hint.className = 'rtp-hint';
    hint.textContent = 'Type the full phrase and press Enter';
    wrapper.appendChild(hint);

    const phraseInput = document.createElement('input');
    phraseInput.type = 'text';
    phraseInput.className = 'rtp-input';
    phraseInput.autocomplete = 'off';
    phraseInput.spellcheck = false;
    phraseInput.autocorrect = 'off';
    phraseInput.autocapitalize = 'off';
    phraseInput.placeholder = fullPhrase;
    wrapper.appendChild(phraseInput);

    // Insert wrapper right after (or near) the original input
    const anchor = guessInput.closest('[class*="input"]') || guessInput.parentElement;
    anchor.insertAdjacentElement('afterend', wrapper);

    // Hide Lingvist's own input while overlay is active
    guessInput.style.opacity = '0';
    guessInput.style.pointerEvents = 'none';
    guessInput.style.position = 'absolute';

    phraseInput.focus();

    phraseInput.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      e.stopPropagation();

      const typedWords = phraseInput.value.trim().split(/\s+/);
      const typedTargetWord = typedWords[blankIndex] ?? '';

      // Write the extracted word into Lingvist's native input via the React
      // synthetic-event trick so React's onChange fires properly.
      const nativeSet = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set;
      nativeSet.call(guessInput, typedTargetWord);
      guessInput.dispatchEvent(new Event('input', { bubbles: true }));
      guessInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Restore visibility so Lingvist can animate the result
      guessInput.style.opacity = '';
      guessInput.style.pointerEvents = '';
      guessInput.style.position = '';

      // Send Enter to Lingvist's input to trigger submission
      guessInput.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true })
      );
      guessInput.dispatchEvent(
        new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true })
      );
    });

    return phraseInput;
  }

  // ── Sentence reveal ──────────────────────────────────────────────────────────

  /**
   * Make the data-word element show its answer text in plain styling.
   * Lingvist normally shows it as underscores / blank — we override that.
   */
  function revealTargetWord(dataWordEl) {
    const word = dataWordEl.getAttribute('data-word').trim();

    // Replace inner content with a plain text node
    dataWordEl.textContent = word;

    // Mark so CSS can neutralise any remaining special styling
    dataWordEl.classList.add('rtp-revealed');
  }

  // ── Main logic ───────────────────────────────────────────────────────────────

  function tryModify() {
    const dataWordEl = findDataWordEl();
    if (!dataWordEl) return;

    // Already processed this card?
    if (dataWordEl.hasAttribute(PROCESSED_ATTR)) return;
    dataWordEl.setAttribute(PROCESSED_ATTR, '1');

    const parsed = parseSentence(dataWordEl);
    if (!parsed) return;

    const guessInput = findGuessInput();
    if (!guessInput) return;

    const { words, blankIndex } = parsed;
    const fullPhrase = words.join(' ');

    revealTargetWord(dataWordEl);
    createOverlay(fullPhrase, blankIndex, guessInput);
  }

  // ── MutationObserver – handles SPA card transitions ──────────────────────────

  let debounceTimer = null;

  const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(tryModify, 120);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial run (for hard refreshes landing directly on the exercise)
  tryModify();
})();
