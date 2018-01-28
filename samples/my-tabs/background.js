 chrome.browserAction.setPopup({popup: 'index.html'});chrome.browserAction.setBadgeText({text: 'tabs'});
chrome.tabs.onActiveChanged.addListener(function (){var tabs=[];chrome.tabs.query({currentWindow: true},function(tabs){
chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
chrome.browserAction.setBadgeText({text: ''+tabs.length});chrome.notifications.create('Tabs',{type:'basic',title:'Tabs Opened',iconUrl: 'Img/multi.png',message: tabs.length +' Are Tabs Opened!!',priority:0},function(){});});});chrome.runtime.onInstalled.addListener(function (){chrome.tabs.create({url:"http://twitter.com/ihappyk"});});

chrome.tabs.onRemoved.addListener(function(){
var tabs=[];
chrome.tabs.query({currentWindow: true},function(tabs){
chrome.browserAction.setBadgeBackgroundColor({ color: [255, 0, 0, 255] });
chrome.browserAction.setBadgeText({text: ''+tabs.length});
});
});
