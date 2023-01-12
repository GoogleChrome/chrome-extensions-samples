console.log("background");

chrome.runtime.onInstalled.addListener(async () => {
  await chrome.sidePanel.setOptions({
    path: "sidepanels/welcome-sp.html",
    enabled: true,
  });
});

chrome.tabs.onActivated.addListener(async () => {
  const result = await chrome.sidePanel.getOptions({});
  console.log(result.path);
  if (result.path === "sidepanels/welcome-sp.html") {
    await chrome.sidePanel.setOptions({
      path: "sidepanels/main-sp.html",
      enabled: true,
    });
  }
});
