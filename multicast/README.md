<a target="_blank" href="https://chrome.google.com/webstore/detail/bnheobjndkaipbloffigkiddhcbblihl">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-app-samples/master/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Multicast Chatting

![snapshot](snapshot.png "Snapshot of the app")

This sample shows how to send/recv [multicast socket](http://en.wikipedia.org/wiki/Multicast) diagrams in local network from Chrome apps. It joins the multicast socket group 237.132.123.123 and listens on port 3038.

To support multicast socket messaging in your local network requires the support of you router. The connectivity of this app varies depending on the network configuration.

__Warning: This is a simple chatting app demonstrating the usage of multicast socket Chrome app API. It is not designed for reliable communication. Privacy and reachability of the message is NOT guaranteed. It is also possible that a user is able to send to another user while not being able to receive from the latter.__
## APIs
* [Messaging](https://developer.chrome.com/apps/runtime.html)
* [Runtime](http://developer.chrome.com/apps/app.runtime.html)
* [Storage](http://developer.chrome.com/apps/storage.html)
* [Socket](http://developer.chrome.com/apps/socket.html)
* [Window](http://developer.chrome.com/apps/app.window.html)
     
## Screenshot
![screenshot](https://raw.github.com/GoogleChrome/chrome-app-samples/master/multicast/assets/screenshot_1280_800.png)

