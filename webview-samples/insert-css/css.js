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
    // Load "homepage" and fill out url pattern
    this.webview.src = configModule.homepage;
    console.log('Homepage: ', configModule.homepage);
    this.urlPatternInput.value = this.urlPattern.source;
    this.urlPatternInput.removeAttribute('disabled');

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
        css.urlPattern = new RegExp(css.urlPatternInput.value);
        css.cssString = css.cssInput.value;
        css.webview.reload();
      });

      // Fetch initial CSS file and place it in textarea
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
