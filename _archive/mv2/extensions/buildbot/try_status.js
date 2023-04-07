// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

(function() {

window.buildbot = window.buildbot || {};

buildbot.RUNNING = -1;
buildbot.SUCCESS = 0;
buildbot.WARNINGS = 1;
buildbot.FAILURE = 2;
buildbot.SKIPPED = 3;
buildbot.EXCEPTION = 4;
buildbot.RETRY = 5;
buildbot.NOT_STARTED = 6;

})();
