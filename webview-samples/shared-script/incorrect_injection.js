// This is an example of what NOT to do when we need access to objects created
// by scripts embedded in the DOM. Keep in mind that usually we do NOT need
// access to such objects, and this sample illustrates a special case.

// When our app loads, setup a listener that will execute our script after the
// target guest page has loaded.
window.addEventListener('load', function() {
  var webview = document.querySelector('webview');
  webview.addEventListener('loadstop', function() {
    if (webview.src === 'http://foam-framework.github.io/foam/demos/Dragon.html') {
      // What NOT to do: addMoreDragons depends on objects in the guest page
      // scripting context, but content scripts run in an "isolated world" that
      // can only access the document (and no other shared Javascript objects).
      // See correct_injection.js for an example of what to do.
      var scriptText = '(' + addMoreDragons.toString() + ')();';
      webview.executeScript({ code: scriptText });
    }
  });
});
