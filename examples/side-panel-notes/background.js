console.log("background")

const setPanel = async () =>  {
    await chrome.sidePanel.setOptions({path: 'sidepanel.html'});
}

setPanel().catch(console.error)