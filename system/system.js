// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

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
  chrome.system.storage.onAvailableCapacityChanged.addListener(
      onStorageChanged);
  isStarted = true;
}

function stopMonitor() {
  if (!isStarted) return;
  chrome.system.storage.onAvailableCapacityChanged.removeListener(
      onStorageChanged);
  isStarted = false;
}

function showStorageInfo(unit) {
  table = "<tr><td>" + unit.id + "</td>" +
    "<td>" + unit.name + "</td>" +
    "<td>" + unit.type + "</td>" +
    "<td>" + Math.round(unit.capacity/1024) + "</td>" +
    "<td id=" + "\"" + unit.id + "\">" +
    "</td></tr>\n";
  return table;
}

function init() {
  document.getElementById("start-btn").onclick = startMonitor;
  document.getElementById("stop-btn").onclick = stopMonitor;

  // Get CPU information.
  chrome.system.cpu.getInfo(function(cpu) {
    if (!cpu)
      return;
    var cpuInfo = "<b>Architecture:</b> " + cpu.archName +
      "<br><b>Model Name: </b>" + cpu.modelName +
      "<br><b>Number of Processors: </b>" + cpu.numOfProcessors;
    var div = document.getElementById("cpu-info");
    div.innerHTML = cpuInfo;
  });

  // Get memory information.
  chrome.system.memory.getInfo(function(memory) {
    if (!memory)
      return;
    var memoryInfo =
      "<b>Total Capacity:</b> " + Math.round(memory.capacity / 1024) + "KB" +
      "<br><b>Available Capacity: </b>" +
    Math.round(memory.availableCapacity / 1024) + "KB"
    var div = document.getElementById("memory-info");
    div.innerHTML = memoryInfo;
  });

  // Get display information.
  chrome.system.display.getInfo(function(display) {
    if (!display)
      return;
    var displayInfo = "";
    for (var i = 0; i < display.length; ++i) {
      displayInfo += "<b>Name:</b> " + display[i].name +
        "<br><b>Id: </b>" + display[i].id +
        "<br><b>bounds: </b>" + display[i].bounds.height + "*" +
          display[i].bounds.width +
        "<br><b>workArea: </b>" + display[i].workArea.height + "*" +
          display[i].workArea.width +
        "<br><b> dpi: </b>" + "(" + display[i].dpiX + ", " + display[i].dpiY +
          ")";
    }
    var div = document.getElementById("display-info");
    div.innerHTML = displayInfo;
  });

  // Get storage information.
  chrome.system.storage.getInfo(function(units) {
    if (!units)
      return;
    var table = "<table width=65% border=\"1\">\n" +
      "<tr><td><b>ID</b></td>" +
      "<td><b>Name</b></td>" +
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
