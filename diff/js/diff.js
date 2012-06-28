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

  $('.edit').click(function() {
    var text = getText();
    $('#arrow-container').addClass('arrow-edit');
    $('.file-diff.2').addClass('hidden');
    $('textarea.diff-text').val(text);
    $('textarea.diff-text').scrollTop($('.file-diff.1').scrollTop());
    $('textarea.diff-text').removeClass('hidden');
    $('.edit').addClass('hidden');
    $('.done').removeClass('hidden');
  });

  $('.done').click(function() {
    var text = $('textarea.diff-text').val();
    var fileName = $('#file2-container div.file-name').text();
    var filePath = $('#file2-container div.tooltip-text').text();
    setText(text, fileName, 1, filePath);
    $('#arrow-container').removeClass('arrow-edit');
    $('.file-diff.2').removeClass('hidden');
    $('textarea.diff-text').addClass('hidden');
    $('.edit').removeClass('hidden');
    $('.done').addClass('hidden');
  });

  $('textarea.diff-text').scroll(function () {
    $('.file-diff.1').scrollTop($('textarea.diff-text').scrollTop());
    $('.file-diff.2').scrollTop($('textarea.diff-text').scrollTop());
    $('#arrow-container').scrollTop($('textarea.diff-text').scrollTop());
    $('#plus-container').scrollTop($('textarea.diff-text').scrollTop());
  });

  for (i = 1; i < 3; i++) {
    $('.choose-file.' + i).change(function() {
      var i = $(this).attr('class').split(' ')[1];
      var $fileArea = $('.file-diff.' + i);
      var file = this.files[0];
      var fileName = $('input[type=file].' + i).val();
      fileName = fileName.slice(12, fileName.length);
      setTextFromFile(file, fileName, $fileArea, i - 1);
      $('.file-diff.' + i).scrollTop(0);
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
      $('#arrow-container').scrollTop($('.file-diff.' + i).scrollTop());
      $('#plus-container').scrollTop($('.file-diff.' + i).scrollTop());
      $('textarea.diff-text').scrollTop($('.file-diff.' + i).scrollTop());
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

function getText() {
  var lines = $('.file-diff.2 div').children('.text');
  var text = '';
  for (var i = 0; i < lines.length; i++) {
    if (!$(lines[i]).hasClass('hidden')) {
      var line = $(lines[i]).children();
      for (var j = 0; j < line.length; j++) {
        if ($(lines[i]).hasClass('left')) {
          if (!$(line[j]).hasClass('ins'))
            text += $(line[j]).html();
        } else {
          if (!$(line[j]).hasClass('del'))
            text += $(line[j]).html();
        }
      }
      text += '\n';
    }
  }
  text = escapeHtml(text);
  return text;
}

function escapeHtml(text) {
  var text = text.replace(/&amp;/g, '&')
                 .replace(/&lt;/g, '<')
                 .replace(/&gt;/g, '>')
                 .replace(/&nbsp;/g, ' ');
  return text;
}

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
  if (!(url.slice(0, 4) == 'http')) {
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
    setNumDiffs(true);
    setArrows();
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
              html1 += '</div><div>';
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

function isBlankLine(lineDiv) {
  if ($(lineDiv).attr('class'))
    var lineNum = $(lineDiv).attr('class').replace('blank ', '')
                                          .replace('ins ', '')
                                          .replace('del ', '')
                                          .split(' ')[0];
  return ( $(lineDiv).hasClass('blank') && !$(lineDiv).hasClass('fix') )
         || ( ($(lineDiv).children('.left.text').length > 0)
              && ($('.file-diff.1 .' + lineNum).hasClass('blank'))
            )
         || ( ($(lineDiv).hasClass('blank') && $(lineDiv).hasClass('fix'))
              && ($(lineDiv).children('.left.text').length == 0)
            )
         || $(lineDiv).hasClass('collapsed-num');
}

function setLineNums() {
  files = [1, 2];
  var realLine = 1;
  for (var i = 0; i < files.length; i++) {
    var lineNum = 1;
    realLine = 1;
    $('.file-diff.' + files[i] + ' > div').each(function() {
      if (!isBlankLine(this)) {
        $(this).html('<div class="text right">' + $(this).html() + '</div>');
        $(this).prepend('<div class="lineNum">' + lineNum + '</div>');
        lineNum += 1;
      }
      $(this).addClass('realLine-' + realLine);
      realLine += 1;
    });
  }
}

function resetLineNums() {
  var files = [1, 2];
  $('.file-diff > div > div.lineNum').remove();
  for (var i = 0; i < files.length; i++) {
    var lineNum = 1;
    $('.file-diff.' + files[i] + ' > div').each(function() {
      if (!isBlankLine(this)) {
        $(this).prepend('<div class="lineNum">' + lineNum + '</div>');
        lineNum += 1;
      }
    });
  }
}

function setArrows() {
  var numChunks = 0;
  var arrow = '<div class="arrow"></div>';
  var cont = 0;
  $('#arrow-container').html('');
  var lines = $('.file-diff.1').children('div');
  for (var j =  0; j < lines.length; j++) {
    var $line = $(lines[j]);
    if ($line.hasClass('ins') ||
        $line.hasClass('del') ||
        $line.hasClass('blank')) {
      if (cont == 0) {
        numChunks += 1;
      }
      cont += 1;
    } else if (cont > 0) {
      var mid = (cont / 2) | 0;
      for (var k = 0; k < mid; k++)
        $('#arrow-container').append(arrow);
      $('#arrow-container').append('<div class="arrow visible '
                                   + 'chunk-' + numChunks + '"></div>');
      $('#arrow-container').append('<div class="undo visible hidden '
                                   + 'chunk-' + numChunks + '"></div>');
      for (var k = mid + 1; k < cont; k++)
        $('#arrow-container').append(arrow);
      cont = 0;
      $('#arrow-container').append(arrow);
    } else {
      $('#arrow-container').append(arrow);
    }
  }
  setArrowClicks();
}

function setNumDiffs(set) {
  var diffChunks = numDiffChunks(set);
  $('#num-diffs').html(diffChunks + ' differences');
}

function numDiffLines() {
  var files = [0, 1];
  var numDiffs = [0, 0];
  for (var i = 0; i < files.length; i++) {
    $('.file-diff.' + (files[i] + 1) + ' div').each(function(lineNum) {
      if (( $(this).hasClass('ins') ||
            $(this).hasClass('del') ||
            $(this).hasClass('blank')
          ) && !$(this).hasClass('fix')) {
        numDiffs[files[i]] += 1;
      }
    });
  }
  return Math.max(numDiffs[0], numDiffs[1])
}

function numDiffChunks(set) {
  var files = [0, 1];
  var numChunks = [0, 0];
  for (var i = 0; i < files.length; i++) {
    var cont = 0;
    var lines = $('.file-diff.' + (files[i] + 1)).children('div');
    for (var j =  0; j < lines.length; j++) {
      var $line = $(lines[j]);
      if (( $line.hasClass('ins') ||
            $line.hasClass('del') ||
            $line.hasClass('blank')
          ) && !$line.hasClass('fix')) {
        if (cont == 0) {
          numChunks[files[i]] += 1;
        }
        cont += 1;
        if (set)
          $line.addClass('chunk-' + numChunks[files[i]]);
      } else if (cont > 0) {
        cont = 0;
      }
    }
  }
  return Math.max(numChunks[0], numChunks[1]);
}

function setArrowClicks() {
  $('#arrow-container div.arrow.visible').click(function () {
    var chunkNum = $(this).attr('class').replace('arrow ', '')
                                        .replace('visible ', '')
                                        .split(' ')[0];
    moveChunk(chunkNum);
  });

  $('#arrow-container div.undo.visible').click(function () {
    var chunkNum = $(this).attr('class').replace('undo ', '')
                                        .replace('visible ', '')
                                        .split(' ')[0];
    undoMoveChunk(chunkNum);
  });
}

function createCollapsibleMatches() {
  var lines1 = $('.file-diff.1').children('div');
  var lines2 = $('.file-diff.2').children('div');
  var arrows = $('#arrow-container').children('div');
  var plusses = $('#plus-container').children('div');
  var numContMatches = 0;
  for (var i = 0; i < lines1.length; i++) {
    if (!$(lines1[i]).hasClass('ins') &&
        !$(lines1[i]).hasClass('del') &&
        !$(lines1[i]).hasClass('blank')) {
      numContMatches += 1;
    } else {
      collapse(lines1, lines2, arrows, plusses, numContMatches, i)
      numContMatches = 0;
    }
  }
  collapse(lines1, lines2, arrows, plusses, numContMatches, lines1.length);

  $('.collapsed-num > a').click(function () {
    var collapsedNumClass = $(this).attr('class');
    var $collapsedNum = $('div.' + collapsedNumClass);
    expandSection($collapsedNum);
  });
}

function collapse(lines1, lines2, arrows, plusses, numContMatches, i) {
  if (numContMatches > 10) {
    var firstCol = i - numContMatches + 6;
    var lastCol = i - 5;
    var numCol = lastCol - firstCol;
    var firstLine = firstCol + '-line';
    for (var l = firstCol; l < lastCol; l++) {
      $(lines1[l]).addClass('hidden collapsible ' + firstLine);
      $(lines2[l]).addClass('hidden collapsible ' + firstLine);
      $(arrows[l]).addClass('hidden collapsible ' + firstLine);
      $(plusses[l]).addClass('hidden collapsible ' + firstLine);
    }
    $(lines1[firstCol]).before('<div class="collapsed-num ' + firstLine + '">'
                               + numCol + ' lines collapsed (<a class="'
                               + firstLine + '">expand</a>)</div>');
    $(lines2[firstCol]).before('<div class="collapsed-num ' + firstLine + '">'
                               + numCol + ' lines collapsed (<a class="'
                               + firstLine + '">expand</a>)</div>');
    $(arrows[firstCol]).before('<div class="arrow collapsed-num '
                               + firstLine + '"></div>');
    $(plusses[firstCol]).addClass('minus');
    $(plusses[firstCol]).before('<div class="plus ' + firstLine + '"></div>');
  }
}

function moveChunk(chunkNum) {
  var lines1 = $('.file-diff.1').children('div.' + chunkNum);
  var lines2 = $('.file-diff.2').children('div.' + chunkNum);
  for (var i = 0; i < lines1.length; i++) {
    var realLineNum = $(lines1[i]).attr('class')
                                  .replace('ins ', '')
                                  .replace('del ', '')
                                  .replace('blank ', '')
                                  .split(' ')[0];
    var text = '';
    if ($('.file-diff.1 .' + realLineNum).children('.text.right').length > 0)
      text = $('.file-diff.1 .' + realLineNum + ' > div.text').html();
    var div = '<div class="left text">' + text + '</div>';
    $('.file-diff.2 > .' + realLineNum + ' > .text.right').addClass('hidden');
    $('.file-diff.2 > .' + realLineNum).append(div);
    $('.file-diff.1 > .' + realLineNum).addClass('fix');
    $('.file-diff.2 > .' + realLineNum).addClass('fix');
  }
  $('#arrow-container .arrow.' + chunkNum).addClass('hidden');
  $('#arrow-container .undo.' + chunkNum).removeClass('hidden');
  resetLineNums();
  setNumDiffs();
  var text = getText();
  saveFile(text, 'file1.txt');
}

function undoMoveChunk(chunkNum) {
  var lines1 = $('.file-diff.1').children('div.' + chunkNum);
  var lines2 = $('.file-diff.2').children('div.' + chunkNum);
  for (var i = 0; i < lines1.length; i++) {
    var lineNum = $(lines1[i]).attr('class')
                              .replace('ins ', '')
                              .replace('del ', '')
                              .replace('blank ', '')
                              .replace('fix ', '')
                              .split(' ')[0];
    $('.file-diff.2 > .' + lineNum + ' > .text.right').removeClass('hidden');
    $('.file-diff.2 > .' + lineNum + ' > .left').remove();
    $('.file-diff.1 > .' + lineNum).removeClass('fix');
    $('.file-diff.2 > .' + lineNum).removeClass('fix');
  }
  $('#arrow-container .arrow.' + chunkNum).removeClass('hidden');
  $('#arrow-container .undo.' + chunkNum).addClass('hidden');
  resetLineNums();
  setNumDiffs();
  var text = getText();
  saveFile(text, 'file1.txt');
}

function expandAllMatches() {
  $('div.collapsible').removeClass('hidden');
  $('div.collapsed-num').addClass('hidden');
  $('div.plus').addClass('hidden');
}

function collapseAllMatches() {
  $('div.collapsible').addClass('hidden');
  $('div.collapsed-num').removeClass('hidden');
  $('div.plus').removeClass('hidden');
}

function expandSection($collapsedNum) {
  var classes = $collapsedNum.attr('class');
  var c = classes.replace('collapsed-num ', '')
                 .replace('plus ', '')
                 .split(' ')[0];
  $collapsedNum.addClass('hidden');
  $('div.plus.' + c).addClass('hidden');
  $('div.collapsible.' + c).removeClass('hidden');
}

function collapseSection($collapsedNum) {
  var classes = $collapsedNum.attr('class');
  var c = classes.replace('collapsible ', '')
                 .replace('minus ', '')
                 .split(' ')[0];
  $collapsedNum.removeClass('hidden');
  $('div.plus.' + c).removeClass('hidden');
  $('div.collapsible.' + c).addClass('hidden');
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
