/**
 * Copyright (c) 2010 The Chromium Authors. All rights reserved.  Use of this
 * source code is governed by a BSD-style license that can be found in the
 * LICENSE file.
 */

/**
 * @fileoverview This file retrieves news feed and shows news in pop-up
 * page according to country, topics and no. of stories selected in the
 * option page.
 */

// Store value retrieved from locale.
var moreStoriesLocale = chrome.i18n.getMessage('more_stories') + ' \u00BB ';
var directionLocale = chrome.i18n.getMessage('direction');

// Feed URL.
var feedUrl = DEFAULT_NEWS_URL;

//The XMLHttpRequest object that tries to load and parse the feed.
var req;

/**
 * Sends request to Google News server
 */
function main() {
  req = new XMLHttpRequest();
  req.onload = handleResponse;
  req.onerror = handleError;
  req.open('GET', feedUrl, true);
  req.send(null);
}

/**
 * Handles feed parsing errors.
 * @param {String} error The localized error message.
 */
function handleFeedParsingFailed(error) {
  var feed = $('feed');
  $('noStories').style.display = 'none';
  feed.className = 'error';
  feed.innerText = error;
}

/**
 * Handles errors during the XMLHttpRequest.
 */
function handleError() {
  handleFeedParsingFailed(chrome.i18n.getMessage('fetchError'));
  $('topics').style.display = 'none';
}

/**
 * Parses the feed response.
 */
function handleResponse() {
  var doc = req.responseXML;
  if (!doc) {
    handleFeedParsingFailed(chrome.i18n.getMessage('wrongTopic'));
    var img = $('title');
    if(!img.src) {
      img.src = "/images/news.gif";
    }

    document.querySelector('body').style.minHeight = 0;
    return;
  }
  buildPreview(doc);
}

// Stores no. of stories selected in options page.
var maxFeedItems = (window.localStorage.getItem('count')) ?
    window.localStorage.getItem('count') : 5;

// Where the more stories link should navigate to.
var moreStoriesUrl;

/**
 * Generates news iframe in pop-up page by parsing retrieved feed.
 * @param {HTMLDocument} doc HTML Document received in feed.
 */
function buildPreview(doc) {
  // Get the link to the feed source.
  var link = doc.querySelector('link');
  var parentTag = link.parentNode.tagName;
  if (parentTag != 'item' && parentTag != 'entry') {
    moreStoriesUrl = link.textContent;
  }

  // Setup the title image.
  var image = doc.querySelector('image');
  var titleImg;

  // Stores whether language script is Right to Left or not for setting style
  // of share buttons(Facebook, Twitter and Google Buzz) in iframe.
  var isRtl = 'lTR';

  if (image) {
    var url = image.querySelector('url');
    if (url) {
      titleImg = url.textContent;

      // Stores URL of title image to be shown on pop-up page.
      var titleImgUrl = titleImg;
      var pattern = /ar_/gi;
      var result = titleImgUrl.match(pattern);
      if (result != null || titleImgUrl == ISRAEL_IMAGE_URL) {
        isRtl = 'rTL';
      }
    }
  }

  var img = $('title');
  if (titleImg) {
    img.src = titleImg;
    if (moreStoriesUrl) {
      $('title_a').addEventListener('click', moreStories);
    }
  } else {
    img.style.display = 'none';
  }

  // Construct the iframe's HTML.
  var iframe_src = '<!doctype html><html><head><script>' +
                   $('iframe_script').textContent + '<' +
                   '/script><style> ' +
                   '.rTL {margin-right: 102px; text-align: right;} ' +
                   '.lTR {margin-left: 102px; text-align: left;} ' +
                   '</style></head><body onload="frameLoaded();" ' +
                   'style="padding:0px;margin:0px;">';

  var feed = $('feed');
  feed.className = '';
  var entries = doc.getElementsByTagName('entry');
  if (entries.length == 0) {
    entries = doc.getElementsByTagName('item');
  }
  var count = Math.min(entries.length, maxFeedItems);

  // Stores required height by pop-up page.
  var minHeight = 19;
  minHeight = (minHeight * (count - 1)) + 100;
  document.querySelector('body').style.minHeight = minHeight + 'px';
  $('feed').innerHTML = '';

  for (var i = 0; i < count; i++) {
    item = entries.item(i);

    // Grab the title for the feed item.
    var itemTitle = item.querySelector('title');
    if (itemTitle) {
      itemTitle = itemTitle.textContent;
    } else {
      itemTitle = 'Unknown title';
    }

    // Grab the description.
    var itemDesc = item.querySelector('description');
    if (!itemDesc) {
      itemDesc = item.querySelector('summary');
      if (!itemDesc) {
        itemDesc = item.querySelector('content');
      }
    }
    if (itemDesc) {
      itemDesc = itemDesc.childNodes[0].nodeValue;

    } else {
      itemDesc = '';
    }
    var itemLink = item.querySelector('link');
    if (itemLink) {
      itemLink = itemLink.textContent;
    } else {
      itemLink = 'Unknown itemLink';
    }
    var item = document.createElement('div');
    item.className = 'item';
    var box = document.createElement('div');
    box.className = 'open_box';
    box.addEventListener('click', showDesc);
    item.appendChild(box);

    var title = document.createElement('a');
    title.className = 'item_title';
    title.innerText = itemTitle;
    title.addEventListener('click', showDesc);
    item.appendChild(title);

    var desc = document.createElement('iframe');
    desc.scrolling = 'no';
    desc.className = 'item_desc';
    item.appendChild(desc);
    feed.appendChild(item);

    // Adds share buttons images(Facebook, Twitter and Google Buzz).
    itemDesc += "<div class = '" + isRtl + "'>";
    itemDesc += "<a style='cursor: pointer' id='fb' " +
      "onclick='openNewsShareWindow(this.id,\"" + itemLink + "\")'>" +
      "<img src='" + chrome.extension.getURL('/images/fb.png') + "'/></a>";
    itemDesc += " <a style='cursor: pointer' id='twitter' " +
      "onclick='openNewsShareWindow(this.id,\"" + itemLink + "\")'>" +
      "<img src='" + chrome.extension.getURL('/images/twitter.png') + "'/></a>";
    itemDesc += " <a style='cursor: pointer' id='buzz' " +
      "onclick='openNewsShareWindow(this.id,\"" + itemLink + "\")'>" +
      "<img src='" + chrome.extension.getURL('/images/buzz.png') + "'/></a>";
    itemDesc += '</div>';

    // The story body is created as an iframe with a data: URL in order to
    // isolate it from this page and protect against XSS.  As a data URL, it
    // has limited privileges and must communicate back using postMessage().
    desc.src = 'data:text/html;charset=utf-8,' + iframe_src + itemDesc +
      '</body></html>';
  }
  if (moreStoriesUrl && entries.length != 0) {
    var more = document.createElement('a');
    more.className = 'more';
    more.innerText = moreStoriesLocale;
    more.addEventListener('click', moreStories);
    feed.appendChild(more);
  }
  setStyleByLang(titleImgUrl);

  // Checks whether feed retrieved has news story or not. If not, then shows
  // error message accordingly.
  if (entries.length == 0) {
    $('noStories').innerText = chrome.i18n.getMessage('noStory');
    $('noStories').style.display = 'block';
  } else {
    $('noStories').style.display = 'none';
  }
}

