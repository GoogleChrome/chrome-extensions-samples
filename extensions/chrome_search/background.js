// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var currentRequest = null;

chrome.omnibox.onInputChanged.addListener(
  function(text, suggest) {
    if (currentRequest != null) {
      currentRequest.onreadystatechange = null;
      currentRequest.abort();
      currentRequest = null;
    }

    updateDefaultSuggestion(text);
    if (text == '' || text == 'halp')
      return;

    currentRequest = search(text, function(xml) {
      var results = [];
      var entries = xml.getElementsByTagName("entry");

      for (var i = 0, entry; i < 5 && (entry = entries[i]); i++) {
        var path = entry.getElementsByTagName("file")[0].getAttribute("name");
        var line =
            entry.getElementsByTagName("match")[0].getAttribute("lineNumber");
        var file = path.split("/").pop();

        var description = '<url>' + file + '</url>';
        if (/^file:/.test(text)) {
          description += ' <dim>' + path + '</dim>';
        } else {
          var content = entry.getElementsByTagName("content")[0].textContent;

          // There can be multiple lines. Kill all the ones except the one that
          // contains the first match. We can ocassionally fail to find a single
          // line that matches, so we still handle multiple lines below.
          var matches = content.split(/\n/);
          for (var j = 0, match; match = matches[j]; j++) {
            if (match.indexOf('<b>') > -1) {
              content = match;
              break;
            }
          }

          // Replace any extraneous whitespace to make it look nicer.
          content = content.replace(/[\n\t]/g, ' ');
          content = content.replace(/ {2,}/g, ' ');

          // Codesearch wraps the result in <pre> tags. Remove those if they're
          // still there.
          content = content.replace(/<\/?pre>/g, '');

          // Codesearch highlights the matches with 'b' tags. Replaces those
          // with 'match'.
          content = content.replace(/<(\/)?b>/g, '<$1match>');

          description += ' ' + content;
        }

        results.push({
          content: path + '@' + line,
          description: description
        });
      }

      suggest(results);
    });
  }
);

function resetDefaultSuggestion() {
  chrome.omnibox.setDefaultSuggestion({
    description: '<url><match>src:</match></url> Search Chromium source'
  });
}

resetDefaultSuggestion();

function updateDefaultSuggestion(text) {
  var isRegex = /^re:/.test(text);
  var isFile = /^file:/.test(text);
  var isHalp = (text == 'halp');
  var isPlaintext = text.length && !isRegex && !isFile && !isHalp;

  var description = '<match><url>src</url></match><dim> [</dim>';
  description +=
      isPlaintext ? ('<match>' + text + '</match>') : 'plaintext-search';
  description += '<dim> | </dim>';
  description += isRegex ? ('<match>' + text + '</match>') : 're:regex-search';
  description += '<dim> | </dim>';
  description += isFile ? ('<match>' + text + '</match>') : 'file:filename';
  description += '<dim> | </dim>';
  description += isHalp ? '<match>halp</match>' : 'halp';
  description += '<dim> ]</dim>';

  chrome.omnibox.setDefaultSuggestion({
    description: description
  });
}

chrome.omnibox.onInputStarted.addListener(function() {
  updateDefaultSuggestion('');
});

chrome.omnibox.onInputCancelled.addListener(function() {
  resetDefaultSuggestion();
});

function search(query, callback) {
  if (query == 'halp')
    return;

  if (/^re:/.test(query))
    query = query.substring('re:'.length);
  else if (/^file:/.test(query))
    query = 'file:"' + query.substring('file:'.length) + '"';
  else
    query = '"' + query + '"';

  var url = "https://code.google.com/p/chromium/codesearch#search/&type=cs&q=" + query +
      "&exact_package=chromium&type=cs";
  var req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.setRequestHeader("GData-Version", "2");
  req.onreadystatechange = function() {
    if (req.readyState == 4) {
      callback(req.responseXML);
    }
  }
  req.send(null);
  return req;
}

function getUrl(path, line) {
  var url = "https://code.google.com/p/chromium/codesearch#" + path
      "&sq=package:chromium";
  if (line)
    url += "&l=" + line;
  return url;
}

function getEntryUrl(entry) {
  return getUrl(
      entry.getElementsByTagName("file")[0].getAttribute("name"),
      entry.getElementsByTagName("match")[0].getAttribute("lineNumber"));
  return url;
}

function navigate(url) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.update(tabs[0].id, {url: url});
  });
}

chrome.omnibox.onInputEntered.addListener(function(text) {
  // TODO(aa): We need a way to pass arbitrary data through. Maybe that is just
  // URL?
  if (/@\d+\b/.test(text)) {
    var chunks = text.split('@');
    var path = chunks[0];
    var line = chunks[1];
    navigate(getUrl(path, line));
  } else if (text == 'halp') {
    // TODO(aa)
  } else {
    navigate("https://code.google.com/p/chromium/codesearch#search/&type=cs" +
             "&q=" + text +
             "&exact_package=chromium&type=cs");
  }
});
