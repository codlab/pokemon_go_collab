var socket = io.connect(":3000");

var map = undefined;
var marker = undefined;

socket.on("newGeoData", function(GeoData){
  console.log("newGeoData");
  console.log(GeoData);
});

function sendLocation(latLng){
  socket.emit("location", {
    type: 0,
    location: latLng,
    name: "sendLocation"
  });
}

function onUserMarkerClicked(location){
  //location := {lat, lng}
  $("#modal").click();

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
  map.panTo(latLng);
}


function initMap() {
  mapDiv = document.getElementById('map');
  var lat = store.get("lat");
  var lng = store.get("lng");
  if(lat == undefined || lng == "undefined") lat = 0;
  if(lng == undefined || lng == "undefined") lng = 0;

  var map = new google.maps.Map(mapDiv, {
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

  $('#modal').leanModal();

  var fileref=document.createElement('script')
  fileref.setAttribute("type","text/javascript")
  fileref.setAttribute("src", "https://maps.googleapis.com/maps/api/js?key="+config.maps+"&callback=initMap")

  $("body").first().append(fileref);
});
