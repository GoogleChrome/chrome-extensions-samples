chrome.webNavigation.onCompleted.addListener(() => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'page loaded',
    message: 'Page has completed loading'
  });
});
