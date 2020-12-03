// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// TODO(wittman): Convert this extension to event pages once they work with
// the notifications API.  Currently it's not possible to restore the
// Notification object when event pages get reloaded.  See
// http://crbug.com/165276.

(function() {

var statusURL = "http://chromium-status.appspot.com/current?format=raw";
var statusHistoryURL =
  "http://chromium-status.appspot.com/allstatus?limit=20&format=json";
var pollFrequencyInMs = 30000;
var tryPollFrequencyInMs = 30000;

var prefs = new buildbot.PrefStore;

function updateBadgeOnErrorStatus() {
  chrome.browserAction.setBadgeText({text:"?"});
  chrome.browserAction.setBadgeBackgroundColor({color:[0,0,255,255]});
}

var lastNotification = null;
function notifyStatusChange(treeState, status) {
  if (lastNotification)
    lastNotification.close();

  lastNotification = new Notification("Tree is " + treeState, {
    icon: chrome.extension.getURL("icon.png"),
    body: status
  });
}

// The type parameter should be "open", "closed", or "throttled".
function getLastStatusTime(callback, type) {
  buildbot.requestURL(statusHistoryURL, "text", function(text) {
    var entries = JSON.parse(text);

    for (var i = 0; i < entries.length; i++) {
      if (entries[i].general_state == type) {
        callback(new Date(entries[i].date + " UTC"));
        return;
      }
    }
  }, updateBadgeOnErrorStatus);
}

function updateTimeBadge(timeDeltaInMs) {
  var secondsSinceChangeEvent = Math.round(timeDeltaInMs / 1000);
  var minutesSinceChangeEvent = Math.round(secondsSinceChangeEvent / 60);
  var hoursSinceChangeEvent = Math.round(minutesSinceChangeEvent / 60);
  var daysSinceChangeEvent = Math.round(hoursSinceChangeEvent / 24);

  var text;
  if (secondsSinceChangeEvent < 60) {
    text = "<1m";
  } else if (minutesSinceChangeEvent < 57.5) {
    if (minutesSinceChangeEvent < 30) {
      text = minutesSinceChangeEvent + "m";
    } else {
      text = Math.round(minutesSinceChangeEvent / 5) * 5 + "m";
    }
  } else if (minutesSinceChangeEvent < 5 * 60) {
      var halfHours = Math.round(minutesSinceChangeEvent / 30);
      text = Math.floor(halfHours / 2) + (halfHours % 2 ? ".5" : "") + "h";
  } else if (hoursSinceChangeEvent < 23.5) {
    text = hoursSinceChangeEvent + "h";
  } else {
    text = daysSinceChangeEvent + "d";
  }

  chrome.browserAction.setBadgeText({text: text});
}

var lastState;
var lastChangeTime;
function updateStatus(status) {
  var badgeState = {
    open: {color: [0,255,0,255], defaultText: "\u2022"},
    closed: {color: [255,0,0,255], defaultText: "\u00D7"},
    throttled: {color: [255,255,0,255], defaultText: "!"}
  };

  chrome.browserAction.setTitle({title:status});
  var treeState = (/open/i).exec(status) ? "open" :
      (/throttled/i).exec(status) ? "throttled" : "closed";

  if (lastState && lastState != treeState) {
    prefs.getUseNotifications(function(useNotifications) {
      if (useNotifications)
        notifyStatusChange(treeState, status);
    });
  }

  chrome.browserAction.setBadgeBackgroundColor(
      {color: badgeState[treeState].color});

  if (lastChangeTime === undefined) {
    chrome.browserAction.setBadgeText(
        {text: badgeState[treeState].defaultText});
    lastState = treeState;
    getLastStatusTime(function(time) {
      lastChangeTime = time;
      updateTimeBadge(Date.now() - lastChangeTime);
    }, treeState);
  } else {
    if (treeState != lastState) {
      lastState = treeState;
      // The change event will occur 1/2 the polling frequency before we
      // are aware of it, on average.
      lastChangeTime = Date.now() - pollFrequencyInMs / 2;
    }
    updateTimeBadge(Date.now() - lastChangeTime);
  }
}

function requestStatus() {
  buildbot.requestURL(statusURL,
                      "text",
                      updateStatus,
                      updateBadgeOnErrorStatus);
  setTimeout(requestStatus, pollFrequencyInMs);
}

// Record of the last defunct build number we're aware of on each builder.  If
// the build number is less than or equal to this number, the buildbot
// information is not available and a request will return a 404.
var lastDefunctTryJob = {};

function fetchTryJobResults(fullPatchset, builder, buildnumber, completed) {
  var tryJobURL =
    "http://build.chromium.org/p/tryserver.chromium/json/builders/" +
        builder + "/builds/" + buildnumber;

  if (lastDefunctTryJob.hasOwnProperty(builder) &&
      buildnumber <= lastDefunctTryJob[builder]) {
    completed();
    return;
  }

  buildbot.requestURL(tryJobURL, "json", function(tryJobResult) {
    if (!fullPatchset.full_try_job_results)
      fullPatchset.full_try_job_results = {};

    var key = builder + "-" + buildnumber;
    fullPatchset.full_try_job_results[key] = tryJobResult;

    completed();
  }, function(errorStatus) {
    if (errorStatus == 404) {
      lastDefunctTryJob[builder] =
          Math.max(lastDefunctTryJob[builder] || 0, buildnumber);
    }
    completed();
  });
}

// Enums corresponding to how much state has been loaded for an issue.
var PATCHES_COMPLETE = 0;
var TRY_JOBS_COMPLETE = 1;

function fetchPatches(issue, updatedCallback) {
  // Notify updated once after receiving all patchsets, and a second time after
  // receiving all try job results.
  var patchsetsRetrieved = 0;
  var tryJobResultsOutstanding = 0;
  issue.patchsets.forEach(function(patchset) {
    var patchURL = "https://codereview.chromium.org/api/" + issue.issue +
        "/" + patchset;

    buildbot.requestURL(patchURL, "json", function(patch) {
      if (!issue.full_patchsets)
        issue.full_patchsets = {};

      issue.full_patchsets[patch.patchset] = patch;

      // TODO(wittman): Revise to reduce load on the try servers. Repeatedly
      // loading old try results increases the size of the working set of try
      // jobs on the try servers, causing them to become disk-bound.
      // patch.try_job_results.forEach(function(results) {
      //   if (results.buildnumber) {
      //     tryJobResultsOutstanding++;

      //     fetchTryJobResults(patch, results.builder, results.buildnumber,
      //                        function() {
      //       if (--tryJobResultsOutstanding == 0)
      //         updatedCallback(TRY_JOBS_COMPLETE);
      //     });
      //   }
      // });

      if (++patchsetsRetrieved == issue.patchsets.length) {
        updatedCallback(PATCHES_COMPLETE);
        // TODO(wittman): Remove once we revise the try job fetching code.
        updatedCallback(TRY_JOBS_COMPLETE);
      }
    });
  });
}

function updateTryStatus(status) {
  var seen = {};
  var activeIssues = buildbot.getActiveIssues();
  status.results.forEach(function(result) {
    var issueURL = "https://codereview.chromium.org/api/" + result.issue;

    buildbot.requestURL(issueURL, "json", function(issue) {
      fetchPatches(issue, function(state) {
        // If the issue already exists, wait until all the issue state has
        // loaded before updating the issue so we don't lose try job information
        // from the display.
        if (activeIssues.getIssue(issue.issue)) {
          if (state == TRY_JOBS_COMPLETE)
            activeIssues.updateIssue(issue);
        } else {
          activeIssues.updateIssue(issue);
        }
      });
    });

    seen[result.issue] = true;
  });

  activeIssues.forEach(function(issue) {
    if (!seen[issue.issue])
      activeIssues.removeIssue(issue);
  });
}

function fetchTryStatus(username) {
  if (!username)
    return;

  var url = "https://codereview.chromium.org/search" +
      // commit=2 is CLs with commit bit set, commit=3 is CLs with commit
      // bit cleared, commit=1 is either.
      "?closed=3&commit=1&limit=100&order=-modified&format=json&owner=" +
      username.trim();
  buildbot.requestURL(url, "json", updateTryStatus);
}

function requestTryStatus() {
  var searchBaseURL = "https://codereview.chromium.org/search";

  prefs.getTryJobUsername(function(username) {
    if (username == null) {
      var usernameScrapingURL = "https://codereview.chromium.org/search";
      // Try scraping username from Rietveld if unset.
      buildbot.requestURL(usernameScrapingURL, "text", function(text) {
        var match = /([^<>\s]+@\S+)\s+\(.+\)/.exec(text);
        if (match) {
          username = match[1];
          prefs.setTryJobUsername(username);
          fetchTryStatus(username);
        }
      });
    } else {
      fetchTryStatus(username);
    }

    setTimeout(requestTryStatus, tryPollFrequencyInMs);
  });
}

function main() {
  requestStatus();
  requestTryStatus();
}

main();

})();
