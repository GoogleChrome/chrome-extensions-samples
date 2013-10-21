// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var systemInfo = chrome.system;

function showDisplayInfo(unit) {
  table = "<tr><td>" + unit.id + "</td>" +
    "<td>" + unit.type + "</td>" +
    "<td>" + Math.round(unit.capacity/1024) + "</td>" +
    "</tr>\n";
  return table;
}

function showStorageInfo(unit) {
  table = "<tr><td>" + unit.id + "</td>" +
    "<td>" + unit.type + "</td>" +
    "<td>" + Math.round(unit.capacity/1024) + "</td>" +
    "</tr>\n";
  return table;
}

function init() {
  // Get display information.
  systemInfo.display.getInfo(function(displays) {
    var table = "<table width=65% border=\"1\">\n" +
      "<tr><td><b>ID</b></td>" +
      "<td><b>Type</b></td>" +
      "<td><b>Total Capacity (KB)</b></td>" +
      "</tr>\n";
    for (var i = 0; i < displays.length; i++) {
      table += showStorageInfo(units[i]);
    }
    table += "</table>\n";
    var div = document.getElementById("storage-list");
    div.innerHTML = table;
  });

  // Get CPU information.
  systemInfo.cpu.getInfo(function(cpu) {
    var cpuInfo = "<b>Architecture:</b> " + cpu.archName +
      "<br><b>Model Name: </b>" + cpu.modelName +
      "<br><b>Number of Processors: </b>" + cpu.numOfProcessors;
    var div = document.getElementById("cpu-info");
    div.innerHTML = cpuInfo;
  });

  // Get memory information.
  systemInfo.memory.getInfo(function(memory) {
    var memoryInfo =
    "<b>Total Capacity:</b> " + Math.round(memory.capacity / 1024) + "KB" +
    "<br><b>Available Capacity: </b>" +
    Math.round(memory.availableCapacity / 1024) + "KB"
    var div = document.getElementById("memory-info");
    div.innerHTML = memoryInfo;
  });

  // Get storage information.
  systemInfo.storage.getInfo(function(units) {
    var table = "<table width=65% border=\"1\">\n" +
      "<tr><td><b>ID</b></td>" +
      "<td><b>Type</b></td>" +
      "<td><b>Total Capacity (KB)</b></td>" +
      "</tr>\n";
    for (var i = 0; i < units.length; i++) {
      table += showStorageInfo(units[i]);
    }
    table += "</table>\n";
    var div = document.getElementById("storage-list");
    div.innerHTML = table;
  });
}

document.addEventListener('DOMContentLoaded', init);
