// Determine platform and add platform-specific CSS. This should block the page
// load, otherwise users will see a 'flash' of the page changing CSS.
(function() {
  var backgroundPage = window.opener;
  var link = document.createElement('link');
  link.type = 'text/css';
  link.rel = 'stylesheet';
  link.href = 'platform-' + backgroundPage.platformInfo.os + '.css';
  document.head.appendChild(link);
  console.info('inserting platform css', link.href);
})();

window.addEventListener('load', function() {
  // Add 'shadow' when page is scrolled > 0.
  var scroll = document.querySelector('.scroll');
  var titlebar = document.querySelector('.titlebar');
  scroll.addEventListener('scroll', function() {
    titlebar.classList.toggle('shadow', scroll.scrollTop > 0);
  });

  function titleButtonClick(type, fn) {
    var button = document.getElementById('title-' + type);
    button.addEventListener('click', fn);
  }
  var win = chrome.app.window.current();

  // Title button handlers for default actions..
  titleButtonClick('close', function() { win.close(); });
  titleButtonClick('minimize', function() { win.minimize(); });
  titleButtonClick('maximize', function() {
    if (win.isMaximized()) {
      win.restore();
    } else {
      win.maximize();
    }
  });
  titleButtonClick('fullscreen', function() {
    if (win.isFullscreen()) {
      win.restore();
    } else {
      win.fullscreen();
    }
  });

  // If launched as fullscreen, set class.
  if (win.isFullscreen()) {
    titlebar.classList.add('fullscreen');
  }

  // When transitioning to fullscreen, set class.
  win.onFullscreened.addListener(function() {
    titlebar.classList.add('fullscreen');
  });

  // When being restored (to 'normal'), remove fullscreen class.
  win.onRestored.addListener(function() {
    titlebar.classList.remove('fullscreen');
  });
});

