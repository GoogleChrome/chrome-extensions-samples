/* eslint-disable no-undef */
// Ported from MV2 samples. Some coding practices are non-standard in MV3, but the sample remains a robust demonstration of the chrome.fontsettings API.
// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Provides dialog-like behaviors for the tracing UI.
 */
cr.define('cr.ui.overlay', function () {
  /**
   * Gets the top, visible overlay. It makes the assumption that if multiple
   * overlays are visible, the last in the byte order is topmost.
   * TODO(estade): rely on aria-visibility instead?
   * @return {HTMLElement} The overlay.
   */
  function getTopOverlay() {
    let overlays = document.querySelectorAll('.overlay:not([hidden])');
    return overlays[overlays.length - 1];
  }

  /**
   * Makes initializations which must hook at the document level.
   */
  function globalInitialization() {
    // Close the overlay on escape.
    document.addEventListener('keydown', function () {
      // Escape
      let overlay = getTopOverlay();
      if (!overlay) return;

      cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
    });

    window.addEventListener('resize', setMaxHeightAllPages);

    setMaxHeightAllPages();
  }

  /**
   * Sets the max-height of all pages in all overlays, based on the window
   * height.
   */
  function setMaxHeightAllPages() {
    let pages = document.querySelectorAll('.overlay .page');

    let maxHeight = Math.min(0.9 * window.innerHeight, 640) + 'px';
    for (let i = 0; i < pages.length; i++) pages[i].style.maxHeight = maxHeight;
  }

  /**
   * Adds behavioral hooks for the given overlay.
   * @param {HTMLElement} overlay The .overlay.
   */
  function setupOverlay(overlay) {
    // Close the overlay on clicking any of the pages' close buttons.
    let closeButtons = overlay.querySelectorAll('.page > .close-button');
    for (let i = 0; i < closeButtons.length; i++) {
      closeButtons[i].addEventListener('click', function (e) {
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
      });
    }

    // Remove the 'pulse' animation any time the overlay is hidden or shown.
    overlay.__defineSetter__('hidden', function (value) {
      this.classList.remove('pulse');
      if (value) this.setAttribute('hidden', true);
      else this.removeAttribute('hidden');
    });
    overlay.__defineGetter__('hidden', function () {
      return this.hasAttribute('hidden');
    });

    // Shake when the user clicks away.
    overlay.addEventListener('click', function () {
      // This may be null while the overlay is closing.
      let overlayPage = this.querySelector('.page:not([hidden])');
      if (overlayPage) overlayPage.classList.add('pulse');
    });
  }

  return {
    globalInitialization: globalInitialization,
    setupOverlay: setupOverlay
  };
});

document.addEventListener(
  'DOMContentLoaded',
  cr.ui.overlay.globalInitialization
);
