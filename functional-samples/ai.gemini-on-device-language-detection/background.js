chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: 'context-menu-example',
    title: 'Detect language',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'context-menu-example') {
    // Get the selected text
    const selectedText = info.selectionText;
    console.log('Detecting language for', selectedText);

    if (!('translation' in self) || !('canDetect' in self.translation)) {
      console.log('translation API not available');
      return;
    }
    const canDetect = await self.translation.canDetect();
    let detector;
    if (canDetect === 'no') {
      console.log('The language detector is not usable.');
      return;
    }
    if (canDetect === 'readily') {
      console.log('The language detector is ready.');
      detector = await self.translation.createDetector();
    } else {
      console.log('Downloading language detector.');
      // The language detector can be used after model download.
      detector = await self.translation.createDetector();
      detector.addEventListener('downloadprogress', (e) => {
        console.log(e.loaded, e.total);
      });
      await detector.ready;
    }
    console.log('Detecting language for: ', selectedText);
    const results = await detector.detect(selectedText);
    for (const result of results) {
      // Show the full list of potential languages with their likelihood, ranked
      // from most likely to least likely. In practice, one would pick the top
      // language(s) that cross a high enough threshold.
      console.log(result.detectedLanguage, result.confidence);
    }
  }
});
