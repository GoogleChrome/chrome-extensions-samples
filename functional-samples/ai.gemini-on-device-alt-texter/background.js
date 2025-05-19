chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'generateAltText',
    title: 'Generate alt text',
    contexts: ['image']
  });
});
async function generateAltText(imgSrc) {
  // Create the model (we're not checking availability here, but will simply fail with an exception
  const session = await self.LanguageModel.create({
    temperature: 0.8,
    topK: 1.0,
    expectedInputs: [{ type: 'image' }]
  });

  // Create an image bitmap to pass it to the prompt
  const response = await fetch(imgSrc);
  const blob = await response.blob();
  const imageBitmap = await createImageBitmap(blob);

  // Run the prompt
  const prompt = [
    `Please provide a functional, objective description of the provided image in no more than around 30 words so that someone who could not see it would be able to imagine it. If possible, follow an “object-action-context” framework. The object is the main focus. The action describes what’s happening, usually what the object is doing. The context describes the surrounding environment. If there is text found in the image, do your best to transcribe the important bits, even if it extends the word count beyond 30 words. It should not contain quotation marks, as those tend to cause issues when rendered on the web. If there is no text found in the image, then there is no need to mention it. You should not begin the description with any variation of “The image”.`,
    { type: 'image', content: imageBitmap }
  ];
  return await session.prompt(prompt);
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'generateAltText' && info.srcUrl) {
    // Start opening the popup
    const [result] = await Promise.allSettled([
      generateAltText(info.srcUrl),
      chrome.action.openPopup()
    ]);
    chrome.runtime.sendMessage({
      action: 'alt-text',
      text: result.status === 'fulfilled' ? result.value : result.reason.message
    });
  }
});
