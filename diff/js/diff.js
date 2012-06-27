/**
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

var dmp = new diff_match_patch();
dmp.Diff_Timeout = 1;
var texts = ['', ''];
var clicked;
var FILE_SIZE = 1024 * 1024;

$(document).ready(function() {

  readFileName('name0.txt', 0);
  readFileName('name1.txt', 1);

  // Check for connection every 5 seconds
  setInterval(function() {
    if (navigator.onLine) {
      $('.offline').addClass('hidden');
      $('.url').removeClass('hidden');
    } else {
      $('.offline').removeClass('hidden');
      $('.url').addClass('hidden');
      $('.close-button').click();
    }
  }, 500);

  for (i = 1; i < 3; i++) {
    $('.choose-file.' + i).change(function() {
      var i = $(this).attr('class').split(' ')[1];
      var $fileArea = $('.file-diff.' + i);
      var file = this.files[0];
      var fileName = $('input[type=file].' + i).val();
      fileName = fileName.slice(12, fileName.length);
      setTextFromFile(file, fileName, $fileArea, i - 1);
      $('.file-diff-input.' + i).scrollTop(0);
      $('a.tooltip-text.' + i).text(fileName);
    });

    $('.choose-file.' + i).hover(
      function(event) {
        var i = $(this).attr('class').split(' ')[1];
        event.preventDefault();
        event.stopPropagation();
        $('#file' + i + '-container .tooltip').addClass('visible');
      },
      function(event) {
        var i = $(this).attr('class').split(' ')[1];
        event.preventDefault();
        event.stopPropagation();
        $('#file' + i + '-container .tooltip').removeClass('visible');
      }
    );

    var dropZone = document.getElementById('drop-zone' + i);
    dropZone.addEventListener('dragover', handleDragOver, false);
    dropZone.addEventListener('drop', handleDrop, false);

    $('.choose-url.' + i).click(function () {
      var i = $(this).attr('class').split(' ')[1];
      clicked = i - 1;
      $('#modal-shield').removeClass('hidden');
      $('.enter-url').removeClass('hidden').addClass('visible');
      $('.enter-url input').focus();
    });

    $('.file-diff.' + i).scroll(function () {
      var i = $(this).attr('class').split(' ')[1];
      $('.file-diff.' + (i % 2 + 1)).scrollTop(
          $('.file-diff.' + i).scrollTop());
    });
  }

  $('.close-button').click(function() {
    $('.modal-dialog').addClass('hidden').removeClass('visible');
    $('#modal-shield').addClass('hidden');
    $('.enter-url input').val('');
    $('.error-message').addClass('hidden');
    $('#url').removeClass('form-error');
  });

  $('.enter-url .button.cancel').click(function() {
    $('.close-button').click();
  });

  $('.enter-url .button.submit').click(function() {
    var url = $('.enter-url #url').val();
    setTextFromUrl();
    $('.file-diff.1').scrollTop(0);
    $('.tooltip-text.' + (clicked + 1)).text(url);
  });

  $('.enter-url #url').keyup(function(event) {
    if (event.keyCode == 13) {
      $('.enter-url .button.submit').click();
    }
  });

  $('#collapse-all').click(function () {
    collapseAllMatches();
  });

  $('#expand-all').click(function () {
    expandAllMatches();
  });


  $.ajaxSetup({
    error: function(xhr) {
      message = ajaxErrorMessage(xhr);
      $('.error-message').text(message);
      $('.error-message').removeClass('hidden');
      $('#url').addClass('form-error');
    }
  });
});


function ajaxErrorMessage(xhr) {
  message = 'Please enter a valid URL';
  switch (xhr.status) {
    case 401:
      message = 'You do not have permission to view that URL';
      break;
    case 403:
      message = 'You do not have permission to view that URL';
      break;
    case 404:
      message = 'The URL you entered could not be found';
      break;
    case 500:
      message = 'There was a server error';
      break;
  }
  return message;
}

function setTextFromUrl() {
  var url = $('.enter-url input#url').val();
  if (!(url.slice(0, 3) == 'http')) {
    url = 'http://' + url;
  }
  var urlSecs = url.split('/');
  var urlFile = urlSecs[urlSecs.length-1];
  $.get(url,
        function(text) {
          if (url != '') {
            setText(text, urlFile, clicked, url);
            $('.close-button').click();
          }
        },
        'html'
  );
}

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

function setTextFromFile(file, fileName, $fileArea, fileNum) {
  if (file) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var content = event.target.result;
      setText(content, fileName, fileNum, fileName);
    };
    reader.readAsText(file);
  }
}

function setText(content, fileName, fileNum, filePath) {
  texts[fileNum] = content;
  if (texts[0] != '' && texts[1] != '') {
    computeDiff(texts[0], texts[1]);
  } else if (texts[fileNum] != '') {
    computeDiff(content, content);
  }
  $('.file-name.' + (fileNum + 1)).text(fileName);
  $('.tooltip-text.' + (fileNum + 1)).text(fileName);
  var name = 'file' + fileNum + '.txt';
  saveFile(content, name);
  saveFile(fileName, 'name' + fileNum + '.txt');
}

function selectFile() {
  chrome.fileSystem.chooseFile({'type': 'openFile'}, function(fileEntry) {
    fileEntry.file(function(file) {
      var reader = new FileReader();
      reader.onloadend = function(e) {
        readFile('file' + fileNum + '.txt', fileNum, this.result)
      };
      reader.readAsText(file);
    }, errorHandler);
  });
}

function saveFile(content, fileName) {
  window.webkitRequestFileSystem(
    window.PERSISTENT,
    FILE_SIZE,
    function(fs) {
      fs.root.getFile(fileName, {create: true}, function(fileEntry) {
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
      }, errorHandler);
    },errorHandler);
}

function readFileName(readFileName, fileNum) {
  window.webkitRequestFileSystem(
    window.PERSISTENT,
    FILE_SIZE,
    function(fs) {
      fs.root.getFile(readFileName, {}, function(fileEntry) {

        fileEntry.file(function(file) {
          var reader = new FileReader();

          reader.onloadend = function(e) {
            readFile('file' + fileNum + '.txt', fileNum, this.result)
          };

          reader.readAsText(file);
        }, errorHandler);

      }, errorHandler);
    }, errorHandler);
}

function readFile(fileReadName, fileNum, fileName) {
  window.webkitRequestFileSystem(
    window.PERSISTENT,
    FILE_SIZE,
    function(fs) {
      fs.root.getFile(fileReadName, {}, function(fileEntry) {

        fileEntry.file(function(file) {
          var reader = new FileReader();

          reader.onloadend = function(e) {
            setText(this.result, fileName, fileNum, fileName);
          };

          reader.readAsText(file);
        }, errorHandler);

      }, errorHandler);
    }, errorHandler);
}

function computeDiff(file1, file2) {
  var d = dmp.diff_main(file1, file2);
  dmp.diff_cleanupSemantic(d);
  var ds = createHtmlLines(d);
  if (texts[0] != '')
    $('.file-diff.1').html(ds[0]);
  if (texts[1] != '')
    $('.file-diff.2').html(ds[1]);
  setLineTypes();
  setLineNums();
  if (texts[0] != '' && texts[1] != '') {
    setNumDiffs();
    createCollapsibleMatches();
  }
}

function createHtmlLines(diffs) {
  var pattern_amp = /&/g;
  var pattern_lt = /</g;
  var pattern_gt = />/g;
  var pattern_para = /\n/g;
  var pattern_cr = /\r/g;
  var pattern_space = / /g;
  var pattern_para_sign = /<span class="hidden">&para;<\/span>/g;
  var line1 = 1;
  var line2 = 1;
  var html1 = '<div>';
  var html2 = '<div>';

  for (var x = 0; x < diffs.length; x++) {
    var op = diffs[x][0];    // Operation (insert, delete, equal)
    var data = diffs[x][1];  // Text of change.
    var text = data.replace(pattern_amp, '&amp;')
                   .replace(pattern_lt, '&lt;')
                   .replace(pattern_gt, '&gt;')
                   .replace(pattern_para, '&para;<br>')
                   .replace(pattern_cr, '&para;<br>')
                   .replace(pattern_space, '&nbsp;')
                   .replace(pattern_para_sign, '&para;<br>');
    text = text.split('<br>');
    for (var i = 0; i < text.length; i++) {
      if (text[i] != "") {
        switch (op) {
          case DIFF_INSERT:
            var len = text[i].length;
            if (len > 5 && text[i].slice(len - 6, len) == '&para;')
              line2 += 1;
            txt2 = '<span class="ins">' + text[i] + '</span>';
            html2 += txt2;
            html1 += txt2;
            break;
          case DIFF_DELETE:
            var len = text[i].length;
            if (len > 5 && text[i].slice(len - 6, len) == '&para;')
              line1 += 1;
            txt1 = '<span class="del">' + text[i] + '</span>';
            html1 += txt1;
            html2 += txt1;
            break;
          case DIFF_EQUAL:
            while (line1 > line2) {
              line2 += 1;
              html2 += '</div><div>';
            } while (line2 > line1) {
              line1 += 1;
              html2 += '</div><div>';
            }
            txt = '<span>' + text[i] + '</span>';
            html1 += txt;
            html2 += txt;
            break;
        }
      }
    }
  }
  while (line1 > line2) {
    html2 += '</div><div>';
    line2 += 1;
  } while (line2 > line1) {
    html1 += '</div><div>';
    line1 += 1;
  }
  html1 = html1.replace(/&para;/g,
                        '</div><span class="hidden">&para;</span><div>')
            + '</div>';
  html2 = html2.replace(/&para;/g,
                        '</div><span class="hidden">&para;</span><div>')
            + '</div>';
  return [html1, html2];
}

function setLineTypes() {
  $('#file1-container .file-diff > div').each(function () {
    var spans = $(this).children();
    var displayed = [];
    for (var i = 0; i < spans.length; i++) {
      if (!$(spans[i]).hasClass('ins'))
        displayed.push(spans[i])
    }
    if (displayed.length == 0) {
      $(this).addClass('blank');
    }
    $(this).has('.del').addClass('del');
    $(this).has('.ins').addClass('ins');
  });
  $('#file2-container .file-diff > div').each(function () {
    var spans = $(this).children();
    var displayed = [];
    for (var i = 0; i < spans.length; i++) {
      if (!$(spans[i]).hasClass('del'))
        displayed.push(spans[i])
    }
    if (displayed.length == 0) {
      $(this).addClass('blank');
    }
    $(this).has('.del').addClass('del');
    $(this).has('.ins').addClass('ins');
  });

  $('.file-diff > div').remove('.blank.ins');
  $('.file-diff > div').remove('.blank.del');

  $('.file-diff > div:last-child').remove();
}

function setLineNums() {
  files = [1, 2];
  for (var j = 0; j < files.length; j++) {
    lineNum = 1;
    $('.file-diff.' + files[j] + ' > div').each(function() {
      if (!$(this).hasClass('blank')) {
        $(this).prepend('<div class="lineNum">' + lineNum + '</div>');
        lineNum += 1;
      }
    });
  }
}

function setNumDiffs() {
  var diffLines = numDiffLines();
  var diffChunks = numDiffChunks();
  $('#num-diffs').html('Different Lines: ' + diffLines
                       + '<br>Different Chunks: ' + diffChunks);
}

function numDiffChunks() {
  var files = [0, 1];
  var numChunks = [0, 0];
  for (var i = 0; i < files.length; i++) {
    var cont = false;
    var lines = $('.file-diff.' + (files[i] + 1) + ' div').children();
    for (var j =  0; j < lines.length; j++) {
      var $line = $(lines[j]).parent();
      if ($line.hasClass('ins') ||
          $line.hasClass('del') ||
          $line.hasClass('blank')) {
        if (!cont) {
          cont = true;
          numChunks[files[i]] += 1;
        }
        $line.addClass('chunk-' + numChunks[files[i]]);
      } else {
        cont = false;
      }
    }
  }
  return Math.max(numChunks[0], numChunks[1]);
}

function numDiffLines() {
  var files = [0, 1];
  var numDiffs = [0, 0];
  for (var i = 0; i < files.length; i++) {
    $('.file-diff.' + (files[i] + 1) + ' div').each(function(lineNum) {
      if ($(this).hasClass('ins') ||
          $(this).hasClass('del') ||
          $(this).hasClass('blank')) {
        numDiffs[files[i]] += 1;
      }
    });
  }
  return Math.max(numDiffs[0], numDiffs[1])
}

function createCollapsibleMatches() {
  var lines1 = $('.file-diff.1').children('div');
  var lines2 = $('.file-diff.2').children('div');
  var numContMatches = 0;
  for (var i = 0; i < lines1.length; i++) {
    if (!$(lines1[i]).hasClass('ins') &&
        !$(lines1[i]).hasClass('del') &&
        !$(lines1[i]).hasClass('blank')) {
      numContMatches += 1;
    } else {
      collapse(lines1, lines2, numContMatches, i)
      numContMatches = 0;
    }
  }
  collapse(lines1, lines2, numContMatches, lines1.length);

  $('.collapsed-num a').click(function () {
    var collapsedNumClass = $(this).attr('class');
    var $collapsedNum = $('div.' + collapsedNumClass);
    expandSection($collapsedNum);
  });
}

function collapse(lines1, lines2, numContMatches, i) {
  if (numContMatches > 10) {
    var firstCol = i - numContMatches + 5;
    var lastCol = i - 6;
    var numCol = lastCol - firstCol + 1
    var firstLine = firstCol + '-line';
    for (var l = firstCol; l <= lastCol; l++) {
      $(lines1[l]).addClass('hidden collapsible');
      $(lines2[l]).addClass('hidden collapsible');
      $(lines1[l]).addClass(firstLine);
      $(lines2[l]).addClass(firstLine);
    }
    $(lines1[firstCol]).before('<div class="collapsed-num ' + firstLine + '">'
                             + numCol + ' lines collapsed (<a class="'
                             + firstLine + '">expand</a>)</div>');
    $(lines2[firstCol]).before('<div class="collapsed-num ' + firstLine + '">'
                             + numCol + ' lines collapsed (<a class="'
                             + firstLine + '">expand</a>)</div>');
  }
}

function expandAllMatches() {
  $('.file-diff > div.collapsible').removeClass('hidden');
  $('.file-diff div.collapsed-num').addClass('hidden');
}

function collapseAllMatches() {
  $('.file-diff > div.collapsible').addClass('hidden');
  $('.file-diff div.collapsed-num').removeClass('hidden');
}

function expandSection($collapsedNum) {
  var classes = $collapsedNum.attr('class');
  var c = classes.replace(/(?:^|\s)(collapsed-num)(?=\s|$)/g, '').split(' ');
  c = c[1];
  $collapsedNum.addClass('hidden');
  $('div.collapsible.' + c).removeClass('hidden');
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
