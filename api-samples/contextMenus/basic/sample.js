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

// A generic onclick callback function.
chrome.contextMenus.onClicked.addListener(genericOnClick);

// A generic onclick callback function.
function genericOnClick(info, tab) {
  switch(info.menuItemId){
    case "radio":
      // Radio item function
      break;
    case "checkbox":
      // Checkbox item function
      break;
    default:
      // Standard context menu item function
  }
}
chrome.runtime.onStartup.addListener(function(){

// Create one test item for each context type.
var contexts = [
  "page",
  "selection",
  "link",
  "editable",
  "image",
  "video",
  "audio",
];
for (var i = 0; i < contexts.length; i++) {
  var context = contexts[i];
  var title = "Test '" + context + "' menu item";
  var id = chrome.contextMenus.create({
    title: title,
    contexts: [context],
    id: context,
  });
}

// Create a parent item and two children.
var parent = chrome.contextMenus.create({
  title: "Test parent item",
  id: "parent",
});
var child1 = chrome.contextMenus.create({
  title: "Child 1",
  parentId: parent,
  id: "child1",
});
var child2 = chrome.contextMenus.create({
  title: "Child 2",
  parentId: parent,
  id: "child2",
});


// Create a radio item.
var radio1 = chrome.contextMenus.create({
  title: "radio",
  type: "radio",
  id: "radio",
});

// Create a checkbox item.
var checkbox1 = chrome.contextMenus.create({
  title: "checkbox",
  type: "checkbox",
  id: "checkbox",
});

// Intentionally create an invalid item, to show off error checking in the
// create callback.
chrome.contextMenus.create(
  { title: "Oops", parentId: 999, id: "errorItem" },
  function () {
    if (chrome.runtime.lastError) {
      console.log("Got expected error: " + chrome.runtime.lastError.message);
    }
  }
);
  
});
