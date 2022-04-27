// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Search the bookmarks when entering the search keyword.
$('#search').change(function() {
  $('#bookmarks').empty();
  dumpBookmarks($('#search').val());
});

// Traverse the bookmark tree, and print the folder and nodes.
function dumpBookmarks(query) {
  var bookmarkTreeNodes = chrome.bookmarks.getTree(function(bookmarkTreeNodes) {
    $('#bookmarks').append(dumpTreeNodes(bookmarkTreeNodes, query));
  });
}

function dumpTreeNodes(bookmarkNodes, query) {
  var list = $('<ul>');
  for (var i = 0; i < bookmarkNodes.length; i++) {
    list.append(dumpNode(bookmarkNodes[i], query));
  }

  return list;
}

function dumpNode(bookmarkNode, query) {
  if (bookmarkNode.title) {
    if (query && !bookmarkNode.children) {
      if (String(bookmarkNode.title.toLowerCase())
              .indexOf(query.toLowerCase()) == -1) {
        return $('<span></span>');
      }
    }

    var anchor = $('<a>');
    anchor.attr('href', bookmarkNode.url);
    anchor.text(bookmarkNode.title);

    /*
     * When clicking on a bookmark in the extension, a new tab is fired with
     * the bookmark url.
     */
    anchor.click(function() { chrome.tabs.create({url : bookmarkNode.url}); });

    var span = $('<span>');
    var options =
        bookmarkNode.children
            ? $('<span>[<a href="#" id="addlink">Add</a>]</span>')
            : $('<span>[<a id="editlink" href="#">Edit</a> <a id="deletelink" ' +
                'href="#">Delete</a>]</span>');
    var edit =
        bookmarkNode.children
            ? $('<table><tr><td>Name</td><td>' +
                '<input id="title"></td></tr><tr><td>URL</td><td><input id="url">' +
                '</td></tr></table>')
            : $('<input>');

    // Show add and edit links when hover over.
    span.hover(
            function() {
              span.append(options);
              $('#deletelink').click(function(event) {
                $('#deletedialog')
                    .empty()
                    .dialog({
                      autoOpen : false,
                      closeOnEscape : true,
                      title : 'Confirm Deletion',
                      modal : true,
                      show : 'slide',
                      position : {
                        my : "left",
                        at : "center",
                        of : event.target.parentElement.parentElement
                      },
                      buttons : {
                        'Yes, Delete It!' : function() {
                          chrome.bookmarks.remove(String(bookmarkNode.id));
                          span.parent().remove();
                          $(this).dialog('destroy');
                        },
                        Cancel : function() { $(this).dialog('destroy'); }
                      }
                    })
                    .dialog('open');
              });
              $('#addlink').click(function(event) {
                edit.show();
                $('#adddialog')
                    .empty()
                    .append(edit)
                    .dialog({
                      autoOpen : false,
                      closeOnEscape : true,
                      title : 'Add New Bookmark',
                      modal : true,
                      show : 'slide',
                      position : {
                        my : "left",
                        at : "center",
                        of : event.target.parentElement.parentElement
                      },
                      buttons : {
                        'Add' : function() {
                          edit.hide();
                          chrome.bookmarks.create({
                            parentId : bookmarkNode.id,
                            title : $('#title').val(),
                            url : $('#url').val()
                          });
                          $('#bookmarks').empty();
                          $(this).dialog('destroy');
                          window.dumpBookmarks();
                        },
                        'Cancel' : function() {
                          edit.hide();
                          $(this).dialog('destroy');
                        }
                      }
                    })
                    .dialog('open');
              });
              $('#editlink').click(function(event) {
                edit.show();
                edit.val(anchor.text());
                $('#editdialog')
                    .empty()
                    .append(edit)
                    .dialog({
                      autoOpen : false,
                      closeOnEscape : true,
                      title : 'Edit Title',
                      modal : true,
                      show : 'fade',
                      position : {
                        my : "left",
                        at : "center",
                        of : event.target.parentElement.parentElement
                      },
                      buttons : {
                        'Save' : function() {
                          edit.hide();
                          chrome.bookmarks.update(String(bookmarkNode.id),
                                                  {title : edit.val()});
                          anchor.text(edit.val());
                          options.show();
                          $(this).dialog('destroy');
                        },
                        'Cancel' : function() {
                          edit.hide();
                          $(this).dialog('destroy');
                        }
                      }
                    })
                    .dialog('open');
              });
              options.fadeIn();
            },

            // unhover
            function() { options.remove(); })
        .append(anchor);
  }

  var li = $(bookmarkNode.title ? '<li>' : '<div>').append(span);
  if (bookmarkNode.children && bookmarkNode.children.length > 0) {
    li.append(dumpTreeNodes(bookmarkNode.children, query));
  }

  return li;
}

document.addEventListener('DOMContentLoaded', function() { dumpBookmarks(); });
