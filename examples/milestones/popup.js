chrome.tabs.query({active: true}).then(tabs => getMilestone(tabs));

function getMilestone(tabs) {
  const div = document.createElement("div");
  document.body.appendChild(div);
  const url = tabs[0].url;
  const origin = 'https://chromium-review.googlesource.com';
  const search = `^${origin}/c/chromium/src/\\+/(\\d+)`;
  const match = url.match(search);
  if (match != undefined && match.length == 2) {
    getMilestoneForRevid(match[1]).then((milestone) =>
      milestone != '' ? (div.innerText = `m${milestone}`) : window.close());
  } else {
    window.close();
  }
}

function getMilestoneForRevid(revid) {
  return fetch(`https://crrie.com/c/?r=${revid}`)
  .then((res) => res.text());
}
