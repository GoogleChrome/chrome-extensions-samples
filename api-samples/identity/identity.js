'use strict';

function onLoad() {
  const STATE_START = 1;
  const STATE_ACQUIRING_AUTHTOKEN = 2;
  const STATE_AUTHTOKEN_ACQUIRED = 3;

  let state = STATE_START;

  const signin_button = document.querySelector('#signin');
  signin_button.addEventListener('click', interactiveSignIn);

  const userinfo_button = document.querySelector('#userinfo');
  userinfo_button.addEventListener(
    'click',
    getUserInfo.bind(userinfo_button, true)
  );

  const revoke_button = document.querySelector('#revoke');
  revoke_button.addEventListener('click', revokeToken);

  const user_info_div = document.querySelector('#user_info');

  // Trying to get user's info without signing in, it will work if the
  // application was previously authorized by the user.
  getUserInfo(false);

  function disableButton(button) {
    button.setAttribute('disabled', 'disabled');
  }

  function enableButton(button) {
    button.removeAttribute('disabled');
  }

  function changeState(newState) {
    state = newState;
    switch (state) {
      case STATE_START:
        enableButton(signin_button);
        disableButton(userinfo_button);
        disableButton(revoke_button);
        break;
      case STATE_ACQUIRING_AUTHTOKEN:
        displayOutput('Acquiring token...');
        disableButton(signin_button);
        disableButton(userinfo_button);
        disableButton(revoke_button);
        break;
      case STATE_AUTHTOKEN_ACQUIRED:
        disableButton(signin_button);
        enableButton(userinfo_button);
        enableButton(revoke_button);
        break;
    }
  }

  function displayOutput(message) {
    let messageStr = message;
    if (typeof message != 'string') {
      messageStr = JSON.stringify(message);
    }

    document.getElementById('__logarea').value = messageStr;
  }

  function fetchWithAuth(method, url, interactive, callback) {
    let access_token;
    let retry = true;

    getToken();

    function getToken() {
      chrome.identity
        .getAuthToken({ interactive: interactive })
        .then((token) => {
          access_token = token.token;
          requestStart();
        })
        .catch((error) => {
          callback(error.message);
        });
    }

    function requestStart() {
      fetch(url, {
        method: method,
        headers: {
          Authorization: 'Bearer ' + access_token
        }
      }).then((response) => {
        if (response.status == 401 && retry) {
          retry = false;
          chrome.identity
            .removeCachedAuthToken({ token: access_token })
            .then(getToken);
        } else {
          callback(null, response.status, response);
        }
      });
    }
  }

  function getUserInfo(interactive) {
    // See https://developers.google.com/identity/openid-connect/openid-connect#obtaininguserprofileinformation
    fetchWithAuth(
      'GET',
      'https://openidconnect.googleapis.com/v1/userinfo',
      interactive,
      onUserInfoFetched
    );
  }

  // Code updating the user interface, when the user information has been
  // fetched or displaying the error.
  function onUserInfoFetched(error, status, response) {
    if (!error && status == 200) {
      changeState(STATE_AUTHTOKEN_ACQUIRED);
      response.json().then((user_info) => {
        displayOutput(user_info);
        populateUserInfo(user_info);
      });
    } else {
      changeState(STATE_START);
    }
  }

  function populateUserInfo(user_info) {
    if (!user_info || !user_info.picture) return;

    user_info_div.innerText = 'Hello ' + user_info.name;

    const imgElem = document.createElement('img');
    imgElem.src = user_info.picture;
    imgElem.style.width = '24px';
    user_info_div.insertAdjacentElement('afterbegin', imgElem);
  }

  // OnClick event handlers for the buttons.

  /**
    Retrieves a valid token. Since this is initiated by the user
    clicking in the Sign In button, we want it to be interactive -
    ie, when no token is found, the auth window is presented to the user.

    Observe that the token does not need to be cached by the app.
    Chrome caches tokens and takes care of renewing when it is expired.
    In that sense, getAuthToken only goes to the server if there is
    no cached token or if it is expired. If you want to force a new
    token (for example when user changes the password on the service)
    you need to call removeCachedAuthToken()
  **/
  function interactiveSignIn() {
    changeState(STATE_ACQUIRING_AUTHTOKEN);
    console.log('interactiveSignIn');

    // This is the normal flow for authentication/authorization on Google
    // properties. You need to add the oauth2 client_id and scopes to the app
    // manifest. The interactive param indicates if a new window will be opened
    // when the user is not yet authenticated or not.
    //
    // See https://developer.chrome.com/docs/extensions/reference/api/identity#method-getAuthToken
    chrome.identity
      .getAuthToken({ interactive: true })
      .then((token) => {
        displayOutput('Token acquired:\n' + token.token);
        changeState(STATE_AUTHTOKEN_ACQUIRED);
      })
      .catch((error) => {
        displayOutput(error.message);
        changeState(STATE_START);
      });
  }

  function revokeToken() {
    user_info_div.innerHTML = '';
    chrome.identity
      .getAuthToken({ interactive: false })
      .then((current_token) => {
        // Remove the local cached token
        chrome.identity.removeCachedAuthToken({ token: current_token.token });

        // Make a request to revoke token in the server.
        // See https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow#tokenrevoke
        fetch(
          'https://oauth2.googleapis.com/revoke?token=' + current_token.token,
          { method: 'POST' }
        ).then(() => {
          // Update the user interface accordingly
          changeState(STATE_START);
          displayOutput('Token revoked and removed from cache.');
        });
      });
  }
}

window.addEventListener('load', onLoad);