/**
 * Show |url| in a new tab.
 * @param {String} url The news URL.
 */
function showUrl(url) {
  // Only allow http and https URLs.
  if (url.indexOf('http:') != 0 && url.indexOf('https:') != 0) {
    return;
  }
  chrome.tabs.create({url: url});
}

/**
 * Redirects to Google news site for more stories.
 * @param {Object} event Onclick event.
 */
function moreStories(event) {
  showUrl(moreStoriesUrl);
}

/**
 * Shows description of the news when users clicks on news title.
 * @param {Object} event Onclick event.
 */
function showDesc(event) {
  var item_ = event.currentTarget.parentNode;
  var items = document.getElementsByClassName('item');
  for (var i = 0, item; item = items[i]; i++) {
    var iframe = item.querySelector('.item_desc');
    if (item == item_ && item.className == 'item') {
      item.className = 'item opened';
      iframe.contentWindow.postMessage('reportHeight', '*');
    } else {
      item.className = 'item';
      iframe.style.height = '0px';
    }
  }
}

/**
 * Handles messages between different iframes and sets the display of iframe.
 * @param {Object} e Onmessage event.
 */
function iframeMessageHandler(e) {
  var iframes = document.getElementsByTagName('IFRAME');
  for (var i = 0, iframe; iframe = iframes[i]; i++) {
    if (iframe.contentWindow == e.source) {
      var msg = JSON.parse(e.data);
      if (msg) {
        if (msg.type == 'size') {
          iframe.style.height = msg.size + 'px';
        } else if (msg.type == 'show') {
          var url = msg.url;
          if (url.indexOf('http://news.google.com') == 0) {
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

/**
 * Saves last viewed topic by user in local storage on unload of pop-up page.
 */
function saveLastTopic() {
  var topicVal = $('topics').value;
  window.localStorage.setItem('lastTopic', topicVal);
}

/**
 * Sets the URL according to selected topic(or default topic), then retrieves
 * feed and sets pop-up page.
 */
function getNewsByTitle() {
  var country = window.localStorage.getItem('country');
  country = (country == 'noCountry' || !country) ? '' : country;

  // Sets direction of topics showed under dropdown in pop-up page according
  // to set language in browser.
  $('topics').className = (directionLocale == 'rtl') ? 'topicsRTL' :
      'topicsLTR';

  var topicVal = $('topics').value;

  // Sets Feed URL in case of custom topic selected.
  var keywords = JSON.parse(window.localStorage.getItem('keywords'));
  var isFound = false;
  if (keywords) {
    for (i = 0; i < keywords.length; i++) {
      if (topicVal == keywords[i]) {
      isFound = true;
      feedUrl = DEFAULT_NEWS_URL + '&cf=all&ned=' + country + '&q=' + topicVal +
          '&hl=' + country;
      break;
      }
    }
  }
  if (!isFound) {
    feedUrl = DEFAULT_NEWS_URL + '&cf=all&ned=' + country +
        '&topic=' + topicVal;
  }
  main();
}

/**
 * Shows topic list retrieved from local storage(if any),else shows
 * default topics list.
 */
function getTopics() {
  var topics = JSON.parse(window.localStorage.getItem('topics'));
  var keywords = JSON.parse(window.localStorage.getItem('keywords'));
  var element = $('topics');

  // Sets all topics as default list if no list is found from local storage.
  if (!topics && !keywords) {
    topics = [' ','n','w','b','t','e','s','m','po'];
  }

  if (topics) {
    for (var i = 0; i < (topics.length); i++) {
      var val = (topics[i] == ' ') ? '1' : topics[i];
      element.options[element.options.length] = new Option(
          chrome.i18n.getMessage(val), topics[i]);
    }
  }

  // Shows custom topics in list(if any).
  if (keywords) {
    for (i = 0; i < (keywords.length); i++) {
      element.options[element.options.length] = new Option(keywords[i],
          keywords[i]);
    }
  }

  $('option_link').innerText = chrome.i18n.getMessage('options');

  var topicVal = window.localStorage.getItem('lastTopic');
  if (topicVal) {
    $('topics').value = topicVal;
  }
}

window.addEventListener('message', iframeMessageHandler);
