window.addEventListener("DOMContentLoaded", function() {

  // Grab elements, create settings, etc.
  var downloadButton = document.getElementById("download-button");
  var snapSound = document.getElementById("snap-sound");
  var canvas = document.getElementById("canvas");
  var context = canvas.getContext("2d");
  var video = document.getElementById("video");
  var flashBulb = document.getElementById("flash-bulb");
  var videoObj = { "video": true };
  var effectFunction = null;
  var errBack = function(error) {
    console.log("Video capture error: ", error.code);
  };

  // Put video listeners into place
  if(navigator.getUserMedia) { // Standard
    navigator.getUserMedia(videoObj, function(stream) {
      video.src = stream;
      video.play();
    }, errBack);
  } else if(navigator.webkitGetUserMedia) { // WebKit-prefixed
    navigator.webkitGetUserMedia(videoObj, function(stream){
      video.src = window.webkitURL.createObjectURL(stream);
      video.play();
    }, errBack);
  }
  else if(navigator.mozGetUserMedia) { // Firefox-prefixed
    navigator.mozGetUserMedia(videoObj, function(stream){
      video.src = window.URL.createObjectURL(stream);
      video.play();
    }, errBack);
  }
  // sends video stream to processor to apply filters
  video.addEventListener("play", processFrame, false);


  // used with setTimeout to reset #flash-bulb
  function resetFlash() {
    flashBulb.className = "flash-ready";
  }

  // Trigger photo take
  document.getElementById("snap").addEventListener("click", function() {
    flashBulb.className = "flash-active";
    setTimeout(resetFlash, 400);
    snapSound.load();
    snapSound.play();
    context.drawImage(display, 0, 0, 640, 480);
  });



  var effectButtons = document.querySelectorAll("button.effect");
  for (var i = 0; i < effectButtons.length; i++) {
    effectButtons[i].onclick = setEffect;
  }

  function setEffect(e) {
    var id = e.target.getAttribute("id");
    if (id == "normal") {
      effectFunction = null;
    } else if (id == "western") {
      effectFunction = western;
    } else if (id == "noir") {
      effectFunction = noir;
    } else if (id == "scifi") {
      effectFunction = scifi;
    }
  }


  function processFrame(e) {
    var bufferCanvas = document.getElementById("buffer");
    var displayCanvas = document.getElementById("display");
    var buffer = bufferCanvas.getContext("2d");
    var display = displayCanvas.getContext("2d");

    buffer.drawImage(video, 0, 0, bufferCanvas.width, displayCanvas.height);
    var frame = buffer.getImageData(0, 0, bufferCanvas.width, displayCanvas.height);
    var length = frame.data.length / 4;

    for (var i = 0; i < length; i++) {
      var r = frame.data[i * 4 + 0];
      var g = frame.data[i * 4 + 1];
      var b = frame.data[i * 4 + 2];
      if (effectFunction) {
        effectFunction(i, r, g, b, frame.data);
      }
    }
    display.putImageData(frame, 0, 0);

    setTimeout(processFrame, 0);
  }

  // Video effect filters
  function noir(pos, r, g, b, data) {
    var brightness = (3*r + 4*g + b) >>> 3;
    if (brightness < 0) brightness = 0;
    data[pos * 4 + 0] = brightness;
    data[pos * 4 + 1] = brightness;
    data[pos * 4 + 2] = brightness;
  }

  function western(pos, r, g, b, data) {
    var brightness = (3*r + 4*g + b) >>> 3;
    data[pos * 4 + 0] = brightness+40;
    data[pos * 4 + 1] = brightness+20;
    data[pos * 4 + 2] = brightness-20;
    data[pos * 4 + 3] = 255; //220;
  }

  function scifi(pos, r, g, b, data) {
    var offset = pos * 4;
    data[offset] = Math.round(255 - r) ;
    data[offset+1] = Math.round(255 - g) ;
    data[offset+2] = Math.round(255 - b) ;
  }


  // Download captured photo
  downloadButton.addEventListener("click", function() {
    var dataURL = canvas.toDataURL("image/png");
    downloadButton.href = dataURL;
  });


}, false);
