This directory contains an "MV3" example of Chromium/Chrome application that uses [Native
Messaging](https://github.com/browserext/native-messaging) API that allows to communicate with a native application.

In order for this example to work you must first install the native messaging
host from the host directory.

<h5>Install<h5>

<h6>Dependencies</h6>

Python 2.x or 3.x.

Create a folder containing the files in this directory.

Navigate to `chrome://extensions`, set `Developer mode` to on, click `Load unpacked`, select the folder containing extension files.

Note the generated extension ID, substitute that value for `<id>` at `"allowed_origins"` value in `com.google.chrome.example.ping.pong.json`.

Substitute full local path to `native_messaging_example_host_python.py` for `/path/to` at `"path"` value in `com.google.chrome.example.ping.pong.json`.

Set `native_messaging_example_host_python.py` to executable.

`chmod +x native_messaging_example_host_python.py`

Copy `com.google.chrome.example.ping.pong.json` to `NativeMessagingHosts` directory in Chromium or Chrome configuration folder, e.g., on Linux, `~/.config/chromium`; `~/.config/google-chrome-unstable`.

`cp com.google.chrome.example.ping.pong.json ~/.config/chromium/NativeMessagingHosts`.

See MDN [Native messaging](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging) for [Windows setup](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging#windows_setup) requirements and installation.

Reload extension.

<h5>Usage</h5>

Pin the extension icon to address bar, click to execute `chrome.runtime.sendNativeMessage()`.

Navigate to `chrome-extension://<id>/main.html`, click "Connect", then "Send". To disconnect the `Port`, click "Disconnect".
