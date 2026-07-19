// Copyright 2021 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

// Wrap the in an immediately invoked function expression (IIFE) in order to
// prevent local variables from polluting global scope
(function () {
  const GET_REPLACEMENTS_MESSAGE_ID = 'get-replacements';


  function buildReplacementRegex(source) {
    const output = [];
    for (let i = 0; i < source.length; i++) {
      if (!source[i]) { continue; }
      const [find, replace] = source[i];
      const sanitizedMatch = escapeRegExp(find);
      const findExp = new RegExp(`\\b${sanitizedMatch}\\b`, 'gi');
      output[i] = [findExp, replace];
    }
    return output;
  }

  // This may not cover all special characters used in regular repressions. For
  // example purposes only.
  var REGEXP_SPECIAL_CHARACTERS = /[.(){}^$*+?[\]\\]/g;
  /** Sanitize user input to prevent unexpected behavior during RegExp execution */
  function escapeRegExp(pattern) {
    return pattern.replace(REGEXP_SPECIAL_CHARACTERS, "\\$&")
  }

  /** Iterate through all text nodes and replace  */
  function replaceText(replacements) {
    const nodeIterator = document.createNodeIterator(document.body, NodeFilter.SHOW_TEXT);

    let node;
    while (node = nodeIterator.nextNode()) {
      for (let [find, replace] of replacements) {
        node.nodeValue = node.nodeValue.replace(find, replace);
      }
    }
  }

  // Get the patterns to replace from storage, then build a regex from them and
  // replace all text on the page.
  chrome.runtime.sendMessage({ id: GET_REPLACEMENTS_MESSAGE_ID })
    .then(function(data) {
      const replacementPatterns = buildReplacementRegex(data.patterns);
      replaceText(replacementPatterns);
    });

})()
