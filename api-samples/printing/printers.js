// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let listOfPrinters = [];
let filename;

function rollPrintingEnabled() {
  return document.getElementById('rollPrinters').checked;
}

function onPrintButtonClicked(printerId, dpi, performTrim) {
  let ticket = {
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
      collate: { collate: false }
    }
  };

  if (rollPrintingEnabled()) {
    filename = 'test-rollprinting.pdf';
    ticket.print.media_size = {
      width_microns: 72320,
      // Note that this value needs to be between min_height_microns and
      // max_height_microns.  Usually this matches the height of the document
      // being printed.
      height_microns: 110000
    };
    // This only makese sense to specify if the printer supports the trim
    // option.
    if (performTrim) {
      ticket.print.vendor_ticket_item = [{ id: 'finishings', value: 'trim' }];
    }
  } else {
    filename = 'test.pdf';
    ticket.print.media_size = {
      width_microns: 210000,
      height_microns: 297000,
      vendor_id: 'iso_a4_210x297mm'
    };
  }

  fetch(filename)
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => {
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
      chrome.printing.submitJob(request).then((response) => {
        if (response !== undefined) {
          console.log(response.status);
        }
        if (chrome.runtime.lastError !== undefined) {
          console.log(chrome.runtime.lastError.message);
        }
        window.scrollTo(0, document.body.scrollHeight);
      });
    });
}

function onCancelButtonClicked(jobId) {
  chrome.printing.cancelJob(jobId).then((response) => {
    if (response !== undefined) {
      console.log(response.status);
    }
    if (chrome.runtime.lastError !== undefined) {
      console.log(chrome.runtime.lastError.message);
    }
  });
}

function createButton(label, onClicked) {
  const button = document.createElement('button');
  button.innerHTML = label;
  button.onclick = onClicked;
  return button;
}

function addCell(parent) {
  const newCell = document.createElement('td');
  parent.appendChild(newCell);
  return newCell;
}

function supportsRollPrinting(printerInfo) {
  // If any of the media size options support continuous feed, return true.
  return printerInfo.capabilities.printer.media_size.option.find(
    (option) => option.is_continuous_feed
  );
}

function createPrintersTable() {
  // Reset this so the table can be rebuilt with either all printers or just
  // printers capable of roll printing.
  let tbody = document.getElementById('tbody');
  while (tbody.firstChild) {
    tbody.removeChild(tbody.firstChild);
  }

  listOfPrinters.forEach((printer) => {
    if (!rollPrintingEnabled() || supportsRollPrinting(printer.info)) {
      // The printer needs to support this specific vendor capability if the
      // print job ticket is going to specify the trim option.
      const supportsTrim =
        printer.info.capabilities.printer.vendor_capability.some(
          (capability) => capability.display_name == 'finishings/11'
        );
      const columnValues = [
        printer.data.id,
        printer.data.name,
        printer.data.description,
        printer.data.uri,
        printer.data.source,
        printer.data.isDefault,
        printer.data.recentlyUsedRank,
        JSON.stringify(printer.info.capabilities),
        supportsTrim,
        printer.info.status
      ];

      let tr = document.createElement('tr');
      const printTd = document.createElement('td');
      printTd.appendChild(
        createButton('Print', () => {
          onPrintButtonClicked(
            printer.data.id,
            printer.info.capabilities.printer.dpi.option[0],
            supportsTrim
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
  });

  chrome.printing.onJobStatusChanged.addListener((jobId, status) => {
    console.log(`jobId: ${jobId}, status: ${status}`);
    let jobTr = document.getElementById(jobId);
    if (jobTr == undefined) {
      jobTr = document.createElement('tr');
      jobTr.setAttribute('id', jobId);

      const cancelTd = addCell(jobTr);
      let cancelBtn = createButton('Cancel', () => {
        onCancelButtonClicked(jobId);
      });
      cancelBtn.setAttribute('id', `id ${jobId}-cancelBtn`);
      cancelTd.appendChild(cancelBtn);

      const jobIdTd = addCell(jobTr);
      jobIdTd.appendChild(document.createTextNode(jobId));

      let jobStatusTd = addCell(jobTr);
      jobStatusTd.id = `${jobId}-status`;
      jobStatusTd.appendChild(document.createTextNode(status));

      document.getElementById('printJobTbody').appendChild(jobTr);
    } else {
      document.getElementById(`${jobId}-status`).innerText = status;
      if (status !== 'PENDING' && status !== 'IN_PROGRESS') {
        jobTr.remove();
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.printing.getPrinters().then((printers) => {
    printers.forEach((printer) => {
      chrome.printing.getPrinterInfo(printer.id).then((printerInfo) => {
        listOfPrinters.push({ data: printer, info: printerInfo });
        createPrintersTable();
      });
    });
  });

  let checkbox = document.getElementById('rollPrinters');
  checkbox.addEventListener('change', function () {
    createPrintersTable();
  });
});
