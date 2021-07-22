chrome.runtime.onInstalled.addListener((e) => {
  console.log(e, chrome.runtime.getManifest());
});

chrome.action.onClicked.addListener(() => 
  chrome.runtime.sendNativeMessage('com.google.chrome.example.ping.pong'
  , {message:"ping"}, (nativeMessage) => console.log(nativeMessage))
);
