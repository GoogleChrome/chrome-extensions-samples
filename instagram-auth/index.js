onload = function() {
  var login = document.getElementById("login");
  var output = document.getElementById("output");

  login.onclick = function() {
    var clientId = 'YOUR CLIENT ID HERE'; 
    var identityDetails = {
      url: "https://api.instagram.com/oauth/authorize/?client_id=" + clientId +
          "&redirect_uri=chrome-extension://gghhbcbhogmipjcfkkondjepmoaobhph/auth.html&response_type=token",
      interactive: true
    };   
 
    chrome.identity.launchWebAuthFlow(identityDetails, function(responseUrl) {
      if (chrome.runtime.lastError) {
        console.log('Authorization error: ' + chrome.runtime.lastError.message);
        return;
      }

      if (!responseUrl) {
        console.log("Missing response URL");
        return;
      }
 
      console.log(responseUrl);
      var accessToken = responseUrl.substring(responseUrl.indexOf("=") + 1);
      console.log(accessToken);

      var api = new InstagramAPI(accessToken);
      api.request("users/self/feed", undefined, function(data) {  
        console.log(data);
        output.textContent = JSON.stringify(data, null, 4);
      });
    });
  };
};

var InstagramAPI = function(accessToken) {
  this.request = function(method, arguments, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function() {
      callback(JSON.parse(xhr.response));
    };

    xhr.open("GET", "https://api.instagram.com/v1/" + method + "?access_token=" + accessToken);
    xhr.send();
  };
}
