## Optional permissions in a new tab

This sample extension changes the **New Tab** page, prompting the user for permission to display their top sites. It demonstrates how extensions can provide users with the option to enable additional features.

See [optional permissions](https://developer.chrome.com/docs/extensions/reference/permissions/) to learn more.

## Testing the extension

Follow the instructions to load an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked), then open a new tab.

It should look like this:

<img src="../../.repo/images/optional-permissions-new-tab.png" alt="New tab with optional permission button" width="500"/>

Then, click on `Allow Extension to Access to Top Sites`. You will see the following message:

<img src="../../.repo/images/optional-permissions-dialog.png" alt="Permissions dialog with Deny and Allow buttons respectively" width="400"/>

Selecting `Allow` will display a list of the websites you visit most.

<img src="../../.repo/images/optional-permissions-top-sites.png" alt="New tab displaying top sites" width="400"/>
