var registrationId = "";

function setStatus(status) {
  document.getElementById("status").innerHTML = status;
}

function register() {
  var senderId = document.getElementById("senderId").value;
  chrome.gcm.register([senderId], registerCallback);

  setStatus("Registering ...");

  // Prevent register button from being click again before the registration
  // finishes.
  document.getElementById("register").disabled = true;
}

function registerCallback(regId) {
  registrationId = regId;
  document.getElementById("register").disabled = false;

  if (chrome.runtime.lastError) {
    // When the registration fails, handle the error and retry the
    // registration later.
    setStatus("Registration failed: " + chrome.runtime.lastError.message);
    return;
  }

  setStatus("Registration succeeded. Please run the following command to send a message.");

  // Mark that the first-time registration is done.
  chrome.storage.local.set({registered: true});

  // Format and show the curl command that can be used to post a message.
  updateCurlCommand();
}

function updateCurlCommand() {
  var apiKey = document.getElementById("apiKey").value;
  if (!apiKey)
    apiKey = "YOUR_API_KEY";

  var msgKey = document.getElementById("msgKey").value;
  if (!msgKey)
    msgKey = "YOUR_MESSAGE_KEY";

  var msgValue = document.getElementById("msgValue").value;
  if (!msgValue)
    msgValue = "YOUR_MESSAGE_VALUE";

  var command = 'curl' +
      ' -H "Content-Type:application/x-www-form-urlencoded;charset=UTF-8"' +
      ' -H "Authorization: key=' + apiKey + '"' +
      ' -d "registration_id=' + registrationId + '"' +
      ' -d data.' + msgKey + '=' + msgValue +
      ' https://android.googleapis.com/gcm/send';
  document.getElementById("console").innerText = command;
}

window.onload = function() {
  document.getElementById("register").onclick = register;
  document.getElementById("apiKey").onchange = updateCurlCommand;
  document.getElementById("msgKey").onchange = updateCurlCommand;
  document.getElementById("msgValue").onchange = updateCurlCommand;
  setStatus("You have not registered yet. Please provider sender ID and register.");
}
