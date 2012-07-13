Sample that shows how to use the [windowing API](http://developer.chrome.com/trunk/apps/appWindow.html) to create a window with a custom frame and manipulate its properties.

The app creates two windows, an "original" window and a "copycat" (bizarro world) window. The copycat window mimics the position and minimize state of the original window, but it displays itself in an inverted fashion (by using the `"none" frame and drawing its titlebar and contents).
