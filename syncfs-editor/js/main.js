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

function onFileSystemOpened(fs, isSyncable) {
  log('Got Syncable FileSystem.');
  console.log('Got FileSystem:' + fs.name);
  var editor = new Editor(fs, 'editor');
  var filer = new Filer(fs, 'filer', editor, isSyncable);
  editor.filer = filer;
}

function openTemporaryFileSystem() {
  $('#fs-temporary').classList.add('selected');
  $('#fs-syncable').classList.remove('selected');
  hide('#conflict-policy')
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
  if (chrome.syncFileSystem.setConflictResolutionPolicy) {
    chrome.syncFileSystem.setConflictResolutionPolicy('last_write_win');
    show('#conflict-policy')
  }
  log('Obtaining syncable FileSystem...');
  chrome.syncFileSystem.requestFileSystem(function (fs) {
    if (chrome.runtime.lastError) {
      error('requestFileSystem: ' + chrome.runtime.lastError.message);
      $('#fs-syncable').classList.remove('selected');
      hide('#conflict-policy')
      return;
    }
    onFileSystemOpened(fs, true);
  });
}

$('#conflict-policy').addEventListener('click', function() {
  if ($('#auto-conflict-resolve').checked)
    policy = 'last_write_win';
  else
    policy = 'manual';
  chrome.syncFileSystem.setConflictResolutionPolicy(policy);
  log('Changed conflict resolution policy to: ' + policy);
});
