// This really is a novelty thing and i dont recommend using it.
// I think this can lead to really heavy load and/or confusion
// or chopping of the browser animations.

// BUT HEY! - It's actually fun to look at and listen to :D

var audioEffects = false;
var audioLoaded = false;
var snd = {};
var audioPath = "/audio/";
var audioFilesLoaded = 0
var sounds = [
 {id:"beep1", src:"beep1.ogg"},
 {id:"beep2", src:"beep2.ogg"},
 {id:"blaster1", src:"blaster1.ogg"},
 {id:"blaster2", src:"blaster2.ogg"},
 {id:"blaster3", src:"blaster3.ogg"},
 {id:"blaster4", src:"blaster4.ogg"},
 {id:"click1", src:"click1.ogg"},
 {id:"sonar1", src:"sonar1.ogg"},
];
var soundSprites = [
 {src:"bubblesburst-sprite.ogg", data: {
   audioSprite: [
     {id:"burst1", startTime:187,  duration:230  },
     {id:"burst2", startTime:2840, duration:2883 },
     {id:"burst3", startTime:4330, duration:4369 },
     {id:"burst4", startTime:5728, duration:5796 },
     {id:"burst5", startTime:7033, duration:7078 },
     {id:"burst6", startTime:8298, duration:8344 },
   ]}
 }
];

var blasterEffects = [
 'blaster1',
 'blaster2',
 'blaster3',
 'blaster4',
]

var burstEffects = [
 'burst1',
// 'burst2',
// 'burst3',
// 'burst4',
// 'burst5',
// 'burst6',
]

var beepEffects = [
 'beep1',
 'beeo2',
]

function loadAudio() {
    if (!createjs.Sound.initializeDefaultPlugins()) {return;}
    createjs.Sound.alternateExtensions = ["mp3"];
    createjs.Sound.addEventListener("fileload", handleLoad);
    createjs.Sound.addEventListener("complete", handleComplete);
    createjs.Sound.registerSounds(sounds, audioPath, 100);
    createjs.Sound.registerSounds(soundSprites, audioPath, 4);
}

function handleLoad(event) {
    if ( event.src == "/audio/bubblesburst-sprite.ogg" ) {
     //console.log("Load audio sprite: "+event.src);
     event.data.audioSprite.forEach((element) => {
      //console.log(" - Sprite: "+element.id);
      var sound = element.id
      snd[sound] = createjs.Sound.createInstance(element.id);
     })
    } else {
     //console.log("Load audio file: "+event.src+" (ID: "+event.id+")");
     var sound = event.id
     snd[sound] = createjs.Sound.createInstance(event.id);
    }
   audioFilesLoaded++;
   if ( audioFilesLoaded >= 9 ) handleComplete();
}

function handleComplete() {
    audioLoaded = true;
}
