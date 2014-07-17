// When our app loads, setup a listener that will execute our script after the
// target guest page has loaded.
window.addEventListener('load', function() {
  var webview = document.querySelector('webview');
  webview.addEventListener('loadstop', function() {
    if (webview.src === 'http://rawgit.com/foam-framework/foam/master/demos/Tags.html') {
      // What NOT to do: addMoreDragons depends on objects in the guest page
      // scripting context, but content scripts run in an "isolated world" that
      // can only access the document (and no other shared Javascript objects).
      // See good_app.js for an example of what to do.
      var scriptText = '(' + addMoreDragons.toString() + ')();';
      webview.executeScript({ code: scriptText });
    }
  });
});
