/**
 * Copyright (c) 2012 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 **/

var dmp = new diff_match_patch();
dmp.Diff_Timeout = 1;
var clicked;
var selectedChunk = 0;
var totalChunks;
var totalCollapsible = 0;
var numCollapsed;

$(document).ready(function() {

  var buttons = [ '#new-diff',
                  '#save',
                  '#edit',
                  '#expand-all',
                  '#collapse-all',
                  '#next-chunk',
                  '#prev-chunk'
                ];

  for (var i = 0; i < buttons.length; i++) {
    $(buttons[i]).hover(
      function() {
        var button = $(this).attr('id');
        $('.tooltip.' + button).removeClass('hidden');
      },
      function() {
        var button = $(this).attr('id');
        $('.tooltip.' + button).addClass('hidden');
      }
    );
  }

  // Check for connection every 5 seconds
  setInterval(function() {
    if (navigator.onLine) {
      $('.offline').addClass('hidden');
      $('.url').removeClass('hidden');
    } else {
      $('.offline').removeClass('hidden');
      $('.url').addClass('hidden');
    }
  }, 500);

  $('.file-diff > div').click(function() {
    console.log(this);
    selectChunk(this);
  });

  for (i = 0; i < 2; i++) {
    $('.file-diff.' + i).scroll(function() {
      var i = $(this).attr('class').split(' ')[1];
      $('.file-diff.' + ((parseInt(i) + 1) % 2)).scrollTop(
          $('.file-diff.' + i).scrollTop());
      $('#arrow-container').scrollTop($('.file-diff.' + i).scrollTop());
      $('#check-container').scrollTop($('.file-diff.' + i).scrollTop());
    });
  }

  $('#arrow-container').scroll(function() {
    $('.file-diff').scrollTop($('#arrow-container').scrollTop());
    $('#check-container').scrollTop($('#arrow-container').scrollTop());
  });

  $('#check-container').scroll(function() {
    $('.file-diff').scrollTop($('#check-container').scrollTop());
    $('#arrow-container').scrollTop($('#check-container').scrollTop());
  });

  $('#collapse-all').click(function () {
    collapseAllMatches();
  });

  $('#expand-all').click(function () {
    expandAllMatches();
  });

  $('#prev-chunk').click(function() {
    selectPrevChunk();
  });

  $('#next-chunk').click(function() {
    selectNextChunk();
  });

  $(document).keyup(function(event) {
    var target = event.target || event.srcElement;
    var targetName = target.tagName.toLowerCase();
    if (!disableShortcuts()) {
      keyboardShortcut(event);
    }
  });
});

function keyboardShortcut(event) {
  if (event.which == 74)
    selectNextChunk();
  else if (event.which == 75)
    selectPrevChunk();
  else if ((event.which == 76) 
            && (selectedChunk > 0) && (selectedChunk <= totalChunks))
    moveChunk('chunk-' + selectedChunk);
  else if ((event.which == 82) 
            && (selectedChunk > 0) && (selectedChunk <= totalChunks))
    checkRight('chunk-' + selectedChunk);
  else if (event.which == 69)
    expandAllMatches();
  else if (event.which == 67)
    collapseAllMatches();
}


function disableShortcuts () {
  return ( !$('#modal-shield').hasClass('hidden') 
           || $('.button.edit').hasClass('hidden')
         )
}

