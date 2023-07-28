const appendLog = (text) => {
  chrome.runtime.sendMessage({ type: 'append-log', text });
};

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'logs.html' });
});

chrome.omnibox.onInputStarted.addListener(function () {
  appendLog('💬 onInputStarted');

  chrome.omnibox.setDefaultSuggestion({
    description:
      "Here is a default <match>suggestion</match>. <url>It's <match>url</match> here</url>"
  });
});

chrome.omnibox.onInputChanged.addListener(function (text, suggest) {
  appendLog('✏️ onInputChanged: ' + text);
  suggest([
    { content: text + ' one', description: 'the first one', deletable: true },
    {
      content: text + ' number two',
      description: 'the second entry',
      deletable: true
    }
  ]);
});

chrome.omnibox.onInputEntered.addListener(function (text, disposition) {
  appendLog(
    `✔️ onInputEntered: text -> ${text} | disposition -> ${disposition}`
  );
});

chrome.omnibox.onInputCancelled.addListener(function () {
  appendLog('❌ onInputCancelled');
});

chrome.omnibox.onDeleteSuggestion.addListener(function (text) {
  appendLog('⛔ onDeleteSuggestion: ' + text);
});
