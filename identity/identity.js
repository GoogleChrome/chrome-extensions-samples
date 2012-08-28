function onImageFetched(e) {
  var elem = document.getElementById('user_info');
  if (!elem) return;
  if (this.status != 200) return;
  var imgElem = document.createElement('img');
  imgElem.src = window.webkitURL.createObjectURL(this.response);
  elem.appendChild(imgElem);
}

function fetchImageBytes(user_info) {
  if (!user_info || !user_info.picture) return;
  var xhr = new XMLHttpRequest();
  xhr.open('GET', user_info.picture, true);
  xhr.responseType = 'blob';
  xhr.onload = onImageFetched;
  xhr.send();
}

function populateUserInfo(user_info) {
  var elem = document.getElementById('user_info');
  if (!elem) return;
  var nameElem = document.createElement('div');
  nameElem.innerHTML = "<b>Hello " + user_info.name + "</b>";
  elem.appendChild(nameElem);
  fetchImageBytes(user_info);
}

function onUserInfoFetched(e) {
  if (this.status != 200) return;
  console.log("Got the following user info: " + this.response);
  var user_info = JSON.parse(this.response);
  populateUserInfo(user_info);
}

function onGetAuthToken(auth_token) {
  var userInfoDiv = document.getElementById('user_info');
  if (!auth_token) {
    var signinButton = document.createElement('button');
    signinButton.id = 'signin';
    signinButton.appendChild(document.createTextNode('Sign In'));
    signinButton.onclick = getUserInfoInteractive;
    userInfoDiv.appendChild(signinButton);
    return;
  }
  // Remove the sign in button if it exists.
  if (userInfoDiv.firstChild) {
    userInfoDiv.removeChild(userInfoDiv.firstChild);
  }
  // Use the auth token to do an XHR to get the user information.
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json');
  xhr.setRequestHeader('Authorization', 'Bearer ' + auth_token);
  xhr.onload = onUserInfoFetched;
  xhr.send();
}

function getUserInfo() {
  chrome.experimental.identity.getAuthToken({ 'interactive': false }, onGetAuthToken);
}

function getUserInfoInteractive() {
  chrome.experimental.identity.getAuthToken({ 'interactive': true }, onGetAuthToken);
}

window.onload = getUserInfo;
