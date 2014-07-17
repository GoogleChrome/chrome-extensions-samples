// Function to be run in the context of the webview guest page:
//
// The demo page has an animated dragon. Add a button, styled consistent with
// the page, labeled 'More dragons!' that will instantiate more dragons hooked
// up to the same animation timer.
function addMoreDragons() {
  // Create the button.
  var bttn = document.createElement("button");
  /*
   * Style the button to get a consistent look and feel.
   */
  bttn.innerText = 'More dragons!';
  bttn.classList.add('actionButton');
  bttn.setAttribute('style', 'padding: 10px; margin: 10px; display: block;');
  /*
   * Hook up the button to add more dragons to the page.
   */
  bttn.addEventListener('click', function() {
    var dragon = Dragon.create({ timer: $('timer'), width: 950, height: 1000});
    this.insertAdjacentHTML('afterend', dragon.toHTML());
    document.body.style.zoom = (document.body.style.zoom || 1) * 0.8;
    dragon.initHTML();
  }.bind(bttn));
  // Add the button to the DOM.
  document.body.insertBefore(bttn, document.body.firstChild);
}
