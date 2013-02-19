var supportsSyncFileSystem = chrome && chrome.syncFileSystem;

document.addEventListener(
  'DOMContentLoaded',
  function() {
    $('#fs-syncable').addEventListener('click', openSyncableFileSystem);
    $('#fs-temporary').addEventListener('click', openTemporaryFileSystem);

    if (supportsSyncFileSystem)
      openSyncableFileSystem();
    else
      openTemporaryFileSystem();
  }
);

function onFileSystemOpened(fs) {
  console.log('Got FileSystem:' + fs.name);
  var editor = new Editor(fs, 'editor');
  var filer = new Filer(fs, 'filer', editor);
  editor.filer = filer;
}

function openTemporaryFileSystem() {
  $('#fs-temporary').classList.add('selected');
  $('#fs-syncable').classList.remove('selected');
  webkitRequestFileSystem(TEMPORARY, 1024,
                          onFileSystemOpened,
                          error.bind(null, 'requestFileSystem'));
}

function openSyncableFileSystem() {
  if (!chrome || !chrome.syncFileSystem ||
      !chrome.syncFileSystem.requestFileSystem) {
    error('Syncable FileSystem is not supported in your environment.');
    return;
  }
  $('#fs-syncable').classList.add('selected');
  $('#fs-temporary').classList.remove('selected');
  chrome.syncFileSystem.requestFileSystem(function (fs) {
    if (chrome.runtime.lastError) {
      error('requestFileSystem: ' + chrome.runtime.lastError.message);
      return;
    }
    onFileSystemOpened(fs);
  });
}
