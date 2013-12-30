var CWS_LICENSE_API_URL = 'https://www.googleapis.com/chromewebstore/v1.1/userlicenses/';
var TRIAL_PERIOD_DAYS = 2;
var statusDiv;

function init() {
  statusDiv = $("#status");
  getLicense();
}

/*****************************************************************************
* Call to license server to request the license
*****************************************************************************/

function getLicense() {
  xhrWithAuth('GET', CWS_LICENSE_API_URL + chrome.runtime.id, true, onLicenseFetched);
}

function onLicenseFetched(error, status, response) {
  console.log(error, status, response);
  statusDiv.text("Parsing license...");
  response = JSON.parse(response);
  $("#license_info").text(JSON.stringify(response, null, 2));
  if (status === 200) {
    parseLicense(response);
  } else {
    $("#dateCreated").text("N/A");
    $("#licenseState").addClass("alert-danger");
    $("#licenseStatus").text("Error");
    statusDiv.html("Error reading license server.");
  }
}

/*****************************************************************************
* Parse the license and determine if the user should get a free trial
*  - if license.accessLevel == "FULL", they've paid for the app
*  - if license.accessLevel == "FREE_TRIAL" they haven't paid
*    - If they've used the app for less than TRIAL_PERIOD_DAYS days, free trial
*    - Otherwise, the free trial has expired 
*****************************************************************************/

function parseLicense(license) {
  var licenseStatus;
  var licenseStatusText;
  if (license.result && license.accessLevel == "FULL") {
    console.log("Fully paid & properly licensed.");
    licenseStatusText = "FULL";
    licenseStatus = "alert-success";
  } else if (license.result && license.accessLevel == "FREE_TRIAL") {
    var daysAgoLicenseIssued = Date.now() - parseInt(license.createdTime, 10);
    daysAgoLicenseIssued = daysAgoLicenseIssued / 1000 / 60 / 60 / 24;
    if (daysAgoLicenseIssued <= TRIAL_PERIOD_DAYS) {
      console.log("Free trial, still within trial period");
      licenseStatusText = "FREE_TRIAL";
      licenseStatus = "alert-info";
    } else {
      console.log("Free trial, trial period expired.");
      licenseStatusText = "FREE_TRIAL_EXPIRED";
      licenseStatus = "alert-warning";
    }
  } else {
    console.log("No license ever issued.");
    licenseStatusText = "NONE";
    licenseStatus = "alert-danger";
  }
  $("#dateCreated").text(moment(parseInt(license.createdTime, 10)).format("llll"));
  $("#licenseState").addClass(licenseStatus);
  $("#licenseStatus").text(licenseStatusText);
  statusDiv.html("&nbsp;");
}

/*****************************************************************************
* Helper method for making authenticated requests
*****************************************************************************/

// Helper Util for making authenticated XHRs
function xhrWithAuth(method, url, interactive, callback) {
  var retry = true;
  getToken();

  function getToken() {
    statusDiv.text("Getting auth token...");
    console.log("Calling chrome.identity.getAuthToken", interactive);
    chrome.identity.getAuthToken({ interactive: interactive }, function(token) {
      if (chrome.runtime.lastError) {
        callback(chrome.runtime.lastError);
        return;
      }
      console.log("chrome.identity.getAuthToken returned a token", token);
      access_token = token;
      requestStart();
    });
  }

  function requestStart() {
    statusDiv.text("Starting authenticated XHR...");
    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.onload = requestComplete;
    xhr.send();
  }

  function requestComplete() {
    statusDiv.text("Authenticated XHR completed.");
    if (this.status == 401 && retry) {
      retry = false;
      chrome.identity.removeCachedAuthToken({ token: access_token },
                                            getToken);
    } else {
      callback(null, this.status, this.response);
    }
  }
}


init();