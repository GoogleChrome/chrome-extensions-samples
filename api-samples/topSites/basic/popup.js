// Event listener for clicks on links in an action popup.
// Open the link in a new tab of the current window.
function onAnchorClick(event) {
  chrome.tabs.create({ url: event.target.href });
  return false;
}

// Given an array of URLs, build a DOM list of these URLs in the action popup.
function buildPopupDom(mostVisitedURLs) {
  const popupDiv = document.getElementById('mostVisited_div');
  const ol = popupDiv.appendChild(document.createElement('ol'));

  for (let i = 0; i < mostVisitedURLs.length; i++) {
    const li = ol.appendChild(document.createElement('li'));
    const a = li.appendChild(document.createElement('a'));
    a.href = mostVisitedURLs[i].url;
    a.appendChild(document.createTextNode(mostVisitedURLs[i].title));
    a.addEventListener('click', onAnchorClick);
  }
}

window.onload = async () => {
  const mostVisitedURLs = await chrome.topSites.get();
  buildPopupDom(mostVisitedURLs);
};
