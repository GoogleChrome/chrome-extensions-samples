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

  document.querySelector('#terminate').onclick = function() {
    browser.terminate();
  };

  document.querySelector('#location-form').onsubmit = function(e) {
    e.preventDefault();
    navigateTo(document.querySelector('#location').value);
  };

  browser.addEventListener('crash', handleCrash);
  browser.addEventListener('navigation', handleNavigation);
  browser.addEventListener('loadStart', handleLoadStart);
  browser.addEventListener('loadAbort', handleLoadAbort);
  browser.addEventListener('loadRedirect', handleLoadRedirect);
};

function navigateTo(url) {
  document.body.classList.remove('crashed');
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

function handleCrash(event) {
  document.body.classList.add('crashed');
}

function handleNavigation(event) {
  document.body.classList.remove('crashed');
  if (!event.isTopLevel) {
    return;
  }

  document.querySelector('#location').value = event.url;
}

function handleLoadStart(event) {
  document.body.classList.remove('crashed');
  if (!event.isTopLevel) {
    return;
  }

  document.querySelector('#location').value = event.url;
}

function handleLoadAbort(event) {
  console.log('oadAbort');
  console.log('  url: ' + event.url);
  console.log('  isTopLevel: ' + event.isTopLevel);
  console.log('  type: ' + event.type);
}

function handleLoadRedirect(event) {
  document.body.classList.remove('crashed');
  if (!event.isTopLevel) {
    return;
  }

  document.querySelector('#location').value = event.newUrl;
}
