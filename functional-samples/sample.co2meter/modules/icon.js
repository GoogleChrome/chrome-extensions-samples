class Icon {
  constructor() { }

  setConnected() {
    chrome.action.setTitle({ title: "Connected" });
    chrome.action.setIcon({ path: { '32': 'images/icon32.png' } });
  };

  setDisconnected() {
    chrome.action.setTitle({ title: "Disconnected" });
    chrome.action.setIcon({ path: { '32': 'images/icon32_disconnected.png' } });
  }
  
}

export default new Icon