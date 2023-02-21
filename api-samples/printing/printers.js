// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function onPrintButtonClicked(printerId, dpi) {
  var ticket = {
    version: "1.0",
    print: {
      color: { type: "STANDARD_MONOCHROME" },
      duplex: { type: "NO_DUPLEX" },
      page_orientation: { type: "LANDSCAPE" },
      copies: { copies: 1 },
      dpi: {
        horizontal_dpi: dpi.horizontal_dpi,
        vertical_dpi: dpi.vertical_dpi,
      },
      media_size: {
        width_microns: 210000,
        height_microns: 297000,
        vendor_id: "iso_a4_210x297mm",
      },
      collate: { collate: false },
    },
  };

  fetch("test.pdf")
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => {
      const request = {
        job: {
          printerId: printerId,
          title: "test job",
          ticket: ticket,
          contentType: "application/pdf",
          document: new Blob([new Uint8Array(arrayBuffer)], {
            type: "application/pdf",
          }),
        },
      };
      chrome.printing.submitJob(request, (response) => {
        if (response !== undefined) {
          console.log(response.status);
        }
        if (chrome.runtime.lastError !== undefined) {
          console.log(chrome.runtime.lastError.message);
        }
      });
    });
}

function createPrintButton(onClicked) {
  const button = document.createElement("button");
  button.innerHTML = "Print";
  button.onclick = onClicked;
  return button;
}

function createPrintersTable() {
  chrome.printing.getPrinters(function (printers) {
    const tbody = document.createElement("tbody");

    for (let i = 0; i < printers.length; ++i) {
      const printer = printers[i];
      chrome.printing.getPrinterInfo(printer.id, function (response) {
        const columnValues = [
          printer.id,
          printer.name,
          printer.description,
          printer.uri,
          printer.source,
          printer.isDefault,
          printer.recentlyUsedRank,
          JSON.stringify(response.capabilities),
          response.status,
        ];

        let tr = document.createElement("tr");
        for (const columnValue of columnValues) {
          const td = document.createElement("td");
          td.appendChild(document.createTextNode(columnValue));
          td.setAttribute("align", "center");
          tr.appendChild(td);
        }

        const printTd = document.createElement("td");
        printTd.appendChild(
          createPrintButton(function () {
            onPrintButtonClicked(
              printer.id,
              response.capabilities.printer.dpi.option[0]
            );
          })
        );
        tr.appendChild(printTd);

        tbody.appendChild(tr);
      });
    }

    const table = document.getElementById("printersTable");
    table.appendChild(tbody);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  createPrintersTable();
});
