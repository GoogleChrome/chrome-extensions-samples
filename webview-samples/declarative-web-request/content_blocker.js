var contentBlocker = (function(configModule) {
  var dce = function(tagName) { return document.createElement(tagName); };

  var extensionId = chrome.runtime.id;
  var ContentBlocker = function(
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

  ContentBlocker.prototype.init = function() {
    (function(cb) {
      // Respond to messages triggered by declarative web request API rules
      cb.webview.request.onMessage.addListener(function(details) {
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
        cb.consoleElement.appendChild(msgDiv);
        cb.consoleElement.scrollTop = cb.consoleElement.scrollHeight;

        // Cannot redirect immediately to package-local resources; (see
        // http://crbug.com/379733); use message-send + message-listener instead
        if (data.type == 'main_frame' || data.type == 'sub_frame') {
          cb.webview.src = 'blocked.html';
        }
      });

      // Bind to reset button event: load state from config
      cb.resetButton.addEventListener('click', function(e) {
          cb.removeRules();

          var urlPattern = configModule.urlPattern;
          cb.urlPattern = urlPattern;
          cb.urlPatternInput.value = urlPattern;

          chrome.storage.local.set({'urlPattern': urlPattern});

          cb.refreshRules();
          cb.addRules();

          cb.consoleElement.innerHTML = '';

          cb.webview.src = configModule.homepage;
      });

      // Update state and reload when committing to URL
      cb.form.addEventListener('submit', function(e) {
        e.preventDefault();

        cb.removeRules();

        var urlPattern = cb.urlPatternInput.value;
        cb.urlPattern = urlPattern;

        chrome.storage.local.set({'urlPattern': urlPattern});

        cb.refreshRules();
        cb.addRules();

        cb.webview.reload();
      });

      // Load state from local storage or else config
      chrome.storage.local.get(
        ['urlPattern'],
        function(data) {
          var urlPattern = data.urlPattern ?
              data.urlPattern :
              configModule.urlPattern;
          cb.urlPattern = urlPattern;
          cb.urlPatternInput.value = urlPattern;

          cb.submitButton.removeAttribute('disabled');
          cb.urlPatternInput.removeAttribute('disabled');
          cb.resetButton.removeAttribute('disabled');

          cb.refreshRules();
          cb.addRules();

          cb.webview.src = configModule.homepage;
        });
    }(this));
  };

  ContentBlocker.prototype.removeRules = function() {
    var ruleIds = this.rules.map(function(rule) { return rule.id; });
    this.webview.request.onRequest.removeRules(ruleIds);
  };

  ContentBlocker.prototype.addRules = function() {
    this.webview.request.onRequest.addRules(this.rules);
  };

  ContentBlocker.prototype.refreshRules = function() {
    // Construct individual blockers for each cancel-able resource type
    this.rules = (function(cb) {
      return cb.cancelResourceTypes.map(function(type) {
        return { // Cancel request for blocked resource and send a message
          'id': type + 'Blocker',
          'priority': 1000,
          'conditions': [
            new chrome.webViewRequest.RequestMatcher({
              'url': {'urlMatches': cb.urlPattern},
              'resourceType': [type]
            })
          ],
          'actions': [
            new chrome.webViewRequest.CancelRequest(),
            new chrome.webViewRequest.SendMessageToExtension({
              'message': JSON.stringify({
                  'type': type,
                  'action': 'cancelled',
                  'urlPattern': cb.urlPattern
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

  return {'ContentBlocker': ContentBlocker};
}(config));
