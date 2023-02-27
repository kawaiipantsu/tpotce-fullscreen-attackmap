// T-Pot CE - Fullscreen Attackmap

// Settings
// Default settings
const attackmapSettings = {
  filter: [],
  sound: false,
  marker: 4,
  stats: false
};

var fadeMenu = true

var markerIcons = [
// "/images/marker-bullseye1.svg",
// "/images/marker-bullseye2.svg",
 "/images/marker-bullseye3.svg",
 "/images/marker-honey2.svg",
 "/images/marker-honey3.svg",
 "/images/marker-honey4.svg",
 "/images/marker-honey5.svg",
 "/images/marker-honey6.svg",
 "/images/marker-honey7.svg",
 "/images/marker-network3.svg",
 "/images/marker-phishing.svg",
 "/images/marker-router.svg",
 "/images/marker-router2.svg",
 "/images/marker-sensor.svg",
 //"/images/marker-server.svg",
 "/images/marker-server2.svg",
 "/images/marker-server3.svg",
 "/images/marker-server4.svg",
 //"/images/marker-server5.svg",
 //"/images/marker-server6.svg",
 "/images/marker-server7.svg",
 "/images/marker-server8.svg",
 "/images/marker-server9.svg",
 //"/images/marker-unknown.svg",
]

function setMarker(marker) {
 // leaflet-marker-icon
 $(".leaflet-marker-icon").attr("src","/images/"+marker);
}

function buildMarkerMenu() {
 markerIcons.forEach((element) => {
  var markerName = element.split('/').reverse()[0];
  const markerInline = "<a href=\"javascript:void(0);\" onclick=\"toggleFunction('navMarkers');setMarker('"+markerName+"');\" class=\"w3-bar-item w3-button\"><i class=\"fa navMarker marker-\"></i> "+markerName.replace('.svg', '').replace('marker-', '')+"</a>"
  $("#navMarkers").append(markerInline);
 })
}

// Timer to build sensor menu if sensors are avaiable
var knownSensorTimer = setInterval(function() {
 if ( sensorAvailable.length > 0 ) {
  // Lets take one then
  const newSensorName = sensorAvailable.shift();
  sensorSeen.push(newSensorName)
  const newSensor = "<a href=\"javascript:void(0);\" onclick=\"toggleSensor(this)\" class=\"w3-bar-item w3-button sensorOption\" id=\""+newSensorName+"\"><i class=\"fa fa-bullseye\"></i> "+newSensorName+"</a>"
  $("#navSensors").append(newSensor)
 }
}, 2000);

// Timer to sense connection problems and visualize it
var connTimer = setInterval(function() {
 if ( wsRunning === false && wsProblem === true ) {
  $("#connStatus").parent().css("background-color", "#880808");
  $("#connStatus").css("color", "white");
  $("#connStatus").parent().css("border-radius", "30px");
  fadeMenu = false;
  $('#menu').fadeIn();
 } else if ( wsRunning === true && wsGrace === true ) {
  $("#connStatus").parent().css("background-color", "#023020");
  $("#connStatus").css("color", "white");
  $("#connStatus").parent().css("border-radius", "30px");
  fadeMenu = false;
  $('#menu').fadeIn();
 } else if ( wsRunning === true && wsGrace === false && wsProblem === false ) {
  $("#connStatus").parent().css("background-color", "#228B22");
  $("#connStatus").css("color", "white");
  $("#connStatus").parent().css("border-radius", "30px");
  fadeMenu = true;
 } else if ( wsRunning === false && wsGrace === true && wsProblem === false ) {
  $("#connStatus").parent().css("background-color", "#5F9EA0");
  $("#connStatus").css("color", "white");
  $("#connStatus").parent().css("border-radius", "30px");
  fadeMenu = false;
 }
}, 1000);


// If empty - All sensors are shown
// If any names are in here only those will be shown!
var sensorSeen = []
var sensorAvailable = []
var sensorFilter = attackmapSettings.filter

// Redraw filter selection on load
if ( sensorFilter.length == 0 ) {
 $(".sensorAll").css("background-color", "green");
 $(".sensorAll").css("color", "white");
 $(".leaflet-marker-icon").show();
} else {
 $(".sensorAll").css("background-color", "inherit");
 $(".sensorAll").css("color", "inherit");
 $(".leaflet-marker-icon").hide();
 sensorFilter.forEach( sensorName => {
  $("#"+sensorName).css("background-color", "green");
  $("#"+sensorName).css("color", "white");
  $("."+sensorName).show();
 });
}

