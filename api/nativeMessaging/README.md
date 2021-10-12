This directory contains an example [Manifest
V3](https://developer.chrome.com/docs/extensions/mv3/intro/) Chrome extension that uses the [Native
Messaging](https://github.com/browserext/native-messaging) API to communicate with another 
application running on the same computer. In this demo, the second application (known as the [native
messaging host](https://developer.chrome.com/docs/apps/nativeMessaging/#native-messaging-host)) is 
a Python application.

In order for this example to work you must first install the native messaging
host from the host directory.

## Dependencies

Python 3.x.

https://github.com/mdn/webextensions-examples/pull/157:

> Note that running python with the `-u` flag is required on Windows, in order to ensure that stdin and stdout are opened in binary, rather than text, mode.

https://github.com/mdn/webextensions-examples/pull/478

For example

```
#!/usr/bin/env -S python -u
```

## Installation

Create a folder containing the files in this directory.

Navigate to `chrome://extensions`, set `Developer mode` to on, click `Load unpacked`, select the folder containing extension files.

Substitute full local path to `native_messaging_example_host_python.py` for `/path/to` at `"path"` value in `com.google.chrome.example.ping.pong.json`.

Set `native_messaging_example_host_python.py` to executable.

`chmod +x native_messaging_example_host_python.py`

Copy `com.google.chrome.example.ping.pong.json` to `NativeMessagingHosts` directory in Chromium or Chrome configuration folder, e.g., on Linux, `~/.config/chromium`; `~/.config/google-chrome-unstable`.

`cp com.google.chrome.example.ping.pong.json ~/.config/chromium/NativeMessagingHosts`.

See MDN [Native messaging](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging) for [Windows setup](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging#windows_setup) requirements and installation.

Reload extension.

## Usage

Pin the extension icon to address bar, click to execute `chrome.runtime.sendNativeMessage()`.

Navigate to `chrome-extension://knldjmfmopnpolahpmmgbagdohdnhkik/main.html`, click "Connect", then "Send". To disconnect the `Port`, click "Disconnect".
