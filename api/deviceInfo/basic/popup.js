// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function dumpDevices(devices) {
    $('#deviceinfos').empty();
    $('#deviceinfos').append(outputDevicesToList(devices));
}

function outputDevicesToList(devices) {
    var table = $('<table border="1">');
    table.append($("<tr>" +
                   "<th>" + "Name" + "</th>" +
                   "<th>" + "OS" + "</th>" +
                   "<th>" + "Id" + "</th>" +
                   "<th>" + "Type" + "</th>" +
                   "<th>" + "Chrome Version" + "</th>" +
                   "</tr>"));
    for (i = 0; i < devices.length; i++) {
        table.append($("<tr>" +
                       "<td>" + devices[i].name + "</td>" +
                       "<td>" + devices[i].os + "</td>" +
                       "<td>" + devices[i].id + "</td>" +
                       "<td>" + devices[i].type + "</td>" +
                       "<td>" + devices[i].chromeVersion + "</td>" +
                       "</tr>"));
    }
    return table;
}

// Add an event listener to listen for changes to device info. The
// callback would redisplay the list of devices.
chrome.signedInDevices.onDeviceInfoChange.addListener(dumpDevices);

function populateDevices() {
  // Get the list of devices and display it.
  chrome.signedInDevices.get(false, dumpDevices);
}

document.addEventListener('DOMContentLoaded', function () {
    populateDevices();
});
