/** @license
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

// The Guestbook object will be destroyed if the event page is unloaded,
// so each time we need to make sure it reloads any state.
var guestbook = new Guestbook();
guestbook.initialize();
