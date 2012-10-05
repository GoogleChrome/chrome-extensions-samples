# Context menus

Sample that shows how to use the [context menu API](http://developer.chrome.com/trunk/apps/contextMenus.html) in an app to achieve per-window menus.

Context menus are normally global to the entire app, and thus all windows would have the same menu. This sample uses a `focus` event handler in each window to detect when a window is brought to the foreground. When it is, the contents of the context menu are updated with that window's commands. The `chrome.contextMenus.onClicked` event handler also only handles events that occur in that window.

## APIs

* [Context menu API](http://developer.chrome.com/trunk/apps/contextMenus.html)
* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)


