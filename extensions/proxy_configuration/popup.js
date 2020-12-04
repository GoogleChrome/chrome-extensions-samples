// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview This file initializes the extension's popup by creating a
 * ProxyFormController object.
 *
 * @author Mike West <mkwst@google.com>
 */

document.addEventListener('DOMContentLoaded', function () {
  var c = new ProxyFormController( 'proxyForm' );
});
