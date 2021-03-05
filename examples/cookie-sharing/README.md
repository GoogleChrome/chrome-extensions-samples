## `key` in manifest.json

The `"key"` property declared in manifest.json is only included to ensure that the extension's ID is
static. We need a static ID in order for our web server (https://crx-sharing-cookies.glitch.me) to
ensure that only our demo extension can include the `token` cookie in requests.

See https://developer.chrome.com/docs/extensions/mv3/manifest/key/ for additional information.