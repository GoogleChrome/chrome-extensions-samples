const words = {
  extensions:
    'Extensions are software programs, built on web technologies (such as HTML, CSS, and JavaScript) that enable users to customize the Chrome browsing experience.',
  popup:
    "A UI surface which appears when an extension's action icon is clicked."
};

chrome.runtime.onMessage.addListener(({ name, data }) => {
  if (name === 'define-word') {
    // Hide instructions.
    document.body.querySelector('#select-a-word').style.display = 'none';

    // Show word and definition.
    document.body.querySelector('#definition-word').innerText = data.value;
    document.body.querySelector('#definition-text').innerText =
      words[data.value.toLowerCase()];
  }
});
