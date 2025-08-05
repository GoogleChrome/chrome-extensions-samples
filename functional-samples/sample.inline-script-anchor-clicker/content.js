// get the anchor element with javascript: scheme in demo page
const el = document.getElementById('demo-anchor-with-js-scheme');

// dispatch a mouse event to trigger the click event
window.dispatchEvent(new MouseEvent('proxy-click', { relatedTarget: el }));
