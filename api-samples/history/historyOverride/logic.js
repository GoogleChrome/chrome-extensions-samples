const kMillisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
const kOneWeekAgo = new Date().getTime() - kMillisecondsPerWeek;
const historyDiv = document.getElementById('historyDiv');

function faviconURL(u) {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', u);
  url.searchParams.set('size', '24');
  return url.toString();
}

function constructHistory(historyItems) {
  const template = document.getElementById('historyTemplate');
  for (let item of historyItems) {
    const clone = document.importNode(template.content, true);
    const pageLinkEl = clone.querySelector('.page-link');
    const pageTitleEl = clone.querySelector('.page-title');
    const pageVisitTimeEl = clone.querySelector('.page-visit-time');
    const imageWrapperEl = clone.querySelector('.image-wrapper');
    const checkbox = clone.querySelector('.removeCheck, input');
    checkbox.setAttribute('value', item.url);
    const favicon = document.createElement('img');
    pageLinkEl.href = item.url;
    favicon.src = faviconURL(item.url);
    pageLinkEl.textContent = item.url;
    imageWrapperEl.prepend(favicon);
    pageVisitTimeEl.textContent = new Date(item.lastVisitTime).toLocaleString();
    if (!item.title) {
      pageTitleEl.style.display = 'none';
    }
    pageTitleEl.innerText = item.title;

    clone
      .querySelector('.removeButton, button')
      .addEventListener('click', async function () {
        await chrome.history.deleteUrl({ url: item.url });
        location.reload();
      });

    clone
      .querySelector('.history')
      .addEventListener('click', async function (event) {
        // fix double click
        if (event.target.className === 'removeCheck') {
          return;
        }

        checkbox.checked = !checkbox.checked;
      });
    historyDiv.appendChild(clone);
  }
}

document.getElementById('searchSubmit').onclick = async function () {
  historyDiv.innerHTML = ' ';
  const searchQuery = document.getElementById('searchInput').value;
  const historyItems = await chrome.history.search({
    text: searchQuery,
    startTime: kOneWeekAgo
  });
  constructHistory(historyItems);
};

document.getElementById('deleteSelected').onclick = async function () {
  const checkboxes = document.getElementsByTagName('input');
  for (let checkbox of checkboxes) {
    if (checkbox.checked == true) {
      await chrome.history.deleteUrl({ url: checkbox.value });
    }
  }
  location.reload();
};

document.getElementById('removeAll').onclick = async function () {
  await chrome.history.deleteAll();
  location.reload();
};

chrome.history
  .search({
    text: '',
    startTime: kOneWeekAgo,
    maxResults: 99
  })
  .then(constructHistory);
