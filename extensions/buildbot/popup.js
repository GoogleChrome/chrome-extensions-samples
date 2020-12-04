// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(function(){

var lkgrURL = 'http://chromium-status.appspot.com/lkgr';

// Interval at which to reload the non-CL bot status.
var botStatusRefreshIntervalInMs = 60 * 1000;
// Interval at which to check for LKGR updates.
var lkgrRefreshIntervalInMs = 60 * 1000;

function getClassForTryJobResult(result) {
  // Some win bots seem to report a null result while building.
  if (result === null)
    result = buildbot.RUNNING;

  switch (parseInt(result)) {
  case buildbot.RUNNING:
    return "running";

  case buildbot.SUCCESS:
    return "success";

  case buildbot.WARNINGS:
    return "warnings";

  case buildbot.FAILURE:
    return "failure";

  case buildbot.SKIPPED:
    return "skipped";

  case buildbot.EXCEPTION:
    return "exception";

  case buildbot.RETRY:
    return "retry";

  case buildbot.NOT_STARTED:
  default:
    return "never";
  }
}

// Remove try jobs that have been supplanted by newer runs.
function filterOldTryJobs(tryJobs) {
  var latest = {};
  tryJobs.forEach(function(tryJob) {
    if (!latest[tryJob.builder] ||
        latest[tryJob.builder].buildnumber < tryJob.buildnumber)
      latest[tryJob.builder] = tryJob;
  });

  var result = [];
  tryJobs.forEach(function(tryJob) {
    if (tryJob.buildnumber == latest[tryJob.builder].buildnumber)
      result.push(tryJob);
  });

  return result;
}

function createTryJobAnchorTitle(tryJob, fullTryJob) {
  var title = tryJob.builder;

  if (!fullTryJob)
    return title;

  var stepText = [];
  if (fullTryJob.currentStep)
    stepText.push("running " + fullTryJob.currentStep.name);

  if (fullTryJob.results == buildbot.FAILURE && fullTryJob.text) {
    stepText.push(fullTryJob.text.join(" "));
  } else {
    // Sometimes a step can fail without setting the try job text.  Look
    // through all the steps to identify if this is the case.
    var text = [];
    fullTryJob.steps.forEach(function(step) {
      if (step.results[0] == buildbot.FAILURE)
        text.push(step.results[1][0]);
    });

    if (text.length > 0) {
      text.unshift("failure");
      stepText.push(text.join(" "));
    }
  }

  if (stepText.length > 0)
    title += ": " + stepText.join("; ");

  return title;
}

function createPatchsetStatusElement(patchset) {
  var table = document.createElement("div");
  table.className = "issue-status";

  var tryJobs = filterOldTryJobs(patchset.try_job_results);
  tryJobs.forEach(function(tryJob) {
    var key = tryJob.builder + "-" + tryJob.buildnumber;
    var fullTryJob = patchset.full_try_job_results &&
        patchset.full_try_job_results[key];

    var tryJobAnchor = document.createElement("a");
    tryJobAnchor.textContent = "  ";
    tryJobAnchor.title = createTryJobAnchorTitle(tryJob, fullTryJob);
    tryJobAnchor.className = "issue-status-build " +
      getClassForTryJobResult(tryJob.result);
    tryJobAnchor.target = "_blank";
    tryJobAnchor.href = tryJob.url;
    table.appendChild(tryJobAnchor);
  });

  return table;
}

function getLastFullPatchsetWithTryJobs(issue) {
  var index = issue.patchsets.length - 1;
  var fullPatchsets = issue.full_patchsets;
  while (index >= 0 &&
         (!fullPatchsets ||
          !fullPatchsets[issue.patchsets[index]] ||
          !fullPatchsets[issue.patchsets[index]].try_job_results ||
          fullPatchsets[issue.patchsets[index]].try_job_results.length == 0)) {
    index--;
  }

  return index >= 0 ? fullPatchsets[issue.patchsets[index]] : null;
}

function createTryStatusRow(issue) {
  var table = document.getElementById("status-table");

  // Order by decreasing issue number.
  var position =
      document.getElementsByClassName("trunk-status-row")[0].rowIndex;
  while (position > 0 &&
         parseInt(issue.issue) >
             parseInt(table.rows[position - 1].getAttribute("data-issue"))) {
    position--;
  }

  var row = table.insertRow(position);
  row.setAttribute("data-issue", issue.issue);

  return row;
}

