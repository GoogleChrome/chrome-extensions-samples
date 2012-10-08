# Frameless window

A sample application to showcase how you can use frame:'none' windows to allow total customization of the window's real state. At beginning, the window is open with no titlebar. As long as you check one of the titlebars, it is added to the appropriate position. Notice that the added titlebars are the only parts of the window that allows dragging. This is achieved through a special CSS property applied to what is NOT to be draggable (in this case, the whole content of the window, except the titlebars): `-webkit-widget-region: region(control rectangle);`

## APIs

* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)

