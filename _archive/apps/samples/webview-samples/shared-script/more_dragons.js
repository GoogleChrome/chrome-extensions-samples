// Starting zoom for new dragons
var baseZoom = 1;

// Function to be run in the context of the webview guest page:
//
// The demo page has an animated dragon. Add a button, styled consistent with
// the page, labeled 'More dragons!' that will instantiate more dragons hooked
// up to the same animation timer.
function addMoreDragons() {
  var zoom = 1.0;
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
    // Add a new dragon.
    var newDragon = Dragon.create({ timer: $('timer'), width: 950, height: 1000});
    this.insertAdjacentHTML('afterend', newDragon.toHTML());
    newDragon.initHTML();

    // Scale down dragons.
    zoom *= 0.75;
    var timerID = $('timer').id;
    var dragons = document.querySelectorAll('canvas');
    var dragonsArr = Array.prototype.slice.call(dragons, 0);

    // The last canvas is the timer, not a dragon.
    dragonsArr.pop();

    dragonsArr.forEach(function(dragonCanvas) {
      dragonCanvas.style.zoom = zoom;
    });

  }.bind(bttn));
  // Add the button to the DOM.
  document.body.insertBefore(bttn, document.body.firstChild);
}
