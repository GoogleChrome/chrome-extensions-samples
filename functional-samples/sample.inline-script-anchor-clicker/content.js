// get the anchor element with javascript: scheme in demo page
const el = document.getElementById('demo-anchor-with-js-scheme');

// the function to get the CSS path of an element
const getCssPath = function (el) {
  if (!(el instanceof Element)) return;
  const path = [];
  while (el.nodeType === Node.ELEMENT_NODE) {
    var selector = el.nodeName.toLowerCase();
    if (el.id) {
      selector += '#' + el.id;
      path.unshift(selector);
      break;
    } else {
      let sib = el,
        nth = 1;
      while ((sib = sib.previousElementSibling)) {
        if (sib.nodeName.toLowerCase() == selector) nth++;
      }
      if (nth != 1) selector += ':nth-of-type(' + nth + ')';
    }
    path.unshift(selector);
    el = el.parentNode;
  }
  return path.join(' > ');
};
console.log(el);
if (el) {
  // send a message to the background script to click the element
  chrome.runtime.sendMessage({ type: 'click', element: getCssPath(el) });
}
