/**
 * @authors Luke Mahe
 * @authors Eric Bidelman
 * @fileoverview TODO
 */
document.cancelFullScreen = document.webkitCancelFullScreen ||
                            document.mozCancelFullScreen;

/**
 * @constructor
 */
function SlideDeck(el) {
  this.curSlide_ = 0;
  this.prevSlide_ = 0;
  this.config_ = null;
  this.container = el || document.querySelector('slides');
  this.slides = [];
  this.controller = null;

  this.getSavedSlideNumber_((function(slideNumber) {
    this.curSlide_ = slideNumber;
    this.init_();
  }).bind(this));
}

/**
 * @const
 * @private
 */
SlideDeck.prototype.SLIDE_CLASSES_ = [
  'far-past', 'past', 'current', 'next', 'far-next'];

/**
 * @const
 * @private
 */
SlideDeck.prototype.CSS_DIR_ = 'theme/css/';

/**
 * @param {number} slideNo
 */
SlideDeck.prototype.loadSlide = function(slideNo) {
  if (slideNo) {
    this.curSlide_ = slideNo - 1;
    this.updateSlides_();
  }
};

/**
 * @private
 */
SlideDeck.prototype.init_ = function(e) {
  document.body.classList.add('loaded'); // Add loaded class for templates to use.

  this.slides = this.container.querySelectorAll('slide:not([hidden]):not(.backdrop)');

  this.loadConfig_(SLIDE_CONFIG);
  this.addEventListeners_();
  this.updateSlides_();

  // Add slide numbers and total slide count metadata to each slide.
  var that = this;
  for (var i = 0, slide; slide = this.slides[i]; ++i) {
    slide.dataset.slideNum = i + 1;
    slide.dataset.totalSlides = this.slides.length;

    slide.addEventListener('click', function(e) {
      if (document.body.classList.contains('overview')) {
        that.loadSlide(this.dataset.slideNum);
        e.preventDefault();
        window.setTimeout(function() {
          that.toggleOverview();
        }, 500);
      }
    }, false);
  }

  // Note: this needs to come after addEventListeners_(), which adds a
  // 'keydown' listener that this controller relies on.
  this.controller = new SlideController(this);
  if (this.controller.isPopup) {
    document.body.classList.add('popup');
  }
};

/**
 * @private
 */
SlideDeck.prototype.addEventListeners_ = function() {
  document.addEventListener('keydown', this.onBodyKeyDown_.bind(this), false);
};

/**
 * @param {Event} e
 */
SlideDeck.prototype.onBodyKeyDown_ = function(e) {
  if (/^(input|textarea)$/i.test(e.target.nodeName) ||
      e.target.isContentEditable) {
    return;
  }

  // Forward keydowns to the main slides if we're the popup.
  if (this.controller && this.controller.isPopup) {
    this.controller.sendMsg({keyCode: e.keyCode});
  }

  switch (e.keyCode) {
    case 13: // Enter
      if (document.body.classList.contains('overview')) {
        this.toggleOverview();
      }
      break;

    case 39: // right arrow
    case 32: // space
    case 34: // PgDn
      this.nextSlide();
      e.preventDefault();
      break;

    case 37: // left arrow
    case 8: // Backspace
    case 33: // PgUp
      this.prevSlide();
      e.preventDefault();
      break;

    case 40: // down arrow
      this.nextSlide();
      e.preventDefault();
      break;

    case 38: // up arrow
      this.prevSlide();
      e.preventDefault();
      break;

    case 72: // H: Toggle code highlighting
      document.body.classList.toggle('highlight-code');
      break;

    case 79: // O: Toggle overview
      this.toggleOverview();
      break;

    case 80: // P
      if (this.controller && this.controller.isPopup) {
        document.body.classList.toggle('with-notes');
      } else if (this.controller && !this.controller.popup) {
        document.body.classList.toggle('with-notes');
      }
      break;

    case 82: // R
      // TODO: implement refresh on main slides when popup is refreshed.
      break;

    case 27: // ESC: Hide notes and highlighting
      document.body.classList.remove('with-notes');
      document.body.classList.remove('highlight-code');

      if (document.body.classList.contains('overview')) {
        this.toggleOverview();
      }
      break;

    case 70: // F: Toggle fullscreen
       // Only respect 'f' on body. Don't want to capture keys from an <input>.
       // Also, ignore browser's fullscreen shortcut (cmd+shift+f) so we don't
       // get trapped in fullscreen!
      if (e.target == document.body && !(e.shiftKey && e.metaKey)) {
        if (document.mozFullScreen !== undefined && !document.mozFullScreen) {
          document.body.mozRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        } else if (document.webkitIsFullScreen !== undefined && !document.webkitIsFullScreen) {
          document.body.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        } else {
          document.cancelFullScreen();
        }
      }
      break;

    case 87: // W: Toggle widescreen
      // Only respect 'w' on body. Don't want to capture keys from an <input>.
      if (e.target == document.body && !(e.shiftKey && e.metaKey)) {
        this.container.classList.toggle('layout-widescreen');
      }
      break;

    case 77: // M: Minimize
      chrome.app.window.minimize();
      break;
  }
};

