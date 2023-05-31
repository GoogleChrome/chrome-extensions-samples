// Force all downloads to overwrite any existing files instead of inserting
// ' (1)', ' (2)', etc.

chrome.downloads.onDeterminingFilename.addListener(function (item, suggest) {
  suggest({
    filename: item.filename,
    conflictAction: 'overwrite'
  });
});
