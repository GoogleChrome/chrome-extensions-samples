// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Intended to be run as a script on the old samples page, to
 * extract a list of samples and render as a Markdown table.
 */

var sampleHeadings = Array.from(document.querySelectorAll('main h2'));

var samples = sampleHeadings2.map((heading) => {
  const title = heading.textContent;

  const link = heading.querySelector('a');
  const href = link.href;

  const expectedHrefPrefix = 'https://developer.chrome.com/extensions/examples/'
  let id = '';
  if (href.startsWith(expectedHrefPrefix)) {
    id = href.substr(expectedHrefPrefix.length).replace(/\.zip$/, '');
  } else {
    console.warn('bad href', href);
  }

  let notes = '';

  // probably a TEXT node
  let curr = heading;
  for (;;) {
    curr = curr.nextSibling;
    if (!(curr instanceof Text)) {
      break;
    }
    notes += curr.textContent;
  }

  notes = notes.trim();
  notes = notes.replace(/\s+/g, ' ');

  // curr probably points to Calls: now

  const callNodes = Array.from(curr.querySelectorAll('ul li code'));
  const calls = callNodes.map((node) => node.textContent);

  return {title, id, notes, calls};
});

var formatCallsList = (calls) => {
  const parts = calls.map((call) => `<li>${call}</li>`);
  return `<ul>${parts.join('')}</ul>`;
};

var formatRow = (sample) => {
  return `[${sample.title}](${sample.id})<br />${sample.notes} | ${formatCallsList(sample.calls)}`;
};

var formatTable = (all) => {
  return `Sample | Calls\n--- | ---\n${all.map(formatRow).join('\n')}`;
};