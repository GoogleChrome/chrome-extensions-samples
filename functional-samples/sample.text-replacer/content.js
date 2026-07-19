// Copyright 2021 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

// Replace text on the page using a static list of patterns
function textReplacer(replacements) {
  const replacementPatterns = buildReplacementRegex(replacements);
  replaceText(replacementPatterns);
}

function buildReplacementRegex(source) {
  const output = [];
  for (var i = 0; i < source.length; i++) {
    if (!source[i]) { continue; }
    const [find, replace] = source[i];
    const sanitizedMatch = escapeRegExp(find);
    const findExp = new RegExp(`\\b${sanitizedMatch}\\b`, 'gi');
    output[i] = [findExp, replace];
  }
  return output;
}

// Use var to avoid "Identifier 'REGEXP_SPECIAL_CHARACTERS' has already been
// declared" errors when running multiple times on the same page.
var REGEXP_SPECIAL_CHARACTERS = /[.(){}^$*+?[\]\\]/g;
/** Sanitize user input to prevent unexpected behavior during RegExp execution */
function escapeRegExp(pattern) {
  return pattern.replace(REGEXP_SPECIAL_CHARACTERS, "\\$&")
}

/** Iterate through all text nodes and replace  */
function replaceText(replacements) {
  let node;
  const nodeIterator = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT);
  while (node = nodeIterator.nextNode()) {
    for (let [find, replace] of replacements) {
      node.nodeValue = node.nodeValue.replace(find, replace);
    }
  }
}

// Replace text on the page using a list of patterns loaded from storage
chrome.storage.sync.get(['patterns'], function(data) {
  textReplacer(data.patterns);
});
