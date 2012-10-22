window.onresize = doLayout;

onload = function() {
  var browser = document.querySelector('browser');
  doLayout();

  document.querySelector('#back').onclick = function() {
    browser.back();
  };

  document.querySelector('#forward').onclick = function() {
    browser.forward();
  };

  document.querySelector('#home').onclick = function() {
    navigateTo('http://www.google.com/');
  };

  document.querySelector('#reload').onclick = function() {
    browser.reload();
  };
  document.querySelector('#reload').addEventListener(
    'webkitAnimationIteration',
    function() {
      if (!isLoading) {
        document.body.classList.remove('loading');    
      }
    });

  document.querySelector('#terminate').onclick = function() {
    browser.terminate();
  };

  document.querySelector('#location-form').onsubmit = function(e) {
    e.preventDefault();
    navigateTo(document.querySelector('#location').value);
  };

  browser.addEventListener('exit', handleExit);
  browser.addEventListener('loadstart', handleLoadStart);
  browser.addEventListener('loadstop', handleLoadStop);
  browser.addEventListener('loadabort', handleLoadAbort);
  browser.addEventListener('loadredirect', handleLoadRedirect);
  browser.addEventListener('loadcommit', handleLoadCommit);
};

function navigateTo(url) {
  resetExitedState();
  document.querySelector('browser').src = url;
}

function doLayout() {
  var browser = document.querySelector('browser');
  var controls = document.querySelector('#controls');
  var controlsHeight = controls.offsetHeight;
  var windowWidth = document.documentElement.clientWidth;
  var windowHeight = document.documentElement.clientHeight;
  browser.width = windowWidth;
  browser.height = windowHeight - controlsHeight;

  var sadBrowser = document.querySelector('#sad-browser');
  sadBrowser.style.width = browser.width + 'px';
  sadBrowser.style.height = browser.height * 2/3 + 'px';
  sadBrowser.style.paddingTop = browser.height/3 + 'px';
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

function handleLoadCommit(event) {
  resetExitedState();
  if (!event.isTopLevel) {
    return;
  }

  document.querySelector('#location').value = event.url;

  var browser = document.querySelector('browser');
  document.querySelector('#back').disabled = !browser.canGoBack();
  document.querySelector('#forward').disabled = !browser.canGoForward();
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
  console.log('oadAbort');
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
