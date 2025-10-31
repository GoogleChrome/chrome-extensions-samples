# chrome.commands

This sample demonstrates the `chrome.commands` API for adding keyboard shortcuts to Chrome extensions.

## Overview

The extension showcases how to:

- **Define keyboard shortcuts** in the manifest
- **Listen for command events** in the background script
- **Display registered commands** to users
- **Trigger actions** via keyboard shortcuts
- **Customize shortcuts** through Chrome's settings

## Features

### Registered Commands

1. **Open Extension Popup** (`Ctrl+Shift+Y` / `Cmd+Shift+Y`)
   - Opens the extension popup using the special `_execute_action` command

2. **Toggle Feature** (`Ctrl+Shift+F` / `Cmd+Shift+F`)
   - Toggles a feature on/off with persistent state

3. **Take Screenshot** (`Ctrl+Shift+S` / `Cmd+Shift+S`)
   - Captures the current tab and saves as PNG

4. **Show Notification** (`Ctrl+Shift+N` / `Cmd+Shift+N`)
   - Displays a test notification

5. **Command Without Shortcut**
   - Demonstrates a command that can be assigned a shortcut later

### Interactive UI

- View all registered commands with their shortcuts
- Trigger commands via buttons (alternative to keyboard)
- See real-time feature status with visual indicator
- Direct link to Chrome's keyboard shortcuts settings

## API Usage Examples

### Define commands in manifest.json
```json
{
  "commands": {
    "toggle-feature": {
      "suggested_key": {
        "default": "Ctrl+Shift+F",
        "mac": "Command+Shift+F"
      },
      "description": "Toggle a feature on/off"
    }
  }
}
```

### Listen for commands in background script
```javascript
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-feature') {
    // Handle the command
  }
});
```

### Get all registered commands
```javascript
const commands = await chrome.commands.getAll();
commands.forEach(cmd => {
  console.log(`${cmd.name}: ${cmd.shortcut || 'Not set'}`);
});
```

## Special Commands

- **`_execute_action`** - Opens the extension's popup (action)
- **`_execute_browser_action`** - Opens browser action (MV2)
- **`_execute_page_action`** - Opens page action (MV2)

## Customizing Shortcuts

Users can customize keyboard shortcuts:

1. Navigate to `chrome://extensions/shortcuts`
2. Find your extension
3. Click the edit icon next to any command
4. Press the desired key combination

## Keyboard Shortcut Guidelines

- **Modifiers required**: All shortcuts must include `Ctrl` or `Command` (on Mac)
- **Additional modifiers**: Can include `Shift` and `Alt`
- **Maximum shortcuts**: Up to 4 suggested shortcuts per command
- **Platform-specific**: Different shortcuts for Windows/Linux/Mac/ChromeOS

## Permissions

This extension uses:

- `activeTab` - For taking screenshots of the current tab
- `notifications` - For showing notifications
- `storage` - For persisting feature state

## Running this extension

1. Clone this repository
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked)
3. Try the keyboard shortcuts or click the extension icon
4. Customize shortcuts at `chrome://extensions/shortcuts`

## Implementation Notes

- Commands are registered in `manifest.json`
- The background service worker listens for `chrome.commands.onCommand` events
- State is persisted using `chrome.storage.local`
- The popup displays all commands using `chrome.commands.getAll()`
- Screenshots use `chrome.tabs.captureVisibleTab()`

## Learn More

- [chrome.commands API Reference](https://developer.chrome.com/docs/extensions/reference/commands/)
- [Keyboard Shortcuts Guide](https://developer.chrome.com/docs/extensions/mv3/user_interface/#commands)
