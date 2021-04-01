/*this script get the title of the web page*/
chrome.runtime.sendMessage(document.getElementsByTagName("title")[0].innerText);