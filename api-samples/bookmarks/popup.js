// Copyright 2023 Google LLC
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
// Get the bookmarks and display them in the popup
chrome.bookmarks.getTree((tree) => {
  const bookmarkList = document.getElementById('bookmarkList');
  displayBookmarks(tree[0].children, bookmarkList);
});

// Recursively display the bookmarks
function displayBookmarks(nodes, parentNode) {
  for (const node of nodes) {
    // If the node is a bookmark, create a list item and append it to the parent node
    if (node.url) {
      const listItem = document.createElement('li');
      listItem.textContent = node.title;
      parentNode.appendChild(listItem);
    }

    // If the node has children, recursively display them
    if (node.children) {
      const sublist = document.createElement('ul');
      parentNode.appendChild(sublist);
      displayBookmarks(node.children, sublist);
    }
  }
}

// Add a bookmark for www.google.com
function addBookmark() {
  chrome.bookmarks.create(
    {
      title: 'Google',
      url: 'https://www.google.com'
    },
    () => {
      console.log('Bookmark added');
      location.reload(); // Refresh the popup
    }
  );
}

// Remove the bookmark for www.google.com
function removeBookmark() {
  chrome.bookmarks.search({ url: 'https://www.google.com/' }, (results) => {
    for (const result of results) {
      if (result.url === 'https://www.google.com/') {
        chrome.bookmarks.remove(result.id, () => {});
      }
    }
    location.reload();
  });
}

// Add click event listeners to the buttons
document.getElementById('addButton').addEventListener('click', addBookmark);
document
  .getElementById('removeButton')
  .addEventListener('click', removeBookmark);
