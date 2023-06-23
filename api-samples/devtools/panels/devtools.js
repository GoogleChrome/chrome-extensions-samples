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

// The function below is executed in the context of the inspected page.
/*global $0*/
const page_getProperties = function () {
  let data = window.jQuery && $0 ? jQuery.data($0) : {};
  // Make a shallow copy with a null prototype, so that sidebar does not
  // expose prototype.
  let props = Object.getOwnPropertyNames(data);
  let copy = { __proto__: null };
  for (let i = 0; i < props.length; ++i) copy[props[i]] = data[props[i]];
  return copy;
};

chrome.devtools.panels.elements.createSidebarPane(
  'jQuery Properties',
  function (sidebar) {
    function updateElementProperties() {
      sidebar.setExpression('(' + page_getProperties.toString() + ')()');
    }
    updateElementProperties();
    chrome.devtools.panels.elements.onSelectionChanged.addListener(
      updateElementProperties
    );
  }
);
