function initUi() {
  foursquare.isSignedIn(function(isSignedIn) {
    if (isSignedIn) {
      document.body.classList.add('signed-in');
      document.body.classList.remove('signed-out');
      fetchCheckins();
    } else {
      document.body.classList.add('signed-out');
      document.body.classList.remove('signed-in');
    }
  });
};

document.getElementById('sign-in-button').onclick = function() {
  foursquare.signIn(
      location.hostname, // the app's ID
      'JP3SRNV00FA1P11W0PHONEUDRQJVSCNODBTCGBKSOPSXIVMX', // Foursquare API client ID
      initUi,
      function(error) {
        console.log('Sign-in error: ' + error);
      });
};

document.getElementById('sign-out-button').onclick = function() {
  foursquare.signOut(initUi);
};

function fetchCheckins() {
  function fetchCheckinsWithLocation(opt_location) {
    var params = {
      'limit': 40
    };

    if (opt_location) {
      params['ll'] = opt_location;
    }

    foursquare.getRecentCheckins(
        params,
        function(responseJson) {
          renderCheckins(responseJson.recent);
        },
        function(status, statusText, responseJson) {
          console.log('Error status: ' + status + ' (' + statusText + ')\n' +
              JSON.stringify(responseJson));
        });
  }

  navigator.geolocation.getCurrentPosition(
      function(position) {
        fetchCheckinsWithLocation(
            position.coords.latitude + ',' + position.coords.longitude);
      },
      function(error) {
        console.log('Geolocation error: ' + error.message);
        fetchCheckinsWithLocation();
      });
};

function renderCheckins(checkins) {
  var checkinsNode = document.getElementById('checkins');
  checkinsNode.innerHTML = '';
  checkins.forEach(function(checkin) {
    var user = checkin.user;
    var venue = checkin.venue;

    var checkinNode = document.createElement('li');
    checkinNode.className = 'checkin';
    if (checkin.isMayor) {
      var mayorOverlayNode = document.createElement('img');
      mayorOverlayNode.className = 'mayor-overlay';
      mayorOverlayNode.src = 'crown-overlay.png';
      checkinNode.appendChild(mayorOverlayNode);
    }

    var displayName = user.firstName;
    if (displayName && user.lastName) {
      displayName += ' ' + user.lastName.substring(0, 1) + '.';
    } else if (user.lastName) {
      displayName = user.lastName;
    } else {
      displayName = '<Anonymous>';
    }
    var displayVenueName = venue.name || '<Unknown>';

    var photoNode = document.createElement('img');
    photoNode.className = 'photo';
    var photoLoader = new ImageLoader(checkin.user.photo);
    photoLoader.loadInto(photoNode);
    checkinNode.appendChild(photoNode);

    var headerNode = document.createElement('h3');
    headerNode.innerText = displayName + ' @ ' + displayVenueName;
    checkinNode.appendChild(headerNode);

    var locationNode = document.createElement('div');
    locationNode.className = 'location';
    var displayVenueLocation;
    var venueLocation = venue.location;
    if (venueLocation.country == 'United States') {
      displayVenueLocation = venueLocation.city + ', ' + venueLocation.state;
    } else {
      displayVenueLocation = venueLocation.city + ', ' + venueLocation.country;
    }
    if (venueLocation.distance && venueLocation.distance < 100000) {
      displayVenueLocation += ' (';
      if (venueLocation.distance < 1000) {
        displayVenueLocation += venueLocation.distance + ' m';
      } else {
        displayVenueLocation += Math.round(venueLocation.distance/1000) + ' km';
      }
      displayVenueLocation += ' away)';
    }
    locationNode.innerText = displayVenueLocation;
    checkinNode.appendChild(locationNode);

    var timestampNode = document.createElement('div');
    timestampNode.className = 'timestamp';
    var displayTimestamp = new Date(checkin.createdAt * 1000).toLocaleDateString();
    var timeDelta = Date.now()/1000 - checkin.createdAt;
    if (timeDelta < 60) {
      displayTimestamp = 'just now';
    } else if (timeDelta < 3600) {
      displayTimestamp = Math.round(timeDelta/60) + ' mins ago';
    } else if (timeDelta < 24 * 3600) {
      displayTimestamp = Math.round(timeDelta/3600) + ' hours ago';
    } else if (timeDelta < 7 * 24 * 3600) {
      displayTimestamp = Math.round(timeDelta/(24 * 3600)) + ' days ago';
    }
    timestampNode.innerText = displayTimestamp;
    checkinNode.appendChild(timestampNode);

    checkinsNode.appendChild(checkinNode);
  });
}

onload = initUi;
