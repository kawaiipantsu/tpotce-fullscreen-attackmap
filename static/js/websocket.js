var ws = null;
var wsRunning = false;
var wsProblem = false;
var wsGrace = true;
var wsTicks = 0;
var wsLastSeen = 0;
var saveDataUsage = false;



function openWebsocket() { 
    // Check if the user have remembered to set the websocket FQDN :)
    if (typeof wssWebSocket == 'undefined') {
        alert("I'm sorry, but you really need to follow the installation instructions :)")
        return;
    }

  if ("WebSocket" in window) {
   try {
    ws = new WebSocket(wssWebSocket);
    wsRunning = true;
    wsGrace = true;
    wsTicks = 6;
    trafficEvents=0;
   }
   catch (err) {
     wsRunning = false;
     wsProblem = true;
   }

  ws.onclose = function (event) {
     var reason = "Unknown error reason?";
     if (event.code == 1000)     reason = "Endpoint terminating connection; Normal closure";
     else if(event.code == 1001) reason = "Endpoint terminating connection; Endpoint is \"going away\"";
     else if(event.code == 1002) reason = "Endpoint terminating connection; Protocol error";
     else if(event.code == 1003) reason = "Endpoint terminating connection; Unkonwn data";
     else if(event.code == 1004) reason = "Endpoint terminating connection; Reserved";
     else if(event.code == 1005) reason = "Endpoint terminating connection; No status code";
     else if(event.code == 1006) reason = "Endpoint terminating connection; Connection closed abnormally";
     else if(event.code == 1007) reason = "Endpoint terminating connection; Message was not consistent with the type of the message";
     else if(event.code == 1008) reason = "Endpoint terminating connection; Message \"violates policy\"";
     else if(event.code == 1009) reason = "Endpoint terminating connection; Message is too big";
     else if(event.code == 1010) reason = "Endpoint terminating connection; Client failed to negotiate ("+event.reason+")";
     else if(event.code == 1011) reason = "Endpoint terminating connection; Server encountered an unexpected condition";
     else if(event.code == 1015) reason = "Endpoint terminating connection; Connection closed due TLS handshake failure";
     else reason = "Endpoint terminating connection; Unknown reason";
     console.log(reason);
     wsRunning = false;
     wsProblem = true;
  };

  ws.onerror = function (error) {
    wsRunning = false;
    wsProblem = true;
    wsGrace = false;
  };

   ws.onmessage = (event) => {
    wsProblem = false;
    const data = JSON.parse(event.data);
    let handler = messageHandlers[data.type];
    if ( handler ) handler(data);
    else {
     // Unkown handlers, lets show them
     console.log("Unkown handler: "+data.type);
    }
   };
  }
}

function closeWebsocket() {
 if ("WebSocket" in window && ws && wsRunning) {
  wsRunning = false;
  ws.close();
 }
 if (!ws && wsRunning ) wsRunning = false;
}

// Start the websocket once the text and image assets are loaded!
$( window ).on( "load", function() {
 if ( !wsRunning ) openWebsocket();
});

// We have to types of Idle / Visibility things we can catch
// 1) Window minimized / Changing to other Tab in browser / Not visible on screen
// 2) Loses focus but is still visable on screen
//
// Let's do some resource optimization! We will stop the websocket in case
// of Option 1. But we will not do anyting in case of Option 2.
//
// This means that you can ie. have the browser window running on other monitor
// while working on something else and it will continue to run. But as soon as
// the window is blocked or minimized we close the socket to minimize data usage.
/*
$(window).focus(function() { if ( !wsRunning ) saveDataUsage = false; openWebsocket(); })
$(window).blur(function()  { if ( wsRunning ) saveDataUsage = true; closeWebsocket(); })
*/
document.addEventListener("visibilitychange", () => {
 if (document.visibilityState === "visible") { if ( !wsRunning ) { saveDataUsage = false; openWebsocket(); mapUpdate = true; } }
 else { if ( wsRunning ) { mapUpdate = false; saveDataUsage = true; closeWebsocket(); } }
});

// Keepalive / Ping / Pong / This simple timer will fire
// on connection problems to the websocket server i have
// implemented an ugly grace period to get around things
var wsTimer = setInterval(function() {
 if ( wsTicks < 1 && wsRunning  && !wsGrace ) {
  if ( wsRunning ) {
   wsProblem = true;
   wsGrace = false;
   trafficEvents = 0;
   closeWebsocket();
  }
 } else {
  if ( !wsGrace ) {
   if ( !wsRunning && wsProblem ) {
    if ( saveDataUsage === false ) openWebsocket();
   }
  }
 }
 wsTicks = 0;
}, 6000);

var trafficEvents = 0;
var trafficEventsLast = 0;
var trafficPerSec = 0;

function updateTrafficTrigger() {
 trafficEvents++;
 $("#counter1").html(trafficEvents)
}

function updateTrafficPerSecond() {
 const tBefore = trafficEventsLast
 const tNow = trafficEvents
 const tDiff = trafficEvents-trafficEventsLast
 const tPerSec = (Math.round( (tDiff/30) * 10 ) / 10).toFixed(1); // Simple round to 1 decimal
 $("#counter2").html(tPerSec+"/sec")
 trafficEventsLast = tNow
}

