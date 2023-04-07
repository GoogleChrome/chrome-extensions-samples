<a target="_blank" href="https://chrome.google.com/webstore/detail/okhdmjejphblookgnkabaoaalhcoobec">![Try it now in CWS](https://raw.github.com/GoogleChrome/chrome-extensions-samples/main/_archive/apps/tryitnowbutton.png "Click here to install this sample from the Chrome Web Store")</a>


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

* [UDP Network](http://developer.chrome.com/apps/app_network#udp)
* [Runtime](https://developer.chrome.com/docs/extensions/reference/app_runtime)
* [Window](https://developer.chrome.com/docs/extensions/reference/app_window)

## Screenshot
![screenshot](/_archive/apps/samples/udp/assets/screenshot_1280_800.png)

