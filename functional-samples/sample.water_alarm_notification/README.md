# Drink Water Alarm

This example demonstrates how to use the [Alarms API](https://developer.chrome.com/docs/extensions/reference/api/alarms) and [Notifications API](https://developer.chrome.com/docs/extensions/reference/api/notifications) to remind users to drink water at set intervals.

## Overview

The extension allows users to set a recurring reminder to stay hydrated. Users can choose from preset intervals (1, 15, or 30 minutes) through a popup interface. When the alarm fires, a notification appears prompting the user to drink water.

## Implementation Notes

The extension uses several Chrome APIs together:

- `chrome.alarms` - Creates and manages the reminder timer
- `chrome.notifications` - Displays the hydration reminder when the alarm fires
- `chrome.storage.sync` - Persists the user's selected interval across sessions
- `chrome.action` - Shows an "ON" badge when an alarm is active

When the notification appears, users can click "Keep it Flowing" to restart the timer with their previously selected interval.

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
3. Click the extension icon to open the popup.
4. Select a time interval (Sample minute, 15 Minutes, or 30 Minutes).
5. Wait for the notification to appear reminding you to drink water.
