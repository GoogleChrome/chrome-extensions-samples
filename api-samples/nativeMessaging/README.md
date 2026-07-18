# Native Messaging

This directory contains an example of Chrome extension that uses [Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging) to communicate with a native application.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Follow the installation instructions below.
4. Open the popup.
5. Send messages from either the native application or extension.

## To install the host:

### Windows

Run `install_host.bat` script in the host directory.

This script installs the native messaging host for the current user, by creating a registry key
` HKEY_CURRENT_USER\SOFTWARE\Google\Chrome\NativeMessagingHosts\com.google.chrome.example.echo`
and setting its default value to the full path to `host\com.google.chrome.example.echo-win.json`.

If you want to install the native messaging host for all users, change HKCU to HKLM.

Note that you need to have Python installed.

### Mac and Linux

Run `install_host.sh` script in the host directory: `host/install_host.sh`

By default the host is installed only for the user who runs the script, but if
you run it with admin privileges (i.e. `sudo host/install_host.sh`), then the
host will be installed for all users. You can later use `host/uninstall_host.sh`
to uninstall the host.
