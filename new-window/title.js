var webviewTitleInjectionComplete = false;
(function() {
  // Prevent multiple injection
  if (!webviewTitleInjectionComplete) {
    console.log('Injected title.js');
    var embedder = null;
    var tabName = null;
    var listenersAreBound = false;
    var title = null;
    var postTitle = (function() {
      return function(e) {
        title = document.title;
        console.log('Posting title to embedder', title);
        var data = {
          'name': tabName,
          'title': title
        };
        embedder.postMessage(JSON.stringify(data), '*');
      };
    }());
    var bindEmbedder = function(e) {
      console.log('Binding embedder', e.source);
      embedder = e.source;
    };
    var bindTabName = function(e) {
      console.log('Binding tabName', e.data);
      if (e.data) {
        var data = JSON.parse(e.data);
        if (data.name) {
          tabName = data.name;
        } else {
          console.log('Error: Message from embedder contains no tab name');
        }
      } else {
          console.log('Error: Message from embedder contains no data');
      }
    };

    // Wait for message that gives us a reference to the embedder
    window.addEventListener('message', function(e) {
      if (!listenersAreBound) {
        // Bind data
        bindEmbedder(e);
        bindTabName(e);

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