function updateIssueDisplay(issue) {
  var codereviewBaseURL = "https://codereview.chromium.org";

  var lastFullPatchset = getLastFullPatchsetWithTryJobs(issue);

  var row = document.querySelector("*[data-issue='" + issue.issue + "']");
  if (!lastFullPatchset) {
    if (row)
      row.parentNode.removeChild(row);
    return;
  }

  if (!row)
    row = createTryStatusRow(issue);

  var label = row.childNodes[0] || row.insertCell(-1);
  var status = row.childNodes[1] || row.insertCell(-1);

  label.className = "status-label";
  var clAnchor = label.childNodes[0] ||
    label.appendChild(document.createElement("a"));
  clAnchor.textContent = "CL " + issue.issue;
  clAnchor.href = codereviewBaseURL + "/" + issue.issue;
  clAnchor.title = issue.subject;
  if (lastFullPatchset && lastFullPatchset.message)
    clAnchor.title += " | " + lastFullPatchset.message;
  clAnchor.target = "_blank";

  var statusElement = createPatchsetStatusElement(lastFullPatchset);
  if (status.childElementCount < 1)
    status.appendChild(statusElement);
  else
    status.replaceChild(statusElement, status.firstChild);
}

function removeIssueDisplay(issueNumber) {
  var row = document.querySelector("*[data-issue='" + issueNumber + "']");
  row.parentNode.removeChild(row);
}

function addTryStatusRows() {
  buildbot.getActiveIssues().forEach(updateIssueDisplay);
}

function updateLKGR(lkgr) {
  var link = document.getElementById('link_lkgr');
  link.textContent = 'LKGR (' + lkgr + ')';
}

function addBotStatusRow(bot, className) {
  var table = document.getElementById("status-table");

  var baseURL = "http://build.chromium.org/p/chromium" +
    (bot.id != "" ? "." + bot.id : "");
  var consoleURL = baseURL + "/console";
  var statusURL = baseURL + "/horizontal_one_box_per_builder";

  var row = table.insertRow(-1);
  row.className = "trunk-status-row " + className;
  var label = row.insertCell(-1);
  label.className = "status-label";
  var labelAnchor = document.createElement("a");
  labelAnchor.href = consoleURL;
  labelAnchor.target = "_blank";
  labelAnchor.id = "link_" + bot.id;
  labelAnchor.textContent = bot.label;
  label.appendChild(labelAnchor);

  var status = row.insertCell(-1);
  status.className = "trunk-status-cell";
  var statusIframe = document.createElement("iframe");
  statusIframe.scrolling = "no";
  statusIframe.src = statusURL;
  status.appendChild(statusIframe);
}

function addBotStatusRows() {
  var closerBots = [
    {id: "", label: "Chromium"},
    {id: "win", label: "Win"},
    {id: "mac", label: "Mac"},
    {id: "linux", label: "Linux"},
    {id: "chromiumos", label: "ChromiumOS"},
    {id: "chrome", label: "Official"},
    {id: "memory", label: "Memory"}
  ];

  var otherBots = [
    {id: "lkgr", label: "LKGR"},
    {id: "perf", label: "Perf"},
    {id: "memory.fyi", label: "Memory FYI"},
    {id: "gpu", label: "GPU"},
    {id: "gpu.fyi", label: "GPU FYI"}
  ];

  closerBots.forEach(function(bot) {
    addBotStatusRow(bot, "closer-status-row");
  });

  otherBots.forEach(function(bot) {
    addBotStatusRow(bot, "other-status-row");
  });
}

function fillStatusTable() {
  addBotStatusRows();
  addTryStatusRows();
}

function main() {
  buildbot.requestURL(lkgrURL, "text", updateLKGR);
  fillStatusTable();

  buildbot.getActiveIssues().setEventCallback(function(request) {
    // NOTE(wittman): It doesn't appear that we can reliably detect closing of
    // the popup and remove the event callback, so ensure the popup window is
    // displayed before processing the event.
    if (!chrome.extension.getViews({type: "popup"}))
      return;

    switch (request.event) {
    case "issueUpdated":
    case "issueAdded":
      updateIssueDisplay(buildbot.getActiveIssues().getIssue(request.issue));
      break;

    case "issueRemoved":
      removeIssueDisplay(request.issue);
      break;
    }
  });

  setInterval(function() {
    buildbot.requestURL(lkgrURL, "text", updateLKGR);
  }, lkgrRefreshIntervalInMs);

  setInterval(function() {
    var botStatusElements =
        document.getElementsByClassName("trunk-status-iframe");
    for (var i = 0; i < botStatusElements.length; i++)
      // Force a reload of the iframe in a way that doesn't cause cross-domain
      // policy violations.
      botStatusElements.item(i).src = botStatusElements.item(i).src;
  }, botStatusRefreshIntervalInMs);
}

main();

})();
