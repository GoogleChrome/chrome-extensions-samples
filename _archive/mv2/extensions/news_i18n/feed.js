function reportHeight() {
  var msg = JSON.stringify({type:"size", size:document.body.offsetHeight});
  parent.postMessage(msg, "*");
}

function frameLoaded() {
  var links = document.getElementsByTagName("A");
  for (i = 0; i < links.length; i++) {
    var klass = links[i].klassName;
    if (klass != "item_title" && klass != "open_box") {
      links[i].addEventListener("click", showStory);
    }
  }
  window.addEventListener("message", messageHandler);
}

function showStory(event) {
  var href = event.currentTarget.href;
  parent.postMessage(JSON.stringify({type:"show", url:href}), "*");
  event.preventDefault();
}

function messageHandler(event) {
  reportHeight();
}

// Feed URL.
var feedUrl = chrome.i18n.getMessage('newsUrl') + '/?output=rss';

// The XMLHttpRequest object that tries to load and parse the feed.
var req;

function main() {
  req = new XMLHttpRequest();
  req.onload = handleResponse;
  req.onerror = handleError;
  req.open("GET", feedUrl, true);
  req.send(null);
}

// Handles feed parsing errors.
function handleFeedParsingFailed(error) {
  var feed = document.getElementById("feed");
  feed.klassName = "error";
  feed.innerText = chrome.i18n.getMessage("error", error);
}

// Handles errors during the XMLHttpRequest.
function handleError() {
  handleFeedParsingFailed(chrome.i18n.getMessage('failed_to_fetch_rss'));
}

// Handles parsing the feed data we got back from XMLHttpRequest.
function handleResponse() {
  var doc = req.responseXML;
  if (!doc) {
    handleFeedParsingFailed(chrome.i18n.getMessage('not_a_valid_feed'));
    return;
  }
  buildPreview(doc);
}

// The maximum number of feed items to show in the preview.
var maxFeedItems = 5;

// Where the more stories link should navigate to.
var moreStoriesUrl;

function buildPreview(doc) {
  // Get the link to the feed source.
  var link = doc.getElementsByTagName("link");
  var parentTag = link[0].parentNode.tagName;
  if (parentTag != "item" && parentTag != "entry") {
    moreStoriesUrl = link[0].textContent;
  }

  // Setup the title image.
  var images = doc.getElementsByTagName("image");
  var titleImg;
  if (images.length != 0) {
    var urls = images[0].getElementsByTagName("url");
    if (urls.length != 0) {
      titleImg = urls[0].textContent;
    }
  }
  var img = document.getElementById("title");
  if (titleImg) {
    img.src = titleImg;
    if (moreStoriesUrl) {
      document.getElementById("title_a").addEventListener("click", moreStories);
    }
  } else {
    img.style.display = "none";
  }

  // Construct the iframe's HTML.
  var iframe_src = "<!doctype html><html><head><script>" +
                   document.getElementById("iframe_script").textContent + "<" +
                   "/script></head><body onload='frameLoaded();' " +
                   "style='padding:0px;margin:0px;'>";

  var feed = document.getElementById("feed");
  var entries = doc.getElementsByTagName('entry');
  if (entries.length == 0) {
    entries = doc.getElementsByTagName('item');
  }
  var count = Math.min(entries.length, maxFeedItems);
  for (var i = 0; i < count; i++) {
    item = entries.item(i);

    // Grab the title for the feed item.
    var itemTitle = item.getElementsByTagName('title')[0];
    if (itemTitle) {
      itemTitle = itemTitle.textContent;
    } else {
      itemTitle = chrome.i18n.getMessage("unknown_title");
    }

    // Grab the description.
    var itemDesc = item.getElementsByTagName('description')[0];
    if (!itemDesc) {
      itemDesc = item.getElementsByTagName('summary')[0];
      if (!itemDesc) {
        itemDesc = item.getElementsByTagName('content')[0];
      }
    }
    if (itemDesc) {
      itemDesc = itemDesc.childNodes[0].nodeValue;
    } else {
      itemDesc = '';
    }

    var item = document.createElement("div");
    item.klassName = "item";
    var box = document.createElement("div");
    box.klassName = "open_box";
    box.addEventListener("click", showDesc);
    item.appendChild(box);

    var title = document.createElement("a");
    title.klassName = "item_title";
    title.innerText = itemTitle;
    title.addEventListener("click", showDesc);
    item.appendChild(title);

    var desc = document.createElement("iframe");
    desc.scrolling = "no";
    desc.klassName = "item_desc";
    item.appendChild(desc);
    feed.appendChild(item);

    // The story body is created as an iframe with a data: URL in order to
    // isolate it from this page and protect against XSS.  As a data URL, it
    // has limited privileges and must communicate back using postMessage().
    desc.src="data:text/html," + iframe_src + itemDesc + "</body></html>";
  }

  if (moreStoriesUrl) {
    var more = document.createElement("a");
    more.klassName = "more";
    more.innerText = chrome.i18n.getMessage("more_stories");
    more.addEventListener("click", moreStories);
    feed.appendChild(more);
  }
}

// Show |url| in a new tab.
function showUrl(url) {
  // Only allow http and https URLs.
  if (url.indexOf("http:") != 0 && url.indexOf("https:") != 0) {
    return;
  }
  chrome.tabs.create({url: url});
}

function moreStories(event) {
  showUrl(moreStoriesUrl);
}

function showDesc(event) {
  var item = event.currentTarget.parentNode;
  var items = document.getElementsByClassName("item");
  for (var i = 0; i < items.length; i++) {
    var iframe = items[i].getElementsByClassName("item_desc")[0];
    if (items[i] == item && items[i].klassName == "item") {
      items[i].klassName = "item opened";
      iframe.contentWindow.postMessage("reportHeight", "*");
    } else {
      items[i].klassName = "item";
      iframe.style.height = "0px";
    }
  }
}

function iframeMessageHandler(e) {
  // Only listen to messages from one of our own iframes.
  var iframes = document.getElementsByTagName("IFRAME");
  for (var i = 0; i < iframes.length; i++) {
    if (iframes[i].contentWindow == e.source) {
      var msg = JSON.parse(e.data);
      if (msg) {
        if (msg.type == "size") {
          iframes[i].style.height = msg.size + "px";
        } else if (msg.type == "show") {
          var url = msg.url;
          if (url.indexOf(chrome.i18n.getMessage('newsUrl')) == 0) {
            // If the URL is a redirect URL, strip of the destination and go to
            // that directly.  This is necessary because the Google news
            // redirector blocks use of the redirects in this case.
            var index = url.indexOf("&url=");
            if (index >= 0) {
              url = url.substring(index + 5);
              index = url.indexOf("&");
              if (index >= 0)
                url = url.substring(0, index);
            }
          }
          showUrl(url);
        }
      }
      return;
    }
  }
}

window.addEventListener("message", iframeMessageHandler);
window.addEventListener("DOMContentLoaded", main);
