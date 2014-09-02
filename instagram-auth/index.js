onload = function() {
  var login = document.getElementById("login");
  var output = document.getElementById("output");

  login.onclick = function() {
    var redirectUrl = chrome.identity.getRedirectURL();
    var clientId = "1ac94815c30440efa6f7de3c0d529515";
    var authUrl = "https://instagram.com/oauth/authorize/?" +
        "client_id=" + clientId + "&" +
        "response_type=token&" +
        "redirect_uri=" + encodeURIComponent(redirectUrl);
 
    chrome.identity.launchWebAuthFlow({url: authUrl, interactive: true},
        function(responseUrl) {
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
