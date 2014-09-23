'use strict';

angular.module('nodeAppApp')
  .controller('VideoCtrl', function ($scope) {

  	//declare video stream variable
	$scope.localStream;

  	//Capture Query Collectors on a variable
  	$scope.video 		  = document.querySelector("video");
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

	//Make video stream available to view	
	$scope.getMedia =function(constraints){
		if (!!$scope.stream) {
		   $scope.video.src = null;
		   $scope.stream.stop();
		  }
		  navigator.getUserMedia(constraints, $scope.successCallback, $scope.errorCallback);
	  };
 
  });
