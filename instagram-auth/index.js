onload = function() {
  var login = document.getElementById("login");
  var output = document.getElementById("output");

  login.onclick = function() {
    var identityDetails = {
      url: "https://instagram.com/oauth/authorize/?client_id=dd49c144e7914b99aca3bc1fa2735b8d&redirect_uri=chrome-extension://gghhbcbhogmipjcfkkondjepmoaobhph/auth.html&response_type=token",
      interactive: true
    };   
 
    chrome.experimental.identity.launchWebAuthFlow(identityDetails, function(responseUrl) {
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
