/* global Translator */

/**
 * Alt Text Translation Extension
 * Handles translation of alt text for images with UI state management
 */

class AltTextTranslator {
  constructor() {
    this.initializeElements();
    this.originalText = '';
    this.setupEventListeners();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    this.elements = {
      altTextInput: document.getElementById('altText'),
      loadingIndicator: document.getElementById('loading'),
      languageSelector: document.getElementById('lang'),
      copyCloseButton: document.getElementById('copyClose'),
      discardButton: document.getElementById('discard')
    };
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    this.elements.languageSelector.addEventListener('change', this.handleLanguageChange.bind(this));
    this.elements.copyCloseButton.addEventListener('click', this.handleCopyAndClose.bind(this));
    this.elements.discardButton.addEventListener('click', this.handleDiscard.bind(this));
    chrome.runtime.onMessage.addListener(this.handleChromeMessage.bind(this));
  }

  /**
   * Handle language selection change
   */
  async handleLanguageChange() {
    try {
      this.showLoadingState();
      const translatedText = await this.translateText(this.originalText);
      this.displayAltText(translatedText);
    } catch (error) {
      console.error('Translation failed:', error);
      this.displayAltText(error.message);
    }
  }

  /**
   * Translate text using the Translator API
   * @param {string} text - Text to translate
   * @returns {Promise<string>} Translated text
   */
  async translateText(text) {
    if (!text || this.elements.languageSelector.value === 'en') {
      return text;
    }

    try {
      const translator = await Translator.create({
        sourceLanguage: 'en',
        targetLanguage: this.elements.languageSelector.value
      });
      
      return await translator.translate(text);
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  /**
   * Show loading state in UI
   */
  showLoadingState() {
    this.elements.altTextInput.setAttribute('hidden', true);
    this.elements.loadingIndicator.removeAttribute('hidden');
  }

  /**
   * Display alt text and hide loading state
   * @param {string} text - Text to display
   */
  displayAltText(text) {
    this.elements.altTextInput.value = text;
    this.elements.loadingIndicator.setAttribute('hidden', true);
    this.elements.altTextInput.removeAttribute('hidden');
  }

  /**
   * Handle Chrome extension messages
   * @param {Object} request - Message request object
   */
  async handleChromeMessage(request) {
    if (request.action !== 'alt-text') {
      return;
    }

    try {
      this.originalText = request.text;
      const displayText = await this.translateText(this.originalText);
      this.displayAltText(displayText);
    } catch (error) {
      console.error('Failed to process alt text:', error);
      this.displayAltText(error.message);
    }
  }

  /**
   * Copy text to clipboard and close window
   */
  async handleCopyAndClose() {
    try {
      const altText = this.elements.altTextInput.value;
      
      if (!altText) {
        console.warn('No alt text to copy');
        return;
      }

      await navigator.clipboard.writeText(altText);
      window.close();
    } catch (error) {
      console.error('Failed to copy text to clipboard:', error);
      // Still close the window even if copy fails
      window.close();
    }
  }

  /**
   * Handle discard action
   */
  handleDiscard() {
    window.close();
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new AltTextTranslator();
});
