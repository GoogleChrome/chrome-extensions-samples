let page = document.getElementById("buttonDiv");

const kButtonColors = ["#3aa757", "#e8453c", "#f9bb2d", "#4688f1"];

function handleButtonClick(event) {
  // Remove styling from the previously selected color
  let current = event.target.parentElement.querySelector(".current");
  if (current && current !== event.target) {
    current.classList.remove("current");
  }

  let color = event.target.dataset.color;
  event.target.classList.add("current");
  chrome.storage.sync.set({ color });
}

function constructOptions(kButtonColors) {
  chrome.storage.sync.get("color", (data) => {
    let currentColor = data.color;

    for (let buttonColor of kButtonColors) {
      // Crate a button for each color we support
      let button = document.createElement("button");
      button.dataset.color = buttonColor;
      button.style.backgroundColor = buttonColor;

      // Style the currently selected color
      if (buttonColor === currentColor) {
        button.classList.add("current");
      }

      // Update color selection on click
      button.addEventListener("click", handleButtonClick);
      page.appendChild(button);
    }
  });
}

constructOptions(kButtonColors);
