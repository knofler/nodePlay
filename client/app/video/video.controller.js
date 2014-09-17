'use strict';

angular.module('nodeAppApp')
  .controller('VideoCtrl', function ($scope) {

  	//declare video stream variable
	$scope.stream;

  	//Capture Query Collectors on a variable
  	$scope.video 		  = document.querySelector("video");
	$scope.button         = document.querySelector("button");
	$scope.canvas         = document.querySelector("canvas");
  	$scope.snapshotButton = document.querySelector("button#snapshot");
	$scope.filterButton   = document.querySelector("button#filter");
	$scope.vgaButton 	  = document.querySelector("button#vga");
	$scope.qvgaButton 	  = document.querySelector("button#qvga");
	$scope.hdButton       = document.querySelector("button#hd");
	$scope.dimensions     = document.querySelector("p#dimensions");

	//Various Static Arrays for options
	$scope.constraints 	= {audio: false, video: true};
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
	
	//Set appropriate type of getUserMedia()
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

	// media call back and error handling
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
