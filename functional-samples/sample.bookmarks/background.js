async function init() {
  const tree = await chrome.bookmarks.getTree();
  console.log('tree', tree);
}

init();
