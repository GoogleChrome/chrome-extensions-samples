window.onresize = doLayout;

onload = function() {
  doLayout();

  document.querySelector('#new-browser').onclick = function() {
    chrome.app.window.create('browser.html', {
      'width': 1024,
      'height': 768
    });
  };

  document.querySelector('#home').onclick = function() {
    document.querySelector('browser').src =
      document.querySelector('#location').value = 'http://www.google.com/';
  };

  document.querySelector('#location-form').onsubmit = function(e) {
    e.preventDefault();

    document.querySelector('browser').src =
        document.querySelector('#location').value;
  };
};

function doLayout() {
  var browser = document.querySelector('browser');
  var controls = document.querySelector('#controls');
  var controlsHeight = controls.offsetHeight;
  var windowWidth = document.documentElement.clientWidth;
  var windowHeight = document.documentElement.clientHeight;
  browser.width = windowWidth;
  browser.height = windowHeight - controlsHeight;

  console.log(windowWidth, windowHeight);
}
