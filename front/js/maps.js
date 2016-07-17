
var UUID_KEY = constants.store.UUID_KEY;
var TOKEN_KEY = constants.store.TOKEN_KEY;

var socket = io.connect(":3000");

var map = undefined;
var marker = undefined;

var current_marker;

var pokemon_markers = [];
var area_locations = [];

function deleteMarker() {
  if(current_marker && current_marker.uuid) {
    sendDeleteLocation(current_marker.uuid);
  }
}

function addMarker(hash, uuid, type, location, user_uuid){
  if(!hash[uuid]){
    var new_marker = new google.maps.Marker({
      position: new google.maps.LatLng(location[0], location[1]),
      icon: "/images/"+type+".mini.png",
      map: map
    });

    new_marker.addListener("click", function() {
      var token = store.get(TOKEN_KEY);
      if(new_marker.user_uuid && store.get(UUID_KEY) == new_marker.user_uuid && token && token.length > 0) {
        $("#delete_1").removeClass("hide");
        $("#delete_2").addClass("hide");

        $("#modal_update").click();
      }

      current_marker = new_marker;
    });
    new_marker.user_uuid = user_uuid;
    new_marker.type = type;
    new_marker.uuid = uuid;
    hash[uuid] = new_marker;
  }
}

function getHashFromUUID(uuid) {
  if(pokemon_markers[uuid]) {
    return pokemon_markers;
  }else if(area_locations[uuid]) {
    return area_locations;
  }
  return undefined;
}

function getHashFromType(type) {
  if(type > 0 && type <= 151) {
    return pokemon_markers;
  } else {
    return area_locations;
  }
}

function appendGeoData(GeoData) {
  var type = parseInt(GeoData.type);
  var array = getHashFromType(type);

  if(array) {
    addMarker(array, GeoData.uuid, type, GeoData.location, GeoData.user_uuid);
  }
}

socket.on("deletedLocation", function(GeoData) {
  if(GeoData && GeoData.uuid) {
    var hash = getHashFromUUID(GeoData.uuid);
    var marker = hash[GeoData.uuid];
    if(marker) {
      marker.setMap(undefined);
        hash[GeoData.uuid] = undefined;
    }
  }
});

socket.on("newGeoData", function(GeoData){
  appendGeoData(GeoData);
});

function sendLocationWithType(type){
  if(current_location && type){
    sendLocation(current_location, type);
  }
}

function sendDeleteLocation(uuid) {
  socket.emit("deleteLocation", {
    uuid: uuid,
    user_uuid: store.get(UUID_KEY),
    user_token: store.get(TOKEN_KEY)
  });
}

function sendLocation(latLng, type){
  socket.emit("location", {
    type: parseInt(type),
    location: latLng,
    uuid: store.get(UUID_KEY),
    token: store.get(TOKEN_KEY)
  });
}

function onUserMarkerClicked(location){
  //location := {lat, lng}

  $("#types").removeClass("green");
  $("#modal").click();
  current_location = location;

  //sendLocation(location);
}

function placeMarkerAndPanTo(latLng, map) {
  if(marker == undefined) {
    marker = new google.maps.Marker({
      position: latLng,
      map: map
    });

    marker.addListener("click", function(){
      onUserMarkerClicked(marker.getPosition());
    });
  }else{
    marker.setPosition(latLng);
  }

  setTimeout(function(){
    var lat = 0;
    var lng = 0;

    if($.isFunction(latLng.lat)) lat = latLng.lat();
    else lat = latLng.lat;
    if($.isFunction(latLng.lng)) lng = latLng.lng();
    else lng = latLng.lng;

    $.get("/api/locations/pokemon/around?geo="+lat+","+lng,
    function(data, status){
      var k = 0;
      for(k in data) {
        appendGeoData(data[k]);
      }
    });
  }, 200);

  map.panTo(latLng);
}


function initMap() {
  mapDiv = document.getElementById('map');
  var lat = store.get("lat");
  var lng = store.get("lng");
  if(lat == undefined || lat == "undefined") lat = 0;
  if(lng == undefined || lng == "undefined") lng = 0;

  map = new google.maps.Map(mapDiv, {
    center:{lat: lat, lng: lng },
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    zoom: 18
  });

  placeMarkerAndPanTo({lat: lat, lng: lng }, map);

  map.addListener('click', function(e) {
    store.set("lat", e.latLng.lat());
    store.set("lng", e.latLng.lng());

    placeMarkerAndPanTo(e.latLng, map);
  });

  navigator.geolocation.getCurrentPosition(function(position) {
    if(lat || lng) return;

    var pos = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    store.set("lat", lat);
    store.set("lng", lng);

    placeMarkerAndPanTo(pos, map);

    map.setCenter(pos);
  }, function() {

  });
}

function checkHTTPS(){
  if (window.location.href.indexOf("localhost:3000") < 0 && window.location.protocol != "https:") {
    window.location.href = "https://go.codlab.eu";
  }
}

$(function(){
  $("#modal_update").leanModal();
  $('#modal').leanModal();

  var fileref=document.createElement('script')
  fileref.setAttribute("type","text/javascript")
  fileref.setAttribute("src", "https://maps.googleapis.com/maps/api/js?key="+config.maps+"&callback=initMap")

  $("body").first().append(fileref);

  $("#delete_1").on("click", function() {
    $("#delete_1").addClass("hide");
    $("#delete_2").removeClass("hide");
  });

  $("#delete_2").on("click", function() {
    deleteMarker();
  });
});
