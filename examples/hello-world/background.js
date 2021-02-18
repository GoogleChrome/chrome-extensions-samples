// Extension event listeners are a little different from the patterns you may hav seen in DOM or
// Node.js APIs. Our event listener registration can be broken in to 4 distinct parts:
//
// * chrome      - the global namespace for extension APIs.
// * action      – the namespace of the specific API we want to use.
// * onClicked   - the event we want to subscribe to.
// * addListener - what we want to do with this event.
//
// See https://developer.chrome.com/docs/extensions/reference/events/ for additional details
chrome.action.onClicked.addListener(() => {

  // While we could have used `let url = "hello.html"`, using runtime.getURL is a bit more robust as
  // it gives you a full URL rather than just a path that Chrome must needs to be resolve
  // contextually at runtime.
  let url = chrome.runtime.getURL("hello.html");

  // Create a new tab and point it at our page's URL using JavaScript's object initializer
  // shorthand. For more information on this syntax see
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#new_notations_in_ecmascript_2015
  chrome.tabs.create({ url });
});
