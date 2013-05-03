// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var systemInfo = chrome.experimental.systemInfo;

var indicator = {}
var isStarted = false;

function onStorageChanged(info) {
  var elem = document.getElementById(info.id);
  if (indicator[info.id]++ % 2)
    elem.bgColor = "green";
  else
    elem.bgColor = "white";
  elem.innerHTML = info.availableCapacity;
}

function startMonitor() {
  if (isStarted) return;
  systemInfo.storage.onAvailableCapacityChanged.addListener(onStorageChanged);
  isStarted = true;
}

function stopMonitor() {
  if (!isStarted) return;
  systemInfo.storage.onAvailableCapacityChanged.removeListener(
      onStorageChanged);
  isStarted = false;
}

function showStorageInfo(unit) {
  table = "<tr><td>" + unit.id + "</td>" +
    "<td>" + unit.type + "</td>" +
    "<td>" + Math.round(unit.capacity/1024) + "</td>" +
    "<td id=" + "\"" + unit.id + "\">" +
    Math.round(unit.availableCapacity/1024) +
    "</td></tr>\n";
  return table;
}

function init() {
  document.getElementById("start-btn").onclick = startMonitor;
  document.getElementById("stop-btn").onclick = stopMonitor;

  // Get CPU information.
  chrome.experimental.systemInfo.cpu.get(function(cpu) {
    var cpuInfo = "<b>Architecture:</b> " + cpu.archName +
      "<br><b>Model Name: </b>" + cpu.modelName +
      "<br><b>Number of Processors: </b>" + cpu.numOfProcessors;
    var div = document.getElementById("cpu-info");
    div.innerHTML = cpuInfo;
  });
  chrome.experimental.systemInfo.cpu.onUpdated.addListener(function(info) {
    var table = "<br><table border=\"1\">\n" +
      "<tr><td width=\"80px\"><b>Index</b></td>";
    for (var i = 0; i < info.usagePerProcessor.length; i++) {
      table += "<td width=\"120px\"><b>" + i + "</b></td>";
    }
    table += "<td width=\"120px\"><b>Total</b></td></tr>\n";
    table += "<tr><td><b>History Usage</b></td>";
    for (var i = 0; i < info.usagePerProcessor.length; i++) {
      table += "<td>" + Math.round(info.usagePerProcessor[i]) + "</td>";
    }
    table += "<td>" + Math.round(info.averageUsage) + "</td></tr>";
    table += "</table>\n";
    var div = document.getElementById("cpu-cores");
    div.innerHTML = table;
  });

  // Get memory information.
  chrome.experimental.systemInfo.memory.get(function(memory) {
    var memoryInfo =
    "<b>Total Capacity:</b> " + Math.round(memory.capacity / 1024) + "KB" +
    "<br><b>Available Capacity: </b>" +
    Math.round(memory.availableCapacity / 1024) + "KB"
    var div = document.getElementById("memory-info");
    div.innerHTML = memoryInfo;
  });

  // Get storage information.
  chrome.experimental.systemInfo.storage.get(function(units) {
    var table = "<table width=65% border=\"1\">\n" +
      "<tr><td><b>ID</b></td>" +
      "<td><b>Type</b></td>" +
      "<td><b>Total Capacity (KB)</b></td>" +
      "<td><b>Available Capacity (KB)</b></td>" +
      "</tr>\n";
    for (var i = 0; i < units.length; i++) {
      indicator[units[i].id] = 0;
      table += showStorageInfo(units[i]);
    }
    table += "</table>\n";
    var div = document.getElementById("storage-list");
    div.innerHTML = table;
  });
}

document.addEventListener('DOMContentLoaded', init);
