var mapUpdate = true
var minZoom = calcZoom();

// We still show Attribution credits as we need
// however they are being "hidden" along the menu but
// shown once the mouse is moved again - Should be
// good enogth without spoiling the UI feel.
var base = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '<a href="https://www.openstreetmap.org/copyright">&copy OpenStreetMap</a> <a href="https://carto.com/attributions">&copy CARTO</a>',
        subdomains: 'abcd',
	detectRetina: true,
        maxZoom: 6,
        minZoom: 0,
        tileSize: 256,
});

// Default map, center is changed a bit for a slight
// better starting point in fullscreen and control
// disabled
var map = L.map('map', {
    layers: [base],
//    center: [29, 14],
    zoom: 0,
    zoomSnap: 0.1,
    zoomDelta: 0.1,
    trackResize: true,
    worldCopyJump: true,
    dragging: false,
    zoomControl: false,
    fullscreenControl: false,
})

// Make sure everything is disabled, we dont
// want anyone by mistake chaning the map!
map.touchZoom.disable();
map.doubleClickZoom.disable();
map.scrollWheelZoom.disable();
map.boxZoom.disable();
map.keyboard.disable();
$(".leaflet-control-zoom").css("visibility", "hidden");

// Try to use fitbounds for a better result ?
// Draw a test box to see what to fitbounds to
var bounds = [[67.74,140.45], [-53.44,-177.01]];
//L.rectangle(bounds, {color: "#ff7800", weight: 1}).addTo(map);
L.rectangle(bounds, {fill: false, weight: 0}).addTo(map);
map.fitBounds(bounds)


// Try to be versitile, visibility state not supported by Safari / iOS
// So even if visible, still only do it if in focus
function update() {
 if ( mapUpdate ) {
   //map.fitWorld();
   //minZoom = calcZoom();
   //map.zoom = minZoom;
   location.reload(true) // POP! Much easier!
 }
}

// I think this is way overkill as we dont really have the
// need for redraw. I only have this here so that if/when
// someone etc makes a setup on a monitor where they perhaps
// adjust or have windows side by side might need to resieze
// or if they pull up devtools it will refresh to make sure
// evetything looks perfect
//map.on("resize", update);
map.on("moveend", update);
//map.on("reset", update);

var svg = d3.select(map.getPanes().overlayPane).append("svg").attr("class", "traffic").attr("width", window.innerWidth).attr("height", window.innerHeight);

function calcZoom() {
 var maxScreenDimension = window.innerHeight > window.innerWidth ? window.innerHeight : window.innerWidth;
 var tileSize = 256;
 var maxTiles = Math.floor(maxScreenDimension / tileSize);
 minZoom = Math.ceil(Math.log(maxTiles) / Math.log(2));
 minZoom = minZoom <= 1 ? 1 : minZoom;
 return minZoom;
}

function calcMidpoint(x1, y1, x2, y2, bend) {
    if(y2<y1 && x2<x1) {
        var tmpy = y2;
        var tmpx = x2;
        x2 = x1;
        y2 = y1;
        x1 = tmpx;
        y1 = tmpy;
    }
    else if(y2<y1) {
        y1 = y2 + (y2=y1, 0);
    }
    else if(x2<x1) {
        x1 = x2 + (x2=x1, 0);
    }

    var radian = Math.atan(-((y2-y1)/(x2-x1)));
    var r = Math.sqrt(x2-x1) + Math.sqrt(y2-y1);
    var m1 = (x1+x2)/2;
    var m2 = (y1+y2)/2;

    var min = 1.5, max = 5;
    var arcIntensity = parseFloat((Math.random() * (max - min) + min).toFixed(2));

    if (bend === true) {
        var a = Math.floor(m1 - r * arcIntensity * Math.sin(radian));
        var b = Math.floor(m2 - r * arcIntensity * Math.cos(radian));
    } else {
        var a = Math.floor(m1 + r * arcIntensity * Math.sin(radian));
        var b = Math.floor(m2 + r * arcIntensity * Math.cos(radian));
    }

    return {"x":a, "y":b};
}


function translateAlong(path) {
    var l = path.getTotalLength();
    return function(i) {
        return function(t) {
            // Put in try/catch because sometimes floating point is stupid..
            try {
            var p = path.getPointAtLength(t*l);
            return "translate(" + p.x + "," + p.y + ")";
            } catch(err){
            console.log("Caught exception.");
            return "ERROR";
            }
        }
    }
}

