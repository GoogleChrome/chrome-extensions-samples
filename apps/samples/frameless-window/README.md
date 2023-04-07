<a target="_blank" href="https://chrome.google.com/webstore/detail/hjjdaddngnaofnfjpajdcbdmkegiakec">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/master/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Frameless window

A sample application to showcase how you can use frame:'none' windows to allow total customization of the window's real estate. Initially, the window is open with no titlebar. When you check one of the titlebars, it is added to the appropriate position. Notice that the added titlebars are the only parts of the window that allow dragging. This is achieved through a special CSS property applied to what is draggable or non-draggable (by default, the whole window is not draggable): `-webkit-app-region: drag|no-drag;`

Caveat: `-webkit-app-region: drag;` *will* disable some customizations such as custom mouse pointers.

## APIs

* [Runtime](http://developer.chrome.com/apps/app.runtime.html)
* [Window](http://developer.chrome.com/apps/app.window.html)

     
## Screenshot
![screenshot](/apps/samples/frameless-window/assets/screenshot_1280_800.png)

