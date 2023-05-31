async function getOpeningIds() {
  let { openWhenComplete: ids } = await chrome.storage.session.get([
    'openWhenComplete'
  ]);
  return ids || [];
}

async function setOpeningIds(ids) {
  await chrome.storage.session.set({ openWhenComplete: ids });
}

chrome.downloads.onChanged.addListener(async function (delta) {
  if (!delta.state || delta.state.current != 'complete') {
    return;
  }
  const ids = await getOpeningIds();
  if (ids.indexOf(delta.id) < 0) {
    return;
  }
  chrome.downloads.open(delta.id);
  ids.splice(ids.indexOf(delta.id), 1);
  await setOpeningIds(ids);
});

chrome.contextMenus.onClicked.addListener(async function (info, tab) {
  const downloadId = await chrome.downloads.download({ url: info.linkUrl });
  const ids = await getOpeningIds();
  if (ids.indexOf(downloadId) >= 0) {
    return;
  }
  ids.push(downloadId);
  await setOpeningIds(ids);
});

chrome.contextMenus.create({
  id: 'open',
  title: chrome.i18n.getMessage('openContextMenuTitle'),
  contexts: ['link']
});
