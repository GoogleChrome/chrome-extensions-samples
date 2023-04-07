<a target="_blank" href="https://chrome.google.com/webstore/detail/bnheobjndkaipbloffigkiddhcbblihl">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


# Multicast Chatting

![snapshot](snapshot.png "Snapshot of the app")

This sample shows how to send and receive [multicast
socket](http://en.wikipedia.org/wiki/Multicast) diagrams in local network from
Chrome apps. It joins the multicast socket group 237.132.123.123 and listens on
port 3038.

To support multicast socket messaging in your local network requires the
support of your router. The connectivity of this app varies depending on the
network configuration.

__Warning: This is a simple chatting app demonstrating the usage of multicast
socket Chrome app API. It is not designed for reliable communication. Privacy
and reachability of the message is NOT guaranteed. It is also possible that a
user is able to send to another user while not being able to receive from the
latter.__

## APIs
* [Messaging](https://developer.chrome.com/docs/extensions/reference/app_runtime)
* [Runtime](https://developer.chrome.com/apps/app.runtime.html)
* [Storage](https://developer.chrome.com/apps/storage.html)
* [Sockets](https://developer.chrome.com/apps/sockets_udp)
* [Window](https://developer.chrome.com/docs/extensions/reference/app_window)

## Screenshot
![screenshot](/_archive/apps/samples/multicast/assets/screenshot_1280_800.png)

