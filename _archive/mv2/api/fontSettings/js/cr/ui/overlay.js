// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Provides dialog-like behaviors for the tracing UI.
 */
cr.define('cr.ui.overlay', function() {

  /**
   * Gets the top, visible overlay. It makes the assumption that if multiple
   * overlays are visible, the last in the byte order is topmost.
   * TODO(estade): rely on aria-visibility instead?
   * @return {HTMLElement} The overlay.
   */
  function getTopOverlay() {
    var overlays = document.querySelectorAll('.overlay:not([hidden])');
    return overlays[overlays.length - 1];
  }

  /**
   * Makes initializations which must hook at the document level.
   */
  function globalInitialization() {
    // Close the overlay on escape.
    document.addEventListener('keydown', function(e) {
      if (e.keyCode == 27) {  // Escape
        var overlay = getTopOverlay();
        if (!overlay)
          return;

        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
      }
    });

    window.addEventListener('resize', setMaxHeightAllPages);

    setMaxHeightAllPages();
  }

  /**
   * Sets the max-height of all pages in all overlays, based on the window
   * height.
   */
  function setMaxHeightAllPages() {
    var pages = document.querySelectorAll('.overlay .page');

    var maxHeight = Math.min(0.9 * window.innerHeight, 640) + 'px';
    for (var i = 0; i < pages.length; i++)
      pages[i].style.maxHeight = maxHeight;
  }

  /**
   * Adds behavioral hooks for the given overlay.
   * @param {HTMLElement} overlay The .overlay.
   */
  function setupOverlay(overlay) {
    // Close the overlay on clicking any of the pages' close buttons.
    var closeButtons = overlay.querySelectorAll('.page > .close-button');
    for (var i = 0; i < closeButtons.length; i++) {
      closeButtons[i].addEventListener('click', function(e) {
        cr.dispatchSimpleEvent(overlay, 'cancelOverlay');
      });
    }

    // Remove the 'pulse' animation any time the overlay is hidden or shown.
    overlay.__defineSetter__('hidden', function(value) {
      this.classList.remove('pulse');
      if (value)
        this.setAttribute('hidden', true);
      else
        this.removeAttribute('hidden');
    });
    overlay.__defineGetter__('hidden', function() {
      return this.hasAttribute('hidden');
    });

    // Shake when the user clicks away.
    overlay.addEventListener('click', function(e) {
      // Only pulse if the overlay was the target of the click.
      if (this != e.target)
        return;

      // This may be null while the overlay is closing.
      var overlayPage = this.querySelector('.page:not([hidden])');
      if (overlayPage)
        overlayPage.classList.add('pulse');
    });
    overlay.addEventListener('animationend', function(e) {
      e.target.classList.remove('pulse');
    });
  }

  return {
    globalInitialization: globalInitialization,
    setupOverlay: setupOverlay,
  };
});

document.addEventListener('DOMContentLoaded',
                          cr.ui.overlay.globalInitialization);
