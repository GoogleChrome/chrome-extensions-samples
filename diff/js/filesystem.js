/**
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

var FILE_SIZE = 1024 * 1024;
var displayNames = [null, null];
var paths = [null, null];
var fileEntries = [null, null];
var texts = [null, null];
var urlNum = null;
var badURL = false;

$(document).ready(function() {
  readFile('file0.txt', 0);
  readFile('file1.txt', 1);
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
    var text = getText(1);
    $('#arrow-container').addClass('arrow-edit');
    $('.file-diff.1').addClass('hidden');
    $('textarea.diff-text').val(text);
    $('textarea.diff-text').removeClass('hidden');
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
        badURL = false;
        texts[urlNum] = text;
        var name = 'file' + urlNum + '.txt';
        saveFile(text, name);
        saveFile(displayNames[urlNum], 'name' + urlNum + '.txt');
      },
      'html'
    );
  } else {
    badURL = false;
  }
}

function selectFile(fileNum) {
  chrome.fileSystem.chooseFile({'type': 'openFile'}, function(fileEntry) {
    fileEntries[fileNum] = fileEntry;
    chrome.fileSystem.getDisplayPath(fileEntry, function(path) {
      path = path.split('/');
      displayNames[fileNum] = path[path.length - 1];
      $('.modal-dialog.new-diff .file-name.' + fileNum).text(displayNames[fileNum]);
      fileEntries[fileNum].file(function(file) {
        var reader = new FileReader();
        reader.onloadend = function(e) {
          $('.error-message.' + fileNum).removeClass('visible');
          $('.url.' + fileNum).removeClass('form-error');
          $('input.url.' + fileNum).val('');
          texts[fileNum] = this.result;
          var name = 'file' + fileNum + '.txt';
          saveFile(this.result, name);
          saveFile(displayNames[fileNum], 'name' + fileNum + '.txt');
        };
        reader.readAsText(file);
      }, errorHandler);
    });
  });
}

function submitDiffs() {
  if (texts[0] && texts[1] && !badURL) {
    $('.file-name.0').text(displayNames[0]);
    $('.file-name.1').text(displayNames[1]);
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
  chrome.fileSystem.chooseFile({'type': 'saveFile'}, function(fileEntry) {
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
            if (texts[0] && texts[1]) computeDiff(texts[0], texts[1]);
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
            displayNames[fileNum] = this.result;
            $('.file-name.' + fileNum).text(this.result)
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
