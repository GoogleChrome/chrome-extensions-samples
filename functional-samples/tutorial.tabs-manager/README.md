# Manage Tabs

This [sample](https://developer.chrome.com/docs/extensions/get-started/tutorial/popup-tabs-manager) build your first tabs manager.

## Overview

The following instructions will assist you in building a tabs manager for organizing both your Chrome extension and Chrome Web Store documentation tabs.

- <b>Creating Extension Popup:</b> Using the [Action API](https://developer.chrome.com/docs/extensions/reference/api/action), you'll learn how to design and implement an extension popup interface, providing users with quick access to powerful tab management functionalities

- <b>Querying Specific Tabs:</b> Leveraging the [Tabs API](https://developer.chrome.com/docs/extensions/reference/api/tabs), we'll show you how to precisely identify and interact with specific tabs, enabling targeted actions and efficient navigation within your extension

- <b>Privacy-Preserving Permissions:</b> We'll discuss the significance of narrow host permissions in preserving user privacy while still granting necessary access for effective tab management operations

- <b>Tab Focus Control:</b> Discover techniques to dynamically change the focus of tabs, allowing users to prioritize and navigate between different tabs effortlessly

- <b>Tab Grouping and Window Management:</b> Explore methods to consolidate related tabs within the same window and organize them into customizable groups using the [TabGroups API](https://developer.chrome.com/docs/extensions/reference/api/tabGroups), facilitating better tab organization and workflow management

- <b>Tab Group Renaming:</b> Learn how to empower users with the ability to rename tab groups, providing flexibility and customization options to suit individual preferences and workflow requirements

> <b>💡 Before You Start:</b> This guide assumes that you possess basic web development skills. If you're new to extension development, we recommend starting with the ["Hello World"](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world) tutorial for a primer on the extension development workflow.

## Running this extension

1. Clone this repository to your local machine
   
   ```bash   
   git clone https://github.com/GoogleChrome/chrome-extensions-samples.git   
   ```
    
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked)
