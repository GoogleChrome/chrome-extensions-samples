// Ported from MV2 samples. Some coding practices are non-standard in MV3, but the sample remains a robust demonstration of the chrome.fontsettings API.
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

document.addEventListener('DOMContentLoaded', () => {
  const increaseFontSizeButton = document.getElementById('increaseFontSize');
  const decreaseFontSizeButton = document.getElementById('decreaseFontSize');
  const fontSizeElement = document.getElementById('fontSize');
  const minFontSizeElement = document.getElementById('minFontSize');

  function updateFontSize(newFontSize) {
    chrome.fontSettings.setDefaultFontSize({ pixelSize: newFontSize }, () => {
      fontSizeElement.textContent = newFontSize.toString();
    });
  }

  function updateMinFontSize(newMinFontSize) {
    chrome.fontSettings.setMinimumFontSize({ pixelSize: newMinFontSize });
  }

  increaseFontSizeButton.addEventListener('click', () => {
    chrome.fontSettings.getDefaultFontSize({}, (fontInfo) => {
      const newFontSize = fontInfo.pixelSize + 2;
      updateFontSize(newFontSize);
    });
  });

  decreaseFontSizeButton.addEventListener('click', () => {
    chrome.fontSettings.getDefaultFontSize({}, (fontInfo) => {
      const newFontSize = fontInfo.pixelSize - 2;
      updateFontSize(newFontSize);
    });
  });

  minFontSizeElement.addEventListener('change', () => {
    const newMinFontSize = parseInt(minFontSizeElement.value);
    updateMinFontSize(newMinFontSize);
  });
});
