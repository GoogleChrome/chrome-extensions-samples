/**
 * @fileoverview In this extension, the background script demonstrates how to
 *               listen for zoom change events.
 */

function zoomChangeListener(zoomChangeInfo) {
  const settings_str =
    'mode:' +
    zoomChangeInfo.zoomSettings.mode +
    ', scope:' +
    zoomChangeInfo.zoomSettings.scope;

  console.log(
    '[ZoomDemoExtension] zoomChangeListener(tab=' +
      zoomChangeInfo.tabId +
      ', new=' +
      zoomChangeInfo.newZoomFactor +
      ', old=' +
      zoomChangeInfo.oldZoomFactor +
      ', ' +
      settings_str +
      ')'
  );
}

chrome.tabs.onZoomChange.addListener(zoomChangeListener);
