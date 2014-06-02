var imgOverride = (function(configModule) {
  var dce = function(tagName) { return document.createElement(tagName); };

  var extensionId = chrome.runtime.id;
  var ImgOverride = function(
      webview,
      form,
      submitButton,
      urlPatternInput,
      resetButton,
      consoleElement,
      opt_cancelResourceTypes) {
    this.urlPattern = null;
    this.webview = webview;
    this.form = form;
    this.submitButton = submitButton;
    this.urlPatternInput = urlPatternInput;
    this.resetButton = resetButton;
    this.consoleElement = consoleElement;
    this.cancelResourceTypes = opt_cancelResourceTypes || [
      'stylesheet',
      'object',
      'xmlhttprequest',
      'other',
      'main_frame',
      'sub_frame',
      'script'
    ];

    this.init();
  };

  ImgOverride.prototype.init = function() {
    (function(io) {
      // Respond to messages triggered by declarative web request API rules
      io.webview.request.onMessage.addListener(function(details) {
        var data = JSON.parse(details.message);
        var msgDiv = dce('div');
        var patternPre = dce('pre');
        var prefixSpan = dce('span');
        var postfixSpan = dce('span');
        prefixSpan.innerText = '"' + data.type + '" matching ';
        patternPre.innerText = '/' + data.urlPattern + '/';
        postfixSpan.innerText = ' ' + data.action;
        msgDiv.appendChild(prefixSpan);
        msgDiv.appendChild(patternPre);
        msgDiv.appendChild(postfixSpan);
        io.consoleElement.appendChild(msgDiv);
        io.consoleElement.scrollTop = io.consoleElement.scrollHeight;

        // Cannot redirect immediately to package-local resources; (see
        // http://crbug.com/379733); use message-send + message-listener instead
        if (data.type == 'main_frame' || data.type == 'sub_frame') {
          io.webview.src = 'blocked.html';
        }
      });

      // Bind to reset button event: load state from config
      io.resetButton.addEventListener('click', function(e) {
          io.removeRules();

          var urlPattern = configModule.urlPattern;
          io.urlPattern = urlPattern;
          io.urlPatternInput.value = urlPattern;

          chrome.storage.local.set({'urlPattern': urlPattern});

          io.refreshRules();
          io.addRules();

          io.consoleElement.innerHtml = '';

          io.webview.src = configModule.homepage;
      });

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

      // Load state from local storage or else config
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

          io.submitButton.removeAttribute('disabled');
          io.urlPatternInput.removeAttribute('disabled');
          io.resetButton.removeAttribute('disabled');

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

    // Construct individual blockers for each cancel-able resource type
    this.rules = (function(io) {
      return io.cancelResourceTypes.map(function(type) {
        return { // Cancel request for blocked resource and send a message
          'id': type + 'Blocker',
          'priority': 1000,
          'conditions': [
            new chrome.webViewRequest.RequestMatcher({
              'url': {'urlMatches': io.urlPattern},
              'resourceType': [type]
            })
          ],
          'actions': [
            new chrome.webViewRequest.CancelRequest(),
            new chrome.webViewRequest.SendMessageToExtension({
              'message': JSON.stringify({
                  'type': type,
                  'action': 'cancelled',
                  'urlPattern': io.urlPattern
              })
            })
          ]
        };
      });
    }(this));

    // Add on special blockers for images
    this.rules.push({ // Redirect image requests to blocked image generator
      'id': 'imageRedirect',
      'priority': 100,
      'conditions': [
        new chrome.webViewRequest.RequestMatcher({
          'url': {'urlMatches': this.urlPattern},
          'resourceType': [
            'image'
          ]
        })
      ],
      'actions': [
        new chrome.webViewRequest.SendMessageToExtension({
          'message': JSON.stringify({
            'type': 'image',
            'action': 'redirected',
            'urlPattern': this.urlPattern
          })
        }),
        new chrome.webViewRequest.RedirectByRegEx({
          'from': '^.*:\/\/([^/]*)[^#?]*\/([^#?]*)([#?].*)?$',
          'to': 'http://dummyimage.com/xga/000/0f0.png&text=BLOCKED:$1/.../$2'
        })
      ]
    },
    { // Prevent redirect loop on image requests to blocked image generator
      'id': 'imageRedirectStop',
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
    });
  };

  return {'ImgOverride': ImgOverride};
}(config));
