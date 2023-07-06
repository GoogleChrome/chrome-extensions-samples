const kMillisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
const kOneWeekAgo = new Date().getTime() - kMillisecondsPerWeek;
const historyDiv = document.getElementById('historyDiv');

function faviconURL(u) {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', u);
  url.searchParams.set('size', '16');
  return url.toString();
}

function constructHistory(historyItems) {
  const template = document.getElementById('historyTemplate');
  for (let item of historyItems) {
    const titleLink = template.content.querySelector('.titleLink, a');
    const pageName = template.content.querySelector('.pageName, p');
    const checkbox = template.content.querySelector('.removeCheck, input');
    checkbox.setAttribute('value', item.url);
    const favicon = document.createElement('img');
    const host = new URL(item.url).host;
    titleLink.href = item.url;
    favicon.src = faviconURL(item.url);
    titleLink.textContent = host;
    titleLink.prepend(favicon);
    pageName.innerText = item.title;
    if (item.title === '') {
      pageName.innerText = host;
    }
    const clone = document.importNode(template.content, true);
    clone
      .querySelector('.removeButton, button')
      .addEventListener('click', async function () {
        await chrome.history.deleteUrl({ url: item.url });
        location.reload();
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

document.getElementById('seeAll').onclick = function () {
  location.reload();
};

chrome.history
  .search({
    text: '',
    startTime: kOneWeekAgo,
    maxResults: 99
  })
  .then(constructHistory);