/**
 *
 */
SlideDeck.prototype.focusOverview_ = function() {
  var overview = document.body.classList.contains('overview');

  for (var i = 0, slide; slide = this.slides[i]; i++) {
    slide.style.webkitTransform = overview ?
        'translateZ(-2500px) translate(' + (( i - this.curSlide_ ) * 105) +
                                       '%, 0%)' : '';
  }
};

/**
 */
SlideDeck.prototype.toggleOverview = function() {
  document.body.classList.toggle('overview');

  this.focusOverview_();
};

/**
 * @private
 */
SlideDeck.prototype.loadConfig_ = function(config) {
  if (!config) {
    return;
  }

  this.config_ = config;

  var settings = this.config_.settings;

  this.loadTheme_(settings.theme || []);

  if (settings.favIcon) {
    this.addFavIcon_(settings.favIcon);
  }

  if (settings.fonts) {
    this.addFonts_(settings.fonts);
  }

  // Builds. Default to on.
  if (!!!('useBuilds' in settings) || settings.useBuilds) {
    this.makeBuildLists_();
  }

  if (settings.title) {
    document.title = settings.title.replace(/<br\/?>/, ' ') + ' - Google IO 2012';
    document.querySelector('[data-config-title]').innerHTML = settings.title;
  }

  if (settings.subtitle) {
    document.querySelector('[data-config-subtitle]').innerHTML = settings.subtitle;
  }

  if (this.config_.presenters) {
    var presenters = this.config_.presenters;
    var dataConfigContact = document.querySelector('[data-config-contact]');

    var html = [];
    if (presenters.length == 1) {
      var p = presenters[0];

      html = [p.name, p.company].join('<br>');

      var gplus = p.gplus ? '<span>g+</span><a href="' + p.gplus +
          '">' + p.gplus.replace(/https?:\/\//, '') + '</a>' : '';

      var twitter = p.twitter ? '<span>twitter</span>' +
          '<a href="http://twitter.com/' + p.twitter + '">' +
          p.twitter + '</a>' : '';

      var www = p.www ? '<span>www</span><a href="' + p.www +
                        '">' + p.www.replace(/https?:\/\//, '') + '</a>' : '';

      var github = p.github ? '<span>github</span><a href="' + p.github +
          '">' + p.github.replace(/https?:\/\//, '') + '</a>' : '';

      var html2 = [gplus, twitter, www, github].join('<br>');

      if (dataConfigContact) {
        dataConfigContact.innerHTML = html2;
      }
    } else {
      for (var i = 0, p; p = presenters[i]; ++i) {
        html.push(p.name + ' - ' + p.company);
      }
      html = html.join('<br>');
      if (dataConfigContact) {
        dataConfigContact.innerHTML = html;
      }
    }

    var dataConfigPresenter = document.querySelector('[data-config-presenter]');
    if (dataConfigPresenter) {
      document.querySelector('[data-config-presenter]').innerHTML = html;
    }
  }

  /* Left/Right tap areas. Default to including. */
  if (!!!('enableSlideAreas' in settings) || settings.enableSlideAreas) {
    var el = document.createElement('div');
    el.classList.add('slide-area');
    el.id = 'prev-slide-area';
    el.addEventListener('click', this.prevSlide.bind(this), false);
    this.container.appendChild(el);

    var el = document.createElement('div');
    el.classList.add('slide-area');
    el.id = 'next-slide-area';
    el.addEventListener('click', this.nextSlide.bind(this), false);
    this.container.appendChild(el);
  }
};

/**
 * @private
 * @param {Array.<string>} fonts
 */
SlideDeck.prototype.addFonts_ = function(fonts) {
  /* You need to add local fonts manually due to CSP.

  var el = document.createElement('link');
  el.rel = 'stylesheet';
  el.href = ('https:' == document.location.protocol ? 'https' : 'http') +
      '://fonts.googleapis.com/css?family=' + fonts.join('|') + '&v2';
  document.querySelector('head').appendChild(el);
  */
};

/**
 * @private
 */
SlideDeck.prototype.buildNextItem_ = function() {
  var slide = this.slides[this.curSlide_];
  var toBuild = slide.querySelector('.to-build');
  var built = slide.querySelector('.build-current');

  if (built) {
    built.classList.remove('build-current');
    if (built.classList.contains('fade')) {
      built.classList.add('build-fade');
    }
  }

  if (!toBuild) {
    var items = slide.querySelectorAll('.build-fade');
    for (var j = 0, item; item = items[j]; j++) {
      item.classList.remove('build-fade');
    }
    return false;
  }

  toBuild.classList.remove('to-build');
  toBuild.classList.add('build-current');

  return true;
};

SlideDeck.prototype.prevSlide = function() {
  if (this.curSlide_ > 0) {
    var bodyClassList = document.body.classList;
    bodyClassList.remove('highlight-code');

    // Toggle off speaker notes if they're showing when we move backwards on the
    // main slides. If we're the speaker notes popup, leave them up.
    if (this.controller && !this.controller.isPopup) {
      bodyClassList.remove('with-notes');
    } else if (!this.controller) {
      bodyClassList.remove('with-notes');
    }

    this.prevSlide_ = this.curSlide_--;

    this.updateSlides_();
  }
};

SlideDeck.prototype.nextSlide = function() {
  if (!document.body.classList.contains('overview') && this.buildNextItem_()) {
    return;
  }

  if (this.curSlide_ < this.slides.length - 1) {
    var bodyClassList = document.body.classList;
    bodyClassList.remove('highlight-code');

    // Toggle off speaker notes if they're showing when we advanced on the main
    // slides. If we're the speaker notes popup, leave them up.
    if (this.controller && !this.controller.isPopup) {
      bodyClassList.remove('with-notes');
    } else if (!this.controller) {
      bodyClassList.remove('with-notes');
    }

    this.prevSlide_ = this.curSlide_++;

    this.updateSlides_();
  }
};

/* Slide events */

/**
 * Triggered when a slide enter/leave event should be dispatched.
 *
 * @param {string} type The type of event to trigger
 *     (e.g. 'slideenter', 'slideleave').
 * @param {number} slideNo The index of the slide that is being left.
 */
SlideDeck.prototype.triggerSlideEvent = function(type, slideNo) {
  var el = this.getSlideEl_(slideNo);
  if (!el) {
    return;
  }

  // Call onslideenter/onslideleave if the attribute is defined on this slide.
  var func = el.getAttribute(type);
  if (func) {
    new Function(func).call(el); // TODO: Don't use new Function() :(
  }

  // Dispatch event to listeners setup using addEventListener.
  var evt = document.createEvent('Event');
  evt.initEvent(type, true, true);
  evt.slideNumber = slideNo + 1; // Make it readable
  evt.slide = el;

  el.dispatchEvent(evt);
};

/**
 * @private
 */
SlideDeck.prototype.updateSlides_ = function() {
  var curSlide = this.curSlide_;
  for (var i = 0; i < this.slides.length; ++i) {
    switch (i) {
      case curSlide - 2:
        this.updateSlideClass_(i, 'far-past');
        break;
      case curSlide - 1:
        this.updateSlideClass_(i, 'past');
        break;
      case curSlide:
        this.updateSlideClass_(i, 'current');
        break;
      case curSlide + 1:
        this.updateSlideClass_(i, 'next');
        break;
      case curSlide + 2:
        this.updateSlideClass_(i, 'far-next');
        break;
      default:
        this.updateSlideClass_(i);
        break;
    }
  };

  this.triggerSlideEvent('slideleave', this.prevSlide_);
  this.triggerSlideEvent('slideenter', curSlide);

// window.setTimeout(this.disableSlideFrames_.bind(this, curSlide - 2), 301);
//
// this.enableSlideFrames_(curSlide - 1); // Previous slide.
// this.enableSlideFrames_(curSlide + 1); // Current slide.
// this.enableSlideFrames_(curSlide + 2); // Next slide.

   // Enable current slide's iframes (needed for page loat at current slide).
   this.enableSlideFrames_(curSlide + 1);

   // No way to tell when all slide transitions + auto builds are done.
   // Give ourselves a good buffer to preload the next slide's iframes.
   window.setTimeout(this.enableSlideFrames_.bind(this, curSlide + 2), 1000);

  this.saveSlideNumber_();

  if (document.body.classList.contains('overview')) {
    this.focusOverview_();
    return;
  }

};

/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.enableSlideFrames_ = function(slideNo) {
  var el = this.slides[slideNo - 1];
  if (!el) {
    return;
  }

  var frames = el.querySelectorAll('iframe');
  for (var i = 0, frame; frame = frames[i]; i++) {
    this.enableFrame_(frame);
  }
};

/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.enableFrame_ = function(frame) {
  var src = frame.dataset.src;
  if (src && frame.src != src) {
    frame.src = src;
  }
};

/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.disableSlideFrames_ = function(slideNo) {
  var el = this.slides[slideNo - 1];
  if (!el) {
    return;
  }

  var frames = el.querySelectorAll('iframe');
  for (var i = 0, frame; frame = frames[i]; i++) {
    this.disableFrame_(frame);
  }
};

/**
 * @private
 * @param {Node} frame
 */
SlideDeck.prototype.disableFrame_ = function(frame) {
  frame.src = 'about:blank';
};

/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.getSlideEl_ = function(no) {
  if ((no < 0) || (no >= this.slides.length)) {
    return null;
  } else {
    return this.slides[no];
  }
};

/**
 * @private
 * @param {number} slideNo
 * @param {string} className
 */
SlideDeck.prototype.updateSlideClass_ = function(slideNo, className) {
  var el = this.getSlideEl_(slideNo);

  if (!el) {
    return;
  }

  if (className) {
    el.classList.add(className);
  }

  for (var i = 0, slideClass; slideClass = this.SLIDE_CLASSES_[i]; ++i) {
    if (className != slideClass) {
      el.classList.remove(slideClass);
    }
  }
};

/**
 * @private
 */
SlideDeck.prototype.makeBuildLists_ = function () {
  for (var i = this.curSlide_, slide; slide = this.slides[i]; ++i) {
    var items = slide.querySelectorAll('.build > *');
    for (var j = 0, item; item = items[j]; ++j) {
      if (item.classList) {
        item.classList.add('to-build');
        if (item.parentNode.classList.contains('fade')) {
          item.classList.add('fade');
        }
      }
    }
  }
};

/**
 * Saves the current slide into persistent storage.
 *
 * @private
 */
SlideDeck.prototype.saveSlideNumber_ = function() {
  this.setStoredValue_(StorageKey.SLIDE_NUMBER, this.curSlide_);
};

/**
 * Gets the current slide from persistent storage.
 *
 * @private
 */SlideDeck.prototype.getSavedSlideNumber_ = function(callback) {
  this.getStoredValue_(StorageKey.SLIDE_NUMBER, function(slideNumber) {
    callback(slideNumber || 0);
  });
};

/**
 * Persistent storage keys.
 *
 * @enum{string}
 */
var StorageKey = {
  SLIDE_NUMBER: 'slide-number'
};

/**
 * Saves data into persistent storage.
 *
 * @param {string} key
 * @param {*} value
 * @param {Function} opt_callback
 * @private
 */
SlideDeck.prototype.setStoredValue_ = function(key, value, opt_callback) {
  var data = {};
  data[key] = value;
  if (chrome.storage) {
    chrome.storage.local.set(data, opt_callback);
  } else {
    // We're running in a web page, not an app.
    if (opt_callback) {
      opt_callback();
    }
  }
};

/**
 * Gets data from persistent storage.
 *
 * @param {string} key
 * @param {Function.<*>} opt_callback
 * @private
 */
SlideDeck.prototype.getStoredValue_ = function(key, callback) {
  if (chrome.storage) {
    chrome.storage.local.get(key, function(data) {
      callback(data[key]);
    });
  } else {
    // We're running in a web page, not an app.
    callback("1");
  }
};

/**
 * @private
 * @param {string} favIcon
 */
SlideDeck.prototype.addFavIcon_ = function(favIcon) {
  var el = document.createElement('link');
  el.rel = 'icon';
  el.type = 'image/png';
  el.href = favIcon;
  document.querySelector('head').appendChild(el);
};

/**
 * @private
 * @param {string} theme
 */
SlideDeck.prototype.loadTheme_ = function(theme) {
  var styles = [];
  if (theme.constructor.name === 'String') {
    styles.push(theme);
  } else {
    styles = theme;
  }

  for (var i = 0, style; themeUrl = styles[i]; i++) {
    var style = document.createElement('link');
    style.rel = 'stylesheet';
    style.type = 'text/css';
    if (themeUrl.indexOf('http') == -1) {
      style.href = this.CSS_DIR_ + themeUrl + '.css';
    } else {
      style.href = themeUrl;
    }
    document.querySelector('head').appendChild(style);
  }
};

var slidedeck = new SlideDeck();
