function setScreenshotUrl(url) {
  document.getElementById('target').src = url;
}

chrome.runtime.onMessage.addListener(function (request) {
  if (request.msg === 'screenshot') {
    setScreenshotUrl(request.data);
  }
});
