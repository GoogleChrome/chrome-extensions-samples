setTimeout(async () => {
  const capabilities = await chrome.aiOriginTrial.languageModel.capabilities();
  console.log(capabilities);
  const languageModel = await chrome.aiOriginTrial.languageModel.create();
  console.log(languageModel);
  console.log(await languageModel.prompt('Tell me a joke'));
}, 1_000);
