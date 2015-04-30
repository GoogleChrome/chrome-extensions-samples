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
    "<td>" + display.rotation + "</td>" +
    "<td>" + showBounds(display.bounds) + "</td>" +
    "<td>" + showInsets(display.overscan) + "</td>" +
    "<td>" + showBounds(display.workArea) + "</td>" +
    "</tr>\n";
  return table;
}

function bytesToMegaBytes(number) {
  return Math.round(number / 1024 / 1024);
}

function showStorageInfo(unit) {
  table = "<tr><td>" + unit.id + "</td>" +
    "<td>" + unit.type + "</td>" +
    "<td>" + bytesToMegaBytes(unit.capacity) + "</td>" +
    "<td>" + bytesToMegaBytes(unit.availableCapacity) + "</td>" +
    "</tr>\n";
  return table;
}

function showCpuProcessorInfo(processor_number, processor) {
  table = "<tr><td>" + processor_number + "</td>" +
    "<td>" + processor.usage.idle + "</td>" +
    "<td>" + processor.usage.kernel + "</td>" +
    "<td>" + processor.usage.user + "</td>" +
    "<td>" + processor.usage.total + "</td>" +
    "</tr>\n";
  return table;
}

function init() {
  // Get display information.
  (function getDisplayInfo() {
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

    systemInfo.display.onDisplayChanged.addListener(getDisplayInfo);
  })();

  // Get CPU information.
  (function getCpuInfo() {
     systemInfo.cpu.getInfo(function(cpu) {
       var cpuInfo = "<b>Architecture:</b> " + cpu.archName +
         "<br><b>Model Name: </b>" + cpu.modelName +
         "<br><b>Number of Processors: </b>" + cpu.numOfProcessors +
         "<br><b>Features: </b>" + cpu.features.join(' ');
       cpuInfo += "<table width=70% border=\"1\">\n" +
         "<tr><td><b>Processor</b></td>" +
         "<td><b>Idle time (ms)</b></td>" +
         "<td><b>Kernel time (ms)</b></td>" +
         "<td><b>User time (ms)</b></td>" +
         "<td><b>Total time (ms)</b></td>" +
         "</tr>\n";
       cpu.processors.forEach(function(processor, index) {
         cpuInfo += showCpuProcessorInfo(index+1, processor);
       });

       cpuInfo += "</table>\n";
       var div = document.getElementById("cpu-info");
       div.innerHTML = cpuInfo;
     });

     setTimeout(getCpuInfo, 1000);
  })();

  // Get memory information.
  (function getMemoryInfo() {
    systemInfo.memory.getInfo(function(memory) {
      var memoryInfo =
      "<b>Total Capacity:</b> " + bytesToMegaBytes(memory.capacity) + "MB" +
      "<br><b>Available Capacity: </b>" +
      bytesToMegaBytes(memory.availableCapacity) + "MB"
      var div = document.getElementById("memory-info");
      div.innerHTML = memoryInfo;
    });

    setTimeout(getMemoryInfo, 1000);
  })();

  // Get storage information.
  (function getStorageInfo() {
    systemInfo.storage.getInfo(function(units) {
      var table = "<table width=70% border=\"1\">\n" +
        "<tr><td><b>ID</b></td>" +
        "<td><b>Type</b></td>" +
        "<td><b>Total Capacity (MB)</b></td>" +
        "<td><b>Available Capacity (MB)</b></td>" +
        "</tr>\n";
      function showTable() {
        table += "</table>\n";
        var div = document.getElementById("storage-list");
        div.innerHTML = table;
      }
      if (units.length == 0)
        return showTable();
      units.forEach(function(unit, index) {
        systemInfo.storage.getAvailableCapacity(unit.id, function(info) {
          unit.availableCapacity = info.availableCapacity;
          table += showStorageInfo(unit);
          if (index == units.length - 1)
            showTable();
        })
      });
    });

    systemInfo.storage.onAttached.addListener(getStorageInfo);
    systemInfo.storage.onDetached.addListener(getStorageInfo);
  })();
}

document.addEventListener('DOMContentLoaded', init);
