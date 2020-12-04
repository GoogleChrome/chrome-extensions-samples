// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function matches(rule, item) {
  if (rule.matcher == 'js')
    return eval(rule.match_param);
  if (rule.matcher == 'hostname') {
    var link = document.createElement('a');
    link.href = item.url.toLowerCase();
    var host = (rule.match_param.indexOf(':') < 0) ? link.hostname : link.host;
    return (host.indexOf(rule.match_param.toLowerCase()) ==
            (host.length - rule.match_param.length));
  }
  if (rule.matcher == 'default')
    return item.filename == rule.match_param;
  if (rule.matcher == 'url-regex')
    return (new RegExp(rule.match_param)).test(item.url);
  if (rule.matcher == 'default-regex')
    return (new RegExp(rule.match_param)).test(item.filename);
  return false;
}

chrome.downloads.onDeterminingFilename.addListener(function(item, __suggest) {
  function suggest(filename, conflictAction) {
    __suggest({filename: filename,
               conflictAction: conflictAction,
               conflict_action: conflictAction});
    // conflict_action was renamed to conflictAction in
    // https://chromium.googlesource.com/chromium/src/+/f1d784d6938b8fe8e0d257e41b26341992c2552c
    // which was first picked up in branch 1580.
  }
  var rules = localStorage.rules;
  try {
    rules = JSON.parse(rules);
  } catch (e) {
    localStorage.rules = JSON.stringify([]);
  }
  for (var index = 0; index < rules.length; ++index) {
    var rule = rules[index];
    if (rule.enabled && matches(rule, item)) {
      if (rule.action == 'overwrite') {
        suggest(item.filename, 'overwrite');
      } else if (rule.action == 'prompt') {
        suggest(item.filename, 'prompt');
      } else if (rule.action == 'js') {
        eval(rule.action_js);
      }
      break;
    }
  }
});