function handleParticle(color, srcPoint) {
    var i = 0;
    var x = srcPoint['x'];
    var y = srcPoint['y'];

    svg.append('circle')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', 0)
        .style('fill', 'none')
        .style('stroke', color)
        .style('stroke-opacity', 1)
        .style('stroke-width', 3)
        .transition()
        .duration(700)
        .ease(d3.easeCircleIn)
        // Circle radius source animation
        .attr('r', 80)
        .style('stroke-opacity', 0)
        .remove();
}

function handleTraffic(color, srcPoint, hqPoint) {
    var fromX = srcPoint['x'];
    var fromY = srcPoint['y'];
    var toX = hqPoint['x'];
    var toY = hqPoint['y'];
    var bendArray = [true, false];
    var bend = bendArray[Math.floor(Math.random() * bendArray.length)];

    if ( audioLoaded && audioEffects ) {
     const randomBlaster = Math.floor(Math.random() * blasterEffects.length);
     const blaster = blasterEffects[randomBlaster];
     snd[blaster].play({interrupt: createjs.Sound.INTERRUPT_ANY, loop: 0, volume: 0.2})
    }

    var lineData = [srcPoint, calcMidpoint(fromX, fromY, toX, toY, bend), hqPoint]
    var lineFunction = d3.line()
        .curve(d3.curveBasis)
        .x(function(d) {return d.x;})
        .y(function(d) {return d.y;});

    var lineGraph = svg.append('path')
            .attr('d', lineFunction(lineData))
            .attr('opacity', 0.8)
            .attr('stroke', color)
            .attr('stroke-width', 2)
            .attr('fill', 'none');

    var circleRadius = 6

    // Circle follows the line
    var dot = svg.append('circle')
        .attr('r', circleRadius)
        .attr('fill', color)
        .transition()
        .duration(700)
        .ease(d3.easeCircleIn)
        .attrTween('transform', translateAlong(lineGraph.node()))
        .on('end', function() {
            d3.select(this)
                .attr('fill', 'none')
                .attr('stroke', color)
                .attr('stroke-width', 3)
                .transition()
                .duration(700)
                .ease(d3.easeCircleIn)
                // Circle radius destination animation
                .attr('r', 50)
                .style('stroke-opacity', 0)
                .remove();
    });

    var length = lineGraph.node().getTotalLength();
    lineGraph.attr('stroke-dasharray', length + ' ' + length)
        .attr('stroke-dashoffset', length)
        .transition()
        .duration(700)
        .ease(d3.easeCircleIn)
        .attr('stroke-dashoffset', 0)
        .on('end', function() {
            d3.select(this)
                .transition()
                .duration(350)
                .style('opacity', 0)
                .remove();
    });
}

var circles = new L.LayerGroup();
map.addLayer(circles);
var markers = new L.LayerGroup();
map.addLayer(markers);

var circlesObject = {};

function addCircle(country, iso_code, src_ip, ip_rep, color, srcLatLng) {
    circleCount = circles.getLayers().length;
    circleArray = circles.getLayers();

    if ( audioLoaded && audioEffects ) {
     const randomBurst = Math.floor(Math.random() * burstEffects.length);
     const burst = burstEffects[randomBurst];
     snd[burst].play({interrupt: createjs.Sound.INTERRUPT_ANY, loop: 0, volume: 0.1})
    }

    // Only allow 5000 circles to be on the map at a time
    if (circleCount >= 2000) {
        circles.removeLayer(circleArray[0]);
        circlesObject = {};
    }

    var key = srcLatLng.lat + "," + srcLatLng.lng;
    // Only draw circle if its coordinates are not already present in circlesObject
    if (!circlesObject[key]) {
        circlesObject[key] = L.circle(srcLatLng, 50000, {
            color: color,
            fillColor: color,
            fillOpacity: 0.2
        }).addTo(circles);
    }
}

var markersObject = {};
function addMarker(dst_country_name, dst_iso_code, dst_ip, tpot_hostname, dstLatLng) {
    markerCount = markers.getLayers().length;
    markerArray = markers.getLayers();

    // Only allow 50 markers to be on the map at a time
    if (markerCount >= 10) {
        markers.removeLayer(markerArray[0]);
        markersObject = {};
    }

    var key = dstLatLng.lat + "," + dstLatLng.lng;
    // Only draw marker if its coordinates are not already present in markersObject
    if (!markersObject[key]) {
        if ( audioLoaded && audioEffects ) snd.sonar1.play({interrupt: createjs.Sound.INTERRUPT_NONE, loop: 0, volume: 0.5});
        markersObject[key] = L.marker(dstLatLng, {
            icon: L.icon({
                // svg color #E20074
                iconUrl: '/images/marker-honey6.svg',
                iconSize: [48, 48],
                iconAnchor: [24, 20],
                className: tpot_hostname
            }),
        }).addTo(markers);
    }
}

