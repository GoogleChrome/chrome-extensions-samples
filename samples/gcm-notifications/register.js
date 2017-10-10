var registrationId = "";

function setStatus(status) {
  document.getElementById("status").innerHTML = status;
}

function disableButtons() {
  document.getElementById("register").disabled = true;
  document.getElementById("deregister").disabled = true;
}

function enableRegisterButton() {
  document.getElementById("register").disabled = false;
  document.getElementById("deregister").disabled = true;
}

function enableDeregisterButton() {
  document.getElementById("register").disabled = true;
  document.getElementById("deregister").disabled = false;
}

function register() {
  var senderId = document.getElementById("senderId").value;
  chrome.gcm.register([senderId], registerCallback);

  setStatus("Registering ...");

  // Prevent register button from being click again before the registration
  // finishes.
  disableButtons();
}

function deregister() {
  var senderId = document.getElementById("senderId").value;
  chrome.gcm.unregister(deregisterCallback);

  setStatus("Registering ...");

  // Prevent register button from being click again before the registration
  // finishes.
  disableButtons();
}

function registerCallback(regId) {
  registrationId = regId;

  if (chrome.runtime.lastError) {
    // When the registration fails, handle the error and retry the
    // registration later.
    setStatus("Registration failed: " + chrome.runtime.lastError.message);
    enableRegisterButton();
    return;
  }

  enableDeregisterButton();
  setStatus("Registration succeeded. Please run the following command to send a message.");

  // Mark that the first-time registration is done.
  chrome.storage.local.set({registered: true});

  // Format and show the curl command that can be used to post a message.
  updateCurlCommand();
}

function deregisterCallback() {
  registrationId = "not registered"
  document.getElementById("register").disabled = false;
  document.getElementById("deregister").disabled = false;

  if (chrome.runtime.lastError) {
    // When the registration fails, handle the error and retry the
    // registration later.
    setStatus("Deregistration failed: " + chrome.runtime.lastError.message);
    enableDeregisterButton();
    return;
  }

  enableRegisterButton();
  setStatus("Deregistration succeeded. Please provider sender ID and register.");

  // Mark that the first-time registration is done.
  chrome.storage.local.set({registered: false});

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
  enableRegisterButton();
  document.getElementById("register").onclick = register;
  document.getElementById("deregister").onclick = deregister;
  document.getElementById("apiKey").onchange = updateCurlCommand;
  document.getElementById("msgKey").onchange = updateCurlCommand;
  document.getElementById("msgValue").onchange = updateCurlCommand;
  setStatus("You have not registered yet. Please provider sender ID and register.");
}
