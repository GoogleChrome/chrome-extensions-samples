// Event listener for clicks on links in a browser action popup.
// Open the link in a new tab of the current window.
function onAnchorClick(event) {
    chrome.tabs.create({ url: event.srcElement.href });
    return false;
  }
  
// Use the get method to get a list of most visited sites. 
  chrome.topSites.get()
  .then((mostVisitedURLs) => {
     if(mostVisitedURLs){
        var popupDiv = document.getElementById('mostVisited_div');
        var ol = popupDiv.appendChild(document.createElement('ol'));

        for (var i = 0; i < mostVisitedURLs.length; i++) {
            var li = ol.appendChild(document.createElement('li'));
            var a = li.appendChild(document.createElement('a'));
            a.href = mostVisitedURLs[i].url;
            a.appendChild(document.createTextNode(mostVisitedURLs[i].title));
            a.addEventListener('click', onAnchorClick);
          }
     }

  })
  .catch((err) => {
    console.log(err)
  })

  //--------------------------------------------------------
  // Alternatively you can use a callback as well
  //--------------------------------------------------------
  
//   Given an array of URLs, build a DOM list of these URLs in the
//   browser action popup.
/*
  function buildPopupDom(mostVisitedURLs) {
    var popupDiv = document.getElementById('mostVisited_div');
    var ol = popupDiv.appendChild(document.createElement('ol'));
  
    for (var i = 0; i < mostVisitedURLs.length; i++) {
      var li = ol.appendChild(document.createElement('li'));
      var a = li.appendChild(document.createElement('a'));
      a.href = mostVisitedURLs[i].url;
      a.appendChild(document.createTextNode(mostVisitedURLs[i].title));
      a.addEventListener('click', onAnchorClick);
    }
  }
*/
// pass in a callback to the get method.
//  chrome.topSites.get(buildPopupDom);