// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict'

const kMaps_key = 'AIzaSyBa5aieunaIp3Obco-dNVYMdbnTZGAVkKQ';

function gclient_geocode(address) {
  let url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' +
            encodeURIComponent(address) + '&sensor=false';
  let request = new XMLHttpRequest();

  request.open('GET', url, true);
  console.log(url);
  request.onreadystatechange = function (e) {
    console.log(request, e);
    if (request.readyState == 4) {
      if (request.status == 200) {
        let json = JSON.parse(request.responseText);
        let latlng = json.results[0].geometry.location;
        latlng = latlng.lat + ',' + latlng.lng;
        let src = 'https://maps.googleapis.com/maps/api/staticmap?center=' +
            latlng + '&markers=' + latlng + '&zoom=14' +
            '&size=512x512&sensor=false&key=' + kMaps_key;
        let map = document.getElementById('map');
        map.src = src;
        map.addEventListener('click', function () {
          window.close();
        });
      } else {
        console.log('Unable to resolve address into lat/lng');
      }
    }
  };
  request.send(null);
}

function map() {
  chrome.storage.local.get(['address'], function(value){
    gclient_geocode(value.address);
  })
}

window.onload = map;
