# Context menus

Sample that shows how to use the [context menu API](http://developer.chrome.com/trunk/apps/contextMenus.html) in an app to manage various application context menus, such as menus that only apply to particular windows, menus that apply to selections or media types, and context menus that work on the app launcher.

A single context menu structure is normally global to the entire app, and thus all windows would have the same menu. This sample uses a `focus` event handler in each window to detect when a window is brought to the foreground. When it is, the contents of the context menu are updated with that window's commands, while leaving the other menus intact. The `chrome.contextMenus.onClicked` event handler also only handles events that occur in that window.

## APIs

* [Context menu API](http://developer.chrome.com/trunk/apps/contextMenus.html)
* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)

     
     
## Screenshot
![screenshot](https://raw.github.com/GoogleChrome/chrome-app-samples/master/context-menu/assets/screenshot_1280_800.png)

