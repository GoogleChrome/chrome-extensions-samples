## Optional permissions in a new tab

Demonstrates how extensions can provide users the option to enable additional features. This extension prompts the user on the **New Tab** page asking permission to display their top sites.

See [optional permissions](https://developer.chrome.com/docs/extensions/reference/permissions/) to learn more.

## Testing the extension

Follow the instructions to load an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked), then open a new tab.

It should look like this:

<img src="../../.repo/images/optional-permissions-new-tab.png" alt="New tab with optional permission button" width="500"/>

Then, click on `Allow Extension to Access to Top Sites`. You will see the following message:

<img src="../../.repo/images/optional-permissions-dialog.png" alt="Permissions prompt with Deny and Allow buttons respectively" width="400"/>

Selecting `Allow` will display a list of the websites you visit most.

<img src="../../.repo/images/optional-permissions-top-sites.png" alt="New tab displaying favicons for top sites" width="400"/>
