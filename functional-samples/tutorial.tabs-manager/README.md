# Tab Manager Workshop

## Step one: Load an extension

Create a new directory.

In a `manifest.json` file, put the following:

```json
{
  "name": "Hello World",
  "version": "0.1",
  "manifest_version": 3,
  "description": "Basic Hello World Extension",
  "background": {
    "service_worker": "background.js"
  }
}
```

In `background.js`, add the following:

```js
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension has been installed. Reason:', details.reason);
});

console.log('Hello World!');
```

At chrome://extensions, enable "Developer mode" in the top right. Choose "Load unpacked" and select the directory you are working from.

> **Note:** If you have a zip file with your extension, you can simply drag and drop it on the page. You may need to reload the chrome://extensions page once for the drag and drop feature to be enabled.

## Step two: Setup the side panel

Create a new file called `sidepanel.html`. We'll add more here later, but for now, you can just put something simple:

```html
<html>
  <head>
    <title>Side Panel</title>
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
```

Add the following to your `manifest.json` file:

```json
{
  "action": {},
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "permissions": ["sidePanel"]
}
```

This adds an icon for your extension, and registers the side panel, but we need to make the side panel open when the action icon is clicked.

Replace your `chrome.runtime.onInstalled` handler in `background.js` with the following:

```js
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  });
});
```

If you load the new extension at chrome://extensions, you should see an icon in the extensions menu that you can use to open your side panel.

## Step three: Render a list of tabs

Add the following to your `sidepanel.html` file:

```html
<body>
  <ul></ul>
  <script src="./sidepanel.js"></script>
</body>
```

We also need to add the `tabs` permission to the manifest.

We'll add tabs to the list (`ul`) in `sidepanel.js`.

Add the following to `sidepanel.js`:

```js
const LIST_ELEMENT = document.querySelector('ul');

chrome.tabs
  .query({
    currentWindow: true
  })
  .then((tabs) => {
    for (const tab of tabs) {
      const element = document.createElement('li');
      element.innerText = tab.title;
      LIST_ELEMENT.append(element);
    }
  });
```

You now have a basic UI showing tabs!

## Step four:

Update the loop in `sidepanel.js` to focus tabs on click:

```js
for (const tab of tabs) {
  const element = document.createElement('li');
  element.innerText = tab.title;

  element.addEventListener('click', async () => {
    // need to focus window as well as the active tab
    await chrome.tabs.update(tab.id, { active: true });
    await chrome.windows.update(tab.windowId, { focused: true });
  });

  LIST_ELEMENT.append(element);
}
```

## Step five: Add styles

Consider adding some styles - the `sidepanel.css` file in this repository provides a basic stylesheet you can use.

## Step six: Update UI on changes

Right now, the UI is only rendered once when the side panel is opened. If anything changes, the UI becomes out of date.

To fix this, in `sidepanel.js`, wrap the rendering code in a function. We'll also add a line that resets the `innerHTML` of our list so we don't end up adding duplicate elements.

```js
async function updateUI() {
  const tabs = await chrome.tabs.query({
    currentWindow: true
  });

  // Reset element.
  LIST_ELEMENT.innerHTML = '';

  for (const tab of tabs) {
    const element = document.createElement('li');
    element.innerText = tab.title;

    element.addEventListener('click', async () => {
      // need to focus window as well as the active tab
      await chrome.tabs.update(tab.id, { active: true });
      await chrome.windows.update(tab.windowId, { focused: true });
    });

    LIST_ELEMENT.append(element);
  }
}
```

We can now call this once when the page loads, and again every time there's a relevant change:

```js
// We need to update the UI as soon as the page loads.
window.addEventListener('load', () => {
  updateUI();
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if ('url' in changeInfo || 'title' in changeInfo) {
      updateUI();
    }
  });
  chrome.tabs.onCreated.addListener(updateUI);
  chrome.tabs.onRemoved.addListener(updateUI);
  chrome.tabs.onMoved.addListener(updateUI);
});
```
