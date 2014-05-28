var webviewTitleInjectionComplete = false;
(function() {
  // Prevent multiple injection
  if (!webviewTitleInjectionComplete) {
    var embedder = null;
    var tabName = null;
    var listenersAreBound = false;
    var title = null;
    var postTitle = (function() {
      return function(e) {
        title = document.title;
        var data = {
          'type': 'titleResponse',
          'tabName': tabName,
          'title': title || '[no title]'
        };
        embedder.postMessage(JSON.stringify(data), '*');
      };
    }());
    var bindEmbedder = function(e) {
      embedder = e.source;
    };
    var bindTabName = function(data) {
      if (data.tabName) {
        tabName = data.tabName;
      } else {
        console.warn('Warning: Title message from embedder contains no tab name');
      }
    };

    var simulateCtrlClick = function(url) {
      var a = document.createElement('a');
      a.href = url;
      var e = document.createEvent('MouseEvents');
      e.initMouseEvent(
          'click', // type
          true,    // canBuble
          true,    // cancelable
          window,  // view
          0,       // detail
          0,       // screenX
          0,       // screenY
          0,       // clientX
          0,       // clientY
          true,    // ctrlKey <-- Important: simulate ctrl-click
          false,   // altKey
          false,   // shiftKey
          false,   // metaKey
          0,       // button
          null);   // relatedTarget
      a.dispatchEvent(e);
    };

    var simulatePopup = function(url) {
      window.open(
          url,
          'id-' + (new Date()).getTime(),
          'width=100,height=100,left=100,top=100');
    };

    window.addEventListener('message', function(e) {
      if (e.data) {
        var data = JSON.parse(e.data);
        var type = data.type;
        if (type == 'titleRequest') {
          if (!listenersAreBound) {
            bindTabName(data);
            bindEmbedder(e);

            // Notify the embedder of every title change
            var titleElement = document.querySelector('title');
            if (titleElement) {
              titleElement.addEventListener('change', postTitle);
            } else {
              console.warn('Warning: No <title> element to bind to');
              postTitle();
            }

            // Ensure initial title notification
            if (title === null) {
              postTitle();
            }

            listenersAreBound = true;
          }
        } else if (type == 'simulateCtrlClick') {
          simulateCtrlClick(data.url);
        } else if (type == 'simulatePopup') {
          simulatePopup(data.url);
        } else {
          console.warn('Warning: Unexpected message received', e);
        }
      } else {
        console.warn('Warning: Empty message (no data) received', e);
      }
    });
  }
}());
