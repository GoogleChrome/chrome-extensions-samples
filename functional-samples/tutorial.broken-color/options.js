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

const buttonDiv = document.getElementById('buttonDiv');
const buttonColors = ['#3aa757', '#e8453c', '#f9bb2d', '#4688f1'];

const createColorButtons = (buttonColors) => {
  buttonColors.forEach((color) => {
    const button = document.createElement('button');
    button.style.backgroundColor = color;

    button.addEventListener('click', () => {
      chrome.storage.sync.set({ color }, () => {
        console.log(`color is ${color}`);
      });
    });

    buttonDiv.appendChild(button);
  });
};

createColorButtons(buttonColors);