function prependAttackRow(id, args) {
    var div = document.createElement('div');
    div.setAttribute("class", "attackList");
    const count = args.length;
    var subdiv = []
    for (var i = 0; i < count; i++) {
     subdiv[i] = document.createElement('div');
     if ( i == 2) { // Flag name
      var flag = args[i].toLowerCase();
      subdiv[i].setAttribute("id", "attackItem-"+i);
      subdiv[i].setAttribute("class", "attackFlag attackItem attackItem-"+i+" fib fi-"+flag);
     } else {
      var textNode = document.createTextNode(args[i]);
      subdiv[i].setAttribute("id", "attackItem-"+i);
      subdiv[i].setAttribute("class", "attackItem attackItem-"+i);
      subdiv[i].appendChild(textNode);
     }
     div.appendChild(subdiv[i]);
    }
    var numItems = $('#'+id).children('div').length;
    if ( numItems >= 12 ) {
     $("#"+id).children("div:last").remove();
    }
    $("#"+id).prepend(div);
}

function top10ip(id, countList, codeDict) {
    $("#"+id).empty();
    var top10div = document.getElementById(id);
    var items = Object.keys(countList[0]).map(function(key) {
        return [key, countList[0][key]];
    });
    items.sort(function(first, second) {
        return second[1] - first[1];
    });
    var sortedItems = items.slice(0, 10);
    var itemsLength = sortedItems.length;
    for (var i = 0; i < itemsLength; i++) {
        var div = document.createElement('div');
        div.setAttribute("class", "topIPitem");

        var ip = sortedItems[i][0];
        var count = sortedItems[i][1];

        var countDiv = document.createElement('div');
        countDiv.setAttribute("class", "ipCount");
        var countNum = document.createTextNode(count);
        countDiv.appendChild(countNum)

        var flagDiv = document.createElement('div');
        var flag = codeDict[ip].toLowerCase();
        flagDiv.setAttribute("id", "top10ip-"+i);
        flagDiv.setAttribute("class", "flag fib fi-"+flag);

        var ipDiv = document.createElement('div');
        ipDiv.setAttribute("class", "ipAddr");
        var ipNum = document.createTextNode(ip);
        ipDiv.appendChild(ipNum)

        div.appendChild(countDiv);
        div.appendChild(flagDiv);
        div.appendChild(ipDiv);

        top10div.appendChild(div);
    }
}

function top10iso(id, countList, codeDict) {
    $("#"+id).empty();
    var top10div = document.getElementById(id);
    var items = Object.keys(countList[0]).map(function(key) {
        return [key, countList[0][key]];
    });
    items.sort(function(first, second) {
        return second[1] - first[1];
    });
    var sortedItems = items.slice(0, 10);
    var itemsLength = sortedItems.length;
    for (var i = 0; i < itemsLength; i++) {
        var div = document.createElement('div');
        div.setAttribute("class", "topISOitem");

        var iso = sortedItems[i][0];
        var count = sortedItems[i][1];

        var countDiv = document.createElement('div');
        countDiv.setAttribute("class", "isoCount");
        var countNum = document.createTextNode(count);
        countDiv.appendChild(countNum)

        var flagDiv = document.createElement('div');
        var flag = codeDict[iso].toLowerCase();
        flagDiv.setAttribute("id", "top10iso-"+i);
        flagDiv.setAttribute("class", "flag fib fi-"+flag);

        var isoDiv = document.createElement('div');
        isoDiv.setAttribute("class", "isoName");
        var isoNum = document.createTextNode(iso);
        isoDiv.appendChild(isoNum)

        div.appendChild(countDiv);
        div.appendChild(flagDiv);
        div.appendChild(isoDiv);

        top10div.appendChild(div);
    }
}

function handleLegend(msg) {
    var ipCountList = [msg.ips_tracked,
               msg.iso_code];
    var countryCountList = [msg.countries_tracked,
                msg.iso_code];
    var attackList = [msg.event_time,
              msg.src_ip,
              msg.iso_code,
              msg.country,
              msg.honeypot,
              knownPorts.lookFor(msg.protocol)];
    top10ip('statsTopIP', ipCountList, msg.ip_to_code);
    top10iso('statsTopISO', countryCountList, msg.country_to_code);
    prependAttackRow('attackLog', attackList);
}

function handleStats(msg) {
    const last = ["last_1m", "last_1h", "last_24h"]
    last.forEach(function(i) {
        document.getElementById(i).innerHTML = msg[i];
    });
};

const messageHandlers = {
    Traffic: (msg) => {
         const sensorName = msg.tpot_hostname
         if ( !sensorSeen.includes(sensorName) && !sensorAvailable.includes(sensorName) ) sensorAvailable.push(sensorName)
         if ( sensorFilter.length == 0 || sensorFilter.includes(sensorName) ) {
         var srcLatLng = new L.LatLng(msg.src_lat, msg.src_long);
         var dstLatLng = new L.LatLng(msg.dst_lat, msg.dst_long);
         var dstPoint = map.latLngToLayerPoint(dstLatLng);
         var srcPoint = map.latLngToLayerPoint(srcLatLng);
         updateTrafficTrigger();
         Promise.all([
            addCircle(msg.country, msg.iso_code, msg.src_ip, msg.ip_rep, knownPorts.whatColor(msg.color), srcLatLng),
            addMarker(msg.dst_country_name, msg.dst_iso_code, msg.dst_ip, msg.tpot_hostname, dstLatLng),
            handleLegend(msg),
            handleParticle(knownPorts.whatColor(msg.color), srcPoint),
            handleTraffic(knownPorts.whatColor(msg.color), srcPoint, dstPoint, srcLatLng)
         ]).then(() => {
            // All operations have completed
         });
       }
    },
    Stats: (msg) => {
        handleStats(msg);
    },
    Time: (msg) => {
        console.log("ws-msg type("+msg.type+"): "+msg.time);
 	$("#hiveTime").html(msg.time)
 	$("#hiveSensors").html(sensorSeen.length+" sensors active")
        updateTrafficPerSecond();
    },
    Keepalive: (msg) => {
        wsLastSeen = msg.keepalive
        wsTicks++;
        if ( wsGrace ) wsGrace = false;
    },
};
