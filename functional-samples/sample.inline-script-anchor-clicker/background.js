function clickElement(elementSelector) {
  // get the element by selector
  let el = document.querySelector(elementSelector);
  if (el) {
    el.click();
  }
}

chrome.runtime.onMessage.addListener(function (request, sender) {
  if (request.type === 'click') {
    // execute the clickElement function in the MAIN world
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      function: clickElement,
      args: [request.element],
      world: 'MAIN'
    });
  }
});
