# Chrome Extensions samples

Official samples for Chrome Extensions and the Chrome Apps platform.
Note that Chrome Apps are deprecated. Learn more [on the Chromium blog](https://blog.chromium.org/2020/08/changes-to-chrome-app-support-timeline.html).

For more information on extensions, see [Chrome Developers](https://developer.chrome.com).

**Note: Samples for Manifest V3 are still being prepared. In the mean time, consider referring to [\_archive/mv2/](_archive/mv2/).**

## Samples

The directory structure is as follows:

- [api-samples/](api-samples/) - extensions focused on a single API package
- [functional-samples/](functional-samples/) - full featured extensions spanning multiple API packages
- [\_archive/apps/](_archive/apps/) - deprecated Chrome Apps platform (not listed below)
- [\_archive/mv2/](_archive/mv2/) - resources for manifest version 2

To experiment with these samples, please clone this repo and use 'Load Unpacked Extension'.
Read more on [Development Basics](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked).

<table>
  <thead>
    <tr>
      <th>Sample</th>
      <th>Calls</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="vertical-align:top;">
        Hello Extensions<br>
        <a href="functional-samples/tutorial.hello-world"><code>tutorial.hello-world</code></a>
      </td>
      <td  style="vertical-align:top;">
        <ul>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/action/#popup">Extension popup</a></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td style="vertical-align:top;">
        Page Redder <br>
        <a href="functional-samples/sample.page-redder"><code>sample.page-redder</code></a>
      </td>
      <td  style="vertical-align:top;">
        <ul>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/action/#event-onClicked">action.onClicked</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/scripting/#method-executeScript">scripting.executeScript</a></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td style="vertical-align:top;">
         My Bookmarks <br>
        <a href="functional-samples/sample.bookmarks"><code>sample.bookmarks</code></a>
      </td>
      <td  style="vertical-align:top;">
        <ul>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/bookmarks/#method-create">bookmarks.create</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/bookmarks/#method-getTree">bookmarks.getTree</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/bookmarks/#method-remove">bookmarks.remove</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/bookmarks/#method-update">bookmarks.update</a></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td style="vertical-align:top;">
         Chromium Milestones<br>
        <a href="functional-samples/sample.milestones"><code>sample.milestones</code></a>
      </td>
      <td  style="vertical-align:top;">
        <ul>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/action/#manifest">default_popup</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/tabs/#method-query">tabs.query</a></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td style="vertical-align:top;">
        Cookie Clearer <br>
        <a href="api-samples/cookies/cookie-clearer"><code>api-samples/cookies/cookie-clearer</code></a>
      </td>
      <td  style="vertical-align:top;">
        <ul>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/cookies/#method-getAll">cookies.getAll</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/cookies/#method-remove">cookies.remove</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/tabs/#method-query">tabs.query</a></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td style="vertical-align:top;">
        Omnibox - New Tab Search <br>
        <a href="api-samples/omnibox/new-tab-search"><code>api-samples/omnibox/new-tab-search</code></a>
      </td>
      <td  style="vertical-align:top;">
        <ul>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/omnibox/#event-onInputEntered">omnibox.onInputEntered</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/tabs/#method-create">tabs.create</a></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td style="vertical-align:top;">
        Web Accessible Resources <br>
        <a href="api-samples/web-accessible-resources"><code>api-samples/web-accessible-resources</code></a>
      </td>
      <td style="vertical-align:top;">
        <ul>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/action/#event-onClicked">action.onClicked</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/runtime/#method-getURL">runtime.getURL</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/runtime/#event-onInstalled">runtime.onInstalled</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/runtime/#type-OnInstalledReason">runtime.onInstalledReason</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/tabs/#method-create">tabs.create</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/mv3/manifest/web_accessible_resources/">web_accessible_resources</a></li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

## Contributing

Please see [the CONTRIBUTING file](/CONTRIBUTING.md) for information on contributing to the `chrome-extensions-samples` project.

## License

`chrome-extensions-samples` are authored by Google and are licensed under the [Apache License, Version 2.0](/LICENSE).
