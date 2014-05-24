var css = (function(configModule) {
  var Css = function(urlPattern, filename, webview) {
    this.urlPattern = urlPattern;
    this.filename = filename;
    this.webview = webview;
    this.loadOnStop = false;

    this.init();
  };

  Css.prototype.init = function() {
    this.webview.src = configModule.homepage;
    console.log(configModule.homepage);

    (function(css) {
      css.webview.addEventListener(
          'loadcommit',
          function(e) { return css.doLoadCommit(e); });
      css.webview.addEventListener(
          'loadstop',
          function(e) { return css.doLoadStop(e); });
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
      console.log('Inserting CSS');
      this.webview.insertCSS(
          {'file': this.filename},
          function() {
            console.log('CSS inserted');
          });
      this.loadOnStop = false;
    } else {
      console.log('Load finished without need for CSS');
    }
  };

  return {'Css': Css};
}(config));
