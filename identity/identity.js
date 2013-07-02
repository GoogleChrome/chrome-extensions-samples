var googlePlusUserLoader = (function() {
  var signin_button;
  var revoke_button;
  var revoke_button_token;
  var user_info_div;

  function showButton(button) {
    button.disabled = false;
    button.style.display = 'inline';
  }

  function hideButton(button) {
    button.style.display = 'none';
  }

  function disableButton(button) {
    button.disabled = true;
  }

  function xhrWithAuth(method, url, interactive, callback) {
    var retry = true;
    var access_token;
    getToken();

    function getToken() {
      chrome.identity.getAuthToken({ interactive: interactive }, function(token) {
        if (chrome.runtime.lastError) {
          callback(chrome.runtime.lastError);
          return;
        }

        // Save the token globally for the revoke button.
        revoke_button_token = token;

        access_token = token;
        requestStart();
      });
    }

    function requestStart() {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
      xhr.onload = requestComplete;
      xhr.send();
    }

    function requestComplete() {
      if (this.status == 401 && retry) {
        retry = false;
        chrome.identity.removeCachedAuthToken({ token: access_token },
                                              getToken);
      } else {
        callback(null, this.status, this.response);
      }
    }
  }

  function getUserInfo(interactive) {
    xhrWithAuth('GET',
                'https://www.googleapis.com/plus/v1/people/me',
                interactive,
                onUserInfoFetched);
  }

  // Code updating the user interface, when the user information has been
  // fetched or displaying the error.

  function onUserInfoFetched(error, status, response) {
    if (!error && status == 200) {
      console.log("Got the following user info: " + response);
      var user_info = JSON.parse(response);
      populateUserInfo(user_info);
      hideButton(signin_button);
      showButton(revoke_button);
    } else {
      showButton(signin_button);
    }
  }

  function populateUserInfo(user_info) {
    var elem = user_info_div;
    var nameElem = document.createElement('div');
    nameElem.innerHTML = "<b>Hello " + user_info.displayName + "</b>";
    elem.appendChild(nameElem);
    fetchImageBytes(user_info);
  }

  function fetchImageBytes(user_info) {
    if (!user_info || !user_info.image || !user_info.image.url) return;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', user_info.image.url, true);
    xhr.responseType = 'blob';
    xhr.onload = onImageFetched;
    xhr.send();
  }

  function onImageFetched(e) {
    var elem = user_info_div;
    if (!elem) return;
    if (this.status != 200) return;
    var imgElem = document.createElement('img');
    imgElem.src = window.webkitURL.createObjectURL(this.response);
    elem.appendChild(imgElem);
  }

  // OnClick event handlers for the buttons.

  function interactiveSignIn() {
    disableButton(signin_button);
    chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
      if (chrome.runtime.lastError) {
        showButton(signin_button);
      } else {
        getUserInfo(true);
      }
    });
  }

  function revokeToken() {
    if (revoke_button_token) {
      // Make a request to revoke token
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
               revoke_button_token);
      xhr.send();
      // Update the user interface accordingly
      revoke_button_token = null;
      hideButton(revoke_button);
      user_info_div.textContent = '';
      showButton(signin_button);
    }
  }

  return {
    onload: function () {
      signin_button = document.querySelector('#signin');
      signin_button.onclick = interactiveSignIn;

      revoke_button = document.querySelector('#revoke');
      revoke_button.onclick = revokeToken;

      user_info_div = document.querySelector('#user_info');

      console.log(signin_button, revoke_button, user_info_div);

      // Trying to get user's info without signing in, it will work if the
      // Application was previously authorized by the user.
      getUserInfo(false);
    }
  };

})();

window.onload = googlePlusUserLoader.onload;
