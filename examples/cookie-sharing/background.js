chrome.action.onClicked.addListener(async (tab) => {
  const url = "https://crx-cookie-sharing.glitch.me/dreams";
  const res = await fetch(url, {credentials: "include"});

  let cookies = await chrome.cookies.getAll({
    domain: chrome.runtime.getURL(''),
  });

  console.log(cookies);
});
