chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create({ periodInMinutes: (1 / 60) * 3 });
});

chrome.alarms.onAlarm.addListener(async () => {
  const extensions = await chrome.management.getAll();
  const moles = extensions.filter((e) => e.name === 'mole');

  const randomIndex = Math.floor(Math.random() * moles.length);

  chrome.runtime.sendMessage(moles[randomIndex].id, { id: chrome.runtime.id });
});

let counter = 0;

chrome.runtime.onMessageExternal.addListener(() => {
  counter++;
  chrome.action.setBadgeText({ text: `${counter}` });
});
