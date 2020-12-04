// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(function(){

window.buildbot = window.buildbot || {};

buildbot.ActiveIssues = function() {
  this.issues_ = {};
  this.eventCallback_ = null;
};

buildbot.ActiveIssues.prototype = {
  forEach: function(callback) {
    for (var key in this.issues_)
      callback(this.issues_[key]);
  },

  getIssue: function(number) {
    return this.issues_[number];
  },

  updateIssue: function(issue) {
    var eventType = this.issues_.hasOwnProperty(issue.issue) ?
      "issueUpdated" : "issueAdded";
    this.issues_[issue.issue] = issue;
    this.postEvent_({event: eventType, issue: issue.issue});
  },

  removeIssue: function(issue) {
    delete this.issues_[issue.issue];
    this.postEvent_({event: "issueRemoved", issue: issue.issue});
  },

  setEventCallback: function(callback) {
    this.eventCallback_ = callback;
  },

  postEvent_: function(obj) {
    if (this.eventCallback_)
      this.eventCallback_(obj);
  }
};

buildbot.getActiveIssues = function() {
  var background = chrome.extension.getBackgroundPage();
  if (!background.buildbot.hasOwnProperty("activeIssues"))
    background.buildbot.activeIssues = new buildbot.ActiveIssues;

  return background.buildbot.activeIssues;
};

})();
