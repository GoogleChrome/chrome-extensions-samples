// chrome.app.runtime.onLaunched.addListener(function() {
  // chrome.app.window.create('index.html',
  //   { "id": "identitywin",
  //     "innerBounds": {
  //       "width": 454,
  //       "height": 540
  //     }
  //   });
// });

chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.create({
    active: true,
    url: "index.html"
  })
})