function toggleSensor(target) {
 if ( target == "all" ) {
  sensorFilter = []
  $(".sensorOption").css("background-color", "inherit");
  $(".sensorOption").css("color", "inherit");
  $(".sensorAll").css("background-color", "green");
  $(".sensorAll").css("color", "white");
  $(".leaflet-marker-icon").show();
 } else {
  const sensorName = $(target).attr("id");
  if ( sensorFilter.includes(sensorName) ) {
   $("#"+sensorName).css("background-color", "inherit");
   $("#"+sensorName).css("color", "inherit");
   const index = sensorFilter.indexOf(sensorName);
   const valueRemoved = sensorFilter.splice(index, 1);
   $(".leaflet-marker-icon").hide();
   sensorFilter.forEach( sensorName => {
    $("#"+sensorName).css("background-color", "green");
    $("#"+sensorName).css("color", "white");
    $("."+sensorName).show();
   });
  } else {
   $(".sensorAll").css("background-color", "inherit");
   $(".sensorAll").css("color", "inherit");
   $("#"+sensorName).css("background-color", "green");
   $("#"+sensorName).css("color", "white");
   sensorFilter.push(sensorName);
   $(".leaflet-marker-icon").hide();
   sensorFilter.forEach( sensorName => {
    $("#"+sensorName).css("background-color", "green");
    $("#"+sensorName).css("color", "white");
    $("."+sensorName).show();
   });
  }
  if ( sensorFilter.length == 0 ) {
   $(".sensorOption").css("background-color", "inherit");
   $(".sensorOption").css("color", "inherit");
   $(".sensorAll").css("background-color", "green");
   $(".sensorAll").css("color", "white");
   $(".leaflet-marker-icon").fadeIn();
  }
 }
}

// Used to toggle the menu on small screens when clicking on the menu button
function toggleFunction(nav) {
    var x = document.getElementById(nav);
    if (x.className.indexOf("w3-show") == -1) {
        x.className += " w3-show";
    } else {
        x.className = x.className.replace(" w3-show", "");
    }
}

function togglePause() {
    var x = document.getElementById("syspause");
    if (x.className.indexOf("fa-play") == -1) {
        x.className = x.className.replace(" fa-pause", " fa-play");
        closeWebsocket();
        wsGrace = true; // Hack to not let keepalive trigger pop!
    } else {
        x.className = x.className.replace(" fa-play", " fa-pause");
        openWebsocket();
    }
}

function toggleSound() {
    var x = document.getElementById("syssound");
    if (x.className.indexOf("fa-volume-off") > -1) {
        x.className = x.className.replace(" fa-volume-off", " fa-volume-up");
        $("#syssound").parent().css("background-color", "inherit");
        $("#syssound").css("color", "white");
	if ( audioLoaded ) {
	  snd.click1.play({interrupt: createjs.Sound.INTERRUPT_ANY, loop: 0, volume: 0.5});
          audioEffects = true;
        }
    } else {
        x.className = x.className.replace(" fa-volume-up", " fa-volume-off");
  	$("#syssound").parent().css("background-color", "inherit");
        $("#syssound").css("color", "inherit");
	if ( audioLoaded ) {
	  snd.click1.play({interrupt: createjs.Sound.INTERRUPT_ANY, loop: 0, volume: 0.5});
          audioEffects = false;
        }
    }
}

function toggleStats() {
  if ( $("#statsContainer").is(":visible") ) {
    $("#statsStatus").css("color", "inherit");
    $("#statsContainer").fadeOut();
  } else {
    $("#statsStatus").css("color", "white");
    $("#statsContainer").fadeIn();
  }
}

// UI show menu options when mouse move
// This should be fine :)
var delay = 0;

function delayCheck() {
 if ( fadeMenu ) {
  if ( delay == 5 ) {
   $('#menu').fadeOut();
   $('.leaflet-control-container').fadeOut();
   $('#header').fadeIn();
   document.body.style.cursor = 'none';
   delay = 0;
  }
  delay = delay+1;
 }
}

$(document).mousemove(function() {
 $('#header').hide();
 $('#menu').fadeIn();
 $('.leaflet-control-container').fadeIn();
 document.body.style.cursor = 'default';
 delay = 0;
 clearInterval(_delay);
 _delay = setInterval(delayCheck, 500);
});

$(document).mouseleave(function() {
    clearTimeout(_delay);
    $("#menu").fadeOut();
    $('.leaflet-control-container').fadeOut();
    $('#header').fadeIn();
    document.body.style.cursor = 'none';
});

// page loads starts delay timer
_delay = setInterval(delayCheck, 1000)

// What to do when we ready ?
// Well, fill in the markers etc
$( document ).ready(function() {
 buildMarkerMenu();
 toggleStats();
 loadAudio();
});
