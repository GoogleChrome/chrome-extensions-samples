document.getElementById("save-button").addEventListener("click", function() {
    const input = document.getElementById("input").value;
    chrome.storage.local.set({ "myValue": input }, function() {
      console.log("Value saved: " + input);
    });
  });
  