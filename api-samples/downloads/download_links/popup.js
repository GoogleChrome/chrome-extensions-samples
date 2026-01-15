// This extension demonstrates using chrome.downloads.download() to
// download URLs.

const allLinks = [];
let visibleLinks = [];

// Display all visible links.
function showLinks() {
  const linksTable = document.getElementById('links');
  while (linksTable.children.length > 1) {
    linksTable.removeChild(linksTable.children[linksTable.children.length - 1]);
  }
  for (let i = 0; i < visibleLinks.length; ++i) {
    const row = document.createElement('tr');
    const col0 = document.createElement('td');
    const col1 = document.createElement('td');
    const checkbox = document.createElement('input');
    checkbox.checked = true;
    checkbox.type = 'checkbox';
    checkbox.id = 'check' + i;
    col0.appendChild(checkbox);
    col1.innerText = visibleLinks[i];
    col1.style.whiteSpace = 'nowrap';
    col1.onclick = function () {
      checkbox.checked = !checkbox.checked;
    };
    row.appendChild(col0);
    row.appendChild(col1);
    linksTable.appendChild(row);
  }
}

// Toggle the checked state of all visible links.
function toggleAll() {
  const checked = document.getElementById('toggle_all').checked;
  for (let i = 0; i < visibleLinks.length; ++i) {
    document.getElementById('check' + i).checked = checked;
  }
}

// Download all visible checked links.
function downloadCheckedLinks() {
  for (let i = 0; i < visibleLinks.length; ++i) {
    if (document.getElementById('check' + i).checked) {
      chrome.downloads.download({ url: visibleLinks[i] });
    }
  }
  window.close();
}

// Re-filter allLinks into visibleLinks and reshow visibleLinks.
function filterLinks() {
  const filterValue = document.getElementById('filter').value;
  if (document.getElementById('regex').checked) {
    visibleLinks = allLinks.filter(function (link) {
      return link.match(filterValue);
    });
  } else {
    const terms = filterValue.split(' ');
    visibleLinks = allLinks.filter(function (link) {
      for (let term of terms) {
        if (term.length != 0) {
          const expected = term[0] != '-';
          if (!expected) {
            term = term.slice(1);
            if (term.length == 0) {
              continue;
            }
          }
          const found = -1 !== link.indexOf(term);
          if (found != expected) {
            return false;
          }
        }
      }
      return true;
    });
  }
  showLinks();
}

// Add links to allLinks and visibleLinks, sort and show them.  send_links.js is
// injected into all frames of the active tab, so this listener may be called
// multiple times.
chrome.runtime.onMessage.addListener(function (links) {
  allLinks.push(...links);
  allLinks.sort();
  visibleLinks = allLinks;
  showLinks();
});

// Set up event handlers and inject send_links.js into all frames in the active
// tab.
window.onload = async function () {
  document.getElementById('filter').onkeyup = filterLinks;
  document.getElementById('regex').onchange = filterLinks;
  document.getElementById('toggle_all').onchange = toggleAll;
  document.getElementById('download0').onclick = downloadCheckedLinks;
  document.getElementById('download1').onclick = downloadCheckedLinks;

  const { id: currentWindowId } = await chrome.windows.getCurrent();

  const tabs = await chrome.tabs.query({
    active: true,
    windowId: currentWindowId
  });

  const activeTabId = tabs[0].id;

  chrome.scripting.executeScript({
    target: { tabId: activeTabId, allFrames: true },
    files: ['send_links.js']
  });
};
