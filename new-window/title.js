var webviewTitleInjectionComplete = false;
(function() {
  // Prevent multiple injection
  if (!webviewTitleInjectionComplete) {
    console.log('Injected title.js');
    var embedder = null;
    var listenersAreBound = false;
    var title = null;
    var postTitle = (function() {
      return function(e) {
        title = document.title;
        console.log('Posting title to embedder', title);
        embedder.postMessage(title, '*');
      };
    }());
    var bindEmbedder = function(e) {
      console.log('Binding embedder', e.source);
      embedder = e.source;
    };

    // Wait for message that gives us a reference to the embedder
    window.addEventListener('message', function(e) {
      if (!listenersAreBound) {
        // Bind to the embedder
        bindEmbedder(e);

        // Notify the embedder of every title change
        var titleElement = document.querySelector('title');
        if (titleElement) {
          titleElement.addEventListener('change', postTitle);
        } else {
          console.log('No title to bind to');
        }

        // Ensure initial title notification
        if (title === null) {
          postTitle();
        }

        listenersAreBound = true;
      }
    });
  }
}());
