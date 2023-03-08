// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.



async function onPrintButtonClicked(printerId, dpi) {
  var ticket = {
    version: '1.0',
    print: {
      color: { type: 'STANDARD_MONOCHROME' },
      duplex: { type: 'NO_DUPLEX' },
      page_orientation: { type: 'LANDSCAPE' },
      copies: { copies: 1 },
      dpi: {
        horizontal_dpi: dpi.horizontal_dpi,
        vertical_dpi: dpi.vertical_dpi
      },
      media_size: {
        width_microns: 210000,
        height_microns: 297000,
        vendor_id: 'iso_a4_210x297mm'
      },
      collate: { collate: false }
    }
  };

  const response = await fetch('test.pdf');
  const arrayBuffer = await response.arrayBuffer();
  const request = {
    job: {
      printerId: printerId,
      title: 'test job',
      ticket: ticket,
      contentType: 'application/pdf',
      document: new Blob([new Uint8Array(arrayBuffer)], {
        type: 'application/pdf'
      })
    }
  };

  const printResponse = chrome.printing.submitJob(request);
  if (printResponse !== undefined) {
    console.log(printResponse.status);
  }
  if (chrome.runtime.lastError !== undefined) {
    console.log(chrome.runtime.lastError.message);
  }
}

function createPrintButton(onClicked) {
  const button = document.createElement('button');
  button.innerHTML = 'Print';
  button.onclick = onClicked;
  return button;
}

async function createPrintersTable() {
  const printers = await chrome.printing.getPrinters();
  if (printers) {
    const tbody = document.createElement('tbody');

    for (let i = 0; i < printers.length; ++i) {
      const printer = printers[i];
      const printerInfo = await chrome.printing.getPrinterInfo(printer.id);
      const columnValues = [
        printer.id,
        printer.name,
        printer.description,
        printer.uri,
        printer.source,
        printer.isDefault,
        printer.recentlyUsedRank,
        JSON.stringify(printerInfo.capabilities),
        printerInfo.status
      ];

      let tr = document.createElement('tr');
      const printTd = document.createElement('td');
      printTd.appendChild(
        createPrintButton(async function () {
          await onPrintButtonClicked(
            printer.id,
            printerInfo.capabilities.printer.dpi.option[0]
          );
        })
      );
      tr.appendChild(printTd);
      
      for (const columnValue of columnValues) {
        const td = document.createElement('td');
        td.appendChild(document.createTextNode(columnValue));
        td.setAttribute('align', 'center');
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }

    const table = document.getElementById('printersTable');
    table.appendChild(tbody);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  createPrintersTable()
  .then(() => {
    initStatusDiv();
  });
});

let statusDiv;
let jobIdDiv;
function initStatusDiv() {
  statusDiv = document.getElementById('statusDiv');
  jobIdDiv = document.getElementById('jobIdDiv');
  const cancelBtn = document.getElementById('cancelBtn');
  cancelBtn.addListener('click', (e) => {
    chrome.printing.cancelJob(jobIdDiv.firstChild, () => {
      console.log(`Job ${jobIdDiv.firstChild} canceled.`);
    });
  });
}

chrome.printing.onJobStatusChanged.addListener((jobId, jobStatus) => {
  if (jobStatus === 'PENDING' || jobStatus === 'IN_PROGRESS') {
    jobIdDiv.appendChild(jobId);
    statusDiv.setAttribute('style', 'display:block');
  } else {
    jobIdDiv.removeChild(jobIdDiv.firstChild);
    statusDiv.setAttribute('style', 'display:none !important');
  }
})