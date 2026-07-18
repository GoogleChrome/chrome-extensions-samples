#!/bin/sh
# Copyright 2013 The Chromium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style license that can be
# found in the LICENSE file.

set -e

DIR="$( cd "$( dirname "$0" )" && pwd )"
if [ $(uname -s) == 'Darwin' ]; then
  if [ "$(whoami)" == "root" ]; then
    # Due to macOS permission changes we need to put the host in /Applications
    HOST_PATH="/Applications/native-messaging-example-host"
    cp "$DIR/native-messaging-example-host" $HOST_PATH

    TARGET_DIR="/Library/Google/Chrome/NativeMessagingHosts"
    chmod a+x "$DIR/native-messaging-example-host"
  else
    # Due to macOS permission changes we need to put the host in ~/Applications
    HOST_PATH="/Users/$USER/Applications/native-messaging-example-host"
    cp "$DIR/native-messaging-example-host" $HOST_PATH

    TARGET_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
  fi
else
  HOST_PATH="$DIR/native-messaging-example-host"
  if [ "$(whoami)" == "root" ]; then
    TARGET_DIR="/etc/opt/chrome/native-messaging-hosts"
    chmod a+x "$DIR/native-messaging-example-host"
  else
    TARGET_DIR="$HOME/.config/google-chrome/NativeMessagingHosts"
  fi
fi

HOST_NAME=com.google.chrome.example.echo

# Create directory to store native messaging host.
mkdir -p "$TARGET_DIR"

# Copy native messaging host manifest.
cp "$DIR/$HOST_NAME.json" "$TARGET_DIR"

# Update host path in the manifest.
ESCAPED_HOST_PATH=${HOST_PATH////\\/}
sed -i -e "s/HOST_PATH/$ESCAPED_HOST_PATH/" "$TARGET_DIR/$HOST_NAME.json"

# Set permissions for the manifest so that all users can read it.
chmod o+r "$TARGET_DIR/$HOST_NAME.json"

echo Native messaging host $HOST_NAME has been installed.
