// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var systemInfo = chrome.system;

function showBounds(bounds) {
  return bounds.left + ", " + bounds.top + ", " +
      bounds.width + ", " + bounds.height;
}

function showInsets(bounds) {
  return bounds.left + ", " + bounds.top + ", " +
      bounds.right + ", " + bounds.bottom;
}

function showDisplayInfo(display) {
  table = "<tr><td>" + display.id + "</td>" +
    "<td>" + display.name + "</td>" +
    "<td>" + display.mirroringSourceId + "</td>" +
    "<td>" + display.isPrimary + "</td>" +
    "<td>" + display.isInternal + "</td>" +
    "<td>" + display.isEnabled + "</td>" +
    "<td>" + display.dpiX + "</td>" +
    "<td>" + display.dpiY + "</td>" +
    "<td>" + display.Rotation + "</td>" +
    "<td>" + showBounds(display.bounds) + "</td>" +
    "<td>" + showInsets(display.overscan) + "</td>" +
    "<td>" + showBounds(display.workArea) + "</td>" +
    "</tr>\n";
  return table;
}

function showStorageInfo(unit) {
  table = "<tr><td>" + unit.id + "</td>" +
    "<td>" + unit.type + "</td>" +
    "<td>" + Math.round(unit.capacity/1024) + "</td>" +
    "<td>" + Math.round(unit.availableCapacity/1024) + "</td>" +
    "</tr>\n";
  return table;
}

function init() {
  // Get display information.
  systemInfo.display.getInfo(function(displays) {
    var table = "<table width=70% border=\"1\">\n" +
      "<tr><td><b>ID</b></td>" +
      "<td><b>Name</b></td>" +
      "<td><b>Mirroring Source Id</b></td>" +
      "<td><b>Is Primary</b></td>" +
      "<td><b>Is Internal</b></td>" +
      "<td><b>Is Enabled</b></td>" +
      "<td><b>DPI X</b></td>" +
      "<td><b>DPI Y</b></td>" +
      "<td><b>Rotation</b></td>" +
      "<td><b>Bounds</b></td>" +
      "<td><b>Overscan</b></td>" +
      "<td><b>Work Area</b></td>" +
      "</tr>\n";
    for (var i = 0; i < displays.length; i++) {
      table += showDisplayInfo(displays[i]);
    }
    table += "</table>\n";
    var div = document.getElementById("display-list");
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
    var table = "<table width=70% border=\"1\">\n" +
      "<tr><td><b>ID</b></td>" +
      "<td><b>Type</b></td>" +
      "<td><b>Total Capacity (KB)</b></td>" +
      "<td><b>Available Capacity (KB)</b></td>" +
      "</tr>\n";
    units.forEach(function(unit, index) {
      systemInfo.storage.getAvailableCapacity(unit.id, function(info) {
        unit.availableCapacity = info.availableCapacity;
        table += showStorageInfo(unit);
        if (index == units.length - 1) {
          table += "</table>\n";
          var div = document.getElementById("storage-list");
          div.innerHTML = table;
        }
      })
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
