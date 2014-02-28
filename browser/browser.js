window.onresize = doLayout;
var isLoading = false;

onload = function() {
  var webview = document.querySelector('webview');
  var findMatchCase = false;
  doLayout();

  document.querySelector('#back').onclick = function() {
    webview.back();
  };

  document.querySelector('#forward').onclick = function() {
    webview.forward();
  };

  document.querySelector('#home').onclick = function() {
    navigateTo('http://www.google.com/');
  };

  document.querySelector('#reload').onclick = function() {
    if (isLoading) {
      webview.stop();
    } else {
      webview.reload();
    }
  };
  document.querySelector('#reload').addEventListener(
    'webkitAnimationIteration',
    function() {
      if (!isLoading) {
        document.body.classList.remove('loading');
      }
    });

  document.querySelector('#terminate').onclick = function() {
    webview.terminate();
  };

  document.querySelector('#zoom').onclick = function() {
    if(document.querySelector('#zoom-box').style.display == '-webkit-flex') {
      closeZoomBox();
    } else {
      openZoomBox();
    }
  };

  document.querySelector('#zoom-form').onsubmit = function(e) {
    e.preventDefault();
    webview.setZoom(Number(document.forms['zoom-form']['zoom-text'].value));
  }

  document.querySelector('#find').onclick = function() {
    if(document.querySelector('#find-box').style.display == '-webkit-flex') {
      closeFindBox();
    } else {
      openFindBox();
    }
  };

  document.querySelector('#find-text').oninput = function(e) {
    webview.find(document.forms['find-form']['find-text'].value,
                 {matchCase: findMatchCase});
  }

  document.querySelector('#match-case').onclick = function(e) {
    e.preventDefault();
    findMatchCase = !findMatchCase;
    var matchCase = document.querySelector('#match-case');
    if (findMatchCase) {
      matchCase.style.color = "blue";
      matchCase.style['font-weight'] = "bold";
    } else {
      matchCase.style.color = "black";
      matchCase.style['font-weight'] = "";
    }

    webview.find(document.forms['find-form']['find-text'].value,
                 {matchCase: findMatchCase});
  }

  document.querySelector('#find-backward').onclick = function(e) {
    e.preventDefault();
    webview.find(document.forms['find-form']['find-text'].value,
                 {backward: true, matchCase: findMatchCase});
  }

  document.querySelector('#find-form').onsubmit = function(e) {
    e.preventDefault();
    webview.find(document.forms['find-form']['find-text'].value,
                 {matchCase: findMatchCase});
  }

  document.querySelector('#location-form').onsubmit = function(e) {
    e.preventDefault();
    navigateTo(document.querySelector('#location').value);
  };

  webview.addEventListener('exit', handleExit);
  webview.addEventListener('findupdate', handleFindUpdate);
  webview.addEventListener('loadstart', handleLoadStart);
  webview.addEventListener('loadstop', handleLoadStop);
  webview.addEventListener('loadabort', handleLoadAbort);
  webview.addEventListener('loadredirect', handleLoadRedirect);
  webview.addEventListener('loadcommit', handleLoadCommit);
};

function navigateTo(url) {
  resetExitedState();
  document.querySelector('webview').src = url;
}

function doLayout() {
  var webview = document.querySelector('webview');
  var controls = document.querySelector('#controls');
  var controlsHeight = controls.offsetHeight;
  var windowWidth = document.documentElement.clientWidth;
  var windowHeight = document.documentElement.clientHeight;
  var webviewWidth = windowWidth;
  var webviewHeight = windowHeight - controlsHeight;

  webview.style.width = webviewWidth + 'px';
  webview.style.height = webviewHeight + 'px';

  var sadWebview = document.querySelector('#sad-webview');
  sadWebview.style.width = webviewWidth + 'px';
  sadWebview.style.height = webviewHeight * 2/3 + 'px';
  sadWebview.style.paddingTop = webviewHeight/3 + 'px';
}

function handleExit(event) {
  console.log(event.type);
  document.body.classList.add('exited');
  if (event.type == 'abnormal') {
    document.body.classList.add('crashed');
  } else if (event.type == 'killed') {
    document.body.classList.add('killed');
  }
}

function resetExitedState() {
  document.body.classList.remove('exited');
  document.body.classList.remove('crashed');
  document.body.classList.remove('killed');
}

function handleFindUpdate(event) {
  var findResults = document.querySelector('#find-results');
  var width = event.activeMatchOrdinal.toString().length +
      event.numberOfMatches.toString().length + 3;
  findResults.style.width = width + "em";
  findResults.innerText =
      event.activeMatchOrdinal + " of " + event.numberOfMatches;
}

function handleLoadCommit(event) {
  resetExitedState();
  if (!event.isTopLevel) {
    return;
  }

  closeBoxes();
  document.querySelector('#location').value = event.url;

  var webview = document.querySelector('webview');
  document.querySelector('#back').disabled = !webview.canGoBack();
  document.querySelector('#forward').disabled = !webview.canGoForward();
}

function handleLoadStart(event) {
  document.body.classList.add('loading');
  isLoading = true;

  resetExitedState();
  if (!event.isTopLevel) {
    return;
  }

  document.querySelector('#location').value = event.url;
}

function handleLoadStop(event) {
  // We don't remove the loading class immediately, instead we let the animation
  // finish, so that the spinner doesn't jerkily reset back to the 0 position.
  isLoading = false;
}

function handleLoadAbort(event) {
  console.log('LoadAbort');
  console.log('  url: ' + event.url);
  console.log('  isTopLevel: ' + event.isTopLevel);
  console.log('  type: ' + event.type);
}

function handleLoadRedirect(event) {
  resetExitedState();
  if (!event.isTopLevel) {
    return;
  }

  document.querySelector('#location').value = event.newUrl;
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
  var findResults = document.querySelector('#find-results');
  findResults.innerText= "";
  findResults.style.width = "0";
  document.querySelector('#find-box').style.display = '-webkit-flex';
  var findText = document.forms['find-form']['find-text'];
  findText.select();
}

function closeFindBox() {
  document.querySelector('#find-box').style.display = 'none';
  document.querySelector('webview').stopFinding();
}

function closeBoxes() {
  closeZoomBox();
  closeFindBox();
}