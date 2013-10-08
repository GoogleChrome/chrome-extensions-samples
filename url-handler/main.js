chrome.app.runtime.onLaunched.addListener(function(launchData) {
  loadArticle_(getArticleUrl_(launchData));
});

function getArticleUrl_(launchData) {
  if (launchData && launchData.id === 'wiki_article') {
    return launchData.url.replace("en.wikipedia", "en.m.wikipedia");
  } else if (launchData && launchData.id === 'mobile_wiki_article') {
    return launchData.url;
  }
  return "http://www.wikipedia.org";
}

function loadArticle_(url) {
  chrome.storage.local.get(
    { width: 600, height: 800 },
    function(settings) {
      createAppWindow_(settings.width, settings.height, url);
    }
  );
};

function createAppWindow_(width, height, url) {
  chrome.app.window.create(
    'main.html',
    {
      bounds: { width: width, height: height },
      frame: 'chrome'
    },
    function(win) {
      this.win_ = win;

      this.win_.contentWindow.addEventListener('load', function() {
        this.onLoad_(url);
      }.bind(this));

      this.win_.onBoundsChanged.addListener(function() {
        this.onResize_();
      });
    }
  );
}

function onLoad_(articleUrl) {
  this.webview_ = this.win_.contentWindow.document.getElementById('webview');
  onResize_();
  this.webview_.src = articleUrl;
}

function onResize_() {
  var bounds = this.win_.getBounds();
  this.webview_.style.height = bounds.height + 'px';
  this.webview_.style.width = bounds.width + 'px';
  chrome.storage.local.set(
    { width: bounds.width, height: bounds.height }
  );
}
