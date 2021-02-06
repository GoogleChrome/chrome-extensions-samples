// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Shows an updating list of process statistics.
function init() {
  chrome.processes.onUpdatedWithMemory.addListener(
    function(processes) {
      var table = "<table>\n" +
        "<tr><td><b>Process</b></td>" +
        "<td>OS ID</td>" +
        "<td>Title</td>" +
        "<td>Type</td>" +
        "<td>Tabs</td>" +
        "<td>CPU</td>" +
        "<td>Network</td>" +
        "<td>Private Memory</td>" +
        "<td>JS Memory</td>" +
        "<td></td>" +
        "</tr>\n";
      for (pid in processes) {
        table = displayProcessInfo(processes[pid], table);
      }
      table += "</table>\n";
      var div = document.getElementById("process-list");
      div.innerHTML = table;
    });

  document.getElementById("killProcess").onclick = function () {
    var procId = parseInt(prompt("Enter process ID"));
    chrome.processes.terminate(procId);
  }
}

function displayProcessInfo(process, table) {
  // Format network string like task manager
  var network = process.network;
  if (network > 1024) {
    network = (network / 1024).toFixed(1) + " kB/s";
  } else if (network > 0) {
    network += " B/s";
  } else if (network == -1) {
    network = "N/A";
  }

  table +=
    "<tr><td>" + process.id + "</td>" +
    "<td>" + process.osProcessId + "</td>" +
    "<td>" + process.title + "</td>" +
    "<td>" + process.type + "</td>" +
    "<td>" + process.tabs + "</td>" +
    "<td>" + process.cpu + "</td>" +
    "<td>" + network + "</td>";

  if ("privateMemory" in process) {
    table += "<td>" + (process.privateMemory / 1024) + "K</td>";
  } else {
    table += "<td>N/A</td>";
  }
  if ("jsMemoryAllocated" in process) {
    var allocated = process.jsMemoryAllocated / 1024;
    var used = process.jsMemoryUsed / 1024;
    table += "<td>" + allocated.toFixed(2) + "K (" + used.toFixed(2) +
        "K live)</td>";
  } else {
    table += "<td>N/A</td>";
  }

  table +=
    "<td></td>" +
    "</tr>\n";
  return table;
}

document.addEventListener('DOMContentLoaded', init);