function getText(fileNum) {
  var lines = $('.file-diff.' + fileNum + ' div').children('.text');
  var text = '';
  for (var i = 0; i < lines.length; i++) {
    if (!isBlankLine($(lines[i]).parent(), null)
        && !$(lines[i]).hasClass('hidden')) {
      var line = $(lines[i]).children();
      for (var j = 0; j < line.length; j++) {
        if ($(lines[i]).hasClass('merged')) {
          if (fileNum == 1 && !$(line[j]).hasClass('ins'))
            text += $(line[j]).html();
          if (fileNum == 0 && !$(line[j]).hasClass('del'))
            text += $(line[j]).html();
        } else {
          if (fileNum == 0 && !$(line[j]).hasClass('ins'))
            text += $(line[j]).html();
          if (fileNum == 1 && !$(line[j]).hasClass('del'))
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

function getChunk(line) {
  return $(line).attr('class').replace('del ', '')
                              .replace('ins ', '')
                              .replace('blank ', '')
                              .replace('first ', '')
                              .replace('chunk ', '')
                              .replace('fix ', '')
                              .replace('correct ', '')
                              .split(' ')[1];
}

function getRealLine(line) {
  var classes =  $(line).attr('class');
  classes = classes.replace('del ', '')
                   .replace('ins ', '')
                   .replace('blank ', '')
                   .replace('first ', '')
                   .replace('fix ', '')
                   .replace('correct ', '')
                   .replace('chunk ', '');
  var realLine = classes.split(' ')[0];
  return realLine;
}

function computeDiff(file1, file2) {
  var d = dmp.diff_main(file1, file2);
  dmp.diff_cleanupSemantic(d);
  var ds = createHtmlLines(d);
  if (texts[0] != '')
    $('.file-diff.0').html(ds[0]);
  if (texts[1] != '')
    $('.file-diff.1').html(ds[1]);
  setLineTypes();
  setLineNums();
  if (texts[0] != '' && texts[1] != '') {
    setNumDiffs(true);
    setArrowsAndChecks();
    createCollapsibleMatches();
    $('.button.save').removeClass('hidden');
    $('.button.edit').removeClass('hidden');
    $('#collapse-all').removeClass('hidden');
    $('#expand-all').removeClass('hidden');
  }
}

function patchToFile2(file1, patchText) {
  var patches = dmp.patch_fromText(patchText);
  var patchData = dmp.patch_apply(patches, file1);
  return patchData[0];
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
  $('#file0-container .file-diff > div').each(function () {
    var spans = $(this).children();
    var displayed = [];
    for (var i = 0; i < spans.length; i++) {
      if (!$(spans[i]).hasClass('ins'))
        displayed.push(spans[i])
    }
    if (displayed.length == 0) {
      $(this).addClass('blank');
      $(this).prepend('<div class="expand"></div>');
    }
    $(this).has('.del').addClass('del');
    $(this).has('.ins').addClass('ins');
  });
  $('#file1-container .file-diff > div').each(function () {
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

  $('.file-diff > div').last().remove('.blank');
}

function isBlankLine(lineDiv, realLineNum) {
  if ($(lineDiv).attr('class') && !realLineNum) {
    var realLine = getRealLine(lineDiv);
  } else {
    var realLine = 'realLine-' + realLineNum;
  }
  return ( $(lineDiv).hasClass('blank')
           && !$(lineDiv).hasClass('fix') 
           && !$(lineDiv).hasClass('correct')
         )
         || ( $(lineDiv).hasClass('fix')
              && ($('#file0-container .' + realLine).hasClass('blank'))
            )
         || ( $(lineDiv).hasClass('correct')
              && ($('#file1-container .' + realLine).hasClass('blank'))
            )
         || $(lineDiv).hasClass('collapsed-num');
}

function setLineNums() {
  files = [0, 1];
  for (var i = 0; i < files.length; i++) {
    var lineNum = 1;
    var realLineNum = 1;
    $('.file-diff.' + files[i] + ' > div').each(function() {
      if (!isBlankLine(this, realLineNum)) {
        $(this).html('<div class="text orig">' + $(this).html() + '</div>');
        $(this).prepend('<div class="lineNum">' + lineNum + '</div>');
        if ($(this).parent().hasClass('0'))
          $(this).prepend('<div class="expand"></div>');
        lineNum += 1;
      }
      $(this).addClass('realLine-' + realLineNum);
      realLineNum += 1;
    });
  }
}

function resetLineNums() {
  var files = [0, 1];
  $('.file-diff > div > div.lineNum').remove();
  for (var i = 0; i < files.length; i++) {
    var lineNum = 1;
    var realLineNum = 1;
    $('.file-diff.' + files[i] + ' > div').each(function() {
      if (!isBlankLine(this, realLineNum)) {
        $(this).prepend('<div class="lineNum">' + lineNum + '</div>');
        lineNum += 1;
      }
      realLineNum += 1;
    });
  }
}

function setArrowsAndChecks() {
  var numChunks = 0;
  var arrow = '<div class="arrow"></div>';
  var check = '<div class="check"></div>';
  var cont = 0;
  $('#arrow-container').html('');
  $('#check-container').html('');
  var lines = $('.file-diff.0').children('div');
  for (var j =  0; j < lines.length; j++) {
    var $line = $(lines[j]);
    if ( $line.hasClass('ins')
         || $line.hasClass('del')
         || $line.hasClass('blank')
       ) {
      if (cont == 0) numChunks += 1;
      cont += 1;
    }
    else if (cont > 0) {
      insertArrowAndCheck(cont, numChunks);
      cont = 0;
      $('#arrow-container').append(arrow);
      $('#check-container').append(check);
    }
    else {
      $('#arrow-container').append(arrow);
      $('#check-container').append(check);
    }
  }
  if (cont > 0) insertArrowAndCheck(cont, numChunks);
  setArrowClicks();
  setCheckClicks();
}

function insertArrowAndCheck(cont, numChunks) {
  var mid = (cont / 2) | 0;
  var arrow = '<div class="arrow"></div>';
  var check = '<div class="check"></div>';
  for (var k = 0; k < mid; k++) {
    $('#arrow-container').append(arrow);
    $('#check-container').append(check);
  }
  $('#arrow-container').append('<div class="holder hidden '
                               + 'chunk-' + numChunks + '"></div>');
  $('#check-container').append('<div class="holder hidden '
                               + 'chunk-' + numChunks + '"></div>');
  $('#arrow-container').append('<div class="arrow visible '
                               + 'chunk-' + numChunks + '"></div>');
  $('#arrow-container').append('<div class="undo visible hidden '
                               + 'chunk-' + numChunks + '"></div>');
  $('#check-container').append('<div class="check visible '
                               + 'chunk-' + numChunks + '"></div>');
  $('#check-container').append('<div class="undo visible hidden '
                               + 'chunk-' + numChunks + '"></div>');
  for (var k = mid + 1; k < cont; k++) {
    $('#arrow-container').append(arrow);
    $('#check-container').append(check);
  }
}

function setNumDiffs(set) {
  var diffChunks = numDiffChunks(set);
  if (diffChunks == 1)
    $('#num-diffs').html(diffChunks + ' conflict');
  else
    $('#num-diffs').html(diffChunks + ' conflicts');
}

function numDiffChunks(set) {
  var files = [0, 1];
  var numChunks = [0, 0];
  for (var i = 0; i < files.length; i++) {
    var cont = 0;
    var lines = $('.file-diff.' + files[i]).children('div');
    for (var j =  0; j < lines.length; j++) {
      var $line = $(lines[j]);
      if (( $line.hasClass('ins') ||
            $line.hasClass('del') ||
            $line.hasClass('blank')
          ) && !$line.hasClass('fix')
            && !$line.hasClass('correct')) {
        if (cont == 0) {
          numChunks[files[i]] += 1;
          $line.addClass('first');
        }
        cont += 1;
        if (set) {
          $line.addClass('chunk');
          $line.addClass('chunk-' + numChunks[files[i]]);
	      }
      } else if (cont > 0) {
        cont = 0;
        $(lines[j-1]).addClass('last');
      }
    }
    if (cont > 0) $(lines[lines.length - 1]).addClass('last');
  }
  totalChunks = Math.max(numChunks[0], numChunks[1]);
  if (selectedChunk == 0)
    selectChunk(0);
  return totalChunks;
}

function selectChunk(chunkNum) {
  $('#next-chunk').removeClass('disabled');
  $('#prev-chunk').removeClass('disabled');
  if (chunkNum > totalChunks)
    $('#next-chunk').addClass('disabled');
  if (chunkNum < 1)
    $('#prev-chunk').addClass('disabled')
  if ((chunkNum >= 0) && (chunkNum <= totalChunks + 1)) {
    selectedChunk = chunkNum;
    $('.file-diff div').removeClass('selected-chunk');
    $('.chunk-' + chunkNum).addClass('selected-chunk');
    if ((chunkNum == 0) || (chunkNum == 1))
      $('.file-diff').scrollTop(0);
    else if (chunkNum == totalChunks + 1)
      $('.file-diff').scrollTop($('.file-diff').scrollHeight);
    else
      $('.file-diff').scrollTop($('.file-diff').scrollTop()
                                + $('.chunk-' + chunkNum).position().top - 80);
  }
}

function selectNextChunk() {
  var chunkNum = selectedChunk + 1;
  while ( chunkNum <= totalChunks  
          && ( $('.chunk-' + chunkNum).hasClass('fix')
               || $('.chunk-' + chunkNum).hasClass('correct')
             )
        )
    chunkNum += 1;
  selectChunk(chunkNum);
}

function selectPrevChunk() {
  var chunkNum = selectedChunk - 1;
  while ( chunkNum > 0  
          && ( $('.chunk-' + chunkNum).hasClass('fix')
               || $('.chunk-' + chunkNum).hasClass('correct')
             )
        )
    chunkNum -= 1;
  selectChunk(chunkNum);
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

function setCheckClicks() {
  $('#check-container div.check.visible').click(function () {
    var chunkNum = $(this).attr('class').replace('check ', '')
                                        .replace('visible ', '')
                                        .split(' ')[0];
    checkRight(chunkNum);
  });

  $('#check-container div.undo.visible').click(function () {
    var chunkNum = $(this).attr('class').replace('undo ', '')
                                        .replace('visible ', '')
                                        .split(' ')[0];
    undoCheckRight(chunkNum);
  });
}

function createCollapsibleMatches() {
  var lines1 = $('.file-diff.0').children('div');
  var lines2 = $('.file-diff.1').children('div');
  var arrows = $('#arrow-container').children('div.arrow');
  var checks = $('#check-container').children('div.check');
  var numContMatches = 0;
  for (var i = 0; i < lines1.length; i++) {
    if ( !$(lines1[i]).hasClass('ins') &&
         !$(lines1[i]).hasClass('del') &&
         !$(lines1[i]).hasClass('blank')
       ) {
      numContMatches += 1;
    } else {
      collapse(lines1, lines2, arrows, checks, numContMatches, i)
      numContMatches = 0;
    }
  }
  collapse(lines1, lines2, arrows, checks, numContMatches, lines1.length);

  $('.collapsed-num > .plus').click(function () {
    var collapsedNumClass = $(this).attr('class').split(' ')[0];
    var $collapsedNum = $('div.' + collapsedNumClass);
    expandSection($collapsedNum);
  });

  $('.minus').click(function() {
    var collapsedNumClass = $(this).parent().attr('class').split(' ')[2];
    var $collapsedNum = $('div.' + collapsedNumClass);
    collapseSection($collapsedNum);
  });
  numCollapsed = totalCollapsible;
  if (numCollapsed > 0)
    $('#expand-all').removeClass('disabled');
}

function collapse(lines1, lines2, arrows, checks, numContMatches, i) {
  totalCollapsible += 1;
  if (numContMatches > 10) {
    var firstCol = i - numContMatches + 5;
    var lastCol = i - 5;
    var numCol = lastCol - firstCol;
    var firstLine = firstCol + '-line';
    for (var l = firstCol; l < lastCol; l++) {
      $(lines1[l]).addClass('hidden collapsible ' + firstLine);
      $(lines2[l]).addClass('hidden collapsible ' + firstLine);
      $(arrows[l]).addClass('hidden collapsible ' + firstLine);
      $(checks[l]).addClass('hidden collapsible ' + firstLine);
    }
    $(lines1[firstCol]).before('<div class="collapsed-num ' + firstLine + '">'
                               + '<div class="' + firstLine + ' expand plus"></div>'
                               + numCol + ' lines collapsed' + '</div>');
    $(lines2[firstCol]).before('<div class="collapsed-num ' + firstLine + '">'
                               + numCol + ' lines collapsed' + '</div>');
    $(arrows[firstCol]).before('<div class="arrow collapsed-num '
                               + firstLine + '"></div>');
    $(checks[firstCol]).before('<div class="check collapsed-num '
                               + firstLine + '"></div>');
    $(lines1[firstCol]).children(':first').addClass('minus');
  }
}

function moveChunk(chunkNum) {
  var lines1 = $('.file-diff.0').children('div.' + chunkNum);
  var lines2 = $('.file-diff.1').children('div.' + chunkNum);
  for (var i = 0; i < lines1.length; i++) {
    var realLineNum = getRealLine(lines1[i]);
    var text = '';
    if ($('.file-diff.0 .' + realLineNum).children('.text.orig').length > 0)
      text = $('.file-diff.0 .' + realLineNum + ' > div.text').html();
    var div = '<div class="merged text">' + text + '</div>';
    $('.file-diff.1 > .' + realLineNum + ' > .text.orig').addClass('hidden');
    $('.file-diff.1 > .' + realLineNum).append(div);
    $('.file-diff.0 > .' + realLineNum).addClass('fix');
    $('.file-diff.1 > .' + realLineNum).addClass('fix');
  }
  $('#arrow-container .arrow.' + chunkNum).addClass('hidden');
  $('#check-container .check.' + chunkNum).addClass('hidden');
  $('#arrow-container .undo.' + chunkNum).removeClass('hidden');
  $('#check-container .holder.' + chunkNum).removeClass('hidden');
  resetLineNums();
  var numChunks = totalChunks - 1;
  if (numChunks == 1)
    $('#num-diffs').html(numChunks + ' conflict');
  else
    $('#num-diffs').html(numChunks + ' conflicts');
  var text = getText(1);
  saveFile(text, 'file1.txt');
  var num = parseInt(chunkNum.slice(6));
  if (selectedChunk == num)
    selectNextChunk();
}

function undoMoveChunk(chunkNum) {
  var lines1 = $('.file-diff.0').children('div.' + chunkNum);
  var lines2 = $('.file-diff.1').children('div.' + chunkNum);
  for (var i = 0; i < lines1.length; i++) {
    var lineNum = getRealLine(lines1[i]);
    $('.file-diff.1 > .' + lineNum + ' > .text.orig').removeClass('hidden');
    $('.file-diff.1 > .' + lineNum + ' > .merged').remove();
    $('.file-diff.0 > .' + lineNum).removeClass('fix');
    $('.file-diff.1 > .' + lineNum).removeClass('fix');
  }
  $('#arrow-container .arrow.' + chunkNum).removeClass('hidden');
  $('#check-container .check.' + chunkNum).removeClass('hidden');
  $('#arrow-container .undo.' + chunkNum).addClass('hidden');
  $('#check-container .holder.' + chunkNum).addClass('hidden');
  $('#arrow-container .holder.' + chunkNum).addClass('hidden');
  resetLineNums();
  var numChunks = totalChunks + 1;
  if (numChunks == 1)
    $('#num-diffs').html(numChunks + ' conflict');
  else
    $('#num-diffs').html(numChunks + ' conflicts');
  var text = getText(1);
  saveFile(text, 'file1.txt');
  var num = parseInt(chunkNum.slice(6));
  selectChunk(num);
}

function checkRight(chunkNum) {
  var lines1 = $('.file-diff.0').children('div.' + chunkNum);
  var lines2 = $('.file-diff.1').children('div.' + chunkNum);
  for (var i = 0; i < lines1.length; i++) {
    var realLineNum = getRealLine(lines1[i]);
    var text = '';
    if ($('.file-diff.1 .' + realLineNum).children('.text.orig').length > 0)
      text = $('.file-diff.1 .' + realLineNum + ' > div.text').html();
    var div = '<div class="merged text">' + text + '</div>';
    $('.file-diff.0 > .' + realLineNum + ' > .text.orig').addClass('hidden');
    $('.file-diff.0 > .' + realLineNum).append(div);
    $('.file-diff.0 > .' + realLineNum).addClass('correct');
    $('.file-diff.1 > .' + realLineNum).addClass('correct');
  }
  $('#arrow-container .arrow.' + chunkNum).addClass('hidden');
  $('#check-container .check.' + chunkNum).addClass('hidden');
  $('#check-container .undo.' + chunkNum).removeClass('hidden');
  $('#arrow-container .holder.' + chunkNum).removeClass('hidden');
  resetLineNums();
  var numChunks = totalChunks - 1;
  if (numChunks == 1)
    $('#num-diffs').html(numChunks + ' conflict');
  else
    $('#num-diffs').html(numChunks + ' conflicts');
  var text = getText(0);
  saveFile(text, 'file0.txt');
  var num = parseInt(chunkNum.slice(6));
  if (selectedChunk == num)
    selectNextChunk();
}

function undoCheckRight(chunkNum) {
  var lines1 = $('.file-diff.0').children('div.' + chunkNum);
  var lines2 = $('.file-diff.1').children('div.' + chunkNum);
  for (var i = 0; i < lines1.length; i++) {
    var lineNum = getRealLine(lines1[i]);
    $('.file-diff.0 > .' + lineNum + ' > .text.orig').removeClass('hidden');
    $('.file-diff.0 > .' + lineNum + ' > .merged').remove();
    $('.file-diff.0 > .' + lineNum).removeClass('correct');
    $('.file-diff.1 > .' + lineNum).removeClass('correct');
  }
  $('#arrow-container .arrow.' + chunkNum).removeClass('hidden');
  $('#check-container .check.' + chunkNum).removeClass('hidden');
  $('#check-container .undo.' + chunkNum).addClass('hidden');
  $('#check-container .holder.' + chunkNum).addClass('hidden');
  $('#arrow-container .holder.' + chunkNum).addClass('hidden');
  resetLineNums();
  var numChunks = totalChunks + 1;
  if (numChunks == 1)
    $('#num-diffs').html(numChunks + ' conflict');
  else
    $('#num-diffs').html(numChunks + ' conflicts');
  var text = getText(0);
  saveFile(text, 'file0.txt');
  var num = parseInt(chunkNum.slice(6));
  selectChunk(num);
}

function expandAllMatches() {
  numCollapsed = 0;
  $('div.collapsible').removeClass('hidden');
  $('div.collapsed-num').addClass('hidden');
  $('#expand-all').addClass('disabled');
  $('#collapse-all').removeClass('disabled');
}

function collapseAllMatches() {
  numCollapsed = totalCollapsible;
  $('div.collapsible').addClass('hidden');
  $('div.collapsed-num').removeClass('hidden');
  $('.plus').removeClass('hidden');
  $('#expand-all').removeClass('disabled');
  $('#collapse-all').addClass('disabled');
}

function expandSection($collapsedNum) {
  numCollapsed -= 1;
  var classes = $collapsedNum.attr('class');
  var c = classes.replace('collapsed-num ', '').split(' ')[0];
  $collapsedNum.addClass('hidden');
  $('div.collapsible.' + c).removeClass('hidden');
  $('#collapse-all').removeClass('disabled');
  if (numCollapsed == 0)
    $('#expand-all').addClass('disabled');
}

function collapseSection($collapsedNum) {
  numCollapsed += 1;
  var classes = $collapsedNum.attr('class');
  var c = classes.replace('collapsible ', '')
                 .replace('collapsed-num ', '')
                 .split(' ')[0];
  $collapsedNum.removeClass('hidden');
  $('div.collapsible.' + c).addClass('hidden');
  $('#expand-all').removeClass('disabled');
  if (numCollapsed == totalCollapsible)
    $('#collapse-all').addClass('disabled');
}
