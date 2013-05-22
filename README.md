Copyright 2013 Google Inc. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

# Chrome packaged apps samples

This is the Google Chrome official repository for Chrome packaged apps samples. We have tried to demonstrate most of the [Chrome packaged apps APIs](http://developer.chrome.com/apps/about_apps.html).

Please join the [Chromium Apps](https://groups.google.com/a/chromium.org/forum/?fromgroups#!forum/chromium-apps) group for general discussion. We're also available on IRC at #chromium-apps ([Freenode](http://freenode.net/)).


# Samples categorized by showcased APIs or features:

Master application. Showcases all the other apps in one place:
* [dojo](https://github.com/GoogleChrome/chrome-app-samples/tree/master/dojo)


## Embedding content:

Sandbox to workaround CSP restrictions: 
* [analytics](https://github.com/GoogleChrome/chrome-app-samples/tree/master/analytics)
* [sandbox](https://github.com/GoogleChrome/chrome-app-samples/tree/master/sandbox)
* [sandboxed-content](https://github.com/GoogleChrome/chrome-app-samples/tree/master/sandboxed-content)

Webview:
* [browser](https://github.com/GoogleChrome/chrome-app-samples/tree/master/browser)
* [tcpserver](https://github.com/GoogleChrome/chrome-app-samples/tree/master/tcpserver)


## Authentication and user identification:

Identity/OAuth:
* [appsquare](https://github.com/GoogleChrome/chrome-app-samples/tree/master/appsquare)
* [gdocs](https://github.com/GoogleChrome/chrome-app-samples/tree/master/gdocs)
* [identity](https://github.com/GoogleChrome/chrome-app-samples/tree/master/identity)
* [instagram-auth](https://github.com/GoogleChrome/chrome-app-samples/tree/master/instagram-auth)


## Storage related:

Syncable filesystem (useful for media and files that need to be synced among different devices):
* [syncfs-editor](https://github.com/GoogleChrome/chrome-app-samples/tree/master/syncfs-editor)

Syncable storage (useful for saving settings and application state):
* [diff](https://github.com/GoogleChrome/chrome-app-samples/tree/master/diff)
* [hello-world-sync](https://github.com/GoogleChrome/chrome-app-samples/tree/master/hello-world-sync)

Direct access to the filesystem (Filesystem API):
* [diff](https://github.com/GoogleChrome/chrome-app-samples/tree/master/diff)
* [filesystem-access](https://github.com/GoogleChrome/chrome-app-samples/tree/master/filesystem-access)
* [mini-code-edit](https://github.com/GoogleChrome/chrome-app-samples/tree/master/mini-code-edit)
* [storage](https://github.com/GoogleChrome/chrome-app-samples/tree/master/storage)
* [text-editor](https://github.com/GoogleChrome/chrome-app-samples/tree/master/text-editor)
* [media-gallery](https://github.com/GoogleChrome/chrome-app-samples/tree/master/media-gallery)

Media Gallery API:
* [media-gallery](https://github.com/GoogleChrome/chrome-app-samples/tree/master/media-gallery)


## App lifecycle and window management:

Window
* [restarted-demo](https://github.com/GoogleChrome/chrome-app-samples/tree/master/restarted-demo)
* [singleton](https://github.com/GoogleChrome/chrome-app-samples/tree/master/singleton)
* [window-state](https://github.com/GoogleChrome/chrome-app-samples/tree/master/window-state)
* [windows](https://github.com/GoogleChrome/chrome-app-samples/tree/master/windows)

Context menu:
* [context-menu](https://github.com/GoogleChrome/chrome-app-samples/tree/master/context-menu)

Frameless window:
* [frameless-window](https://github.com/GoogleChrome/chrome-app-samples/tree/master/frameless-window)
* [weather](https://github.com/GoogleChrome/chrome-app-samples/tree/master/weather)

HTML Fullscreen API:
* [window-state](https://github.com/GoogleChrome/chrome-app-samples/tree/master/window-state)

Optional permissions:
* [optional-permissions](https://github.com/GoogleChrome/chrome-app-samples/tree/master/optional-permissions)


## Device access:

Network access (Socket API):
* [mdns-browser](https://github.com/GoogleChrome/chrome-app-samples/tree/master/mdns-browser)
* [nodejs-net.coffee](https://github.com/GoogleChrome/chrome-app-samples/tree/master/nodejs-net.coffee)
* [parrot-ar-drone](https://github.com/GoogleChrome/chrome-app-samples/tree/master/parrot-ar-drone)
* [tcpserver](https://github.com/GoogleChrome/chrome-app-samples/tree/master/tcpserver)
* [telnet](https://github.com/GoogleChrome/chrome-app-samples/tree/master/telnet)
* [udp](https://github.com/GoogleChrome/chrome-app-samples/tree/master/udp)
* [webserver](https://github.com/GoogleChrome/chrome-app-samples/tree/master/webserver)


Serial API:
* [serial](https://github.com/GoogleChrome/chrome-app-samples/tree/master/serial)
* [serial-control-signals](https://github.com/GoogleChrome/chrome-app-samples/tree/master/serial-control-signals)
* [servo](https://github.com/GoogleChrome/chrome-app-samples/tree/master/servo)

USB raw access:
* [usb/knob](https://github.com/GoogleChrome/chrome-app-samples/tree/master/usb/knob)
* [usb-label-printer](https://github.com/GoogleChrome/chrome-app-samples/tree/master/usb-label-printer)

Bluetooth API:
* [ioio](https://github.com/GoogleChrome/chrome-app-samples/tree/master/ioio)
* [zephyr\_hxm](https://github.com/GoogleChrome/chrome-app-samples/tree/master/zephyr_hxm)

Geolocation:
* [appsquare](https://github.com/GoogleChrome/chrome-app-samples/tree/master/appsquare)
* [weather](https://github.com/GoogleChrome/chrome-app-samples/tree/master/weather)

Audio and video capture (WebRTC getUserMedia):
* [camera-capture](https://github.com/GoogleChrome/chrome-app-samples/tree/master/camera-capture)

Monitor system info:
* [systemInfo](https://github.com/GoogleChrome/chrome-app-samples/tree/master/systemInfo)


## Integration with other stuff:

Sending messages to other installed apps or extensions:
* [messaging](https://github.com/GoogleChrome/chrome-app-samples/tree/master/messaging)

System tray rich notifications:
* [rich-notifications](https://github.com/GoogleChrome/chrome-app-samples/tree/master/rich-notifications)

Dart:
* [dart](https://github.com/GoogleChrome/chrome-app-samples/tree/master/dart)

NodeJS modules:
* [nodejs-net.coffee](https://github.com/GoogleChrome/chrome-app-samples/tree/master/nodejs-net.coffee)

## Push Messaging
Client side sample
* [push-sample-app](https://github.com/GoogleChrome/chrome-app-samples/tree/master/push-sample-app)

Guestbook sample
* [push-guestbook](https://github.com/GoogleChrome/chrome-app-samples/tree/master/push-guestbook)

Roundtrip sample
* [push-messaging-roundtrip-sample](https://github.com/GoogleChrome/chrome-app-samples/tree/master/push-messaging-roundtrip-sample)

## Other:

WebGL and Pointer Lock:
* [webgl-pointer-lock](https://github.com/GoogleChrome/chrome-app-samples/tree/master/webgl-pointer-lock)

## Uncategorized:
* [calculator](https://github.com/GoogleChrome/chrome-app-samples/tree/master/calculator)
* [clock](https://github.com/GoogleChrome/chrome-app-samples/tree/master/clock)
* [hello-world](https://github.com/GoogleChrome/chrome-app-samples/tree/master/hello-world)
* [io2012-presentation](https://github.com/GoogleChrome/chrome-app-samples/tree/master/io2012-presentation)

# Libraries

Google APIs client library for packaged apps:
* [gapi-chrome-apps-lib](https://github.com/GoogleChrome/chrome-app-samples/tree/master/gapi-chrome-apps-lib)
