# Chrome Extensions samples

Official samples for Chrome Extensions and the Chrome Apps platform.
Note that Chrome Apps are deprecated—learn more [on the Chromium blog](https://blog.chromium.org/2020/08/changes-to-chrome-app-support-timeline.html).

For more information on extensions, see [Chrome Developers](https://developer.chrome.com).

**Note: Samples for Manifest V3 are still being prepared. In the mean time, consider refering to [mv2-archive/](mv2-archive/)**

## Samples

The directory structure is as follows:

* [api/](api/) - extensions focused on a single API package
* (To be added) [howto/](howto/) - extensions that show how to perform a particular task
* [tutorials/](tutorials/) - multi-step walkthroughs referenced inline in the docs
* [extensions/](extensions/) - full featured extensions spanning multiple API packages
* [apps/](apps/) - deprecated Chrome Apps platform (not listed below)
* [mv2-archive/](mv2-archive/) - resources for manifest version 2

To experiment with these samples, please clone this repo and use 'Load Unpacked Extension'.
Read more on [Getting Started](https://developer.chrome.com/extensions/getstarted).

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
        Hello World <br>
        <a href="examples/hello-world"><code>examples/hello-world</code></a>
      </td>
      <td  style="vertical-align:top;">
        <ul>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/action/#event-onClicked">action.onClicked</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/runtime/#method-getURL">runtime.getURL</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/tabs/#method-create">tabs.create</a></li>
        </ul>
      </td>
    </tr>
    <tr>
      <td style="vertical-align:top;">
        Cookie Clearer <br>
        <a href="api/cookies/cookie-clearer"><code>api/cookies/cookie-clearer</code></a>
      </td>
      <td  style="vertical-align:top;">
        <ul>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/cookies/#method-getAll">cookies.getAll</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/cookies/#method-remove">cookies.remove</a></li>
          <li><a href="https://developer.chrome.com/docs/extensions/reference/tabs/#method-query">tabs.query</a></li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>
