# A simple UDP echo client

    ------------------------------
    
    [127.0.0.1:3007    ] [Connect]
    
                   **o
                      ..
                        .
    
    
    
    ------------------------------

Connects to a UDP echo server at the given address. 

Each little dot represents a echo request.
When the request receives a reply, it shoots away and blows up.
When a request doesn't receive a reply, it grows into a big ball and blows up.

The dots gravitate towards each other for extra spiffiness.

### Server side

In the `server` directory, you will find a Node echo server that intentionally drops some packets to simulate a real network. Run this server before, so you can connect the client (Chrome Packaged App) to it.

## APIs

* [UDP Network](http://developer.chrome.com/trunk/apps/app_network.html#udp)
* [Runtime](http://developer.chrome.com/trunk/apps/app.runtime.html)
* [Window](http://developer.chrome.com/trunk/apps/app.window.html)
