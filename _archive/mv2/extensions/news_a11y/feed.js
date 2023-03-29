// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Feed
var feedUrl = 'https://news.google.com/?output=rss';

// The XMLHttpRequest object that tries to load and parse the feed.
var req;

function main() {
  req = new XMLHttpRequest();
  req.onload = handleResponse;
  req.onerror = handleError;
  req.open('GET', feedUrl, true);
  req.send(null);
}

// Handles feed parsing errors.
function handleFeedParsingFailed(error) {
  var feed = document.getElementById('feed');
  feed.className = 'error';
  feed.innerText = 'Error: ' + error;
}

// Handles errors during the XMLHttpRequest.
function handleError() {
  handleFeedParsingFailed('Failed to fetch RSS feed.');
}

// Handles parsing the feed data we got back from XMLHttpRequest.
function handleResponse() {
  var doc = req.responseXML;
  if (!doc) {
    handleFeedParsingFailed('Not a valid feed.');
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
  var link = doc.getElementsByTagName('link');
  var parentTag = link[0].parentNode.tagName;
  if (parentTag != 'item' && parentTag != 'entry') {
    moreStoriesUrl = link[0].textContent;
  }

  // Setup the title image.
  var images = doc.getElementsByTagName('image');
  var titleImg;
  if (images.length != 0) {
    var urls = images[0].getElementsByTagName('url');
    if (urls.length != 0) {
      titleImg = urls[0].textContent;
    }
  }
  var img = document.getElementById('title');
  // Listen for mouse and key events
  if (titleImg) {
    img.src = titleImg;
    if (moreStoriesUrl) {
      document.getElementById('title_a').addEventListener('click',
          moreStories);
      document.getElementById('title_a').addEventListener('keydown',
                                         function(event) {
                                           if (event.keyCode == 13) {
                                             moreStories(event);
                                           }});
    }
  } else {
    img.style.display = 'none';
  }

  // Construct the iframe's HTML.
  var iframe_src = `<!doctype html><html><head><title>f</title>
    <script src="${chrome.runtime.getURL('/feed_iframe.js')}"></script>
    <link href="${chrome.runtime.getURL('/feed_iframe.css')} rel="stylesheet" type="text/css">
    </head><body>`;


  var feed = document.getElementById('feed');
  // Set ARIA role indicating the feed element has a tree structure
  feed.setAttribute('role', 'tree');

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
      itemTitle = 'Unknown title';
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

    var item = document.createElement('div');
    item.className = 'item';
    var box = document.createElement('div');
    box.className = 'open_box';
    box.addEventListener('click', showDesc);
    // Disable focusing on box image separately from rest of tree item
    box.tabIndex = -1;
    item.appendChild(box);

    var title = document.createElement('a');
    title.className = 'item_title';
    // Give title an ID for use with ARIA
    title.id = 'item' + i;
    title.innerText = itemTitle;
    title.addEventListener('click', showDesc);
    title.addEventListener('keydown', keyHandlerShowDesc);
    // Update aria-activedescendant property in response to focus change
    // within the tree
    title.addEventListener('focus', function(event) {
                                      feed.setAttribute(
                                        'aria-activedescendant', this.id);
                                    });
    // Enable keyboard focus on the item title element
    title.tabIndex = 0;
    // Set ARIA role role indicating that the title element is a node in the
    // tree structure
    title.setAttribute('role', 'treeitem');
    // Set the ARIA state indicating this tree item is currently collapsed.
    title.setAttribute('aria-expanded', 'false');
    // Set ARIA property indicating that all items are at the same hierarchical
    // level (no nesting)
    title.setAttribute('aria-level', '1');
    item.appendChild(title);

    var desc = document.createElement('iframe');
    desc.scrolling = 'no';
    desc.className = 'item_desc';
    // Disable keyboard focus on elements in iFrames that have not been
    // displayed yet
    desc.tabIndex = -1;
    // The story body is created as an iframe with a data: URL in order to
    // isolate it from this page and protect against XSS.  As a data URL, it
    // has limited privileges and must communicate back using postMessage().
    desc.src=`data:text/html,${iframe_src}${itemDesc.replace(/#/g,"")}</body></html>`;

    item.appendChild(desc);
    feed.appendChild(item);
  }

  if (moreStoriesUrl) {
    var more = document.createElement('a');
    more.className = 'more';
    more.innerText = 'More stories \u00BB';
    more.tabIndex = 0;
    more.addEventListener('click', moreStories);
    more.addEventListener('keydown', function(event) {
                                       if (event.keyCode == 13) {
                                         moreStories(event);
                                       }});
    feed.appendChild(more);
  }
}

// Show |url| in a new tab.
function showUrl(url) {
  // Only allow http and https URLs.
  if (!url.startsWith('http:') && !url.startsWith('https:'))
    return;

  chrome.tabs.create({url: url});
}

function moreStories(event) {
  showUrl(moreStoriesUrl);
}

function keyHandlerShowDesc(event) {
// Display content under heading when spacebar or right-arrow pressed
// Hide content when spacebar pressed again or left-arrow pressed
// Move to next heading when down-arrow pressed
// Move to previous heading when up-arrow pressed
  if (event.keyCode == 32) {
    showDesc(event);
  } else if ((this.parentNode.className == 'item opened') &&
           (event.keyCode == 37)) {
    showDesc(event);
  } else if ((this.parentNode.className == 'item') && (event.keyCode == 39)) {
    showDesc(event);
  } else if (event.keyCode == 40) {
    if (this.parentNode.nextSibling) {
      this.parentNode.nextSibling.children[1].focus();
    }
  } else if (event.keyCode == 38) {
    if (this.parentNode.previousSibling) {
      this.parentNode.previousSibling.children[1].focus();
    }
  }
}

function showDesc(event) {
  var item = event.currentTarget.parentNode;
  var items = document.getElementsByClassName('item');
  for (var i = 0; i < items.length; i++) {
    var iframe = items[i].getElementsByClassName('item_desc')[0];
    if (items[i] == item && items[i].className == 'item') {
      items[i].className = 'item opened';
      iframe.contentWindow.postMessage('reportHeight', '*');
      // Set the ARIA state indicating the tree item is currently expanded.
      items[i].getElementsByClassName('item_title')[0].
        setAttribute('aria-expanded', 'true');
      iframe.tabIndex = 0;
    } else {
      items[i].className = 'item';
      iframe.style.height = '0px';
      // Set the ARIA state indicating the tree item is currently collapsed.
      items[i].getElementsByClassName('item_title')[0].
        setAttribute('aria-expanded', 'false');
      iframe.tabIndex = -1;
    }
  }
}

function iframeMessageHandler(e) {
  // Only listen to messages from one of our own iframes.
  var iframes = document.getElementsByTagName('IFRAME');
  for (var i = 0; i < iframes.length; i++) {
    if (iframes[i].contentWindow == e.source) {
      var msg = JSON.parse(e.data);
      if (msg) {
        if (msg.type == 'size') {
          iframes[i].style.height = msg.size + 'px';
        } else if (msg.type == 'show') {
          var url = msg.url;
          if (url.startsWith('http://news.google.com')) {
            // If the URL is a redirect URL, strip of the destination and go to
            // that directly.  This is necessary because the Google news
            // redirector blocks use of the redirects in this case.
            var index = url.indexOf('&url=');
            if (index >= 0) {
              url = url.substring(index + 5);
              index = url.indexOf('&');
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

window.addEventListener('message', iframeMessageHandler);
document.addEventListener('DOMContentLoaded', main);
