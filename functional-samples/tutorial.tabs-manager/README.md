# Manage tabs

This [sample](https://developer.chrome.com/docs/extensions/get-started/tutorial/popup-tabs-manager) build your first tabs manager.

## Overview

The guide outlines how to build a tabs manager to organize your Chrome extension and Chrome Web Store documentation tabs.

<div align="center">
  <figure>
  <img src="https://developer.chrome.com/static/docs/extensions/get-started/tutorial/popup-tabs-manager/image/tabs-manager-extension-po-725ac725aaa4d_1440.png" width="auto" height="auto">
  <figcaption>Tabs Manager extension</figcaption>
</figure>
</div>
<br><br>

In this guide, we're going to explain how to do the following:

- Create an extension popup using the Action [API](https://developer.chrome.com/docs/extensions/reference/api/action).
- Query for specific tabs using the Tabs [API](https://developer.chrome.com/docs/extensions/reference/api/tabs).
- Preserve user privacy through narrow host permissions.
- Change the focus of the tab.
- Move tabs to the same window and group them.
- Rename tab groups using the TabGroups [API](https://developer.chrome.com/docs/extensions/reference/api/tabGroups).

## Implementation Notes

### Step 1: Add the extension data and icons

Create a file called `manifest.json` and add the following code:

```json
{
  "manifest_version": 3,
  "name": "Tab Manager for Chrome Dev Docs",
  "version": "1.0",
  "icons": {
    "16": "images/icon-16.png",
    "32": "images/icon-32.png",
    "48": "images/icon-48.png",
    "128": "images/icon-128.png"
  }
}
```

To learn more about these manifest keys, check out the Reading time tutorial that explains the extension's [metadata](https://developer.chrome.com/docs/extensions/get-started/tutorial/scripts-on-every-tab#step-1) and [icons](https://developer.chrome.com/docs/extensions/get-started/tutorial/scripts-on-every-tab#step-2) in more detail.

Create an `images` folder then [download the icons](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples/tutorial.tabs-manager/images) into it.

### Step 2: Create and style the popup

The [Action API](https://developer.chrome.com/docs/extensions/reference/api/action) controls the extension action (toolbar icon). When the user clicks on the extension action, it will either run some code or open a popup, like in this case. Start by declaring the popup in the `manifest.json`:

```json
{
  "action": {
    "default_popup": "popup.html"
  }
}
```

A popup is similar to a web page with one exception: it can't run inline JavaScript. Create a `popup.html` file and add the following code:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="./popup.css" />
    <title>Document</title>
  </head>
  <body>
    <template id="li_template">
      <li>
        <a>
          <h3 class="title">Tab Title</h3>
          <p class="pathname">Tab Pathname</p>
        </a>
      </li>
    </template>

    <h1>Google Dev Docs</h1>
    <button>Group Tabs</button>
    <ul></ul>

    <script src="./popup.js" type="module"></script>
  </body>
</html>
```

Next, you'll style the popup. Create a `popup.css` file and add the following code:

```css
body {
  width: 20rem;
}

ul {
  list-style-type: none;
  padding-inline-start: 0;
  margin: 1rem 0;
}

li {
  padding: 0.25rem;
}
li:nth-child(odd) {
  background: #80808030;
}
li:nth-child(even) {
  background: #ffffff;
}

h3,
p {
  margin: 0;
}
```
### Step 3: Manage the tabs

The Tabs API allows an extension to create, query, modify, and rearrange tabs in the browser.

#### 💡 Request permission:

Many methods in the [Tabs API](https://developer.chrome.com/docs/extensions/reference/api/tabs) can be used without requesting any permission. However, we need access to the `title` and the `URL` of the tabs; these sensitive properties require permission. We could request `"tabs"` permission, but this would give access to the sensitive properties of <b>all</b> tabs. Since we are only managing tabs of a specific site, we will request narrow host permissions.

Narrow [host permissions](https://developer.chrome.com/docs/extensions/develop/concepts/match-patterns) allow us to protect user privacy by granting elevated permission to <b>specific sites.</b> This will grant access to the `title`, `URL` properties, as well as additional capabilities. Add the highlighted code to the `manifest.json` file:

```json
{
  "host_permissions": [
    "https://developer.chrome.com/*"
  ]
}
```

#### 💡 Query the tabs:

You can retrieve the tabs from specific URLs using the `tabs.query()` method. Create a `popup.js` file and add the following code:

```javascript
const tabs = await chrome.tabs.query({
  url: [
    "https://developer.chrome.com/docs/webstore/*",
    "https://developer.chrome.com/docs/extensions/*",
  ]
});
```

#### 💡 Focus on a tab:

First, the extension will sort tab names (the titles of the contained HTML pages) alphabetically. Then, when a list item is clicked, it will focus on that tab using `tabs.update()` and bring the window to the front using `windows.update()`. Add the following code to the `popup.js` file:

```javascript
const collator = new Intl.Collator();
tabs.sort((a, b) => collator.compare(a.title, b.title));

const template = document.getElementById("li_template");
const elements = new Set();
for (const tab of tabs) {
  const element = template.content.firstElementChild.cloneNode(true);

  const title = tab.title.split("-")[0].trim();
  const pathname = new URL(tab.url).pathname.slice("/docs".length);

  element.querySelector(".title").textContent = title;
  element.querySelector(".pathname").textContent = pathname;
  element.querySelector("a").addEventListener("click", async () => {
    // need to focus window as well as the active tab
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  });

  elements.add(element);
}
document.querySelector("ul").append(...elements);
```

#### 💡 Group the tabs:

The [TabGroups API](https://developer.chrome.com/docs/extensions/reference/api/tabGroups) allows the extension to name the group and choose a background color. Add the `"tabGroups"` permission to the manifest by adding the highlighted code:

```json
{
  "permissions": [
    "tabGroups"
  ]
}
```

In `popup.js`, add the following code to create a button that will group all the tabs using `tabs.group()` and move them into the current window:

```javascript
const button = document.querySelector("button");
button.addEventListener("click", async () => {
  const tabIds = tabs.map(({ id }) => id);
  if (tabIds.length) {
    const group = await chrome.tabs.group({ tabIds });
    await chrome.tabGroups.update(group, { title: "DOCS" });
  }
});
```

## Running this extension

1. Clone this repository.
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).
