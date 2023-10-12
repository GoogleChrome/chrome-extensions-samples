// Copyright 2020 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function onPrintButtonClicked(printerId, dpi, width, performTrim) {
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
      media_size: {
        width_microns: width,
        // Note that this value needs to be between min_height_microns and
        // max_height_microns.  Usually this matches the height of the document
        // being printed.
        height_microns: 110000
      },
      collate: { collate: false }
    }
  };
  // This only makese sense to specify if the printer supports the trim option.
  if (performTrim) {
    ticket.print.vendor_ticket_item = [{id: 'finishings', value: 'trim'}];
  }

  fetch('test.pdf')
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
  // Only keep the media size options that support continuous feed.  When
  // creating a print job ticket with a variable height, one of these widths
  // must be used.  These options don't really need to be filtered - just doing
  // this for display purposes and to demonstrate how to determine which
  // printers support continuous feed.
  const newOptions = printerInfo.capabilities.printer.media_size.option.filter(
      (option) => option.is_continuous_feed);
  if (newOptions.length > 0) {
    printerInfo.capabilities.printer.media_size.option = newOptions;
    return true;
  }
  return false;
}

function createPrintersTable() {
  chrome.printing.getPrinters().then((printers) => {
    const tbody = document.createElement('tbody');
    printers.forEach((printer) => {
      chrome.printing.getPrinterInfo(printer.id).then((printerInfo) => {
        if (supportsRollPrinting(printerInfo)) {
          // The printer needs to support this specific vendor capability if the
          // print job ticket is going to specify the trim option.
          const supportsTrim =
                printerInfo.capabilities.printer.vendor_capability.some(
                    (capability) => capability.display_name == "finishings/11");
          printerInfo.capabilities.printer.media_size.option.forEach((option) => {
          const columnValues = [
            printer.name,
            printer.description,
            JSON.stringify(option),
            supportsTrim,
            printerInfo.status
          ];

          let tr = document.createElement('tr');
          const printTd = document.createElement('td');
          printTd.appendChild(
              createButton('Print', () => {
                onPrintButtonClicked(
                    printer.id,
                    printerInfo.capabilities.printer.dpi.option[0],
                    option.width_microns,
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
          })}});
    });
    const table = document.getElementById('printersTable');
    table.appendChild(tbody);
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
      cancelBtn.setAttribute(`id ${jobId}-cancelBtn`);
      cancelTd.appendChild(cancelBtn);

      const jobIdTd = addCell(jobTr);
      jobIdTd.appendChild(document.createTextNode(jobId));

      let jobStatusTd = addCell(jobTr);
      jobStatusTd.id = `${jobId}-status`;
      jobStatusTd.appendChild(document.createTextNode(status));

      document.getElementById('printJobTbody').appendChild(jobTr);
    } else {
      document.getElementById(`jobId${-status}`).innerText = status;
      if (status !== 'PENDING' && status !== 'IN_PROGRESS') {
        jobTr.remove();
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  createPrintersTable();
});
