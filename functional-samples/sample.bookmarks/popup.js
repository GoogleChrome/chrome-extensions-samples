// Copyright 2021 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

// Search the bookmarks when entering the search keyword.
$('#search').change(function () {
  $('#bookmarks').empty();
  dumpBookmarks($('#search').val());
});

// Traverse the bookmark tree, and print the folder and nodes.
function dumpBookmarks(query) {
  chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
    $('#bookmarks').append(dumpTreeNodes(bookmarkTreeNodes, query));
  });
}

function dumpTreeNodes(bookmarkNodes, query) {
  const list = $('<ul>');
  for (let i = 0; i < bookmarkNodes.length; i++) {
    list.append(dumpNode(bookmarkNodes[i], query));
  }

  return list;
}

function dumpNode(bookmarkNode, query) {
  let span = '';
  if (bookmarkNode.title) {
    if (query && !bookmarkNode.children) {
      if (
        String(bookmarkNode.title.toLowerCase()).indexOf(query.toLowerCase()) ==
        -1
      ) {
        return $('<span></span>');
      }
    }

    const anchor = $('<a>');
    anchor.attr('href', bookmarkNode.url);

    // Chrome may have multiple top-level folder nodes with the same title. To
    // disambiguate them, include a suffix depending on the value of the
    // syncing property.
    //
    // folderType is set for top-level folders in the tree, and not for child
    // folders. In Chrome versions prior to milestone 134, folderType is never
    // set.
    let title_text = bookmarkNode.title;
    if (bookmarkNode.folderType) {
      title_text += bookmarkNode.syncing ? ' (Account)' : ' (Local)';
    }
    anchor.text(title_text);

    /*
     * When clicking on a bookmark in the extension, a new tab is fired with
     * the bookmark url.
     */
    anchor.click(function () {
      chrome.tabs.create({ url: bookmarkNode.url });
    });

    span = $('<span>');
    const options = bookmarkNode.children
      ? $('<span>[<a href="#" id="addlink">Add</a>]</span>')
      : $(
          '<span>[<a id="editlink" href="#">Edit</a> <a id="deletelink" ' +
            'href="#">Delete</a>]</span>'
        );
    const edit = bookmarkNode.children
      ? $(
          '<table><tr><td>Name</td><td>' +
            '<input id="title"></td></tr><tr><td>URL</td><td><input id="url">' +
            '</td></tr></table>'
        )
      : $('<input>');

    // Show add and edit links when hover over.
    span
      .hover(
        function () {
          span.append(options);
          $('#deletelink').click(function (event) {
            console.log(event);
            $('#deletedialog')
              .empty()
              .dialog({
                autoOpen: false,
                closeOnEscape: true,
                title: 'Confirm Deletion',
                modal: true,
                show: 'slide',
                position: {
                  my: 'left',
                  at: 'center',
                  of: event.target.parentElement.parentElement
                },
                buttons: {
                  'Yes, Delete It!': function () {
                    chrome.bookmarks.remove(String(bookmarkNode.id));
                    span.parent().remove();
                    $(this).dialog('destroy');
                  },
                  Cancel: function () {
                    $(this).dialog('destroy');
                  }
                }
              })
              .dialog('open');
          });
          $('#addlink').click(function (event) {
            edit.show();
            $('#adddialog')
              .empty()
              .append(edit)
              .dialog({
                autoOpen: false,
                closeOnEscape: true,
                title: 'Add New Bookmark',
                modal: true,
                show: 'slide',
                position: {
                  my: 'left',
                  at: 'center',
                  of: event.target.parentElement.parentElement
                },
                buttons: {
                  Add: function () {
                    edit.hide();
                    chrome.bookmarks.create({
                      parentId: bookmarkNode.id,
                      title: $('#title').val(),
                      url: $('#url').val()
                    });
                    $('#bookmarks').empty();
                    $(this).dialog('destroy');
                    window.dumpBookmarks();
                  },
                  Cancel: function () {
                    edit.hide();
                    $(this).dialog('destroy');
                  }
                }
              })
              .dialog('open');
          });
          $('#editlink').click(function (event) {
            edit.show();
            edit.val(anchor.text());
            $('#editdialog')
              .empty()
              .append(edit)
              .dialog({
                autoOpen: false,
                closeOnEscape: true,
                title: 'Edit Title',
                modal: true,
                show: 'fade',
                position: {
                  my: 'left',
                  at: 'center',
                  of: event.target.parentElement.parentElement
                },
                buttons: {
                  Save: function () {
                    edit.hide();
                    chrome.bookmarks.update(String(bookmarkNode.id), {
                      title: edit.val()
                    });
                    anchor.text(edit.val());
                    options.show();
                    $(this).dialog('destroy');
                  },
                  Cancel: function () {
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
        function () {
          options.remove();
        }
      )
      .append(anchor);
  }

  const li = $(bookmarkNode.title ? '<li>' : '<div>').append(span);

  if (bookmarkNode.children && bookmarkNode.children.length > 0) {
    li.append(dumpTreeNodes(bookmarkNode.children, query));
  }

  return li;
}

document.addEventListener('DOMContentLoaded', function () {
  dumpBookmarks();
});
