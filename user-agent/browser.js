(function(config, bindings) {
  var currentUrl = '';        // URL where all webviews should be
  var lastNavigator = null;   // Webview that last performed navigation
  var contentOverlay = null;  // Div element overlay of all content
  var locationInput = null;   // Input element for address bar
  var findBox = null;         // Div element for find-on-page widget
  var webViewContainers = []; // Div elements wrapping webviews
  var webViews = [];          // Webview elements
  var sadWebViews = [];       // Div elements displaying "sad" (simulated crash) webviews
  var findResultsLists = [];  // Span elements where find-on-page results reside

  // Always re-layout on resize
  window.addEventListener('resize', function(e) {
    doLayout();
  });

  // Boostrap code
  window.addEventListener('load', function(e) {
    contentOverlay = getContentOverlay();
    locationInput = getLocationInput();
    findBox = getFindBox();
    webViewContainers = getWebViewContainers();
    webViews = getWebViews();
    sadWebViews = getSadWebViews();
    findResultsLists = getFindResultsLists();
    lastNavigator = webViews[0];

    doLayout();

    document.querySelector('#back').addEventListener('click', function(e) {
      stopNavigation();
      lastNavigator.back();
    });

    document.querySelector('#forward').addEventListener('click', function() {
      stopNavigation();
      lastNavigator.forward();
    });

    document.querySelector('#home').addEventListener('click', function() {
      navigateTo(config.homepage, null);
    });

    document.querySelector('#reload').addEventListener('click', function() {
      if (anyLoading()) {
        stopNavigation();
      } else {
        webViews.forEach(function(wv) { wv.reload(); });
      }
    });
    document.querySelector('#reload').addEventListener(
        'webkitAnimationIteration',
        function() {
          // Between animation iterations: If loading is done, then stop spinning
          if (!anyLoading()) {
            document.body.classList.remove('loading');
          }
        });

    document.querySelector('#terminate').addEventListener('click', function() {
      stopNavigation();
      webViews.forEach(function(wv) { wv.terminate(); });
    });

    document.querySelector('#location-form').addEventListener('submit', function(e) {
      e.preventDefault();
      navigateTo(locationInput.value, null);
    });

    webViews.forEach(function(wv) {
      wv.addEventListener('exit', handleExit);
      wv.addEventListener('loadstart', handleLoadStart);
      wv.addEventListener('loadstop', handleLoadStop);
      wv.addEventListener('loadabort', handleLoadAbort);
      wv.addEventListener('loadredirect', handleLoadRedirect);
      wv.addEventListener('loadcommit', handleLoadCommit);
    });

    // Test for the presence of the experimental <webview> zoom and find APIs.
    if (typeof(webViews[0].setZoom) == 'function' &&
        typeof(webViews[0].find) == 'function') {
      var findMatchCase = false;

      document.querySelector('#zoom').addEventListener('click', function() {
        if(document.querySelector('#zoom-box').style.display == '-webkit-flex') {
          closeZoomBox();
        } else {
          openZoomBox();
        }
      });

      document.querySelector('#zoom-form').addEventListener('submit', function(e) {
        e.preventDefault();
        var zoomText = document.forms['zoom-form']['zoom-text'];
        var zoomFactor = Number(zoomText.value);
        if (zoomFactor > 5) {
          zoomText.value = '5';
          zoomFactor = 5;
        } else if (zoomFactor < 0.25) {
          zoomText.value = '0.25';
          zoomFactor = 0.25;
        }
        webViews.forEach(function(wv) { wv.setZoom(zoomFactor); });
      });

      document.querySelector('#zoom-in').addEventListener('click', function(e) {
        e.preventDefault();
        increaseZoom();
      });

      document.querySelector('#zoom-out').addEventListener('click', function(e) {
        e.preventDefault();
        decreaseZoom();
      });

      document.querySelector('#find').addEventListener('click', function() {
        if(findBox.style.display == 'block') {
          closeFindBox();
        } else {
          openFindBox();
        }
      });

      document.querySelector('#find-text').addEventListener('input', function(e) {
        webViews.forEach(function(wv) {
          wv.find(document.forms['find-form']['find-text'].value,
                  {matchCase: findMatchCase});
        });
      });

      document.querySelector('#find-text').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.keyCode == 13) {
          e.preventDefault();
          webViews.forEach(function(wv) { wv.stopFinding('activate'); });
          closeFindBox();
        }
      });

      document.querySelector('#match-case').addEventListener('click', function(e) {
        e.preventDefault();
        findMatchCase = !findMatchCase;
        var matchCase = document.querySelector('#match-case');
        if (findMatchCase) {
          matchCase.style.color = 'blue';
          matchCase.style['font-weight'] = 'bold';
        } else {
          matchCase.style.color = 'black';
          matchCase.style['font-weight'] = '';
        }
        webViews.forEach(function(wv) {
          wv.find(document.forms['find-form']['find-text'].value,
                  {matchCase: findMatchCase});
        });
      });

      document.querySelector('#find-backward').addEventListener('click', function(e) {
        e.preventDefault();
        webViews.forEach(function(wv) {
          wv.find(document.forms['find-form']['find-text'].value,
                  {backward: true, matchCase: findMatchCase});
        });
      });

      document.querySelector('#find-form').addEventListener('submit', function(e) {
        e.preventDefault();
        webViews.forEach(function(wv) { wv.find(document.forms['find-form']['find-text'].value,
                                                {matchCase: findMatchCase});
                                      });
      });

      webViews.forEach(function(wv) { wv.addEventListener('findupdate', handleFindUpdate); });
      window.addEventListener('keydown', handleKeyDown);
    } else {
      var zoom = document.querySelector('#zoom');
      var find = document.querySelector('#find');
      zoom.style.visibility = 'hidden';
      zoom.style.position = 'absolute';
      find.style.visibility = 'hidden';
      find.style.position = 'absolute';
    }

    navigateTo(config.homepage, null);
  });

  function toArray(arrayLikeObject) {
    return Array.prototype.slice.call(arrayLikeObject, 0);
  }

  function getContentOverlay() {
    return document.querySelector('#content-overlay');
  }

  function getLocationInput() {
    return document.querySelector('#location');
  }

  function getFindBox() {
    return document.querySelector('#find-box');
  }

  function getWebViews() {
    return toArray(document.querySelectorAll('webview'));
  }

  function getSadWebViews() {
    return toArray(document.querySelectorAll('.sad-webview'));
  }

  function getWebViewContainers() {
    return toArray(document.querySelectorAll('.webview-container'));
  }

  function getWebViewContainer(webView) {
    var name = webView.getAttribute('data-name');
    return document.querySelector(
        '.webview-container[data-name="' + name + '"]');
  }

  function getFindResultsLists() {
    return toArray(document.querySelectorAll('.results'));
  }

  function isLoading(container) {
    return !!container.getAttribute('data-loading');
  }

  function setLoading(container) {
    // Overlays block content when any webview is loading
    document.body.classList.add('loading');
    return container.setAttribute('data-loading', 't');
  }

  function setLoadingAll() {
    // Overlays block content when any webview is loading
    document.body.classList.add('loading');
    webViewContainers.forEach(function(wvc) {
      wvc.setAttribute('data-loading', 't');
    });
  }

  function clearLoading(container) {
    return container.setAttribute('data-loading', '');
  }

  function anyLoading() {
    return webViewContainers.some(function(wvc) {
      return isLoading(wvc);
    });
  }

  function stopNavigation() {
    webViews.forEach(function(wv) {
      if (isLoading(getWebViewContainer(wv))) {
        wv.stop();
      }
    });
  }

  function navigateTo(url, initiatorWebView) {
    // !initiatorWebView => navigate all webviews
    if (initiatorWebView) {
      setLoading(getWebViewContainer(initiatorWebView));
    } else {
      setLoadingAll();
    }

    // Only update each webview src if the URL is changing
    if (url != currentUrl) {
      currentUrl = url;

      resetExitedState();
      stopNavigation();
      locationInput.value = url;

      webViews.forEach(function(wv) {
        if (wv.src != url) {
          wv.src = url;
        }
      });

      if (initiatorWebView) {
        lastNavigator = initiatorWebView;
        document.querySelector('#back').disabled = !initiatorWebView.canGoBack();
        document.querySelector('#forward').disabled = !initiatorWebView.canGoForward();
      } else {
        var someWebView = webViews[0];
        document.querySelector('#back').disabled = !someWebView.canGoBack();
        document.querySelector('#forward').disabled = !someWebView.canGoForward();
      }
    }
  }

  function doLayout() {
    var controls = document.querySelector('#controls');
    var controlsHeight = controls.offsetHeight;
    var windowWidth = document.documentElement.clientWidth;
    var windowHeight = document.documentElement.clientHeight;
    var contentWidth = windowWidth;
    var contentHeight = windowHeight - controlsHeight;

    // Layout main overlay first
    contentOverlay.style.width = contentWidth + 'px';
    contentOverlay.style.height = contentHeight + 'px';

    // Layout all webview container
    webViewContainers.forEach(function(container) {
      var name = container.getAttribute('data-name');
      var webView = document.querySelector('webview[data-name="' + name + '"]');
      var sadWebView = document.querySelector('.sad-webview[data-name="' + name + '"]');
      var webViewOverlay = document.querySelector('.webview-overlay[data-name="' + name + '"]');
      var widthFactor = container.getAttribute('data-width');
      var heightFactor = container.getAttribute('data-height');
      var width = Math.floor(widthFactor * contentWidth);
      var height = Math.floor(heightFactor * contentHeight);

      webViewOverlay.style.width = width + 'px';
      webView.style.width = width + 'px';
      sadWebView.style.width = width + 'px';
      container.style.width = width + 'px';

      webViewOverlay.style.height = height + 'px';
      webView.style.height = height + 'px';
      sadWebView.style.height = height + 'px';
      container.style.height = height + 'px';
    });
  }

  function handleExit(event) {
    document.body.classList.add('exited');
    if (event.type == 'abnormal') {
      document.body.classList.add('crashed');
    } else if (event.type == 'killed') {
      document.body.classList.add('killed');
    }
    webViews.forEach(function(wv) { wv.style.height = '0px'; });
    doLayout();
  }

  function resetExitedState() {
    document.body.classList.remove('exited');
    document.body.classList.remove('crashed');
    document.body.classList.remove('killed');
    doLayout();
  }

  function handleFindUpdate(event) {
    var sourceName = event.srcElement.getAttribute('data-name');
    var findResults = document.querySelector(
        '.results[data-name=' + sourceName + ']');
    if (event.searchText == '') {
      findResults.innerText = '';
    } else {
      findResults.innerText =
          event.activeMatchOrdinal + ' of ' + event.numberOfMatches;
    }

    // Ensure that the find box does not obscure the active match.
    if (event.finalUpdate && !event.canceled) {
      findBox.style.left = '';
      findBox.style.opacity = '';
      var findBoxRect = findBox.getBoundingClientRect();
      if (findBoxObscuresActiveMatch(findBoxRect, event.selectionRect)) {
        // Move the find box out of the way if there is room on the screen, or
        // make it semi-transparent otherwise.
        var potentialLeft = event.selectionRect.left - findBoxRect.width - 10;
        if (potentialLeft >= 5) {
          findBox.style.left = potentialLeft + 'px';
        } else {
          findBox.style.opacity = '0.5';
        }
      }
    }
  }

  function findBoxObscuresActiveMatch(findBoxRect, matchRect) {
    return findBoxRect.left < matchRect.left + matchRect.width &&
        findBoxRect.right > matchRect.left &&
        findBoxRect.top < matchRect.top + matchRect.height &&
        findBoxRect.bottom > matchRect.top;
  }

  function handleKeyDown(event) {
    switch (event.keyCode) {
      // Esc
      case 27:
      event.preventDefault();
      closeBoxes();
      break;
    }
    if (event.ctrlKey) {
      switch (event.keyCode) {
        // Ctrl+F.
        case 70:
        event.preventDefault();
        openFindBox();
        break;

        // Ctrl++.
        case 107:
        case 187:
        event.preventDefault();
        increaseZoom();
        break;

        // Ctrl+-.
        case 109:
        case 189:
        event.preventDefault();
        decreaseZoom();
        break;
      }
    }
  }

  function handleLoadCommit(event) {
    resetExitedState();
    if (!event.isTopLevel) {
      return;
    }

    navigateTo(event.url, event.srcElement);
    closeBoxes();
  }

  function handleLoadStart(event) {
    resetExitedState();
  }

  function handleLoadStop(event) {
    clearLoading(getWebViewContainer(event.srcElement));
  }

  function handleLoadAbort(event) {
    // We sometimes get loadabort events triggered when updating multiple
    // webviews on the same navigation pipeline
    event.preventDefault();
  }

  function handleLoadRedirect(event) {
    resetExitedState();
    if (!event.isTopLevel) {
      return;
    }

    navigateTo(event.newUrl, event.srcElement);
  }

  function getNextPresetZoom(zoomFactor) {
    var preset = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2,
                  2.5, 3, 4, 5];
    var low = 0;
    var high = preset.length - 1;
    var mid;
    while (high - low > 1) {
      mid = Math.floor((high + low)/2);
      if (preset[mid] < zoomFactor) {
        low = mid;
      } else if (preset[mid] > zoomFactor) {
        high = mid;
      } else {
        return {low: preset[mid - 1], high: preset[mid + 1]};
      }
    }
    return {low: preset[low], high: preset[high]};
  }

  // Abstraction for changing zoom; direction, one of "high" or "low", indexes
  // into a next-preset-zoom object
  function changeZoom(direction) {
    var someWebView = webViews[0];
    someWebView.getZoom(function(zoomFactor) {
      var nextZoom = getNextPresetZoom(zoomFactor)[direction];
      webViews.forEach(function(wv) { wv.setZoom(nextZoom); });
      document.forms['zoom-form']['zoom-text'].value = nextZoom.toString();
    });
  }

  function increaseZoom() {
    changeZoom('high');
  }

  function decreaseZoom() {
    changeZoom('low');
  }

  function openZoomBox() {
    document.querySelector('webview').getZoom(function(zoomFactor) {
      var zoomText = document.forms['zoom-form']['zoom-text'];
      zoomText.value = Number(zoomFactor.toFixed(6)).toString();
      document.querySelector('#zoom-box').style.display = '-webkit-flex';
      zoomText.select();
    });
  }

  function closeZoomBox() {
    document.querySelector('#zoom-box').style.display = 'none';
  }

  function openFindBox() {
    findBox.style.display = 'block';
    document.forms['find-form']['find-text'].select();
  }

  function closeFindBox() {
    findBox.style.display = 'none';
    findBox.style.left = '';
    findBox.style.opacity = '';
    findResultsLists.forEach(function(rl) { rl.innerText = ''; });
    webViews.forEach(function(wv) { wv.stopFinding(); });
  }

  function closeBoxes() {
    closeZoomBox();
    closeFindBox();
  }
})(config, bindings);
