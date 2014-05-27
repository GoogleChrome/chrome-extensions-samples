var css = (function(configModule) {
  var Css = function(
      urlPattern,       // URL matching regular expression
      filename,         // Name of file from which initial CSS should be loaded
      webview,          // Webview DOM node
      form,             // Form DOM node
      urlPatternInput,  // Input node for URL matching regular expression
      cssInput) {       // Input (textarea) node for CSS
    this.urlPattern = urlPattern;
    this.filename = filename;
    this.webview = webview;
    this.form = form;
    this.urlPatternInput = urlPatternInput;
    this.cssInput = cssInput;
    this.loadOnStop = false;
    this.cssString = '';

    this.init();
  };

  Css.prototype.init = function() {
    // Load "homepage"
    this.webview.src = configModule.homepage;
    console.log('Homepage: ', configModule.homepage);

    (function(css) {
      // Hook up CSS injection for each page load
      css.webview.addEventListener(
          'loadcommit',
          function(e) { return css.doLoadCommit(e); });
      css.webview.addEventListener(
          'loadstop',
          function(e) { return css.doLoadStop(e); });
      // Update state and reload when committing to new URL pattern and CSS
      css.form.addEventListener('submit', function(e) {
        e.preventDefault();

        var urlPattern = css.urlPatternInput.value;
        var cssString = css.cssInput.value;

        css.urlPattern = new RegExp(urlPattern);
        css.cssString = cssString;

        chrome.storage.local.set({
          'urlPattern': urlPattern,
          'cssString': cssString
        }, function() { console.log('URL pattern and CSS saved to local storage'); });

        css.webview.reload();
      });

      chrome.storage.local.get(
        ['urlPattern', 'cssString'],
        function(data) {

          if (data.cssString) {
            // Prepare css string from local storage
            console.log('Loading css from local storage');
            css.cssString = data.cssString;
            css.cssInput.value = data.cssString;
            css.cssInput.removeAttribute('disabled');
          } else {
            // Fetch initial CSS file
            (function(xhr) {
              xhr.addEventListener('readystatechange', function(e) {
                if (xhr.readyState == 4) {
                  console.log('Loading css from xhr');
                  css.cssInput.value = xhr.responseText;
                  css.cssInput.removeAttribute('disabled');
                } else {
                  console.log('xhr ready state change', xhr.readyState);
                }
              });
              xhr.open('GET', 'inject.css', true);
              xhr.send();
            }(new XMLHttpRequest()));
          }

          if (data.urlPattern) {
            // Prepare URL pattern from local storage
            console.log('Loading url pattern from local storage');
            css.urlPattern = new RegExp(data.urlPattern);
            css.urlPatternInput.value = data.urlPattern;
          } else {
            // Use default pattern (injected into Css object already)
            console.log('Loading url pattern from config');
            css.urlPatternInput.value = css.urlPattern.source;
          }
          css.urlPatternInput.removeAttribute('disabled');

        });
    }(this));
  };

  Css.prototype.doLoadCommit = function(e) {
    if (e.url.match(this.urlPattern) !== null) {
      console.log('Loading page for CSS insertion');
      this.loadOnStop = true;
    } else {
      console.log('URL: ', e.url, ' does not match', this.urlPattern);
    }
  };

  Css.prototype.doLoadStop = function(e) {
    if (this.loadOnStop) {
      this.injectCss();
      this.loadOnStop = false;
    } else {
      console.log('Load finished without need for CSS');
    }
  };

  Css.prototype.injectCss = function() {
    if (this.cssString) {
      console.log('Inserting CSS from string');
      this.webview.insertCSS(
        {'code': this.cssString},
        function() {
          console.log('CSS inserted');
        });
    } else {
      // On initial load, cssString may not be ready yet;
      // use the initial file instead
      console.log('Inserting CSS from file');
      this.webview.insertCSS(
        {'file': this.filename},
        function() {
          console.log('CSS inserted');
        });
    }
  };

  return {'Css': Css};
}(config));
