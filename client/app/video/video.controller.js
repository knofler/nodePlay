'use strict';

angular.module('nodeAppApp')
  .controller('VideoCtrl', function ($scope) {

  	//declare video stream variable
	$scope.stream;
	$scope.localStream;
	//Volume control
	$scope.reporter;
  	$scope.audioContext;
  	//instantiate class variable
  	$scope.soundMeter;

  	//Capture Query Collectors on a variable
  	$scope.video 		  = document.querySelector("video");
  	$scope.audio 		  = document.querySelector("audio");
  	//targeting canvas and display areas
  	$scope.canvas         = document.querySelector("canvas");
  	$scope.dimensions     = document.querySelector("p#dimensions");
  	// General control buttons
	$scope.button         = document.querySelector("button");
	$scope.startButton 	  = document.querySelector("button#start");
	$scope.stopButton 	  = document.querySelector("button#stop");
	//Specific purpose buttons
  	$scope.snapshotButton = document.querySelector("button#snapshot");
	$scope.filterButton   = document.querySelector("button#filter");
	//Resolution buttons
	$scope.vgaButton 	  = document.querySelector("button#vga");
	$scope.qvgaButton 	  = document.querySelector("button#qvga");
	$scope.hdButton       = document.querySelector("button#hd");
	//Media Selections
	$scope.audioSelect 	  = document.querySelector("select#audioSource");
	$scope.videoSelect 	  = document.querySelector("select#videoSource");
	
	//Media sources
	$scope.audioSource = $scope.audioSelect.value;
	$scope.videoSource = $scope.videoSelect.value;

	//Various Static Arrays for Constraints and options
	$scope.constraints 	= {
	    audio: {
	      optional: [{sourceId: $scope.audioSource}]
	    },
	    video: {
	      optional: [{sourceId: $scope.videoSource}]
	    }
	  };
	$scope.audioConstraints = {audio:true,video:false};  
	$scope.filters 		= ['blur', 'grayscale', 'invert', 'sepia'];

	//Video quality control constraints array
	$scope.qvgaConstraints  = {
	  video: {
	    mandatory: {
	      maxWidth: 320,
	      maxHeight: 180
	    }
	  }
		};
	$scope.vgaConstraints  = {
	  video: {
	    mandatory: {
	      maxWidth: 640,
	      maxHeight: 360
	    }
	  }
	 };
	$scope.hdConstraints  = {
	  video: {
	    mandatory: {
	      minWidth: 1280,
	      minHeight: 720
	    }
	  }
	 };

	//canvas diameter
	$scope.canvas.width  = 480;
	$scope.canvas.height = 360;

	//SoundMeter Class Definition

	// Meter class that generates a number correlated to audio volume.
    // The meter class itself displays nothing, but it makes the
    // instantaneous and time-decaying volumes available for inspection.
    // It also reports on the fraction of samples that were at or near
    // the top of the measurement range.
  	$scope.SoundMeter = function(context) {
	    this.context = context
	    this.volume = 0.0;
	    this.slow_volume = 0.0;
	    this.clip = 0.0;
	    this.script = context.createScriptProcessor(2048, 1, 1);
	    var that = this;
	    this.script.onaudioprocess = function(event) {
	      var input = event.inputBuffer.getChannelData(0);
	      var i;
	      var sum = 0.0;
	      var clipcount = 0;
	      for (i = 0; i < input.length; ++i) {
	        sum += input[i] * input[i];
	        if (Math.abs(input[i]) > 0.99) {
	          clipcount += 1
	        }
	      }
	      that.volume = Math.sqrt(sum / input.length);
	      that.slow_volume = 0.95 * that.slow_volume + 0.05 * that.volume;
	      that.clip = clipcount / input.length;
	    }
     };
	$scope.SoundMeter.prototype.connectToSource = function(stream) {
     	console.log('SoundMeter connecting');
    	this.mic = this.context.createMediaStreamSource(stream);
    	this.mic.connect(this.script);
	    // Necessary to make sample run, but should not be.
	    this.script.connect(this.context.destination);
	  };
	$scope.SoundMeter.prototype.stop = function() {
	    this.mic.disconnect();
	    this.script.disconnect();
	  }; 

	//Collect media sources and store into arrays
	$scope.gotSources = function(sourceInfos) {
	  for (var i = 0; i != sourceInfos.length; ++i) {
	    var sourceInfo = sourceInfos[i];
	    var option = document.createElement("option");
	    option.value = sourceInfo.id;
	    if (sourceInfo.kind === 'audio') {
	      option.text = sourceInfo.label || 'microphone ' + ($scope.audioSelect.length + 1);
	      $scope.audioSelect.appendChild(option);
	    } else if (sourceInfo.kind === 'video') {
	      option.text = sourceInfo.label || 'camera ' + ($scope.videoSelect.length + 1);
	      $scope.videoSelect.appendChild(option);
	    } else {
	      console.log('Some other kind of source: ', sourceInfo);
	    }
	  }
	 };

	//browser compatibility for MediaStreaTrack  
	if (typeof MediaStreamTrack === 'undefined'){
	  alert('This browser does not support MediaStreamTrack.\n\nTry Chrome Canary.');
	 } else {
	  MediaStreamTrack.getSources($scope.gotSources);
	 };

	//Start and Stop Media on user selection of media inputs
	$scope.start = function (){
	  if (!!window.stream) {
	    $scope.video.src = null;
	    window.stream.stop();
	  }
	  navigator.getUserMedia($scope.constraints,$scope.successCallback,$scope.errorCallback);
	   $scope.startButton.disabled = true;
       $scope.stopButton.disabled = false;
	 };
	$scope.stop = function (){
	   $scope.startButton.enabled = true;
       $scope.stopButton.enabled = false;
	   window.stream.stop();
	 }; 

	//Local audio media start and stop control
	$scope.audioStart = function (){
	  navigator.getUserMedia($scope.audioConstraints,$scope.gotAudioStream,$scope.audioStreamFailed);
	   $scope.startButton.disabled = true;
       $scope.stopButton.disabled = false;
	 }; 
	$scope.audioStop = function (){
	   $scope.startButton.enabled = true;
       $scope.stopButton.enabled = false;
	   $scope.localStream.stop();
	   clearInterval($scope.reporter);
       $scope.soundMeter.stop();
	 }; 

	//Video Dimenssion controller
	$scope.displayVideoDimensions = function () {
  		$scope.dimensions.innerHTML = "Actual video dimensions: " + $scope.video.videoWidth +
    	"x" + $scope.video.videoHeight + 'px.';
		};
	$scope.video.addEventListener('play', function(){
	  setTimeout(function(){
	    $scope.displayVideoDimensions();
	  }, 500);
	 });

	//onLoad Event
	$scope.onload = function() {
	 try {
	      window.AudioContext = window.AudioContext || window.webkitAudioContext;
	      $scope.audioContext = new AudioContext();
	    } catch(e) {
	      alert('Web Audio API not found');
	    }
	 };   
	//Video event controllers
	$scope.snapshotButton.onclick = function snap(){
	  $scope.canvas.getContext("2d").drawImage($scope.video, 0, 0, $scope.canvas.width, $scope.canvas.height);
	 };
	$scope.filterButton.onclick = function(){
	  var newIndex = ($scope.filters.indexOf($scope.canvas.className) + 1) % $scope.filters.length;
	  // console.log("$scope.canvas.className is " + $scope.canvas.className);
	  $scope.canvas.className = $scope.filters[newIndex];
	 };
	$scope.button.onclick = function(){
	  $scope.canvas.getContext("2d").drawImage($scope.video, 0, 0, $scope.canvas.width, $scope.canvas.height);
		};

	//Video quality event controller
	$scope.qvgaButton.onclick = function(){$scope.getMedia($scope.qvgaConstraints)};
	$scope.vgaButton.onclick = function(){$scope.getMedia($scope.vgaConstraints)};
	$scope.hdButton.onclick = function(){$scope.getMedia($scope.hdConstraints)};		

	//User media Selection event controller
	$scope.audioSelect.onchange = $scope.start;
	$scope.videoSelect.onchange = $scope.start;
	
	//Set appropriate type of getUserMedia()
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

	// Video Stream Call back and error handling
	$scope.successCallback = function (stream){
	  window.stream = stream; // stream available to console
	  if (window.URL) {
	    $scope.video.src = window.URL.createObjectURL(stream);
	  } else {
	    $scope.video.src = stream;
	  }
		};
	$scope.errorCallback = function (error){
	  console.log("navigator.getUserMedia error: ", error);
		};

	//Audio Stream call back and error handling	
	$scope.gotAudioStream =function(stream) {
	   var videoTracks = stream.getVideoTracks();
	   var audioTracks = stream.getAudioTracks();
	    if (audioTracks.length == 1 && videoTracks.length == 0) {
	      console.log('gotStream({audio:true, video:false})');
	      console.log('Using audio device: ' + audioTracks[0].label);
	      attachMediaStream($scope.audio, stream);
	      stream.onended = function() {
	        console.log('stream.onended');
	        $scope.startButton.disabled = false;
	        $scope.stopButton.disabled = true;
	      };
	      $scope.localStream = stream;

	    //instantiate SoundMeter Class
		$scope.soundMeter = new $scope.SoundMeter($scope.audioContext);    
	      
	    //execute connectToSource method from SoundMeter Object
      	$scope.soundMeter.connectToSource(stream);
	    
	    // Set up reporting of the volume every 0.2 seconds.
	    //Volume meter display
		var meter 		  	= $('volume'),
			decaying_meter 	= $('decaying_volume'),
	    	meter_canvas   	= document.querySelector("canvas#graphic_volume").getContext('2d'),
			meter_slow 	  	= document.querySelector("canvas#graphic_slow").getContext('2d'),
			meter_clip 	  	= document.querySelector("canvas#graphic_clip").getContext('2d');

	    $scope.reporter = setInterval(function() {
          meter.textContent 	= $scope.soundMeter.volume.toFixed(2);
          decaying_meter.textContent = $scope.soundMeter.slow_volume.toFixed(2);
          $scope.paintMeter(meter_canvas, $scope.soundMeter.volume);
          $scope.paintMeter(meter_slow, $scope.soundMeter.slow_volume);
          $scope.paintMeter(meter_clip, $scope.soundMeter.clip);
	     }, 200);

	    } else {
	      alert('The media stream contains an invalid number of tracks:'
	         + audioTracks.length + ' audio ' + videoTracks.length + ' video');
	      stream.stop();
    	}
  	 };
	$scope.audioStreamFailed =function(error) {
	    $scope.startButton.disabled = false;
	    $scope.stopButton.disabled = true;
	    alert('Failed to get access to local media. Error code: ' + error.code);
 	 }; 	  

	$scope.paintMeter = function(context, number) {
     context.clearRect(0, 0, 400, 20);
     context.fillStyle = 'red';
     context.fillRect(0, 0, number * 400, 20);
  	 };  

	//Make video stream available to view	
	$scope.getMedia =function(constraints){
		if (!!$scope.stream) {
		   $scope.video.src = null;
		   $scope.stream.stop();
		  }
		  navigator.getUserMedia(constraints, $scope.successCallback, $scope.errorCallback);
	  };

	//Auto invoke MediaStream on Page Load
	// $scope.start();  
  });
