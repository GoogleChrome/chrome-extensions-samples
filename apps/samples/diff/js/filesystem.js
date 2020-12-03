/**
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

var FILE_SIZE = 1024 * 1024;
var displayNames = [null, null];
var paths = {};
var fileEntries = [null, null];
var texts = [null, null];
var urlNum = null;
var badURL = false;

var fileHistory = {};

$(document).ready(function() {

  readFileName('name0.txt', 0);
  readFileName('name1.txt', 1);

  $('#left-side .button.new-diff').click(function() {
    $('#modal-shield').removeClass('hidden');
    $('.modal-dialog.new-diff').removeClass('hidden').addClass('visible');
  });

  $('.close-button').click(function() {
    $('.modal-dialog').addClass('hidden').removeClass('visible');
    $('#modal-shield').addClass('hidden');
    $('.enter-url input').val('');
    $('.error-message').removeClass('visible');
    $('.url').removeClass('form-error');
    $('input.url').val('');
  });

  $('.button.cancel').click(function() {
    $('.close-button').click();
  });

  $('.modal-dialog.new-diff .button.submit').click(function() {
    submitDiffs();
  });

  $('.modal-dialog.new-diff .choose-file.0').click(function() {
    selectFile(0);
  });
  $('.modal-dialog.new-diff .choose-file.1').click(function () {
    selectFile(1);
  });

  $('.edit').click(function() {
    var text1 = getText(1);
    $('#arrow-container').addClass('arrow-edit');
    $('#check-container').addClass('check-edit');
    $('.file-diff.1').addClass('hidden');
    $('textarea.diff-text').val(text1);
    $('.diff-text#editor').removeClass('hidden');
    $('.edit').addClass('hidden');
    $('.save').addClass('hidden');
    $('#num-diffs').addClass('hidden');
    $('.done').removeClass('hidden');
  });

  $('.done').click(function() {
    texts[1] = $('textarea.diff-text').val();
    saveFile(texts[1], 'file1.txt');
    computeDiff(texts[0], texts[1]);
    $('#arrow-container').removeClass('arrow-edit');
    $('#check-container').removeClass('check-edit');
    $('.file-diff.1').removeClass('hidden');
    $('textarea.diff-text').addClass('hidden');
    $('.edit').removeClass('hidden');
    $('#num-diffs').removeClass('hidden');
    $('.done').addClass('hidden');
    $('.save').removeClass('hidden');
  });

  $('.save').click(function() {
    saveFileAs();
  });

  $('input.url').blur(function() {
    urlNum = $(this).attr('class').split(' ')[1];
    selectURL();
  });

  $('.menubutton').click(function(event) {
    if (!$(this).hasClass('menulist')) {
      event.preventDefault();
      event.stopPropagation();
      $(this).children('ul.menulist').addClass('shown');
    }
  });

  $(document).click(function() {
    $('ul.menulist').removeClass('shown');
  });

  $.ajaxSetup({
    error: function(xhr) {
      badURL = true;
      message = ajaxErrorMessage(xhr);
      $('.error-message.' + urlNum).text(message);
      $('.error-message.' + urlNum).addClass('visible');
      $('input.url.' + urlNum).addClass('form-error');
    }
  });

});

function registerMenulistitemClicks() {
  $('li.menulistitem').click(function() {
    if ($(this).hasClass('choose-new-file')) {
      var fileNum = parseInt($(this).parent().attr('class').split(' ')[1]);
      selectFile(fileNum, true);
    }
    else if (!$(this).hasClass('selected')) {
      var fileNum = parseInt($(this).parent().attr('class').split(' ')[1]);
      var fileName = $(this).children('.file-name').text();
      $(this).parent().children('li.menulistitem').removeClass('selected');
      $(this).addClass('selected');
      displayNames[fileNum] = fileName;
      texts[fileNum] = fileHistory[paths[fileName]];
      setFileName(fileNum);
      saveFile(texts[fileNum], 'file' + fileNum + '.txt');
      saveFile(paths[displayNames[fileNum]], 'name' + fileNum + '.txt');
      computeDiff(texts[0], texts[1]);
    }
    $('.menulist').removeClass('shown');
  });

  $('li.menulistitem .delete').click(function() {
    var name = $(this).parent().children('.file-name').text();
    var path = paths[name];
    delete fileHistory[path];
    chrome.storage.local.set({'fileHistory': fileHistory});
    $('li.menulistitem').each(function() {
      if ($(this).children('.file-name').text() == name)
        $(this).remove();
    })
  });
}

function selectURL() {
  $('.error-message.' + urlNum).removeClass('visible');
  $('.url.' + urlNum).removeClass('form-error');
  var url = $('.modal-dialog.new-diff input.url.' + urlNum).val();
  if (url != '') {
    if (!(url.slice(0, 4) == 'http'))
      url = 'http://' + url;
    $.get(url,
      function(text) {
        var urlSecs = url.split('/');
        displayNames[urlNum] = urlSecs[urlSecs.length-1];
        paths[displayNames[urlNum]] = url;
        badURL = false;
        texts[urlNum] = text;
        rememberFile(fileNum);
        var name = 'file' + urlNum + '.txt';
        saveFile(text, name);
        saveFile(paths[displayNames[urlNum]], 'name' + urlNum + '.txt');
      },
      'html'
    );
  } else {
    badURL = false;
  }
}

function selectFile(fileNum, chooseNew) {
  chrome.fileSystem.chooseEntry({'type': 'openFile'}, function(fileEntry) {
    fileEntries[fileNum] = fileEntry;
    chrome.fileSystem.getDisplayPath(fileEntry, function(path) {
      var pathList = path.split('/');
      var l = pathList.length - 1;
      displayNames[fileNum] = pathList[l];
      paths[displayNames[fileNum]] = path;
      $('.modal-dialog.new-diff .file-name.' + fileNum).text(displayNames[fileNum]);
      fileEntries[fileNum].file(function(file) {
        var reader = new FileReader();
        reader.onloadend = function(e) {
          $('.error-message.' + fileNum).removeClass('visible');
          $('.url.' + fileNum).removeClass('form-error');
          $('input.url.' + fileNum).val('');
          texts[fileNum] = this.result;
          rememberFile(fileNum);
          var name = 'file' + fileNum + '.txt';
          saveFile(texts[fileNum], name);
          saveFile(paths[displayNames[fileNum]], 'name' + fileNum + '.txt');
          if (chooseNew)
            chooseNewFile(fileNum);
        };
        reader.readAsText(file);
      }, errorHandler);
    });
  });
}

function getExtension(fileName) {
  var parts = fileName.split('.');
  return parts[parts.length - 1];
}

function isPatch(fileName) {
  return getExtension(fileName).toLowerCase() == 'patch';
}

function addToMenulistDisplayed(listNum, displayNum, selected) {
  var name = displayNames[displayNum];
  var path = paths[displayNames[displayNum]].split('/').slice(-5, -2).join('/');
  $('ul.menulist.' + listNum).append(
      '<li class="menulistitem ' + selected + '">'
      + '<span class="file-name">' + name + '</span>'
      + '<span class="file-name-info"> - ' + path + '</span>'
      + '<span class="delete"></span></li>');
}

function addToMenulist(path) {
  var pathSecs = path.split('/');
  var name = pathSecs[pathSecs.length - 1];
  var displayPath = pathSecs.slice(-5, -2).join('/');
  paths[name] = path;
  for (var listNum = 0; listNum < 2; listNum++) {
    $('ul.menulist.' + listNum).append(
        '<li class="menulistitem">'
        + '<span class="file-name">' + name + '</span>'
        + '<span class="file-name-info"> - ' + displayPath + '</span>'
        + '<span class="delete"></span></li>');
  }
}

function setFileName(fileNum) {
  var name = displayNames[fileNum];
  var path = paths[displayNames[fileNum]].split('/').slice(-5, -2).join('/');
  $('#file' + fileNum + '-container .label.file-name').html(
      '<span class="file-name">' + name + '</span>'
      + '<span class="file-name-info"> - ' + path + '</span>');
}

function createDropdown() {
  $('ul.menulist').html('<li class="menulistitem choose-new-file">Choose File</li>');
  for (path in fileHistory) {
    if (path == paths[displayNames[0]]) {
      addToMenulistDisplayed(0, 0, 'selected');
      addToMenulistDisplayed(0, 1, '');
    }
    else if (path == paths[displayNames[1]]) {
      addToMenulistDisplayed(1, 0, '');
      addToMenulistDisplayed(1, 1, 'selected');
    }
    else {
      addToMenulist(path);
    }
  }
  registerMenulistitemClicks();
}

function rememberFile(fileNum) {
  fileHistory[paths[displayNames[fileNum]]] = texts[fileNum];
  chrome.storage.local.set({'fileHistory': fileHistory});
  $('ul.menulist.' + fileNum + ' .menulistitem').removeClass('selected');
  addToMenulistDisplayed(fileNum, fileNum, 'selected');
  addToMenulistDisplayed(((fileNum + 1) % 2), fileNum, '');
  registerMenulistitemClicks();
}

function selectRememberedFile(fileNum, fileName) {
  texts[fileNum] = fileHistory[paths[fileName]];
  displayNames[fileNum] = fileName;
  submitDiffs();
}

function submitDiffs() {
  if (texts[0] && texts[1] && !badURL) {
    setFileName(0);
    setFileName(1);
    if (isPatch(displayNames[1])) {
      texts[1] = patchToFile2(texts[0], texts[1]);
      rememberFile(1);
      saveFile(texts[1], 'file1.txt');
    }
    computeDiff(texts[0], texts[1]);
    $('.modal-dialog.new-diff .close-button').click();
    $('.button.edit').removeClass('hidden');
    $('.button.save').removeClass('hidden');
  }
  if (!texts[0]) {
    $('.error-message.0').text('Please select a file or URL.');
    $('.error-message.0').addClass('visible');
  }
  if (!texts[1]) {
    $('.error-message.1').text('Please select a file or URL.');
    $('.error-message.1').addClass('visible');
  }
}

function chooseNewFile(fileNum) {
  setFileName(fileNum);
  if (texts[0] && texts[1]) {
    if ((fileNum == 1) && isPatch(displayNames[1])) {
      texts[1] = patchToFile2(texts[0], texts[1]);
      rememberFile(1);
      saveFile(texts[1], 'file1.txt');
    }
    computeDiff(texts[0], texts[1]);
  }
  else
    $('.file-diff.' + fileNum).text(texts[fileNum]);
  if (fileNum == 1) {
    $('.button.edit').removeClass('hidden');
    $('.button.save').removeClass('hidden');
  }
}

function saveFile(content, fileName) {
  window.webkitRequestFileSystem(
    window.PERSISTENT,
    FILE_SIZE,
    function(fs) {
      fs.root.getFile(fileName, {create: true}, function(fileEntry) {
        save(fileEntry, content);
      }, errorHandler);
    },errorHandler);
}

function saveFileAs() {
  chrome.fileSystem.chooseEntry({'type': 'saveFile'}, function(fileEntry) {
    save(fileEntry, getText(1));
  });
}

function save(fileEntry, content) {
  fileEntry.createWriter(function(fileWriter) {
    fileWriter.onwriteend = function(e) {
      fileWriter.onwriteend = null;
      fileWriter.truncate(content.length);
    };
    fileWriter.onerror = function(e) {
      console.log('Write failed: ' + e.toString());
    };
    var blob = new Blob([content], {'type': 'text/plain'});
    fileWriter.write(blob);
  }, errorHandler);
}

function readFile(fileName, fileNum) {
  window.webkitRequestFileSystem(
    window.PERSISTENT,
    FILE_SIZE,
    function(fs) {
      fs.root.getFile(fileName, {}, function(fileEntry) {
        fileEntry.file(function(file) {
          var reader = new FileReader();
          reader.onloadend = function(e) {
            texts[fileNum] = this.result;
            if (texts[0] && texts[1]) {
              chrome.storage.local.get(function(items) {
                for (key in items['fileHistory'])
                  fileHistory[key] = items['fileHistory'][key];
                createDropdown();
                computeDiff(texts[0], texts[1]);
              });
            }
          };
          reader.readAsText(file);
        }, errorHandler);
      }, errorHandler);
    }, errorHandler);
}

function readFileName(fileName, fileNum) {
  window.webkitRequestFileSystem(
    window.PERSISTENT,
    FILE_SIZE,
    function(fs) {
      fs.root.getFile(fileName, {}, function(fileEntry) {
        fileEntry.file(function(file) {
          var reader = new FileReader();
          reader.onloadend = function(e) {
            path = this.result;
            var pathList = path.split('/');
            var l = pathList.length - 1;
            displayNames[fileNum] = pathList[l];
            paths[displayNames[fileNum]] = path;
            setFileName(fileNum);
            readFile('file' + fileNum + '.txt', fileNum);
          };
          reader.readAsText(file);
        }, errorHandler);
      }, errorHandler);
    }, errorHandler);
}

function errorHandler(e) {
  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };
  console.log('Error: ' + msg);
}

/*
function handleDragOver(event) {
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
}

function handleDrop(event) {
  event.stopPropagation();
  event.preventDefault();
  var file = event.dataTransfer.files[0];
  var fileName = escape(file.name);
  var fileNum;
  if ($(this).hasClass('1'))
    fileNum = 0;
  else
    fileNum = 1;
  setTextFromFile(file, fileName, $(this), fileNum);
}
*/
