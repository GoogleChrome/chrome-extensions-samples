<a target="_blank" href="https://chrome.google.com/webstore/detail/mikhnkopoddcomlgmcjgfnaccjhibiec">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/master/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Dialog Element

The WHATWG defines a new element called `<dialog>` that can be used to define modal and modeless dialogs within an HTML page. This example shows how to use this new element.

NOTE: This sample requires M31 or later in Chrome, and if necessary you might have to enable experimental web features in the chrome://flags page.

```javascript
var dialog = document.querySelector('#dialog1');
document.querySelector('#show').addEventListener("click", function(evt) {
  dialog.showModal();
});
document.querySelector('#close').addEventListener("click", function(evt) {
  dialog.close("thanks!");
});

dialog.addEventListener("close", function(evt) {
  document.querySelector('#result').textContent = "You closed the dialog with: " + dialog.returnValue;
});

// called when the user Cancels the dialog, for example by hitting the ESC key
dialog.addEventListener("cancel", function(evt) {
  dialog.close("canceled");
});
```

## Resources

* [Runtime](http://developer.chrome.com/apps/app.runtime.html)
* [Window](http://developer.chrome.com/apps/app.window.html)


## Screenshot
![screenshot](/apps/samples/dialog-element/assets/screenshot_1280_800.png)
