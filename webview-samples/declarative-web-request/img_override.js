var imgOverride = (function(configModule) {
  var extensionId = chrome.runtime.id;
  var ImgOverride = function(
      webview,
      form,
      urlPatternInput) {
    this.urlPattern = null;
    this.webview = webview;
    this.form = form;
    this.urlPatternInput = urlPatternInput;

    this.init();
  };

  ImgOverride.prototype.init = function() {
    (function(io) {
      // Update state and reload when committing to URL
      io.form.addEventListener('submit', function(e) {
        e.preventDefault();

        io.removeRules();

        var urlPattern = io.urlPatternInput.value;
        io.urlPattern = urlPattern;

        chrome.storage.local.set({'urlPattern': urlPattern});

        io.refreshRules();
        io.addRules();

        io.webview.reload();
      });

      console.log('Fetching local storage data');
      chrome.storage.local.get(
        ['urlPattern'],
        function(data) {
          console.log('Local storage data fetched');
          var urlPattern = data.urlPattern ?
              data.urlPattern :
              configModule.urlPattern;
          io.urlPattern = urlPattern;
          io.urlPatternInput.value = urlPattern;
          io.urlPatternInput.removeAttribute('disabled');

          io.refreshRules();
          io.addRules();

          io.webview.src = configModule.homepage;
        });
    }(this));
  };

  ImgOverride.prototype.removeRules = function() {
    var ruleIds = this.rules.map(function(rule) { return rule.id; });
    console.log('Removing rules: ', ruleIds);
    this.webview.request.onRequest.removeRules(
        ruleIds,
        function(details) { console.log('Removed rules; details: ', details); });
  };

  ImgOverride.prototype.addRules = function() {
    console.log('Adding rules');

    this.webview.request.onRequest.addRules(
        this.rules,
        function(details) { console.log('Added rules; details: ', details); });
  };

  ImgOverride.prototype.refreshRules = function() {
    console.log('Refresh rules; url pattern: ', this.urlPattern);
    this.rules = [ // BEGIN: Rules list
      { // Cancel style/xml/object requests to blocked domain
        'id': 'mainBlocker',
        'priority': 1000,
        'conditions': [
          new chrome.webViewRequest.RequestMatcher({
            'url': {'hostContains': this.urlPattern},
            'resourceType': [
              'stylesheet',
              'object',
              'xmlhttprequest',
              'other'
            ]
          })
        ],
        'actions': [
          new chrome.webViewRequest.CancelRequest()
        ]
      },
      { // Redirect main page requests to blocked.html
        'id': 'pageBlocker',
        'priority': 1000,
        'conditions': [
          new chrome.webViewRequest.RequestMatcher({
            'url': {'hostContains': this.urlPattern},
            'resourceType': [
              'main_frame',
              'sub_frame'
            ]
          })
        ],
        'actions': [
          new chrome.webViewRequest.RedirectRequest({
            'redirectUrl': 'chrome-extension://' + extensionId + '/blocked.html'
          })
        ]
      },
      { // Redirect script requests to blocked.js
        'id': 'scriptBlocker',
        'priority': 1000,
        'conditions': [
          new chrome.webViewRequest.RequestMatcher({
            'url': {'hostContains': this.urlPattern},
            'resourceType': [
              'script'
            ]
          })
        ],
        'actions': [
          new chrome.webViewRequest.RedirectRequest({
            'redirectUrl': 'chrome-extension://' + extensionId + '/blocked.js'
          })
        ]
      },
      { // Redirect image requests to blocked image generator
        'id': 'imageBlocker',
        'priority': 100,
        'conditions': [
          new chrome.webViewRequest.RequestMatcher({
            'url': {'hostContains': this.urlPattern},
            'resourceType': [
              'image'
            ]
          })
        ],
        'actions': [
          new chrome.webViewRequest.RedirectByRegEx({
            'from': '^.*:\/\/([^/]*)[^#?]*\/([^#?]*)([#?].*)?$',
            'to': 'http://dummyimage.com/xga/000/0f0.png&text=BLOCKED:$1/.../$2'
          })
        ]
      },
      { // Prevent redirect loop on image requests to blocked image generator
        'id': 'imageRedirect',
        'priority': 1000,
        'conditions': [
          new chrome.webViewRequest.RequestMatcher({
            'url': {'hostSuffix': 'dummyimage.com'}
          })
        ],
        'actions': [
          new chrome.webViewRequest.IgnoreRules({
            'lowerPriorityThan': 1000
          })
        ]
      }
    ]; // END: Rules list
  };

  return {'ImgOverride': ImgOverride};
}(config));
