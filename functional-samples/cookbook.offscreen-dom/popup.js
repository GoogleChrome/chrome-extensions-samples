chrome.runtime.sendMessage({
  type: 'test',
  target: 'background',
  data: 'hello'
});
